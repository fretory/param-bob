/**
 * MainCommand 组件
 * 
 * 该组件负责渲染命令的详细信息，包括：
 * 1. 命令的基本信息（标题、描述、标签等）
 * 2. 命令的参数列表
 * 3. 子命令的管理
 * 4. 命令的预览功能
 * 
 * 组件支持三级命令结构：
 * - 一级命令（主命令）
 * - 二级命令（子命令）
 * - 三级命令（孙命令）
 * 
 * @props {Command} command - 当前命令对象
 * @props {Array} globalParameters - 全局参数列表
 * @props {boolean} isDark - 是否为暗色模式
 * @props {Array} existingCommands - 现有的所有命令列表
 * @props {boolean} isReadOnly - 是否为只读模式
 * 
 * @emits addToCommandSteps - 添加到命令步骤
 * @emits addSubCommand - 添加子命令
 * @emits deleteCommand - 删除命令
 * @emits updateCommand - 更新命令
 */

<template>
  <div class="main-command">
    <!-- 一级命令标题区 -->
    <div class="command-section-header">
      <div class="command-title-group">
        <el-icon class="collapse-icon" :class="{ 'is-collapsed': isCollapsed(command.name) }" @click="toggleCommand(command.name)">
          <ArrowRight />
        </el-icon>
        <div class="editable-title" v-if="editingTitle === command.name">
          <el-input
            v-model="editingValue"
            size="small"
            @keyup.enter="confirmEdit"
            @blur="confirmEdit"
            ref="titleInputRef"
          />
        </div>
        <div v-else class="title-wrapper">
          <h2 class="command-title">{{ command.name }}</h2>
          <el-tooltip content="复制链接" placement="top">
            <el-button
              class="link-btn"
              type="primary"
              link
              :icon="Link"
              @click.stop="copyLink(command.name)"
            />
          </el-tooltip>
          <el-button
            v-if="!isReadOnly"
            class="edit-btn"
            type="primary"
            link
            :icon="Edit"
            @click.stop="startEdit(command.name, command.name, 'title')"
          />
        </div>
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
        <div class="command-actions" v-if="!isReadOnly">
          <el-button
            type="primary"
            link
            :icon="Plus"
            @click.stop="showAddSubCommand(command.name)"
          >
            新增子命令
          </el-button>
          <el-button
            type="danger"
            link
            :icon="Delete"
            @click.stop="confirmDelete(command.name)"
          >
            删除命令
          </el-button>
        </div>
      </div>
    </div>

    <!-- 命令内容区 -->
    <div v-show="!isCollapsed(command.name)" class="command-content">
      <div class="description-wrapper">
        <div class="command-description" 
          v-if="editingTitle !== `${command.name}-desc`"
          @dblclick="!isReadOnly && startEdit(command.name, command.description || '', 'description')"
        >
          {{ command.description }}
          <el-button
            v-if="!isReadOnly"
            class="edit-btn"
            type="primary"
            link
            :icon="Edit"
            @click.stop="startEdit(command.name, command.description || '', 'description')"
          />
        </div>
        <div v-else class="editable-description">
          <el-input
            v-model="editingValue"
            type="textarea"
            :rows="3"
            @keyup.enter="confirmEdit"
            @blur="confirmEdit"
            ref="descInputRef"
          />
        </div>
      </div>
      
      <!-- 一级命令参数区 -->
      <div class="command-params-section">
        <div class="section-title">
          命令参数
          <el-button
            v-if="!isReadOnly"
            class="add-param-btn"
            type="primary"
            link
            :icon="Plus"
            @click="handleAddParameter(command)"
          >
            新增参数
          </el-button>
        </div>
        <div class="params-table">
          <el-table :data="command.parameters || []" border>
            <el-table-column width="50">
              <template #default="scope">
                <el-checkbox
                  v-model="scope.row.enabled"
                  :disabled="scope.row.required"
                />
              </template>
            </el-table-column>
            <el-table-column v-if="!isReadOnly" width="50">
              <template #default="scope">
                <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  @click="handleDeleteParameter(command, scope.$index)"
                />
              </template>
            </el-table-column>
            <el-table-column label="param">
              <template #default="scope">
                <div v-if="editingParam === `${command.name}-${scope.row.param}`">
                  <el-input 
                    v-model="editingValue"
                    size="small"
                    @keyup.enter="confirmParamEdit(scope.row)"
                    @blur="confirmParamEdit(scope.row)"
                  />
                </div>
                <div v-else class="param-cell">
                  {{ scope.row.param }}
                  <el-button
                    v-if="!isReadOnly"
                    class="edit-btn"
                    type="primary"
                    link
                    :icon="Edit"
                    @click.stop="startParamEdit(`${command.name}-${scope.row.param}`, scope.row.param, 'param', scope.row)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="type">
              <template #default="scope">
                <div v-if="editingParam === `${command.name}-${scope.row.param}-type`">
                  <el-select 
                    v-model="editingValue"
                    size="small"
                    @change="confirmParamEdit(scope.row)"
                    @blur="confirmParamEdit(scope.row)"
                  >
                    <el-option label="string" value="string" />
                    <el-option label="number" value="number" />
                    <el-option label="boolean" value="boolean" />
                  </el-select>
                </div>
                <div v-else class="param-cell">
                  {{ scope.row.type }}
                  <el-button
                    v-if="!isReadOnly"
                    class="edit-btn"
                    type="primary"
                    link
                    :icon="Edit"
                    @click.stop="startParamEdit(`${command.name}-${scope.row.param}-type`, scope.row.type, 'type', scope.row)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="description">
              <template #default="scope">
                <div v-if="editingParam === `${command.name}-${scope.row.param}-desc`">
                  <el-input 
                    v-model="editingValue"
                    size="small"
                    @keyup.enter="confirmParamEdit(scope.row)"
                    @blur="confirmParamEdit(scope.row)"
                  />
                </div>
                <div v-else class="param-cell">
                  {{ scope.row.description }}
                  <el-button
                    v-if="!isReadOnly"
                    class="edit-btn"
                    type="primary"
                    link
                    :icon="Edit"
                    @click.stop="startParamEdit(`${command.name}-${scope.row.param}-desc`, scope.row.description, 'description', scope.row)"
                  />
                </div>
              </template>
            </el-table-column>
            <el-table-column label="required" width="100">
              <template #default="scope">
                <template v-if="isReadOnly">
                  <span>{{ scope.row.required ? 'Yes' : 'No' }}</span>
                </template>
                <template v-else>
                  <el-switch 
                    v-model="scope.row.required"
                    @change="handleParamRequiredChange(scope.row)"
                  />
                </template>
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
          :global-parameters="globalParameters"
          :command-path="command.name"
          :command-template="command.template"
          :inherited-parameters="[]"
          :command-parameters="[
            ...(command.globalParams || []),
            ...(command.parameters || [])
          ]"
          :is-dark="isDark"
          @clear-current="clearCurrentCommand"
          @go-to-parent="() => handleGoToParent(command.name)"
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
            <div class="sub-command-header">
              <div class="sub-command-title-group">
                <el-icon 
                  class="collapse-icon" 
                  :class="{ 'is-collapsed': isCollapsed(`${command.name}-${subCmd.name}`) }"
                  @click.stop="toggleCommand(`${command.name}-${subCmd.name}`)"
                >
                  <ArrowRight />
                </el-icon>
                <div class="title-wrapper">
                  <h3 class="sub-command-title" @click.stop="scrollToCommand(`${command.name}-${subCmd.name}`)">
                    {{ command.name }} {{ subCmd.name }}
                  </h3>
                  <el-tooltip content="复制链接" placement="top">
                    <el-button
                      class="link-btn"
                      type="primary"
                      link
                      :icon="Link"
                      @click.stop="copyLink(`${command.name}-${subCmd.name}`)"
                    />
                  </el-tooltip>
                  <el-button
                    v-if="!isReadOnly"
                    class="edit-btn"
                    type="primary"
                    link
                    :icon="Edit"
                    @click.stop="startEdit(`${command.name}-${subCmd.name}`, subCmd.name, 'title')"
                  />
                </div>
                <div class="command-actions" v-if="!isReadOnly">
                  <el-button
                    type="primary"
                    link
                    :icon="Plus"
                    @click.stop="showAddSubCommand(`${command.name}-${subCmd.name}`)"
                  >
                    新增子命令
                  </el-button>
                  <el-button
                    type="danger"
                    link
                    :icon="Delete"
                    @click.stop="confirmDelete(`${command.name}-${subCmd.name}`)"
                  >
                    删除命令
                  </el-button>
                </div>
              </div>
            </div>

            <div v-show="!isCollapsed(`${command.name}-${subCmd.name}`)" class="sub-command-content">
              <div class="command-description" 
                @dblclick="startEdit(`${command.name}-${subCmd.name}`, subCmd.description, 'description')" 
                v-if="editingTitle !== `${command.name}-${subCmd.name}-desc`"
              >
                {{ subCmd.description }}
              </div>
              <div v-else class="editable-description">
                <el-input
                  v-model="editingValue"
                  type="textarea"
                  :rows="3"
                  @keyup.enter="confirmEdit"
                  @blur="confirmEdit"
                  ref="descInputRef"
                />
              </div>
              
              <!-- 二级命令参数 -->
              <div class="params-table">
                <div class="section-title">
                  命令参数
                  <el-button
                    v-if="!isReadOnly"
                    class="add-param-btn"
                    type="primary"
                    link
                    :icon="Plus"
                    @click="handleAddParameter(subCmd)"
                  >
                    新增参数
                  </el-button>
                </div>
                <div class="params-table">
                  <el-table :data="subCmd.parameters || []" border>
                    <el-table-column width="50">
                      <template #default="scope">
                        <el-checkbox
                          v-model="scope.row.enabled"
                          :disabled="scope.row.required"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column v-if="!isReadOnly" width="50">
                      <template #default="scope">
                        <el-button
                          type="danger"
                          link
                          :icon="Delete"
                          @click="handleDeleteParameter(subCmd, scope.$index)"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="param">
                      <template #default="scope">
                        <div v-if="editingParam === `${command.name}-${subCmd.name}-${scope.row.param}`">
                          <el-input 
                            v-model="editingValue"
                            size="small"
                            @keyup.enter="confirmParamEdit(scope.row)"
                            @blur="confirmParamEdit(scope.row)"
                          />
                        </div>
                        <div v-else class="param-cell">
                          {{ scope.row.param }}
                          <el-button
                            v-if="!isReadOnly"
                            class="edit-btn"
                            type="primary"
                            link
                            :icon="Edit"
                            @click.stop="startParamEdit(`${command.name}-${subCmd.name}-${scope.row.param}`, scope.row.param, 'param', scope.row)"
                          />
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="type">
                      <template #default="scope">
                        <div v-if="editingParam === `${command.name}-${subCmd.name}-${scope.row.param}-type`">
                          <el-select 
                            v-model="editingValue"
                            size="small"
                            @change="confirmParamEdit(scope.row)"
                            @blur="confirmParamEdit(scope.row)"
                          >
                            <el-option label="string" value="string" />
                            <el-option label="number" value="number" />
                            <el-option label="boolean" value="boolean" />
                          </el-select>
                        </div>
                        <div v-else class="param-cell">
                          {{ scope.row.type }}
                          <el-button
                            v-if="!isReadOnly"
                            class="edit-btn"
                            type="primary"
                            link
                            :icon="Edit"
                            @click.stop="startParamEdit(`${command.name}-${subCmd.name}-${scope.row.param}-type`, scope.row.type, 'type', scope.row)"
                          />
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="description">
                      <template #default="scope">
                        <div v-if="editingParam === `${command.name}-${subCmd.name}-${scope.row.param}-desc`">
                          <el-input 
                            v-model="editingValue"
                            size="small"
                            @keyup.enter="confirmParamEdit(scope.row)"
                            @blur="confirmParamEdit(scope.row)"
                          />
                        </div>
                        <div v-else class="param-cell">
                          {{ scope.row.description }}
                          <el-button
                            v-if="!isReadOnly"
                            class="edit-btn"
                            type="primary"
                            link
                            :icon="Edit"
                            @click.stop="startParamEdit(`${command.name}-${subCmd.name}-${scope.row.param}-desc`, scope.row.description, 'description', scope.row)"
                          />
                        </div>
                      </template>
                    </el-table-column>
                    <el-table-column label="required" width="100">
                      <template #default="scope">
                        <template v-if="isReadOnly">
                          <span>{{ scope.row.required ? 'Yes' : 'No' }}</span>
                        </template>
                        <template v-else>
                          <el-switch 
                            v-model="scope.row.required"
                            @change="handleParamRequiredChange(scope.row)"
                          />
                        </template>
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

                <!-- 二级命令预览 -->
                <command-preview 
                  :global-parameters="globalParameters"
                  :command-path="`${command.name} ${subCmd.name}`"
                  :inherited-parameters="[
                    ...(command.globalParams || []),
                    ...(command.parameters || [])
                  ]"
                  :command-parameters="subCmd.parameters || []"
                  :is-dark="isDark"
                  @clear-current="clearCurrentCommand"
                  @go-to-parent="() => scrollToCommand(command.name)"
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
                        <div class="title-wrapper">
                          <h4 class="sub-sub-command-title">{{ command.name }} {{ subCmd.name }} {{ subSubCmd.name }}</h4>
                          <el-tooltip content="复制链接" placement="top">
                            <el-button
                              class="link-btn"
                              type="primary"
                              link
                              :icon="Link"
                              @click.stop="copyLink(`${command.name}-${subCmd.name}-${subSubCmd.name}`)"
                            />
                          </el-tooltip>
                          <el-button
                            v-if="!isReadOnly"
                            class="edit-btn"
                            type="primary"
                            link
                            :icon="Edit"
                            @click.stop="startEdit(`${command.name}-${subCmd.name}-${subSubCmd.name}`, subSubCmd.name, 'title')"
                          />
                        </div>
                        <div class="command-actions" v-if="!isReadOnly">
                          <el-button
                            type="danger"
                            link
                            :icon="Delete"
                            @click.stop="confirmDelete(`${command.name}-${subCmd.name}-${subSubCmd.name}`)"
                          >
                            删除命令
                          </el-button>
                        </div>
                      </div>
                    </div>

                    <div v-show="!isCollapsed(`${command.name}-${subCmd.name}-${subSubCmd.name}`)" class="sub-sub-command-content">
                      <div class="command-description" 
                        @dblclick="startEdit(`${command.name}-${subCmd.name}-${subSubCmd.name}`, subSubCmd.description, 'description')" 
                        v-if="editingTitle !== `${command.name}-${subCmd.name}-${subSubCmd.name}-desc`"
                      >
                        {{ subSubCmd.description }}
                      </div>
                      <div v-else class="editable-description">
                        <el-input
                          v-model="editingValue"
                          type="textarea"
                          :rows="3"
                          @keyup.enter="confirmEdit"
                          @blur="confirmEdit"
                          ref="descInputRef"
                        />
                      </div>
                      
                      <!-- 三级命令参数 -->
                      <div class="params-table">
                        <div class="section-title">
                          命令参数
                          <el-button
                            v-if="!isReadOnly"
                            class="add-param-btn"
                            type="primary"
                            link
                            :icon="Plus"
                            @click="handleAddParameter(subSubCmd)"
                          >
                            新增参数
                          </el-button>
                        </div>
                        <div class="params-table">
                          <el-table :data="subSubCmd.parameters || []" border>
                            <el-table-column width="50">
                              <template #default="scope">
                                <el-checkbox
                                  v-model="scope.row.enabled"
                                  :disabled="scope.row.required"
                                />
                              </template>
                            </el-table-column>
                            <el-table-column v-if="!isReadOnly" width="50">
                              <template #default="scope">
                                <el-button
                                  type="danger"
                                  link
                                  :icon="Delete"
                                  @click="handleDeleteParameter(subSubCmd, scope.$index)"
                                />
                              </template>
                            </el-table-column>
                            <el-table-column label="param">
                              <template #default="scope">
                                <div v-if="editingParam === `${command.name}-${subCmd.name}-${subSubCmd.name}-${scope.row.param}`">
                                  <el-input 
                                    v-model="editingValue"
                                    size="small"
                                    @keyup.enter="confirmParamEdit(scope.row)"
                                    @blur="confirmParamEdit(scope.row)"
                                  />
                                </div>
                                <div v-else class="param-cell">
                                  {{ scope.row.param }}
                                  <el-button
                                    v-if="!isReadOnly"
                                    class="edit-btn"
                                    type="primary"
                                    link
                                    :icon="Edit"
                                    @click.stop="startParamEdit(`${command.name}-${subCmd.name}-${subSubCmd.name}-${scope.row.param}`, scope.row.param, 'param', scope.row)"
                                  />
                                </div>
                              </template>
                            </el-table-column>
                            <el-table-column label="type">
                              <template #default="scope">
                                <div v-if="editingParam === `${command.name}-${subCmd.name}-${subSubCmd.name}-${scope.row.param}-type`">
                                  <el-select 
                                    v-model="editingValue"
                                    size="small"
                                    @change="confirmParamEdit(scope.row)"
                                    @blur="confirmParamEdit(scope.row)"
                                  >
                                    <el-option label="string" value="string" />
                                    <el-option label="number" value="number" />
                                    <el-option label="boolean" value="boolean" />
                                  </el-select>
                                </div>
                                <div v-else class="param-cell">
                                  {{ scope.row.type }}
                                  <el-button
                                    v-if="!isReadOnly"
                                    class="edit-btn"
                                    type="primary"
                                    link
                                    :icon="Edit"
                                    @click.stop="startParamEdit(`${command.name}-${subCmd.name}-${subSubCmd.name}-${scope.row.param}-type`, scope.row.type, 'type', scope.row)"
                                  />
                                </div>
                              </template>
                            </el-table-column>
                            <el-table-column label="description">
                              <template #default="scope">
                                <div v-if="editingParam === `${command.name}-${subCmd.name}-${subSubCmd.name}-${scope.row.param}-desc`">
                                  <el-input 
                                    v-model="editingValue"
                                    size="small"
                                    @keyup.enter="confirmParamEdit(scope.row)"
                                    @blur="confirmParamEdit(scope.row)"
                                  />
                                </div>
                                <div v-else class="param-cell">
                                  {{ scope.row.description }}
                                  <el-button
                                    v-if="!isReadOnly"
                                    class="edit-btn"
                                    type="primary"
                                    link
                                    :icon="Edit"
                                    @click.stop="startParamEdit(`${command.name}-${subCmd.name}-${subSubCmd.name}-${scope.row.param}-desc`, scope.row.description, 'description', scope.row)"
                                  />
                                </div>
                              </template>
                            </el-table-column>
                            <el-table-column label="required" width="100">
                              <template #default="scope">
                                <template v-if="isReadOnly">
                                  <span>{{ scope.row.required ? 'Yes' : 'No' }}</span>
                                </template>
                                <template v-else>
                                  <el-switch 
                                    v-model="scope.row.required"
                                    @change="handleParamRequiredChange(scope.row)"
                                  />
                                </template>
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
                          :inherited-parameters="[
                            ...(command.parameters || []),  // 一级命令参数
                            ...(subCmd.parameters || [])    // 二级命令参数
                          ]"
                          :command-parameters="subSubCmd.parameters || []"
                          :is-dark="isDark"
                          @clear-current="clearCurrentCommand"
                          @go-to-parent="() => scrollToCommand(`${command.name}-${subCmd.name}`)"
                          @clear-all="clearAllCommands"
                          @add-to-steps="(commandStr) => $emit('addToCommandSteps', commandStr, `${command.name}-${subCmd.name}-${subSubCmd.name}`)"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- 添加命令编辑器组件 -->
    <command-editor
      v-model:visible="isSubCommandEditorVisible"
      :is-dark="isDark"
      :is-read-only="isReadOnly"
      :existing-commands="existingCommands"
      :parent-command="selectedParentCommand"
      @submit="handleAddSubCommand"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed, nextTick, h } from 'vue'
