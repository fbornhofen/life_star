var app = require('express').createServer(),
    DavHandler = require('jsDAV/lib/DAV/handler').jsDAV_Handler,
    FsTree = require('jsDAV/lib/DAV/tree/filesystem').jsDAV_Tree_Filesystem,
    log4js = require('log4js');

// configuration options

var config = {
    "host": "localhost",
    "port": 9001,
    "srvOptions": {
      "node": "../LivelyKernel/"
    },
    "logLevel": "debug",
    "enableTesting": true 
  };

// set up logger, proxy and testing routes

var logger, 
    proxy, 
    testing; 

logger = log4js.getLogger();
logger.setLevel(config.logLevel);

proxy = require('./lib/proxy')(logger);

if (config.enableTesting) {
  testing = require('./lib/testing')(app, logger);
};

// set up DAV

app.tree = new FsTree(config.srvOptions.node);
app.tmpDir = './tmp'; // httpPut writes tmp files

var fileHandler = function(req, res) {
  if (req.url.match(/\?\d+/)) {
    logger.info('replacing etag');
    req.url = req.url.replace(/\?.*/, ''); // only the bare file name
  }
  logger.info(req.method + ' ' + req.url);
  new DavHandler(app, req, res);
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

// DAV routes
app.get(/.*/, fileHandler);
app.put(/.*/, fileHandler);
app.post(/.*/, fileHandler);
app.delete(/.*/, fileHandler);
app.propfind(/.*/, fileHandler);
app.mkcol(/.*/, fileHandler);


// GO GO GO
app.listen(config.port);

