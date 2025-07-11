<script lang="ts" setup>
import { h, onMounted } from "vue"
import { useTheme } from "@/hooks/useTheme"
import { useClusterStore } from "@/store/modules/clusterStore"
import { ElNotification } from "element-plus"
// 将 Element Plus 的语言设置为中文
import zhCn from "element-plus/es/locale/lang/zh-cn"

const { initTheme } = useTheme()
const clusterStore = useClusterStore()

/** 初始化主题 */
initTheme()

/** 初始化集群store */
onMounted(async () => {
  try {
    await clusterStore.fetchAvailableClusters()
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
