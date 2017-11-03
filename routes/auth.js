var express = require('express');
var router = express.Router();

module.exports = function(passport) {
    
    router.get('/success', function(req, res) {
       res.send({state: 'success', user: req.user ? req.user : null}); 
    });
    
    router.get('/failure', function(req, res) {
       res.send({state: 'failure', user: null, message: 'Invalid Username or Passowrd'}); 
    });
    
    router.post('/login', passport.authenticate('login', {
        successRedirect: '/auth/success',
        failureRedirect: '/auth/failure' 
    }));
                
    router.post('/register', passport.authenticate('register', {
        successRedirect: '/auth/success',
        failureRedirect: '/auth/failure' 
    }));
    
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    })
    
    return router;
}
