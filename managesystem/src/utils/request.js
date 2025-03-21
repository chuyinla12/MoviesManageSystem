import axios from 'axios';

const service = axios.create({
  baseURL: "http://192.168.5.19:8081", // 设置请求基础路径
  timeout: 15000, // 设置超时时间
  headers: {
    'Content-Type': 'application/json;charset=UTF-8'
  },
});

export default service;