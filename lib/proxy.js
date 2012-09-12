var request = require('request');

module.exports = function(logger) {

  var Proxy = {};

  // private -- helpers

  var createRequest = function(method, uri, body) {
    var reqObj = {
      method: method,
      uri: uri
    };
    if (body) {
      reqObj.body = body;
    }
    return reqObj;
  };

  var forwardResponse = function(clientResp, err, resp, body) {
    // FIXME possible corruption of binary data
    function copyHeader(name, from, to) {
      name = name.toLowerCase();
      if (from.headers[name]) { to.header(name, from.headers[name]); }
    }
    if (err) {
      var msg = 'error in proxy response: %s' + err;
      logger.error(msg);
      clientResp.send(msg);
      return;
    }
    try {
      copyHeader('Content-type', resp, clientResp);
      copyHeader('Content-length', resp, clientResp);
      clientResp.send(body);
    } catch (e) {
      var msg = 'proxying failed: %s' + e.stack;
      logger.error(msg);
      clientResp.send(msg);
    }
  };

  var collectBody = function(req, next) {
    var buffer = new Buffer(parseInt(req.header('Content-length')), 'binary');
    var offset = 0;
    req.on('data', function(chunk) {
      chunk.copy(buffer, offset);
      offset += chunk.length });
    req.on('end', function() {
      next(buffer); });
  };

  // public

  var get = Proxy.get = function(url, req, res) {
    request(createRequest('GET', url, null),
      function(err, resp, body) {
        forwardResponse(res, err, resp, body);
      });
  };

  var post = Proxy.post = function(url, req, res) {
    collectBody(req, function(completeBody) {
      req.body = completeBody;
      request(createRequest('POST', url, req.body),
        function(err, resp, body) {
          forwardResponse(res, err, resp, body);
        });
    });
  };

  var put = Proxy.put = function(url, req, res) {
    collectBody(req, function(completeBody) {
      req.body = completeBody;
      request(createRequest('PUT', url, req.body),
        function(err, resp, body) {
          forwardResponse(res, err, resp, body);
        });
    });
  };

  return Proxy;
}
