<template>
  <el-dialog
    v-model="dialogVisible"
    :title="'新增命令'"
    width="80%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="command-editor"
  >
    <div class="editor-container">
      <!-- 基本信息部分 -->
      <div class="form-section">
        <el-form
          ref="formRef"
          :model="commandForm"
          :rules="rules"
          label-width="100px"
          label-position="right"
        >
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="命令名称" prop="name">
                <el-input v-model="commandForm.name" placeholder="请输入命令名称" />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item label="标签" prop="tags">
                <el-select
                  v-model="commandForm.tags"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="请选择或创建标签"
                  class="tag-select"
                >
                  <el-option
                    v-for="tag in existingTags"
                    :key="tag"
                    :label="tag"
                    :value="tag"
                  />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="命令描述" prop="description">
            <el-input
              v-model="commandForm.description"
              type="textarea"
              :rows="2"
              placeholder="请输入命令描述"
            />
          </el-form-item>
        </el-form>
      </div>

      <!-- 参数列表部分 -->
      <div class="params-section">
        <div class="section-header">
          <div class="section-title">参数列表</div>
          <el-button type="primary" :icon="Plus" @click="addParameter" size="small">
            添加参数
          </el-button>
        </div>
        
        <div class="params-table-wrapper">
          <el-table :data="commandForm.parameters" border style="width: 100%">
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button
                  type="danger"
                  :icon="Delete"
                  circle
                  size="small"
                  @click="removeParameter($index)"
                />
              </template>
            </el-table-column>
            <el-table-column label="参数名称" prop="param" min-width="150">
              <template #header>
                <span class="required-column">参数名称</span>
              </template>
              <template #default="scope">
                <el-input 
                  v-model="scope.row.param" 
                  placeholder="参数名称（必填）"
                  :validate-event="false"
                />
              </template>
            </el-table-column>
            <el-table-column label="类型" width="120">
              <template #default="scope">
                <el-select v-model="scope.row.type" placeholder="类型">
                  <el-option label="string" value="string" />
                  <el-option label="number" value="number" />
                  <el-option label="boolean" value="boolean" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="描述" min-width="200">
              <template #header>
                <span class="required-column">描述</span>
              </template>
              <template #default="scope">
                <el-input 
                  v-model="scope.row.description" 
                  placeholder="参数描述（必填）"
                />
              </template>
            </el-table-column>
            <el-table-column label="默认值" min-width="150">
              <template #default="scope">
                <el-input 
                  v-model="scope.row.default" 
                  placeholder="默认值（可选）"
                />
              </template>
            </el-table-column>
            <el-table-column label="必填" width="80" align="center">
              <template #default="scope">
                <el-switch v-model="scope.row.required" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.editor-container {
  height: calc(80vh - 150px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  flex-shrink: 0;
  padding: 20px;
  border-radius: 8px;
}

.params-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: 8px;
  padding: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 500;
  padding-left: 12px;
  border-left: 3px solid var(--el-color-primary);
}

.params-table-wrapper {
  flex: 1;
  overflow-y: auto;
  border-radius: 4px;
}

/* 必填列的标题样式 */
.required-column {
  position: relative;
  padding-right: 12px;
}

.required-column::after {
  content: '*';
  color: var(--el-color-danger);
  margin-left: 4px;
  font-size: 14px;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
</style>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Command } from '../types/config'
import { useDark } from '@vueuse/core'

const isDark = useDark()

const props = defineProps<{
  visible: boolean
  isDark?: boolean
  existingCommands?: Command[]
}>()

const emit = defineEmits(['update:visible', 'submit'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const formRef = ref<FormInstance>()

// 从现有命令中提取所有标签
const existingTags = computed(() => {
  const tags = new Set<string>()
  props.existingCommands?.forEach(cmd => {
    cmd.tags?.forEach(tag => tags.add(tag))
  })
  return Array.from(tags)
})

const commandForm = ref({
  name: '',
  description: '',
  tags: [] as string[],
  parameters: [] as any[]
})

const rules = {
  name: [
    { required: true, message: '请输入命令名称', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9-]*$/, message: '命令名称只能包含小写字母、数字和横杠，且必须以字母开头', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入命令描述', trigger: 'blur' }
  ]
}

const addParameter = () => {
  commandForm.value.parameters.push({
    param: '',
    type: 'string',
    description: '',
    required: false,
    default: '',
    value: '',
    enabled: true
  })
}

const removeParameter = (index: number) => {
  commandForm.value.parameters.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    // 验证基本表单
    await formRef.value.validate()
    
    // 验证参数列表
    if (commandForm.value.parameters.length > 0) {
      const invalidParams = commandForm.value.parameters.filter(param => 
        !param.param.trim() || !param.description.trim()
      )
      
      if (invalidParams.length > 0) {
        ElMessage.error('参数名称和描述不能为空')
        return
      }
    }
    
    // 清理参数中的空白字符
    const cleanedParams = commandForm.value.parameters.map(param => ({
      ...param,
      param: param.param.trim(),
      description: param.description.trim(),
      type: param.type || 'string'
    }))
    
    emit('submit', {
      name: commandForm.value.name.trim(),
      description: commandForm.value.description.trim(),
      tags: commandForm.value.tags,
      parameters: cleanedParams
    })
    
    dialogVisible.value = false
    resetForm()
  } catch (error) {
    console.error('Validation failed:', error)
  }
}

const handleCancel = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  commandForm.value = {
    name: '',
    description: '',
    tags: [],
    parameters: []
  }
}
</script> 