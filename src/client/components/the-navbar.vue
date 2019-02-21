/**
 * houston/src/client/components/the-navbar.vue
 * The main top navigation bar.
 */

<template>
  <div class="wrapper">
    <div class="content">
      <ul>
        <li><a href="https://elementary.io" class="logomark">
          <img src="../images/brand/elementary-logomark.svg">
        </a></li>

        <li><a href="https://elementary.io/support">Support</a></li>
        <li><nuxt-link to="/">Developer</nuxt-link></li>
        <li><a href="https://elementary.io/get-involved">Get Involved</a></li>
        <li><a href="https://elementary.io/store/">Store</a></li>
      </ul>

      <ul>
        <li><a href="https://www.facebook.com/elementaryos" target="_blank" rel="noopener">
          <font-awesome-icon :icon="Facebook" />
        </a></li>

        <li><a href="https://medium.com/elementaryos" target="_blank" rel="noopener">
          <font-awesome-icon :icon="Medium" />
        </a></li>

        <li><a href="https://www.reddit.com/r/elementaryos" target="_blank" rel="noopener">
          <font-awesome-icon :icon="Reddit" />
        </a></li>

        <li><a href="https://elementaryos.stackexchange.com" target="_blank" rel="noopener">
          <font-awesome-icon :icon="StackExchange" />
        </a></li>

        <li><a href="https://twitter.com/elementary" target="_blank" rel="noopener">
          <font-awesome-icon :icon="Twitter" />
        </a></li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
  .wrapper {
    -moz-osx-font-smoothing: grayscale;
    -webkit-font-smoothing: antialiased;
    display: flex;
    font-size: 0.875rem;
    line-height: 1em;
    overflow-x: auto;
    text-shadow: rgba(100, 100, 100, 0.14) 0px 1px 1px;
    width: 100%;
  }

  .content {
    align-content: center;
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    justify-content: space-between;
    margin: 0 auto;
    max-width: 1200px;
    width: 100%;
  }

  ul {
    display: inline-block;
    flex: 0 0 auto;
    margin: 0;
    padding: 0;
  }

  li {
    display: inline-block;
    list-style: none;
    vertical-align: middle;
  }

  a {
    color: #333;
    display: block;
    fill: #333;
    line-height: 3em;
    padding: 0 0.75rem;
    text-decoration: none;
  }

  a:hover {
    opacity: 0.7;
  }

  .logomark {
    line-height: 0;
  }

  img {
    height: 22px;
    width: 22px;
  }

  svg {
    min-width: 20px;
    height: 1em;
  }

  @media only screen and (min-width: 768px) {
    a {
      font-size: 1rem;
    }
  }
</style>

<script>
  import FontAwesome from '@fortawesome/fontawesome'
  import FontAwesomeIcon from '@fortawesome/vue-fontawesome'

  import Facebook from '@fortawesome/fontawesome-free-brands/faFacebookF'
  import GooglePlus from '@fortawesome/fontawesome-free-brands/faGooglePlusG'
  import Medium from '@fortawesome/fontawesome-free-brands/faMediumM'
  import Reddit from '@fortawesome/fontawesome-free-brands/faReddit'
  import StackExchange from '@fortawesome/fontawesome-free-brands/faStackExchange'
  import Twitter from '@fortawesome/fontawesome-free-brands/faTwitter'

  // BUG: Fixes Font Awesome auto injecting CSS causing large icons
  FontAwesome.config = { autoAddCss: false }

  export default {
    components: {
      FontAwesomeIcon
    },

    computed: {
      Facebook: () => Facebook,
      GooglePlus: () => GooglePlus,
      Medium: () => Medium,
      Reddit: () => Reddit,
      StackExchange: () => StackExchange,
      Twitter: () => Twitter,
    }
  }
</script>
