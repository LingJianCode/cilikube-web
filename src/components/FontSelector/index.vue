<script lang="ts" setup>
import { onMounted } from "vue"
import { storeToRefs } from "pinia"
import { useSettingsStore } from "@/store/modules/settings"
import { Edit, Select } from "@element-plus/icons-vue"

const settingsStore = useSettingsStore()
const { fontFamily } = storeToRefs(settingsStore)

// 可用字体列表
const fontOptions = [
  { label: "默认字体", value: "default" },
  { label: "苹方", value: "PingFang SC" },
  { label: "微软雅黑", value: "Microsoft YaHei" },
  { label: "宋体", value: "SimSun" },
  { label: "黑体", value: "SimHei" },
  { label: "楷体", value: "KaiTi" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Georgia", value: "Georgia" },
  { label: "Courier New", value: "Courier New" },
  { label: "Verdana", value: "Verdana" },
  { label: "思源黑体", value: "Source Han Sans CN" }
]

// 切换字体
const handleFontChange = (font: string) => {
  fontFamily.value = font
  applyFont(font)
}

// 应用字体到全局
const applyFont = (font: string) => {
  const body = document.body
  if (font === "default") {
    body.style.fontFamily = '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif'
  } else {
    body.style.fontFamily = `"${font}", "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`
  }
}

// 初始化时应用已保存的字体
onMounted(() => {
  applyFont(fontFamily.value)
})
</script>

<template>
  <el-dropdown trigger="click" @command="handleFontChange">
    <div class="font-selector">
      <el-tooltip content="字体切换" placement="bottom">
        <el-icon :size="20">
          <Edit />
        </el-icon>
      </el-tooltip>
    </div>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="font in fontOptions"
          :key="font.value"
          :command="font.value"
          :disabled="fontFamily === font.value"
        >
          <span :style="{
            fontWeight: fontFamily === font.value ? 'bold' : 'normal',
            fontFamily: font.value === 'default' ? '' : font.value
          }">
            {{ font.label }}
            <el-icon v-if="fontFamily === font.value" style="margin-left: 5px;">
              <Select />
            </el-icon>
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style lang="scss" scoped>
.font-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  cursor: pointer;

  &:hover {
    color: var(--el-color-primary);
  }
}

:deep(.el-dropdown-menu__item) {
  min-width: 160px;

  &:hover {
    background-color: var(--el-dropdown-menuItem-hover-fill);
  }
}
</style>