import { defineProps, defineEmits } from 'vue'
import type { Command, SubCommand, Parameter } from '../types/config'
import CommandPreview from './CommandPreview.vue'
import { Back, Link, ArrowRight, Plus, Delete, Edit } from '@element-plus/icons-vue'
import { ElInput, ElMessage, ElMessageBox } from 'element-plus'
import CommandEditor from './CommandEditor.vue'

const props = defineProps<{
  command: Command;
  globalParameters: { name: string; value: string }[];
  isDark?: boolean;
  existingCommands?: Command[];
  isReadOnly?: boolean;
}>()

const emit = defineEmits(['addToCommandSteps', 'addSubCommand', 'deleteCommand', 'updateCommand'])

/**
 * 处理命令折叠状态
 * @param commandPath 命令路径（格式：command/subCommand/subSubCommand）
 */
const toggleCommand = (commandPath: string) => {
  if (collapsedStates.value.has(commandPath)) {
    collapsedStates.value.delete(commandPath)
  } else {
    collapsedStates.value.add(commandPath)
  }
  
  // 添加延时后滚动到目标位置
  setTimeout(() => {
    scrollToCommand(commandPath)
  }, 50)
}

/**
 * 获取继承的参数列表
 * 子命令会继承父命令的所有参数
 * 
 * @param command 父命令
 * @param subCmd 子命令
 * @returns 继承的参数列表
 */
