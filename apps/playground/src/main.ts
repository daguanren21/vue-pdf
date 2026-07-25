import Vue from 'vue'
import App from './App.vue'
import '@daguanren21/vue-pdf/style.css'

// Worker is auto-configured by @daguanren21/vue-pdf
// (local pdf.worker.min.mjs via import.meta.url).

new Vue({
  render: h => h(App),
}).$mount('#app')
