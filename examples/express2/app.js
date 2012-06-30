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
app.use(function(req, res, next) {
  console.log('-- session --');
  console.dir(req.session);
  console.log('-------------');
  next()
});
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));

// Passport configuration

require('./auth');


app.get('/', site.index);
app.get('/login', site.loginForm);
app.post('/login', site.login);
app.get('/logout', site.logout);
app.get('/account', site.account);

app.get('/dialog/authorize', oauth.userAuthorization);
app.post('/dialog/authorize/decision', oauth.userDecision);

app.post('/oauth/request_token', oauth.requestToken);
app.post('/oauth/access_token', oauth.accessToken);
  
app.get('/api/userinfo', user.info);


app.listen(3000);
