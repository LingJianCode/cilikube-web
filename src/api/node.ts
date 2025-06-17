import { requestGo } from "@/utils/service"
import type { Node } from "./types/node"

/** 获取指定集群的节点列表 */
export function getNodeList(clusterName: string) {
  // 后端直接返回 Node[]
  return requestGo<Node[]>({
    url: `/api/v1/clusters/${clusterName}/nodes`,
    method: "get"
  })
}