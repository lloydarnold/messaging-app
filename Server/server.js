var express=require('express');
var app=express();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var ip = require('ip');
app.use(express.static('./')); 

require("./Controller/controller.js")(app,io);

http.listen(1930,function(){
    console.log("Node Server is setup and it is listening on http://"+ip.address()+":1930");
})

/* var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){  res.sendFile('/home/ubuntu/messenger-bot/messaging-app/Client/index.html');});

io.on('connection', function(socket){  
	console.log('user connected');  
	socket.on('chat message', function(msg){    
		io.emit('chat message', msg);  });  
	socket.on('disconnect', function(){    
		console.log('user disconnected');  });
});

http.listen(3000, function(){  console.log('listening on *:3000');});
*/
