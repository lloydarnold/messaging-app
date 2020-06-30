var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Connect to our database -- ON_DEPLOY : change this to use amazon database
mongoose.connect('mongodb://localhost:27017/chat', {  useMongoClient: true  } );

// Output result of connection to logs
mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');
});
mongoose.connection.on('error', function (err) {
    console.log('Could not connect to mongo server!');
    console.log(err);
});

// mongoose.connect('mongodb://localhost/mongodb');

module.exports.user=mongoose.model('User',new Schema({
    name:String,              // self explanatory
    handle: String,           // unique user id
    password: String,         // self explanatory
    phone:String,             // ditto
    email:String,             // primary contact email
    yearGroup: Number,        // year group -- TODO increment this every september
    primaryContact:String,    // mentor or mentee
    isAdmin:Boolean,          // by default, set to false -- this can be set to true in admin dashboard
    userType:String,          // mentor or mentee (could set this to boolean isMentor) ?
    groups:[String]           // This is all the groups that the user
},{strict: false}));

module.exports.deleted_user=mongoose.model('deletedUser',new Schema({
    name:String,              // self explanatory
    handle: String,           // unique user id
    password: String,         // self explanatory
    phone:String,             // ditto
    email:String,             // primary contact email
    yearGroup: Number,        // year group -- TODO increment this every september
    primaryContact:String,    // mentor or mentee
    isAdmin:Boolean,          // by default, set to false -- this can be set to true in admin dashboard
    userType:String,          // mentor or mentee (could set this to boolean isMentor) ?
    groups:[String]           // This is all the groups that the user
},{strict: false}));

module.exports.online=mongoose.model('online',new Schema({
    handle:String,            // keep temporary record of all online users -- this logs their handle
    connection_id:String      // log connection ID to send messages down socket
}));

// This is old model for message
module.exports.messages_old = mongoose.model('message_old',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));

// This is the model for message storage. It consists of a nested document. The conversationID
// is stored as mentorHandle#*@menteeHandle
module.exports.messages = mongoose.model('message', new Schema({
  conversationID : String,
  chatLog        : [ new Schema({ message : String,
                                  from    : String,
                                  date    : Date }) ]
}));
