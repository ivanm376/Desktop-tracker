var db = require('mongodb').MongoClient;
var ObjectID = new require('mongodb').ObjectID;
var http = require('http');

var clients = {
  'asdui3274iewernsdufu3': { name: 'Johny' },
  'sadf435ewr435sdf4343s': { name: 'Luis'  }
};

db.connect('mongodb://localhost:27017/openfreelancer', function(err, db) {
  var screenshots = db.collection('screenshots');
  screenshots.createIndex({ client: 1 });
  http.createServer(function (req, res) {
    var url = req.url.split('/');
    var method = url[1];
    var id = url[2];
    var client = clients[id];
    if (client) {
      if (!client.lock && method === 'post') {
          client.lock = true; // DOS protection
          setTimeout(function () {
            client.lock = false;
          }, 9 * 60 * 1000); // 9 minutes
          var body = [];
          req.on('data', function(chunk) {
            body.push(chunk);
          }).on('end', function() {
            screenshots.insert({ client: id, image: new Buffer.concat(body) });
            res.end();
          });
      }
      if (method === 'get') {
        debugger
        screenshots.find({
          _id: {
            $gt: ObjectID.createFromTimestamp(Date.now() * 1000 - 60 * 60) // last 60 minutes
//             14 * 24 * 60 * 60) // last 14 days
          },
          client: id
        }).sort({ $natural: -1 }).toArray(function (err, items) {
          debugger
          res.end('test<img>');
//           res.end(new Buffer(items[0].image.buffer));
        });
//         ObjectID("5349b4ddd2781d08c09890f4").getTimestamp()
      }
    } else {
      res.end();
    }
  }).listen(process.env.PORT || 3070);
});
