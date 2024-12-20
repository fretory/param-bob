<template>
  <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
    <div class="float-controls" :class="{ 'all-hidden': !isNavVisible && !isParamsVisible }">
      <el-tooltip 
        content="显示导航栏" 
        placement="right" 
        :show-after="300"
        v-if="!isNavVisible"
      >
        <div class="float-btn" @click="toggleNav">
          <el-icon><Menu /></el-icon>
        </div>
      </el-tooltip>
      <el-tooltip 
        content="显示全局参数" 
        placement="right" 
        :show-after="300"
        v-if="!isParamsVisible"
      >
        <div class="float-btn" @click="toggleParams">
          <el-icon><Setting /></el-icon>
        </div>
      </el-tooltip>
    </div>

    <el-container>
      <el-aside :width="isNavVisible ? '250px' : '0'" class="sidebar">
        <div class="nav-header">
          <span>{{ 'Command Helper' }}</span>
          <div class="nav-controls">
            <el-tooltip content="只读模式" placement="bottom">
              <el-switch
                v-model="isReadOnly"
                inline-prompt
                :active-icon="Lock"
                :inactive-icon="Edit"
                @change="handleReadOnlyChange"
              />
            </el-tooltip>
            <el-switch
              v-model="isDarkMode"
              inline-prompt
              :active-icon="Moon"
              :inactive-icon="Sunny"
            />
          </div>
        </div>
        
        <div class="file-operations">
          <div class="file-operations-group">
            <el-tooltip content="加载配置文件" placement="bottom">
              <el-button
                class="file-op-btn"
                :icon="Upload"
                @click="handleFileLoad"
                text
              />
            </el-tooltip>
            <el-tooltip content="导出配置文件" placement="bottom">
              <el-button
                class="file-op-btn"
                :icon="Download"
                @click="handleFileExport"
                text
              />
            </el-tooltip>
            <el-tooltip :content="isAllExpanded ? '折叠全部' : '展开全部'" placement="bottom">
              <el-button
                class="file-op-btn"
                :icon="isAllExpanded ? FolderOpened : FolderAdd"
                @click="toggleAllMenus"
                text
              />
            </el-tooltip>
          </div>

          <el-divider direction="vertical" />

          <div class="file-operations-group" v-if="!isReadOnly">
            <el-tooltip content="恢复默认配置" placement="bottom">
              <el-button
                class="file-op-btn"
                :icon="RefreshRight"
                @click="handleResetConfig"
                text
              />
            </el-tooltip>
            <el-tooltip content="新增命令" placement="bottom">
              <el-button
                class="file-op-btn"
                :icon="DocumentAdd"
                @click="showCommandEditor"
                text
              />
            </el-tooltip>
          </div>
        </div>

        <div class="command-nav-container">
          <el-menu
            :default-active="activeCommand"
            class="command-nav"
            :class="{ 'is-dark': isDarkMode }"
          >
            <template v-for="cmd in commands" :key="cmd.name">
              <!-- 有子命令的情况 -->
              <el-sub-menu v-if="cmd.subCommands" :index="cmd.name">
                <template #title>
                  <span @click="scrollToCommand(cmd.name)">{{ cmd.name }}</span>
                </template>
                <!-- 二级命令 -->
                <template v-for="subCmd in cmd.subCommands" :key="`${cmd.name}-${subCmd.name}`">
                  <!-- 有三级命令的情况 -->
                  <el-sub-menu 
                    v-if="subCmd.subCommands" 
                    :index="`${cmd.name}-${subCmd.name}`"
                  >
                    <template #title>
                      <span @click="() => handleMenuClick(`${cmd.name}-${subCmd.name}`)">
                        {{ subCmd.name }}
                      </span>
                    </template>
                    <!-- 三级命令 -->
                    <el-menu-item
                      v-for="subSubCmd in subCmd.subCommands"
                      :key="`${cmd.name}-${subCmd.name}-${subSubCmd.name}`"
                      :index="`${cmd.name}-${subCmd.name}-${subSubCmd.name}`"
                      @click="scrollToCommand(`${cmd.name}-${subCmd.name}-${subSubCmd.name}`)"
                    >
                      {{ subSubCmd.name }}
                    </el-menu-item>
                  </el-sub-menu>
                  <!-- 没有三级命令的情况 -->
                  <el-menu-item
                    v-else
                    :index="`${cmd.name}-${subCmd.name}`"
                    @click="() => handleMenuClick(`${cmd.name}-${subCmd.name}`)"
                  >
                    {{ subCmd.name }}
                  </el-menu-item>
                </template>
              </el-sub-menu>
              <!-- 没有子命令的情况 -->
              <el-menu-item 
                v-else 
                :index="cmd.name"
                @click="scrollToCommand(cmd.name)"
              >
                {{ cmd.name }}
              </el-menu-item>
            </template>
          </el-menu>
        </div>

        <div class="nav-control" @click="toggleNav">
          <el-icon :class="{ 'is-collapsed': !isNavVisible }">
            <Fold v-if="isNavVisible" />
            <Expand v-else />
          </el-icon>
        </div>
      </el-aside>

      <el-aside 
        :width="isParamsVisible ? (globalParamsWidth + 'px') : '0'" 
        class="global-params-aside"
        :style="{ left: isNavVisible ? '250px' : '0' }"
      >
        <div class="global-params-wrapper">
          <tool-selector ref="toolSelector" :is-dark="isDarkMode" />
          <command-steps 
            ref="commandStepsRef"
            :is-dark="isDarkMode" 
            @scroll-to-command="handleScrollToCommand"
          />
        </div>
        <div 
          class="resizer global-params-resizer" 
          @mousedown="startResize($event)"
        ></div>
        <div class="params-control" @click="toggleParams">
          <el-icon :class="{ 'is-collapsed': !isParamsVisible }">
            <Fold v-if="isParamsVisible" />
            <Expand v-else />
          </el-icon>
        </div>
      </el-aside>

      <el-main 
        class="main-content" 
        :style="{ 
          marginLeft: getMainMargin
        }"
      >
        <div class="commands-list">
          <div 
            v-for="cmd in commands" 
            :key="cmd.name"
            class="command-section"
          >
            <div :id="cmd.name" class="command-anchor"></div>
            <main-command 
              :command="cmd" 
              :is-dark="isDarkMode"
              :is-read-only="isReadOnly"
              :global-parameters="toolSelector?.parameters || []"
              :existing-commands="commands"
              @add-to-command-steps="handleAddToCommandSteps"
              @add-sub-command="handleAddSubCommand"
              @delete-command="handleDeleteCommand"
              @update-command="handleUpdateCommand"
            />
            <el-divider />
          </div>
        </div>
      </el-main>
    </el-container>
  </div>
  <el-backtop :right="100" :bottom="100" />
  <input
    type="file"
    ref="fileInput"
    accept=".yaml,.yml,.json"
    style="display: none"
    @change="onFileSelected"
  >
  <command-editor
    v-model:visible="isCommandEditorVisible"
    :is-dark="isDarkMode"
    :is-read-only="isReadOnly"
    :existing-commands="commands"
    @submit="handleAddCommand"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Moon, Sunny, Setting, Fold, Expand, Menu, Upload, Download, RefreshRight, FolderOpened, FolderAdd, DocumentAdd, Lock, Edit } from '@element-plus/icons-vue'
