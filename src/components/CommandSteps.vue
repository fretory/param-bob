<template>
  <div class="command-steps" :class="{ 'is-dark': isDark }">
    <div class="steps-header" @click="toggleCollapse">
      <div class="header-left">
        <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed }">
          <ArrowRight />
        </el-icon>
        <span>命令组合预览</span>
      </div>
      <div class="header-actions">
        <el-button 
          type="primary" 
          link 
          :icon="Plus"
          @click.stop="addStep"
        >
          新增步骤
        </el-button>
        <el-button 
          type="primary" 
          link 
          :icon="CopyDocument"
          @click.stop="copyAllSteps"
        >
          复制全部
        </el-button>
        <el-button 
          type="danger" 
          link 
          :icon="Delete"
          @click.stop="confirmClearAll"
        >
          清空
        </el-button>
      </div>
    </div>
    
    <div class="steps-container" v-show="!isCollapsed">
      <div v-if="steps.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Document /></el-icon>
        <p class="empty-text">暂无命令步骤</p>
        <el-button 
          type="primary" 
          link 
          @click="addStep"
        >
          添加第一个步骤
        </el-button>
      </div>
      <draggable 
        v-else
        v-model="steps"
        item-key="id"
        handle=".drag-handle"
        :animation="300"
      >
        <template #item="{ element, index }">
          <div class="step-item">
            <div class="step-header">
              <div class="step-left">
                <el-icon class="drag-handle"><Operation /></el-icon>
                <div 
                  v-if="editingTitleIndex !== index"
                  class="step-number"
                  @dblclick="startTitleEdit(index)"
                >
                  {{ element.title || `步骤 ${index + 1}` }}
                </div>
                <el-input
                  v-else
                  v-model="element.title"
                  size="small"
                  class="title-input"
                  ref="titleInput"
                  @blur="finishTitleEdit"
                  @keyup.enter="finishTitleEdit"
                  @keyup.esc="finishTitleEdit"
                />
              </div>
              <div class="step-actions">
                <el-button 
                  type="primary" 
                  link 
                  :icon="CopyDocument"
                  @click="copyStep(index)"
                />
                <el-tooltip 
                  v-if="element.commandPath"
                  content="跳转到命令" 
                  placement="top"
                >
                  <el-button 
                    type="primary" 
                    link 
                    :icon="Position"
                    @click="jumpToCommand(element.commandPath)"
                  />
                </el-tooltip>
                <el-button 
                  type="danger" 
                  link 
                  :icon="Delete"
                  @click="removeStep(index)"
                />
              </div>
            </div>
            <div 
              class="step-content" 
              @dblclick="startEdit(index)"
              v-if="editingIndex !== index"
            >
              {{ element.command }}
            </div>
            <el-input
              v-else
              v-model="element.command"
              type="textarea"
              :rows="2"
              @blur="finishEdit"
              ref="editInput"
              @keydown.enter.prevent="finishEdit"
            />
          </div>
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { ArrowRight, Plus, CopyDocument, Delete, Operation, Document, Position } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import draggable from 'vuedraggable'

defineProps<{
  isDark?: boolean
}>()

interface Step {
  id: string;
  title?: string;
  command: string;
  commandPath?: string;
}

const isCollapsed = ref(false)
const steps = ref<Step[]>([])
const editingIndex = ref<number | null>(null)
const editInput = ref<HTMLElement | null>(null)
const editingTitleIndex = ref<number | null>(null)
const titleInput = ref<HTMLElement | null>(null)

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

const addStep = () => {
  steps.value.push({ 
    id: Date.now().toString(),
    title: '',
    command: '在此输入命令...' 
  })
}

const removeStep = (index: number) => {
  steps.value.splice(index, 1)
}

const startEdit = async (index: number) => {
  editingIndex.value = index
  await nextTick()
  editInput.value?.focus()
}

const finishEdit = () => {
  editingIndex.value = null
}

