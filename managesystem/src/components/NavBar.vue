<template>
  <el-menu
    :default-active="activeIndex"
    class="nav-menu"
    mode="horizontal"
    router
  >
    <el-menu-item index="/schedule">排片管理</el-menu-item>
    <el-menu-item index="/theater">影厅管理</el-menu-item>
    <el-menu-item index="/pricing">票价管理</el-menu-item>
  </el-menu>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const activeIndex = computed(() => route.path)
</script>

<style scoped>
.nav-menu {
  padding: 0 20px;
}
</style> 