import ToolSelector from './components/ToolSelector.vue'
import MainCommand from './components/MainCommand.vue'
import { loadConfig } from './utils/configLoader'
import type { ToolConfig, Command } from './types/config'
import yaml from 'js-yaml'
import CommandSteps from './components/CommandSteps.vue'
import CommandEditor from './components/CommandEditor.vue'

// 添加 Parameter 接口定义
interface Parameter {
  param: string
  value?: string
  default?: string
}

const toolSelector = ref<InstanceType<typeof ToolSelector> | null>(null)
const activeCommand = ref('')
const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)

// 从 localStorage 读取初始状态，如果没有则使用默认值
const isNavVisible = ref(localStorage.getItem('navVisible') !== 'false')
const isParamsVisible = ref(localStorage.getItem('paramsVisible') === 'true')

// 监听状态变化并保存到 localStorage
watch(isNavVisible, (newValue) => {
  localStorage.setItem('navVisible', newValue.toString())
})

watch(isParamsVisible, (newValue) => {
  localStorage.setItem('paramsVisible', newValue.toString())
})

// 同样也可以保存全局参数栏的宽度
const globalParamsWidth = ref(parseInt(localStorage.getItem('paramsWidth') || '300'))
const minWidth = 250
const maxWidth = 500

// 监听并保存
watch(globalParamsWidth, (newValue) => {
  localStorage.setItem('paramsWidth', newValue.toString())
})

// 添加常量定义
const LOCAL_STORAGE_CONFIG_KEY = 'tools_config'

