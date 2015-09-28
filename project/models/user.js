var db = require('./db').database('user');

function User(user) {
  this.id = user.value.userid;
  this.password = user.value.password;
  this.permission = user.value.role;
  this.database = user.value.database;
  this.description = user.value.description;
};
module.exports = User;

User.get = function get(username, callback) {
  db.view('user/user', { key: username }, function (err, doc) {
      if (doc) {
          //  package User object
          var user = new User(doc[0]);
          callback(err, user);
        } else {
          callback(err, null);
        }
  });
};

User.prototype.save = function save(callback) {
  // insert into couchdb without an id
  db.save({
      userid: this.id,
      password: this.password,
      role: this.role,
      database: this.database,
      description: this.description,
      date: this.date
  }, function (err, res) {
      // Handle response
      if (err) {
        return callback(err);
    }
  });
};

