<template>
  <div class="main-command">
    <!-- 一级命令的折叠控制 -->
    <div class="command-title-wrapper" @click="toggleCommand(command.name)">
      <div class="title-content">
        <div class="command-header">
          <h2 class="command-title">
            <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(command.name) }">
              <ArrowRight />
            </el-icon>
            {{ command.name }}
          </h2>
          <div class="command-tags">
            <el-tag 
              v-for="tag in command.tags" 
              :key="tag" 
              size="small" 
              class="tag"
              :type="isDark ? 'info' : ''"
              :effect="isDark ? 'dark' : 'light'"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>
    </div>

    <div v-show="!isCollapsed(command.name)">
      <div class="command-description">
        {{ command.description }}
      </div>
      
      <!-- 一级命令的参数部分 -->
      <div v-if="command.parameters" class="command-params">
        <h3 class="params-title">命令参数</h3>
        <div class="params-table">
          <el-table :data="command.parameters" border>
            <el-table-column width="50">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.enabled"
                  :disabled="scope.row.required"
                />
              </template>
            </el-table-column>
            <el-table-column prop="param" label="param" />
            <el-table-column prop="type" label="type" />
            <el-table-column prop="description" label="description" />
            <el-table-column prop="required" label="required">
              <template #default="scope">
                {{ scope.row.required ? 'true' : 'false' }}
              </template>
            </el-table-column>
            <el-table-column prop="value" label="your value">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.value"
                  @input="handleParamInput(scope.row)"
                />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 添加一级命令的预览 -->
        <command-preview 
          v-if="!command.subCommands"
          :global-parameters="globalParameters"
          :command-path="command.name"
          :inherited-parameters="[]"
          :command-parameters="command.parameters"
          :is-dark="isDark"
          @clear-current="clearCurrentCommand"
          @go-to-parent="handleGoToParent"
          @clear-all="clearAllCommands"
          @add-to-steps="(commandStr) => $emit('addToCommandSteps', commandStr, command.name)"
        />
      </div>
      
      <!-- 子命令部分 -->
      <template v-if="command.subCommands">
        <div 
          v-for="subCmd in command.subCommands" 
          :key="subCmd.name" 
          class="sub-command"
          :id="`${command.name}-${subCmd.name}`"
        >
          <!-- 二级命令的折叠控制 -->
          <div class="command-title-wrapper" @click="toggleCommand(`${command.name}-${subCmd.name}`)">
            <div class="title-content">
              <h3 class="sub-command-title">
                <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(`${command.name}-${subCmd.name}`) }">
                  <ArrowRight />
                </el-icon>
                <span class="command-text">{{ command.name }} {{ subCmd.name }}</span>
              </h3>
            </div>
          </div>

          <div v-show="!isCollapsed(`${command.name}-${subCmd.name}`)">
            <p class="sub-command-desc">{{ subCmd.description }}</p>
            
            <!-- 二级命令的参数部分 -->
            <div v-if="subCmd.parameters" class="params-table">
              <h4 class="params-subtitle">命令参数</h4>
              <el-table :data="subCmd.parameters" border>
                <el-table-column width="50">
                  <template #default="scope">
                    <el-checkbox
                      v-model="scope.row.enabled"
                      :disabled="scope.row.required"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="param" label="param" />
                <el-table-column prop="type" label="type" />
                <el-table-column prop="description" label="description" />
                <el-table-column prop="required" label="required">
                  <template #default="scope">
                    {{ scope.row.required ? 'true' : 'false' }}
                  </template>
                </el-table-column>
                <el-table-column prop="value" label="your value">
                  <template #default="scope">
                    <el-input 
                      v-model="scope.row.value"
                      @input="handleParamInput(scope.row)"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </div>

            <!-- 添加二级命令的预览（当没有子命令时） -->
            <command-preview 
              v-if="!subCmd.subCommands"
              :global-parameters="globalParameters"
              :command-path="`${command.name} ${subCmd.name}`"
              :inherited-parameters="getInheritedParameters(command, subCmd)"
              :command-parameters="subCmd.parameters || []"
              :is-dark="isDark"
              @clear-current="clearCurrentCommand"
              @go-to-parent="handleGoToParent"
              @clear-all="clearAllCommands"
              @add-to-steps="(commandStr) => $emit('addToCommandSteps', commandStr, `${command.name}-${subCmd.name}`)"
            />

            <!-- 三级命令部分 -->
            <template v-if="subCmd.subCommands">
              <div 
                v-for="subSubCmd in subCmd.subCommands" 
                :key="subSubCmd.name"
                class="sub-sub-command"
                :id="`${command.name}-${subCmd.name}-${subSubCmd.name}`"
              >
                <!-- 三级命令的折叠控制 -->
                <div class="command-title-wrapper" @click="toggleCommand(`${command.name}-${subCmd.name}-${subSubCmd.name}`)">
                  <div class="title-content">
                    <h4 class="sub-sub-command-title">
                      <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(`${command.name}-${subCmd.name}-${subSubCmd.name}`) }">
                        <ArrowRight />
                      </el-icon>
                      <span class="command-text">{{ command.name }} {{ subCmd.name }} {{ subSubCmd.name }}</span>
                    </h4>
                  </div>
                </div>

                <div v-show="!isCollapsed(`${command.name}-${subCmd.name}-${subSubCmd.name}`)">
                  <p class="sub-sub-command-desc">{{ subSubCmd.description }}</p>
                  
                  <div class="params-table">
                    <el-table :data="subSubCmd.parameters" border>
                      <el-table-column width="50">
                        <template #default="scope">
                          <el-checkbox
                            v-model="scope.row.enabled"
                            :disabled="scope.row.required"
                          />
                        </template>
                      </el-table-column>
                      <el-table-column prop="param" label="param" />
                      <el-table-column prop="type" label="type" />
                      <el-table-column prop="description" label="description" />
                      <el-table-column prop="required" label="required">
                        <template #default="scope">
                          {{ scope.row.required ? 'true' : 'false' }}
                        </template>
                      </el-table-column>
                      <el-table-column prop="value" label="your value">
                        <template #default="scope">
                          <el-input 
                            v-model="scope.row.value"
                            @input="handleParamInput(scope.row)"
                          />
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>

                  <command-preview 
                    :global-parameters="globalParameters"
                    :command-path="`${command.name} ${subCmd.name} ${subSubCmd.name}`"
                    :inherited-parameters="getInheritedParameters(command, subCmd)"
                    :command-parameters="subSubCmd.parameters"
                    :is-dark="isDark"
                    @clear-current="clearCurrentCommand"
                    @go-to-parent="handleGoToParent"
                    @clear-all="clearAllCommands"
                    @add-to-steps="(commandStr) => $emit('addToCommandSteps', commandStr, `${command.name}-${subCmd.name}-${subSubCmd.name}`)"
                  />
                </div>
              </div>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { defineProps, defineEmits } from 'vue'
import type { Command, SubCommand, Parameter } from '../types/config'
import CommandPreview from './CommandPreview.vue'
import { Back, Link, ArrowRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  command: Command;
  globalParameters: { name: string; value: string }[];
  isDark?: boolean;
}>()

const emit = defineEmits(['addToCommandSteps'])

// 折叠状态管理
const collapsedStates = ref<Set<string>>(new Set())

// 切换折叠状态
const toggleCommand = (commandPath: string) => {
  if (collapsedStates.value.has(commandPath)) {
    collapsedStates.value.delete(commandPath)
  } else {
    collapsedStates.value.add(commandPath)
  }
}

// 检查是否折叠
const isCollapsed = (commandPath: string) => {
  return collapsedStates.value.has(commandPath)
}

// 监听命令变化，重置折叠状态
watch(() => props.command, () => {
  collapsedStates.value.clear()
}, { deep: true })

// 获取继承的参数
const getInheritedParameters = (command: Command, subCmd: SubCommand): Parameter[] => {
  const inheritedParams: Parameter[] = []
  
  // 从一级命令继承所有参数
  if (command.parameters) {
    inheritedParams.push(...command.parameters)
  }
  
  return inheritedParams
}

// 清空当前命令的输入
const clearCurrentCommand = () => {
  // 清空当前命令的所有参数值
  if (props.command.parameters) {
    props.command.parameters.forEach(param => param.value = '')
  }
}

