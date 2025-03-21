<template>
  <div class="user-view">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>电影排片信息</span>
        </div>
      </template>
      <el-table :data="schedules" style="width: 100%">
        <el-table-column prop="theaterName" label="影厅" width="120" />
        <el-table-column prop="movieTitle" label="电影" />
        <el-table-column prop="startTime" label="开始时间" width="120" />
        <el-table-column prop="endTime" label="结束时间" width="120" />
        <el-table-column prop="duration" label="时长" width="100">
          <template #default="scope">
            {{ scope.row.duration }}分钟
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const schedules = ref([])

// 模拟数据
onMounted(() => {
  schedules.value = [
    {
      theaterName: '1号厅',
      movieTitle: '电影1',
      startTime: '10:00',
      endTime: '12:00',
      duration: 120
    },
    {
      theaterName: '2号厅',
      movieTitle: '电影2',
      startTime: '14:00',
      endTime: '15:30',
      duration: 90
    }
  ]
})
</script>

<style scoped>
.user-view {
  padding: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: bold;
}
</style> 