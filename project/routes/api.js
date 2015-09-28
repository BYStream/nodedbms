var express = require('express');
var crypto = require('crypto');
var util = require('util');
var User = require('../models/user.js');
var router = express.Router();

/* GET API */
router.all('/:query', APIauth);
router.get('/:query', function(req, res) {
  getdata(req.params.id, req.session.db, function(err, doc) {
    if (!doc){
      res.send({'error':'no result'});
      return;
    } else {
      res.send(doc);
      return;
    }
  });
});
/* TEST ONLY */
router.get('/insert', function(req, res) {
  savedata(req.query, function(err, doc) {
    if (err){
      res.send(err);
      return;
    } else {
      res.send({'success':'insert succed'});
      return;
    }
  });
});
function APIauth(req, res, next) {
  var timestamp = Math.round(new Date().getTime()/1000);
  if  (timestamp - req.query.t < 200) {
    User.get(req.query.u, function(err, user) {
      if (!user) {
        return res.send({'error':'User do not exist'});
        }
      var md5 = crypto.createHash('md5');
      var password = md5.update(user.password + req.query.t).digest('hex');
      if (password != req.query.p) {
        return req.send({'error':'Wrong password'});
      } else {
        return req.session.db = user.database;
      }
    });
  } else {
    return res.send({'error':'request timeout'});
  }
  next();
}

function getdata(id, dbase, callback) {
  var db = require('../models/db').database(dbase);
  db.get(id, function (err, doc) {
    if (doc) {
      callback(err, doc);
    } else {
      callback(err, null);
    }
  });
};

function savedata(dataset, callback) {
  var db = require('../models/db').database('test');
  db.save(dataset, function (err, res) {
    if (res) {
      callback(err, res);
    } else {
      callback(err, null);
    }
  });
};

module.exports = router;