// 修改配置数据的初始化
const toolConfig = ref<ToolConfig>({
  commands: [],
  globalParameters: []
})

// 添加初始化函数
const initConfig = async () => {
  try {
    // 先尝试从 localStorage 读取配置
    const savedConfig = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY)
    if (savedConfig) {
      const config = JSON.parse(savedConfig)
      toolConfig.value = {
        commands: config.commands || [],
        globalParameters: config.globalParameters || []
      }
    } else {
      // 如果没有本地缓存，则加载默认配置
      const config = await loadConfig()
      toolConfig.value = {
        commands: config.commands || [],
        globalParameters: config.globalParameters || []
      }
    }
    
    // 初始化全局参数
    if (toolSelector.value && toolConfig.value.globalParameters) {
      toolSelector.value.parameters = toolConfig.value.globalParameters.map(param => ({
        name: param.param,
        value: param.value || param.default || '',
        enabled: true
      }))
    }
  } catch (error) {
    console.error('Failed to load config:', error)
    ElMessage.error('加载配置文件失败')
    // 确保即使加载失败也有一个有效的初始状态
    toolConfig.value = {
      commands: [],
      globalParameters: []
    }
  }
}

// 在 onMounted 中调用初始化函数
onMounted(() => {
  initConfig()
})

// 修改计算属性
const commands = computed(() => toolConfig.value?.commands || [])

const scrollToCommand = (cmdName: string, event?: MouseEvent) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  
  activeCommand.value = cmdName
  const element = document.getElementById(cmdName)
  if (element) {
    const offset = 20
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    })
  }
}

const startResize = (e: MouseEvent) => {
  e.preventDefault()
  const startX = e.clientX
  const startWidth = globalParamsWidth.value

  const handleMouseMove = (e: MouseEvent) => {
    const diff = e.clientX - startX
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + diff))
    globalParamsWidth.value = newWidth
  }

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'default'
  }

  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
  document.body.style.cursor = 'col-resize'
}

const toggleNav = () => {
  isNavVisible.value = !isNavVisible.value
}

const toggleParams = () => {
  isParamsVisible.value = !isParamsVisible.value
}

const getMainMargin = computed(() => {
  let margin = 0
  if (isNavVisible.value) margin += 250
  if (isParamsVisible.value) margin += globalParamsWidth.value
  return margin + 'px'
})

const fileInput = ref<HTMLInputElement | null>(null)

// 处理文件加载
const handleFileLoad = () => {
  fileInput.value?.click()
}

// 修改文件选择处理函数
const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (file) {
    try {
      const content = await file.text()
      const config = file.name.endsWith('.json') 
        ? JSON.parse(content)
        : yaml.load(content)
      
      toolConfig.value = {
        commands: config.commands || [],
        globalParameters: config.globalParameters || []
      }
      
      // 重置并初始化全局参数
      if (toolSelector.value) {
        if (config.globalParameters) {
          toolSelector.value.parameters = config.globalParameters.map((param: { param: any; value: any; default: any }) => ({
            name: param.param,
            value: param.value || param.default || '',
            enabled: true
          }))
        } else {
          toolSelector.value.parameters = []
        }
      }
      
      // 清除本地缓存
      localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY)
      
      ElMessage.success('配置文件加载成功')
    } catch (error) {
      console.error('Failed to load config file:', error)
      ElMessage.error('配置文件加载失败')
    }
  }
  
  input.value = ''
}

