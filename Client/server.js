var express=require('express');
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
})
