let cart = [];
let menus;
$(function() {
  (function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  init();
  eventhandler();
  sockethandler();
});
function init() {
  window.onbeforeunload = function(e) {
    let dialogText = '지금 페이지를 닫으면 주문서가 사라져요';
    e.returnValue = dialogText;
    return dialogText;
  };
  table = location.search.substr(location.search.indexOf("?") + 1);
  table = table.substr(table.indexOf('=') + 1);
  $('#tablenum').text(table);
  $.ajax({
    url: "/ajoupub/menutemp.json",
    type: 'GET',
    cache: false,
    success: function(menu) {
      menus = menu
      let setmenu = '', mainmenu = '', submenu = '';
      for(let set of menu.set) {
        let list8000 = '', list7000 = '';
        for(let main of menu.main) {
          if(main.price == 8000) list8000 += main.name + ' / ';
          else if(main.price == 7000) list7000 += main.name + ' / ';
        }
        list8000 = '<span class="list8000">' + list8000.trim().substring(list8000.trim().lastIndexOf(' ') + 1, 0) + ' 中 택 1<br></span>';
        list7000 = '<span class="list7000">' + list7000.trim().substring(list7000.trim().lastIndexOf(' ') + 1, 0) + ' 中 택 1<br></span>';
        let detail = set.contents.replace(/\+/g, ' + ').replace('8000*1', list8000).replace('7000*1', list7000).replace('10000*1', '<span>모듬튀김 1</span>').replace(/3000\*(\d)/, '<span class="side">주먹밥 $1</span> ').replace(/ \+ 2000\*(\d)/g, '<span class="drink"> + 음료 $1</span> ').replace('main', '<span>메인메뉴 전체</span>');
        setmenu += "" +
          "<div class='setcontent setmenu ripple' id='" + set.name + "'>" +
            "<img style='width: 75px; height: 75px; margin: 0px 3%' src='/ajoupub/res/images/menu/preview/" + set.name + "_preview.jpg' />" +
            "<div style='width: 68%; margin-left: 1%; text-align: center; word-break: keep-all'>" +
              "<span class='setname' style='font-size: 1rem; font-weight: bold'>" + set.name + "</span>&nbsp;&nbsp;<span class='priceforview'><del>￦" + comma(set.originprice) + "</del> → ￦" + comma(set.price) + "</span><br><span style='line-height: 0.5rem'><br></span>" +
              "<span class='price' style='display: none'>" + set.price + "</span>" +
              "<span class='description' style='display: none'>" + set.description + "</span>" +
              "<span class='detail' style='line-height: 1.2rem'>" + detail + "</span>" +
            "</div>" +
          "</div>";
      }
      for(let main of menu.main) {
        mainmenu += "" +
          "<div class='menucontent mainmenu ripple' id='" + main.name + "'>" +
              "<img style='width: 75px; height: 75px; margin: 10px auto 5px' src='/ajoupub/res/images/menu/preview/" + main.name + "_preview.jpg' /><br>" +
              "<span class='menuname'>" + main.name + "</span><br>" +
              "<span class='priceforview'>￦" + comma(main.price) + "</span><br><br>" +
              "<span class='price' style='display: none'>" + main.price + "</span>" +
              "<span class='description' style='display: none'>" + main.description + "</span>" +
              "소요시간 <span class='timespent'>-</span>분" +
          "</div>";
      }
      for(let sub of menu.sub) {
        submenu += "" +
          "<div class='menucontent submenu ripple' id='" + sub.name + "'>" +
              "<img style='width: 75px; height: 75px; margin: 10px auto 5px' src='/ajoupub/res/images/menu/preview/" + sub.name + "_preview.jpg' /><br>" +
              "<span class='menuname'>" + sub.name + "</span><br><br>" +
              "<span class='priceforview'>￦" + comma(sub.price) + "</span>" +
              "<span class='price' style='display: none'>" + sub.price + "</span>" +
              "<span class='description' style='display: none'>" + sub.description + "</span>" +
          "</div>";
      }
      $('#tab_set').html(setmenu);
      $('#tab_main').html(mainmenu);
      $('#tab_sub').html(submenu);
      
      $('.menucontent').click(function() {
        let obj = $(this);
        $('#menudetail-title').text(obj.attr('id'));
        let modalhtml = "" +
          "<img style='width: 200px; height: 200px;' src='/ajoupub/res/images/menu/" + obj.children('span.menuname').text() + ".jpg' />" +
          "<div style='margin-top: 1.5rem; line-height: 1.2rem'>" +
            "<span style='font-size: 1.2rem'>" + obj.children('span.menuname').text() + ' ' + obj.children('span.priceforview').text() + "</span><br><br>" +
            "<span>" + obj.children('span.description').text() + "</span><br><br>" +
            '<span style="font-size: 1.5rem"><i class="fas fa-minus-circle"></i>&nbsp;&nbsp;<input id="orderamount" type="number" readonly value="1" style="width: 2rem; height: 1.5rem; font-size: 1.3rem; text-align: center">&nbsp;&nbsp;<i class="fas fa-plus-circle"></i></span>' +
            "<span class='price' style='display: none'>" + obj.children('span.price').text() + "</span>" +
          "</div>";
        $('#menudetail-content').html(modalhtml);
        $('div i.fas').click(function() {
          let target = $(this).siblings('input')
          if($(this).attr('class').includes('plus')) target.val(Number(target.val()) + 1);
          else if(Number(target.val()) > 1) target.val(Number(target.val()) - 1);
        });
        MicroModal.show('menudetail');
      });
      $('.setcontent').click(function() {
        let obj = $(this);
        $('#setdetail-title').text(obj.attr('id'));
        let html8000 = "" + 
          '<div class="dropdown menu8000">' +
            '<div class="select">' +
              '<span>8000원 메뉴</span>' +
              '<i class="fa fa-chevron-left"></i>' +
            '</div>' +
            '<input type="hidden" name="8000">' +
            '<ul class="dropdown-menu">';
        let html7000 = html8000.replace(/8000/g, '7000');
        let htmldrink = html8000.replace(/8000/g, 'drink').replace('drink원 메뉴', '음료').replace('class="dropdown menudrink"', 'class="dropdown menudrink" style="width: 5rem!important"').replace('name="drink"', 'name="drink[]"');
        for(let main of menu.main) {
          if(main.price == 8000) html8000 += '<li>' + main.name + '</li>';
          else if(main.price == 7000) html7000 += '<li>' + main.name + '</li>';
        }
        for(let sub of menu.sub) { if(sub.price == 2000) htmldrink += '<li>' + sub.name + '</li>'; }
        html8000 += '</ul></div>';
        html7000 += '</ul></div>';
        htmldrink += '</ul></div>&nbsp;';
        let modalhtml = "" +
          "<img style='width: 200px; height: 200px;' src='/ajoupub/res/images/menu/" + obj.children('div').children('span.setname').text() + ".jpg' />" +
          "<div style='margin-top: 1.5rem; line-height: 1.2rem'>" +
            "<span style='font-size: 1.2rem'>" + obj.children('div').children('span.setname').text() + ' ' + obj.children('div').children('span.priceforview').html() + "</span><br><br>" +
            "<span>" + obj.children('div').children('span.description').text() + "</span><br><br>" +
            "<span class='content' style='word-break:keep-all; line-height: 1.5rem'>" + obj.children('div').children('span.detail').html().replace(/\+/g, '&nbsp;&nbsp;+&nbsp;&nbsp;') + "</span><br><br>" +
            "<span class='price' style='display: none'>" + obj.children('div').children('div span.price').text() + "</span>" +
          "</div>";
        $('#setdetail-content').html(modalhtml);
        
        let drinkcount = $('#setdetail-content span.content').children('span.drink').text().match(/(\d)/g)[0];
        
        $('#setdetail-content span.content').children('span.list8000').after($(html8000)).remove('span.list8000');
        $('#setdetail-content span.content').children('span.list7000').after($(html7000 + '<br><span style="line-height: 0.3rem"><br></span>')).remove('span.list7000');
        $('#setdetail-content span.content').children('span.drink').after($('<br><span style="line-height: 0.1rem"><br></span>+ ' + htmldrink.repeat(drinkcount))).remove('span.drink');

        
        /*Dropdown Menu*/
        $('.dropdown').click(function () {
          $(this).attr('tabindex', 1).focus();
          $(this).toggleClass('active');
          $(this).find('.dropdown-menu').slideToggle(300);
        });
        $('.dropdown').focusout(function () {
          $(this).removeClass('active');
          $(this).find('.dropdown-menu').slideUp(300);
        });
        $('.dropdown .dropdown-menu li').click(function () {
          $(this).parents('.dropdown').find('span').text($(this).text());
          $(this).parents('.dropdown').find('input').attr('value', $(this).text());
        });
        /*End Dropdown Menu*/

        $('.dropdown-menu li').click(function () {
          var input = '<strong>' + $(this).parents('.dropdown').find('input').val() + '</strong>',
            msg = '<span class="msg">Hidden input value: ';
          $('.msg').html(msg + input + '</span>');
        }); 
        
        MicroModal.show('setdetail');
      });
    },
    error: function() {
      alertify.error('메뉴 목록을 불러오지 못했습니다.');
    }
  });
}
function eventhandler() {
  $('ul.tabs li').click(function() {
    let tab_id = $(this).attr('data-tab');
    $('ul.tabs li').removeClass('current');
    $('.tab-content').removeClass('current');
    $(this).addClass('current');
    $("#" + tab_id).addClass('current');
  });
  $('#addorder').click(function() {
    cart.push({
      "name": $('#menudetail-title').text(),
      "price": Number($('#menudetail span.price').text()) * Number($('#menudetail input').val()),
      "quantity": Number($('#menudetail input').val()),
      "content" : ""
    });
    queueWriter();
    MicroModal.close('menudetail');
  });
  $('#addset').click(function() {
    let drinks = $('input[name^=drink]').map(function(idx, elem) { return $(elem).val(); }).get();
    if($('#setdetail-title').text() != '호승이 세트' && (!$('input[name=8000]').val() || !$('input[name=7000]').val())) {
      alertify.error('메뉴를 선택해 주세요!');
      return;
    }
    else if(drinks.includes("")) {
      alertify.error('음료를 선택해 주세요!');
      return;
    }
    let content = $('#setdetail-content span.content span');
    let set = [];
    for(let obj of content) {
      obj = $(obj).text().trim();
      if(!obj) continue;
      else if(obj == '메인메뉴 전체') {
        for(let main of menus.main) {
          set.push({
            'name': main.name,
            'quantity': 1
          });
        }
      }
      else if(obj.match(/\d/)) {
        let [name, quantity] = obj.replace(/(\d)/g, '*$1').split('*').map(function(i) { return i.trim(); });
        let target = set.find(o => o.name == name);
        if(target) target.quantity += quantity;
        else set.push({
          'name': name,
          'quantity': Number(quantity)
          //"price": (menus.main.find(o => o.name == name)) ? (menus.main.find(o => o.name == name).price) : (menus.sub.find(o => o.name == name).price)
        });
      }
      else {
        let target = set.find(o => o.name == obj);
        if(target) target.quantity++;
        else set.push({
          'name': obj,
          'quantity': 1
          //"price": (menus.main.find(o => o.name == obj)) ? (menus.main.find(o => o.name == obj).price) : (menus.sub.find(o => o.name == obj).price)
        });
      }
    }    
    cart.push({
      "name": $('#setdetail-title').text(),
      "price": Number($('#setdetail span.price').text()),
      "quantity": "",
      "content": set
    });
    queueWriter();
    MicroModal.close('setdetail');
  });
  $('#order').click(function() {
    if(!cart.length) { alertify.error('주문 목록이 비어있습니다!'); return; }
    let orderhtml = '';
    for(let obj of cart) {
      if(obj.content) {
        orderhtml += '<span style="font-weight: bold">' + obj.name + '</span><span style="float:right">￦ ' + comma(obj.price) + '</span><br><ul style="margin-top: 5px">';
        for(let content of obj.content) orderhtml += '<li>' + content.name + ' ' + content.quantity + '개</li>';
        orderhtml += '</ul>';
      }
      else orderhtml += obj.name + ' ' + obj.quantity + '개 <span style="float: right">￦ ' + comma(obj.price) + '</span><br>';
    }
    orderhtml += '<br><h3 style="float: right; margin: 0px;">총 ' + $('#price').text() + '</h3><br>';
    $('#orderdetail-content').html(orderhtml);
    MicroModal.show('orderdetail');
  });
  $('#pay').click(function() {
    MicroModal.show('payment');
    socket.emit('paymentcall', { table: table, price: $('#payprice').text().replace('￦', '').replace(',', '').trim() });  
  });
  $('.account').click(function() {
    let target = this;
    target.select();
    target.setSelectionRange(0, 99999);
    document.execCommand("copy");
    alert("클립보드에 복사되었습니다: " + target.value);
  });
}

function sockethandler() {
  socket = io.connect('https://luftaquila.io', { path: "/ajoupub/socket", query: "identity=client" });
  socket.on('closingorder', function(data) {
    if(data.table == table) {
      MicroModal.close('payment');
      $('div#orderdetail').removeClass('is-open');
      $('#info-content').text('주문이 취소되었습니다.');
      MicroModal.show('info');
    }
  });
  socket.on('orderconfirmed', function(data) {
    if(data.table == table) {
      MicroModal.close('payment');
      $('div#orderdetail').removeClass('is-open');
      $('#info-content').text('주문 완료~!');
      MicroModal.show('info');
      socket.emit('orderdetail', { table: table, order: cart, price: $('#payprice').text().replace('￦', '').replace(',', '').trim(), staff: data.staff });  
    }
  });
}

function queueWriter() {
  let target = $('#payment_queue'), total = 0, count = 0;
  target.html('');
  for(let obj of cart) {
    target.append('<div style="padding: 10 20 0; font-size: 1.2rem"><span class="count" style="display: none">' + count + '</span><span>' + obj.name + (obj.quantity ? (' ' + obj.quantity + '개') : '') + '</span><div style="float:right"><span>￦' + comma(obj.price) + '</span>&nbsp;&nbsp;&nbsp;&nbsp;<i class="fas fa-minus-circle removeorder"></i></div>');
    total += obj.price;
    count ++;
  }
  $('#price').text('￦ ' + comma(total));
  $('#payprice').text('￦ ' + comma(total));
  $('.removeorder').click(function() {
    cart.splice($(this).parent().siblings('span.count').text(), 1);
    queueWriter();
  });
}

function comma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }


