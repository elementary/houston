/**
 * houston/src/client/pages/error.vue
 * An awesome error page for houston
 */

<template>
  <main>
    <h1>{{ statusCode }}</h1>

    <h2 v-if="statusCode === 404">Page Not Found</h2>
    <h2 v-else-if="statusCode >= 500">Internal Server Error</h2>
    <h2 v-else>Error</h2>

    <p v-if="development">{{ message }}</p>

    <nuxt-link to="/">Developer Pages</nuxt-link>
  </main>
</template>

<style scoped>
  main {
    display: block;
    margin: 10vh auto 4vh;
    padding: 0 1rem;
    text-align: center;
  }

  h1 {
    font-size: 30vw;
    font-weight: 600;
    margin: 0;
  }

  h2 {
    font-size: 9vw;
    font-weight: 300;
    margin: 0 0 6vh 0;
  }

  p {
    font-size: 1.2rem;
    font-weight: 400;
    margin: 2vh 0 4rem;
  }

  a {
    color: #3892e0;
    font-weight: 400;
  }

  @media only screen and (min-width: 600px) {
    h1 {
      font-size: 11.25rem;
    }

    h2 {
      font-size: 3.375rem;
    }
  }
</style>

<script>
  export default {
    props: {
      error: {
        type: Object,
        default: () => ({ statusCode: 500 }),
        required: true
      }
    },

    layout: 'blank',

    head () {
      return {
        title: this.message
      }
    },

    watch: {
      error (error) {
        if (error) {
          console.error(error)
        }
      }
    },

    computed: {
      development () {
        return (process.env.NODE_ENV === 'development')
      },

      statusCode () {
        if (this.error && this.error.statusCode) {
          const code = Number(this.error.statusCode)

          if (!isNaN(code)) {
            return code
          }
        }

        return 500
      },

      message () {
        return this.error.message || 'Internal Server Error'
      }
    }
  }
</script>
