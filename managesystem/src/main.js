import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus' // 引入element-plus
import 'element-plus/dist/index.css' // 引入element-plus的css
import router from './router' // 引入路由
import { createPinia } from 'pinia';//引入pinia
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';//引入pinia-plugin-persistedstate

const pinia = createPinia();//创建pinia实例
pinia.use(piniaPluginPersistedstate);//使用pinia-plugin-persistedstate插件

const app = createApp(App)

app.use(ElementPlus) //注册elementplus为全局插件
app.use(router) // 注册路由
app.use(pinia)//注册pinia
app.mount('#app')
