<template>
  <el-dropdown trigger="click" @command="handleLanguageChange">
    <el-button text>
      <el-icon><Operation /></el-icon>
      {{ currentLanguageLabel }}
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="en" :class="{ 'is-active': currentLanguage === 'en' }">
          {{ $t('language.english') }}
        </el-dropdown-item>
        <el-dropdown-item command="zh" :class="{ 'is-active': currentLanguage === 'zh' }">
          {{ $t('language.chinese') }}
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocaleStore, type Language } from '@/store/modules/locale'
import { Operation } from '@element-plus/icons-vue'

const { t } = useI18n()
const localeStore = useLocaleStore()

const currentLanguage = computed(() => localeStore.currentLanguage)

const currentLanguageLabel = computed(() => {
  return currentLanguage.value === 'en' ? t('language.english') : t('language.chinese')
})

const handleLanguageChange = (command: Language) => {
  localeStore.setLocale(command)
}
</script>

<style scoped>
.is-active {
  color: var(--el-color-primary);
  font-weight: bold;
}
</style>