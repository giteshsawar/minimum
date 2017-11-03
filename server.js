var express = require('express')
    ,app = express()
    ,path = require('path')
    ,cookieParser = require('cookie-parser')
    ,bodyParser = require('body-parser')
    ,logger = require('morgan')
    ,session = require('express-session')
    ,mongoStore = require('connect-mongo')(session)
    ,passport = require('passport')
    ,mongoose = require('mongoose')
    ,http = require('http').Server(app)
    ,io = require('socket.io')(http)
    ,cors = require('cors');

app.use(cors());

mongoose.connect('mongodb://localhost/cardApp');
require('./models/models.js');
var db = mongoose.connection;

var socket = require('./routes/control')(io);
var auth = require('./routes/auth')(passport);
var api = require('./routes/api');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(session({
    secret: 'secretKey',
    saveUninitialized: true,
    cookie: { maxAge: 8*60*60*1000 },
    resave: true,
    store: new mongoStore({ url: 'mongodb://localhost/cardApp'})
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());
app.use(passport.session());

var initPassport = require('./passport-init');
initPassport(passport);

app.use('/auth', auth);
app.use('/api', api);

var port = process.env.PORT || 3000;
http.listen(port, function() {
    
    console.log("We are connected");
});