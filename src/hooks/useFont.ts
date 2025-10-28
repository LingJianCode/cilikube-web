import { watchEffect } from "vue"
import { useSettingsStore } from "@/store/modules/settings"
import { storeToRefs } from "pinia"

/** 应用字体到全局 */
const applyFont = (font: string) => {
  const body = document.body
  if (font === "default" || !font) {
    body.style.fontFamily = '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif'
  } else {
    body.style.fontFamily = `"${font}", "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif`
  }
}

/** 初始化字体 */
export const initFont = () => {
  const settingsStore = useSettingsStore()
  const { fontFamily } = storeToRefs(settingsStore)

  // 使用 watchEffect 监听字体变化
  watchEffect(() => {
    applyFont(fontFamily.value)
  })
}

/** 字体 hook */
export function useFont() {
  return { initFont }
}
