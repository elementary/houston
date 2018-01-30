/**
 * houston/src/client/layouts/default.vue
 * The default houston layout with a header, navigation, and footer.
 */

<template>
  <div>
    <the-navbar />

    <nuxt />
  </div>
</template>

<style>
  html,
  body {
    padding: 0;
    margin: 0;
  }

  body {
    background-color: #fff;
    font-family: "Open Sans", Helvetica, sans-serif;
  }
</style>

<script>
  import TheNavbar from '../components/the-navbar'

  export default {
    components: {
      TheNavbar
    }
  }
</script>
