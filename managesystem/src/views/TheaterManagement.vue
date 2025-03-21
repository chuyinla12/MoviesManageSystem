<template>
  <div class="theater-management">
    <el-tabs v-model="activeTab">
      <!-- 影厅信息管理 -->
      <el-tab-pane label="影厅信息" name="info">
        <div class="action-bar">
          <el-button type="primary" @click="showAddTheaterDialog">添加影厅</el-button>
        </div>
        
        <el-table :data="theaters" style="width: 100%">
          <el-table-column prop="name" label="影厅名称" />
          <el-table-column prop="seating" label="座位数" />
          <el-table-column prop="layout" label="座位布局">
            <template #default="scope">
              <el-button type="primary" link @click="showLayoutEditor(scope.row)">
                编辑布局
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" link @click="editTheater(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" link @click="deleteTheater(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 影厅设备管理 -->
      <el-tab-pane label="设备管理" name="equipment">
        <div class="action-bar">
          <el-button type="primary" @click="showAddEquipmentDialog">添加设备</el-button>
        </div>
        
        <el-table :data="equipment" style="width: 100%">
          <el-table-column prop="name" label="设备名称" />
          <el-table-column prop="typeName" label="设备类型" />
          <el-table-column prop="hallName" label="所属影厅" />
          <el-table-column prop="status" label="状态">
            <template #default="scope">
              <el-tag :type="{ normal: 'success', maintained: 'warning', disabled: 'danger' }[scope.row.status]">
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button type="primary" link @click="editEquipment(scope.row)">
                编辑
              </el-button>
              <el-button type="danger" link @click="deleteEquipment(scope.row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 影厅信息对话框 -->
    <el-dialog
      v-model="theaterDialogVisible"
      :title="isEditing ? '编辑影厅' : '添加影厅'"
      width="500px"
    >
      <el-form :model="theaters" label-width="100px">
        <el-form-item label="影厅名称">
          <el-input v-model="theaterForm.name" />
        </el-form-item>
        <el-form-item label="座位数">
          <el-input-number v-model="theaterForm.seating" :min="1" disabled />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="theaterDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveTheater">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 座位布局编辑器对话框 -->
    <el-dialog
      v-model="layoutDialogVisible"
      title="编辑座位布局"
      width="90%"
    >
      <div class="layout-editor">
        <div class="layout-grid">
          <div
            v-for="(row, rowIndex) in layoutGrid"
            :key="rowIndex"
            class="layout-row"
          >
            <div
              v-for="(seat, colIndex) in row"
              :key="colIndex"
              class="layout-seat"
              :class="{ 'is-selected': seat }"
              @click="toggleSeat(rowIndex, colIndex)"
            ></div>
          </div>
        </div>
        <div class="layout-controls">
          <el-button @click="clearLayout">清空布局</el-button>
          <el-button type="primary" @click="saveLayout">保存布局</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 设备管理对话框 -->
    <el-dialog
      v-model="equipmentDialogVisible"
      :title="isEditingEquipment ? '编辑设备' : '添加设备'"
      width="500px"
    >
      <el-form :model="equipmentForm" label-width="100px">
        <el-form-item label="设备名称">
          <el-input v-model="equipmentForm.name" />
        </el-form-item>
        <el-form-item label="设备类型">
          <el-select v-model="equipmentForm.typeName">
            <el-option label="音响" value="音响" />
            <el-option label="灯光" value="灯光" />
            <el-option label="投影仪" value="投影仪" />
            <el-option label="空调" value="空调" />
            <el-option label="其它" value="其它" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属影厅">
          <el-select v-model="equipmentForm.hallName">
            <el-option
              v-for="theater in theaters"
              :key="theater.id"
              :label="theater.name"
              :value="theater.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="equipmentForm.status">
            <el-option label="正常" value="normal" />
            <el-option label="维护中" value="maintained" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="equipmentDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveEquipment">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTheaterStore } from '../stores/theaterStore';
import { useEquipmentStore } from '../stores/equipmentStore';
import service from '../utils/request';

const theaterStore = useTheaterStore();

// 标签页控制
const activeTab = ref('info')

// 影厅数据
const theaters = ref([])
// 影厅表单
const theaterForm = reactive({
  id: '',
  name: '',
  seating: 100
})
// 影厅表单
const theaterDialogVisible = ref(false)
const isEditing = ref(false)

// 设备数据
const equipmentStore = useEquipmentStore();
const equipment = ref([]);
const fetchEquipment = async () => {
  try {
    await equipmentStore.fetchEquipment();
    equipment.value = equipmentStore.equipment;
  } catch (error) {
    // 打印更详细的错误信息
    if (error.response) {
      console.error('服务器响应错误：', error.response.data);
    }
  }
};

const fetchTheaters = async () => {
  try {
    const response = await service.get("/admin/halls");
    theaters.value = response.data;
  } catch (error) {
    // 打印更详细的错误信息
    if (error.response) {
      console.error('服务器响应错误：', error.response.data);
    }
  }
};

onMounted(async () => {
  await fetchTheaters();
  await fetchEquipment();
})



// 设备表单
const equipmentDialogVisible = ref(false)
const isEditingEquipment = ref(false)
const equipmentForm = reactive({})

// 座位布局
const layoutDialogVisible = ref(false)
const layoutGrid = ref(Array(20).fill().map(() => Array(20).fill(false)))
const currentTheaterId = ref(null)

// 显示添加影厅对话框
const showAddTheaterDialog = () => {
  isEditing.value = false
  theaterForm.name = ''
  theaterForm.seating = 100
  theaterDialogVisible.value = true
}

// 编辑影厅
const editTheater = (theater) => {
  isEditing.value = true
  theaterForm.id = theater.id
  theaterForm.name = theater.name
  theaterForm.seating = theater.seating
  theaterDialogVisible.value = true
}

// 保存影厅
const saveTheater = () => {
  if (isEditing.value) {
    // 更新现有影厅
    const index = theaters.value.findIndex(theater => theater.id === theaterForm.id);
    if (index !== -1) {
      theaters.value[index] = { ...theaters.value[index], ...theaterForm };
      //theaterStore.updateTheater(theaterForm);
    }
  } else {
    // 添加新影厅
    const newTheater = {
      id: Date.now(),
      ...theaterForm
    };
    theaters.value.push(newTheater);
    //theaterStore.addTheater(newTheater);
  }
  theaterDialogVisible.value = false;
  ElMessage.success('保存成功');
};

// 删除影厅
const deleteTheater = (theater) => {
  ElMessageBox.confirm('确定要删除该影厅吗？', '提示', {
    type: 'warning'
  }).then(() => {
    theaters.value = theaters.value.filter(t => t.id !== theater.id);
    //theaterStore.deleteTheater(theater.id);
    ElMessage.success('删除成功');
  });
};

// 显示座位布局编辑器
const showLayoutEditor = async (theater) => {
  try {
    const response = await service.get(`/admin/halls/${theater.id}/seats`);
    const layoutData = response.data;
    
    // 创建最大行数的二维数组
    const maxRow = Math.max(...layoutData.map(item => item.row)) + 1;
    const maxCol = Math.max(...layoutData.map(item => item.endColumn)) + 1;
    layoutGrid.value = Array(maxRow).fill().map(() => Array(maxCol).fill(false));
    
    // 根据接口数据填充有效座位
    layoutData.forEach(({ row, startColumn, endColumn }) => {
      for (let col = startColumn; col <= endColumn; col++) {
        layoutGrid.value[row][col] = true;
      }
    });
    
    currentTheaterId.value = theater.id;
    layoutDialogVisible.value = true;
  } catch (error) {
    ElMessage.error('获取影厅布局失败');
  }
}

// 切换座位状态
const toggleSeat = (row, col) => {
  layoutGrid.value[row][col] = !layoutGrid.value[row][col]
}

// 清空布局
const clearLayout = () => {
  layoutGrid.value = Array(20).fill().map(() => Array(20).fill(false))
}

// 保存布局
const saveLayout = async () => {
  try {
    // 将二维数组转换为接口要求的格式
    const layoutData = [];
    layoutGrid.value.forEach((row, rowIndex) => {
      let start = -1;
      row.forEach((seat, colIndex) => {
        if (seat && start === -1) {
          start = colIndex;
        }
        if (!seat && start !== -1) {
          layoutData.push({ 
            row: rowIndex,
            startColumn: start,
            endColumn: colIndex - 1
          });
          start = -1;
        }
      });
      if (start !== -1) {
        layoutData.push({
          row: rowIndex,
          startColumn: start,
          endColumn: row.length - 1
        });
      }
    });

    // 提交保存请求
    // await service.put(`/admin/halls/${currentTheaterId.value}/layout`, {
    //   layout: layoutData
    // });

    // 计算有效座位数
    const seatCount = layoutGrid.value.flat().filter(seat => seat).length;
    
    // 更新对应影厅的座位数
    const theater = theaters.value.find(t => t.id === currentTheaterId.value);
    if (theater) {
      theater.seating = seatCount;
    }

    layoutDialogVisible.value = false;
    ElMessage.success('布局保存成功');
  } catch (error) {
    ElMessage.error('保存布局失败');
  }
}

// 显示添加设备对话框
const showAddEquipmentDialog = () => {
  isEditingEquipment.value = false
  equipmentForm.name = ''
  equipmentForm.typeName = ''
  equipmentForm.halls = ''
  equipmentForm.status = 'normal'
  equipmentDialogVisible.value = true
}

// 编辑设备
const editEquipment = (item) => {
  isEditingEquipment.value = true
  Object.assign(equipmentForm, item)// 复制对象属性到表单
  equipmentDialogVisible.value = true
}

// 保存设备
const saveEquipment = () => {
  if (isEditingEquipment.value) {
    // 更新现有设备
    const index = equipment.value.findIndex(e => e.id === equipmentForm.id)
    if (index !== -1) {
      equipment.value[index] = { ...equipment.value[index], ...equipmentForm }
    }
    //equipmentStore.updateEquipment(equipmentForm)
  } else {
    // 添加新设备
    equipment.value.push({
      id: Date.now(),
      ...equipmentForm
    })
    //equipmentStore.addEquipment(equipmentForm)
  }
  equipmentDialogVisible.value = false
  ElMessage.success('保存成功')
}

// 删除设备
const deleteEquipment = (item) => {
  ElMessageBox.confirm('确定要删除该设备吗？', '提示', {
    type: 'warning'
  }).then(() => {
    equipment.value = equipment.value.filter(e => e.id !== item.id)
    //equipmentStore.deleteEquipment(item.id)
    ElMessage.success('删除成功')
  })
}
</script>

<style scoped>
.theater-management {
  padding: 20px;
}

.action-bar {
  margin-bottom: 20px;
}

.layout-editor {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.layout-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
}

.layout-row {
  display: flex;
  gap: 4px;
}

.layout-seat {
  width: 30px;
  height: 30px;
  background: #dcdfe6;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.layout-seat:hover {
  background: #c0c4cc;
}

.layout-seat.is-selected {
  background: #409eff;
}

.layout-controls {
  display: flex;
  gap: 10px;
}
</style>
