/* global fetch:false */

import Vue from 'vue'

export default new Vue({
  el: '#content-container',
  data: {
    projects: []
  },
  async ready () {
    const res = await fetch('/api/add', {credentials: 'same-origin'})
    const body = await res.json()
    this.projects = body.data
  }
})
