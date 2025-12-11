import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// Pinia must be installed before router (router guards use stores)
app.use(pinia)
app.use(router)

app.mount('#app')
