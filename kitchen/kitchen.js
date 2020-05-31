$(function() {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  init();
  sockethandler();
  eventhandler();
});

function init() {
  $.ajax({
    url: "/ajoupub/menu.json",
    type: 'GET',
    cache: false,
    success: function(res) {
      delete res.set;
      menu = res.main.concat(res.sub);

      let html = '';
      html += `
          <div id="danger" style="display: table; width: 100%; margin-top: 20px">
            <div style="display: table-cell; text-align: center; vertical-align: middle;"><a class='btn green' style='padding: 13px 15px!important;' onclick='MicroModal.show("queue");'>주문</a></div>
            <div style="display: table-cell; text-align: center; vertical-align: middle;"><a class='btn blue' style='padding: 13px 15px!important;' onclick='MicroModal.show("menuqueue");'>메뉴</a></div>
            <div style="display: table-cell; text-align: center; vertical-align: middle;"><a class='btn red' style='padding: 13px 15px!important; font-weight: bold' onclick='MicroModal.show("reset_confirm");'>⚠ 초기화 ⚠</a></div>
            <div style="display: table-cell; text-align: center; vertical-align: middle;"><a class='btn purple' style='padding: 13px 15px!important;' href='/ajoupub/statistics'>통계</a></div>
          </div>`;
      html += '<div style="display: flex; width: 100%; margin: 20px 0px 10px; line-height: 1.5rem;"><div style="width: 15%; margin-left: 4%;"><hr></div><div style="width: 30%; text-align: center;"><span style="font-size: 1.5rem">메인 메뉴</span></div><div style="width: 44%"><hr></div></div>';
      html += htmlBuilder(res.main);
      html += '<div style="display: flex; width: 100%; margin: 40px 0px 10px; line-height: 1.5rem;"><div style="width: 15%; margin-left: 4%;"><hr></div><div style="width: 30%; text-align: center;"><span style="font-size: 1.5rem">서브 메뉴</span></div><div style="width: 44%"><hr></div></div>';
      html += htmlBuilder(res.sub);
      $('#wrap').html(html);
      setInterval(function() { return menuUpdater(queueinfo); }, 5000);
    },
    error: function() { alertify.error('메뉴 목록을 불러오지 못했습니다.'); }
  });
}

function menuUpdater(data) {
  for(let obj of data) {
    let eta = obj.cooktime * 60000 + obj.start + (Math.floor(obj.queue / obj.slot) * obj.cooktime + obj.offset) * 60000 - Date.now();
    eta = (eta > obj.cooktime * 60000) ? Math.round(eta / 60000) : obj.cooktime;
    $('#' + obj.name + ' span.queuecount').text(obj.queue);
    $('#' + obj.name + ' input.eta').val(eta);
    $('#' + obj.name + ' input.isReady').prop('checked', obj.isReady);
  }
}

function eventhandler() {
  $(document).on('click','i.minus, i.plus', function() {
    let target = $(this).parent().parent().parent().parent();
    let value = $(this).siblings('input').val();
    if($(this).attr('class').includes('plus')) socket.emit('queueupdated', { name: target.attr('id'), key: 'eta', value: 5 });
    else if($(this).attr('class').includes('minus')) socket.emit('queueupdated', { name: target.attr('id'), key: 'eta', value: -5 });
  });
  $(document).on('change','input.isReady', function() {
    let target = $(this).parent().parent().parent().parent();
    socket.emit('queueupdated', { name: target.attr('id'), key: 'isReady', value: $(this).is(':checked') });
  });
  $('#reset').click(function() {
    socket.emit('resetall', {});
    MicroModal.close('reset_confirm');
  });
}

function sockethandler() {
  socket = io.connect('https://luftaquila.io', { path: "/ajoupub/socket", query: "identity=kitchen" });
  socket.on('queueinfo', function(data) { queueinfo = data; menuUpdater(data); });
  socket.on('queuechanged', function(queue) {
    let html = '', htmlstr = '';
    for(let i in menu) menu[i].array = [];
    for(let obj of queue) {
      let objmenu = JSON.parse(obj.menu);
      html += '<span>' + obj.table + '번 테이블 (' + obj.id + ' | ' + objmenu.staff + ')</span><ul style="margin-top: 5px">';
      for(let order of objmenu.order) {
        html += '<li>' + order.name + ' ' + order.quantity + '개</li>';
        let target = menu.find(o => o.name == order.name);
        if(target) {
          if(!target.array) target.array = [ { table: obj.table, quantity: order.quantity } ];
          else target.array.push({ table: obj.table, quantity: order.quantity });
        }
      }
      html += '</ul>';
    }
    for(let obj of menu) {
      htmlstr += '<li>' + obj.name + '<ul class="list">';
      for(let item of obj.array) htmlstr += '<code>' + item.table + '번: ' + item.quantity + '개</code>';
      htmlstr += '</ul></li>'
    }
    $('#queue-content').html(html);
    $('#menuqueue-content').html(htmlstr);
  });
}

function htmlBuilder(list) {
  let html = '';
  for(let obj of list) {
    html += `
    <div id="` + obj.name + `" class="card" style="--background:#3C3B3D; --text:white;">
      <div class="container">
        <div style="display: table; height: 35%; width: 100%; font-size: 2rem; font-weight: bold;"><span style="display: table-cell;  text-align:center; vertical-align:middle;">` + obj.name + ` : <span class="queuecount">5</span></span></div>
        <div style="height: 35%;">
          <div style="text-align: left; margin-left: 0.5rem">소요 시간</div>
          <div style="font-size: 2rem">
            <i class="minus fas fa-minus-circle"></i>
            <input class="eta" type="number" readonly value="0" style="width: 3rem; height: 2rem; font-size: 2rem; text-align: center"><span style="font-size: 2rem"> 분</span>
            <i class="plus fas fa-plus-circle"></i>
          </div>
        </div>
        <div style="height: 30%; margin-top: 0.3rem">
          <label class="switch">
            <input class="isReady" type="checkbox" checked>
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>`;
  }
  return html;
}

