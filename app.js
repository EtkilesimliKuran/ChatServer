var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 5000));
app.get('/', function(request, response) {
  response.json({success:'hello world'});
});


var io = require('socket.io');

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
require('./route')(app, io);
