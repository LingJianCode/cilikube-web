<template>
  <div class="node-page-container">
    <el-breadcrumb separator="/" class="page-breadcrumb">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>集群资源</el-breadcrumb-item>
      <el-breadcrumb-item>
        节点列表 (当前集群: {{ clusterStore.currentClusterDisplayName }})
      </el-breadcrumb-item>
    </el-breadcrumb>

    <div class="page-header">
      <h1 class="page-title">
        节点列表
      </h1>
      <div class="action-buttons">
        <el-button :icon="Plus" type="primary" @click="handleCreateNode" :disabled="!clusterStore.selectedClusterName">新建节点</el-button>
        <el-tooltip content="刷新数据" placement="top">
          <el-button :icon="Refresh" circle @click="fetchNodeData" :loading="loading" :disabled="!clusterStore.selectedClusterName" />
        </el-tooltip>
      </div>
    </div>

    <el-alert
      v-if="!clusterStore.selectedClusterName && !clusterStore.loadingClusters"
      title="请先在顶部导航栏选择一个集群以查看节点信息。"
      type="info" show-icon :closable="false" style="margin-bottom: 20px;"
    />
    
    <div v-loading="loading">
      <el-empty v-if="!loading && nodeData.length === 0 && clusterStore.selectedClusterName" :description="`在集群 '${clusterStore.currentClusterDisplayName}' 中未找到任何节点。`" />
      <el-row :gutter="20" class="node-grid">
        <el-col
          v-for="node in currentPageData"
          :key="node.metadata.uid"
          :xs="24" :sm="12" :lg="8" :xl="6"
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
                  <el-tag :type="getNodeStatusTagType(node.status?.conditions)" size="small" effect="light" class="node-card__status-tag">
                    <el-icon class="status-icon"><CircleCheck v-if="getNodeStatus(node.status?.conditions) === 'Ready'" /><CircleClose v-else /></el-icon>
                    {{ getNodeStatus(node.status?.conditions) }}
                  </el-tag>
                </div>
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
                  <template #label>操作系统</template>
                  {{ node.status?.nodeInfo?.osImage || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>内核版本</template>
                  {{ node.status?.nodeInfo?.kernelVersion || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>容器运行时</template>
                  {{ node.status?.nodeInfo?.containerRuntimeVersion || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>kube-proxy 版本</template>
                  {{ node.status?.nodeInfo?.kubeProxyVersion || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>Pod CIDR</template>
                  {{ node.spec?.podCIDR || 'N/A' }}
                </el-descriptions-item>
                <el-descriptions-item>
                  <template #label>所有 IP</template>
                  <span v-if="node.status?.addresses && node.status.addresses.length">
                    <span v-for="addr in node.status.addresses" :key="addr.type" style="margin-right:8px;">
                      <el-tag size="small">{{ addr.type }}: {{ addr.address }}</el-tag>
                    </span>
                  </span>
                  <span v-else>N/A</span>
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
                  <template #label><el-icon><Calendar /></el-icon> 创建时间</template>
                  {{ formatTimestamp(node.metadata?.creationTimestamp) }}
                </el-descriptions-item>
              </el-descriptions>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <div class="pagination-container" v-if="totalNodes > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 36, 48]"
        :total="totalNodes"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue"
import { ElMessage } from "element-plus"
import dayjs from "dayjs"
import { useClusterStore } from "@/store/modules/clusterStore"
// [修复] 导入新的 Node API 服务
import { getNodeList } from "@/api/node" 
// 导入 Node 类型定义
import type { Node, NodeCondition, NodeAddress } from "@/api/types/node"
import {
  Plus, Refresh, Platform, Monitor, Cpu, SetUp, Calendar, Iphone, CircleCheck, CircleClose
} from '@element-plus/icons-vue'

// --- Store ---
const clusterStore = useClusterStore()

// --- Reactive State ---
const nodeData = ref<Node[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = ref(12)
const totalNodes = ref(0)

// --- Computed Properties ---
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return nodeData.value.slice(start, end)
})

// --- API Fetching ---
const fetchNodeData = async () => {
  const clusterName = clusterStore.selectedClusterName
  if (!clusterName) {
    nodeData.value = []
    totalNodes.value = 0
    return
  }

  loading.value = true
  try {
    // 后端直接返回 Node[]
    const res = await getNodeList(clusterName)
    if (Array.isArray(res)) {
      nodeData.value = res
      totalNodes.value = res.length
    } else {
      throw new Error('节点数据格式错误')
    }
  } catch (error: any) {
    console.error(`获取集群 '${clusterName}' 的节点数据时发生错误:`, error)
    ElMessage.error(`获取节点数据失败: ${error.message || '未知错误'}`)
    nodeData.value = []
    totalNodes.value = 0
  } finally {
    loading.value = false
  }
}

// --- Watcher ---
// 监听 Pinia store 中选中的集群变化
watch(() => clusterStore.selectedClusterName, (newClusterName) => {
  if (newClusterName) {
    ElMessage.info(`正在为集群 '${clusterStore.currentClusterDisplayName}' 加载节点...`)
    fetchNodeData()
  } else {
    // 如果没有选中的集群，则清空数据
    nodeData.value = []
    totalNodes.value = 0
  }
}, { immediate: true }) // immediate: true 确保组件加载时如果已有选中集群，会立即执行一次


// --- Lifecycle Hooks ---
onMounted(() => {
  // 确保集群列表已加载
  if (clusterStore.availableClusters.length === 0) {
    clusterStore.fetchAvailableClusters()
  }
})

// --- Helper Functions (与您之前的代码类似，添加了安全检查) ---
const getNodeStatus = (conditions: NodeCondition[] | undefined): 'Ready' | 'NotReady' | 'Unknown' => {
  if (!conditions) return 'Unknown'
  const ready = conditions.find(c => c.type === 'Ready')
  return ready?.status === 'True' ? 'Ready' : 'NotReady'
}

const getNodeStatusTagType = (conditions: NodeCondition[] | undefined) => {
  return getNodeStatus(conditions) === 'Ready' ? 'success' : 'danger'
}

const getNodeStatusColor = (conditions: NodeCondition[] | undefined) => {
  return getNodeStatus(conditions) === 'Ready' ? 'var(--el-color-success)' : 'var(--el-color-danger)'
}

const isControlPlaneNode = (node: Node) => {
  return node.metadata.labels ? 'node-role.kubernetes.io/control-plane' in node.metadata.labels : false
}

const getNodeAddress = (addresses: NodeAddress[] | undefined) => {
  if (!addresses) return "N/A"
  const internal = addresses.find(a => a.type === 'InternalIP')
  return internal ? internal.address : 'N/A'
}

const formatMemory = (memoryStr: string | undefined) => {
  if (!memoryStr) return 'N/A'
  const memoryKi = parseInt(memoryStr.replace('Ki', ''), 10)
  const memoryGi = memoryKi / 1024 / 1024
  return `${memoryGi.toFixed(1)} GB`
}

const formatTimestamp = (timestamp: string | undefined) => {
  return timestamp ? dayjs(timestamp).format("YYYY-MM-DD HH:mm:ss") : 'N/A'
}

// --- Event Handlers ---
const handlePageChange = (page: number) => { currentPage.value = page }
const handleSizeChange = (size: number) => { pageSize.value = size; currentPage.value = 1 }
const handleCreateNode = () => { ElMessage.info("新建节点功能待实现") }

</script>

<style lang="scss" scoped>
/* 您的样式可以保持不变，这里为了完整性粘贴 */
.node-page-container {
  padding: 20px;
}
.page-breadcrumb {
  margin-bottom: 20px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 24px;
  font-weight: bold;
}
.action-buttons {
  display: flex;
  gap: 10px;
}
.node-grid {
  margin-bottom: 20px;
}
.node-col {
  margin-bottom: 20px;
}
.node-card {
  width: 100%;
}
.node-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.node-card__title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
.node-card__name {
  font-weight: 600;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
}
</style>