const getInheritedParameters = (command: Command, subCmd: SubCommand): Parameter[] => {
  const inheritedParams: Parameter[] = []
  
  // 从一级命令继承参数
  if (command.parameters) {
    inheritedParams.push(...command.parameters)
  }

  // 如果是三级命令，还需要从二级命令继承参数
  if (subCmd.subCommands) {
    // 添加二级命令的参数
    if (subCmd.parameters) {
      inheritedParams.push(...subCmd.parameters)
    }
  }
  
  return inheritedParams
}

/**
 * 复制命令链接
 * 生成当前命令位置的锚点链接并复制到剪贴板
 * 
 * @param id 命令ID
 */
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

/**
 * 添加新参数
 * 通过弹窗收集参数信息并添加到命令中
 * 
 * @param targetCommand 目标命令对象
 */
const handleAddParameter = async (targetCommand: Command | SubCommand) => {
  const newParam = {
    param: '',
    type: 'string',
    description: '',
    required: false,
    default: '',
    value: '',
    enabled: true
  }

  // 验证参数名称唯一性
  const validateParam = (param: string, description: string): boolean => {
    if (!param.match(/^[a-z][a-z0-9-]*$/)) {
      ElMessage.error('参数名称只能包含小写字母、数字和横杠，且必须以字母开头')
      return false
    }
    
    if (targetCommand.parameters?.some((p: Parameter) => p.param === param)) {
      ElMessage.error('参数名称已存在')
      return false
    }

    if (!description.trim()) {
      ElMessage.error('参数描述不能为空')
      return false
    }
    
    return true
  }

  try {
    const { value: formValues } = await ElMessageBox({
      title: '新增参数',
      message: h('div', { style: 'width: 100%;' }, [
        h('div', { style: 'margin-bottom: 15px;' }, [
          h('div', { style: 'margin-bottom: 10px; font-weight: bold;' }, '参数名称：'),
          h('input', {
            id: 'paramName',
            class: 'el-input__inner',
            style: `
              width: 100%;
              height: 32px;
              padding: 0 12px;
              border: 1px solid var(--el-border-color);
              border-radius: 4px;
              box-sizing: border-box;
              color: var(--el-text-color-primary);
              background-color: var(--el-input-bg-color);
              margin: 0;
            `,
            placeholder: '请输入参数名称'
          })
        ]),
        h('div', null, [
          h('div', { style: 'margin-bottom: 10px; font-weight: bold;' }, '参数描述：'),
          h('textarea', {
            id: 'paramDesc',
            class: 'el-textarea__inner',
            style: `
              width: 100%;
              min-height: 120px;
              padding: 8px 12px;
              resize: vertical;
              border: 1px solid var(--el-border-color);
              border-radius: 4px;
              box-sizing: border-box;
              color: var(--el-text-color-primary);
              background-color: var(--el-input-bg-color);
              margin: 0;
            `,
            placeholder: '请输入参数描述'
          })
        ])
      ]),
      showCancelButton: true,
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      customClass: props.isDark ? 'dark-message-box' : '',
      customStyle: {
        width: '500px',
        padding: '20px'
      },
      beforeClose: (action, instance, done) => {
        if (action === 'confirm') {
          const paramName = (document.getElementById('paramName') as HTMLInputElement)?.value
          const paramDesc = (document.getElementById('paramDesc') as HTMLTextAreaElement)?.value

          if (validateParam(paramName, paramDesc)) {
            newParam.param = paramName
            newParam.description = paramDesc
            if (!targetCommand.parameters) {
              targetCommand.parameters = []
            }
            targetCommand.parameters.push({
              ...newParam,
              required: false
            })
            done()
          }
        } else {
          done()
        }
      }
    })
  } catch {
    // 用户取消输入
  }
}

