var cluster = require('cluster');
var os = require('os');
var numCPUs = os.cpus().length;

if (cluster.isMaster) {
  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker '+worker.process.pid+'died');
  });
  cluster.on('listening', function(worker, address) {
    console.log('#'+worker.id+' worker is now listening on localhost:'+address.port);
  });
} else {
  // cluster server start
  var app = require('./app');
  app.listen(3011);
}

