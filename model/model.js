var mongoose = require('mongoose');

var Schema = mongoose.Schema;

// Connect to our database
mongoose.connect('mongodb://localhost:27017/chat', { useMongoClient: true } );

// Output result of connection to logs
mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');
});
mongoose.connection.on('error', function (err) {
    console.log('Could not connect to mongo server!');
    console.log(err);
});

mongoose.connect('mongodb://localhost/mongodb');

module.exports.user=mongoose.model('User',new Schema({
    name:String,
    handle: String,
    password: String,
    phone:String,
    email:String,
    group:String,
    primary_contact:String,
},{strict: false}));

module.exports.online=mongoose.model('online',new Schema({
    handle:String,
    connection_id:String
}));

module.exports.messages=mongoose.model('message',new Schema({
    message : String,
    sender  : String,
    reciever: String,
    date    : Date
}));
