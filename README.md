# OAuthorize

OAuthorize is a service provider toolkit for Node.js.  It provides a suite of
middleware that, combined with application-specific route handlers, can be used
to assemble a server that implements the [OAuth](http://tools.ietf.org/html/rfc5849)
1.0 protocol.

## Installation

    $ npm install oauthorize

## Usage

While OAuth is a rather intricate protocol, at a high level there are three
classes of endpoints from an implementation perspective, based on how those
endpoints are authenticated.  OAuthorize middleware, protected by [Passport](http://passportjs.org/)
authentication strategies, is used to authenticate clients, obtain authorization
from users, and issue access tokens.

#### Create an OAuth Server

Call `createServer()` to create a new OAuth server.  This instance exposes
middleware that will be mounted in routes, as well as configuration options.

    var server = oauthorize.createServer();

#### Implement Token Endpoints

Clients (aka consumers) interact with token endpoints directly in order to
obtain tokens.  First, a client retrieves an unauthorized request token.

    app.post('/request_token',
      passport.authenticate('consumer', { session: false }),
      server.requestToken(function(client, callbackURL, done) {
        var token = utils.uid(8)
          , secret = utils.uid(32)

        var t = new RequestToken(token, secret, client.id, callbackURL);
        t.save(function(err) {
          if (err) { return done(err); }
          return done(null, token, secret);
        });
      }));

After a user has authorized this token, it can be exchanged for an access token.

    app.post('/access_token',
      passport.authenticate('consumer', { session: false }),
      server.accessToken(
        function(requestToken, verifier, info, done) {
          if (verifier != info.verifier) { return done(null, false); }
          return done(null, true);
        },
        function(client, requestToken, info, done) {
          if (!info.authorized) { return done(null, false); }
          if (client.id !== info.clientId) { return done(null, false); }

          var token = utils.uid(32)
            , secret = utils.uid(128)
          var t = new AccessToken(token, secret, info.userId, info.clientId);
          t.save(function(err) {
            if (err) { return done(err); }
            return done(null, token, secret);
          });
        }
      ));

#### Implement User Authorization Endpoints

In order to authorize the request token, the client will redirect the user to
the user authorization endpoint.

    app.get('/dialog/authorize',
      login.ensureLoggedIn(),
      server.userAuthorization(function(requestToken, done) {
        RequestToken.findOne(requestToken, function(err, token) {
          if (err) { return done(err); }
          Clients.findOne(token.clientId, function(err, client) {
            if (err) { return done(err); }
            return done(null, client, token.callbackUrl);
          });
        });
      }),
      function(req, res){
        res.render('dialog', { transactionID: req.oauth.transactionID,
                               client: req.oauth.client, user: req.user });
      });

The application is responsible for authenticating the user (in this case, using
[connect-ensure-login](https://github.com/jaredhanson/connect-ensure-login) middleware)
and obtaining their consent by rendering a form.

The user must choose to allow access, optionally limited to a narrower scope or
duration of access.  The form submission can be processed by user decision
middleware.

    app.post('/dialog/authorize/decision',
      login.ensureLoggedIn(),
      server.userDecision(function(requestToken, user, done) {
        RequestToken.findOne(requestToken, function(err, token) {
          if (err) { return done(err); }
          var verifier = utils.uid(8);
          token.authorized = true;
          token.userId = user.id;
          token.verifier = verifier;
          token.save(function(err) {
            if (err) { return done(err); }
            return done(null, verifier);
          });
        });
      }));

Once authorized, the client can exchange the request token for an access token
the token endpoint described above.

#### Implement API Endpoints

Once an access token has been issued, a client will use it to make API requests
on behalf of the user.

    app.get('/api/userinfo', 
      passport.authenticate('token', { session: false }),
      function(req, res) {
        res.json(req.user);
      });

#### Session Serialization

Obtaining the user's authorization involves multiple request/response pairs.
During this time, an OAuth transaction will be serialized to the session.
Client serialization functions are registered to customize this process, which
will typically be as simple as serializing the client ID, and finding the client
by ID when deserializing.

    server.serializeClient(function(client, done) {
      return done(null, client.id);
    });

    server.deserializeClient(function(id, done) {
      Clients.findOne(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
      });
    });

## Examples

This [example](https://github.com/jaredhanson/oauthorize/tree/master/examples/express2) demonstrates
how to implement an OAuth service provider, complete with protected API access.

## Tests

    $ npm install --dev
    $ make test

[![Build Status](https://secure.travis-ci.org/jaredhanson/oauthorize.png)](http://travis-ci.org/jaredhanson/oauthorize)

## Credits

  - [Jared Hanson](http://github.com/jaredhanson)

## License

(The MIT License)

Copyright (c) 2012 Jared Hanson

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