// 修改文件导出处理函数
const handleFileExport = () => {
  try {
    // 创建要导出的配置副本并排序
    const exportConfig = {
      commands: [...toolConfig.value.commands].sort((a, b) => a.name.localeCompare(b.name)),
      globalParameters: toolConfig.value.globalParameters
    }
    
    const content = yaml.dump(exportConfig)
    const blob = new Blob([content], { type: 'text/yaml' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'tools.yaml'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('配置文件导出成功')
  } catch (error) {
    console.error('Failed to export config:', error)
    ElMessage.error('配置文件导出失败')
  }
}

const commandStepsRef = ref<InstanceType<typeof CommandSteps> | null>(null)

const handleAddToCommandSteps = (command: string, commandPath?: string) => {
  if (commandStepsRef.value) {
    commandStepsRef.value.addCommand(command, commandPath)
    ElMessage.success('命令已添加组合')
    // 如果全局参数栏未显示，则显示
    if (!isParamsVisible.value) {
      isParamsVisible.value = true
    }
  } else {
    console.error('commandStepsRef is null')
  }
}

const handleScrollToCommand = (commandPath: string) => {
  const element = document.getElementById(commandPath)
  if (element) {
    const offset = 20
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
    window.scrollTo({
      top: elementPosition - offset,
      behavior: 'smooth'
    })
    // 更新当前活动命令
    activeCommand.value = commandPath
  }
}

// 修改重置配置的处理函数
const handleResetConfig = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要恢复默认配置吗？当前的配置将会被覆盖。',
      '恢复确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: isDarkMode.value ? 'dark-message-box' : ''
      }
    )

    // 加载默认配置
    const config = await loadConfig()
    toolConfig.value = {
      commands: config.commands || [],
      globalParameters: config.globalParameters || []
    }
    
    // 重置并初始化全局参数
    if (toolSelector.value && config.globalParameters) {
      toolSelector.value.parameters = config.globalParameters.map(param => ({
        name: param.param,
        value: param.value || param.default || '',
        enabled: true
      }))
    }
    
    // 清除本地缓存
    localStorage.removeItem(LOCAL_STORAGE_CONFIG_KEY)
    
    ElMessage.success('恢复默认配置')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to reset config:', error)
      ElMessage.error('恢复默认配置失败')
    }
  }
}

// 修改展开/折叠全部的方法
const isAllExpanded = ref(false)

const toggleAllMenus = () => {
  isAllExpanded.value = !isAllExpanded.value
  const menu = document.querySelector('.command-nav')
  if (menu) {
    // 获取所有子菜单的标题元素
    const subMenuTitles = menu.querySelectorAll('.el-sub-menu__title') as NodeListOf<HTMLElement>
    subMenuTitles.forEach(title => {
      const parent = title.parentElement
      if (parent) {
        const isExpanded = parent.classList.contains('is-opened')
        if (isAllExpanded.value && !isExpanded) {
          // 展开
          title.click()
        } else if (!isAllExpanded.value && isExpanded) {
          // 折叠
          title.click()
        }
      }
    })
  }
}

// 监听配置文件变化时重置展开状态
watch(() => toolConfig.value, () => {
  isAllExpanded.value = false
}, { deep: true })

// 添加状态
const isCommandEditorVisible = ref(false)

// 添加方法
const showCommandEditor = () => {
  isCommandEditorVisible.value = true
}

const handleAddCommand = (command: Command) => {
  if (!toolConfig.value) {
    toolConfig.value = {
      commands: [],
      globalParameters: []
    }
  }
  
  if (!toolConfig.value.commands) {
    toolConfig.value.commands = []
  }
  
  // 添加新命令
  toolConfig.value.commands.push(command)
  
  // 对命令列表进行排序
  toolConfig.value.commands.sort((a, b) => a.name.localeCompare(b.name))
  
  // 关闭命令编辑器
  isCommandEditorVisible.value = false
  
  ElMessage.success('命令添加成功')
}

// 添加处理子命令的方法
const handleAddSubCommand = ({ parentCommand, command }: { parentCommand: string, command: Command }) => {
  if (!toolConfig.value) return

  const parentParts = parentCommand.split('-')
  const parentCommand1 = toolConfig.value.commands.find(cmd => cmd.name === parentParts[0])
  
  if (!parentCommand1) return

  if (parentParts.length === 1) {
    // 添加二级命令
    if (!parentCommand1.subCommands) {
      parentCommand1.subCommands = []
    }
    parentCommand1.subCommands.push(command)
    parentCommand1.subCommands.sort((a, b) => a.name.localeCompare(b.name))
  } else if (parentParts.length === 2) {
    // 添加三级命令
    const parentCommand2 = parentCommand1.subCommands?.find(cmd => cmd.name === parentParts[1])
    if (parentCommand2) {
      if (!parentCommand2.subCommands) {
        parentCommand2.subCommands = []
      }
      parentCommand2.subCommands.push(command)
      parentCommand2.subCommands.sort((a, b) => a.name.localeCompare(b.name))
    }
  }

  ElMessage.success('子命令添加成功')
}

