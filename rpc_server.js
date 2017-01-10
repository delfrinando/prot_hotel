var amqp = require('amqplib/callback_api');
var uuid = require("node-uuid").v4;
var url = require("url");
var express = require('express');
var app = express();
var redis = require('redis'),
    client = redis.createClient();

var microtime = require('microtime')


client.keys('*', function (err, keys) {
  if (err) return console.log(err);

  for(var i = 0, len = keys.length; i < len; i++) {
    // console.log(keys[i]);
  }
});

app.get('/', function(req, res) { // Process when the reques hit in browser
  amqp.connect('amqp://localhost', function(err, conn) { // create connection amqp
    conn.createChannel(function(err, ch) { // create channel
      var startp = microtime.now();
      var parsedUrl = url.parse(req.url, true);
      var queryAsObject = parsedUrl.query;      
      
      ch.assertQueue('', {exclusive: true, expires:1000, autodelete:true}, function(err, q) {
        var corr = uuid();
        
        console.log(' [x] Sending Message');   
        ch.sendToQueue('queue_send', new Buffer(req.url),{ correlationId: corr, replyTo: q.queue });
        ch.consume(q.queue, function (msg) {
          console.log(' [.] Got message! ' + q.queue);
          res.end(msg.content.toString());
          ch.ack(msg);
          ch.close();
        });
      });
    });
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})