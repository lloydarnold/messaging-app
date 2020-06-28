var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');



module.exports = function (app,io){
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // The endpoint for a root request -- this is what happens when the user first accesses the server
    app.get('/',function(req,res){
        res.sendFile(path.resolve(__dirname+"/../views/index.html"));
    });

    // Self explanatory I think, but is the endpoint for a register request
    app.post('/register',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        var user={
            "name":req.body.name,         // For an explanation of data model, see model.js
            "handle":req.body.handle,
            "password":req.body.password,
            "phone":req.body.phone,
            "email":req.body.email,
            "yearGroup":12,
            "userType":req.body.mentor_mentee,
            "primaryContact":req.body.primaryContact,
            "isAdmin":false,
        };
        console.log(user);

        // Lookup our user handle, to see if they exist -- N.B. This doesn't limit one account per email address,
        // or validate their email -- this could be implemented in a future update (validation should be done on frontend)
        models.user.findOne({"handle":req.body.handle},function(err,doc){
            if(err){
                res.json(err);
            }
            if(doc == null){
                // If they do not, try to create them. If this doesn't work, log error
                models.user.create(user,function(err,doc){
                    if(err) res.json(err);
                    else{
                        res.send("success");
                    }
                });
            } else {
                // Tell their end that the user already exists
                // N.B. don't think that this does anything atm -- // TODO: add a message clientside ?
                res.send("User already found");
            }
        })

    });

    // Initialise session variables
    var handle=null;
    var primaryContact=null;
    var private=null;
    var users={};
    var keys={};

    // Handle user login request
    app.post('/login',function(req,res){
        console.log(req.body.handle);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        handle = req.body.handle;

        // Lookup user by handle + password -- if they don't match, it won't work
        // N.B. no error message as of yet (doesn't say if problem was with handle or with password)
        models.user.findOne({"handle":req.body.handle, "password":req.body.password},function(err,doc){
            if(err){
                res.send(err);
            }
            if(doc==null){
                res.send("User has not registered");
            }
            else{
                console.log("Asas"+__dirname);
                res.send("success");
            }

    });
    });

    // handle user admin connection
    app.post('/adminLogin',function(req,res){
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
      handle = req.body.handle;

      models.user.findOne({"handle":req.body.handle, "password":req.body.password, "isAdmin":true},function(err,doc){
          if(err){
              res.send(err);
          }
          if(doc==null){
              // res.send("success");
              res.send("User has not registered or is not admin");
          }
          else{
              // console.log("Asas"+__dirname);
              res.send("success");
          }

    });
  });

    // When the users log in is successful, and they connect
    io.on('connection',function(socket){
        if (handle == null) {         // guard clause -- stops user from ruining everything (but doesn't log them out)
          // app.sendFile(path.resolve(__dirname+"/../views/index.html"));      // TODO: find way of kicking them
          return;
        }
        console.log("Connection : User is connected "+handle);
        console.log("Connection : " + socket.id);

        io.to(socket.id).emit('handle', handle);

        models.user.findOne({"handle":handle},{primaryContact:1, userType:1, _id:0}, function(err, doc) {
          if (err) { console.log(err); }
          else {
            primaryContact = doc.primaryContact; // assign local variable primary contact to value yoinked from db
            userType = doc.userType;

            io.to(socket.id).emit('primaryContact', primaryContact);      // we need to send them their primary contact (mentor or mentee)
            io.to(socket.id).emit('userType', userType);

            primaryContact = null;    // Reset variables to null
            userType = null;
          }
        });

        users[handle]=socket.id;  // Give their connection a unique ID
        keys[socket.id]=handle;

        socket.on('load messages', function(socketData) {
          // socketData model ::        // DIFFERENT SEPARATOR USED HERE because convoID already contains #*@
          // (0) REQUESTEE ~%$ (1) CONVERSATION_ID
          var requestee = socketData.split("~%$")[0];
          var convoID   = socketData.split("~%$")[1];
          var messageLog;

          // console.log("convo ID: " + convoID);
          models.messages.findOne( {"conversationID":convoID},{chatLog:1, _id:0}, function(err, doc){
            if (err) {
              console.log(err);
              messageLog = [];
            } else if (doc == null) {
              messageLog = [];
            } else {
              messageLog = doc.chatLog;
            }
            io.to(users[requestee]).emit('messageLog', messageLog);

          });
          //console.log(messageLog);
        });

        socket.on('group message',function(msg){
          // global messaging is turned off, for now.

              console.log(msg);
              io.emit('group',msg);
        });

        // When we receive a private message, handle it
        socket.on('private message',function(msg){

            // message model ::
            // (0) FROM #*@ (1) MENTOR #*@ (2) MENTEE #*@ (3) MESSAGE #*@ (4) DATE
            var chatID  = msg.split("#*@")[1] + "#*@" + msg.split("#*@")[2];
            var message = msg.split("#*@")[3];
            var date    = msg.split("#*@")[4];
            var from    = msg.split("#*@")[0];

            var to;
            if (from == msg.split("#*@")[1] ) { to = msg.split("#*@")[2]; }
            else { to = msg.split("#*@")[1] }

            models.messages.findOne( { "conversationID": chatID }, function(err, doc) {
              if (doc == null) {
                // create new chat
                //console.log("new chat");

                models.messages.create( {
                  "conversationID" : chatID,
                  "chatLog"        : [ {
                                        "message" : message,
                                        "from"    : from,
                                        "date"    : date
                                        } ]
                } )

              } else {
                // push message to chat
                // console.log("saving to chat");

                models.messages.findOneAndUpdate(
                  { "conversationID" : chatID },
                  { $push: { chatLog : {"message": message , "from" : from, "date" : date } } } ,function(err, success) {
                    if (err) {console.log(err);}
                    // else {console.log("it did it"); }
                  }
                 )

              }
            });

            io.to(users[to]).emit('private message', msg);     // After we've processed msg object, send it

        });

        socket.on('disconnect', function(){
            // when the user disconnects, remove them from online
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);   // Send new online user list to all other users
            // console.log(users);       // Output new user list to our console
        });



        // following are ADMIN ONLY endpoints -- TODO incorporate admin socket ID into requests

        socket.on('find users', function(data){   // REGEX lookup, option i means case insensitive. Match name or handle.
          models.user.find( { $or: [ { "handle": {$regex: data, $options: "i"}},
                                     { "name"  : {$regex: data, $options: "i"}} ] },
                            {_id:0, name:1, handle:1},
          function(err, doc){
            if (err) {console.log(err); }
            else { io.emit('matching users', doc); }
          });

        });

        socket.on('user lookup', function(handle) {
          models.user.findOne( {"handle":handle}, function(err, doc){
            if (err) { console.log(err); }
            else {
              io.emit('user details', doc);
            };
          });
        });

        socket.on('find chats', function(data){   // REGEX lookup, option i means case insensitive
          models.messages.find( {"conversationID": {$regex: data, $options: "i"} }, {_id:0, conversationID:1}, function(err, doc){
            if (err) {console.log(err);}
            else {
              socket.emit('chats list', doc);
            }
          } );
        });

        socket.on('delete user', function(handle){
          models.users.deleteOne({"handle":handle}, function(err){
            if (err) { console.log(err); }
            else { socket.emit('user deleted', handle); }
          });
        });

        socket.on('get chat log', function(data){
          models.messages.find( {"conversationID": data }, {_id:0,conversationID:1, chatLog:1}, function(err, doc){
            if (err) {console.log(err);}
            else {
              socket.emit('chat log', doc);
            }
          });
        });

    });
}
