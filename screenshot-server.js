const db = require('mongodb').MongoClient;
const ObjectID = new require('mongodb').ObjectID;
const http = require('http');
const fs = require('fs');
const clients = require('./clients');

db.connect('mongodb://localhost:27017/screenshot', (err, db) => {
    const screenshots = db.collection('screenshots');
    screenshots.createIndex({ client: 1, created_at: 1 });
    if (process.argv[2] === 'STATS') {
        db.stats((err, stats) => console.log(stats || err));
    }
    if (process.argv[2] === 'CLEAR') {
        screenshots.remove({ created_at: { $lt: Date.now() + 31 * 24 * 60 * 60 * 1000 }}, () => console.log('done')); // older than month
    }
    http.createServer((req, res) => {
        const url    = req.url.split('/');
        const id     = url[1];
        const path   = url[2];
        const client = clients[id];
        if (id === 'screenshot-theme.css') {
            fs.createReadStream('screenshot-theme.css').pipe(res);
        } else if (!client) {
            res.end('Unknown id: ' + id);
        } else {
            if (req.method === 'POST' && client.lock !== 'timeout') {
                if (client.lock !== 'first_request') {
                    client.lock = 'first_request';
                } else {
                    client.lock = 'timeout'; // DOS protection
                    setTimeout(() => { delete client.lock }, 10 * 60 * 1000 - 10000); // 10 minutes - 10 seconds
                }
                let body = [];
                req.on('data', chunk => body.push(chunk))
                   .on('end', () => {
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
                        screenshots.findOne(new ObjectID(path), (err, item) => res.end(new Buffer(item.screenshot.buffer)));
                    } catch (err) {
                        res.end('Unknown id: ' + path);
                    }
                } else {
                    screenshots.find({
                        created_at: {
                            $gt: Date.now() - 31 * 24 * 60 * 60 * 1000 // last month
                        },
                        client: id
                    }).sort({ created_at: -1 }).toArray((err, items) => {
                        var body = '<head><link rel="stylesheet" type="text/css" href="screenshot-theme.css"><head>' + client.name + '<table>';
                        items.forEach((item, index) => {
                            if (!(index % 6)) {
                                body += '</tr><tr><td>' + Math.floor(index/6) + '</td><td>' + new Date(item.created_at).toUTCString().slice(0, -7).split(' 2016 ').join(' ') + '</td>';
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

process.on('uncaughtException', err => console.log(err.stack));
