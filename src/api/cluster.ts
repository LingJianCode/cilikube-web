// [重要] 导入我们新的专用请求方法 request (not requestGo)
import { request } from "@/utils/service" 

// ... 接口定义部分保持不变 ...
export interface ClusterInfo { 
  id: string
  name: string
  server: string
  version: string
  status: string
  source: string
  environment: string
}

export interface CreateClusterRequest {
  name: string
  kubeconfigData: string
  provider?: string
  description?: string
  environment?: string
  region?: string
}


/** 获取集群列表 */
export function getClusterList() {
  // [修复] 使用 request (支持 {code: 200, data: []} 格式)
  return request<{ data: ClusterInfo[] }>({
    url: "/api/v1/clusters",
    method: "get"
  })
}

/** 获取当前活动集群名称 */
export function getActiveCluster() {
  // [修复] 使用 request (支持 {code: 200, data: string} 格式)
  return request<{ data: string }>({
    url: "/api/v1/clusters/active",
    method: "get"
  })
}

/** 设置活动集群 */
export function setActiveCluster(name: string) {
  // [修复] 使用 request
  return request({
    url: "/api/v1/clusters/active",
    method: "post",
    data: { name }
  })
}

/** 创建新集群 */
export function createCluster(data: CreateClusterRequest) {
  const payload = {
    ...data,
    kubeconfigData: btoa(data.kubeconfigData)
  }
  // [修复] 使用 request
  return request({
    url: "/api/v1/clusters",
    method: "post",
    data: payload
  })
}

/** 删除集群 */
export function deleteCluster(clusterName: string) {
  // [修复] 使用 request
  return request({
    url: `/api/v1/clusters/${clusterName}`,
    method: "delete"
  })
}