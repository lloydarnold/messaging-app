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
            "userType":req.body.mentor_mentee,
            "isAdmin":false,
            "primary_contact":req.body.primary_contact,
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
    var primary_contact=null;
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

    // When the users log in is successful, and they connect
    io.on('connection',function(socket){
        if (handle == null) {         // guard clause -- stops user from ruining everything (but doesn't log them out)
          // app.sendFile(path.resolve(__dirname+"/../views/index.html"));      // TODO: find way of kicking them
          return;
        }
        console.log("Connection : User is connected "+handle);
        console.log("Connection : " + socket.id);

        io.to(socket.id).emit('handle', handle);

        // TODO: lookup primary contact in DB & set it

        models.user.findOne({"handle":handle},{primary_contact:1, _id:0}, function(err, doc) {
          if (err) { console.log(err); }
          else {
            /*console.log("mentor: " + doc);
            console.log("mentor: " + doc.primary_contact);*/
            primary_contact = doc.primary_contact; // assign local variable primary contact to value yoinked from db

            io.to(socket.id).emit('primary_contact', primary_contact);      // we need to send them their primary contact (mentor or mentee)
            primary_contact = null;
          }
        });

        users[handle]=socket.id;  // Give their connection a unique ID
        keys[socket.id]=handle;

        console.log("Users list : " + users);   // More debug output
        console.log("keys list : " + keys);

        models.user.findOne({"handle" : handle},{friends:1,_id:0},function(err,doc){
            if(err){ res.json(err); } // If we get hit by a bug, give it to thems
            else{
                friends=[];
                pending=[];
                all_friends=[];
                // console.log("friends list: "+doc);
                try { list=doc.friends.slice(); }    // catch errors thrown if friends list doesn't exist
                catch(err) { list = {} }
                finally { console.log(list); }

                for(var i in list){
                    if(list[i].status=="Friend"){
                        friends.push(list[i].name);
                    }
                    else if (list[i].status=="Pending"){
                        pending.push(list[i].name);
                    }
                    else{
                        continue;
                    }
                }

                /* console.log("pending list: " +pending);
                console.log("friends list: " +friends); */

                io.to(socket.id).emit('friend_list', friends);    // Send friends list down socket
                io.to(socket.id).emit('pending_list', pending);   // TODO review if ANY of this is still necessary

                io.emit('users', users);                         // Update list of online users (do we still need this?)
            }
        });


        socket.on('group message',function(msg){
          // global messaging is turned on, for now.
          // TODO : save global messages to a log

              console.log(msg);
              io.emit('group',msg);
        });

        // When we receive a private message, handle it
        socket.on('private message',function(msg){

          // TODO : save messages

            console.log('message  :'+msg.split("#*@")[0]);
            models.messages.create({                // we create a new message as per messages model in model.js
                "message":msg.split("#*@")[1],      // we split on "#*@" -- this is as good a separator as any
                "sender" :msg.split("#*@")[2],      // important details are: sender, receiver, datestamp
                "reciever":msg.split("#*@")[0],
                "date" : new Date()});
            io.to(users[msg.split("#*@")[0]]).emit('private message', msg);     // After processed into an object, send it

        });


        socket.on('disconnect', function(){
            // when the user disconnects, remove them from online
            delete users[keys[socket.id]];
            delete keys[socket.id];
            io.emit('users',users);   // Send new online user list to all other users
            console.log(users);       // Output new user list to our console

        });
    });

    // The code below allows for the sending of peer to peer friend requests, a feature that has been suspended

  /*  app.post('/friend_request',function(req,res){
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader("Access-Control-Allow-Method","'GET, POST, OPTIONS, PUT, PATCH, DELETE'");
        friend=true;
        models.user.find({"handle" : req.body.my_handle,"friends.name":req.body.friend_handle},function(err,doc){
            if(err){res.json(err);}
            else if(doc.length!=0){
                console.log("Friend request : "+doc.length);
                console.log("Friend request : friend request already sent " + doc);
                res.send("Friend request already sent ");
            }
            else{
                console.log("Friend request : "+doc.length);
                models.user.update({
                    handle:req.body.my_handle
                },{
                    $push:{
                        friends:{
                            name: req.body.friend_handle,
                            status: "Pending"
                        }
                    }
                },{
                    upsert:true
                },function(err,doc){
                    if(err){res.json(err);}
                    //            else{
                    //                console.log(doc);
                    //            }
                });
                io.to(users[req.body.friend_handle]).emit('message', req.body);
            }
        });
    }); */

    /* app.post('/friend_request/confirmed',function(req,res){
        console.log("friend request confirmed : "+req.body);
        if(req.body.confirm=="Yes"){
            models.user.find({
                "handle" : req.body.friend_handle,
                "friends.name":req.body.my_handle
            },function(err,doc){
                if(err){
                    res.json(err);
                }
                else if(doc.length!=0){
                    console.log("Friend request confirmed : "+doc.length);
                    console.log("Friend request confirmed : friend request already sent "+doc);
                    res.send("Friend request already accepted");
                }
                else{
                    models.user.update({
                        "handle":req.body.my_handle,
                        "friends.name":req.body.friend_handle
                    },{
                        '$set':{
                            "friends.$.status":"Friend"
                        }
                    },function(err,doc){
                        if(err){res.json(err);}
                        else{

                            console.log("friend request confirmed : Inside yes confirmed");
                            io.to(users[req.body.friend_handle]).emit('friend', req.body.my_handle);
                            io.to(users[req.body.my_handle]).emit('friend', req.body.friend_handle);
                        }
                    });
                    models.user.update({
                        handle:req.body.friend_handle
                    },{
                        $push:{
                            friends:{
                                name: req.body.my_handle,
                                status: "Friend"
                            }
                        }
                    },{upsert:true},function(err,doc){
                        if(err){res.json(err);}
                        //            else{
                        //                console.log(doc);
                        //            }
                    });
                }
            });
        }
        else{

            console.log("friend request confirmed : Inside No confirmed");
            models.user.update({
                "handle":req.body.my_handle
            },{
                '$pull':{
                    'friends':{
                        "name":req.body.friend_handle,
                    }
                }
            },function(err,doc){
            if(err){res.json(err);}
            else{
                console.log("No");
            }
        });
        }
    }); */

}