// 添加删除命令的方法
const handleDeleteCommand = (commandPath: string) => {
  if (!toolConfig.value) return

  const parts = commandPath.split('-')
  if (parts.length === 1) {
    // 删除一级命令
    const index = toolConfig.value.commands.findIndex(cmd => cmd.name === parts[0])
    if (index !== -1) {
      toolConfig.value.commands.splice(index, 1)
    }
  } else if (parts.length === 2) {
    // 删除二级命令
    const parentCmd = toolConfig.value.commands.find(cmd => cmd.name === parts[0])
    if (parentCmd && parentCmd.subCommands) {
      const index = parentCmd.subCommands.findIndex(sub => sub.name === parts[1])
      if (index !== -1) {
        parentCmd.subCommands.splice(index, 1)
      }
    }
  } else if (parts.length === 3) {
    // 删除三级命令
    const parentCmd = toolConfig.value.commands.find(cmd => cmd.name === parts[0])
    if (parentCmd && parentCmd.subCommands) {
      const subCmd = parentCmd.subCommands.find(sub => sub.name === parts[1])
      if (subCmd && subCmd.subCommands) {
        const index = subCmd.subCommands.findIndex(sub => sub.name === parts[2])
        if (index !== -1) {
          subCmd.subCommands.splice(index, 1)
        }
      }
    }
  }

  ElMessage.success('命令删除成功')
}

// 添加处理命令更新的方法
const handleUpdateCommand = ({ commandPath, field, value }: { commandPath: string, field: string, value: string }) => {
  if (!toolConfig.value) return

  const parts = commandPath.split('-')
  const command = toolConfig.value.commands.find(cmd => cmd.name === parts[0])
  
  if (!command) return

  if (parts.length === 1) {
    // 更新一级命令
    if (field === 'name') {
      command.name = value
    } else if (field === 'description') {
      command.description = value
    }
  } else if (parts.length === 2) {
    // 更新二级命令
    const subCommand = command.subCommands?.find(sub => sub.name === parts[1])
    if (subCommand) {
      if (field === 'name') {
        subCommand.name = value
      } else if (field === 'description') {
        subCommand.description = value
      }
    }
  } else if (parts.length === 3) {
    // 更新三级命令
    const subCommand = command.subCommands?.find(sub => sub.name === parts[1])
    if (subCommand) {
      const subSubCommand = subCommand.subCommands?.find(sub => sub.name === parts[2])
      if (subSubCommand) {
        if (field === 'name') {
          subSubCommand.name = value
        } else if (field === 'description') {
          subSubCommand.description = value
        }
      }
    }
  }

  ElMessage.success('更新成功')
}

// 添加只读模式态
const isReadOnly = ref(localStorage.getItem('isReadOnly') !== 'false') // 默认为 true

// 监听只读模式变化
const handleReadOnlyChange = (value: boolean) => {
  localStorage.setItem('isReadOnly', value.toString())
}

watch(isDarkMode, (newValue) => {
  if (newValue) {
    document.body.classList.add('dark-mode')
  } else {
    document.body.classList.remove('dark-mode')
  }
}, { immediate: true })  // immediate: true 确保初始化时就执行

// 添加菜单点击处理方法
const handleMenuClick = (commandPath: string) => {

  
  // 先设置活动项
  activeCommand.value = commandPath
 
  
  // 延迟执行滚动，确保 DOM 已更新
  setTimeout(() => {
    const element = document.getElementById(commandPath)
    
    if (element) {
      const headerHeight = 60  // 导航栏高度
      const offset = 20       // 额外偏移量
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset
      
      window.scrollTo({
        top: elementPosition - (headerHeight + offset),
        behavior: 'smooth'
      })
    } else {

    }
  }, 100)
}
</script>

<style>
/* 重置浏览器默认样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

:root {
  --primary-bg: #ffffff;
  --secondary-bg: #f8f9fa;
  --border-color: #dcdfe6;
  --text-primary: #303133;
  --text-secondary: #606266;
  --highlight-bg: #f0f2f5;
}

.dark-mode {
  --primary-bg: #1a1a1a;
  --secondary-bg: #242424;
  --border-color: #4c4c4c;
  --text-primary: #e5eaf3;
  --text-secondary: #a3a6ad;
  --highlight-bg: #2c2c2c;
}

.app-container {
  min-height: 100vh;
  background-color: var(--primary-bg);
  color: var(--text-primary);
  transition: all 0.3s ease;
  width: 100%;
  position: relative;
}

/* 移除 element-plus 容器的默认内边距 */
.el-container {
  padding: 0;
  margin: 0;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  height: 100vh;
  background-color: var(--primary-bg);
  border-right: 1px solid var(--border-color);
  overflow: hidden;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease, left 0.3s ease;
}

