$(function () {
    var $document;

    $document = $(document);

    $document.on('mouseover', '.popover > a', function (event) {
        event.preventDefault();

        var $body = $('body');
        var $link = $(event.target);
        var $popover = $link.parent();
        var $content = $popover.find('.popover-content');

        $popover.addClass('active');

        var popoverPos = ( $popover.outerWidth() / 2 ) - ( $content.outerWidth() / 2 );
        $content.css({ left: popoverPos });

        $document.on('click scroll touchmove mousewheel wheel', function (event) {
            if (!$(event.target).is('.popover-content *')) {
                event.stopImmediatePropagation();
                event.preventDefault();
            }

            $popover.removeClass('active');
            $body.click();
        });
    });
});
