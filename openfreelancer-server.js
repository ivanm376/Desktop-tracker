var db = require('mongodb').MongoClient;
var ObjectID = new require('mongodb').ObjectID;
var http = require('http');
var fs = require('fs');

var clients = {
    'asdui3274iewernsdufu3': { name: 'Johny' },
    'sadf435ewr435sdf4343s': { name: 'Luis'  }
};

db.connect('mongodb://localhost:27017/openfreelancer', function (err, db) {
    var screenshots = db.collection('screenshots');
    screenshots.createIndex({ client: 1, created_at: 1 });
    if (process.argv[2] === 'STATS') {
        db.stats(function (err, stats){ console.log(stats); });
    }
    if (process.argv[2] === 'CLEAR') {
        screenshots.remove({ created_at: { $lt: Date.now() - 31 * 24 * 60 * 60 * 1000 }}); // older than month
    }
    http.createServer(function (req, res) {
        var url    = req.url.split('/');
        var id     = url[1];
        var path   = url[2];
        var client = clients[id];
        if (id === 'openfreelancer-theme.css') {
            fs.createReadStream('openfreelancer-theme.css').pipe(res);
        } else if (!client) {
            res.end('Unknown id: ' + id);
        } else {
            if (req.method === 'POST' && client.lock !== 'timeout') {
                if (client.lock !== 'first_request') {
                    client.lock = 'first_request';
                } else {
                    client.lock = 'timeout'; // DOS protection
                    setTimeout(function () {
                        delete client.lock;
                    }, 9 * 60 * 1000); // 9 minutes
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
                    try {
                        screenshots.findOne(new ObjectID(path), function (err, item) {
                            res.end(new Buffer(item.screenshot.buffer));
                        });
                    } catch (err) { res.end('Unknown id: ' + path); }
                } else {
                    screenshots.find({
                        created_at: {
                            $gt: Date.now() - 31 * 24 * 60 * 60 * 1000 // last month
                        },
                        client: id
                    }).sort({ created_at: -1 }).toArray(function (err, items) {
                        var body = '<head><link rel="stylesheet" type="text/css" href="openfreelancer-theme.css"><head>' + client.name + '<table>';
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

process.on('uncaughtException', function (err) {
    console.log(err.stack);
});
