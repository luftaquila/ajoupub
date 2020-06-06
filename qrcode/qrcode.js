$(function() {
  //(function () { var script = document.createElement('script'); script.src="//cdn.jsdelivr.net/npm/eruda"; document.body.appendChild(script); script.onload = function () { eruda.init() } })();
  init();
});

function init() {
  $.ajax({
    url: "/ajoupub/staff.json",
    type: 'GET',
    cache: false,
    success: function(config) { drawQR(config.tablecount, config.tablerow); }
  });
}

function drawQR(count, row) {
  let zip = new JSZip();
  
  for(let i = 0; i < count; i++) {
    let tableid = (Math.floor(i / 3) + 1).toString().padStart(2, '0') + (i % 3 + 1);

    $('div#container').append('<div id="' + tableid + '"></div>');
    $('#' + tableid).qrcode({
      // render method: 'canvas', 'image' or 'div'
      render: 'image',

      // version range somewhere in 1 .. 40
      minVersion: 1,
      maxVersion: 40,

      // error correction level: 'L', 'M', 'Q' or 'H'
      ecLevel: 'H',

      // offset in pixel if drawn onto existing canvas
      left: 0,
      top: 0,
 
      // size in pixel
      size: 1000,

      // code color or image element
      fill: '#000',

      // background color or image element, null for transparent background
      background: '#fff',

      // content
      text: 'https://luftaquila.io/ajoupub/?t=' + tableid,

      // corner radius relative to module width: 0.0 .. 0.5
      radius: 0,

      // quiet zone in modules
      quiet: 3,

      // modes
      // 0: normal
      // 1: label strip
      // 2: label box
      // 3: image strip
      // 4: image box
      mode: 2,

      mSize: 0.1,
      mPosX: 0.5,
      mPosY: 0.5,

      label: 'Table No. ' + tableid,
      fontname: 'Nanum Gothic',
      fontcolor: '#ff9f40',

      image: null
    });
    let file = dataURLtoFile($('#' + tableid + ' img').attr('src'), tableid + '.png');
    zip.file(tableid + '.png', file);
  }
  zip.generateAsync({ type: "blob" }).then(function(blob)	{ saveAs(blob, "tableQRCode.zip"); });
}

function dataURLtoFile(dataurl, filename) {
  var arr = dataurl.split(','),
  mime = arr[0].match(/:(.*?);/)[1],
  bstr = atob(arr[1]), 
  n = bstr.length, 
  u8arr = new Uint8Array(n);
  
  while(n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, {type:mime});
}

