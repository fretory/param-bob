<template>
  <div class="preview-section" :class="{ 'is-dark': isDark }">
    <div class="preview-header">
      <div class="preview-title">
        <span>命令预览</span>
      </div>
      <div class="preview-actions">
        <!-- 返回父命令 -->
        <el-tooltip 
          content="返回父命令" 
          placement="top"
          :popper-options="{ effect: isDark ? 'dark' : 'light' }"
        >
          <el-button
            type="primary"
            link
            :icon="Back"
            @click="goToParent"
          />
        </el-tooltip>
        <!-- 清空当前命令 -->
        <el-tooltip 
          content="清空当前命令" 
          placement="top"
          :popper-options="{ effect: isDark ? 'dark' : 'light' }"
        >
          <el-button
            type="primary"
            link
            :icon="Delete"
            @click="confirmClearCurrent"
          />
        </el-tooltip>
        <!-- 清空所有命令 -->
        <el-tooltip 
          content="清空所有命令" 
          placement="top"
          :popper-options="{ effect: isDark ? 'dark' : 'light' }"
        >
          <el-button
            type="primary"
            link
            :icon="RemoveFilled"
            @click="confirmClearAll"
          />
        </el-tooltip>
        <!-- 复制命令 -->
        <el-tooltip 
          content="复制命令" 
          placement="top"
          :popper-options="{ effect: isDark ? 'dark' : 'light' }"
        >
          <el-button 
            type="primary" 
            link 
            :icon="CopyDocument"
            @click="copyCommand"
          />
        </el-tooltip>
        <!-- 添加到命令组合 -->
        <el-tooltip 
          content="添加到命令组合" 
          placement="top"
          :popper-options="{ effect: isDark ? 'dark' : 'light' }"
        >
          <el-button
            type="primary"
            link
            :icon="Plus"
            @click="async () => { 
              const shouldContinue = await validateRequiredParams()
              if (shouldContinue) {
                $emit('addToSteps', previewCommand, props.commandPath)
              }
            }"
          />
        </el-tooltip>
      </div>
    </div>
    <div class="preview-content" ref="previewRef">
      <pre><code>{{ previewCommand }}</code></pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { CopyDocument, Delete, Back, RemoveFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { Parameter } from '../types/config'

const props = defineProps<{
  globalParameters: { name: string; value: string; enabled?: boolean }[];
  commandPath: string;
  inheritedParameters: Parameter[];
  commandParameters: Parameter[];
  isDark?: boolean;
}>()

const emit = defineEmits(['clearCurrent', 'goToParent', 'clearAll', 'addToSteps'])

const previewRef = ref<HTMLElement | null>(null)

const previewCommand = computed(() => {
  const parts = ['tools']
  
  // 添加全局参数
  const globalPart = props.globalParameters
    .filter(param => param.name && param.value && param.enabled)
    .map(param => `--${param.name} ${param.value}`)
    .join(' ')
  if (globalPart) parts.push(globalPart)
  
  // 添加命令路径
  parts.push(props.commandPath.replace(/-/g, ' '))
  
  // 收集所有参数（包括继承的参数和当前命令的参数）
  const allParameters = [
    // 继承的参数（来自父命令）
    ...props.inheritedParameters
      .filter(param => param.value && (param.enabled || param.required))
      .map(param => `--${param.param} ${param.value}`),
    
    // 当前命令的参数
    ...props.commandParameters
      .filter(param => param.value && (param.enabled || param.required))
      .map(param => `--${param.param} ${param.value}`)
  ]

  // 添加所有参数（去重）
  const uniqueParameters = [...new Set(allParameters)]
  if (uniqueParameters.length > 0) {
    parts.push(uniqueParameters.join(' '))
  }
  
  return parts.join(' ')
})

// 修改返回父命令的逻辑
const goToParent = () => {
  // 从当前命令路径中获取父命令
  const pathParts = props.commandPath.split(' ')
  if (pathParts.length > 2) {
    // 如果是三级命令，去掉最后一级，并用横杠连接
    const parentPath = pathParts.slice(0, -1).join('-')
    emit('goToParent', parentPath)
  }
}

// 清空当前命令确认
const confirmClearCurrent = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空当前命令的所有输入吗？',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: props.isDark ? 'dark-message-box' : ''
      }
    )
    emit('clearCurrent')
    ElMessage({
      message: '已清空当前命令输入',
      type: 'success',
      customClass: props.isDark ? 'dark-message' : ''
    })
  } catch {
    // 用户取消操作
  }
}

