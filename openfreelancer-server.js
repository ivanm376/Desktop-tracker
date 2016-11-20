var db = require('mongodb').MongoClient;
var ObjectID = new require('mongodb').ObjectID;
var http = require('http');

var clients = {
  'asdui3274iewernsdufu3': { name: 'Johny' },
  'sadf435ewr435sdf4343s': { name: 'Luis'  }
};

db.connect('mongodb://localhost:27017/openfreelancer', function (err, db) {
  var screenshots = db.collection('screenshots');
  screenshots.createIndex({ client: 1, created_at: 1 });
  http.createServer(function (req, res) {
    var url    = req.url.split('/');
    var id     = url[1];
    var path   = url[2];
    var client = clients[id];
    if (!client) {
      res.end('Unknown id: ' + id);
    } else {
      if (req.method === 'POST' && client.state !== 'timeout') {
        if (client.state !== 'first_request') {
          client.state = 'first_request';
        } else {
          client.state = 'timeout'; // DOS protection
          setTimeout(function () {
            delete client.state;
          }, 4000);
//           }, 10 * 60 * 1000); // 9 minutes
        }
        var body = [];
        req.on('data', function (chunk) {
          body.push(chunk);
        }).on('end', function () {
          res.end();
          body = new Buffer.concat(body);
          if (!client.cachedImage) {
            client.cachedImage = body;
          } else {
            if (path === 'screenshot') {
              screenshots.insert({ client: id, created_at: Date.now(), screenshot: body, thumbnail: client.cachedImage });
            }
            if (path === 'thumbnail') {
              screenshots.insert({ client: id, created_at: Date.now(), screenshot: client.cachedImage, thumbnail: body });
            }
            console.log('Got new row');
            delete client.cachedImage;
          }
        });
      } else if (req.method === 'GET') {
        if (path) {
          screenshots.findOne(new ObjectID(path), function (err, item) {
            res.end(new Buffer(item.screenshot.buffer));
          });
        } else {
          screenshots.find({
            created_at: {
              $gt: Date.now() - 60 * 60 * 1000 // last 60 minutes
            },
            client: id
          }).sort({ created_at: -1 }).toArray(function (err, items) {
            var body = '<table border=1 cellpadding=10>';
            items.forEach(function (item, index) {
              if (!(index % 6)) {
                body += '</tr><tr><td>' + new Date(item.created_at).toUTCString().slice(0, -7).split(' 2016 ').join(' ') + '</td>';
              }
              body += '<td><a target=_blank href=' + id + '/' + item._id.toString() + '><img src="data:image/png;base64,' + new Buffer(item.thumbnail.buffer).toString('base64') + '"></a></td>';
            });
            res.end(body);
          });
        }
      } else { // GET
        res.end();
      }
    }
  }).listen(process.env.PORT || 3070);
});

// screenshots.remove({ created_at: { $lt: Date.now() - 60 * 60 * 1000 }}); // remove

process.on('uncaughtException', function (err) {
  console.log(err.stack);
});
