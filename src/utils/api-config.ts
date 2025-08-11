/**
 * API 配置和通用请求方法
 * 基于新的统一 HttpClient 重构
 */
import { kubernetesRequest } from './http-client'
import { useClusterStore } from "@/store/modules/clusterStore"

// ============================== API 基础配置 ==============================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_BASE_API || 'http://127.0.0.1:8080',
  TIMEOUT: 10000,
  KUBERNETES_TIMEOUT: 15000
}

// ============================== 集群上下文工具 ==============================

/**
 * 获取当前选中的集群ID
 */
export function getCurrentClusterId(): string | null {
  const clusterStore = useClusterStore()
  return clusterStore.selectedClusterId || null
}

/**
 * 获取当前选中的集群名称（向后兼容）
 */
export function getCurrentClusterName(): string | null {
  const clusterStore = useClusterStore()
  return clusterStore.selectedClusterName || null
}

// ============================== Kubernetes API 类型定义 ==============================

/**
 * 标准化Kubernetes API响应
 */
export interface KubernetesApiResponse<T = any> {
  code: number
  data: T
  message: string
}

/**
 * Kubernetes 资源元数据
 */
export interface KubernetesMetadata {
  name: string
  uid?: string
  namespace?: string
  creationTimestamp?: string
  labels?: { [key: string]: string }
  annotations?: { [key: string]: string }
}

/**
 * Kubernetes 资源列表响应
 */
export interface KubernetesResourceList<T = any> {
  apiVersion: string
  kind: string
  metadata: {
    resourceVersion: string
    continue?: string
  }
  items: T[]
}

/**
 * 标准化的命名空间列表响应
 */
export interface NamespaceListResponse {
  code: number
  data: {
    items: Array<{
      metadata: KubernetesMetadata
    }>
  }
  message: string
}

// ============================== Kubernetes API 请求方法 ==============================

/**
 * 通用的Kubernetes资源API请求方法
 * 使用新的统一 HttpClient
 */
export async function kubernetesApiRequest<T>(config: {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: any
  params?: any
  headers?: any
}): Promise<T> {
  return kubernetesRequest<T>(config)
}

/**
 * 获取命名空间列表的通用方法
 */
export async function fetchNamespaces(): Promise<string[]> {
  try {
    const response = await kubernetesApiRequest<NamespaceListResponse>({
      url: '/api/v1/namespaces',
      method: 'GET'
    })

    if (response.code === 200 && response.data?.items) {
      return response.data.items
        .map(ns => ns.metadata.name)
        .filter(name => name) // 过滤掉空名称
        .sort()
    } else {
      throw new Error(response.message || '获取命名空间失败')
    }
  } catch (error: any) {
    console.error('获取命名空间失败:', error)
    throw new Error(error.message || '网络请求失败')
  }
}

/**
 * 获取指定命名空间的资源列表
 */
export async function fetchNamespacedResources<T>(
  resourceType: string, 
  namespace?: string,
  params?: Record<string, any>
): Promise<KubernetesResourceList<T>> {
  const url = namespace 
    ? `/api/v1/namespaces/${namespace}/${resourceType}`
    : `/api/v1/${resourceType}`
    
  return kubernetesApiRequest<KubernetesResourceList<T>>({
    url,
    method: 'GET',
    params
  })
}

/**
 * 获取集群级别的资源列表
 */
export async function fetchClusterResources<T>(
  resourceType: string,
  apiVersion: string = 'v1',
  group?: string,
  params?: Record<string, any>
): Promise<KubernetesResourceList<T>> {
  const baseUrl = group ? `/apis/${group}/${apiVersion}` : `/api/${apiVersion}`
  const url = `${baseUrl}/${resourceType}`
    
  return kubernetesApiRequest<KubernetesResourceList<T>>({
    url,
    method: 'GET',
    params
  })
}

/**
 * 创建或更新 Kubernetes 资源
 */
export async function createOrUpdateResource<T>(
  resourceType: string,
  resource: T,
  namespace?: string,
  method: 'POST' | 'PUT' | 'PATCH' = 'POST'
): Promise<T> {
  const url = namespace 
    ? `/api/v1/namespaces/${namespace}/${resourceType}`
    : `/api/v1/${resourceType}`
    
  return kubernetesApiRequest<T>({
    url,
    method,
    data: resource
  })
}

/**
 * 删除 Kubernetes 资源
 */
export async function deleteResource(
  resourceType: string,
  name: string,
  namespace?: string
): Promise<any> {
  const url = namespace 
    ? `/api/v1/namespaces/${namespace}/${resourceType}/${name}`
    : `/api/v1/${resourceType}/${name}`
    
  return kubernetesApiRequest({
    url,
    method: 'DELETE'
  })
}

// ============================== 常用资源快捷方法 ==============================

/**
 * 获取 Pod 列表
 */
export const fetchPods = (namespace?: string, params?: Record<string, any>) =>
  fetchNamespacedResources('pods', namespace, params)

/**
 * 获取 Service 列表
 */
export const fetchServices = (namespace?: string, params?: Record<string, any>) =>
  fetchNamespacedResources('services', namespace, params)

/**
 * 获取 Deployment 列表
 */
export const fetchDeployments = (namespace?: string, params?: Record<string, any>) =>
  fetchClusterResources('deployments', 'v1', 'apps', { 
    ...params, 
    ...(namespace && { namespace }) 
  })

/**
 * 获取 Node 列表
 */
export const fetchNodes = (params?: Record<string, any>) =>
  fetchClusterResources('nodes', 'v1', undefined, params)

/**
 * 获取 ConfigMap 列表
 */
export const fetchConfigMaps = (namespace?: string, params?: Record<string, any>) =>
  fetchNamespacedResources('configmaps', namespace, params)

/**
 * 获取 Secret 列表
 */
export const fetchSecrets = (namespace?: string, params?: Record<string, any>) =>
  fetchNamespacedResources('secrets', namespace, params)

// ============================== 导出所有功能 ==============================

// 重新导出 kubernetesRequest 以保持兼容性
export { kubernetesRequest } from './http-client'

export default {
  API_CONFIG,
  getCurrentClusterId,
  getCurrentClusterName,
  kubernetesApiRequest,
  fetchNamespaces,
  fetchNamespacedResources,
  fetchClusterResources,
  createOrUpdateResource,
  deleteResource,
  // 快捷方法
  fetchPods,
  fetchServices,
  fetchDeployments,
  fetchNodes,
  fetchConfigMaps,
  fetchSecrets
}