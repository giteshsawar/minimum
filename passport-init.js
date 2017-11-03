var bCrypt = require('bcrypt-nodejs');
var localStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('user');

module.exports = function(passport) {
    
    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
	passport.serializeUser(function(user, done) {
		done(null, user._id);
	});

	passport.deserializeUser(function(id, done) {
		User.findById(id, function(err, user) {
			done(err, user);
		});
	});
    
    passport.use('register', new localStrategy({
        passReqToCallback: true
    }, function(req, username, password, done) {
        
        User.findOne({'username': username}, function(err, user) {
            
            if(err) {
                console.log("Error in signup: " + err);
                return done(err);
            } 
            if(user) {
                console.log("Username already exist");
                return done(null, false);
            }
            else {
                
                var player = new User;
                    player.name = req.body.name;
                    player.username = username;
                    player.email = req.body.email;
                    player.password = createHash(password);
                    player.games_played = 0;
                    player.games_won = 0;
                    player.tot_points = 0;
                
                player.save(function(err) {
                    
                    if(err) {
                        console.log("Error in saving users");
                        return done(err);
                    }
                    else {
                        console.log(player.email + "registeration successfull");
                        return done(null, player);
                    }
                });
            }
            
        }); 
        
    }));
    
    passport.use('login', new localStrategy({
        passReqToCallback : true
    }, 
        function(req, username, password, done) {
        
        User.findOne({'username': username}, function(err, user) {
            
            if(err) {
                console.log("Error Logging In");
                return done(err);
            }
            if(!user) {
                return done("User not found", false);
            }
            if(!isValidPassword(user, password)) {
                return done("Wrong Username or Password", false);
            }
            return done(null, user);
            
        });
    }));
    
    var isValidPassword = function(user, password) {
        return bCrypt.compareSync(password, user.password);
    }
    
    var createHash = function(password){
		return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
    };
    
};