// 处理返回父命令
const handleGoToParent = (parentPath: string) => {
  const element = document.getElementById(parentPath)
  if (element) {
    const offset = 20
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    })
  }
}

// 清空所有命令的输入
const clearAllCommands = () => {
  // 递归清空所有命令的数值
  const clearParams = (params?: Parameter[]) => {
    if (params) {
      params.forEach(param => param.value = '')
    }
  }

  // 清空当前命令的参数
  clearParams(props.command.parameters)

  // 清空子命令的参数
  if (props.command.subCommands) {
    props.command.subCommands.forEach(subCmd => {
      clearParams(subCmd.parameters)
      if (subCmd.subCommands) {
        subCmd.subCommands.forEach(subSubCmd => {
          clearParams(subSubCmd.parameters)
        })
      }
    })
  }
}

// 返回上级命令
const goToParent = (parentId: string) => {
  const element = document.getElementById(parentId)
  if (element) {
    const offset = 20
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    })
  }
}

// 复制当前命令的链接
const copyLink = (id: string) => {
  const url = new URL(window.location.href)
  url.hash = id
  navigator.clipboard.writeText(url.toString())
    .then(() => {
      ElMessage({
        message: '链接已复制到剪贴板',
        type: 'success',
        customClass: props.isDark ? 'dark-message' : ''
      })
    })
    .catch(() => {
      ElMessage({
        message: '复制失败，请手动复制',
        type: 'error',
        customClass: props.isDark ? 'dark-message' : ''
      })
    })
}

// 添加处理函数
const handleAddToSteps = (command: string) => {
  emit('addToCommandSteps', command)
}

// 添加参数输入处理函数
const handleParamInput = (param: Parameter) => {
  // 如果输入了值且参数未启用且不是必需参数，则自动启用
  if (param.value && !param.enabled && !param.required) {
    param.enabled = true
  }
  // 如果清空了值且不是必需参数，则自动禁用
  if (!param.value && !param.required) {
    param.enabled = false
  }
}
</script>

<style scoped>
.main-command {
  margin-top: 20px;
  margin-bottom: 60px;
}

