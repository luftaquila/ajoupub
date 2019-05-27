price = 0, orderList = '';
$(function() {
  $('#status').css('color', '#15be00');
  $('#status').text('Ready');
  $('#proceed').click(function() {
    var value = $('#proceed').attr('value'), tableNum = $('#tableNum').val();
    var list = $('input:checkbox[name=menu10]:checked, input:checkbox[name=menu8]:checked, input:checkbox[name=menu7]:checked, input:checkbox[name=menuSide]:checked, #해장라면, #주먹밥, #음료01, #음료02, #사료, #츄르');

    if(value == '결제 진행') {
      price = 0, orderList = '';
      if(tableNum == '') {
        $('#status').css('color', '#da0000');
        $('#status').text('Table?');
        return;
      }
      else if(!list.length) {
        $('#status').css('color', '#da0000');
        $('#status').text('Menu?');
        return;
      }
      else {
        $('input').attr('disabled', true);
        $('#proceed').attr('disabled', false);

        $('#status').css('color', '#32a1ff');
        $('#status').text('Payment');
        $('#proceed').attr('value', '결제 완료');
        $('#paymentProceed').css('display', '');
      }

      var setName = $('input:radio[name=set]:checked').attr('id');
      for(var i = 0; i < list.length; i++) {
        var menuName = list[i].id;
        if(menuName == '모듬튀김') price += 10000;
        else if(menuName == '떡볶음탕') price += 8000;
        else if(menuName == '두부김치') price += 8000;
        else if(menuName == '김치찌개') price += 8000;
        else if(menuName == '옥수수전') price += 7000;
        else if(menuName == '꼬묵우동') price += 7000;
        else if(menuName == '나쵸치즈') price += 5000;
        else if(menuName == '어묵튀김') price += 3000;
        else if(menuName == '해장라면') {
           price += 4000 * Number($('#해장라면').val());
           orderList += stringMultiply(menuName + '/', Number($('#해장라면').val()));
           continue;
         }
        else if(menuName == '주먹밥') {
           price += 3000 * Number($('#주먹밥').val());
           orderList += stringMultiply(menuName + '/', Number($('#주먹밥').val()));
           continue;
         }
        else if(menuName == '음료01') {
           price += 1000 * Number($('#음료01').val());
           orderList += stringMultiply(menuName + '/', Number($('#음료01').val()));
           continue;
         }
        else if(menuName == '음료02') {
           price += 2000 * Number($('#음료02').val());
           orderList += stringMultiply(menuName + '/', Number($('#음료02').val()));
           continue;
         }
        else if(menuName == '사료') {
           price += 1000 * Number($('#사료').val());
           orderList += stringMultiply(menuName + '/', Number($('#사료').val()));
           continue;
         }
        else if(menuName == '츄르') {
           price += 1000 * Number($('#츄르').val());
           orderList += stringMultiply(menuName + '/', Number($('#츄르').val()));
           continue;
         }
        orderList += menuName + '/';
      }
      if(setName) {
        if(setName == '삼색이') {
          price += 16000;
          orderList += $('#menulist08').val() + '/' + $('#menulist07').val() + '/';
        }
        else if(setName == '차밍이') {
          price += 27000;
          orderList += '모듬튀김/' + $('#menulist08').val() + '/' + $('#menulist07').val() + '/';
        }
        else if(setName == '고등어') {
          price += 60000;
          orderList += '모듬튀김/떡볶음탕/두부김치/김치찌개/옥수수전/꼬묵우동/나쵸치즈/해장라면/어묵튀김/주먹밥/';
        }
      }
      $('#price').text(addComma(price));
    }
    else if(value == '결제 완료') {
      $('#proceed').attr('disabled', true);
      $('#status').css('color', '#ffbf00');
      $('#status').text('Processing');

      var request;
      if (request) request.abort();

      var serializedData = 'type=assign&테이블 번호=' + tableNum + '&주문 메뉴=' + orderList + '&매출=₩' + $('#price').text();
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
        $('#proceed').attr('value', '결제 진행');
        $('#paymentProceed').css('display', 'none');
        $('#menuSelect').css('display', 'none');
        $('#menuOption').css('display', 'none');
        $('input').attr('disabled', false);
        $('#DATA')[0].reset();
      });
    }
  });
  $('input:radio[name=set]').change(function() {
    $('#menuSelect').css('display', 'none');
    $('#menuOption').css('display', 'none');
    if($('input:radio[name=set]:checked').length && $('input:radio[name=set]:checked').attr('id') != '고등어') {
      $('#menuSelect').css('display', '');
      $('#menuOption').css('display', '');
    }
  });
  $('#cancle').click(function() {
    $('input:radio[name=set]:checked').prop('checked', false);
    $('#cancle').prop('checked', false);
    $('#menuSelect').css('display', 'none');
    $('#menuOption').css('display', 'none');
  });
});
function addComma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function stringMultiply(str, rpt) {
  var returnString = '';
  for(var i = 0; i < rpt; i++) returnString += str;
  return returnString;
}
