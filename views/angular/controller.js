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

app.controller('adminController', ['$scope', 'encrypt', 'socket','$http', '$mdDialog','$compile','$location','$state','$localStorage',
 '$sessionStorage',function($scope,encrypt,socket,$http,$mdDialog,$compile,$location,$state,$localStorage, $sessionStorage){
    url= location.host;
    $scope.currentDisplayedUser;
    $scope.currentUserHandle;
    $scope.noticeGroupSelected="global";
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
    var allGroups = ["global", "12", "13", "mentors", "oxbridge", "Mathematical-Sciences", "Natural-Sciences", "Economics-Management-and-Business",
                    "Medicinal-Sciences", "Social-Sciences", "Creative-Arts", "Liberal-Arts", "Humanities", "Linguistics-and-Language",
                    "Law" ];

    socket.on('user data', function (data) {
      $scope.user = data.handle;
      if ($scope.user == null) {
        console.log("kick me");
        $state.go('login');
      }

      $scope.searchUsers("");
      $scope.searchChats("");
      initGroups();

      socket.emit('load notices', $scope.user);
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
      document.getElementById("message-target").innerHTML = '';

      data[0].chatLog.forEach((message, i) => {
        displayMessageAdmin(message, tMentor);
      });
      document.getElementById("message-target").scrollTop = document.getElementById("message-target").scrollHeight;
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
                      <span class="direct-chat-timestamp pull-right">' + user.phone + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Phone Number: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.yearGroup + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Year Group (> 13 counts into uni): " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.userType + '</span>\
                      <span class="direct-chat-name pull-left">'+ " User Type: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.primaryContact + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Mentor / Mentee: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.groups + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Groups: " +'</span>\
                      </div>\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-timestamp pull-right">' + user.isAdmin + '</span>\
                      <span class="direct-chat-name pull-left">'+ " Admin Rights? : " +'</span>\
                      </div>\
                      <button type="button" class="btn btn-primary btn-flat" ng-click="showUpdateUser()">Update User</button>\
                      <button type="button" class="btn btn-primary btn-flat" ng-click="confirmDelete()"> Delete User</button>'

          var angularElement = angular.element(div);                // This bit of code is kinda weird -- As we need to
          var linkFun = $compile(div);                              // Append a new dynamically created element to our template
          var final = linkFun($scope);                              // We also need to make angular aware of this. This is done using
          document.getElementById("user-details").appendChild(final[0]);  // $compile, and through a process called currying ( see recommended reading )
          document.getElementById("user-details").scrollTop=document.getElementById("user-details").scrollHeight;

    };

    $scope.confirmDelete = function() {
      $scope.currentUserHandle = $scope.currentDisplayedUser.handle;
      var user = $scope.currentDisplayedUser;
      $("#myModalDeleteUser").modal("show");
    };

    $scope.deleteUser = function() {
      socket.emit('delete user', $scope.currentUserHandle);
      $scope.currentUserHandle = null;                  // After we have deleted user, clean up our records clientside
      $scope.currentDisplayedUser = null;
      clearUserInfo();
      $scope.searchUsers("");
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
      for (item in merged){                       // most things we can do like this, some special cases (see below)
        if (newUser[item] == undefined) {
          merged[item] = oldUser[item]; }
        else { merged[item] = newUser[item]; }
      };

      // password needs to be hashed on assignment
      if (newUser.password != undefined ) { merged.password = encrypt.hash( merged.password ); }
      if (newUser.isAdmin == "change") {merged.admin = !oldUser.admin;}       // admin works on 'change' trigger
      if (newUser.primaryContact == "clear") { merged.primaryContact = ""; }  // if they type clear, clear it
      if (newUser.extraGroup != undefined) {merged.groups = oldUser.groups.push(newUser.extraGroup); }  // if new group, add it
      return merged;
    }

    var populateUpdateForm = function(user){
      document.getElementById("name").placeholder            = user.name;
      document.getElementById("handle").placeholder          = user.handle;
      document.getElementById("userType").placeholder        = user.userType;
      document.getElementById("primaryContact").placeholder  = user.primaryContact;
      document.getElementById("email").placeholder           = user.email;
      document.getElementById("phone").placeholder           = user.phone;
      document.getElementById("admin-current").innerHTML     = user.isAdmin;
      document.getElementById("change-admin-state").innerHTML= !user.isAdmin;
    };

    $scope.searchUsers = function(searchParameters = ""){
      var data = ".*" + searchParameters + ".*";
      console.log(data);
      socket.emit('find users', data);
    };

    var initGroups = function(){
      allGroups.forEach((group, i) => {
        displayGroupButton(group);
        createGroupDiv(group);
      });
      document.getElementById("notices-global").style.display = "block";
    };

    var createGroupDiv = function(group) {
      var tempDiv = document.createElement('div');
      tempDiv.setAttribute("id", "notices-" + group);
      tempDiv.setAttribute("class", "noticeboard-hide");

      document.getElementById("noticeBoard").appendChild(tempDiv);
    };

    var displayGroupButton = function(group) {
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = '<button type="button" class="btn btn-primary btn-flat" ng-click="changeGroup(\' ' + group + ' \' )">\
                          ' + group.replace("-", " ") + '</button>';

      var angularElement = angular.element(tempDiv);
      var linkFun = $compile(angularElement);
      var final = linkFun($scope);

      document.getElementById("noticeBoardTabs").appendChild(final[0]);
    };

    socket.on('alert', function(data) {
      alert(data);
    });

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
    };

    socket.on('notice log', function(data) {
      var tempGroup;

      data.forEach((group, i) => {
        tempGroup = group.groupName;
        group.chatLog.forEach((notice, i) => {
          formattedNotice = notice.from + "#*@" + tempGroup + "#*@" + notice.message + "#*@" + notice.date;
          displayNoticeAdmin(formattedNotice);
        });
      });


    });

    var displayNoticeAdmin = function(message){
      var div = document.createElement('div');
      div.innerHTML='<div class="direct-chat-msg right">\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-name pull-right">'   + message.split("#*@")[0] + '</span>\
                      <span class="direct-chat-timestamp pull-left">' + getDate(message.split("#*@")[3]) + '</span>\
                      </div>\
                      <div class="direct-chat-text">'
                      + message.split("#*@")[2] +
                      '</div>\
                      </div>';
      // console.log("notices-" + message.split("#*@")[1]);
      document.getElementById("notices-" + message.split("#*@")[1].trim()).appendChild(div);
    };

    $scope.changeGroup = function(rawGroup){
      var group = rawGroup.trim();
      document.getElementById("notices-" + $scope.noticeGroupSelected.trim()).style.display = "none";
      $scope.noticeGroupSelected = group;
      document.getElementById("notices-" + $scope.noticeGroupSelected).style.display = "block";
    };

    $scope.send_group_message = function(message){
      if (message == null) { return; } // Cheeky guard clause, stop null messages from being sent

      group = $scope.noticeGroupSelected;
      var formattedMessage = $scope.user + "#*@" + group + "#*@" + message + "#*@" + getDate();
      displayNoticeAdmin(formattedMessage);
      socket.emit('group message', formattedMessage);
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
    $scope.myGroups=[];
    $scope.noticeGroupSelected="global";
    var monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October","November", "December"];

    socket.emit('load self', $scope.handle);
    console.loog("emitted");

    socket.on('user data', function(data) {
      $scope.user = data.handle;
      if ($scope.user == null) {    // reject them if their handle is null
        console.log("kick me");
        $state.go('login');
      }
      $scope.primaryContact = data.primaryContact;
      $scope.myGroups = data.groups;
      $scope.myGroups.push(data.yearGroup);
      setMentorMentee(data.userType);
      initGroups();
      socket.emit('load notices', $scope.user)
    });

    var setMentorMentee = function(userType) {
      if (userType == "mentor") {
        $scope.mentor = $scope.user;
        $scope.mentee = $scope.primaryContact;
      } else {
        $scope.mentor = $scope.primaryContact;
        $scope.mentee = $scope.user;
      }

      socket.emit('load messages', $scope.user + "~%$" + $scope.mentor + "#*@" + $scope.mentee);
    };

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

    socket.on('group message clientside', function(data) {    // data[0] should be group, data[1] should be message
        // this is called group message clientside because I don't like name shadowing, that is all.
        if ( !$scope.groups.includes(data[0]) ) { return; };    // guard clause; check we are subbed to group
          displayNotice(data[0], data[1]);
        });

    var displayNotice = function(group, notice) {
      var div = document.createElement('div');
      div.innerHTML='<div class="direct-chat-msg right">\
                      <div class="direct-chat-info clearfix">\
                      <span class="direct-chat-name pull-right">'+ notice.from +'</span>\
                      <span class="direct-chat-timestamp pull-left">'+getDate(notice.date)+'</span>\
                      </div>\
                      <div class="direct-chat-text">'
                      + notice.message +
                      '</div>\
                      </div>';

      document.getElementById("notices-" + group.trim()).appendChild(div);
      document.getElementById("notices-" + group.trim()).scrollTop=document.getElementById("notices-" + group.trim()).scrollHeight;

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
        if ( $scope.mentor == null || $scope.mentee == null ) { // if primary contact not set, don't let them send a message
          alert("Sorry, you don't appear to be connected to a mentor / mentee yet. If you believe you are, please refresh the page.\
                If this problem persists, please contact an admin. ");    // This stops our database being clogged
        };
        var formattedMessage = $scope.user + "#*@" + $scope.mentor + "#*@" + $scope.mentee + "#*@" + message + "#*@" + getDate()
        displayMessage(formattedMessage);
        socket.emit('private message', formattedMessage);

        $scope.message=null;
    };

    socket.on('notice log', function(data) {
      var tempGroup;

      data.forEach((group, i) => {
        tempGroup = group.groupName;
        if (!$scope.myGroups.includes(tempGroup)) { return; }   /// guard clause - show only if we are in group

        group.chatLog.forEach((notice, i) => {
          displayNotice(tempGroup, notice);
        });
      });
    });

    $scope.changeGroup = function(rawGroup){
      var group = rawGroup.trim();
      document.getElementById("notices-" + $scope.noticeGroupSelected.trim()).style.display = "none";
      $scope.noticeGroupSelected = group;
      document.getElementById("notices-" + $scope.noticeGroupSelected).style.display = "block";
    };

    var initGroups = function(){
      $scope.myGroups.forEach((group, i) => {
        displayGroupButton(group);
        createGroupDiv(group);
      });
      document.getElementById("notices-global").style.display = "block";
    };

    var createGroupDiv = function(group) {
      var tempDiv = document.createElement('div');
      tempDiv.setAttribute("id", "notices-" + group);
      tempDiv.setAttribute("class", "noticeboard-hide");

      document.getElementById("noticeBoard").appendChild(tempDiv);
    };

    var displayGroupButton = function(group) {
      var tempDiv = document.createElement('div');
      tempDiv.innerHTML = '<button type="button" class="btn btn-primary btn-flat" ng-click="changeGroup(\' ' + group + ' \' )">\
                          ' + group + '</button>';

      var angularElement = angular.element(tempDiv);
      var linkFun = $compile(angularElement);
      var final = linkFun($scope);

      document.getElementById("noticeBoardTabs").appendChild(final[0]);
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
        'phone':'',
        'mentor_mentee':'',
        'primaryContact':'',
        'yearGroup':'',
        'groups':['global']
    };

    $scope.groupData={
      'course':'',
      'oxbridge':''
    };

    $scope.login_data={
        'handle':'',
        'password':''
    };

    $scope.Register = function(){
      var valid = true;
      if ($scope.user.name == ''){
        valid = false;
        document.getElementById("nameError").innerHTML = "Please enter your name";
        highlightElement(document.getElementById("name"));
      }
      if ($scope.user.handle == ''){
        valid = false;
        document.getElementById("handleError").innerHTML = "That handle is unavailable";
        highlightElement(document.getElementById("handle"));
      }
      if ($scope.user.mentor_mentee == ''){
        valid = false;
        document.getElementById("userTypeError").innerHTML = "Please select a user type";
        highlightElement(document.getElementById("mentor_mentee"));
      }
      if ($scope.user.mentor_mentee != 'mentor' && $scope.user.primaryContact == ''){
        valid = false;
        document.getElementById("primContError").innerHTML = "Please enter your mentor's handle";
        highlightElement(document.getElementById("primaryContact"));
      }
      if ($scope.user.password == ''){
        valid = false;
        document.getElementById("passwordError").innerHTML = "Please enter a password";
        highlightElement(document.getElementById("psw"));
      }
      if ($scope.user.yearGroup == ''){
        valid = false;
        document.getElementById("yearGroupError").innerHTML = "Please select your year group";
        highlightElement(document.getElementById("yearGroup"));
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
      if (!valid_group_data()){
        valid = false;
      }

      if (valid) { send_details(); }
    };

    var valid_group_data = function() {
      let localValid = true;
      if ($scope.user.mentor_mentee == 'mentor') {
        $scope.user.groups = ['global', 'mentors'];
        return localValid;
      } else{
        if ($scope.groupData.course == "") {
          localValid = false;
          document.getElementById("courseError").innerHTML = "Please select your course";
          highlightElement(document.getElementById("course"));
        }
        if (localValid) { $scope.user.groups = ['global', 'mentee', $scope.groupData.course]; }
        if ($scope.groupData.oxbridge == "") {
          localValid = false;
          document.getElementById("oxbridgeError").innerHTML = "Please select an answer";
          highlightElement(document.getElementById("course"));
        } else if ($scope.groupData.oxbridge == "yes"){
          $scope.user.groups.push("oxbridge");
        }
        return localValid
      }
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
      if ($scope.user.mentor_mentee == "mentor") { $scope.user.primaryContact = '';}

      $http({method: 'POST',url:'http://'+url+'/register', data:$scope.user})//, headers:config})
          .success(function (data) {                                            // This code deals with the potential responses
          if (data == "success"){                                               // from the server, and tells the user what's what.
            $('#myModalRegister').modal('hide');                                // See server controller for more.
            alert("You have now registered. Please proceed to log in");
          } else if (data == "User already found") {
            document.getElementById("handleError").innerHTML = "That handle is unavailable";
            highlightElement(document.getElementById("handle"));
          } else if (data == "mentor unavailable") {
            document.getElementById("primContError").innerHTML = "That mentor is unavailable. If the problem persists,\
                                                                  contact an admin";
            highlightElement(document.getElementById("primaryContact"));

          } else if (data == "email not recognised") {
            document.getElementById("emailError").innerHTML = "Sorry, you don't appear to be on our list of known emails.\
                                                               Please check that you have already registered with us as\
                                                               a mentor. If the problem persists, contact an admin."
            highlightElement(document.getElementById("email"));
          }
      })
          .error(function (data) {
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