.command-description {
  margin: 0 0 40px;
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.6;
  padding: 20px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.command-title,
.sub-command-title,
.sub-sub-command-title {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  line-height: 32px;
}

.command-text {
  color: var(--text-primary);
  font-family: 'Fira Code', Monaco, Consolas, monospace;
  font-weight: 600;
}

.command-title .command-text {
  font-size: 24px;
}

.sub-command-title .command-text {
  font-size: 20px;
}

.command-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sub-command {
  margin: 30px 0;
  padding: 24px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.sub-command:last-child {
  margin-bottom: 0;
}

.sub-command-desc {
  margin: 0 0 24px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
}

.params-table {
  margin: 20px 0 30px;
}

.single-command {
  padding: 24px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.sub-sub-command {
  margin: 20px 0;
  padding: 20px;
  background-color: var(--highlight-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.sub-sub-command-title {
  margin: 0 0 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color);
}

.sub-sub-command-title .command-text {
  font-size: 18px;
  font-family: 'Fira Code', Monaco, Consolas, monospace;
  color: var(--text-primary);
  font-weight: 500;
}

.sub-sub-command-desc {
  margin: 0 0 20px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
}

.params-title {
  margin: 20px 0 16px;
  font-size: 18px;
  color: var(--text-primary);
}

.params-subtitle {
  margin: 16px 0 12px;
  font-size: 16px;
  color: var(--text-primary);
}

.inherited-tag {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-color-primary);
}

.command-title-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  user-select: none;
}

.title-content {
  flex: 1;
}

.sub-command-title {
  margin: 0;
  padding: 0;
  line-height: 32px;
}

.sub-command-desc {
  margin: 8px 0 0 0;
  color: var(--text-secondary);
  font-size: 14px;
}

.title-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-top: 4px;
}

.title-actions .el-button {
  font-size: 18px;
  padding: 6px;
  height: 32px;
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.title-actions .el-button:hover {
  background-color: var(--highlight-bg);
}

/* 暗色模式适配 */
.dark-mode .title-actions .el-button {
  color: var(--text-secondary);
}

.dark-mode .title-actions .el-button:hover {
  color: var(--el-color-primary);
  background-color: var(--highlight-bg);
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

/* 表格输入框样式适配 */
:deep(.el-table .el-input__wrapper) {
  background-color: var(--highlight-bg);
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
  padding: 0 8px;
}

:deep(.el-table .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-table .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-table .el-input__inner) {
  height: 32px;
  color: var(--text-primary);
  font-size: 14px;
}

/* 禁用状态的输入框样式 */
:deep(.el-table .el-input.is-disabled .el-input__wrapper) {
  background-color: var(--secondary-bg);
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
}

:deep(.el-table .el-input.is-disabled .el-input__inner) {
  color: var(--text-secondary);
}

/* 表格样式优化 */
:deep(.el-table) {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: var(--highlight-bg);
  --el-table-row-hover-bg-color: var(--highlight-bg);
}

:deep(.el-table th),
:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table .cell) {
  padding: 0 8px;
}

/* 复选框列宽度调整 */
:deep(.el-table .el-table__cell:first-child) {
  padding-left: 4px;
  padding-right: 4px;
}

/* 参数表格整体样式 */
.params-table {
  margin: 16px 0;
  border-radius: 8px;
  overflow: hidden;
}

/* 表格标题样式 */
.params-title,
.params-subtitle {
  margin-bottom: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.params-title {
  font-size: 16px;
}

.params-subtitle {
  font-size: 14px;
}

.collapse-icon {
  font-size: 16px;
  margin-right: 8px;
  transition: transform 0.3s ease;
  color: var(--text-secondary);
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.command-title-wrapper {
  cursor: pointer;
  user-select: none;
  padding: 8px 0;
}

.command-title-wrapper:hover {
  background-color: var(--highlight-bg);
}

.command-title,
.sub-command-title,
.sub-sub-command-title {
  display: flex;
  align-items: center;
}

/* 移除其他重复的边框线 */
.command-title,
.sub-command-title {
  border-bottom: none;
  margin: 0;
  padding: 0;
}

.sub-sub-command-title {
  border-bottom: none;
}

.command-title {
  font-size: 28px;
  margin-bottom: 20px;
}

.sub-command-title {
  font-size: 22px;
  margin-bottom: 16px;
}

.sub-sub-command-title {
  font-size: 18px;
  margin-bottom: 12px;
}

.sub-command {
  margin-left: 0;
}

.sub-sub-command {
  margin-left: 20px;
}

.sub-command-desc {
  margin-bottom: 24px;
}

.sub-sub-command-desc {
  margin-bottom: 20px;
}

.el-divider {
  margin: 60px 0;
}

.command-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin: 0;
}

.command-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 28px;
  color: var(--text-primary);
  font-weight: 600;
}

.command-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.command-title-wrapper {
  cursor: pointer;
  user-select: none;
  padding: 12px 16px;
  border-radius: 8px;
  transition: background-color 0.3s ease;
  margin-bottom: 20px;
}

.command-title-wrapper:hover {
  background-color: var(--highlight-bg);
}
</style> 