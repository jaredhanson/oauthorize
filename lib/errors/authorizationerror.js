/**
 * `AuthorizationError` error.
 *
 * @api public
 */
function AuthorizationError(message, code, status) {
  if (!status) {
    switch (code) {
      case 'version_rejected': status = 400; break;
      case 'parameter_absent': status = 400; break;
      case 'parameter_rejected': status = 400; break;
      case 'timestamp_refused': status = 400; break;
      case 'nonce_used': status = 400; break;
      case 'signature_method_rejected': status = 400; break;
      case 'permission_denied': status = 403; break;
    }
  }
  
  Error.call(this);
  Error.captureStackTrace(this, arguments.callee);
  this.name = 'AuthorizationError';
  this.message = message || null;
  this.code = code || 'token_rejected';
  this.status = status || 401;
};

/**
 * Inherit from `Error`.
 */
AuthorizationError.prototype.__proto__ = Error.prototype;


/**
 * Expose `AuthorizationError`.
 */
module.exports = AuthorizationError;
