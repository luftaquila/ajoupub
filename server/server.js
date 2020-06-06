const fs = require('fs');
const express = require('express');
const mariadb = require('mariadb');
const io = require('socket.io')(3140);
const DBOptions = {
  host: 'localhost', 
  user:'ajoupub',
  //password: '',
  database: 'ajoupub',
  idleTimeout: 0
};
const app = express();
const pool = mariadb.createPool(DBOptions);
let db, menu = [];
(async function() {
  db = await pool.getConnection();
  readMenu();
})();

app.listen(3150, async function() {
  db = await pool.getConnection();
  console.log('Express is listening on port 3150\nSocket.io is listening on port 3140');
  setInterval(async function() {
    try { await db.query('SHOW TABLES;'); }
    catch(e) { db = await pool.getConnection(); }
  }, 300000);    
});

app.post('/requestTableStatus', async function(req, res) {
  let result = await db.query('SELECT * FROM `table_status`;');
  res.send(result);
});

app.post('/requestLog', async function(req, res) {
  let result = await db.query('SELECT * FROM `log`;');
  res.send(result);
});

io.sockets.on('connection', async function (socket) {
  if(socket.handshake.query.identity == 'client') {
    socket.join('client');
    socket.emit('queueinfo', menu);
  }
  else if(socket.handshake.query.identity == 'staff') {
    socket.join('staff');
    let queuestatus = await db.query('SELECT * FROM `queue`;');
    socket.emit('queuechanged', queuestatus);
  }
  else if(socket.handshake.query.identity == 'kitchen') {
    socket.join('kitchen');
    let queuestatus = await db.query('SELECT * FROM `queue`;');
    socket.emit('queuechanged', queuestatus);
    socket.emit('queueinfo', menu);
  }
  
  socket.on('paymentcall', async function (data) {
    await db.query("UPDATE `table_status` SET `status`='awaitpayment', `price`=" + data.price + " WHERE `table`='" + data.table + "';");
    io.to('staff').emit('paymentrequest', data);
    io.to('staff').emit('tablechanged', { table: data.table, status: 'awaitpayment', price: data.price, menu: '-' });
  });
 
  socket.on('orderdeleted', async function(data) {
    io.to('client').emit('closingorder', data);
    let query = await db.query("SELECT `menu` from `table_status` WHERE `table`='" + data.table + "';");
    if(query.length) {
      if (!query[0].menu) {
        await db.query("UPDATE `table_status` SET `status`='normal', `price`=0 WHERE `table`='" + data.table + "';");
        io.to('staff').emit('tablechanged', { table: data.table, status: 'normal', price: 0, menu: '.' });
      }
      else {
        await db.query("UPDATE `table_status` SET `status`='awaitfood', `price`=0 WHERE `table`='" + data.table + "';");
        io.to('staff').emit('tablechanged', { table: data.table, status: 'awaitfood', price: 0, menu: query[0].menu });
      }
    }
  });
  
  socket.on('orderverified', async function(data) {
    io.to('client').emit('orderconfirmed', data);
    //야옹이 선술집 주문~!
  });
  
  socket.on('orderdetail', async function(data) {
    let order = { table: '', order: [], price: 0, staff: '' };
    for(let detail of data.order) {
      if(detail.content) { for(let obj of detail.content) order.order.push(obj) }
      else order.order.push({ name: detail.name, quantity: detail.quantity });
    }
    order.table = data.table;
    order.price = data.price;
    order.staff = data.staff;
    
    await db.query("INSERT INTO `log`(`table`, `menu`, `price`, `staff`) VALUES('" + order.table + "', '" + JSON.stringify(order) + "', " + order.price + ", '" + order.staff + "');"); // 주문 기록
    let result = await db.query("INSERT INTO `queue`(`table`, `menu`) VALUES('" + order.table + "', '" + JSON.stringify(order) + "');"); // 대기열 추가
    let target = [], prev = await db.query("SELECT `menu` FROM `table_status` WHERE `table`='" + order.table + "';"); //기존 테이블 주문 상태 불러오기
    if(prev[0].menu) target = JSON.parse(prev[0].menu);
    for(let obj of order.order) {
      obj.orderID = result.insertId;
      target.push(obj);
      
      let queueTarget = menu.find(o => o.name == obj.name);
      if(queueTarget) {
        if(!queueTarget.queue) queueTarget.start = Date.now();
        queueTarget.queue += obj.quantity;
      }
    }
    await db.query("UPDATE `table_status` SET `status`='awaitfood', `price`=0, `menu`='" + JSON.stringify(target) + "' WHERE `table`='" + order.table + "';"); // 테이블 상태 업데이트
    io.to('staff').emit('tablechanged', { table: data.table, status: 'awaitfood', price: 0, menu: JSON.stringify(target) });
    
    let queuestatus = await db.query('SELECT * FROM `queue`;');
    io.to('staff').to('kitchen').emit('queuechanged', queuestatus);
    io.to('client').to('kitchen').emit('queueinfo', menu);
  });
  
  socket.on('servedfoods', async function(data) {
    let table = data.table;
    for(let obj of data.served) {
      // 대기열에서 삭제
      let queue = await db.query("SELECT `id`, `menu` FROM `queue` WHERE `table`='" + table + "' AND `id`=" + obj.orderID + ";");
      let target = JSON.parse(queue[0].menu);
      for(let n in target.order) {
        if(target.order[n].name == obj.name && target.order[n].quantity == obj.quantity) {
          target.order.splice(n, 1);
          if(target.order.length) await db.query("UPDATE `queue` SET `menu`='" + JSON.stringify(target) + "' WHERE `table`='" + table + "' AND `id`=" + obj.orderID + ";");
          else await db.query("DELETE FROM `queue` WHERE `table`='" + table + "' AND `id`=" + obj.orderID + ";");
          break;
        }
      }
      //테이블 상태에서 삭제
      let status = await db.query("SELECT `menu` FROM `table_status` WHERE `table`='" + table + "';");
      let update = JSON.parse(status[0].menu);
      for(let n in update) {
        if(update[n].name == obj.name && update[n].quantity == obj.quantity && update[n].orderID == obj.orderID) {
          update.splice(n, 1);
          await db.query("UPDATE `table_status` SET `menu`='" + JSON.stringify(update) + "' WHERE `table`='" + table + "';");
          break;
        }
      }
      //큐에서 삭제
      let queueTarget = menu.find(o => o.name == obj.name);
      if(queueTarget) queueTarget.queue -= obj.quantity;
    }
    
    let tablestatus = await db.query("SELECT `menu` FROM `table_status` WHERE `table`='" + table + "';");
    let current = JSON.parse(tablestatus[0].menu);
    if(current.length) io.to('staff').emit('tablechanged', { table: table, status: 'awaitfood', price: 0, menu: JSON.stringify(current) });
    else {
      await db.query("UPDATE `table_status` SET `status`='normal' WHERE `table`='" + table + "';");
      io.to('staff').emit('tablechanged', { table: table, status: 'normal', price: 0, menu: '.' });    
    }
    io.to('staff').emit('reloadservedlist');
    let queuestatus = await db.query('SELECT * FROM `queue`;');
    io.to('staff').to('kitchen').emit('queuechanged', queuestatus);
    io.to('client').to('kitchen').emit('queueinfo', menu);
  });
  
  socket.on('queueupdated', function(data) {
    let target = menu.find(o => o.name == data.name);
    if(target) {
      if(data.key == 'eta') {
        let eta = Math.round((target.start + (target.queue * target.cooktime * 60000 / target.slot) - Date.now() + (target.offset * 60000)) / 60000);
        eta = (eta > 0) ? eta : 0;
        if(!eta) target.start = Date.now();
        if(eta || data.value > 0) target.offset += data.value;
      }
      else target[data.key] = data.value;
    }
    io.to('client').to('kitchen').emit('queueinfo', menu);
  });
  
  socket.on('resetall', async function() {
    await db.query("TRUNCATE TABLE `log`;");
    await db.query("TRUNCATE TABLE `queue`;");
    await db.query("UPDATE `table_status` SET `status`='normal', `price`=0, `menu`='';");
    readMenu();
    
    let queuestatus = await db.query('SELECT * FROM `queue`;');
    io.to('staff').to('kitchen').emit('queuechanged', queuestatus);
    io.to('staff').emit('tablereset');
    io.to('client').to('kitchen').emit('queueinfo', menu);
  });
});

function readMenu() {
  fs.readFile('/home/luftaquila/HDD/ajoupub/menu.json', 'utf8', async function(err, data) {
    let list = JSON.parse(data);
    delete list.set;
    init_menu(list.main);
    init_menu(list.sub);
    menu = list.main.concat(list.sub);
    
    let queue = await db.query('SELECT * FROM `queue`;');
    for(let obj of queue) {
      let item = JSON.parse(obj.menu);
      for(let order of item.order) {
        let target = menu.find(o => o.name == order.name);
        if(target) target.queue += order.quantity;
      }
    }
  
    function init_menu(menu) {
      for(let i in menu) {
        delete menu[i].price;
        delete menu[i].description;
        menu[i].queue = 0;
        menu[i].start = Date.now();
        menu[i].offset = 0;
        menu[i].isReady = true;
        menu[i].isBefore = false;
      }
    }
  });
}

