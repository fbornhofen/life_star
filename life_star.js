/*global require, module*/
var http = require('http'),
    express = require('express'),
    DavHandler = require('jsDAV/lib/DAV/handler').jsDAV_Handler,
    FsTree = require('jsDAV/lib/DAV/tree/filesystem').jsDAV_Tree_Filesystem,
    log4js = require('log4js'),
    proxy = require('./lib/proxy'),
    testing = require('./lib/testing'),
    WorkspaceHandler = require('./lib/workspace').WorkspaceHandler;

module.exports = function serverSetup(host, port, fsNode, enableTesting, logLevel) {

  // configuration options

  var config = {
      "host": host || "localhost",
      "port": port || 9001,
      "srvOptions": {
        "node": fsNode || "../LivelyKernel/"
      },
      "logLevel": logLevel || "debug",
      "enableTesting": enableTesting
    };

  var app = express(),
      srv = http.createServer(app);

  // set up logger, proxy and testing routes

  var logger, proxyHandler;

  logger = log4js.getLogger();
  logger.setLevel(config.logLevel);

  proxyHandler = proxy(logger);

  if (config.enableTesting) {
    testing(app, logger);
  };

  // setup workspace handler
  var workspaceHandler = new WorkspaceHandler({}, config.srvOptions.node);

  // set up DAV

  srv.tree = new FsTree(config.srvOptions.node);
  srv.tmpDir = './tmp'; // httpPut writes tmp files
  srv.options = {};

  var fileHandler = function(req, res) {
    if (req.url.match(/\?\d+/)) {
      logger.info('replacing etag');
      req.url = req.url.replace(/\?.*/, ''); // only the bare file name
    }
    logger.info(req.method + ' ' + req.url);
    new DavHandler(srv, req, res);
  };

  // Proxy routes
  app.get(/\/proxy\/(.*)/, function(req, res) {
    proxy.get(req.params[0], req, res);
  });
  app.post(/\/proxy\/(.*)/, function(req, res) {
    proxy.post(req.params[0], req, res);
  });
  app.put(/\/proxy\/(.*)/, function(req, res) {
    proxy.put(req.params[0], req, res);
  });

  // workspace routes
  workspaceHandler.registerWith(app);

  // DAV routes
  app.get(/.*/, fileHandler);
  app.put(/.*/, fileHandler);
  app.post(/.*/, fileHandler);
  app['delete'](/.*/, fileHandler);
  app.propfind(/.*/, fileHandler);
  app.mkcol(/.*/, fileHandler);


  // GO GO GO
  srv.listen(config.port);

};
