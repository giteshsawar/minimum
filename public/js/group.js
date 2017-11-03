(function() {
    
    var app = angular.module("cardApp");
    
    app.controller("groupController", ["$scope", "socket", "deal", "invite", function($scope, socket, deal, invite) {
        
        $scope.players = [];
        $scope.deal = deal;
        $scope.inviteBox = false;
        $scope.message = "";
        
        $scope.sendInvite = function() {
            
            socket.emit('invite', $scope.user.id);
        }
        
        socket.on('inviteRes', function(data) {
           
            $scope.notify = data;
        });
        
        socket.on('declined', function(data) {
           
            if(data) {
                $scope.notify = data + " has declined your invitation";
            }
        });
        
        socket.on('accepted', function(data) {
            
            if(data) {
                $scope.notify = data + " has accepted your invitation";
            }
        });
        
        socket.on('create', function(data) {
           
            $scope.message = "";
            
            $scope.players = [];
            $scope.players.push(data);
            $scope.invite = invite.invite;
        });
        
        socket.on('join', function(data) {
           
            $scope.message = data.id + " joined the group";
            $scope.players = [];
            $scope.invite = invite.invite;
            
            for(var i=0, x = data.players.length; i<x; i++) {
                $scope.players.push(data.players[i]);
            }
        });
        
        socket.on('updategroup', function(data) {
           
            $scope.message = "";
            $scope.players = [];
            $scope.invite = invite.invite;
            
            for(var i=0, x = data.length; i<x; i++) {
                $scope.players.push(data[i]);
            }
        });
        
        socket.on("playerLeft", function(data) {
           
            $scope.message = data + " left the group";
        });
        
        $scope.startGame = function() {
          
            if($scope.players.length <= 1) {
                $scope.message = "Wait for other players to join";
                return;
            }
            
            socket.emit('startPlay');
        };
        
        socket.on('deal', function() {
            
            $scope.games_played = 1;
            
            deal.cardCollect();
            var winner = "";
            
            socket.emit('dealCards', {deck: deal.deck, winner: winner});
            
        });
        
    }]);
    
})();