const copyStep = async (index: number) => {
  try {
    await navigator.clipboard.writeText(steps.value[index].command)
    ElMessage({
      message: '命令已复制',
      type: 'success'
    })
  } catch (err) {
    ElMessage({
      message: '复制失败',
      type: 'error'
    })
  }
}

const copyAllSteps = async () => {
  try {
    const allCommands = steps.value
      .map((step, index) => `# 步骤 ${index + 1}\n${step.command}`)
      .join('\n\n')
    await navigator.clipboard.writeText(allCommands)
    ElMessage({
      message: '所有命令已复制',
      type: 'success'
    })
  } catch (err) {
    ElMessage({
      message: '复制失败',
      type: 'error'
    })
  }
}

const startTitleEdit = async (index: number) => {
  editingTitleIndex.value = index
  await nextTick()
  titleInput.value?.focus()
}

const finishTitleEdit = () => {
  editingTitleIndex.value = null
}

const confirmClearAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有步骤吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    steps.value = []
    ElMessage({
      type: 'success',
      message: '已清空所有步骤'
    })
  } catch {
    // 用户取消操作
  }
}

const addCommand = (command: string, commandPath?: string) => {
  steps.value.push({
    id: Date.now().toString(),
    command,
    title: '',
    commandPath
  })
}

const emit = defineEmits(['scrollToCommand'])

const jumpToCommand = (commandPath: string) => {
  if (commandPath) {
    emit('scrollToCommand', commandPath)
  }
}

defineExpose({
  addCommand
})

watch(steps, (newSteps) => {
  localStorage.setItem('commandSteps', JSON.stringify(newSteps))
}, { deep: true })

onMounted(() => {
  const savedSteps = localStorage.getItem('commandSteps')
  if (savedSteps) {
    try {
      steps.value = JSON.parse(savedSteps)
    } catch (e) {
      console.error('Failed to load saved steps:', e)
    }
  }
})
</script>

<style scoped>
.command-steps {
  margin-top: 20px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.steps-header {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.collapse-icon {
  transition: transform 0.3s ease;
}

.collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

.steps-container {
  padding: 20px;
}

.step-item {
  margin-bottom: 16px;
  padding: 12px;
  background-color: var(--primary-bg);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.step-number {
  font-weight: 500;
  color: var(--text-primary);
  cursor: text;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.3s ease;
}

.step-number:hover {
  background-color: var(--highlight-bg);
}

.step-actions {
  display: flex;
  gap: 8px;
}

.step-content {
  padding: 8px;
  background-color: var(--highlight-bg);
  border-radius: 4px;
  color: var(--text-primary);
  font-family: monospace;
  cursor: text;
  min-height: 40px;
  white-space: pre-wrap;
  word-break: break-all;
  border: 1px solid transparent;
  transition: all 0.3s ease;
}

.step-content:hover {
  border-color: var(--border-color);
}

:deep(.el-input__wrapper) {
  background-color: var(--highlight-bg);
  box-shadow: 0 0 0 1px var(--border-color) inset !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset !important;
}

:deep(.el-input__inner),
:deep(.el-textarea__inner) {
  color: var(--text-primary);
  background-color: var(--highlight-bg);
}

:deep(.el-textarea__inner) {
  background-color: var(--highlight-bg);
  border-color: var(--border-color);
}

:deep(.el-textarea__inner:hover) {
  border-color: var(--el-color-primary);
}

:deep(.el-textarea__inner:focus) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.step-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.drag-handle {
  cursor: move;
  color: var(--text-secondary);
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.drag-handle:hover {
  background-color: var(--highlight-bg);
  color: var(--el-color-primary);
}

.sortable-ghost {
  opacity: 0.5;
  background-color: var(--highlight-bg);
}

.sortable-drag {
  opacity: 0.9;
}

.title-input {
  width: 150px;
}

:deep(.title-input .el-input__wrapper) {
  padding: 0 8px;
  background-color: var(--highlight-bg);
}

:deep(.title-input .el-input__inner) {
  height: 28px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
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
</style> 