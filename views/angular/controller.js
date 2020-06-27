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
    $scope.test = [];

    socket.on('handle', function(data) {
        $scope.user = data;
        if ($scope.user == null) { console.log("kick me"); } // TODO kick them if handle is null
        console.log("Get handle : " + $scope.user);
        console.log("this is the admin controller");
    });

    socket.on('chats list', function(data) {
      // for chat in chat list
      // add chat to
    });

    socket.on('endpoint', function(data) {

    });

    $scope.kick = function(userHandle){

    };

    $scope.searchUsers = function(searchParameters){
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
          document.getElementById("matchingUsers").scrollTop=document.getElementById("matchingUsers").scrollHeight;
    };

}]);

app.controller('chatController',['$scope','socket','$http','$mdDialog','$compile','$location','$state','$localStorage',
 '$sessionStorage',function($scope,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){

    url= location.host;
    $scope.users=[];
    $scope.messages={};
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.on('handle', function(data) {
        $scope.user = data;
        if ($scope.user == null) { console.log("kick me"); } // TODO kick them if handle is null
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

    $scope.user={
        'name':'',
        'handle':'',
        'password':'',
        'email':'',
        'phone':''
    };

    $scope.login_data={
        'handle':'',
        'password':''
    };

    $scope.admin_data={
      'handle':'',
      'password':''
    };

    $scope.Register = function(){
        $scope.user.password=encrypt.hash($scope.user.password);

        $http({method: 'POST',url:'http://'+url+'/register', data:$scope.user})//, headers:config})
            .success(function (data) {
            console.log(data)
        })
            .error(function (data) {
            //add error handling
            console.log(data)
        });
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
