/*
 * @Description: description
 * @Version: 2.0
 * @Autor: liushuhao
 * @Date: 2023-11-02 09:09:56
 * @LastEditors: liushuhao
 * @LastEditTime: 2023-11-02 09:11:53
 */
import { createApp } from 'vue';
import App from './App.vue';
// import router from './router';
import store from './store';

createApp(App).use(store).mount('#app');
