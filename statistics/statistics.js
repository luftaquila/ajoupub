$(function() {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  eventListener();
  init();
});

function init() {
  $.ajax({
    url: '/ajoupub/api/requestLog',
    type: 'POST',
    success: function(response) { chartDrawer(response); }
  });
  $('div.sub-info').css('display', 'none');
}

function chartDrawer(res) {
  let total_sales = 0, total_serve = 0, total_times_of_sale = res.length;
  let menu = [], date = [];
  for(let obj of res) {
    total_sales += obj.price;
    let tgt = date.find(o => o.date == new Date(obj.timestamp).format('yyyy. m. d'));
    if(tgt) tgt.sales += obj.price;
    else {
      date.push({
        date: new Date(obj.timestamp).format('yyyy. m. d'),
        sales: obj.price,
        count: 0
      });
    }
    for(let item of JSON.parse(obj.menu).order) {
      let menuObj = menu.find(o => o.name == item.name);
      let dateObj = date.find(o => o.date == new Date(obj.timestamp).format('yyyy. m. d'));
      if(menuObj) menuObj.count += item.quantity;
      else {
        menu.push({
          name: item.name,
          count: item.quantity
        });
      }
      if(dateObj) dateObj.count += item.quantity;
      total_serve += item.quantity;
    }
  }
  menu.sort((a, b) => (a.count > b.count) ? -1 : ((b.count > a.count) ? 1 : 0));
  
  new Chart(document.getElementById("salesByMenu"), {
    type: 'bar',
    data: {
      labels: menu.map(o => o.name),
      datasets: [{
        data: menu.map(o => o.count),
        backgroundColor: function(context) { return getColor(1 / menu.length * context.dataIndex, 0.2); },
        borderColor: function(context) { return getColor(1 / menu.length * context.dataIndex, 1); },
        borderWidth: 1
      }]
    },
    options: {        
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          display: true,
          ticks: {
            min: 0,
            suggestedMax: Math.max.apply(null, menu.map(o => o.count)) * 5 / 4,
            stepSize: Math.max.apply(null, menu.map(o => o.count)) / 4
          }
        }]
      }
    }
  });
  
  new Chart(document.getElementById("salesByDate"), {
    type: 'line',
    data: {
      labels: date.map(o => o.date),
      datasets: [{
        data: date.map(o => o.sales),
        backgroundColor: "rgba(255, 201, 14, 0.5)",
        borderColor: "rgba(255, 201, 14, 1)",
        fill: false,
        lineTension: 0
      }]
    },
    options: {
      responsive: true,
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          display: true,
          ticks: {
            min: 0,
            suggestedMax: Math.max.apply(null, date.map(o => o.sales)) * 5 / 4,
            stepSize: Math.max.apply(null, date.map(o => o.sales)) / 4
          }
        }]
      },
      hover: {
        mode: 'nearest',
        intersect: true
      }
    }
  });
  
  new Chart(document.getElementById("timesOfSaleByDate"), {
    type: 'line',
    data: {
      labels: date.map(o => o.date),
      datasets: [{
        data: date.map(o => o.count),
        backgroundColor: "rgba(20, 201, 14, 0.5)",
        borderColor: "rgba(20, 201, 14, 1)",
        fill: false,
        lineTension: 0
      }]
    },
    options: {
      responsive: true,
      legend: {
        display: false
      },
      scales: {
        yAxes: [{
          display: true,
          ticks: {
            min: 0,
            suggestedMax: Math.max.apply(null, date.map(o => o.count)) * 5 / 4,
            stepSize: Math.max.apply(null, date.map(o => o.count)) / 4
          }
        }]
      }
    }
  });
  
  $('#total_sales').text('￦' + comma(total_sales));
  $('#total_times_of_sale').text(total_times_of_sale);
  $('#total_serve').text(total_serve);
}
  
function eventListener() {
  $(".theme-switch").on("click", () => { $("body").toggleClass("light-theme"); });
}

function comma(x) { return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

function getColor(value, opacity) {
    //value from 0 to 1
    var hue = (value * 360).toString(10);
    return ["hsla(", hue, ", 100%, 50%, " + opacity + ")"].join("");
}

var dateFormat = function () {
  var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      pad = function (val, len) {
        val = String(val);
        len = len || 2;
        while (val.length < len) val = "0" + val;
        return val;
      };
  return function (date, mask, utc) {
    var dF = dateFormat;
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }
    date = date ? new Date(date) : new Date;
    var	_ = utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      flags = {
        d:    d,
        dd:   pad(d),
        m:    m + 1,
        mm:   pad(m + 1),
        yyyy: y,
      };
    return mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });
  };
}();
Date.prototype.format = function (mask, utc) { return dateFormat(this, mask, utc); };