.nav-header {
  flex-shrink: 0;
  height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-bg);
}

.command-nav {
  border-right: none;
  background-color: var(--primary-bg);
  padding: 12px 0;
}

.command-nav.is-dark {
  --el-menu-bg-color: var(--primary-bg);
  --el-menu-text-color: var(--text-secondary);
  --el-menu-hover-bg-color: var(--highlight-bg);
  --el-menu-active-color: var(--el-color-primary);
}

.el-main {
  margin-left: 250px;
  padding: 0;
  background-color: var(--primary-bg);
}

.content-container {
  padding: 20px 40px;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 40px;
  align-items: start;
  min-height: 100vh;
}

.global-params-section {
  position: sticky;
  top: 20px;
  height: fit-content;
  transition: all 0.3s ease;
}

/* 确保固定定在暗色模式下正常工作 */
.dark-mode .global-params-section {
  background-color: var(--primary-bg);
}

.global-params-card {
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.global-params-header {
  padding: 16px 20px;
  background-color: var(--highlight-bg);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--text-primary);
}

.global-params-desc {
  padding: 12px 20px;
  color: var(--text-secondary);
  font-size: 14px;
  border-bottom: 1px solid var(--border-color);
}

.commands-section {
  min-width: 0;
}

/* 暗色模式下的表格样式 */
.dark-mode .el-table {
  --el-table-bg-color: var(--secondary-bg);
  --el-table-tr-bg-color: var(--secondary-bg);
  --el-table-header-bg-color: var(--highlight-bg);
  --el-table-border-color: var(--border-color);
  --el-table-text-color: var(--text-primary);
  --el-table-header-text-color: var(--text-primary);
  /* 添加选中行的背景色和文字颜色 */
  --el-table-row-hover-bg-color: var(--el-color-primary-light-9);
  --el-table-current-row-bg-color: var(--el-color-primary-light-9);
}

.dark-mode .el-table th,
.dark-mode .el-table td {
  border-bottom-color: var(--border-color);
}

/* 暗色模式下的输入框样式 */
.dark-mode .el-input__wrapper {
  background-color: var(--primary-bg);
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
}

.dark-mode .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

.dark-mode .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

/* 暗色模式下的输入框文字颜色 */
.dark-mode .el-input__inner {
  color: var(--text-primary) !important;
}

/* 暗色模式下表格选中行的样式 */
.dark-mode .el-table tr.current-row > td.el-table__cell {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.dark-mode .el-table tbody tr:hover > td.el-table__cell {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 响应式布局调整 */
@media (max-width: 1400px) {
  .content-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .global-params-section {
    position: relative;
    top: 0;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px !important;
  }

  .el-main {
    margin-left: 200px;
  }

  .content-container {
    padding: 20px;
  }
}

.el-container {
  display: flex;
  min-height: 100vh;
}

/* 左侧导航 */
.sidebar {
  position: fixed;
  height: 100vh;
  background-color: var(--primary-bg);
  border-right: 1px solid var(--border-color);
  overflow-y: auto;
  z-index: 1000;
}

/* 全局参数栏 */
.global-params-aside {
  position: fixed;
  left: 250px;
  height: 100vh;
  background-color: var(--primary-bg);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 900;
  transition: width 0.3s ease, left 0.3s ease;
}

.global-params-wrapper {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px;
}

/* 内容区 */
.main-content {
  margin-left: 550px; /* 250px + 300px */
  padding: 20px 40px;
  background-color: var(--primary-bg);
  min-height: 100vh;
  transition: margin-left 0.05s ease;
  border-left: 1px solid var(--border-color);
  transition: margin-left 0.3s ease;
}

/* 命令部分样式 */
.command-section {
  margin-bottom: 30px;
  scroll-margin-top: 20px;
}

.command-section h3 {
  margin: 0;
  color: var(--text-primary);
  font-size: 24px;
}

.command-desc {
  color: var(--text-secondary);
  margin: 10px 0;
  font-size: 16px;
  line-height: 1.6;
}

/* 响应式布局 */
@media (max-width: 1400px) {
  .global-params-aside {
    position: relative;
    left: 250px;
    height: auto;
    min-height: 200px;
  }

  .global-params-wrapper {
    max-height: calc(100vh - 80px);
  }

  .resizer {
    display: none;
  }

  .main-content {
    margin-left: 250px !important;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: 200px !important;
  }

  .global-params-aside {
    left: 200px;
  }

  .main-content {
    margin-left: 200px;
    padding: 20px;
  }
}

/* 拖拽整器样式 */
.resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 5px;
  height: 100%;
  background-color: var(--border-color);
  cursor: col-resize;
  transition: background-color 0.3s;
  z-index: 1000;
}

.resizer:hover,
.resizer:active {
  background-color: var(--el-color-primary);
}

/* 控栏样式 */
.nav-control,
.params-control {
  position: relative;
  bottom: auto;
  left: auto;
  right: auto;
  flex-shrink: 0;
  height: 40px;
  background-color: var(--highlight-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 1000;
}

.nav-control:hover,
.params-control:hover {
  background-color: var(--el-color-primary-light-9);
}

.nav-control .el-icon,
.params-control .el-icon {
  font-size: 20px;
  color: var(--text-secondary);
  transition: transform 0.3s ease;
}

.nav-control .is-collapsed,
.params-control .is-collapsed {
  transform: rotate(180deg);
}

/* 调整侧边栏样式以适应底部控制栏 */
.sidebar,
.global-params-aside {
  padding-bottom: 0;
}

/* 过渡动画 */
.sidebar,
.global-params-aside {
  transition: width 0.3s ease, left 0.3s ease;
}

.main-content {
  transition: margin-left 0.3s ease;
}

/* 响应式调整 */
@media (max-width: 1400px) {
  .nav-control,
  .params-control {
    display: none;
  }

  .sidebar,
  .global-params-aside {
    padding-bottom: 0;
  }
}

/* 修改浮动按钮组样式 */
.float-controls {
  position: fixed;
  left: 20px; /* 增加左距离 */
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px; /* 增加按钮间距 */
  z-index: 2000;
  transition: all 0.3s ease;
}

.float-controls.all-hidden {
  left: 10px;
}

.float-btn {
  width: 36px; /* 稍微调小按钮尺寸 */
  height: 36px;
  background-color: var(--secondary-bg); /* 用主题变量 */
  border: 1px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--text-secondary); /* 使用题文字颜色 */
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.05);
}

