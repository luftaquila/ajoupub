$(function() {
  $('#status').css('color', '#15be00');
  $('#status').text('Ready');
  $('#cancle').click(function() {
    $('input:radio[name=set]:checked').prop('checked', false);
    $('#cancle').prop('checked', false);
  });
  $('#proceed').click(function() {
    var value = $('#proceed').attr('value'), tableNum = $('#tableNum').val();
    var list = $('input:checkbox[name=menu10]:checked, input:checkbox[name=menu8]:checked, input:checkbox[name=menu7]:checked, input:checkbox[name=menuSide]:checked');
    var price = 0, orderList = '';

    if(value == '결제 진행') {
      if(tableNum == '') {
        $('#status').css('color', '#da0000');
        $('#status').text('Table?');
        return;
      }
      if(!list.length) {
        $('#status').css('color', '#da0000');
        $('#status').text('Menu?');
        return;
      }

      var setName = $('input:radio[name=set]:checked').attr('id');
      if(setName) {
        if(setName == '삼색이' && $('input:checkbox[name=menu10]:checked').length == 0 && $('input:checkbox[name=menu8]:checked').length == 1 && $('input:checkbox[name=menu7]:checked').length == 1) {
          price += 16000;
          for(i = 0; i < list.length; i++) {
            var menuPrice = 0;
            if(list[i].id == '나쵸치즈') menuPrice = 5000;
            else if(list[i].id == '해장라면') menuPrice = 4000;
            else if(list[i].id == '어묵튀김') menuPrice = 3000;
            else if(list[i].id == '주먹밥') menuPrice = 3000;
            price += menuPrice;
          }
        }
        else if(setName == '차밍이' && $('input:checkbox[name=menu10]:checked').length == 1 && $('input:checkbox[name=menu8]:checked').length == 1 && $('input:checkbox[name=menu7]:checked').length == 1) {
          price += 27000;
          for(i = 0; i < list.length; i++) {
            var menuPrice = 0;
            if(list[i].id == '나쵸치즈') menuPrice = 5000;
            else if(list[i].id == '해장라면') menuPrice = 4000;
            else if(list[i].id == '어묵튀김') menuPrice = 3000;
            else if(list[i].id == '주먹밥') menuPrice = 3000;
            price += menuPrice;
          }
        }
        else if(setName == '고등어' && $('input:checkbox[name=menu10]:checked').length == 1 && $('input:checkbox[name=menu8]:checked').length == 3 && $('input:checkbox[name=menu7]:checked').length == 2 && $('input:checkbox[name=menuSide]:checked').length == 4) {
          price += 60000;
        }
        else {
          $('#status').css('color', '#da0000');
          $('#status').text('Set?');
          return;
        }
      }
      else {
        for(i = 0; i < list.length; i++) {
          var menuPrice = 0;

          if(list[i].id == '모듬튀김') menuPrice = 10000;
          else if(list[i].id == '떡볶음탕') menuPrice = 8000;
          else if(list[i].id == '두부김치') menuPrice = 8000;
          else if(list[i].id == '김치찌개') menuPrice = 8000;
          else if(list[i].id == '옥수수전') menuPrice = 7000;
          else if(list[i].id == '꼬묵우동') menuPrice = 7000;
          else if(list[i].id == '나쵸치즈') menuPrice = 5000;
          else if(list[i].id == '해장라면') menuPrice = 4000;
          else if(list[i].id == '어묵튀김') menuPrice = 3000;
          else if(list[i].id == '주먹밥') menuPrice = 3000;

          price += menuPrice;
        }
      }

      $('#status').css('color', '#32a1ff');
      $('#status').text('Payment');
      $('#proceed').attr('value', '결제 완료');
      $('#paymentProceed').css('display', '');
      $('#price').text(addComma(price));

      $('input').attr('disabled', true);
      $('#proceed').attr('disabled', false);
    }

    else if(value == '결제 완료') {

    for(i = 0; i < list.length; i++) orderList += list[i].id + '/';
    orderList = orderList.substr(0, orderList.length - 1);

      $('#proceed').attr('disabled', true);
      $('#status').css('color', '#ffbf00');
      $('#status').text('Processing');

      var request;
      if (request) request.abort();

      var serializedData = '타입=신청&테이블 번호=' + tableNum + '&주문 메뉴=' + orderList;
      console.log('Dataset : ' + serializedData);
      request = $.ajax({
          type: 'POST',
          url: "https://script.google.com/macros/s/AKfycbyRPHehwoToixRQqGws-ZBaDJLu0SbvrtGU9GArrBx_A7aA5w8/exec",
          data: encodeURI(serializedData)
      });
      request.done(function() {
        $('#status').css('color', '#15be00');
        $('#status').text('Ready');
      });
      request.fail(function(jqXHR, textStatus, errorThrown) {
        $('#status').css('color', '#da0000');
        $('#status').text('Error');
      });
      request.always(function() {
        $('#paymentProceed').css('display', 'none');
        $('input').attr('disabled', false);
        $('#DATA')[0].reset();
      });
    }
  });
});
function addComma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
