var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
var User = mongoose.model('user'); 

router.route('/users/:id')

    .put(function(req, res) {
    console.log("isddddddddddddddd");
        
        User.findById(req.parmas.id, function(err, user) {
           
            if(err) {
                res.send(err);
            }
            else {
                if(req.body.games_played) {
                    user.games_played += 1;
                }
                if(req.body.games_won) {
                    user.games_won +=1;
                    user.tot_points +=100;
                }
                
                user.save(function(err, user) {
                    
                    if(err) {
                        res.send(err);
                    }
                    res.json(user);
                });
            }
            
        });
    });

module.exports = router;