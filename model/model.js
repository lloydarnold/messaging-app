var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Connect to our database
mongoose.connect('mongodb://localhost:27017/test', {  useMongoClient: true  } );

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
    email:String,             // primary contact email -- TODO validate this on input (use clientside js)
    yearGroup:String,         // year group -- TODO increment this every september
    primaryContact:String,   // mentor or mentee
    isAdmin:Boolean,          // by default, set to false -- TODO either add admin accounts manually from server OR do something neat
    userType:String           // mentor or mentee (could set this to boolean isMentor) ?
},{strict: false}));

module.exports.online=mongoose.model('online',new Schema({
    handle:String,            // keep temporary record of all online users -- this logs their handle
    connection_id:String      // log connection ID to send messages down socket
}));

// This is current model for message
// TODO make messages a nested document
// top is convo ID (hash of names involved? -- maybe just append names) and contents is messages sent
module.exports.messages_old = mongoose.model('message_old',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));


module.exports.test = mongoose.model('message', new Schema({
  conversationID : String,
  chatLog        : [ new Schema({ message : String,
                                  date    : Date }) ]
}));
