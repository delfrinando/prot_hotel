var http = require('http')
,formidable = require('formidable')
,fs = require('fs')
, sys = require('util');

http.createServer(function (req, res) {
  // set up some routes
  switch(req.url) {
    case '/':
         // show the user a simple form
         console.log("[200] " + req.method + " to " + req.url);
         res.writeHead(200, "OK", {'Content-Type': 'text/html'});
         res.write('<html><head><title>Hello<body>');
         res.write('<h1>Welcomeo are you?</h1>');
         res.write('<forme="multipart/form-data" action="/formhandler" method="post">');
         res.write('Namenput type="text" name="username" value="John Doe" /><br />');
         res.write('Agenput type="text" name="userage" value="99" /><br />');
         res.write('Filenput type="file" name="upload" multiple="multiple"><br>');
         res.write('<inputsubmit" />');
         res.write('</form></body></html');
         res.end()
         break;
         case '/formhandler':
         if (req.method == 'POST') {
          console.log("[200] " + req.method + " to " + req.url);

          req.on('data', function(chunk) {
            console.log("Received data:");
              // console.log(chunk.toString());
            });
          var form = new formidable.IncomingForm();
          form.parse(req, function(err,fields, files) {
            // console.log('incondition'+sys.inspect({fields: fields, files: files}));
            console.log(files.name.path);
            fs.writeFile(files.name.name, files.name.name, (err) => {
              if (err) throw err;
              console.log('It\'s saved!');
            });
            // fs.writeFile(files.name.name, files.upload,'utf8', function (err) {
            //   if (err) throw err;
            //   console.log('It');
            // });

            res.writeHead(200, {'content-type': files.name.type});
            res.write('receivedoad:\n\n');
            res.end();
          });
          req.on('end', function() {
              // empty 200 OK response for now
              res.writeHead(200, "OK", {'Content-Type': 'text/html'});
              res.end();
            });

        } else {
          console.log("[405] " + req.method + " to " + req.url);
          res.writeHead(405, "Method not supported", {'Content-Type': 'text/html'});
          res.end('<html><head><title>405d</title></head><body><h1>Method not supported.</h1></body></html>');
        }
        break;
        default:
        res.writeHead(404, "Not found", {'Content-Type': 'text/html'});
        res.end('<html><head><title>404head><body><h1>Not found.</h1></body></html>');
        console.log("[404] " + req.method + " to " + req.url);
      };
    }).listen(8000)