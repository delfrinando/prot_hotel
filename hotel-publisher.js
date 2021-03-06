const amqp = require('amqplib/callback_api');
const uuid = require("node-uuid").v4;
const url = require("url");
const express = require('express');
const app = express();

const numCPUs = require('os').cpus().length;
const cluster = require('cluster');

if (cluster.isMaster) {
  console.log(`Master ${process.pid} is running`);

  for (var i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {

  app.get('/', function(req, res) {
    amqp.connect('amqp://52.78.200.172', function(err, conn) {
      conn.createChannel(function(err, ch) {
        const parsedUrl = url.parse(req.url, true);
        const queryAsObject = parsedUrl.query;            
        ch.assertQueue('', {exclusive: true, expires:1000, autodelete:true}, function(err, q) {        
          const startp = new Date().getTime();
          const corr = uuid();

          console.log(' [x] Sending Message');   
          ch.sendToQueue('queue_send', new Buffer(req.url),{ correlationId: corr, replyTo: q.queue });
          ch.consume(q.queue, function (msg) {
          //const datime = startp - microtime.now();
          const datime = new Date().getTime() - startp;
          console.log( datime + 'ms [.] Got message! ' + q.queue);
          res.end(msg.content.toString());
          ch.ack(msg, function(){            
            ch.close(function(err, conn){
              conn.close();
            });
          });
        });
        });
      });
    });
  });

  app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
  })
}
