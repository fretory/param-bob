<template>
  <div class="tool-selector" :class="{ 'is-dark': isDark }">
    <div class="tool-header" @click="toggleCollapse">
      <div class="header-left">
        <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed }">
          <ArrowRight />
        </el-icon>
        <span>全局参数配置</span>
      </div>
      <el-button 
        type="primary" 
        link 
        :icon="Plus"
        @click.stop="addParameter"
      >
        新增参数
      </el-button>
    </div>
    <div class="params-container" v-show="!isCollapsed">
      <div v-if="parameters.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Setting /></el-icon>
        <p class="empty-text">暂无全局参数</p>
        <el-button 
          type="primary" 
          link 
          @click="addParameter"
        >
          添加第一个参数
        </el-button>
      </div>
      <div v-else class="params-list">
        <div v-for="(param, index) in parameters" :key="index" class="param-item">
          <el-checkbox
            v-model="param.enabled"
            class="param-checkbox"
          />
          <div class="param-inputs">
            <el-input
              v-model="param.name"
              placeholder="参数名称"
              class="param-input name-input"
              :disabled="!param.enabled"
            />
            <div class="value-input-wrapper">
              <el-input
                v-model="param.value"
                placeholder="参数值"
                class="param-input value-input"
                :disabled="!param.enabled"
              />
              <el-button
                class="param-delete-btn"
                type="danger"
                link
                :icon="Delete"
                @click="removeParameter(index)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineExpose, defineProps } from 'vue'
import { Close, ArrowRight, Plus, Setting, Delete } from '@element-plus/icons-vue'

defineProps<{
  isDark?: boolean
}>()

interface ParamItem {
  name: string;
  value: string;
  enabled: boolean;
}

const isCollapsed = ref(false)
const parameters = ref<ParamItem[]>([])

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const addParameter = () => {
  parameters.value.push({ 
    name: '', 
    value: '', 
    enabled: true // 新添加的参数默认启用
  })
}

const removeParameter = (index: number) => {
  parameters.value.splice(index, 1)
}

defineExpose({
  parameters
})
</script>

<style scoped>
.tool-selector {
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  transition: all 0.3s ease;
}

.tool-header {
  padding: 16px 20px;
  background-color: var(--highlight-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.collapse-icon {
  transition: transform 0.3s ease;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.params-container {
  padding: 20px;
  transition: all 0.3s ease;
}

.params-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.param-checkbox {
  margin-right: 4px;
}

.param-inputs {
  display: flex;
  gap: 8px;
  flex: 1;
}

.name-input {
  width: 120px;
  flex: none;
}

.value-input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.value-input {
  flex: 1;
}

.param-delete-btn {
  padding: 8px !important;
  height: 32px !important;
  width: 32px !important;
  margin: 0 !important;
  color: var(--text-secondary) !important;
  transition: all 0.3s ease;
}

.param-delete-btn:hover {
  color: var(--el-color-danger) !important;
  background-color: var(--highlight-bg) !important;
}

.param-delete-btn .el-icon {
  font-size: 16px !important;
}

/* 暗色模式适配 */
:deep(.el-input__wrapper) {
  background-color: var(--primary-bg);
}

:deep(.el-button) {
  --el-button-hover-text-color: var(--el-color-primary);
  --el-button-hover-bg-color: var(--highlight-bg);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: var(--primary-bg);
  border-radius: 6px;
  border: 1px dashed var(--border-color);
  min-height: 200px;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 14px;
  margin-bottom: 16px;
}

.param-delete-btn {
  color: var(--text-secondary) !important;
  transition: all 0.3s ease;
}

.param-delete-btn:hover {
  color: var(--el-color-danger) !important;
  background-color: var(--highlight-bg) !important;
}

/* 复选框样式适配 */
:deep(.el-checkbox) {
  --el-checkbox-checked-text-color: var(--text-primary);
  --el-checkbox-checked-bg-color: var(--el-color-primary);
  --el-checkbox-checked-input-border-color: var(--el-color-primary);
  margin-right: 0;
}

:deep(.el-checkbox__label) {
  color: var(--text-primary);
}

:deep(.el-checkbox__input) {
  --el-checkbox-border-color: var(--border-color);
}

/* 禁用状态的输入框样式 */
:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: var(--secondary-bg);
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
}

:deep(.el-input.is-disabled .el-input__inner) {
  color: var(--text-secondary);
}

/* 输入框样式适配 */
:deep(.el-input__wrapper) {
  background-color: var(--highlight-bg);
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
  padding: 0 8px;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-input__inner) {
  height: 32px;
  color: var(--text-primary);
  font-size: 14px;
}
</style> 