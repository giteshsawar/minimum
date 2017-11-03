"use strict";

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');

module.exports = function(io) {

var socket_list = {}, 
    
    players_list = [], 
    
    Player = function(id) {
    
    return {
        id: id,
        points: 0,
        group: String,
        turn: false,
        cards: []
    };
    
}, Group = function(name) {
    
    return {
        name: name,
        deck: [],
        players: []
    }
    
}, Players_info = function(id, cards) {
     return {
         id: id,
         cards: cards,
         points: 0
     }
     
 }, groups = []
  , groups_random = []
  , groupsPlaying = [];

 io.on("connection", function(socket) {
    
     var deck = [],
     id = "guest_" + Math.floor(Math.random()*99999),
     player = new Player(id);
     socket_list[player.id] = socket;
     
     players_list.push(player);
     
     socket.on('redirect', function(data) {
         socket.emit('state', data);
     });
     
     socket.on('editPlayer', function(data) {
        
         delete socket_list[player.id];
         player.id = data;
         socket_list[player.id] = socket;
     });
     
     socket.on('createGroup', function() {
         
         let groupname = "group"+player.id,
         group = new Group(groupname);
         
         group.players.push(player);
         groups.push(group);
         
         socket.userid = player.id;
         socket.group = groupname;
         socket.join(groupname);
         socket.emit('create', player);
         return;
     });
     
     socket.on("joinGroup", function() {
         
         if(groups_random.length === 0) {
            
             let group_name = "group"+player.id,
                 group_random = new Group(group_name);
             
             group_random.players.push(player);
             groups_random.push(group_random);
             socket.userid = player.id;
             socket.group = group_name;
             socket.join(group_name);
             socket.emit('create', player);
             return;
         }
         else {
             for(let i=0, x = groups_random.length; i<x;i++) {
                 if(groups_random[i].players.length < 4) {
                     
                     socket.userid = player.id;
                     socket.group = groups_random[i].name;
                     groups_random[i].players.push(player);
                     socket.join(socket.group);
                     
                     socket.emit('updategroup', groups_random[i].players);
                     socket.broadcast.to(socket.group).emit('join', {id: socket.userid, players: groups_random[i].players});
                     return;
                 }
             }
             
             let group_name = "group"+player.id,
                 group_random = new Group(group_name);
             
             group_random.players.push(player);
             groups_random.push(group_random);
             socket.userid = player.id;
             socket.group = group_name;
             socket.join(group_name);
             socket.emit('create', player);
         }
     });
     
     socket.on('invite', function(data) {
         
         if(socket_list[data]) {
             socket_list[data].emit('invited', {user :socket.userid, group: socket.group});
             socket.emit('inviteRes', "Invitation Sent Successfully...Waiting For Response");
         }
         else {
             socket.emit('inviteRes', "User not found");
         }
     })
     
     socket.on('invitationAccepted', function(data) {
        
         let grp = groups.findIndex(grp => grp.name === data.group);
         
         if(grp >= 0 && groups[grp].players.length < 4) {
            
             socket.userid = player.id;
             socket.group = groups[grp].name;
             groups[grp].players.push(player);
             socket.join(socket.group);
             
             socket.emit('updategroup', groups[grp].players);
             socket_list[data.host].emit('accepted', data.guest);
             socket.broadcast.to(socket.group).emit('join', {id: socket.userid, players: groups[grp].players});
             return;
         }
         else {
             socket.emit('tooLate');
         }
     });
     
     socket.on('invitationDeclined', function(data) {
       
         socket_list[data.host].emit('declined', data.guest);
     });
     
     socket.on("startPlay", function() {
          
         let i = groups.findIndex(i => i.name === socket.group);
           
         if(i >= 0) { 
             groupsPlaying.push(groups[i]);
             groups.splice(i, 1);
             socket.emit("deal");
         }
         else {
             
             let j = groups_random.findIndex(j => j.name === socket.group);
             
             groupsPlaying.push(groups_random[j]);
             groups_random.splice(j, 1);
             socket.emit("deal");
         }
     });
     
     socket.on("dealCards", function(data) {
         
         let i = groupsPlaying.findIndex(i => i.name === socket.group);
                 
         groupsPlaying[i].deck = [];
         for(let j in data.deck) {
            groupsPlaying[i].deck.push(data.deck[j]);
         }

         for(let j in groupsPlaying[i].players) {

             groupsPlaying[i].players[j].cards = [];
         }

         let plylgth = groupsPlaying[i].players.length, j = 0, tot_players = [];
         while(j<7) {
             for(let k=0; k<plylgth; k++) {
                 groupsPlaying[i].players[k].cards.push(groupsPlaying[i].deck[0]);
                 groupsPlaying[i].deck.splice(0, 1);
             }
             j++
         }

         tot_players = [];
         for(let j in groupsPlaying[i].players) {

             let players = new Players_info(groupsPlaying[i].players[j].id, groupsPlaying[i].players[j].cards.length);
             players.points = groupsPlaying[i].players[j].points;
             tot_players.push(players);
         }

         for(let j in groupsPlaying[i].players) {
             
            socket_list[groupsPlaying[i].players[j].id].emit("startGame", {deck: groupsPlaying[i].deck, player: groupsPlaying[i].players[j], tot_players: tot_players});

             if(groupsPlaying[i].players[j].id === data.winner) {

                 groupsPlaying[i].players[j].turn = true;
                 socket_list[groupsPlaying[i].players[j].id].emit("playTurn", "Your Turn, Select Card");
             }

         }
             if(data.winner === "") {
                 
                 groupsPlaying[i].players[0].turn = true;
                 socket.emit('redirect', 'table');
                 socket.broadcast.to(socket.group).emit('redirect', 'table');
                 socket_list[groupsPlaying[i].players[0].id].emit("playTurn", "Your Turn, Select Card");
             }
     });
     
     socket.on("nextTurn", function(data) {
        
         let i = groupsPlaying.findIndex(i => i.name === socket.group),
         j = groupsPlaying[i].players.findIndex(j => j.id === socket.userid);
        
         groupsPlaying[i].deck = [];
         for(let k in data.deck) {
             groupsPlaying[i].deck.push(data.deck[k]);
         }
          
         groupsPlaying[i].players[j].cards = [];

         for(let k in data.cards) {
             groupsPlaying[i].players[j].cards.push(data.cards[k]);
         }
         socket_list[socket.userid].emit("updatePlayer", {deck: groupsPlaying[i].deck, player: groupsPlaying[i].players[j]});
         socket.broadcast.to(socket.group).emit("updateTable", {id: groupsPlaying[i].players[j].id, cards: groupsPlaying[i].players[j].cards.length, deck: groupsPlaying[i].deck, cardsplayed: data.cardsplayed, cardsplayedby: socket.userid});
         groupsPlaying[i].players[j].turn = false;

         if(j === (groupsPlaying[i].players.length-1)) {
             groupsPlaying[i].players[0].turn = true;
             socket_list[groupsPlaying[i].players[0].id].emit("playTurn", "Your Turn, Select Card");
         }
         else {
             let turn = (j+1);
             groupsPlaying[i].players[turn].turn = true;
             socket_list[groupsPlaying[i].players[turn].id].emit("playTurn", "Your Turn, Select Card");
         }
        
     });
     
     socket.on("showCalled", function() {
         
         let tablePoints = [], winner, winner_id = [], caller, final_winner = [],
         i = groupsPlaying.findIndex(i => i.name === socket.group);
                 
         for(let j in groupsPlaying[i].players) {

             let points = 0;
             groupsPlaying[i].players[j].turn = false;

             for(let k in groupsPlaying[i].players[j].cards) {

                 points += groupsPlaying[i].players[j].cards[k]['value'];
             }

             tablePoints.push(points);

             if(groupsPlaying[i].players[j].id === socket.userid) {

                    caller = j;
             }
         }

         for(let j in tablePoints) {

            if(tablePoints[j] === tablePoints[caller] || tablePoints[j] < tablePoints[caller]) {

                    if(j != caller) {
                        winner_id.push(groupsPlaying[i].players[j].id);
                        groupsPlaying[i].players[j].points += tablePoints[caller];
                    }
             }
         }
         
         if(winner_id.length === 0) {
             groupsPlaying[i].players[caller].points += tablePoints[caller];
         }
         
         for(let j in groupsPlaying[i].players) {
             
             if(groupsPlaying[i].players[j].points >= 100) {
                 
                 final_winner.push(groupsPlaying[i].players[j].id);
                 socket.broadcast.to(socket.group).emit("gameEnd", {id: final_winner, players: groupsPlaying[i].players});
                 socket.emit("gameEnd", {id: final_winner, players: groupsPlaying[i].players});
             }
         }

         if(final_winner.length === 0) {

             if(winner_id.length !== 0) {

                 socket.broadcast.to(socket.group).emit("gameLost", {id: winner_id, players: groupsPlaying[i].players});
                 socket.emit("gameLost", {id: winner_id, players: groupsPlaying[i].players});
             }
             else {
                 socket.emit("gameWon", {id: socket.userid, player: groupsPlaying[i].players[caller]});
                 socket.broadcast.to(socket.group).emit("gameWon", {id: socket.userid, player: groupsPlaying[i].players[caller]});
             }
         }

     });
     
     socket.on('leaveGroup', function() {
        
         let i = groups.findIndex(i => i.name === socket.group);
         
        if(i >= 0) {
         
            let j = groups[i].players.findIndex(j => j.id === socket.userid);

            groups[i].players.splice(j, 1);

            if(groups[i].players.length === 0) {
                groups.splice(i, 1);
            }
            else {
                socket.broadcast.to(socket.group).emit("playerLeft", socket.userid);
                 socket.broadcast.to(socket.group).emit('updategroup', groups[i].players);
            }
        }
         else {
             
             let j = groups_random.findIndex(j => j.name === socket.group);
             
             if(j >= 0) {
                 
                 let k = groups_random[j].players.findIndex(k => k.id === socket.userid);
                 
                 groups_random[j].players.splice(k, 1);
                 
                 if(groups_random[j].players.length === 0) {
                     groups_random.splice(j, 1);
                 }
                 else {
                     socket.broadcast.to(socket.group).emit("playerLeft", socket.userid);
                     socket.broadcast.to(socket.group).emit('updategroup', groups_random[j].players);
                 }
             }
         }
     });
     
     socket.on('leaveGame', function() {
        
        let g = groupsPlaying.findIndex(g => g.name === socket.group);
         
         if(g >= 0) {
                let p = groupsPlaying[g].players.findIndex(j => j.id === socket.userid);
                
                 groupsPlaying[g].players[p].points = 0;
                 let cards = [];
                 for(let k in groupsPlaying[g].players[p].cards) {
                     cards.push(groupsPlaying[g].players[p].cards[k]);
                 }

                 if(groupsPlaying[g].players[p].turn === true) {

                     if(p === (groupsPlaying[g].players.length-1)) {
                         socket_list[groupsPlaying[g].players[0].id].emit("playTurn", "Your Turn");
                     }
                     else {
                         let turn = p+1;
                         socket_list[groupsPlaying[g].players[turn].id].emit("playTurn", "Your Turn");
                     }
                 }

                 groupsPlaying[g].players.splice(p, 1);
             
                 socket.broadcast.to(socket.group).emit("playerLeft", {player: socket.userid, cards: cards});
             
                 if(groupsPlaying[g].players.length < 1) {
                     
                     groupsPlaying.splice(g, 1);
                 }
         } 
     });
     
     socket.on('lastPlayer', function(data) {
       
         let i = groupsPlaying.findIndex(i => i.name === socket.group);
        
         if(i >= 0) {
             groupsPlaying[i].players[0].turn = false;
             groupsPlaying[i].players[0].points = 0;
             groupsPlaying.splice(i, 1);
             socket.emit('redirect', '');
         }
         
     });
     
     socket.on('loggedOut', function() {
        
         delete socket_list[player.id];
         players_list.splice(players_list.indexOf(player), 1);
         
         deck = [];
         id = "guest_" + Math.floor(Math.random()*99999);
         player = new Player(id);
         socket_list[player.id] = socket;
     });
     
     socket.on("disconnect", function(data) {
         
        players_list.splice(players_list.indexOf(player), 1);
         
        let i = groups.findIndex(i => i.name === socket.group);
         
        if(i >= 0) {
         
            let j = groups[i].players.findIndex(j => j.id === socket.userid);

            groups[i].players.splice(j, 1);

            if(groups[i].players.length === 0) {
                groups.splice(i, 1);
            }
            else {
                socket.broadcast.to(socket.group).emit("playerLeft", socket.userid);
                 socket.broadcast.to(socket.group).emit('updategroup', groups[i].players);
            }
        }
         else {
             
             let j = groups_random.findIndex(j => j.name === socket.group);
             
             if(j >= 0) {
                 
                 let k = groups_random[j].players.findIndex(k => k.id === socket.userid);
                 
                 groups_random[j].players.splice(k, 1);
                 
                 if(groups_random[j].players.length === 0) {
                     groups_random.splice(j, 1);
                 }
                 else {
                     socket.broadcast.to(socket.group).emit("playerLeft", socket.userid);
                     socket.broadcast.to(socket.group).emit('updategroup', groups_random[j].players);
                 }
             }
         }
         
        let g = groupsPlaying.findIndex(g => g.name === socket.group);
         
         if(g >= 0) {
                let p = groupsPlaying[g].players.findIndex(j => j.id === socket.userid);

                 let cards = [];
                 for(let k in groupsPlaying[g].players[p].cards) {
                     cards.push(groupsPlaying[g].players[p].cards[k]);
                 }

                 if(groupsPlaying[g].players[p].turn === true) {

                     if(p === (groupsPlaying[g].players.length-1)) {
                         socket_list[groupsPlaying[g].players[0].id].emit("playTurn", "Your Turn");
                     }
                     else {
                         let turn = p+1;
                         socket_list[groupsPlaying[g].players[turn].id].emit("playTurn", "Your Turn");
                     }
                 }

                 groupsPlaying[g].players.splice(p, 1);
             
                 socket.broadcast.to(socket.group).emit("playerLeft", {player: socket.userid, cards: cards});
             
                 if(groupsPlaying[g].players.length < 1) {
                     
                     groupsPlaying.splice(g, 1);
                 }
         }
         
         delete socket_list[player.id];
         
     });
     
     
 });
}