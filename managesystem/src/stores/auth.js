// src/stores/auth.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('ACCESS_TOKEN') || '');

  const setToken = (newToken) => {
    token.value = newToken;
    localStorage.setItem('ACCESS_TOKEN', newToken); // 同时存储到 localStorage
  };

  const clearToken = () => {
    token.value = '';
    localStorage.removeItem('ACCESS_TOKEN');
  };

  return { token, setToken, clearToken };
}, {
  persist: true // 启用持久化
});