/**
 * 滚动到指定命令位置
 * 支持平滑滚动和位置偏移
 * 
 * @param commandPath 命令路径
 */
const scrollToCommand = (commandPath: string) => {
  // 添加延时确保 DOM 已更新
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
      console.warn('Element not found for path:', commandPath)
      // 检查所有可用的锚点元素
      const allAnchors = document.querySelectorAll('[id]')
      
    }
  }, 100)
}

// 折叠状态管理
const collapsedStates = ref<Set<string>>(new Set())

// 检查是否折叠
const isCollapsed = (commandPath: string) => {
  return collapsedStates.value.has(commandPath)
}

// 监听命令变化，重置折叠状态
watch(() => props.command, () => {
  collapsedStates.value.clear()
}, { deep: true })

// 清空当前命令的输入
const clearCurrentCommand = () => {
  // 清空当前命令的所有参数值
  if (props.command.parameters) {
    props.command.parameters.forEach(param => param.value = '')
  }
}

// 处理返回父命令
const handleGoToParent = (parentPath: string) => {
  scrollToCommand(parentPath)
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
    props.command.subCommands.forEach((subCmd: SubCommand) => {
      clearParams(subCmd.parameters)
      if (subCmd.subCommands) {
        subCmd.subCommands.forEach((subSubCmd: SubCommand) => {
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

// 添加参数输入处的函数
const handleParamInput = (param: Parameter) => {
  // 如果输入了值且参数未启用且不是必需参数则自动启用
  if (param.value && !param.enabled && !param.required) {
    param.enabled = true
  }
  // 如果清空了值且不是必需参数，则自动禁用
  if (!param.value && !param.required) {
    param.enabled = false
  }
}

// 添加状态
const isSubCommandEditorVisible = ref(false)
const selectedParentCommand = ref('')

// 显示添加子命令对话框
const showAddSubCommand = (parentCommand: string) => {
  selectedParentCommand.value = parentCommand
  isSubCommandEditorVisible.value = true
}

// 处理添加子命令
const handleAddSubCommand = (newCommand: Command) => {
  emit('addSubCommand', {
    parentCommand: selectedParentCommand.value,
    command: newCommand
  })
}

// 从父组获取所有命令列表
const existingCommands = computed(() => props.existingCommands || [])

// 添加删除确认方法
const confirmDelete = async (commandPath: string) => {
  try {
    const parts = commandPath.split('-')
    const message = parts.length > 1 
      ? '此操作将删除该命令及其所有子命令，是否继续？'
      : '此操作将删除该命令及其所有子命令，是否继续？'

    await ElMessageBox.confirm(
      message,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: props.isDark ? 'dark-message-box' : ''
      }
    )
    
    emit('deleteCommand', commandPath)
  } catch {
    // 用户取消删除
  }
}

// 添加编辑相关的状态
const editingTitle = ref('')
const editingValue = ref('')
const editingType = ref<'title' | 'description'>('title')
const titleInputRef = ref<InstanceType<typeof ElInput> | null>(null)
const descInputRef = ref<InstanceType<typeof ElInput> | null>(null)

// 开始编辑
const startEdit = (id: string, value: string, type: 'title' | 'description') => {
  editingTitle.value = type === 'description' ? `${id}-desc` : id
  editingValue.value = value
  editingType.value = type

  // 等待 DOM 更新后聚焦输入框
  nextTick(() => {
    if (type === 'title') {
      titleInputRef.value?.focus()
    } else {
      descInputRef.value?.focus()
    }
  })
}

// 确认编辑
const confirmEdit = async () => {
  if (!editingValue.value.trim()) {
    ElMessage.error('内容不能为空')
    return
  }

  if (editingType.value === 'title') {
    // 如果是修改标题，需要二次确认
    try {
      await ElMessageBox.confirm(
        '修改命令名称可能会影响现有的命令引用，是否继续？',
        '确认修改',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: props.isDark ? 'dark-message-box' : ''
        }
      )
      
      // 发出更新事件
      emit('updateCommand', {
        commandPath: editingTitle.value,
        field: 'name',
        value: editingValue.value.trim()
      })
    } catch {
      // 用户取消修改，恢复原值
      editingValue.value = props.command.name
    }
  } else {
    // 直接更新描述
    emit('updateCommand', {
      commandPath: editingTitle.value.replace('-desc', ''),
      field: 'description',
      value: editingValue.value.trim()
    })
  }

  // 退出编辑状态
  editingTitle.value = ''
  editingValue.value = ''
}

// 添加参数编辑相关的态
const editingParam = ref('')
const editingParamField = ref<'param' | 'type' | 'description' | null>(null)
const currentEditingParam = ref<Parameter | null>(null)

// 开始编辑参数
const startParamEdit = (id: string, value: string, field: 'param' | 'type' | 'description', param: Parameter) => {
  editingParam.value = id
  editingValue.value = value
  editingParamField.value = field
  currentEditingParam.value = param
}

// 确认参数编辑
const confirmParamEdit = async (param: Parameter) => {
  if (!editingValue.value.trim()) {
    ElMessage.error('内容不能为空')
    return
  }

  // 更新参数值
  if (editingParamField.value) {
    param[editingParamField.value] = editingValue.value.trim()
  }

  // 重置编辑状态
  editingParam.value = ''
  editingValue.value = ''
  editingParamField.value = null
  currentEditingParam.value = null
}

// 处理必填状态化
const handleParamRequiredChange = (param: Parameter) => {
  if (param.required) {
    param.enabled = true
  }
}

// 删除参数
const handleDeleteParameter = async (targetCommand: Command | SubCommand, index: number) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除此参数吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: props.isDark ? 'dark-message-box' : ''
      }
    )
    
    targetCommand.parameters?.splice(index, 1)
  } catch {
    // 用户取消删除
  }
}

