// Admin functions
(function ($) {

  $(document).ready(function() {

    // Attach a click handler to the "Add more" link on multi-value
    // form items. This clones the item
    $('.form-item.multi .form-add').click(function() {
      var pid = $(this).parent().attr('id');
      var clone = $(this).parent().find('.prototype').clone();
      var name = clone.attr('name');
      var ord = parseInt($(this).attr('ord'));
      ord++;
      $(this).attr('ord', ord);
      name = name + ord;
      id = pid + ord + '-input';
      clone.attr('name', name).attr('id', id).attr('class', 'copy');
      $(this).before(clone);
    });

    $('.lightbox').fancybox();
  });

})(jQuery);
