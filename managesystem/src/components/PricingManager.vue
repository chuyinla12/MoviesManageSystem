<template>
  <div class="pricing-manager">
    <el-tabs v-model="activeTab">
      <!-- 票价类型管理 -->
      <el-tab-pane label="票价类型" name="types">
        <div class="action-bar">
          <el-button type="primary" @click="showAddTypeDialog">添加票价类型</el-button>
        </div>
        
        <el-table :data="ticketTypes" style="width: 100%">
          <el-table-column prop="name" label="类型名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="discount" label="折扣率">
            <template #default="scope">
              {{ (scope.row.discount * 100).toFixed(0) }}%
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" link @click="editType(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" link @click="deleteType(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 票价策略管理 -->
      <el-tab-pane label="票价策略" name="strategies">
        <div class="action-bar">
          <el-button type="primary" @click="showAddStrategyDialog">添加票价策略</el-button>
        </div>
        
        <el-table :data="pricingStrategies" style="width: 100%">
          <el-table-column prop="name" label="策略名称" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="timeRange" label="适用时间">
            <template #default="scope">
              {{ formatTimeRange(scope.row.startTime, scope.row.endTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="priceMultiplier" label="价格倍数">
            <template #default="scope">
              {{ scope.row.priceMultiplier }}x
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" link @click="editStrategy(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" link @click="deleteStrategy(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 票价类型对话框 -->
    <el-dialog
      v-model="typeDialogVisible"
      :title="isEditingType ? '编辑票价类型' : '添加票价类型'"
      width="500px"
    >
      <el-form :model="typeForm" label-width="100px">
        <el-form-item label="类型名称">
          <el-input v-model="typeForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="typeForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="折扣率">
          <el-input-number 
            v-model="typeForm.discount" 
            :min="0" 
            :max="1" 
            :step="0.1"
            :precision="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="typeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveType">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 票价策略对话框 -->
    <el-dialog
      v-model="strategyDialogVisible"
      :title="isEditingStrategy ? '编辑票价策略' : '添加票价策略'"
      width="500px"
    >
      <el-form :model="strategyForm" label-width="100px">
        <el-form-item label="策略名称">
          <el-input v-model="strategyForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="strategyForm.description" type="textarea" />
        </el-form-item>
        <el-form-item label="适用时间">
          <el-time-picker
            v-model="strategyForm.startTime"
            placeholder="开始时间"
            format="HH:mm"
            value-format="HH:mm"
          />
          <span class="mx-2">至</span>
          <el-time-picker
            v-model="strategyForm.endTime"
            placeholder="结束时间"
            format="HH:mm"
            value-format="HH:mm"
          />
        </el-form-item>
        <el-form-item label="价格倍数">
          <el-input-number 
            v-model="strategyForm.priceMultiplier" 
            :min="0.1" 
            :max="3" 
            :step="0.1"
            :precision="1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="strategyDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveStrategy">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 标签页控制
const activeTab = ref('types')

// 票价类型数据
const ticketTypes = ref([
  { id: 1, name: '普通票', description: '普通观众票', discount: 1 },
  { id: 2, name: '学生票', description: '学生优惠票', discount: 0.8 },
  { id: 3, name: '老年票', description: '老年人优惠票', discount: 0.7 }
])

// 票价策略数据
const pricingStrategies = ref([
  { 
    id: 1, 
    name: '早场优惠', 
    description: '上午场次优惠', 
    startTime: '08:00',
    endTime: '12:00',
    priceMultiplier: 0.8
  },
  { 
    id: 2, 
    name: '黄金时段', 
    description: '晚间黄金时段加价', 
    startTime: '19:00',
    endTime: '22:00',
    priceMultiplier: 1.2
  }
])

// 票价类型表单
const typeDialogVisible = ref(false)
const isEditingType = ref(false)
const typeForm = reactive({
  name: '',
  description: '',
  discount: 1
})

// 票价策略表单
const strategyDialogVisible = ref(false)
const isEditingStrategy = ref(false)
const strategyForm = reactive({
  name: '',
  description: '',
  startTime: '',
  endTime: '',
  priceMultiplier: 1
})

// 显示添加票价类型对话框
const showAddTypeDialog = () => {
  isEditingType.value = false
  typeForm.name = ''
  typeForm.description = ''
  typeForm.discount = 1
  typeDialogVisible.value = true
}

// 编辑票价类型
const editType = (type) => {
  isEditingType.value = true
  Object.assign(typeForm, type)
  typeDialogVisible.value = true
}

// 保存票价类型
const saveType = () => {
  if (isEditingType.value) {
    // 更新现有类型
    const index = ticketTypes.value.findIndex(t => t.id === typeForm.id)
    if (index !== -1) {
      ticketTypes.value[index] = { ...ticketTypes.value[index], ...typeForm }
    }
  } else {
    // 添加新类型
    ticketTypes.value.push({
      id: Date.now(),
      ...typeForm
    })
  }
  typeDialogVisible.value = false
  ElMessage.success('保存成功')
}

// 删除票价类型
const deleteType = (type) => {
  ElMessageBox.confirm('确定要删除该票价类型吗？', '提示', {
    type: 'warning'
  }).then(() => {
    ticketTypes.value = ticketTypes.value.filter(t => t.id !== type.id)
    ElMessage.success('删除成功')
  })
}

// 显示添加票价策略对话框
const showAddStrategyDialog = () => {
  isEditingStrategy.value = false
  strategyForm.name = ''
  strategyForm.description = ''
  strategyForm.startTime = ''
  strategyForm.endTime = ''
  strategyForm.priceMultiplier = 1
  strategyDialogVisible.value = true
}

// 编辑票价策略
const editStrategy = (strategy) => {
  isEditingStrategy.value = true
  Object.assign(strategyForm, strategy)
  strategyDialogVisible.value = true
}

// 保存票价策略
const saveStrategy = () => {
  if (isEditingStrategy.value) {
    // 更新现有策略
    const index = pricingStrategies.value.findIndex(s => s.id === strategyForm.id)
    if (index !== -1) {
      pricingStrategies.value[index] = { ...pricingStrategies.value[index], ...strategyForm }
    }
  } else {
    // 添加新策略
    pricingStrategies.value.push({
      id: Date.now(),
      ...strategyForm
    })
  }
  strategyDialogVisible.value = false
  ElMessage.success('保存成功')
}

// 删除票价策略
const deleteStrategy = (strategy) => {
  ElMessageBox.confirm('确定要删除该票价策略吗？', '提示', {
    type: 'warning'
  }).then(() => {
    pricingStrategies.value = pricingStrategies.value.filter(s => s.id !== strategy.id)
    ElMessage.success('删除成功')
  })
}

// 格式化时间范围
const formatTimeRange = (start, end) => {
  return `${start} - ${end}`
}
</script>

<style scoped>
.pricing-manager {
  padding: 20px;
}

.action-bar {
  margin-bottom: 20px;
}

.mx-2 {
  margin: 0 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style> 