/**
 * houston/public/scripts/app.js
 * Main entry point for everything client side houston
 */

// eslint-disable-next-line
console.log('Loaded script')

// Juno beta download link
$('document').ready(function () {
  const filename = 'elementaryos-5.0-beta1.20180703.iso'

  if ($('.juno-download').length !== 0) {
    $.get('https://elementary.io/api/config', (data) => {
      if (data.user && data.user.region && data.user.timecode) {
        const { region, timecode } = data.user
        const downloadUrl = `https://${region}.dl.elementary.io/download/${timecode}/${filename}`

        $('.juno-download').each((i, el) => {
          $(el)
            .attr('href', downloadUrl)
            .attr('target', '_blank')
            .attr('disabled', false)
        })
      }
    })
  }
})