// 清空所有命令确认
const confirmClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有命令的输入吗？此操作不可恢复。',
      '确认清空',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: props.isDark ? 'dark-message-box' : ''
      }
    )
    emit('clearAll')
    ElMessage({
      message: '已清空所有命令输入',
      type: 'success',
      customClass: props.isDark ? 'dark-message' : ''
    })
  } catch {
    // 用户取消操作
  }
}

// 修改验证函数
const validateRequiredParams = async () => {
  // 检查命令自身的必填参数
  const missingParams = props.commandParameters
    .filter(param => param.required && !param.value)
    .map(param => param.param)

  // 检查继承的必填参数
  const missingInheritedParams = props.inheritedParameters
    .filter(param => param.required && !param.value)
    .map(param => param.param)

  const allMissingParams = [...missingParams, ...missingInheritedParams]
  
  if (allMissingParams.length > 0) {
    try {
      await ElMessageBox.confirm(
        `以下必填参数未填写：\n${allMissingParams.join('\n')}\n\n是否仍然继续？`,
        '缺少必填参数',
        {
          confirmButtonText: '仍然继续',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: props.isDark ? 'dark-message-box' : ''
        }
      )
      return true // 用户选择继续
    } catch {
      return false // 用户选择取消
    }
  }
  return true
}

// 修改复制命令函数
const copyCommand = async () => {
  const shouldContinue = await validateRequiredParams()
  if (!shouldContinue) return
  
  try {
    await navigator.clipboard.writeText(previewCommand.value)
    ElMessage({
      message: '命令已复制到剪贴板',
      type: 'success',
      customClass: props.isDark ? 'dark-message' : ''
    })
  } catch (err) {
    ElMessage({
      message: '复制失败，请手动复制',
      type: 'error',
      customClass: props.isDark ? 'dark-message' : ''
    })
  }
}
</script>

<style>
/* 暗色模式下的消息框样式 */
.dark-message-box {
  background-color: var(--secondary-bg) !important;
  border-color: var(--border-color) !important;
}

.dark-message-box .el-message-box__title {
  color: var(--text-primary) !important;
}

.dark-message-box .el-message-box__content {
  color: var(--text-secondary) !important;
}

.dark-message-box .el-message-box__container {
  background-color: var(--secondary-bg) !important;
}

.dark-message {
  background-color: var(--secondary-bg) !important;
  border-color: var(--border-color) !important;
  color: var(--text-primary) !important;
}

.preview-section {
  margin: 20px 0;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}

.preview-section.is-dark {
  --preview-bg: #2d2d2d;
  --preview-header-bg: #363636;
  --preview-code-bg: #1e1e1e;
  --preview-text: #e4e7ed;
}

.preview-section:not(.is-dark) {
  --preview-bg: #f8f9fa;
  --preview-header-bg: #eef0f2;
  --preview-code-bg: #f8f9fa;
  --preview-text: #303133;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--preview-header-bg);
  border-bottom: 1px solid var(--border-color);
}

.preview-title {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.preview-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-actions .el-button {
  font-size: 18px;
  padding: 6px;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.preview-actions .el-button:hover {
  background-color: var(--highlight-bg);
  color: var(--el-color-primary);
}

/* 暗色模式适配 */
.dark-mode .preview-actions .el-button {
  color: var(--text-secondary);
}

.dark-mode .preview-actions .el-button:hover {
  background-color: var(--highlight-bg);
  color: var(--el-color-primary);
}

.preview-content {
  padding: 16px 20px;
  background-color: var(--preview-code-bg);
  min-height: 40px;
}

.preview-content pre {
  margin: 0;
  padding: 0;
}

.preview-content code {
  font-family: 'Fira Code', Monaco, Consolas, 'Courier New', monospace;
  color: var(--preview-text);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
</style> 