<script lang="ts" setup>
import { computed } from "vue"
import { type RouteRecordRaw } from "vue-router"
import { useI18n } from "vue-i18n"
import SidebarItemLink from "./SidebarItemLink.vue"
import { isExternal } from "@/utils/validate"
import path from "path-browserify"

interface Props {
  item: RouteRecordRaw
  basePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  basePath: ""
})

const { t } = useI18n()

// 标题映射表，将中文标题映射到国际化key
const titleMap: Record<string, string> = {
  '看板': 'menu.board',
  '集群安装': 'menu.clusterInstall',
  '集群概览': 'menu.clusterOverview',
  '集群监控': 'menu.clusterMonitor',
  '运维导航': 'menu.opsNavigation',
  '集群': 'menu.cluster',
  '集群管理': 'menu.clusterManagement',
  '节点': 'menu.node',
  '命名空间': 'menu.namespace',
  '工作负载': 'menu.workloads',
  'pod': 'menu.pod',
  'deployment': 'menu.deployment',
  '存储': 'menu.storage',
  'pv': 'menu.pv',
  'pvc': 'menu.pvc',
  '网络': 'menu.network',
  'service': 'menu.service',
  'ingress': 'menu.ingress',
  '配置管理': 'menu.config',
  'configmap': 'menu.configmap',
  'secret': 'menu.secret',
  '项目管理': 'menu.project',
  '中文文档': 'menu.chineseDocs',
  '我的博客': 'menu.myBlog',
  '技术栈': 'menu.techStack',
  '权限': 'menu.permission',
  '页面级': 'menu.pageLevel',
  '按钮级': 'menu.buttonLevel'
}

// 获取国际化标题
const getI18nTitle = (title: string) => {
  const i18nKey = titleMap[title]
  return i18nKey ? t(i18nKey) : title
}

/** 是否始终显示根菜单 */
const alwaysShowRootMenu = computed(() => props.item.meta?.alwaysShow)

/** 显示的子菜单 */
const showingChildren = computed(() => {
  return props.item.children?.filter((child) => !child.meta?.hidden) ?? []
})

/** 显示的子菜单数量 */
const showingChildNumber = computed(() => {
  return showingChildren.value.length
})

/** 唯一的子菜单项 */
const theOnlyOneChild = computed(() => {
  const number = showingChildNumber.value
  switch (true) {
    case number > 1:
      return null
    case number === 1:
      return showingChildren.value[0]
    default:
      return { ...props.item, path: "" }
  }
})

/** 解析路径 */
const resolvePath = (routePath: string) => {
  switch (true) {
    case isExternal(routePath):
      return routePath
    case isExternal(props.basePath):
      return props.basePath
    default:
      return path.resolve(props.basePath, routePath)
  }
}
</script>

<template>
  <template v-if="!alwaysShowRootMenu && theOnlyOneChild && !theOnlyOneChild.children">
    <SidebarItemLink v-if="theOnlyOneChild.meta" :to="resolvePath(theOnlyOneChild.path)">
      <el-menu-item :index="resolvePath(theOnlyOneChild.path)">
        <SvgIcon v-if="theOnlyOneChild.meta.svgIcon" :name="theOnlyOneChild.meta.svgIcon" />
        <component v-else-if="theOnlyOneChild.meta.elIcon" :is="theOnlyOneChild.meta.elIcon" class="el-icon" />
        <template v-if="theOnlyOneChild.meta.title" #title>
          {{ getI18nTitle(theOnlyOneChild.meta.title) }}
        </template>
      </el-menu-item>
    </SidebarItemLink>
  </template>
  <el-sub-menu v-else :index="resolvePath(props.item.path)" teleported>
    <template #title>
      <SvgIcon v-if="props.item.meta?.svgIcon" :name="props.item.meta.svgIcon" />
      <component v-else-if="props.item.meta?.elIcon" :is="props.item.meta.elIcon" class="el-icon" />
      <span v-if="props.item.meta?.title">{{ getI18nTitle(props.item.meta.title) }}</span>
    </template>
    <template v-if="props.item.children">
      <SidebarItem
        v-for="child in showingChildren"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
      />
    </template>
  </el-sub-menu>
</template>

<style lang="scss" scoped>
.svg-icon {
  min-width: 1em;
  margin-right: 12px;
  font-size: 18px;
}

.el-icon {
  width: 1em !important;
  margin-right: 12px !important;
  font-size: 18px;
}
</style>
