<script lang="ts" setup>
import { h, onMounted } from "vue"
import { useTheme } from "@/hooks/useTheme"
import { useFont } from "@/hooks/useFont"
import { useClusterStore } from "@/store/modules/clusterStore"
import { migrateClusterStorage, needsMigration } from "@/utils/cluster-migration"
import { ElNotification } from "element-plus"
// 将 Element Plus 的语言设置为中文
import zhCn from "element-plus/es/locale/lang/zh-cn"

const { initTheme } = useTheme()
const { initFont } = useFont()
const clusterStore = useClusterStore()

/** 初始化主题 */
initTheme()

/** 初始化字体 */
initFont()

/** 初始化集群store */
onMounted(async () => {
  try {
    // 首先获取集群列表
    await clusterStore.fetchAvailableClusters()
    
    // 检查是否需要迁移旧的集群存储
    if (needsMigration()) {
      const migrationSuccess = await migrateClusterStorage()
      if (migrationSuccess) {
        ElNotification({
          title: '存储迁移',
          message: '已自动迁移您的集群选择设置到新版本',
          type: 'success',
          duration: 3000
        })
      }
    }
  } catch (error) {
    console.warn('Failed to initialize cluster store:', error)
  }
})

/** 作者小心思 */
ElNotification({
  title: "你好呀！朋友！",
  type: "success",
  offset: 300,
  message: h(
    "a",
    { style: "color: darkblue", target: "_blank", href: "https://www.cillian.website" },
    "这是纯爱发电项目,点个免费star支持一下呀！如果可以，关注下公众号-希里安，共同学习进步！"
  ),
  duration: 0,
  position: "top-right"
})
</script>

<template>
  <el-config-provider :locale="zhCn">
    <router-view />
  </el-config-provider>
</template>
