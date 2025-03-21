<template>
  <div class="schedule-manager">
    <el-card class="movie-selector">
      <template #header>
        <div class="card-header">
          <span>选择日期和电影</span>
        </div>
      </template>
      <div class="selector-row">
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择排片日期"
          value-format="YYYY-MM-DD"
          @change="handleDateChange"
        />
        <el-select v-model="selectedMovie" placeholder="请选择要排片的电影" class="movie-select">
        <el-option
          label="不选择电影"
          value=""
        />
        <el-option
          v-for="movie in availableMovies"
          :key="movie.id"
          :label="movie.name"
          :value="movie.id"
        />
        </el-select>
        <el-button 
          type="primary" 
          :disabled="fixedBlocks.length === 0"
          @click="handleSave"
        >
          保存排片
        </el-button>
      </div>
    </el-card>
    
    <div class="schedule-grid">
      <div class="theater-list">
        <div v-for="theater in theaters" :key="theater.id" class="theater-item" :data-title="theater.name">
          {{ theater.name }}
        </div>
      </div>
      <div class="time-grid">
        <div class="time-ticks">
          <div v-for="hour in 25" :key="hour" class="tick">
            {{ (hour - 1) }}:00
          </div>
        </div>
        
        <div v-for="theater in theaters" :key="theater.id" class="theater-row" :data-theater-id="theater.id">
          <div class="time-axis" @click="(e) => handleTimeAxisClick(e, theater.id)">
            <div class="time-display" :style="getTimeDisplayStyle($event, theater.id)">{{ currentTime }}</div>
            <div 
              v-for="block in getTheaterBlocks(theater.id)" 
              :key="block.id"
              class="fixed-block"
              :style="block.style"
              @click="showBlockDetails(block)"
            >
              <div class="block-content">
                <div class="movie-title">{{ getMovieTitle(block.movieId) }}</div>
                <div class="time-info">{{ formatTime(block.start) }} - {{ formatTime(block.end) }}</div>
                <el-button 
                  class="delete-btn" 
                  type="danger" 
                  size="small" 
                  circle
                  @click.stop="deleteBlock(block.id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div 
              v-for="block in getTheaterBlocks(theater.id)" 
              :key="'mask-' + block.id"
              class="mask-overlay"
              :style="block.style"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div 
      v-if="activeBlock"
      class="follow-box"
      :style="activeBlockStyle"
    ></div>

    <!-- 添加详情对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="排片详情"
      width="400px"
      :close-on-click-modal="false"
    >
      <div v-if="selectedBlock" class="block-details">
        <div class="detail-item">
          <span class="label">影厅：</span>
          <span class="value">{{ getTheaterName(selectedBlock.theaterId) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">电影：</span>
          <span class="value">{{ getMovieTitle(selectedBlock.movieId) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">时长：</span>
          <span class="value">{{ getMovieDuration(selectedBlock.movieId) }}分钟</span>
        </div>
        <div class="detail-item">
          <span class="label">开始时间：</span>
          <span class="value">{{ formatTime(selectedBlock.start) }}</span>
        </div>
        <div class="detail-item">
          <span class="label">结束时间：</span>
          <span class="value">{{ formatTime(selectedBlock.end) }}</span>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">关闭</el-button>
          <el-button type="danger" @click="handleDeleteFromDialog">删除</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useMoviesStore } from '../stores/moviesStore'
import service from '../utils/request';

// 状态管理
const activeBlock = ref(null)
const isAttached = ref(false)
const fixedBlocks = ref([])
const currentTime = ref('')
const selectedMovie = ref('')
const currentTheater = ref(null)
const dialogVisible = ref(false)
const selectedBlock = ref(null)

// 获取影厅信息
const theaters = ref([])
const fetchTheaters = async () => {
  try {
      service.get("/admin/halls").then((response) => {
      theaters.value = response.data;
    });
  } catch (error) {
    // 打印更详细的错误信息
    if (error.response) {
      console.error('服务器响应错误：', error.response.data);
    }
  }
};

// 获取电影信息
const selectedDate = ref('')
const availableMovies = ref([])

// 处理日期变更
const handleDateChange = () => {
  fetchMovies(selectedDate.value)
}

// 获取电影信息
const fetchMovies = async (date) => {
  try {
    await useMoviesStore().fetchMovies(date)
    availableMovies.value = useMoviesStore().movies
  } catch (error) {
    // 打印更详细的错误信息
    if (error.response) {
      console.error('服务器响应错误：', error.response.data);
    }
  }
};

// 初始化
const initDate = () => {
  const today = new Date()
  selectedDate.value = `${today.getFullYear()}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
}

onMounted(async () => {
  initDate()
  await fetchTheaters()
  await fetchMovies(selectedDate.value)
})
// 选择电影时创建拖拽块
const createScheduleBlock = (movieId) => {
  if (activeBlock.value) return
  
  const movie = availableMovies.value.find(m => m.id === movieId)
  if (!movie) return
  
  const timeAxis = document.querySelector('.time-axis')
  if (!timeAxis) return
  
  const axisRect = timeAxis.getBoundingClientRect()
  const pixelsPerMinute = axisRect.width / 1440 // 1440分钟 = 24小时
  
  activeBlock.value = {
    id: Date.now(),
    movieId: movieId,
    width: movie.duration * pixelsPerMinute,
    height: 50,
    style: {
      display: 'block',
      width: `${movie.duration * pixelsPerMinute}px`,
      height: '50px',
      background: '#90caf9',
      borderRadius: '4px',
      position: 'fixed',
      pointerEvents: 'none',
      transition: 'all 0.3s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }
  }
}

// 监听电影选择
watch(selectedMovie, (newValue) => {
  if (newValue) {
    createScheduleBlock(newValue)
  } else {
    activeBlock.value = null
    isAttached.value = false
  }
})

// 获取指定影厅的区块
const getTheaterBlocks = (theaterId) => {
  return fixedBlocks.value.filter(block => block.theaterId === theaterId)
}

// 计算活动区块样式
const activeBlockStyle = computed(() => {
  if (!activeBlock.value) return {}
  return activeBlock.value.style
})

// 吸附到时间轴
const attachToAxis = (axisRect, theaterId) => {
  isAttached.value = true
  currentTheater.value = theaterId
  if (activeBlock.value) {
    activeBlock.value.style.background = '#64b5f6'
    activeBlock.value.style.height = '60px'
    activeBlock.value.style.top = `${axisRect.top - 5}px`
  }
}

// 脱离时间轴
const detachFromAxis = (e) => {
  isAttached.value = false
  currentTheater.value = null
  if (activeBlock.value) {
    activeBlock.value.style.background = '#90caf9'
    activeBlock.value.style.height = '50px'
    activeBlock.value.style.left = `${e.clientX}px`
    activeBlock.value.style.top = `${e.clientY}px`
  }
}

// 更新吸附状态位置
const updateAttachedPosition = (e, axisRect) => {
  if (!activeBlock.value) return
  
  const pixelsPerMinute = axisRect.width / 1440
  const snapToMinutes = 5 // 每5分钟对齐一次
  const snapPixels = snapToMinutes * pixelsPerMinute
  
  let left = e.clientX - activeBlock.value.width / 2
  left = left - axisRect.left // 转换为相对于时间轴的位置
  
  // 对齐到最近的5分钟
  left = Math.round(left / snapPixels) * snapPixels
  
  // 确保不超出时间轴范围
  left = Math.max(0, Math.min(left, axisRect.width - activeBlock.value.width))
  
  activeBlock.value.style.left = `${left + axisRect.left}px`
}

// 更新自由状态位置
const updateFreePosition = (e) => {
  if (!activeBlock.value) return
  
  activeBlock.value.style.left = `${e.clientX}px`
  activeBlock.value.style.top = `${e.clientY}px`
}

// 计算时间显示样式
const getTimeDisplayStyle = (event, theaterId) => {
  if (!event) return { display: 'none' }
  
  const timeAxis = event.currentTarget
  const rect = timeAxis.getBoundingClientRect()
  const x = event.clientX - rect.left
  const timeLineWidth = rect.width
  
  const percentage = x / timeLineWidth
  const totalMinutes = 1440 // 24小时 = 1440分钟
  const minutes = Math.round(percentage * totalMinutes)
  
  const hours = minutes / 60
  const displayHours = Math.floor(hours)
  const displayMinutes = Math.floor((hours % 1) * 60)
  currentTime.value = `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}`
  
  return {
    display: 'block',
    left: `${(x / timeLineWidth) * 100}%`,
    top: '-30px',
    transform: 'translateX(-50%)'
  }
}

// 判断是否在屏蔽区域
const isBlockedArea = (e, theaterId) => {
  const timeAxis = e.currentTarget
  const axisRect = timeAxis.getBoundingClientRect()
  const clickX = e.clientX
  
  return fixedBlocks.value.some(block => {
    return block.theaterId === theaterId && 
           clickX >= block.start && 
           clickX <= block.end
  })
}

// 获取电影标题
const getMovieTitle = (movieId) => {
  const movie = availableMovies.value.find(m => m.id === movieId)
  return movie ? movie.name : ''
}

// 检查时间冲突
const hasTimeConflict = (theaterId, start, end) => {
  return fixedBlocks.value.some(block => {
    if (block.theaterId !== theaterId) return false
    
    return (start >= block.start && start < block.end) ||
           (end > block.start && end <= block.end) ||
           (start <= block.start && end >= block.end)
  })
}

// 删除排片
const deleteBlock = (blockId) => {
  fixedBlocks.value = fixedBlocks.value.filter(block => block.id !== blockId)
  ElMessage.success('排片已删除')
}

// 修改时间轴点击处理
const handleTimeAxisClick = (e, theaterId) => {
  if (!activeBlock.value || isBlockedArea(e, theaterId)) return

  const timeAxis = e.currentTarget
  const axisRect = timeAxis.getBoundingClientRect()
  const left = parseFloat(activeBlock.value.style.left)
  const width = activeBlock.value.width
  
  // 检查时间冲突
  if (hasTimeConflict(theaterId, left, left + width)) {
    ElMessage.warning('该时间段已有排片，请选择其他时间')
    return
  }
  
  // 创建固定区块
  const fixedBlock = {
    id: Date.now(),
    theaterId: theaterId,
    movieId: activeBlock.value.movieId,
    start: left,
    end: left + width,
    style: {
      left: `${left - axisRect.left}px`,
      width: `${width}px`
    }
  }
  
  fixedBlocks.value.push(fixedBlock)
  
  // 清除活动区块
  activeBlock.value = null
  isAttached.value = false
  currentTheater.value = null
  selectedMovie.value = ''
  
  ElMessage.success('排片已添加')
}

// 鼠标移动处理
const handleMouseMove = (e) => {
  if (!activeBlock.value) return

  const timeAxis = document.querySelector('.time-axis')
  if (!timeAxis) return
  
  const axisRect = timeAxis.getBoundingClientRect()
  const boxRect = activeBlock.value.style
  
  // 碰撞检测
  const isOverlapY = e.clientY + parseInt(boxRect.height) > axisRect.top && 
                    e.clientY < axisRect.bottom

  // 吸附/脱离处理
  if (isOverlapY && !isAttached.value) {
    const theaterRow = e.target.closest('.theater-row')
    if (theaterRow) {
      const theaterId = parseInt(theaterRow.dataset.theaterId)
      attachToAxis(axisRect, theaterId)
    }
  } else if (!isOverlapY && isAttached.value) {
    detachFromAxis(e)
  }

  // 更新位置
  if (isAttached.value) {
    updateAttachedPosition(e, axisRect)
  } else {
    updateFreePosition(e)
  }
}

// 事件监听
onMounted(() => {
  document.addEventListener('mousemove', handleMouseMove)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove)
})

// 获取影厅名称
const getTheaterName = (theaterId) => {
  const theater = theaters.value.find(t => t.id === theaterId)
  return theater ? theater.name : ''
}

// 获取电影时长
const getMovieDuration = (movieId) => {
  const movie = availableMovies.value.find(m => m.id === movieId)
  return movie ? movie.duration : 0
}

// 格式化时间
const formatTime = (position) => {
  const timeAxis = document.querySelector('.time-axis')
  if (!timeAxis) return ''
  
  const axisRect = timeAxis.getBoundingClientRect()
  const percentage = (position - axisRect.left) / axisRect.width
  const totalMinutes = 1440 // 24小时 = 1440分钟
  const minutes = Math.round(percentage * totalMinutes)
  
  const hours = minutes / 60
  const displayHours = Math.floor(hours)
  const displayMinutes = Math.floor((hours % 1) * 60)
  return `${displayHours.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}`
}

// 显示区块详情
const showBlockDetails = (block) => {
  selectedBlock.value = block
  dialogVisible.value = true
}

// 从对话框删除
const handleSave = async () => {
  try {
    const scheduleData = fixedBlocks.value.map(block => ({
      hallId: block.theaterId,
      movieId: block.movieId,
      scheduleDate: selectedDate.value,
      startTime: formatTime(block.start),
      endTime: formatTime(block.end)
    }))

    //scheduleStore.saveSchedule(scheduleData)
    ElMessage.success('排片保存成功')
  } catch (error) {
    ElMessage.error('保存失败：' + (error.response?.data?.message || error.message))
  }
}

const handleDeleteFromDialog = () => {
  if (selectedBlock.value) {
    deleteBlock(selectedBlock.value.id)
    dialogVisible.value = false
  }
}
</script>

<style scoped>
.schedule-manager {
  padding: 20px;
}

.movie-selector {
  margin-bottom: 20px;
}

.schedule-grid {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.theater-list {
  width: 140px;
  padding-top: 28px;
}

.theater-item {
  height: 60px;
  line-height: 60px;
  margin-bottom: 8px;
  font-size: 14px;
}

.time-ticks {
  display: grid;
  grid-template-columns: repeat(24, 1fr);
  margin-bottom: 12px;
}

.tick {
  font-size: 12px;
  color: #909399;
  text-align: center;
}

.el-select {
  max-width: 280px;
}

.el-select :deep(.el-input__inner) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time-axis {
  margin-top: 4px;
}

.selector-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.el-date-picker {
  width: 180px;
}

.theater-item {
  height: 50px;
  line-height: 50px;
  text-align: center;
  background: #f5f7fa;
  margin-bottom: 10px;
  border-radius: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 8px;
}

.theater-item:hover {
  z-index: 100;
  overflow: visible;
}

.theater-item:hover::before {
  content: attr(data-title);
  position: absolute;
  background: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  left: 50%;
  transform: translateX(-50%);
  top: -30px;
  white-space: nowrap;
}

.time-grid {
  flex: 1;
}

.time-ticks {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.tick {
  font-size: 14px;
  color: #606266;
}

.theater-row {
  margin-bottom: 10px;
}

.time-axis {
  width: 100%;
  height: 50px;
  background: #f0f0f0;
  position: relative;
  border-radius: 8px;
  cursor: pointer;
}

.time-display {
  position: absolute;
  background: #333;
  color: white;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  white-space: nowrap;
  z-index: 3;
  pointer-events: none;
}

.fixed-block {
  position: absolute;
  height: 60px;
  background: linear-gradient(135deg, #64b5f6, #42a5f5);
  border-radius: 6px;
  pointer-events: auto;
  box-shadow: 0 2px 12px rgba(0,0,0,0.15);
  top: -5px;
  z-index: 2;
  cursor: pointer;
  transition: all 0.3s ease;
}

.fixed-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}

.mask-overlay {
  position: absolute;
  background: rgba(0,0,0,0.1);
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.follow-box {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
}

.block-content {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  padding: 4px 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.movie-title {
  font-weight: 500;
  margin-bottom: 2px;
}

.time-info {
  font-size: 10px;
  opacity: 0.9;
}

.delete-btn {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s;
  background: rgba(255, 255, 255, 0.2);
  border: none;
}

.delete-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.fixed-block:hover .delete-btn {
  opacity: 1;
}

.block-details {
  padding: 10px;
}

.detail-item {
  display: flex;
  margin-bottom: 12px;
  line-height: 1.5;
}

.detail-item .label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.detail-item .value {
  flex: 1;
  color: #303133;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
