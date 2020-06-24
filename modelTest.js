var models = require('./model/model.js');

console.log("logging");
/*
models.messages_old.create({
  "message" : "a message",
  "sender"  : "forced",
  "receiver": "nobody",
  "date" : new Date()
}); */

/* models.test.create({
  "conversationID" : "testID",
  "chatLog" : [ { "message":"1 message" , "date" : new Date() } ]
}, function(err) {
  if (err) { console.log(err); }
  else { console.log("worked"); }
} ); */


/*var loaded = models.test.findOne({"conversationID":"testID"}, function(err,doc) {
  if (err) { console.log("awh shucks"); }
  else { console.log("wosh");
    console.log(doc);
    // doc.chatLog.push( {"message":"a message" , "date" : new Date() } );
    console.log(doc);
  }
});*/


models.test.findOneAndUpdate(
  { "conversationID" : "testID" },
  { $push: { chatLog : {"message":"2 message" , "date" : new Date() } } } ,function(err, success) {
    if (err) {console.log(err);}
    else {console.log("it did it"); }
  }
 )


// loaded.chatLog.push( {"message":"a message" , "date" : new Date() } )



console.log("made it");
