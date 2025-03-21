// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Login from '../components/Login.vue';
import ScheduleManager from '../components/ScheduleManager.vue';
import UserView from '../components/UserView.vue';
import TheaterManagement from '../views/TheaterManagement.vue';
import PricingManager from '../components/PricingManager.vue';

import NavBar from '../components/NavBar.vue';

const routes = [
  {
    path: '/',
    redirect: '/schedule'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/schedule',
    name: 'Schedule',
    component: ScheduleManager
  },
  {
    path: '/user-view',
    name: 'UserView',
    component: UserView
  },
  {
    path: '/theater',
    name: 'Theater',
    component: TheaterManagement
  },
  {
    path: '/pricing',
    name: 'Pricing',
    component: PricingManager
  },
  {
    path: '/nav',
    name: 'Nav',
    component: NavBar
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;