import { defineStore } from "pinia"
import { ref, watch } from "vue"
import { request } from "@/utils/service" // 假设你的 API 请求工具

// 定义集群信息接口
export interface ClusterInfo {
  name: string        // 集群的唯一标识符，用于 API 调用
  displayName: string // 显示在 UI 上的名称
  //可以根据需要添加其他属性，如区域、描述、是否只读等
}

// 定义后端返回的可用集群列表的API响应结构
interface AvailableClustersApiResponse {
  code: number
  data: ClusterInfo[] // 直接是 ClusterInfo 数组
  message: string
}

const STORE_KEY_SELECTED_CLUSTER = "selectedClusterName" // localStorage 键名

export const useClusterStore = defineStore("cluster", () => {
  // 可用集群列表
  const availableClusters = ref<ClusterInfo[]>([])
  // 当前选中的集群名称
  const selectedClusterName = ref<string | null>(localStorage.getItem(STORE_KEY_SELECTED_CLUSTER) || null)
  // 加载集群列表的状态
  const loadingClusters = ref<boolean>(false)

  // Action: 从后端获取可用集群列表
  async function fetchAvailableClusters() {
    if (loadingClusters.value) return
    loadingClusters.value = true
    try {
      // TODO: 替换为实际的后端 API 端点
      // 例如: const response = await request<AvailableClustersApiResponse>({ url: "/api/v1/meta/available-clusters", method: "get" });
      // --- START: MOCK DATA (实际开发中应替换为API调用) ---
      await new Promise(resolve => setTimeout(resolve, 500)) // 模拟网络延迟
      const mockResponse: AvailableClustersApiResponse = {
        code: 200,
        data: [
          { name: "default", displayName: "本地默认集群 (Default)" },
          { name: "dev-cluster", displayName: "开发集群 (Dev)" },
          { name: "prod-cluster-us-east", displayName: "生产集群 (US-East)" },
        ],
        message: "Mocked clusters fetched successfully",
      }
      // --- END: MOCK DATA ---

      // 替换为实际API调用后的处理逻辑
      const response = mockResponse // 使用模拟数据

      if (response.code === 200 && response.data) {
        availableClusters.value = response.data
        // 如果当前没有选中的集群，或者选中的集群不在新的列表中，则自动选择第一个
        const currentSelectionIsValid = selectedClusterName.value && availableClusters.value.some(c => c.name === selectedClusterName.value)
        if ((!selectedClusterName.value || !currentSelectionIsValid) && availableClusters.value.length > 0) {
          setSelectedClusterName(availableClusters.value[0].name)
        } else if (availableClusters.value.length === 0) { // 如果没有可用集群
          setSelectedClusterName(null) // 清空选择
        }
      } else {
        console.error("获取可用集群列表失败:", response.message)
        availableClusters.value = []
        setSelectedClusterName(null) // 获取失败也清空选择
      }
    } catch (error) {
      console.error("获取可用集群列表时发生网络错误:", error)
      availableClusters.value = []
      setSelectedClusterName(null)
    } finally {
      loadingClusters.value = false
    }
  }

  // Action: 设置当前选中的集群
  function setSelectedClusterName(clusterName: string | null) {
    selectedClusterName.value = clusterName
    if (clusterName) {
      localStorage.setItem(STORE_KEY_SELECTED_CLUSTER, clusterName)
    } else {
      localStorage.removeItem(STORE_KEY_SELECTED_CLUSTER)
    }
    // console.log("Selected cluster changed to:", clusterName) // 用于调试
  }

  // 监听 selectedClusterName 的变化并持久化 (上面已在 setSelectedClusterName 中处理)
  // watch(selectedClusterName, (newName) => {
  //   if (newName) {
  //     localStorage.setItem(STORE_KEY_SELECTED_CLUSTER, newName)
  //   } else {
  //     localStorage.removeItem(STORE_KEY_SELECTED_CLUSTER)
  //   }
  // })

  return {
    availableClusters,
    selectedClusterName,
    loadingClusters,
    fetchAvailableClusters,
    setSelectedClusterName,
  }
})