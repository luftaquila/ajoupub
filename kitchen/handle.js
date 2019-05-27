latestUpdate = 0, updateFlag = false;
$(function() {
  load();
  setInterval(afterUpdate, 1000);

  $('#confirm').click(function() {
    $('input').attr('disabled', true);
    $('#status').css('color', '#ffbf00');
    $('#status').text('Refreshing...');
    updateFlag = false;

    var checkList = $('input:checkbox:checked'), confirm = '';
    if(!checkList.length) {
      load();
      $('input').attr('disabled', false);
      return;
    }
    for(i = 0; i < checkList.length; i++) confirm += checkList[i].id + '/';

    var request;
    if (request) request.abort();

    var serializedData = 'type=delete&데이터=' + confirm;
    console.log('Dataset : ' + serializedData);
    request = $.ajax({
        type: 'POST',
        url: "https://script.google.com/macros/s/AKfycbyRPHehwoToixRQqGws-ZBaDJLu0SbvrtGU9GArrBx_A7aA5w8/exec",
        data: encodeURI(serializedData)
    });
    request.done(function() {
      $('#status').css('color', '#ffbf00');
      $('#status').text('Refreshing...');
    });
    request.fail(function(jqXHR, textStatus, errorThrown) {
      $('#status').css('color', '#da0000');
      $('#status').text('Error : Refreshing...');
    });
    request.always(function() {
      $('input').attr('disabled', false);
      updateFlag = true;
      load();
    });
  });
});

function load() {
  updateFlag = false;
  $('input').attr('disabled', true);
  $('#status').css('color', '#ffbf00');
  $('#status').text('Refreshing...');

  $.ajax({
  url: 'https://script.google.com/macros/s/AKfycbyRPHehwoToixRQqGws-ZBaDJLu0SbvrtGU9GArrBx_A7aA5w8/exec',
  type: "GET",
  dataType: 'text',
  cache: false,
  success: function (response) {
    var menuList = ['모듬튀김', '떡볶음탕', '두부김치', '김치찌개', '옥수수전', '꼬묵우동', '나쵸치즈', '해장라면', '어묵튀김', '주먹밥', '음료01', '음료02', '사료', '츄르'];
    var response = response.split('\n').map((line) => line.split(','));
    response.pop();

    var queue = [];
    for(i in response) {
      var buffer = response[i][1].split('/');
      buffer.pop();
      for(j in buffer) {
        queue.push([response[i][0] + '번', buffer[j]]);
      }
    }

    for(i in menuList) eval('var queue_' + menuList[i] + '= [];');
    for(i in queue) eval('queue_' + queue[i][1] + '.push([queue[i][0]]);');
    for(k in menuList) {
      str = '';
      eval('for(i in queue_' + menuList[k] + ') str += "<label for=' + "'" + menuList[k] + '" + "|" + ' + "queue_" + menuList[k] + '[i]' + ' + ' + '"' + "'><input type=" + "'" + 'checkbox' + "' id='" + menuList[k] + '" + "|" + ' + 'queue_' + menuList[k] + '[i] + ' + '"' + "'>" + '" + queue_' + menuList[k] + '[i] + "</input></label>&nbsp;&nbsp;"');
      $('#queue_' + menuList[k]).html(str);
    }
    $('#status').css('color', '#15be00');
    $('#status').text('Updated');
    latestUpdate = new Date();
    updateFlag = true;
    $('input').attr('disabled', false);
  }
});
}
function afterUpdate() {
  if(updateFlag) {
    if(new Date() - latestUpdate > 30000) load();
    $('#status').text('Updated ' + Math.round((new Date() - latestUpdate) / 1000) + ' sec ago');
  }
}
