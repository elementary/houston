import Vue from 'vue'

new Vue({
  el: '#content-container',
  data: {
    projects: []
  },
  async ready() {
    const res = await fetch('/api/add', {credentials: 'same-origin'})
    const body = await res.json()
    this.projects = body.data
  }
})
