const amqp = require('amqplib/callback_api');
const request = require('request');
const baseurl = 'https://api.tiket.com/search/hotel?q=';
const endurl = '&startdate=2017-01-11&night=1&enddate=2017-01-12&room=1&adult=2&child=0&token=661fb48038bcbfd49afbf6137fe9ef2eade40cdb&output=json';
const redis = require('redis');
const client = redis.createClient();
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
	client.on('connect', function() {
		console.log('connected');
	});

	amqp.connect('amqp://localhost', function(err, conn) {
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
}