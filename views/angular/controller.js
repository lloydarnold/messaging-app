var app = angular.module('myapp',['ngMaterial','ui.router','ngStorage']);

app.factory('socket', ['$rootScope', function($rootScope) {
    var socket = io.connect();

    return {
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit: function(eventName, data) {
            socket.emit(eventName, data);
        }
    };
}]);

app.config(['$stateProvider','$urlRouterProvider',function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise('/');
    $stateProvider

    .state('login',{
        url:'/',
        views:{
            'body':{
                templateUrl:'/views/login.html',
                controller:'loginController'
            }
        }
    })

    .state('admin',{
      url:'/admin',
      views:{
        'body':{
          templateUrl: '/views/admin.html',
          controller : 'adminController'
        }
      }
    })

    .state('loggedin',{
        url:'/chat',
        views:{
            'body':{
                templateUrl: '/views/chat.html',
                controller : 'chatController'
            }
        }
    })

}]);

app.directive('myEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.myEnter);
                });

                event.preventDefault();
            }
        });
    };
});

app.controller('adminController', ['$scope','socket','$http','$mdDialog','$compile','$location','$state','$localStorage',
 '$sessionStorage',function($scope,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){
    url= location.host;
    $scope.currentDisplayedUser;
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('handle', function(data) {
        $scope.user = data;
        if ($scope.user == null) {
          console.log("kick me");
          $state.go('login');
        } // TODO kick them if handle is null
        console.log("Get handle : " + $scope.user);
        console.log("this is the admin controller");

        $scope.searchUsers("");
        $scope.searchChats("");
    });

    $scope.searchChats = function(searchParameters){
      var data = ".*" + searchParameters + ".*";    // We use REGEX matching in our search -- we want to match the search
                                                    // phrase, + any other characters before or after
      socket.emit('find chats', data);

    };

    socket.on('chats list', function(data) {
      // for chat in chat list
      // add chat to output
      console.log(data);

      clearChats();
      data.forEach((chat, i) => {
        displayChat(chat);
      });

    });

    var clearChats = function(){
      document.getElementById("convoLog").innerHTML = "";
    };

    var displayChat = function(chat){
      var div = document.createElement('div');  // \ is an escape character and is needed to make computer read this bit
      div.innerHTML='<div>\
                     <p> <b> Conversation ID: </b>' + chat.conversationID + '</p>\
                     <button type="button" class="btn btn-primary btn-flat" ng-click="loadChat(\'\
                     '+ chat.conversationID + '\')">View Messages</button>\
                     </div>'
      var angularElement = angular.element(div);                // This bit of code is kinda weird -- As we need to
      var linkFun = $compile(div);                              // Append a new dynamically created element to our template
      var final = linkFun($scope);                              // We also need to make angular aware of this. This is done using
      document.getElementById("convoLog").appendChild(final[0]);  // $compile, and through a process called currying ( see recommended reading )
    };

    $scope.loadChat = function(id) {
      console.log("id: " + id);
      socket.emit('get chat log', id.trim());
    };

    socket.on('chat log', function(data) {
      var tMentor = data[0].conversationID.split("#*@")[0];
      data[0].chatLog.forEach((message, i) => {
        displayMessageAdmin(message, tMentor);
      });
      $('#modalChatLog').modal('show');
    });

    var displayMessageAdmin = function(msg, mentor){
      //console.log(msg.message);
      var div = document.createElement('div');
      if ( msg.from == mentor ) {         // These look similar, but aren't the same.
      div.innerHTML='<div class="direct-chat-msg right">\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-name pull-right">'   + msg.from + '</span>\
                      <span class="direct-chat-timestamp pull-left">' + getDate(msg.date) + '</span>\
                      </div>\
                      <div class="direct-chat-text">'
                      + msg.message +
                      '</div>\
                      </div>'; }
      else {
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+ msg.from +'</span>\
                        <span class="direct-chat-timestamp pull-right">'+ getDate(msg.date) +'</span>\
                        </div>\
                        <div class="direct-chat-text">'
                        + msg.message +
                        '</div>\
                        </div>'; }

      document.getElementById("message-target").appendChild(div);
      document.getElementById("message-target").scrollTop = document.getElementById("message-target").scrollHeight;

    };

    $scope.findUser = function(handle = "") {
      socket.emit('user lookup', handle);
    };

    socket.on('user details', function(data){
      clearUserInfo();
      displayUserInfo(data);
    });

    var clearUserInfo = function(user) {
      document.getElementById("user-details").innerHTML = "";
    };

    var displayUserInfo = function(user) {
      $scope.currentDisplayedUser = user;

      var div = document.createElement('div');
      div.innerHTML='<div class="direct-chat-msg ">\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.name + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Name: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.handle + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Handle: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.email + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Email: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.phone + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Phone Number: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.userType + '</span>\
                      <span class="direct-chat-name pull-left">'+ " User Type: " +'</span>\
                      </div>\
                      <button type="button" class="btn btn-primary btn-flat" ng-click="showUpdateUser()">Update User</button>'

          var angularElement = angular.element(div);                // This bit of code is kinda weird -- As we need to
          var linkFun = $compile(div);                              // Append a new dynamically created element to our template
          var final = linkFun($scope);                              // We also need to make angular aware of this. This is done using
          document.getElementById("user-details").appendChild(final[0]);  // $compile, and through a process called currying ( see recommended reading )
          document.getElementById("user-details").scrollTop=document.getElementById("user-details").scrollHeight;

    };

    $scope.showUpdateUser = function() {
      var user = $scope.currentDisplayedUser;
      populateUpdateForm(user);
      $('#modalUpdateUser').modal('show');
    };

    $scope.saveUserChanges = function() {
      toSave = mergeUsers(($scope.currentDisplayedUser), $scope.newUser);
      let data = [ {"handle":$scope.currentDisplayedUser.handle}, toSave]
      socket.emit('update user', data);
    }

    var mergeUsers = function(oldUser, newUser){
      var merged = {"name":"", "handle":"", "userType":"", "primaryContact":"",
                    "password":"", "isAdmin":"", "email":"", "phone":""};
      for (item in merged){
        console.log(item);
        if (newUser[item] == undefined) {
          console.log(oldUser[item]);
          merged[item] = oldUser[item]; }
        else { merged[item] = newUser[item]; }
      };
      return merged;
    }

    var populateUpdateForm = function(user){
      document.getElementById("name").placeholder           = user.name;
      document.getElementById("handle").placeholder         = user.handle;
      document.getElementById("userType").placeholder       = user.userType;
      document.getElementById("primaryContact").placeholder = user.primaryContact;
      document.getElementById("email").placeholder          = user.email;
      document.getElementById("phone").placeholder          = user.phone;
    };

    socket.on('endpoint', function(data) {

    });

    $scope.kick = function(userHandle){

    };

    $scope.searchUsers = function(searchParameters = ""){
      var data = ".*" + searchParameters + ".*";
      console.log(data);
      socket.emit('find users', data);
    };

    socket.on('matching users', function(data){
      if (data == []) {
        console.log("no matches");
      } else {
        clearUserMatches();
        data.forEach((user, i) => {
          displayUsers(user.name, user.handle);
        });

      }
    });

    var clearUserMatches = function(){
        document.getElementById("matchingUsers").innerHTML = "";
    };

    var displayUsers = function(name, handle){
      var div = document.createElement('div');
      div.innerHTML='<div class="direct-chat-msg right">\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' +"@" +handle+ '</span>\
                      <span class="direct-chat-name pull-left">'+ name +'</span>\
                      </div>\
                      </div>';
          document.getElementById("matchingUsers").appendChild(div);
          // document.getElementById("matchingUsers").scrollTop=document.getElementById("matchingUsers").scrollHeight;
    };

    var getDate=function(date=new Date() ){
        date = new Date(date);
        hour = date.getHours();
        period="AM";
        if (hour>=12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;
    };      // has to be here as well as in chatController because of scope

}]);

app.controller('chatController',['$scope','socket','$http','$mdDialog','$compile','$location','$state','$localStorage',
 '$sessionStorage',function($scope,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){

    url= location.host;
    $scope.users=[];
    $scope.messages={};
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('handle', function(data) {
        $scope.user = data;
        if ($scope.user == null) {
          console.log("kick me");
          $state.go('login');
        } // TODO kick them if handle is null
        console.log("Get handle : " + $scope.user);
    });

    socket.on('primaryContact', function(data) {
      $scope.primaryContact = data;
      // console.log("primary contact: " + $scope.primaryContact);
      // need to find out if they are mentor or mentee
    });

    socket.on('userType', function(data) {
      // console.log("usertype received. usertype is: " + data);
      if (data == "mentor") {
        $scope.mentor = $scope.user;
        $scope.mentee = $scope.primaryContact;
      } else {
        $scope.mentor = $scope.primaryContact;
        $scope.mentee = $scope.user;
      }

      socket.emit('load messages', $scope.user + "~%$" + $scope.mentor + "#*@" + $scope.mentee)
    });

    socket.on('messageLog', function(data) {
      console.log(data);
      var tempMsg;
      // message model ::
      // (0) FROM #*@ (1) MENTOR #*@ (2) MENTEE #*@ (3) MESSAGE #*@ (4) DATE
      data.forEach((message, i) => {
        tempMsg = message.from + "#*@" + $scope.mentor + "#*@" + $scope.mentee + "#*@" + message.message + "#*@" + message.date;
        displayMessage(tempMsg);
      });

    });

    var getDate=function(date=new Date() ){
        date = new Date(date);
        hour = date.getHours();
        period="AM";
        if (hour>=12){
            hour=hour%12;
            period="PM";
        }
        form_date=monthNames[date.getMonth()]+" "+date.getDate()+", "+hour+":"+date.getMinutes()+" "+period;
        return form_date;
    };

    socket.on('group', function(data) {
        var div = document.createElement('div');
        if(data.split("#*@")[1]!=$scope.user){
            div.innerHTML='<div class="direct-chat-msg right">\
                            <div class="direct-chat-info clearfix">\
                            <span class="direct-chat-name pull-right">'+data.split("#*@")[1]+'</span>\
                            <span class="direct-chat-timestamp pull-left">'+getDate()+'</span>\
                            </div>\
                            <div class="direct-chat-text">'
                            +data.split("#*@")[0]+
                            '</div>\
                            </div>';
            document.getElementById("group").appendChild(div);
            document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        }
    });

    $scope.group_message= function(message){
        if (message == null) { return; } // Cheeky guard clause, stop null messages from being sent
        div = document.createElement('div');
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+$scope.user+'</span>\
                        <span class="direct-chat-timestamp pull-right">'+getDate()+'</span>\
                        </div>\
                        <div class="direct-chat-text">'
                        +message+
                        '</div>\
                        </div>';
        document.getElementById("group").appendChild(div);
        document.getElementById("group").scrollTop=document.getElementById("group").scrollHeight;
        socket.emit('group message',message+"#*@"+$scope.user);
        $scope.groupMessage=null;
    };

    var displayMessage = function(messageData) {
      var div = document.createElement('div');

      // message model ::
      // (0) FROM #*@ (1) MENTOR #*@ (2) MENTEE #*@ (3) MESSAGE #*@ (4) DATE
      if ( messageData.split("#*@")[0] == $scope.user ) {         // These look similar, but aren't the same.
      div.innerHTML='<div class="direct-chat-msg right">\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-name pull-right">'   + messageData.split("#*@")[0] + '</span>\
                      <span class="direct-chat-timestamp pull-left">' + getDate(messageData.split("#*@")[4]) + '</span>\
                      </div>\
                      <div class="direct-chat-text">'
                      + messageData.split("#*@")[3] +
                      '</div>\
                      </div>'; }
      else {
        div.innerHTML='<div class="direct-chat-msg"> \
                        <div class="direct-chat-info clearfix">\
                        <span class="direct-chat-name pull-left">'+ messageData.split("#*@")[0] +'</span>\
                        <span class="direct-chat-timestamp pull-right">'+ getDate(messageData.split("#*@")[4]) +'</span>\
                        </div>\
                        <div class="direct-chat-text">'
                        + messageData.split("#*@")[3] +
                        '</div>\
                        </div>'; }

      document.getElementById("group").appendChild(div);
      document.getElementById("group").scrollTop = document.getElementById("group").scrollHeight;

    };

    socket.on('private message', function(data) {
        displayMessage(data);
    });

    $scope.send_message_primary=function(message){
        if (message == null) { return; } // Cheeky guard clause, stop null messages from being sent

        var formattedMessage = $scope.user + "#*@" + $scope.mentor + "#*@" + $scope.mentee + "#*@" + message + "#*@" + getDate()
        displayMessage(formattedMessage);
        socket.emit('private message', formattedMessage);

        $scope.message=null;
    };

}]);

app.service('encrypt', function() {
    this.hash =function(str){
        h = 7;
        letters = "abcdefghijklmnopqrstuvwxyz-_1234567890@!#$%&*.,"
        for (var i=0;i<str.length;i++){
            h = (h * 37 + letters.indexOf(str[i]))
        }
        return h
    }
});

// This is in charge of the register page
app.controller('loginController',['$scope','encrypt','$http','$state',function($scope,encrypt,$http,$state){
    url= location.host;

    $scope.user = {};

    /*$scope.user={
        'name':'',
        'handle':'',
        'password':'',
        'email':'',
        'phone':''
    };*/

    $scope.login_data={
        'handle':'',
        'password':''
    };

    $scope.admin_data={
      'handle':'',
      'password':''
    };

    $scope.Register = function(){
      var valid = true;
      if ($scope.user.name == undefined){
        valid = false;
        document.getElementById("nameError").innerHTML = "Please enter your name";
        highlightElement(document.getElementById("name"));
      }
      if ($scope.user.handle == undefined){
        valid = false;
        document.getElementById("handleError").innerHTML = "That handle is unavailable";
        highlightElement(document.getElementById("handle"));
      }
      if ($scope.user.mentor_mentee == undefined){
        valid = false;
        document.getElementById("userTypeError").innerHTML = "Please select a user type";
        highlightElement(document.getElementById("mentor_mentee"));
      }
      if ($scope.user.primaryContact == undefined){
        valid = false;
        document.getElementById("primContError").innerHTML = "Please enter your mentor's handle";
        highlightElement(document.getElementById("primaryContact"));
      }
      if ($scope.user.password == undefined){
        valid = false;
        document.getElementById("passwordError").innerHTML = "Please enter a password";
        highlightElement(document.getElementById("password"));
      }
      if (!valid_email($scope.user.email)) {
        valid = false;
        document.getElementById("emailError").innerHTML = "Please enter a valid email address";
        highlightElement(document.getElementById("email"));
      }
      if (!valid_phone($scope.user.phone)) {
        valid = false;
        document.getElementById("phoneError").innerHTML = "Please enter a valid UK phone number";
        highlightElement(document.getElementById("phone"));
      }

      if (valid) { send_details(); }
    };

    var valid_phone = function(phoneNum){   // Validates phone using REGEX. Only allows UK numbers
      var phonePattern = /^(\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)(44)\)?[\s-]?)?\(?0?(?:\)[\s-]?)?([1-9]\d{1,4}\)?[\d\s-]+)((?:x|ext\.?|\#)\d{3,4})?$/;
      return phonePattern.test(phoneNum);
    };

    var valid_email = function(email){    // Validates email using REGEX
      var emailPattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return emailPattern.test(email);
    };

    var send_details = function() {
      $scope.user.password=encrypt.hash($scope.user.password);

      $http({method: 'POST',url:'http://'+url+'/register', data:$scope.user})//, headers:config})
          .success(function (data) {
          if (data == "success"){
            $('#myModalRegister').modal('hide');
            alert("You have now registered. Please proceed to log in");
          } else if (data == "User already found") {
            document.getElementById("handleError").innerHTML = "That handle is unavailable";
            highlightElement(document.getElementById("handle"));
          }
      })
          .error(function (data) {
          //add error handling
          console.log(data);
      });

    };

    function highlightElement (element) {
      element.style.borderColor = "#ff2200";
      fadeBack(element, "#BBBBBB");
    }

    function fadeBack (element, targetCol) {
      // three second fade
      var startCol = element.style.borderColor;
      var steps = 30;

      startCol = formatRGB(startCol);

      deltaR = (hexToR(targetCol) - startCol[0]) / steps
      deltaG = (hexToG(targetCol) - startCol[1]) / steps
      deltaB = (hexToB(targetCol) - startCol[2]) / steps

      for (var i = 0; i < steps; i++) {
        temp = `rgb( ${ startCol[0] + (deltaR * i)}, ${ startCol[1] + deltaG * i}, ${startCol[2] + deltaB * i} )`;
        setColour(element, temp, i)
      }
    }

    function setColour(element, colour, count) {
      setTimeout( function() {element.style.borderColor = colour;}, count * 100);
    }

    function hexToR(h) {return parseInt((cutHex(h)).substring(0,2),16)}
    function hexToG(h) {return parseInt((cutHex(h)).substring(2,4),16)}
    function hexToB(h) {return parseInt((cutHex(h)).substring(4,6),16)}
    function cutHex(h) {return (h.charAt(0)=="#") ? h.substring(1,7):h}
    function formatRGB(raw) {
      raw = raw.substring(4, raw.length-1)
               .replace(/ /g, '')
               .split(',');
      var cooked = new Array(2);
      for (var i = 0; i < raw.length; i++) {
       cooked[i] = parseInt(raw[i]);
      }
      return cooked;
    }

    $scope.login = function(){
      // console.log($scope.login_data);
      var handle = $scope.login_data.handle;
      var pass = encrypt.hash($scope.login_data.password);
      adminLogin(handle, pass);
    }

    var standardLogin = function(handle, pass){
        // console.log("inside login");
        $http({ method: 'POST', url:'http://'+url+'/login', data:{ "handle":handle, "password":pass } })//, headers:config})
            .success(function (data) {
            if(data=="success"){
                // console.log("Inside success login");
                $state.go('loggedin');
            }
        })
            .error(function (data) {
            //add error handling
            console.log(data);
        });
    }

    var adminLogin = function(handle, pass){
        // console.log("inside admin login");

        /*$('#myModalAdmin').modal('hide');
        console.log("closing the modal");*/

        // console.log($scope.admin_data);
        $http({ method: 'POST', url:'http://'+url+'/adminLogin', data:{ "handle":handle, "password":pass } })//, headers:config})
            .success(function (data) {
            if(data=="success"){
                console.log("Inside success admin login");
                $state.go('admin');
            } else {
              standardLogin(handle, pass);        // If they're not an admin, try a standard login
            }
            })
            .error(function (data) {
            //add error handling
            console.log(data);
          })
      }
  }]);
