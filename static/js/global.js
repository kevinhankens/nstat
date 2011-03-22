// Admin functions
(function ($) {

  $(document).ready(function() {
    $('.form-item .form-add').click(function() {
      var pid = $(this).parent().attr('id');
      var clone = $('#' + pid + '-input').clone();
      var name = clone.attr('name');
      var ord = parseInt($(this).attr('ord'));
      ord++;
      $(this).attr('ord', ord);
      name = name + ord;
      id = pid + ord + '-input';
      clone.attr('name', name).attr('id', id);
      $(this).before(clone);
    });

    $('.lightbox').fancybox();
  });

})(jQuery);
