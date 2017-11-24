$(function() {
  $('.event-join-btn').click(function(e) {
    var $el = $(e.currentTarget);
    if ($el.hasClass('loading')) return;
    $el.addClass('loading');
    $.ajax({
      url: '/api/event/' + $el.data('id') + '/join',
      method: 'POST',
      dataType: 'json',
      success: function(data) {
        $('.event .num-join').text(data.numLikes);
        $('.event-join-btn').hide();
      },
      error: function(data, status) {
        if (data.status == 401) {
          alert('Login required!');
          location = '/signin';
        }
        console.log(data, status);
      },
      complete: function(data) {
        $el.removeClass('loading');
      }
      
    });
  });

}); 