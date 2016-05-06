$(function () {
  var $document = $(document)

  $document.on('mouseover', '.popover > a', function (event) {
    var $body = $('body')
    var $link = $(event.target)
    var $popover = $link.parent()
    var $content = $popover.find('.popover-content')

    $popover.addClass('active')

    var popoverPos = ($popover.outerWidth() / 2) - ($content.outerWidth() / 2)
    $content.css({ left: popoverPos })

    $document.on('mouseover', $body, function (event) {
      if (!$(event.target).is('.popover *')) {
        $popover.removeClass('active')
      }
    })
  })
})
