/**
 * houston/nuxt.config.js
 * Configuration for nuxt. Duh. Has to be regular node commonjs modules
 */

const path = require('path')

module.exports = {
  srcDir: path.resolve(__dirname, './src/client'),

  /**
   * All of the default head properties to insert.
   *
   * @see https://github.com/declandewet/vue-meta#recognized-metainfo-properties
   */
  head: {
    titleTemplate: (title) => {
      if (title) {
        return `${title} - Developer ⋅ elementary`
      } else {
        return 'Developer ⋅ elementary'
      }
    },

    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0' },

      { name: 'description', content: 'Resources for designing, developing, and publishing apps for elementary OS' },
      { name: 'author', content: 'elementary LLC' },
      { name: 'theme-color', content: '#403757' },

      { name: 'name', content: 'Developer ⋅ elementary' },
      { name: 'description', content: 'Resources for designing, developing, and publishing apps for elementary OS' },
      { name: 'image', content: 'https://elementary.io/images/developer/preview.png' },

      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@elementary' },
      { name: 'twitter:creator', content: '@elementary' },

      { name: 'og:title', content: 'Developer ⋅ elementary' },
      { name: 'og:description', content: 'Resources for designing, developing, and publishing apps for elementary OS' },
      { name: 'og:image', content: 'https://elementary.io/images/developer/preview.png' },

      { name: 'apple-mobile-web-app-title', content: 'Dashboard' }
      // { name: 'apple-touch-icon', content: '/images/apple-touch-icon.png' }
    ],

    link: [
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Open+Sans:300,400' }
    ]
  },

  /**
   * Cool style for the nuxt progress bar
   *
   * @var {Object}
   */
  loading: {
    color: '#3892e0',
    failedColor: '#da4d45'
  },

  ErrorPage: '~/pages/error'
}
