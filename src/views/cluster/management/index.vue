<template>
  <div class="cluster-management-container">
    <el-card class="page-header-card">
      <div class="page-header">
        <div class="page-title">集群管理</div>
        <div class="action-buttons">
          <el-button type="primary" :icon="Plus" @click="handleOpenDialog()">添加集群</el-button>
        </div>
      </div>
      <div class="page-description">
        在这里管理所有可用的 Kubernetes 集群。您可以添加新的集群、切换当前活动的集群或删除不再需要的集群。
      </div>
    </el-card>

    <el-table :data="clusterList" v-loading="isLoading" style="width: 100%; margin-top: 20px;">
      <el-table-column prop="name" label="集群名称" min-width="150">
        <template #default="{ row }">
          <span>{{ row.name }}</span>
          <el-tag v-if="row.name === activeClusterName" type="success" size="small" style="margin-left: 8px;">Active</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" min-width="120">
        <template #default="{ row }">
          <el-tag :type="getStatusTagType(row.status)">{{ row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="server" label="API 服务器地址" min-width="250" />
      <el-table-column prop="version" label="K8s 版本" min-width="150" />
      <el-table-column prop="environment" label="环境" min-width="100" />
      <el-table-column prop="source" label="来源" min-width="100">
        <template #default="{ row }">
          <el-tag :type="row.source === 'database' ? 'primary' : 'info'">
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

    <el-dialog v-model="dialogVisible" title="添加新集群" width="60%">
      <el-form :model="form" ref="formRef" :rules="rules" label-width="100px">
        <el-form-item label="集群名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入唯一的集群名称" />
        </el-form-item>
        <el-form-item label="环境" prop="environment">
          <el-input v-model="form.environment" placeholder="例如: production, staging" />
        </el-form-item>
        <el-form-item label="提供商" prop="provider">
          <el-input v-model="form.provider" placeholder="例如: minikube, aws, gcp" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入集群的描述信息" />
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
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue"
import { type FormInstance, type FormRules, ElMessage } from "element-plus"
import { Plus } from "@element-plus/icons-vue"
import { getClusterList, createCluster, deleteCluster, setActiveCluster, getActiveCluster, type ClusterInfo, type CreateClusterRequest } from "@/api/cluster"

// 响应式状态
const clusterList = ref<ClusterInfo[]>([])
const activeClusterName = ref<string>("")
const isLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref<FormInstance | null>(null)
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
  kubeconfigData: [{ required: true, message: "Kubeconfig 内容不能为空", trigger: "blur" }]
}

// 获取集群列表和活动集群
const fetchAllData = async () => {
  isLoading.value = true
  try {
    // 并发请求两个接口
    const [listRes, activeRes] = await Promise.all([getClusterList(), getActiveCluster()])

    // 假设：只要 request 工具没有抛出异常（HTTP状态码为2xx），就代表请求成功
    // 直接使用返回的数据，不再检查业务代码 'code'
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

// 辅助函数：判断集群是否可用
const isAvailable = (status: string) => status.startsWith("可用")

// 处理操作：设为活动
const handleSetActive = async (row: ClusterInfo) => {
  try {
    await setActiveCluster(row.id) // 使用ID而不是name
    ElMessage.success(`集群 '${row.name}' 已设为活动集群`)
    await fetchAllData() // 成功后重新获取数据以更新状态
  } catch (error) {
    console.error("切换活动集群失败:", error)
    ElMessage.error("切换活动集群失败")
  }
}

// 处理操作：删除
const handleDelete = async (row: ClusterInfo) => {
  try {
    await deleteCluster(row.id) // 使用ID而不是name
    ElMessage.success(`集群 '${row.name}' 已删除`)
    await fetchAllData()
  } catch (error) {
    console.error("删除集群失败:", error)
    ElMessage.error("删除集群失败")
  }
}

// 处理操作：打开对话框
const handleOpenDialog = () => {
  // 重置表单
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
      try {
        await createCluster(form.value)
        ElMessage.success("集群添加成功")
        dialogVisible.value = false
        await fetchAllData()
      } catch (error) {
        console.error("添加集群失败:", error)
        ElMessage.error("添加集群失败")
      }
    } else {
      return false
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
  padding: 20px;
}

.page-header-card {
  margin-bottom: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
}

.page-description {
  margin-top: 10px;
  color: #888;
  font-size: 14px;
}
</style>