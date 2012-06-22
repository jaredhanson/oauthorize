/**
 * Module dependencies.
 */
var crypto = require('crypto');


/**
 * Percent-encodes `str` per RFC 3986.
 *
 * References:
 *  - [Percent Encoding](http://tools.ietf.org/html/rfc5849#section-3.6)
 *  - [Parameter Encoding](http://oauth.net/core/1.0a/#encoding_parameters)
 *  - [Parameter Encoding](http://oauth.net/core/1.0/#encoding_parameters)
 *
 * @param {String} str
 * @api private
 */
exports.encode = function(str) {
  return encodeURIComponent(str)
    .replace(/!/g,'%21')
    .replace(/'/g,'%27')
    .replace(/\(/g,'%28')
    .replace(/\)/g,'%29')
    .replace(/\*/g,'%2A');
}

/**
 * Merge object b with object a.
 *
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *     
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */
exports.merge = function(a, b){
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};

/**
 * Return a unique identifier with the given `len`.
 *
 *     utils.uid(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */
exports.uid = function(len) {
  return crypto.randomBytes(Math.ceil(len * 3 / 4))
    .toString('base64')
    .slice(0, len);
};
