(function() {
    
    var app = angular.module("cardApp");
    
    app.controller("indexController", ["$scope", "socket", "$rootScope", "$http", "$window", "$cookieStore", "invite", function($scope, socket, $rootScope, $http, $window, $cookieStore, invite) {
        
        $scope.state = '';
        $scope.message = "";
        $scope.showlog = false;
        $scope.log = true;
        $scope.invitationBox = false;
        $scope.invitations = [];
        $scope.invitename = [];
        var el = angular.element(document.querySelector('body'));
        
        socket.on('state', function(data) {
            
            $scope.state = data;
        });
        
        socket.on('redirect', function(data) {
            $scope.state = data;
            if(data === '') {
                el.css({'background-image': 'url(../img/cards-back.jpg)'});
            }
        });
        
        $scope.user = {username: '', password: ''};
        $scope.login = function() {
            
            $http.post('/auth/login', $scope.user).then(function(data) {
               
                $cookieStore.put('username', data.data.user.username);
                $cookieStore.put('authenticate', true);
                
                $rootScope.authenticated = $cookieStore.get('authenticate');
                $rootScope.username = $cookieStore.get('username');
                
                socket.emit("editPlayer", $rootScope.username);
                $scope.user = {username: '', password: ''};
                $scope.showlog = false;
            });
        };
        
        $scope.enter = function() {
            
            $scope.showlog = false;
            $scope.invitationBox = false;
            socket.emit('redirect', 'main');
            if($rootScope.authenticated === true) {
                
                socket.emit("editPlayer", $rootScope.username);
            }
            
        };
        
        $scope.register = function() {
            
            $http.post('/auth/register', $scope.user).then(function(data) {
               
                alert('You are Successfully Registered');
                $scope.user = {username: '', password: '', email: "", name: ""};
                $window.location.href = "/";
            });
        };
        
        $scope.fbLogin = function() {
            
            $http.get('/auth/facebook');
        }
        
        socket.on('invited', function(data) {
        
            $scope.invitations.push(data);
            $scope.invitename.push(data.user);
            $scope.invites = $scope.invitations.length;
        });
        
        if($rootScope.authenticated) {
            socket.emit("editPlayer", $rootScope.username);
        }
        
        $scope.acceptInvite = function(index) {
            
            $scope.invitationBox = false;
            socket.emit("invitationAccepted", {group: $scope.invitations[index].group, guest: $rootScope.username, host: $scope.invitename[index]});
            $scope.invitations.splice(index, 1);
            $scope.invitename.splice(index, 1);
            socket.emit('redirect', 'group');
            invite.invite = true;
        };
        
        $scope.declineInvite = function(index) {
            
            socket.emit("invitationDeclined", {host: $scope.invitename[index], guest: $rootScope.username});
            $scope.invitations.splice(index, 1);
            $scope.invitename.splice(index, 1);
        };
        
        socket.on('tooLate', function() {
            alert('Group does not exist anymore to join');
            socket.emit('redirect', '');
        });
        
        $scope.goBack = function() {
          
            el.css({'background-image': 'url(../img/cards-back.jpg)'});
            
            if($scope.state === 'main') {
                socket.emit('redirect', '');
            }
            else if($scope.state === 'group') {
                socket.emit('leaveGroup');
                socket.emit('redirect', 'main');
            }
            else if($scope.state === 'table') {
                
                let stat = confirm("Are you sure you want to leave the game");
                if(stat === true) {
                    socket.emit('leaveGame');
                    socket.emit('redirect', '');
                }
            }
        };
        
    }]);
    
    app.controller("mainController", ["$scope", "socket", "invite", function($scope, socket, invite) {
        
        $scope.createGroup = function() {
            
            $scope.message = "";
            socket.emit('redirect', 'group');
            socket.emit('createGroup');
            invite.invite = true;
        };
        
        $scope.joinGroup = function() {

            socket.emit('redirect', 'group');
            socket.emit('joinGroup');
            invite.invite = false;
        };
        
    }]);
    
})();