var db = require('mongodb').MongoClient;
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
    if (clients[id]) {
      if (method === 'post') {
          var body = [];
          req.on('data', function(chunk) {
            body.push(chunk);
          }).on('end', function() {
            screenshots.insert({ client: id, image: new Buffer.concat(body) });
            res.end();
          });
      }
      if (method === 'client') {
        screenshots.find({ client: id }).limit(1).sort({ $natural: -1 }).toArray(function (err, items) {
          res.end(new Buffer(items[0].image.buffer));
        });
//         ObjectId("5349b4ddd2781d08c09890f4").getTimestamp()
      }
    } else {
      res.end();
    }
  }).listen(process.env.PORT || 3070);
});
