var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Connect to our database -- ON_DEPLOY : change this to use amazon database
mongoose.connect('mongodb://18.132.246.232:27017/chat', { useNewUrlParser: true, useUnifiedTopology: true });

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
    name:String,              // self explanatory           // Slightly reduced data from user (not everything needs to be saved)
    handle: String,           // unique user id
    phone:String,             // ditto
    email:String,             // primary contact email
    yearGroup: Number,        // year group
    primaryContact:String,    // their mentor or mentee
    userType:String,          // are they a mentor or mentee
    groups:[String]           // This is all the groups that the user
},{strict: false}));

module.exports.online=mongoose.model('online',new Schema({
    handle:String,            // keep temporary record of all online users -- this logs their handle
    connection_id:String      // log connection ID to send messages down socket
}));

// This is the model for message storage. It consists of a nested document. The conversationID
// is stored as mentorHandle#*@menteeHandle
module.exports.messages = mongoose.model('message', new Schema({
    conversationID : String,
    chatLog        : [ new Schema({ message : String,
                                    from    : String,
                                    date    : Date }) ]
}));

// This is the model for group messages. We could have used the same model as for regular messages
// but A this helps us with readbility in terms of our database queries (and code is written for people first
// and computers second) and B we too indie for that :cool_emoji:
module.exports.group_notices = mongoose.model('notice', new Schema({
    groupName : String,
    chatLog   : [ new Schema({ message : String,            // Notice this is THE SAME as messages, just with different
                               from    : String,            // names. This means code can be reused, but it's clear which bit
                               date    : Date }) ]          // it refers to.
}));

// This is the model for entries to our email whitelist
module.exports.emailWhiteList = mongoose.model('emailWhitelist', new Schema({
    name : String,
    email : String
}));
