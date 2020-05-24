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
let db, id = 0;
(async function() { db = await pool.getConnection(); })();
/*
fs.readFile('/home/luftaquila/HDD/ajoupub/staff.json', 'utf8', function(err, data) {
  let set = JSON.parse(data);
});
*/
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

io.sockets.on('connection', async function (socket) {
  if(socket.handshake.query.identity == 'client') socket.join('client');
  else if(socket.handshake.query.identity == 'staff') socket.join('staff');
  else if(socket.handshake.query.identity == 'kitchen') socket.join('kitchen');
  
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
    id++;
    let orderID = id.toString().padStart(5, '0'), order = { orderID: '', table: '', order: [], price: 0, staff: '' };
    for(let detail of data.order) {
      if(detail.content) { for(let obj of detail.content) order.order.push(obj) }
      else order.order.push({ name: detail.name, quantity: detail.quantity });
    }
    order.orderID = orderID;
    order.table = data.table;
    order.price = data.price;
    order.staff = data.staff;
    
    await db.query("INSERT INTO `log`(`id`, `table`, `menu`, `price`, `staff`) VALUES('" + order.orderID + "', '" + order.table + "', '" + JSON.stringify(order) + "', " + order.price + ", '" + order.staff + "');"); // 주문 기록
    await db.query("INSERT INTO `queue`(`id`, `table`, `menu`) VALUES('" + order.orderID + "', '" + order.table + "', '" + JSON.stringify(order) + "');"); // 대기열 추가
    
    let target = [], prev = await db.query("SELECT `menu` FROM `table_status` WHERE `table`='" + order.table + "';"); //기존 테이블 주문 상태 불러오기
    if(prev[0].menu) target = JSON.parse(prev[0].menu);
    for(let obj of order.order) target.push(obj);
    
    await db.query("UPDATE `table_status` SET `status`='awaitfood', `price`=0, `menu`='" + JSON.stringify(target) + "' WHERE `table`='" + order.table + "';"); // 테이블 상태 업데이트
    io.to('kitchen').emit('orderadded', { });
    io.to('staff').emit('tablechanged', { table: data.table, status: 'awaitfood', price: 0, menu: JSON.stringify(target) });
  });
});


