// [重要] 导入我们新的专用请求方法 requestGo
import { requestGo } from "@/utils/service" 

// ... 接口定义部分保持不变 ...
export interface ClusterInfo { /* ... */ }
export interface CreateClusterRequest { /* ... */ }


/** 获取集群列表 */
export function getClusterList() {
  // [修复] 使用 requestGo
  return requestGo<{ data: ClusterInfo[] }>({
    url: "/api/v1/clusters", // 路径现在是相对于 VITE_GO_API_BASE_URL
    method: "get"
  })
}

/** 获取当前活动集群名称 */
export function getActiveCluster() {
  // [修复] 使用 requestGo
  return requestGo<{ data: string }>({
    url: "/api/v1/clusters/active",
    method: "get"
  })
}

/** 设置活动集群 */
export function setActiveCluster(name: string) {
  // [修复] 使用 requestGo
  return requestGo({
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
  // [修复] 使用 requestGo
  return requestGo({
    url: "/api/v1/clusters",
    method: "post",
    data: payload
  })
}

/** 删除集群 */
export function deleteCluster(clusterName: string) {
  // [修复] 使用 requestGo
  return requestGo({
    url: `/api/v1/clusters/${clusterName}`,
    method: "delete"
  })
}