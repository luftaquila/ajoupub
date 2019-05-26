var SCRIPT_PROP = PropertiesService.getScriptProperties();
function doGet(e) { return handleResponse(e); }
function doPost(e) { return handleResponse(e); }
function handleResponse(e) {
  var lock = LockService.getPublicLock();
  lock.waitLock(30000);
  try {
    var doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty("key"));
    var sheet = doc.getSheetByName('Receiver');

    var headRow = e.parameter.header_row || 1;
    var headers = doc.getSheetByName('Log').getRange(1, 1, 1, 4).getValues()[0];
    var row = [];

    if(e.parameter['type'] == 'assign') {
      for (i in headers) {
        if(i == 0) {
          row.push(new Date());
          continue;
        }
        row.push(e.parameter[headers[i]]);
      }
      doc.getSheetByName('Log').getRange(doc.getSheetByName('Log').getLastRow() + 1, 1, 1, row.length).setValues([row]);
      row.pop();
      sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length).setValues([row]);
    }
    else if(e.parameter['type'] == 'delete') {
      var received = e.parameter['데이터'].split('/');
      for(i in received) {
        var buffer = received[i].split('|');
        var data = sheet.getRange('B2:C').getValues();
        for(var i = 0; i < data.length; i++) {
          if(buffer[1].substring(0, buffer[1].length - 1) == data[i][0]) {
            sheet.getRange('C' + (i + 2)).setValue(data[i][1].replace(buffer[0] + '/', ''));
            i = data.length;
          }
        }
      }
    }
    else {
      var data = sheet.getRange('B2:C').getValues(), csv = "";
      for (i in data) { csv += data[i][0] + ',' + data[i][1] + '\n'; }
      return ContentService
            .createTextOutput(csv)
            .setMimeType(ContentService.MimeType.CSV);
    }
    return ContentService
          .createTextOutput(JSON.stringify({"result":"success", "data": e}))
          .setMimeType(ContentService.MimeType.JSON);
  }
  catch(e) {
    return ContentService
          .createTextOutput(JSON.stringify({"result":"error", "error": e}))
          .setMimeType(ContentService.MimeType.JSON);
  }
  finally {
    lock.releaseLock();
  }
}
function setup() {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    SCRIPT_PROP.setProperty("key", doc.getId());
}
