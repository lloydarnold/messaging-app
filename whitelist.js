var models = require('./model/model.js');

var emailEntry1 = {
    "name" : "simon",
    "email": "simon@simon.org"
};

var emailEntry2 = {
    "name" : "simon",
    "email": "test@test.com"
};


models.emailWhiteList.create(emailEntry1, function(err, doc){
  if(err) { console.log(err); }
  else{
    console.log("success");
  }
});

models.emailWhiteList.create(emailEntry2, function(err, doc){
  if(err) { console.log(err); }
  else{
    console.log("success");
  }
});
