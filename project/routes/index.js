var express = require('express');
var crypto = require('crypto');
var util = require('util');
var User = require('../models/user.js');
var router = express.Router();

/* TEST ONLY */
router.get('/static', function(req, res) {
  res.sendfile('./public/static.html');
});

router.get('/dynamic', function(req, res) {
  var n = 'joey'+Math.random()*1000;
  for (i=0;i<10;i++){
    var md5 = crypto.createHash('md5');
    n = md5.update(n).digest('hex');
  }
  res.send(n);
});

/* GET login page. */
router.get('/login', checkNotLogin);
router.get('/login', function(req, res) {
  res.render('signin');
});

/* Process login page. */
router.post('/login', checkNotLogin);
router.post('/login', function(req, res) {
  // generate password md5
  var md5 = crypto.createHash('md5');
  var password = md5.update(req.body.password).digest('hex');
  User.get(req.body.userid, function(err, user) {
    if (!user) {
      var error = 'User do not exist';
			return res.render('signin', {error: error});
    }
    if (user.password != password) {
      var error = 'Wrong password';
      return res.render('signin', {error: error});
    }
    req.session.user = user;
    res.redirect('/dashboard');
  });
});

/* GET dashboard page */
router.get('/dashboard', checkLogin);
router.get('/dashboard', function(req, res) {
  var m = util.inspect(process.memoryUsage()).replace(/([^\s\:\{\[\,]+)\s*\:/g, "\"$1\"\:");
  var mu = eval("(" + m + ")");
  var hmUsed = (mu.heapUsed/1024/1024).toFixed(2);
  var mup = (mu.heapUsed/mu.heapTotal*100).toFixed(2);
  res.render('dashboard', { name:'dashboard', username: req.session.user.id, heapUsage: hmUsed, memUsagep: mup, permission: req.session.user.permission});
});

/* GET database management page. */
router.get('/database', checkLogin);
router.get('/database', function(req, res) {
	res.render('database', { name:'database', database: req.session.user.database, username: req.session.user.id, permission: req.session.user.permission});
});

/* GET change password page. */
router.get('/resetpwd', checkLogin);
router.get('/resetpwd', function(req, res) {
	res.render('resetpwd', { name:'resetpwd', username: req.session.user.id, permission: req.session.user.permission});
});

/* POST change password page. */
router.post('/resetpwd', checkLogin);
router.post('/resetpwd', function(req, res) {
	if (req.body.newpassword != req.body.repeatpassword){
		var error = 'New password do not match with repeat password!';
		return res.render('resetpwd', {error: error, name:'resetpwd', username: req.session.user.id, permission: req.session.user.permission});
	}else{
		var md5 = crypto.createHash('md5');
		var oldpassword = md5.update(req.body.oldpassword).digest('hex');
		if (oldpassword != req.session.user.password){
			var error = 'Current password do not match!';
			return res.render('resetpwd', {error: error, name:'resetpwd', username: req.session.user.id, permission: req.session.user.permission});
		}else{
			var md5 = crypto.createHash('md5');
			var password = md5.update(req.body.newpassword).digest('hex');
			User.update(req.session.user.id, password, function(err, res) {
				if (!err){
					req.session.user.password = password;
					var success = 'Password reset succed!';
					return res.render('resetpwd', {success: success, name:'resetpwd', username: req.session.user.id, permission: req.session.user.permission});
				}else{
					var error = 'Password reset failed!';
			    return res.render('resetpwd', {error: error, name:'resetpwd', username: req.session.user.id, permission: req.session.user.permission});
				}
			});
		}
	}
});

/* GET user management page. */
router.get('/users', checkLogin);
router.get('/users', checkAdmin);
router.get('/users', function(req, res) {
	User.view(function(err, doc) {
		res.render('users', { title: 'users', username: req.session.user.id, permission: req.session.user.permission, result: doc});
	});
});

/* POST user management page. */
router.post('/users', checkLogin);
router.post('/users', checkAdmin);
router.post('/users', function(req, res) {
	if (req.body.password != req.body.repeatpsd){
		var error = 'New password do not match with repeat password!';
		return res.render('users', { title: 'users', error: error, username: req.session.user.id, permission: req.session.user.permission, result: doc});
	}else{
		User.get(req.body.username, function(err, user) {
			if (user) {
				var error = 'User name do exist';
				return res.render('users', { title: 'users', error: error, username: req.session.user.id, permission: req.session.user.permission, result: doc});
			}else{
				User.newdb(req.body.database, function(err, user) {
				  if (err){
						var error = 'Database do exist';
						return res.render('users', { title: 'users', error: error, username: req.session.user.id, permission: req.session.user.permission, result: doc});
				  }else{
						var date = new Date();
						var md5 = crypto.createHash('md5');
						var password = md5.update(req.body.password).digest('hex');
						var newUser = new User({
							database: req.body.database,
							role: req.body.role,
							password: password,
							description: req.body.description,
							date: date
						});
						newUser.save(req.body.username, function(err) {
							if (err) {
								var error = err;
								return res.render('users', { title: 'users', error: error, username: req.session.user.id, permission: req.session.user.permission, result: doc});
							}else{
								var success = 'Add new User Succed!';
								return res.render('users', { title: 'users', success: success, username: req.session.user.id, permission: req.session.user.permission, result: doc});
							}
						});
					}
				});
			}
		});
	}
});

/* GET logout page. */
router.get('/logout', function(req, res) {
	req.session.user = null;
	var success = 'Logout Succed';
  res.render('signin', {success: success});
});

function checkLogin(req, res, next) {
  if (!req.session.user) {
		var error = 'Please Login';
	  return res.render('signin', {error: error});
  }
  next();
}

function checkNotLogin(req, res, next) {
  if (req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
}

function checkAdmin(req, res, next) {
  if (req.session.user.permission!='admin') {
    var error = 'You do not have enough permission';
    return res.render('signin', {error: error});
  }
  next();
}


module.exports = router;
