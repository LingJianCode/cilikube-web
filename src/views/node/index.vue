<template>
  <div class="node-page-container">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>集群管理</el-breadcrumb-item>
      <el-breadcrumb-item>
        节点列表 (集群: {{ currentClusterDisplayName }})
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h1 class="page-title">
        Kubernetes 节点 - {{ currentClusterDisplayName }}
      </h1>
      <div class="action-buttons">
        <el-button :icon="Plus" type="primary" @click="handleCreateNode" :loading="loading" :disabled="!selectedClusterName">新建节点</el-button>
        <el-button :icon="View" @click="handleMonitor" :loading="loading" :disabled="!selectedClusterName">集群监控</el-button>
        <el-dropdown :disabled="!selectedClusterName">
          <el-button :icon="Operation" :loading="loading">
            更多操作<el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleUpgradeCluster">集群升级</el-dropdown-item>
              <el-dropdown-item @click="handleClusterSettings">集群设置</el-dropdown-item>
              <el-dropdown-item divided @click="handleBulkAction">批量操作</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
          <el-tooltip content="刷新数据" placement="top">
            <el-button :icon="Refresh" circle @click="fetchNodeData" :loading="loading" :disabled="!selectedClusterName" />
          </el-tooltip>
      </div>
    </div>

    <el-alert
      v-if="!selectedClusterName && !clusterStore.loadingClusters && clusterStore.availableClusters.length > 0"
      title="请先在顶部导航栏选择一个集群以查看节点信息。"
      type="info"
      show-icon
      :closable="false"
      style="margin-bottom: 20px;"
    />
     <el-alert
      v-if="!selectedClusterName && !clusterStore.loadingClusters && clusterStore.availableClusters.length === 0"
      title="当前没有可用的集群。请检查后端配置或联系管理员。"
      type="warning"
      show-icon
      :closable="false"
      style="margin-bottom: 20px;"
    />


    <el-row :gutter="20" class="node-grid" v-loading="loading">
        <el-col v-if="!loading && selectedClusterName && !nodeData.length" :span="24">
          <el-empty :description="`在集群 '${currentClusterDisplayName}' 中未找到任何节点信息。`" />
        </el-col>
      <el-col
        v-for="node in currentPageData"
        :key="node.metadata.uid"
        :xs="24"
        :sm="12"
        :lg="8"
        :xl="6"
        class="node-col"
      >
        <el-card class="node-card" shadow="hover">
          <template #header>
            <div class="node-card__header">
              <div class="node-card__title-group">
                  <el-icon class="node-icon" :color="getNodeStatusColor(node.status?.conditions)">
                    <Platform v-if="isControlPlaneNode(node)" />
                    <Monitor v-else />
                  </el-icon>
                <span class="node-card__name">{{ node.metadata.name }}</span>
                <el-tag
                  :type="getNodeStatusTagType(node.status?.conditions)"
                  size="small"
                  effect="light"
                  class="node-card__status-tag"
                >
                  <el-icon class="status-icon">
                      <CircleCheck v-if="getNodeStatus(node.status?.conditions) === 'Ready'" />
                      <CircleClose v-else />
                  </el-icon>
                  {{ getNodeStatus(node.status?.conditions) }}
                </el-tag>
                  <el-tag v-if="isControlPlaneNode(node)" type="info" size="small" effect="plain" class="node-card__role-tag">
                    Control Plane
                  </el-tag>
              </div>
              <el-dropdown trigger="click" @command="handleNodeAction($event, node)">
                <el-button link :icon="MoreFilled" class="node-card__actions-trigger" />
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="details" :icon="InfoFilled">查看详情</el-dropdown-item>
                    <el-dropdown-item command="monitor" :icon="DataLine">节点监控</el-dropdown-item>
                    <el-dropdown-item command="cordon" :icon="Lock">设为不可调度</el-dropdown-item>
                    <el-dropdown-item command="drain" :icon="DeleteLocation">驱逐Pods</el-dropdown-item>
                    <el-dropdown-item command="edit" :icon="EditPen" divided>编辑标签/注解</el-dropdown-item>
                    <el-dropdown-item command="delete" :icon="Delete" style="color: var(--el-color-danger);">删除节点</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </template>
          <div class="node-card__body">
            <el-descriptions :column="1" size="small" border class="node-descriptions">
              <el-descriptions-item>
                <template #label><el-icon><Iphone /></el-icon> IP 地址</template>
                  {{ getNodeAddress(node.status?.addresses) }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label><el-icon><Odometer /></el-icon> Kubelet 版本</template>
                  {{ node.status?.nodeInfo?.kubeletVersion || 'N/A' }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label><el-icon><Cpu /></el-icon> CPU 容量</template>
                  <el-tag type="info" size="small" effect="plain">{{ node.status?.capacity?.cpu || 'N/A' }} 核</el-tag>
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label><el-icon><SetUp /></el-icon> 内存容量</template>
                <el-tag type="success" size="small" effect="plain">{{ formatMemory(node.status?.capacity?.memory) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label><el-icon><Box /></el-icon> Pods 容量</template>
                  {{ node.status?.capacity?.pods || 'N/A' }}
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label><el-icon><MessageBox /></el-icon> 容器运行时</template>
                  <div class="runtime-info">{{ node.status?.nodeInfo?.containerRuntimeVersion || 'N/A' }}</div>
              </el-descriptions-item>
              <el-descriptions-item>
                <template #label><el-icon><Calendar /></el-icon> 创建时间</template>
                  {{ formatTimestamp(node.metadata?.creationTimestamp) }}
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="pagination-container" v-if="totalNodes > 0 && selectedClusterName">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[6, 12, 18, 24]"
        :total="totalNodes"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        :disabled="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { storeToRefs } from "pinia"
import { ElMessage, ElMessageBox } from "element-plus"
import { request } from "@/utils/service"
import dayjs from "dayjs"
import { useClusterStore } from "@/store/modules/clusterStore"
import {
  Plus, View, Operation, Refresh, ArrowDown, Platform, Monitor, Cpu, SetUp, Calendar, Iphone,
  CircleCheck, CircleClose, MoreFilled, InfoFilled, DataLine, Lock, DeleteLocation, EditPen, Delete, MessageBox, Box, Loading
} from '@element-plus/icons-vue'

// --- 使用 Cluster Store ---
const clusterStore = useClusterStore()
const { selectedClusterName, availableClusters, loadingClusters: s_loadingClusters } = storeToRefs(clusterStore) // Renamed to avoid conflict

// --- Interfaces (确保与后端数据完全匹配) ---
interface NodeMetadata {
  name: string
  uid: string
  creationTimestamp?: string // 设为可选，以防万一
  labels?: { [key: string]: string }
  annotations?: { [key: string]: string }
  resourceVersion?: string
}

interface NodeCondition {
  type: string
  status: string // 通常是 "True", "False", "Unknown"
  lastHeartbeatTime?: string
  lastTransitionTime?: string
  reason?: string
  message?: string
}

interface NodeAddress {
  type: string // 例如 "InternalIP", "ExternalIP", "Hostname"
  address: string
}

interface NodeSystemInfo {
  machineID?: string
  systemUUID?: string
  bootID?: string
  kernelVersion?: string
  osImage?: string
  containerRuntimeVersion?: string
  kubeletVersion?: string
  kubeProxyVersion?: string
  operatingSystem?: string
  architecture?: string
}

interface NodeCapacity {
  cpu?: string
  memory?: string
  pods?: string
  "ephemeral-storage"?: string // K8s 中 'ephemeral-storage' 是一个常见键
  [key: string]: string | undefined // 允许其他容量键
}

interface NodeStatus {
  capacity?: NodeCapacity
  allocatable?: NodeCapacity
  conditions?: NodeCondition[]
  addresses?: NodeAddress[]
  nodeInfo?: NodeSystemInfo
}

interface NodeSpec {
  podCIDR?: string // 可能不存在
  podCIDRs?: string[]
  providerID?: string
  taints?: any[]
  unschedulable?: boolean
}

interface Node {
  metadata: NodeMetadata // metadata 通常总是存在
  spec?: NodeSpec       // spec 可能在某些非常规情况下部分缺失，但通常存在
  status?: NodeStatus   // status 可能在节点刚注册时信息不全
}

interface KubernetesList {
  items: Node[]
  metadata?: {
    resourceVersion?: string
    continue?: string
  }
}

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

// --- Reactive State ---
const nodeData = ref<Node[]>([])
const currentPage = ref(1)
const pageSize = ref(12)
const totalNodes = ref(0)
const loading = ref(false) // 本地加载状态

// --- Computed Properties ---
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return nodeData.value.slice(start, end)
})

const currentClusterDisplayName = computed(() => {
  if (!selectedClusterName.value) return "N/A"
  const cluster = availableClusters.value.find(c => c.name === selectedClusterName.value)
  // 如果在 availableClusters 中找不到，直接返回 name（可能正在加载或列表同步问题）
  return cluster ? cluster.displayName : selectedClusterName.value
})

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080"

// --- API Fetching ---
const fetchNodeData = async () => {
  if (!selectedClusterName.value) {
    nodeData.value = []
    totalNodes.value = 0
    return
  }
  if (loading.value) return
  loading.value = true
  try {
    const apiUrl = `/api/v1/clusters/${selectedClusterName.value}/nodes`
    console.log(`Fetching node data for cluster '${selectedClusterName.value}' from: ${VITE_API_BASE_URL}${apiUrl}`)

    const response = await request<ApiResponse<KubernetesList>>({
      url: apiUrl,
      method: "get",
      baseURL: VITE_API_BASE_URL,
    })

    if (response.code === 200 && response.data && response.data.items) {
      nodeData.value = response.data.items
      totalNodes.value = response.data.items.length
      const totalPages = Math.ceil(totalNodes.value / pageSize.value)
      if (currentPage.value > totalPages && totalPages > 0) {
        currentPage.value = totalPages
      } else if (totalPages === 0 && currentPage.value !== 1) {
        currentPage.value = 1
      }
    } else {
      ElMessage.error(`获取节点数据失败 (集群: ${currentClusterDisplayName.value}): ${response.message || '返回数据结构不符合预期或API出错'}`)
      nodeData.value = []
      totalNodes.value = 0
    }
  } catch (error: any) {
    console.error(`获取集群 '${currentClusterDisplayName.value}' 的节点数据时发生网络或请求错误:`, error)
    ElMessage.error(`获取节点数据出错 (集群: ${currentClusterDisplayName.value}): ${error.message || '网络或请求错误'}`)
    nodeData.value = []
    totalNodes.value = 0
  } finally {
    loading.value = false
  }
}

// --- Helper Functions (添加了对 undefined 的处理) ---
const getNodeStatus = (conditions: NodeCondition[] | undefined): 'Ready' | 'NotReady' | 'Unknown' => {
  if (!conditions || conditions.length === 0) return 'Unknown'
  const readyCondition = conditions.find(condition => condition.type === "Ready")
  if (!readyCondition) return 'Unknown'
  return readyCondition.status === "True" ? "Ready" : "NotReady"
}

const getNodeStatusTagType = (conditions: NodeCondition[] | undefined): 'success' | 'danger' | 'warning' => {
  const status = getNodeStatus(conditions)
  if (status === 'Ready') return 'success'
  if (status === 'NotReady') return 'danger'
  return 'warning'
}

const getNodeStatusColor = (conditions: NodeCondition[] | undefined): string => {
    const status = getNodeStatus(conditions)
    if (status === 'Ready') return 'var(--el-color-success)'
    if (status === 'NotReady') return 'var(--el-color-danger)'
    return 'var(--el-color-warning)'
}

const isControlPlaneNode = (node: Node): boolean => {
    const labels = node.metadata?.labels || {}
    return 'node-role.kubernetes.io/control-plane' in labels ||
           'node-role.kubernetes.io/master' in labels
}

const getNodeAddress = (addresses: NodeAddress[] | undefined): string => {
  if (!addresses || addresses.length === 0) return "N/A"
  const internalIP = addresses.find(address => address.type === "InternalIP")
  if (internalIP) return internalIP.address
  const externalIP = addresses.find(address => address.type === "ExternalIP")
  if (externalIP) return externalIP.address
  const hostname = addresses.find(address => address.type === "Hostname")
  return hostname ? hostname.address : "N/A"
}

const parseMemory = (memory: string | undefined): number => {
    if (!memory) return 0
    const value = parseFloat(memory)
    if (isNaN(value)) return 0

    if (memory.includes("Gi")) return value * 1024 * 1024
    if (memory.includes("Mi")) return value * 1024
    if (memory.includes("Ki")) return value
    // 对于没有单位但很大的数字，可以假设是Bytes，然后转为KiB
    // K8s 通常会带单位，所以这个回退逻辑命中率不高
    if (value > 1024 * 1024) { // Heuristic: if > 1MB and no unit, assume bytes
        // console.warn(`Memory value ${memory} has no unit, assuming bytes and converting to KiB`)
        return value / 1024
    }
    // 如果没有单位且数值不大，可以假设是KiB或者一个需要进一步明确的单位
    // console.warn(`Memory value ${memory} has no unit, assuming KiB or needs clarification`)
    return value // Fallback: assume KiB if no unit
}

const formatMemory = (memoryStr: string | undefined): string => {
    if (!memoryStr) return 'N/A'
    const memoryInKi = parseMemory(memoryStr)

    // 检查是否由于解析问题或真实值为0导致 memoryInKi 为0
    if (memoryInKi === 0 && !['0', '0Ki', '0Mi', '0Gi'].some(z => memoryStr.trim().startsWith(z))) {
      // 如果原始值不是明确的 "0" 或 "0Ki" 等，但解析后为0，可能意味着解析失败或单位不识别
      // console.warn(`formatMemory: parsed to 0 for input '${memoryStr}', returning N/A or original.`)
      return 'N/A' // 或者返回 memoryStr 如果希望显示原始值
    }
    if (memoryInKi === 0 && memoryStr.trim().startsWith("0")) return "0 KiB" // 明确处理0值

    const gb = memoryInKi / (1024 * 1024)
    if (gb >= 0.1) { // 显示 GiB 的阈值可以调整，例如 >= 0.1 GiB
      return `${gb.toFixed(gb >= 10 ? 1 : 2)} GiB` // 对较大的 GiB 值保留更多小数位
    }
    const mb = memoryInKi / 1024
    if (mb >= 1) {
      return `${mb.toFixed(0)} MiB`
    }
    return `${memoryInKi.toFixed(0)} KiB`
}

const formatTimestamp = (timestamp: string | undefined): string => {
  if (!timestamp) return 'N/A'
  return dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss")
}

// --- Event Handlers (与之前一致) ---
const handlePageChange = (page: number) => { currentPage.value = page }
const handleSizeChange = (size: number) => { pageSize.value = size; currentPage.value = 1 }
const handleCreateNode = () => { ElMessage.info("模拟: 新建节点") }
const handleMonitor = () => { ElMessage.info("模拟: 集群监控") }
const handleUpgradeCluster = () => { ElMessage.info("模拟: 集群升级") }
const handleClusterSettings = () => { ElMessage.info("模拟: 集群设置") }
const handleBulkAction = () => { ElMessage.info("模拟: 批量操作") }
const handleNodeAction = (command: string, node: Node) => { /* ... 保持不变 ... */ }

// --- Lifecycle Hooks & Watchers ---
onMounted(async () => {
  if (clusterStore.availableClusters.length === 0 && !s_loadingClusters.value) { // 使用重命名后的 loadingClusters
    // console.log("NodeList: availableClusters is empty, fetching from store.")
    await clusterStore.fetchAvailableClusters()
  }
  // The watch with immediate: true will handle the initial data fetch if selectedClusterName is already set.
})

watch(selectedClusterName, (newName, oldName) => {
  // console.log(`NodeList: selectedClusterName changed from ${oldName} to ${newName}`)
  if (newName) {
    // 只有当集群名称实际改变，或者新名称有效但当前没有数据时才加载
    if (newName !== oldName || (newName && nodeData.value.length === 0 && !loading.value) ) {
      ElMessage.info(`正在为集群 '${currentClusterDisplayName.value}' 加载节点数据...`)
      currentPage.value = 1
      nodeData.value = []
      totalNodes.value = 0
      fetchNodeData()
    }
  } else {
    nodeData.value = []
    totalNodes.value = 0
    if (!s_loadingClusters.value) { // 避免在集群列表本身还在加载时就提示
      // ElMessage.info("请在顶部选择一个集群以查看节点信息。")
    }
  }
}, { immediate: true })

</script>

<style lang="scss" scoped>
/* 样式与之前相同 */
.node-page-container {
  padding: 20px;
  background-color: var(--el-bg-color-page);
}

.page-breadcrumb {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  flex-wrap: wrap;
  gap: 15px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.node-grid {
  margin-bottom: 25px;
}

.node-col {
  margin-bottom: 20px;
  display: flex;
}

.node-card {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  transition: box-shadow 0.3s ease-in-out, border-color 0.3s ease-in-out;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: var(--el-box-shadow-light);
    border-color: var(--el-border-color-darker);
  }

  :deep(.el-card__header) {
    padding: 12px 15px;
    background-color: var(--el-fill-color-lighter);
    border-bottom: 1px solid var(--el-border-color-extra-light);
  }

  :deep(.el-card__body) {
    padding: 15px;
    flex-grow: 1;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

    &__title-group {
        display: flex;
        align-items: center;
        gap: 8px;
        overflow: hidden;
    }

    .node-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

  &__name {
    font-weight: 600;
    color: var(--el-text-color-primary);
    font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 5px;
  }

  &__status-tag {
      display: inline-flex;
      align-items: center;
      gap: 3px;
      font-size: 11px;
      padding: 0 5px;
      height: 20px;
      line-height: 18px;
      .status-icon {
        font-size: 10px;
      }
  }
  &__role-tag {
      font-size: 11px;
      padding: 0 5px;
      height: 20px;
      line-height: 18px;
  }


  &__actions-trigger.el-button.is-link {
      padding: 5px;
      color: var(--el-text-color-secondary);
      &:hover {
        color: var(--el-color-primary);
      }
  }


  &__body {
    .node-descriptions {
      :deep(.el-descriptions__label) {
          color: var(--el-text-color-secondary);
          font-weight: normal;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            .el-icon {
                font-size: 14px;
            }
      }
      :deep(.el-descriptions__content) {
          color: var(--el-text-color-primary);
            font-size: 13px;
            word-break: break-all;
      }
      .el-tag {
          font-size: 12px;
      }
      .runtime-info {
          font-family: monospace;
          font-size: 12px;
      }
    }
  }
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
}

.el-icon--right {
  margin-left: 5px;
}
</style>