.float-btn:hover {
  background-color: var(--highlight-bg);
  color: var(--el-color-primary);
  transform: translateX(5px);
}

.float-btn .el-icon {
  font-size: 18px;
}

/* 暗色模式适配 */
.dark-mode .float-btn {
  background-color: var(--secondary-bg);
  border-color: var(--border-color);
  color: var(--text-secondary);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.2);
}

.dark-mode .float-btn:hover {
  background-color: var(--highlight-bg);
  color: var(--el-color-primary);
}

/* 调整主内容区域左边距 */
.main-content {
  padding: 20px 40px 20px 60px; /* 增加左侧内边距，为浮动按钮留空间 */
}

/* 响应式调整 */
@media (max-width: 768px) {
  .float-controls {
    top: auto;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: row;
  }

  .float-controls.all-hidden {
    left: 50%;
  }

  .float-btn:hover {
    transform: translateY(-5px);
  }

  .main-content {
    padding: 20px; /* 移动端恢复正常内边距 */
  }
}

/* 添加锚点样式 */
.command-anchor {
  position: relative;
  top: -20px;
  visibility: hidden;
}

/* 优化子菜单标的点击区域 */
.el-sub-menu__title span {
  cursor: pointer;
  display: inline-block;
  width: 100%;
  height: 100%;
}

.el-sub-menu__title span:hover {
  color: var(--el-color-primary);
}

/* 确保子菜单展开时菜单保持高亮 */
.el-menu-item.is-active,
.el-sub-menu.is-active > .el-sub-menu__title span {
  color: var(--el-color-primary) !important;
}

/* 文件操作按钮组样式 */
.file-operations {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-bg);
}

/* 创建一个按钮组容器 */
.file-operations-group {
  display: flex;
  align-items: center;
  padding: 2px;
  gap: 2px;
}

