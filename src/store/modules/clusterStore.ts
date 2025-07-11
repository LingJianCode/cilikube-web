import { defineStore } from "pinia"
import { ref, computed, watch } from "vue"
// [修复] 导入我们新的、专用于 Go 后端的 API 服务
import { getClusterList, getActiveCluster, setActiveCluster } from "@/api/cluster"
import type { ClusterInfo as ApiClusterInfo } from "@/api/cluster"
import { ElMessage } from "element-plus"
import { setCurrentClusterId } from "@/utils/cluster-context"

// 扩展接口以包含UI需要的显示名称
export interface ClusterInfo extends ApiClusterInfo {
  displayName: string
}

const STORE_KEY_SELECTED_CLUSTER = "selectedClusterName"

export const useClusterStore = defineStore("cluster", () => {
  const availableClusters = ref<ClusterInfo[]>([])
  const selectedClusterName = ref<string | null>(localStorage.getItem(STORE_KEY_SELECTED_CLUSTER) || null)
  const loadingClusters = ref<boolean>(false)
  const activeClusterFromServer = ref<string>("")

  // 计算属性：获取当前选择集群的ID
  const selectedClusterID = computed(() => {
    if (!selectedClusterName.value) return null
    const cluster = availableClusters.value.find(c => c.name === selectedClusterName.value)
    return cluster ? cluster.id : null
  })

  // 计算属性：提供一个默认的显示名称
  const currentClusterDisplayName = computed(() => {
    if (!selectedClusterName.value) return "未选择集群"
    const cluster = availableClusters.value.find(c => c.name === selectedClusterName.value)
    return cluster ? cluster.displayName : selectedClusterName.value
  })

  // Action: 从后端获取可用集群列表
  async function fetchAvailableClusters() {
    if (loadingClusters.value) return
    loadingClusters.value = true
    try {
      // [修复] 调用真实的后端 API
      const [listRes, activeRes] = await Promise.all([getClusterList(), getActiveCluster()])

      // 后端直接返回 { data: [...] }，所以我们直接用
      const rawClusters = listRes.data
      activeClusterFromServer.value = activeRes.data

      // 转换为包含 displayName 的 UI 模型
      availableClusters.value = rawClusters.map(c => ({
        ...c,
        displayName: `${c.name} (${c.environment})`
      }))

      // 如果当前没有选中的集群，或者选中的集群已失效，则自动选择
      const currentSelectionIsValid = selectedClusterName.value && availableClusters.value.some(c => c.name === selectedClusterName.value)
      if (!currentSelectionIsValid) {
        // 优先选择后端标记的 active 集群，其次选择列表第一个
        if (activeClusterFromServer.value && availableClusters.value.some(c => c.name === activeClusterFromServer.value)) {
          setSelectedClusterName(activeClusterFromServer.value)
        } else if (availableClusters.value.length > 0) {
          setSelectedClusterName(availableClusters.value[0].name)
        } else {
          setSelectedClusterName(null)
        }
      }
    } catch (error) {
      console.error("获取可用集群列表时发生网络错误:", error)
      ElMessage.error("获取可用集群列表失败，请检查网络或后端服务。")
      availableClusters.value = []
      setSelectedClusterName(null)
    } finally {
      loadingClusters.value = false
    }
  }

  // Action: 设置当前选中的集群
  async function setSelectedClusterName(clusterName: string | null) {
    selectedClusterName.value = clusterName
    if (clusterName) {
      localStorage.setItem(STORE_KEY_SELECTED_CLUSTER, clusterName)
      
      // 同时调用后端API设置活动集群
      try {
        await setActiveCluster(clusterName)
        console.log(`已将后端活动集群设置为: ${clusterName}`)
      } catch (error) {
        console.warn(`设置后端活动集群失败:`, error)
        // 不阻止前端状态更新，只是警告
      }
    } else {
      localStorage.removeItem(STORE_KEY_SELECTED_CLUSTER)
    }
  }

  // 监听集群选择变化，同步到全局上下文
  watch(selectedClusterID, (newClusterID) => {
    setCurrentClusterId(newClusterID)
  }, { immediate: true })

  return {
    availableClusters,
    selectedClusterName,
    selectedClusterID,
    loadingClusters,
    currentClusterDisplayName,
    fetchAvailableClusters,
    setSelectedClusterName,
  }
})