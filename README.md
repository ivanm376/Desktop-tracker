# OpenFreelancer-server

Stores freelancer's screenshots in Mongo openfreelancer db
and provides simplistic UI view

To add users edit clients.json


# Run

>$ node openfreelancer-server.js


# Access UI

>localhost:3070/asdui3274iewernsdufu3


# DB Stats

>$ node openfreelancer-server.js STATS

>dataSize (bytes)


# Remove rows older than month

>$ node openfreelancer-server.js CLEAR


# Info

Average row size 300-400 kB

>hour : ~2.5 mB

>week : ~70-120 mB

>month: ~300-500 mB / per client
