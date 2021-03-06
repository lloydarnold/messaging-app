var models = require('../model/model.js');
var path = require('path');
var bodyParser = require('body-parser');
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'eu-west-2'});
// var myKey = require('secret');
var emailTemplate = require('../model/emailTemp.json')

module.exports = function (app,io){
    app.use( bodyParser.json() );
    app.use(bodyParser.urlencoded({
        extended: true
    }));

    // The endpoint for a root request -- this is what happens when the user first accesses the server
    app.get('/',function(req,res){
        res.sendFile(path.resolve(__dirname+"/../views/index.html"));
    });

    // endpoint for adding email to whitelist
    app.post('/addAllowedEmail', function(req, res){
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
      // if (req.body.key != myKey) {return;}
        var emailEntry = {
          "name":req.body.name,
          "email":req.body.email
        };

        models.emailWhiteList.create(emailEntry, function(err, doc){
          if(err) { res.json(err); }
          else{
            res.send("success");
          }
        });
    })

    // Self explanatory I think, but is the endpoint for a register request
    app.post('/register',function(req,res){
      /* This endpoint is quite ugly. The reason that it is the way it is is because of the asynchronous nature of node,
          which means things don't always happen in the order you wanted them to. If the user claims to be a mentee, we check
          that their desired mentor is A existing and B free. If they claim to be a mentor, we check them against the
          email whitelist. At present, we don't actually pop from the whitelist at this point -- if you wanted to implement
          this in the future it would be a simple case of adding mongoose removeOne() into the else under mentor. */
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        var user={
            "name":req.body.name,         // For an explanation of data model, see model.js
            "handle":req.body.handle,
            "password":req.body.password,
            "phone":req.body.phone,
            "email":req.body.email,
            "yearGroup":parseInt(req.body.yearGroup),     // Type casting, as it's a string clientside.
            "userType":req.body.mentor_mentee,
            "primaryContact":req.body.primaryContact,
            "isAdmin":false,
            "groups":req.body.groups
        };
        console.log(user);

        var createUser = function(user) {
          models.user.create(user,function(err,doc){
            if(err) { res.json(err); }
            else{
              res.send("success");
            }
          });
        }

        // Lookup our user handle, to see if they exist -- N.B. This doesn't limit one account per email address,
        // -- this could be implemented in a future update
        models.user.findOne({"handle":req.body.handle},function(err,doc){
            if(err){
                res.json(err);
            }
            if(doc == null){
                // If they do not exist, try to create them. If this doesn't work, log error

                if (user.userType == "mentee") {    // if they're a mentee, check that their mentor is free
                  models.user.findOne({ "handle":user.primaryContact }, {_id:0, primaryContact:1}, function(err, doc){
                    if (err) {console.log(err);}
                    if (doc == null){
                      res.send("mentor unavailable");
                    } else if (doc.primaryContact != "") {
                      res.send("mentor unavailable");
                    }
                    else {  // if their mentor is free, assign them as a mentee so the mentor is no longer free.
                      models.user.findOneAndUpdate({ "handle":user.primaryContact }, {$set: { primaryContact: user.handle }},
                            function(err,doc){
                              if (err) { console.log(err); }
                            });
                      createUser(user);
                    }
                  })
                } else {  // if they're not a mentee, they're a mentor. check that they are whitelisted
                  models.emailWhiteList.findOne({"email": {$regex: user.email, $options: "i" } }, function(err, doc) {
                    if (err) {console.log(err);}
                    if (doc == null){
                      res.send("email not recognised");
                    } else {
                      createUser(user);
                    }
                  })
                }

            } else {
                // Tell their end that the user already exists
                res.send("User already found");
            }
        })

    });

    // Initialise session variables
    var tempHandle=null;
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
                // console.log("Asas"+__dirname);
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
        //if (tempHandle == null) {         // guard clause -- stops user from ruining everything (but doesn't log them out)
          // app.sendFile(path.resolve(__dirname+"/../views/index.html"));
         // return;
        //}
        //console.log("Connection : User is connected "+ tempHandle);
        console.log("Connection : " + socket.id);

        // io.to(socket.id).emit('handle', handle);

        socket.on('load self', function(socketHandle) {
          console.log("self loading");
          if (socketHandle == null) {
              console.log("awh shucks");
	      return;
          };
          models.user.findOne({"handle":socketHandle},{primaryContact:1, userType:1, groups:1, yearGroup:1, _id:0}, function(err, doc) {
            if (err) { console.log(err); }
            else {
              primaryContact = doc.primaryContact; // assign local variable primary contact to value yoinked from db
              userType = doc.userType;
              groups = doc.groups;
              yearGroup = doc.yearGroup;
              /*io.to(socket.id).emit('primaryContact', primaryContact);      // we need to send them their primary contact (mentor or mentee)
              io.to(socket.id).emit('userType', userType);*/

              toSend = { "handle":socketHandle, "primaryContact": primaryContact, "userType":userType, "groups":groups, "yearGroup":yearGroup};
              io.to(socket.id).emit('user data', toSend);

              primaryContact = null;    // Reset variables to null
              userType = null;
              groups = null;
            }
          });

          users[socketHandle]=socket.id;  // Give their connection a unique ID
          keys[socket.id]=socketHandle;

        });

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

            if (users[to] != null) {
              io.to(users[to]).emit('private message', msg);     // After we've processed msg object, send it
            } else {
              models.user.findOne({"handle" : to}, {email:1, _id:0}, function(err, doc) {
                if (err) { console.log(err); }
                if (doc != null) {
                  var localEmail = emailTemplate;
                  localEmail.Destination.ToAddresses.push(doc.email);
                  var sendPromise = new AWS.SES({apiVersion: '2010-12-01'}).sendEmail(localEmail).promise();

                  sendPromise.then(
                    function(data) {
                      console.log(data.MessageId);
                    }).catch(
                      function(err) {
                      console.error(err, err.stack);
                    });

                }
              });
            }
        });

        socket.on('disconnect', function(){
            // when the user disconnects, remove them from online
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);   // Send new online user list to all other users
            // console.log(users);       // Output new user list to our console
        });

        socket.on('load notices', function(data){
          models.group_notices.find({}, function(err, doc) {
            if (err) { console.log(err); }
            else {
              io.to(users[data]).emit('notice log', doc);
            }
          });
        });

        // following are ADMIN ONLY endpoints -- TODO incorporate admin socket ID into requests

        socket.on('group message',function(msg){
            // message model ::
            // (0) FROM #*@ (1) GROUPID #*@ (2) MESSAGE #*@ (3) DATE

            var chatID  = msg.split("#*@")[1]
            var message = msg.split("#*@")[2];
            var date    = msg.split("#*@")[3];
            var from    = msg.split("#*@")[0];

            models.group_notices.findOne( { "groupName": chatID }, function(err, doc) {
              if (doc == null) {
                // create new chat
                // console.log("new chat");

                models.group_notices.create( {
                  "groupName" : chatID,
                  "chatLog"        : [ {
                                        "message" : message,
                                        "from"    : from,
                                        "date"    : date
                                        } ]
                } )
              } else {
                // push message to chat
                // console.log("saving to chat");

                models.group_notices.findOneAndUpdate(
                  { "groupName" : chatID },
                  { $push: { chatLog : {"message": message , "from" : from, "date" : date } } } ,function(err, success) {
                    if (err) {console.log(err);}
                    // else {console.log("it did it"); }
                  }
                 )

              }
            });

            io.emit('group message clientside', [chatID, {"message": message , "from" : from, "date" : date} ]);
        });

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
          var tempUser;
          models.user.findOne({"handle":handle}, function(err, user){
            if (err) { console.log(err); }
            else {
              if (user == undefined) { return; } // guard clause
              else {
                models.deleted_user.create({ "name" : user.name,
                                             "handle" : user.handle,
                                             "phone" : user.phone,
                                             "email" : user.email,
                                             "yearGroup" : user.yearGroup,
                                             "primaryContact" : user.primaryContact,
                                             "userType" : user.userType,
                                             "groups" : user.groupMessage
                                           }, function(err, success){
                    if (err) {console.log(err);}
                  });

                models.user.deleteOne({"handle":handle}, function(err){
                  if (err) { console.log(err); }
                  else { socket.emit('user deleted', handle); }
                });
              }
            }
          })
        });

        socket.on('get chat log', function(data){
          models.messages.find( {"conversationID": data }, {_id:0,conversationID:1, chatLog:1}, function(err, doc){
            if (err) {console.log(err);}
            else {
              socket.emit('chat log', doc);
            }
          });
        });

        socket.on('update user', function(data){
          var handle = data[0].handle;
          // console.log(handle);
          models.user.findOneAndUpdate({"handle":handle},
                                        { $set: { "name":data[1].name,
                                                  "handle":data[1].handle,
                                                  "password":data[1].password,
                                                  "phone":data[1].phone,
                                                  "email":data[1].email,
                                                  "primaryContact":data[1].primaryContact,
                                                  "isAdmin":data[1].isAdmin,
                                                  "userType":data[1].userType
                                                }}, function(err, success){
                                                  if (err) {console.log(err);}
                                                  else { /*console.log("success");*/ }
                                                });
        });

    });
}
