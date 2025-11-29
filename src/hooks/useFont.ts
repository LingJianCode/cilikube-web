import { watchEffect } from "vue"
import { useSettingsStore } from "@/store/modules/settings"
import { useLocaleStore } from "@/store/modules/locale"
import { storeToRefs } from "pinia"

/** 字体 CDN 链接 */
const fontCDNs = {
  'maple-mono': 'https://cdn.jsdelivr.net/fontsource/fonts/maple-mono@latest/latin-400-normal.woff2',
  'jetbrains-mono': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400&display=swap'
}

/** 字体映射 */
const fontMap = {
  // 英文字体
  en: {
    default: '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif',
    'maple-mono': '"Maple Mono", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", monospace',
    'jetbrains-mono': '"JetBrains Mono", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", monospace'
  },
  // 中文字体
  zh: {
    default: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", "Helvetica Neue", Helvetica, Arial, sans-serif',
    kai: '"KaiTi", "楷体", "STKaiti", "Helvetica Neue", Helvetica, Arial, serif',
    hei: '"SimHei", "黑体", "STHeiti", "Helvetica Neue", Helvetica, Arial, sans-serif'
  }
}

/** 加载字体 */
const loadFont = (fontKey: string) => {
  if (fontCDNs[fontKey as keyof typeof fontCDNs]) {
    const fontUrl = fontCDNs[fontKey as keyof typeof fontCDNs]

    // 检查是否已经加载过该字体
    const existingElement = document.querySelector(`[data-font="${fontKey}"]`)
    if (existingElement) return

    if (fontKey === 'maple-mono') {
      // 对于 woff2 字体，使用 @font-face
      const style = document.createElement('style')
      style.setAttribute('data-font', fontKey)
      style.textContent = `
        @font-face {
          font-family: 'Maple Mono';
          src: url('${fontUrl}') format('woff2');
          font-weight: 400;
          font-style: normal;
          font-display: swap;
        }
      `
      document.head.appendChild(style)
    } else {
      // 对于 Google Fonts，使用 link 标签
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = fontUrl
      link.setAttribute('data-font', fontKey)
      document.head.appendChild(link)
    }
  }
}

/** 应用字体到全局 */
const applyFont = (font: string, language: 'en' | 'zh') => {
  const body = document.body

  // 如果需要加载外部字体，先加载
  if (fontCDNs[font as keyof typeof fontCDNs]) {
    loadFont(font)
  }

  // 根据语言和字体选择合适的字体族
  let fontFamily = ''

  if (language === 'en') {
    fontFamily = fontMap.en[font as keyof typeof fontMap.en] || fontMap.en.default
  } else {
    fontFamily = fontMap.zh[font as keyof typeof fontMap.zh] || fontMap.zh.default
  }

  body.style.fontFamily = fontFamily
}

/** 初始化字体 */
export const initFont = () => {
  const settingsStore = useSettingsStore()
  const localeStore = useLocaleStore()
  const { fontFamily } = storeToRefs(settingsStore)
  const { currentLanguage } = storeToRefs(localeStore)

  // 使用 watchEffect 监听字体和语言变化
  watchEffect(() => {
    applyFont(fontFamily.value, currentLanguage.value)
  })
}

/** 获取当前语言可用的字体选项 */
export const getAvailableFonts = (language: 'en' | 'zh') => {
  return Object.keys(fontMap[language])
}

/** 字体 hook */
export function useFont() {
  return { initFont, getAvailableFonts }
}
