(function() {
    
    var app = angular.module("cardApp");
    
        app.factory('socket', function ($rootScope) {
          var socket = io.connect();
            return {
                on: function (eventName, callback) {
                    socket.on(eventName, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            callback.apply(socket, args);
                        });
                    });
                },
                emit: function (eventName, data, callback) {
                    socket.emit(eventName, data, function () {
                        var args = arguments;
                        $rootScope.$apply(function () {
                            if (callback) {
                                callback.apply(socket, args);
                            }
                        });
                    })
                },
              removeAllListeners: function (eventName, callback) {
                  socket.removeAllListeners(eventName, function() {
                      var args = arguments;
                      $rootScope.$apply(function () {
                        callback.apply(socket, args);
                      });
                  }); 
              }
            };
        });
    
    app.factory('deal', function() {
       
        var cardType = ["Hearts", "Spades", "Diamonds", "Clubs"];
        var cardNum = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
        
        var dataObj = {
            deck: [],
            cardCollect: cardCollect,
            shuffleDeck: shuffleDeck
            
        }
        return dataObj;
        
        function cardCollect() {
            
            dataObj.deck = [];
            for(i=0; i<4; i++) {
                
                for(j=0; j<13; j++) {
                    
                    var type = cardType[i];
                    var value = cardNum[j];
                    
                    fillDeck(value, type);
                }
            }
            shuffleDeck();
        }
        
        function fillDeck(value, type) {
            
            if(type == 'Hearts') {
                if(value == 11) {
                    img = "img/face-cards/jack-hearts.png";
                    digit = 'J';
                }
                else if(value == 12) {
                    img = "img/face-cards/queen-hearts.png";
                    digit = 'Q';
                }
                else if(value == 13) {
                    img = "img/face-cards/king-hearts.png";
                    digit = 'K';
                }
                else {
                    img = "img/heart.png";
                    digit = value;
                }
            }
            
            if(type == 'Spades') {
                if(value == 11) {
                    img = "img/face-cards/jack-spades.png";
                    digit = 'J';
                }
                else if(value == 12) {
                    img = "img/face-cards/queen-spades.png";
                    digit = 'Q';
                }
                else if(value == 13) {
                    img = "img/face-cards/king-spades.jpg";
                    digit = 'K';
                }
                else {
                    img = "img/spade.png";
                    digit = value;
                }
            }
            
            if(type == 'Diamonds') {
                if(value == 11) {
                    img = "img/face-cards/jack-diamond.png";
                    digit = 'J';
                }
                else if(value == 12) {
                    img = "img/face-cards/queen-diamond.png";
                    digit = 'Q';
                }
                else if(value == 13) {
                    img = "img/face-cards/king-diamond.jpg";
                    digit = 'K';
                }
                else {
                    img = "img/diamond.png";
                    digit = value;
                }
            }
            
            if(type == 'Clubs') {
                if(value == 11) {
                    img = "img/face-cards/jack-club.png";
                    digit = 'J';
                }
                else if(value == 12) {
                    img = "img/face-cards/queen-club.png";
                    digit = 'Q';
                }
                else if(value == 13) {
                    img = "img/face-cards/king-club.png";
                    digit = 'K';
                }
                else {
                    img = "img/club.png";
                    digit = value;
                }
            }
            
            var card = {
                value: value,
                type: type,
                digit: digit,
                img: img
            }
            
            dataObj.deck.push(card);
            
        };
        
        function shuffleDeck() {
        
            var i = dataObj.deck.length, j, temp;
            while(--i > 0) {
                
                j = Math.floor(Math.random() * (i+1));
                temp = dataObj.deck[j];
                dataObj.deck[j] = dataObj.deck[i];
                dataObj.deck[i] = temp;
            }
        };
        
        
    });
    
    app.factory('updateUser', function($resource) {
       
        return $resource('/api/users/:id');
    });
    
    app.factory('invite', function() {
       
        var self = {
            invite: false
        }
        return self;
    });
    
})();