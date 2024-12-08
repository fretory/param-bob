<template>
  <div class="main-command">
    <!-- 一级命令标题区 -->
    <div class="command-section-header" @click="toggleCommand(command.name)">
      <div class="command-title-group">
        <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(command.name) }">
          <ArrowRight />
        </el-icon>
        <h2 class="command-title">{{ command.name }}</h2>
        <div class="command-tags">
          <el-tag 
            v-for="tag in command.tags" 
            :key="tag" 
            size="small"
            :type="isDark ? 'info' : 'default'"
            :effect="isDark ? 'dark' : 'light'"
            class="command-tag"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 命令内容区 -->
    <div v-show="!isCollapsed(command.name)" class="command-content">
      <!-- 命令描述 -->
      <div class="command-description">
        {{ command.description }}
      </div>
      
      <!-- 一级命令参数区 -->
      <div v-if="command.parameters" class="command-params-section">
        <div class="section-title">命令参数</div>
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
        <!-- 一级命令预览 -->
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
      
      <!-- 子命令列表区 -->
      <template v-if="command.subCommands">
        <div class="sub-commands-list">
          <div 
            v-for="subCmd in command.subCommands" 
            :key="subCmd.name" 
            class="sub-command-section"
            :id="`${command.name}-${subCmd.name}`"
          >
            <!-- 二级命令标题 -->
            <div class="sub-command-header" @click="toggleCommand(`${command.name}-${subCmd.name}`)">
              <div class="sub-command-title-group">
                <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(`${command.name}-${subCmd.name}`) }">
                  <ArrowRight />
                </el-icon>
                <h3 class="sub-command-title">{{ command.name }} {{ subCmd.name }}</h3>
              </div>
            </div>

            <div v-show="!isCollapsed(`${command.name}-${subCmd.name}`)" class="sub-command-content">
              <p class="sub-command-desc">{{ subCmd.description }}</p>
              
              <!-- 二级命令参数 -->
              <div v-if="subCmd.parameters" class="params-table">
                <div class="section-title">命令参数</div>
                <div class="params-table">
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
              </div>

              <!-- 二级命令预览（当没有三级命令时） -->
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

              <!-- 三级命令列表 -->
              <template v-if="subCmd.subCommands">
                <div 
                  v-for="subSubCmd in subCmd.subCommands" 
                  :key="subSubCmd.name"
                  class="sub-sub-command"
                  :id="`${command.name}-${subCmd.name}-${subSubCmd.name}`"
                >
                  <!-- 三级命令标题 -->
                  <div class="sub-sub-command-header" @click="toggleCommand(`${command.name}-${subCmd.name}-${subSubCmd.name}`)">
                    <div class="sub-sub-command-title-group">
                      <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(`${command.name}-${subCmd.name}-${subSubCmd.name}`) }">
                        <ArrowRight />
                      </el-icon>
                      <h4 class="sub-sub-command-title">{{ command.name }} {{ subCmd.name }} {{ subSubCmd.name }}</h4>
                    </div>
                  </div>

                  <div v-show="!isCollapsed(`${command.name}-${subCmd.name}-${subSubCmd.name}`)" class="sub-sub-command-content">
                    <p class="sub-sub-command-desc">{{ subSubCmd.description }}</p>
                    
                    <!-- 三级命令参数 -->
                    <div v-if="subSubCmd.parameters" class="params-table">
                      <div class="section-title">命令参数</div>
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

                    <!-- 三级命令预览 -->
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

// 添加参数输入处的函数
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
/* 整体容器 */
.main-command {
  margin-bottom: 40px;
  border-radius: 12px;
  background-color: var(--primary-bg);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

/* 命令标题区 */
.command-section-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.command-section-header:hover {
  background-color: var(--highlight-bg);
}

.command-title-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 命令内容区 */
.command-content {
  padding: 24px;
}

/* 命令描述 */
.command-description {
  padding: 16px 20px;
  margin-bottom: 24px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
}

/* 参数区域 */
.command-params-section {
  margin-bottom: 32px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 16px;
  padding-left: 12px;
  border-left: 3px solid var(--el-color-primary);
}

/* 子命令列表 */
.sub-commands-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.sub-command-section {
  padding: 20px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

/* 三级命令 */
.sub-sub-command {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--highlight-bg);
  border-radius: 6px;
  margin-left: 16px;
}

/* 动画和过渡 */
.collapse-icon {
  transition: transform 0.3s ease;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

/* 暗色模式适配 */
.dark-mode .main-command {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.command-tag {
  margin-right: 8px;
}

.command-tag:last-child {
  margin-right: 0;
}

.command-title-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sub-command-header {
  padding: 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.sub-command-title-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sub-command-content {
  padding: 20px;
}

.sub-command-desc {
  margin-bottom: 20px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.sub-commands-list {
  margin-top: 24px;
}

.sub-command-section {
  margin-bottom: 24px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.sub-command-section:last-child {
  margin-bottom: 0;
}

.sub-sub-command {
  margin: 16px 0;
  padding: 20px;
  background-color: var(--highlight-bg);
  border-radius: 6px;
}

.sub-sub-command-header {
  padding: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
}

.sub-sub-command-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sub-sub-command-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.sub-sub-command-content {
  padding: 16px;
}

.sub-sub-command-desc {
  margin-bottom: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.sub-sub-command {
  margin: 16px 0;
  background-color: var(--highlight-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.sub-sub-command:last-child {
  margin-bottom: 0;
}
</style> 