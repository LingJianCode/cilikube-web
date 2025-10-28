<template>
  <div class="cluster-management-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">集群管理</h1>
        <p class="page-description">管理您的 Kubernetes 集群，支持多集群切换和监控</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleOpenDialog()" size="large">
          添加集群
        </el-button>
      </div>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-grid" v-loading="isLoading">
      <StatCard
        :icon="DataBoard"
        label="集群总数"
        :value="stats.total"
        iconBg="linear-gradient(135deg, #409EFF 0%, #3A8FE8 100%)"
      />
      <StatCard
        :icon="Select"
        label="活跃集群"
        :value="stats.active"
        iconBg="linear-gradient(135deg, #66B1FF 0%, #5DADE2 100%)"
        :active="true"
      />
      <StatCard
        :icon="CircleCheck"
        label="健康集群"
        :value="stats.healthy"
        iconBg="linear-gradient(135deg, #5DADE2 0%, #48C9B0 100%)"
      />
      <StatCard
        :icon="Warning"
        label="异常集群"
        :value="stats.unhealthy"
        iconBg="linear-gradient(135deg, #F5A623 0%, #F76B1C 100%)"
      />
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索集群名称、环境或服务器地址..."
          :prefix-icon="Search"
          clearable
          style="width: 320px"
        />
        <el-select
          v-model="filterEnvironment"
          placeholder="筛选环境"
          clearable
          style="width: 150px"
        >
          <el-option label="全部环境" value="" />
          <el-option label="生产环境" value="production" />
          <el-option label="预发布" value="staging" />
          <el-option label="开发环境" value="development" />
        </el-select>
        <el-select
          v-model="filterStatus"
          placeholder="筛选状态"
          clearable
          style="width: 150px"
        >
          <el-option label="全部状态" value="" />
          <el-option label="可用" value="available" />
          <el-option label="不可用" value="unavailable" />
        </el-select>
      </div>
      <div class="toolbar-right">
        <el-radio-group v-model="viewMode" size="default">
          <el-radio-button value="card">
            <el-icon><Grid /></el-icon>
            卡片视图
          </el-radio-button>
          <el-radio-button value="table">
            <el-icon><List /></el-icon>
            列表视图
          </el-radio-button>
        </el-radio-group>
        <el-button :icon="Refresh" @click="fetchAllData" :loading="isLoading">
          刷新
        </el-button>
      </div>
    </div>

    <!-- 卡片视图 -->
    <transition name="fade">
      <div v-if="viewMode === 'card'" class="clusters-grid" v-loading="isLoading">
        <ClusterCard
          v-for="cluster in filteredClusters"
          :key="cluster.id"
          :cluster="cluster"
          :activeClusterName="activeClusterName"
          @setActive="handleSetActive"
          @delete="handleDelete"
        />
        <div v-if="filteredClusters.length === 0" class="empty-state">
          <el-empty description="没有找到匹配的集群" />
        </div>
      </div>
    </transition>

    <!-- 表格视图 -->
    <transition name="fade">
      <el-table
        v-if="viewMode === 'table'"
        :data="filteredClusters"
        v-loading="isLoading"
        style="width: 100%"
        :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="name" label="集群名称" min-width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600;">{{ row.name }}</span>
              <el-tag v-if="row.name === activeClusterName" type="success" size="small" effect="dark">
                Active
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="120">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)" effect="plain">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="server" label="API 服务器地址" min-width="250" show-overflow-tooltip />
        <el-table-column prop="version" label="K8s 版本" min-width="120" />
        <el-table-column prop="environment" label="环境" min-width="100">
          <template #default="{ row }">
            <el-tag :type="getEnvironmentType(row.environment)" size="small">
              {{ row.environment || 'default' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" min-width="100">
          <template #default="{ row }">
            <el-tag :type="row.source === 'database' ? 'primary' : 'info'" effect="plain" size="small">
              {{ row.source === 'database' ? '数据库' : '文件' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              link
              :disabled="row.name === activeClusterName || !isAvailable(row.status)"
              @click="handleSetActive(row)"
            >
              设为活动
            </el-button>
            <el-button type="primary" link disabled>编辑</el-button>
            <el-popconfirm
              title="确定要删除这个集群吗？"
              @confirm="handleDelete(row)"
              :disabled="row.source === 'file'"
            >
              <template #reference>
                <span style="margin-left: 10px;">
                  <el-button
                    type="danger"
                    link
                    :disabled="row.source === 'file'"
                    title="只能删除通过数据库添加的集群"
                  >
                    删除
                  </el-button>
                </span>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </transition>

    <!-- 添加集群对话框 -->
    <el-dialog v-model="dialogVisible" title="添加新集群" width="60%" :close-on-click-modal="false">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="集群名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入唯一的集群名称" />
        </el-form-item>
        <el-form-item label="环境" prop="environment">
          <el-select v-model="form.environment" placeholder="选择环境类型" style="width: 100%">
            <el-option label="生产环境" value="production" />
            <el-option label="预发布环境" value="staging" />
            <el-option label="开发环境" value="development" />
            <el-option label="测试环境" value="testing" />
          </el-select>
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-input v-model="form.provider" placeholder="例如: minikube, aws, gcp, aliyun" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入集群的描述信息" />
        </el-form-item>
        <el-form-item label="Kubeconfig" prop="kubeconfigData">
          <el-input
            v-model="form.kubeconfigData"
            type="textarea"
            :rows="10"
            placeholder="请粘贴您的 Kubeconfig 文件内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="isSubmitting">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from "vue"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import {
  Plus,
  Search,
  Refresh,
  Grid,
  List,
  DataBoard,
  Select,
  CircleCheck,
  Warning
} from "@element-plus/icons-vue"
import {
  getClusterList,
  createCluster,
  deleteCluster,
  setActiveCluster,
  getActiveCluster,
  type ClusterInfo,
  type CreateClusterRequest
} from "@/api/cluster"
import StatCard from "@/components/cluster/StatCard.vue"
import ClusterCard from "@/components/cluster/ClusterCard.vue"

// 响应式状态
const clusterList = ref<ClusterInfo[]>([])
const activeClusterName = ref<string>("")
const isLoading = ref(false)
const isSubmitting = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance | null>(null)

// 视图和筛选状态
const viewMode = ref<'card' | 'table'>('card')
const searchQuery = ref('')
const filterEnvironment = ref('')
const filterStatus = ref('')

const form = ref<CreateClusterRequest>({
  name: "",
  kubeconfigData: "",
  provider: "",
  description: "",
  environment: ""
})

// 表单验证规则
const rules: FormRules = {
  name: [{ required: true, message: "集群名称不能为空", trigger: "blur" }],
  kubeconfigData: [{ required: true, message: "Kubeconfig 内容不能为空", trigger: "blur" }],
  environment: [{ required: true, message: "请选择环境类型", trigger: "change" }]
}

// 统计数据
const stats = computed(() => {
  const total = clusterList.value.length
  const active = clusterList.value.filter(c => c.name === activeClusterName.value).length
  const healthy = clusterList.value.filter(c => c.status.startsWith('可用')).length
  const unhealthy = total - healthy

  return { total, active, healthy, unhealthy }
})

// 过滤后的集群列表
const filteredClusters = computed(() => {
  return clusterList.value.filter(cluster => {
    // 搜索过滤
    const matchesSearch = !searchQuery.value ||
      cluster.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      cluster.server.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      (cluster.environment && cluster.environment.toLowerCase().includes(searchQuery.value.toLowerCase()))

    // 环境过滤
    const matchesEnvironment = !filterEnvironment.value ||
      cluster.environment?.toLowerCase() === filterEnvironment.value.toLowerCase()

    // 状态过滤
    const matchesStatus = !filterStatus.value ||
      (filterStatus.value === 'available' && cluster.status.startsWith('可用')) ||
      (filterStatus.value === 'unavailable' && cluster.status.startsWith('不可用'))

    return matchesSearch && matchesEnvironment && matchesStatus
  })
})

// 获取集群列表和活动集群
const fetchAllData = async () => {
  isLoading.value = true
  try {
    const [listRes, activeRes] = await Promise.all([getClusterList(), getActiveCluster()])
    clusterList.value = listRes.data
    activeClusterName.value = activeRes.data
  } catch (error) {
    console.error("获取集群数据失败:", error)
    ElMessage.error("获取集群数据失败，请检查网络或联系管理员")
  } finally {
    isLoading.value = false
  }
}

// 辅助函数：根据状态字符串获取标签类型
const getStatusTagType = (status: string) => {
  if (status.startsWith("可用")) return "success"
  if (status.startsWith("不可用")) return "danger"
  return "info"
}

// 辅助函数：根据环境获取标签类型
const getEnvironmentType = (environment: string | undefined) => {
  if (!environment) return 'info'
  const env = environment.toLowerCase()
  if (env === 'production' || env === 'prod') return 'danger'
  if (env === 'staging' || env === 'stage') return 'warning'
  if (env === 'development' || env === 'dev') return 'success'
  return 'info'
}

// 辅助函数：判断集群是否可用
const isAvailable = (status: string) => status.startsWith("可用")

// 处理操作：设为活动
const handleSetActive = async (row: ClusterInfo) => {
  try {
    await setActiveCluster(row.id)
    ElMessage.success(`集群 '${row.name}' 已设为活动集群`)
    await fetchAllData()
  } catch (error) {
    console.error("切换活动集群失败:", error)
    ElMessage.error("切换活动集群失败")
  }
}

// 处理操作：删除
const handleDelete = async (row: ClusterInfo) => {
  try {
    await deleteCluster(row.id)
    ElMessage.success(`集群 '${row.name}' 已删除`)
    await fetchAllData()
  } catch (error) {
    console.error("删除集群失败:", error)
    ElMessage.error("删除集群失败")
  }
}

// 处理操作：打开对话框
const handleOpenDialog = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  form.value = {
    name: "",
    kubeconfigData: "",
    provider: "",
    description: "",
    environment: ""
  }
  dialogVisible.value = true
}

// 处理操作：提交表单
const submitForm = () => {
  formRef.value?.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true
      try {
        await createCluster(form.value)
        ElMessage.success("集群添加成功")
        dialogVisible.value = false
        await fetchAllData()
      } catch (error) {
        console.error("添加集群失败:", error)
        ElMessage.error("添加集群失败")
      } finally {
        isSubmitting.value = false
      }
    }
  })
}

// 组件挂载后加载数据
onMounted(() => {
  fetchAllData()
})
</script>

<style scoped>
.cluster-management-container {
  padding: 24px;
  background: #F0F9FF;
  min-height: 100vh;
}

/* 页面头部 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-content {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1D2129;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, #409EFF 0%, #3A8FE8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  font-size: 14px;
  color: #4E5969;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 统计卡片网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.08);
  border: 1px solid #E8F4FF;
  flex-wrap: wrap;
  gap: 16px;
}

.toolbar-left {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 集群卡片网格 */
.clusters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
  min-height: 200px;
}

.empty-state {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 20px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(64, 158, 255, 0.08);
  border: 1px solid #E8F4FF;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .clusters-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  }
}

@media (max-width: 768px) {
  .cluster-management-container {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .toolbar-left :deep(.el-input),
  .toolbar-left :deep(.el-select) {
    width: 100% !important;
  }

  .toolbar-right {
    justify-content: space-between;
  }

  .clusters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