/* 整按钮样式 */
.file-op-btn {
  padding: 6px !important;
  height: 28px !important;
  width: 28px !important;
  margin: 0 !important;
  border-radius: 4px !important;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.file-op-btn:hover {
  color: var(--el-color-primary);
  background-color: var(--highlight-bg);
  transform: translateY(-1px);
}

/* 分隔线样式 */
.file-operations .el-divider--vertical {
  height: 14px;
  margin: 0 8px;
  border-color: var(--border-color);
}

/* 全参数删除按钮样式 */
.param-delete-btn {
  opacity: 0;
  transition: all 0.3s ease;
  padding: 4px !important;
  height: 24px !important;
  width: 24px !important;
  margin-left: -24px;  /* 让按钮悬浮在输入框上 */
}

.param-delete-btn .el-icon {
  font-size: 14px !important;
}

/* 鼠标悬浮时显示删除按钮 */
.param-item:hover .param-delete-btn {
  opacity: 1;
}

/* 暗色模式适配 */
.dark-mode .param-delete-btn {
  color: var(--text-secondary) !important;
}

.dark-mode .param-delete-btn:hover {
  color: var(--el-color-danger) !important;
  background-color: var(--highlight-bg) !important;
}

/* 导航菜单式优化 */
.command-nav {
  border-right: none;
  background-color: var(--primary-bg);
  padding: 12px 0;
}

/* 级菜单项 */
.command-nav .el-menu-item,
.command-nav .el-sub-menu__title {
  height: 40px;
  line-height: 40px;
  padding: 0 16px !important;
  margin: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
}

/* 二级菜单项 */
.command-nav .el-menu--inline .el-menu-item,
.command-nav .el-menu--inline .el-sub-menu__title {
  padding-left: 36px !important;
  height: 36px;
  line-height: 36px;
  font-size: 13px;
}

/* 三级菜单项 */
.command-nav .el-menu--inline .el-menu--inline .el-menu-item {
  padding-left: 56px !important;
  height: 32px;
  line-height: 32px;
  font-size: 13px;
}

/* 菜单项悬浮和选中状态 */
.command-nav .el-menu-item:hover,
.command-nav .el-sub-menu__title:hover {
  background-color: var(--highlight-bg) !important;
}

.command-nav .el-menu-item.is-active {
  background-color: var(--el-color-primary-light-9) !important;
  color: var(--el-color-primary) !important;
  font-weight: 500;
}

/* 子菜单图标 */
.command-nav .el-sub-menu__icon-arrow {
  right: 15px;
  font-size: 12px;
  transition: transform 0.3s;
}

/* 展开的子菜单 */
.command-nav .el-menu--inline {
  background-color: var(--secondary-bg);
  margin: 4px 0;
  padding: 4px 0;
}

/* 暗色模式适配 */
.command-nav.is-dark {
  --el-menu-bg-color: var(--primary-bg);
  --el-menu-text-color: var(--text-secondary);
  --el-menu-hover-bg-color: var(--highlight-bg);
  --el-menu-active-color: var(--el-color-primary);
}

.dark-mode .command-nav .el-menu-item.is-active {
  background-color: var(--highlight-bg) !important;
}

/* 导航分组 */
.command-nav .el-sub-menu {
  margin: 4px 0;
}

/* 导航分组标题 */
.command-nav .el-sub-menu__title {
  font-weight: 500;
}

/* 添加滚动条样式 */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

.sidebar::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 导航栏头部样式优化 */
.nav-header {
  height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-bg);
}

.nav-header span {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
}

/* 导航菜单容器 */
.command-nav-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 导航栏头部固定 */
.nav-header {
  flex-shrink: 0;
  height: 60px;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-bg);
}

/* 文件操作区域固定 */
.file-operations {
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--border-color);
  background-color: var(--primary-bg);
}

/* 部控制栏固定 */
.nav-control {
  flex-shrink: 0;
  height: 40px;
  background-color: var(--highlight-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 动条样式 */
.command-nav-container::-webkit-scrollbar {
  width: 6px;
}

.command-nav-container::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 3px;
}

.command-nav-container::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 全局参数栏的滚动条样式 */
.global-params-wrapper::-webkit-scrollbar {
  width: 4px; /* 更细的滚动条 */
}

.global-params-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
  border-radius: 2px;
  transition: background-color 0.3s;
}

.global-params-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-secondary); /* 悬浮时颜色加深 */
}

.global-params-wrapper::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 暗色模式下的滚动条样式 */
.dark-mode .global-params-wrapper::-webkit-scrollbar-thumb {
  background-color: var(--border-color);
}

.dark-mode .global-params-wrapper::-webkit-scrollbar-thumb:hover {
  background-color: var(--text-secondary);
}

/* 确保滚动条不占用内容空间 */
.global-params-wrapper {
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: var(--border-color) transparent; /* Firefox */
}

/* 添加导航控制样式 */
.nav-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* 调整开关组件样式 */
.nav-controls .el-switch {
  --el-switch-on-color: var(--el-color-primary);
}
</style> 