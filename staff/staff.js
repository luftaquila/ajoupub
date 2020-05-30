let staff;
$(function() {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  init();
  eventhandler()
  sockethandler();
});
function init() {
  $.ajax({
    url: "/ajoupub/staff.json",
    type: 'GET',
    cache: false,
    success: function(config) {
      staff = config.staff;
      drawTable(config.tablecount, config.tablerow);
    },
    error: function() { alertify.error('설정 파일을 불러오지 못했습니다.') }
  });
}

function drawTable(count, row) {
  let html = '<table id="table">';
  for(let i = 0; i < count; i++) {
    if(!(i % row)) html += '<tr>';
    let tableid = (Math.floor(i / 3) + 1).toString().padStart(2, '0') + (i % 3 + 1);
    html += '<td id="table_' + tableid + '">' + tableid + '</td>';
    if((i % row) == 2) html += '</tr>';
  }
  html += '</table>';
  $('#tablearea').html(html);
  $.ajax({
    url: '/ajoupub/api/requestTableStatus',
    type: 'POST',
    success: function(res) {
      for(let obj of res) $('#table_' + obj.table).removeClass().addClass(obj.status).attr('data-price', obj.price ? obj.price : '.').attr('data-menu', obj.menu ? obj.menu : '.');
    }
  });
}

function eventhandler() {
  $(document).on('click','.awaitpayment', function() {
    $('#awaitpayment-title').html('<span class="tablenum">' + $(this).attr('id').replace('table_', '') + '</span>번 테이블 결제 인증');
    $('#awaitpayment-content h1.price').text('￦ ' + comma($(this).attr('data-price')));
    MicroModal.show('awaitpayment');
  });
  $(document).on('click','.awaitfood', function() {
    $('#awaitfood-title').html('<span class="tablenum">' + $(this).attr('id').replace('table_', '') + '</span>번 테이블 주문 현황');
    let order = JSON.parse($(this).attr('data-menu')), html = '';
    for(let obj of order) {
      html += '' +
        '<label class="control control--checkbox" style="width: 60%; text-align: right">' + obj.name  + ' ' + obj.quantity + '개' +
          '<input type="checkbox" name="served" value=' + "'" + JSON.stringify(obj) + "' />" +
          '<div class="control__indicator"></div>' +
         '</label>';
    }
    $('#awaitfood-content').html(html);
    MicroModal.show('awaitfood');
  });
  $('#serveok').click(function() {
    let target = $('input[name=served]:checked');
    if(!target.length) { alertify.error('선택된 주문이 없습니다!'); return; }
    let served = { table: $('#awaitfood-title span.tablenum').text(), served: [] };
    for(let obj of target) served.served.push(JSON.parse($(obj).val()));
    socket.emit('servedfoods', served);
  });
  $('#removeorder').click(function() { MicroModal.show('confirm_remove_prompt'); });
  $('#confirm_remove').click(function() {
    MicroModal.close('confirm_remove');
    $('div#awaitpayment').removeClass('is-open');
    socket.emit('orderdeleted', { table: $('#awaitpayment-title span.tablenum').text() });
  });
  $('#verifyorder').click(function() { MicroModal.show('confirm_payment_prompt'); });
  $('#confirm_payment').click(function() {
    let code = $('#staffcode').val();
    let verifier = staff.find(o => o.code == code);
    if(verifier) {
      MicroModal.close('confirm_payment_prompt');
      $('div#awaitpayment').removeClass('is-open');
      socket.emit('orderverified', { table: $('#awaitpayment-title span.tablenum').text(), staff: verifier.name });
    }
    else alertify.error('등록되지 않은 코드입니다');
  });
}

function sockethandler() {
  socket = io.connect('https://luftaquila.io', { path: "/ajoupub/socket", query: "identity=staff" });
  socket.on('connect', init);
  socket.on('connect_error', function() { alertify.error('ERR_SOCKET_NOT_ESTABLISHED<br>소켓 서버가 응답하지 않습니다.'); });
  socket.on('paymentrequest', function(data) {
    alertify.log(data.table + '번 테이블이 결제를 요청합니다.', "", 0);
  });
  socket.on('tablechanged', function(data) {
    let target = $('#table_' + data.table);
    target.attr('data-price', (data.price == '-') ? target.attr('data-price') : data.price).attr('data-menu', (data.menu == '-') ? target.attr('data-menu') : data.menu).removeClass().addClass(data.status);
  });
  socket.on('reloadservedlist', function() {
    let order, html = '';
    try {
      order = JSON.parse($('#table_' + $('#awaitfood-title span.tablenum').text()).attr('data-menu'));
    }
    catch(e) {
      MicroModal.close('awaitfood');
      return;
    }
    for(let obj of order) {
      html += '' +
        '<label class="control control--checkbox" style="width: 60%; text-align: right">' + obj.name  + ' ' + obj.quantity + '개' +
          '<input type="checkbox" name="served" value=' + "'" + JSON.stringify(obj) + "' />" +
          '<div class="control__indicator"></div>' +
         '</label>';
    }
    $('#awaitfood-content').html(html);
  });
  socket.on('queuechanged', function(queue) {
    let html = '';
    for(let obj of queue) {
      html += '<span>' + obj.table + '번 테이블 (' + obj.id + ' | ' + JSON.parse(obj.menu).staff + ')</span><ul style="margin-top: 5px">';
      for(let order of JSON.parse(obj.menu).order) html += '<li>' + order.name + ' ' + order.quantity + '개</li>';
      html += '</ul>'
    }
    $('#queue-content').html(html);
  });
  socket.on('tablereset', init);
}

function comma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }


