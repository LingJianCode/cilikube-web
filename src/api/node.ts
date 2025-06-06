import { requestGo } from "@/utils/service"
import type { KubernetesListResponse } from "./types/kubernetes" // 假设有通用的类型定义
import type { Node } from "./types/node" // 假设 Node 类型定义在此

/** 获取指定集群的节点列表 */
export function getNodeList(clusterName: string) {
  // 使用新的、专用的 requestGo 方法
  return requestGo<KubernetesListResponse<Node>>({
    // URL 适配了新的多集群路由
    url: `/api/v1/clusters/${clusterName}/nodes`,
    method: "get"
  })
}