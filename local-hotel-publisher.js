const amqp = require('amqplib/callback_api');
const uuid = require("node-uuid").v4;
const url = require("url");
const express = require('express');
const app = express();
// const startp = new Date().getTime();

app.get('/', function(req, res) {
  const startp = new Date().getTime();
  amqp.connect('amqp://localhost', function(err, conn) {
    conn.createChannel(function(err, ch) {      
      const parsedUrl = url.parse(req.url, true);
      const queryAsObject = parsedUrl.query;            
      ch.assertQueue('', {exclusive: true, expires:1000, autodelete:true}, function(err, q) {   
        const corr = uuid();
        
        console.log('[x] Sending Message');   
        ch.sendToQueue('queue_send', new Buffer(req.url),{ correlationId: corr, replyTo: q.queue }); 
        ch.consume(q.queue, function (msg) {
          const datime = new Date().getTime() - startp;
          console.log('[.] Got message! in ' + datime);
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