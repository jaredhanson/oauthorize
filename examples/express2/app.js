/**
 * Module dependencies.
 */
var express = require('express')
  , passport = require('passport')
  , site = require('./site')
  , oauth = require('./oauth')
  , user = require('./user')
  
  
// Express configuration
  
var app = express.createServer();
app.set('view engine', 'ejs');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// Passport configuration

require('./auth');


app.get('/', site.index);

app.get('/dialog/authorize',
  oauth.userAuthorization,
  function(req, res){
    res.render('dialog', { transactionID: req.oauth.transactionID, client: req.oauth.client });
  });
  
app.post('/dialog/authorize/decision',
  function(req, res, next) {
    console.dir(req.session),
    console.dir(req.body),
    next()
  },
  oauth.userDecision);

app.post('/oauth/request_token',
  passport.authenticate('consumer', { session: false }),
  oauth.requestToken);
  
app.post('/oauth/access_token',
  passport.authenticate('consumer', { session: false }),
  oauth.accessToken);
  
app.get('/api/userinfo',
  passport.authenticate('token', { session: false }),
  user.info);


app.listen(3000);
