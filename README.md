# OAuthorize

OAuthorize is a service provider toolkit for Node.js.  It provides a suite of
middleware that, combined with application-specific route handlers, can be used
to assemble a server that implements the [OAuth](http://tools.ietf.org/html/rfc5849)
1.0 protocol.

## Usage

While OAuth is a rather intricate protocol, at a high level there are three
classes of endpoints from an implementation perspective, based on how those
endpoints are authenticated.

#### Implement Token Endpoints

Clients (aka consumers) interact with token endpoints directly in order to
obtain tokens.  First, a client retrieves an unauthorized request token.

    app.post('/request_token',
      passport.authenticate('consumer', { session: false }),
      oauth.requestToken(function(client, callbackURL, done) {
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
      oauth.accessToken(
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
