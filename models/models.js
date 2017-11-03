var mongoose = require('mongoose');

var userSchema = new mongoose.Schema({
    
    name: String,
    username: String,
    email: String,
    password: String,
    games_played: Number,
    games_won: Number,
    tot_points: Number
});

var fbuserSchema = new mongoose.Schema({
   
    id: String,
    token: String,
    name: String,
    username: String,
    email: String,
    games_played: Number,
    games_won: Number,
    tot_points: Number
    
});

mongoose.model('user', userSchema);
mongoose.model('fbuser', fbuserSchema)