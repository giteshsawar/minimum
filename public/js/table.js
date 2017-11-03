(function() {
    
    var app = angular.module('cardApp');
    app.controller('tableController', tableController);
    
    tableController.$inject = ['$scope', 'socket', 'deal'];
    function tableController($scope, socket, deal) {
          
        $scope.deck = [];
        $scope.deal = deal;
        $scope.tot_players = [];
        $scope.current_player = {};
        $scope.cardsToPlay = [];
        $scope.turn = false;
        $scope.show = false;
        $scope.points = [];
        $scope.cardsPlayed = [];
        $scope.cardsPlayedBy = "";
        var first = 0;
        
        var player_point = function(id, points) {
            
            return {
                id: id,
                points: points
            };
            
        };
        
        $scope.cards = function(num) {
            
            var cards = [];
            for(var i =0;i<num;i++) {
                cards.push(i);
            }
            return cards;
        };
        
        $scope.selectCard = function(val, index) {
            var cardsSelected = [];
            var selectedCards = [];
            if($scope.turn === false) {
                $scope.message = "Wait for your turn";
                return;
            }
            else {
                $scope.message = "Throw Card(s)";
            }
            for(var i in $scope.current_player.cards) {
                if($scope.current_player.cards[i].value === val) {
                    selectedCards.push($scope.current_player.cards[i]);
                }
            };
            
            cardarr((val-1), (val+1), index);
            
            function cardarr(svalue, lvalue, index) {
                
                var small = svalue;
                var large = lvalue;
                
                for(var i in $scope.current_player.cards) {
                    
                    if($scope.current_player.cards[i].value === svalue) {
                        cardsSelected.push($scope.current_player.cards[i]);
                        small = ($scope.current_player.cards[i].value-1);
                        break;
                    }
                    if($scope.current_player.cards[i].value === lvalue) {
                        cardsSelected.push($scope.current_player.cards[i]);
                        large = ($scope.current_player.cards[i].value+1);
                        break;
                    }  
                }
                if(small !== svalue || large !== lvalue) {
                    cardarr(small, large);
                }
            }
            
            if(cardsSelected.length !==0) {
                cardsSelected.push($scope.current_player.cards[index]);
            }
            
            $scope.cardsToPlay = [];
            $scope.cardsToPlay.push(cardsSelected);
            $scope.cardsToPlay.push(selectedCards);
        };    
        
        socket.on('startGame' , function(data) {
            
            var el = angular.element(document.querySelector('body'));
            el.css({'background-image': 'url(../img/casino-back.jpg)'});
            
            first = 0;
            $scope.cardsPlayed = [];
            $scope.cardsPlayedBy = "";
            $scope.message = "";
            $scope.cardsToPlay = [];
            
            $scope.deck = [];
            for(var i in data.deck) {
                $scope.deck.push(data.deck[i]);
            }
            
            $scope.current_player = data.player;
            var point = new player_point(data.player.id, data.player.points);
            
            $scope.tot_players = [];
            $scope.points = [];
            for(var i in data.tot_players) {
                if($scope.current_player.id !== data.tot_players[i].id)
                $scope.tot_players.push(data.tot_players[i]);
                
                var point = new player_point(data.tot_players[i].id, data.tot_players[i].points);
                $scope.points.push(point);
            }
        });
        
        socket.on('playTurn', function(data) {
            
            $scope.turn = true;
    
            if(first == 0) {
                $scope.show = false;
            }
            else {
                $scope.show = true;
            }
            $scope.message = data;
            
        });
        
        $scope.turnPlayed = function(index) {
            
            first = 1;
            $scope.cardsPlayed = [];
            $scope.cardsPlayed.push($scope.cardsToPlay[index]);
            $scope.cardsPlayedBy = "You";
            
            $scope.current_player.cards = $scope.current_player.cards.filter(function(x) { return $scope.cardsToPlay[index].indexOf(x) < 0 });
            $scope.current_player.cards.push($scope.deck[0]);
            $scope.deck.splice(0, 1);
            
            $scope.cardsToPlay[index] = angular.copy($scope.cardsToPlay[index]);
            
            if($scope.cardsToPlay[index].length === 1) {
                $scope.deck.push($scope.cardsToPlay[index]);
            }
            else {
                for(var i in $scope.cardsToPlay[index]) {
                    $scope.deck.push($scope.cardsToPlay[index][i]);
                }
            }
            
            $scope.cardsToPlay = [];
            $scope.turn = false;
            $scope.show = false;
            $scope.message = "";
            socket.emit("nextTurn", {player: $scope.current_player.id, deck: $scope.deck, cards: $scope.current_player.cards, cardsplayed: $scope.cardsPlayed});
        };
        
        socket.on("updatePlayer", function(data) {
           
            $scope.deck = [];
            for(var i in data.deck) {
                $scope.deck.push(data.deck[i]);
            }
            
            $scope.current_player = data.player;
        });
        
        socket.on("updateTable", function(data) {
           
            $scope.cardsPlayed = [];
            $scope.cardsPlayed.push(data.cardsplayed[0]);
            $scope.cardsPlayedBy = data.cardsplayedby;
            
            $scope.deck = [];
            for(var i in data.deck) {
                $scope.deck.push(data.deck[i]);
            }
            
            for(var i in $scope.tot_players) {
                
                if($scope.tot_players[i]['id'] === data.id) {
                    $scope.tot_players[i]['cards'] = data.cards;
                }    
            }
            
        });
      
        $scope.showCall = function() {
            
            socket.emit("showCalled");
        };
        
        socket.on("gameWon", function(data) {

            
            var i = $scope.points.findIndex(i => i.id === data.player.id);
            
            $scope.points[i].points = data.player.points;
               
            if($scope.current_player.id === data.id) {
                
                $scope.message = "You Win!!!";
                alert("You won this hand");
               
                deal.cardCollect();
                
                socket.emit("dealCards", {deck: deal.deck, winner: data.id});
            }
            else {
                $scope.message = data.id + " Won";
                alert(data.id + " Won this hand");
                $scope.turn = false;
                $scope.show = false;
            }
            
            
        });
        
        socket.on("gameLost", function(data) {
            
            for(var i in data.players) {
                
                for(var j in $scope.points) {
                    
                    if(data.players[i].id === $scope.points[j].id) {
                        $scope.points[j].points = data.players[i].points; 
                    }
                }
            }
            
            if($scope.current_player.id === data.id[0]) {
                    
                    deal.cardCollect();
                    
                    socket.emit("dealCards", {deck: deal.deck, winner: data.id[0]});
                }
            
            for(var i in data.id) {
                
                if($scope.current_player.id === data.id[i]) {
                    $scope.message = "You Win!!!";
                    alert("You won this hand");
                    
                    return;
                }
                else {
                    $scope.turn = false;
                    $scope.show = false;
                    var message = data.id.toString();
                    $scope.message = message + " Won";
                    alert(message + " Won this hand");
                }
            }
        });
        
        socket.on("gameEnd", function(data) {
           
            $scope.turn = false;
            $scope.show = false;
            for(var i in data.players) {
                
                for(var j in $scope.points) {
                    
                    if(data.players[i].id === $scope.points[j].id) {
                        $scope.points[j].points = data.players[i].points; 
                    }
                }
            }
            
            for(var i in data.id) {
                
                if($scope.current_player.id === data.id[i]) {
                    
                    $scope.message ="Congrats...You Win!!!"
                    alert("Congrats...You Win!!!");
                    return;
                }
                else {
                    var message = data.id.toString();
                    $scope.message = `${message} Won... Better luck next time!!!`;
                    alert(`${message} Won... Better luck next time!!!`);
                }
            }
        });
        
           
        socket.on("playerLeft", function(data) {
           
            var index = $scope.tot_players.findIndex(i => i.id === data.player),
                j = $scope.points.findIndex(j => j.id === data.player);
                
            $scope.tot_players.splice(index, 1);
                
            for(var i in data.cards) {
                $scope.deck.push(data.cards[i]);
            }
            
            $scope.points.splice(j, 1);
            $scope.message = data.player + " left the game";
            
            if($scope.tot_players.length < 1) {
               
                $scope.message = "";
                $scope.points = [];
                $scope.turn = false;
                $scope.show = false;
                socket.emit('lastPlayer', $scope.current_player);
                return;
            }
            
        });
        
        
        
        }
})();