

function getdata(id, dbase, callback) {
  var db = require('./db').database(dbase);
  db.get(id, function (err, doc) {
    if (doc) {
      callback(err, doc);
    } else {
      callback(err, null);
    }
  });
};