// 添加命令模板处理方法
const processTemplate = (template: string, params: Parameter[]) => {
  let result = template
  params.forEach(param => {
    if (param.value && (param.enabled || param.required)) {
      const placeholder = `{${param.param}}`
      result = result.replace(placeholder, param.value)
    }
  })
  return result
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

/* 颜色模式适配 */
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
  padding: 16px;
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

.command-title-group,
.sub-command-title-group {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.command-title,
.sub-command-title {
  margin: 0;
  flex: 1;
}

/* 按钮样式 */
.el-button.el-button--primary.is-link {
  padding: 4px 8px;
  margin-left: auto;
}

.command-actions {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.command-actions .el-button {
  padding: 4px 8px;
}

/* 调整标题组样式以适应新的按钮 */
.command-title-group,
.sub-command-title-group,
.sub-sub-command-title-group {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.command-title,
.sub-command-title,
.sub-sub-command-title {
  margin: 0;
  flex: 1;
}

.editable-title {
  flex: 1;
  margin: -4px 0;
}

.editable-title .el-input {
  font-size: 18px;
  font-weight: 500;
}

.command-title {
  cursor: pointer;
}

.command-title:hover {
  color: var(--el-color-primary);
}

.command-description {
  cursor: pointer;
}

.command-description:hover {
  color: var(--el-color-primary);
}

.editable-description {
  padding: 16px 20px;
  margin-bottom: 24px;
  background-color: var(--secondary-bg);
  border-radius: 8px;
}

.title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.description-wrapper {
  position: relative;
}

.edit-btn {
  opacity: 0;
  transition: opacity 0.3s;
  padding: 4px;
  font-size: 14px;
}

.title-wrapper:hover .edit-btn,
.description-wrapper:hover .edit-btn {
  opacity: 1;
}

.command-title,
.sub-command-title,
.sub-sub-command-title {
  margin: 0;
  cursor: default;  /* 移除鼠标手型 */
}

.command-description {
  cursor: default;  /* 移除鼠标手型 */
}

/* 编按钮在暗色模式下的样式 */
.dark-mode .edit-btn {
  color: var(--text-secondary);
}

.dark-mode .edit-btn:hover {
  color: var(--el-color-primary);
}

.param-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.param-cell .edit-btn {
  opacity: 0;
  transition: opacity 0.3s;
  padding: 4px;
  font-size: 14px;
}

.param-cell:hover .edit-btn {
  opacity: 1;
}

/* 暗色模式下的表格编辑按钮样式 */
.dark-mode .param-cell .edit-btn {
  color: var(--text-secondary);
}

.dark-mode .param-cell .edit-btn:hover {
  color: var(--el-color-primary);
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-param-btn {
  font-size: 14px;
  padding: 4px 8px;
}

/* 删除按钮样式 */
.el-button.is-link.el-button--danger {
  padding: 4px;
  margin: 0;
  font-size: 14px;
}

.el-button.is-link.el-button--danger:hover {
  color: var(--el-color-danger);
  background-color: var(--el-color-danger-light-9);
}

/* 调整表格列宽 */
:deep(.el-table) {
  width: 100%;
}

:deep(.el-table .el-table__cell[data-col-index="0"]) {  /* checkbox列 */
  width: 40px;
}

:deep(.el-table .el-table__cell[data-col-index="1"]) {  /* 删除按钮列 */
  width: 40px;
}

:deep(.el-table .el-table__cell[data-col-index="2"]) {  /* param列 */
  min-width: 120px;
  max-width: 200px;
}

:deep(.el-table .el-table__cell[data-col-index="3"]) {  /* type列 */
  width: 100px;
}

:deep(.el-table .el-table__cell[data-col-index="4"]) {  /* description列 */
  min-width: 200px;
}

:deep(.el-table .el-table__cell[data-col-index="5"]) {  /* required列 */
  width: 80px;
}

:deep(.el-table .el-table__cell[data-col-index="6"]) {  /* value列 */
  min-width: 120px;
  max-width: 200px;
}

/* 优化表格内容显示 */
.param-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* 调整按钮大小 */
.param-cell .edit-btn {
  padding: 2px;
  font-size: 12px;
}

/* 调整删除按钮 */
.el-button.is-link.el-button--danger {
  padding: 2px;
  font-size: 12px;
}

/* 调整开关组件大小 */
:deep(.el-switch) {
  transform: scale(0.8);
  margin: 0 -6px;
}

/* 调整输入框内边距 */
:deep(.el-input__wrapper) {
  padding: 0 8px;
}

/* 调整选择框大小 */
:deep(.el-select) {
  width: 100%;
}

/* 优化表格内容溢出处理 */
:deep(.el-table .cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 调整描述列的文本换行 */
:deep(.el-table .el-table__cell[data-col-index="4"] .cell) {
  white-space: normal;
  line-height: 1.4;
}

/* 调整表格行 */
:deep(.el-table__row) {
  height: 40px;
}

/* 只读模式下隐藏编辑相关的悬浮效果 */
.is-read-only .edit-btn,
.is-read-only .command-actions,
.is-read-only .param-cell .edit-btn {
  display: none;
}

.link-btn {
  opacity: 0;
  transition: opacity 0.3s;
  padding: 4px;
  font-size: 14px;
}

.title-wrapper:hover .link-btn {
  opacity: 1;
}

/* 暗色模式下的链接按钮样式 */
.dark-mode .link-btn {
  color: var(--text-secondary);
}

.dark-mode .link-btn:hover {
  color: var(--el-color-primary);
}
</style> 