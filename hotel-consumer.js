var amqp = require('amqplib/callback_api');
var request = require('request');
var baseurl = 'https://api.tiket.com/search/hotel?q=';
var endurl = '&startdate=2017-01-11&night=1&enddate=2017-01-12&room=1&adult=2&child=0&token=661fb48038bcbfd49afbf6137fe9ef2eade40cdb&output=json';

var redis = require('redis'),
client = redis.createClient();

client.on('connect', function() {
    console.log('connected');
});

amqp.connect('amqp://52.78.200.172', function(err, conn) {
  conn.createChannel(function(err, ch) {
    var q = 'queue_send';

    ch.assertQueue(q, {durable: false});
    ch.prefetch(1);
    console.log(' [x] Awaiting RPC requests');
    ch.consume(q, function reply(msg) {
      const startp = new Date().getTime();
      client.get(msg.content.toString(), function(err, reply) {
        if (reply === null){
          request(baseurl + msg.content.toString() + endurl, function (error, response, body) {
              ch.sendToQueue(msg.properties.replyTo, new Buffer(body), {correlationId: msg.properties.correlationId});
              ch.ack(msg);
              client.set(msg.content.toString(), body, function(err, reply) {
              });
            });          
        } else{
          ch.sendToQueue(msg.properties.replyTo, new Buffer(reply), {correlationId: msg.properties.correlationId});
          ch.ack(msg);
        }
        const datime = new Date().getTime() - startp;       
        console.log( datime + 'ms. Message replied to ' + msg.properties.replyTo);
      });     

      
    });
  });
});
