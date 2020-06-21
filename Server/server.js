/* var express=require('express');
var app=express();
var http=require('http').Server(app);
var io = require('socket.io')(http);
var ip = require('ip');
app.use(express.static('./')); 

require("./Controller/controller.js")(app,io);

    app.get('/',function(req,res){
	// Serve index.html file when server receives a request
        res.sendFile(path.resolve(__dirname+"/../../Client/index.html"));
    });

http.listen(1337,function(){
    console.log("Node Server is setup and it is listening on http://"+ip.address()+":1337");
}) */

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){ console.log("got it"); res.send("Hello World"); });

io.on('connection', function(socket){  
	console.log('user connected');  
	socket.on('chat message', function(msg){    
		io.emit('chat message', msg);  });  
	socket.on('disconnect', function(){    
		console.log('user disconnected');  });
});

http.listen(3000, function(){  console.log('listening on *:3000');});

