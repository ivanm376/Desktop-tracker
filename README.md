# Test-screenshot-server
Stores screenshots in Mongo db
and provides simplistic UI view

![Screenshot-server](https://s23.postimg.org/oulznz6zv/test.jpg)

To add users edit clients.json

# Install
$ npm i
# Run
$ node screenshot-server.js
# Access UI
http://localhost:3070/**{{USER_KEY}}**

*check clients.json*

# DB Stats
$ node screenshot-server.js STATS

>find dataSize (bytes)

# Remove rows older than month
$ node screenshot-server.js CLEAR

# Info
Average row size 300-400 kB

hour : ~2.5 mB

week : ~70-120 mB

month: ~300-500 mB / per client
