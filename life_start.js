var app = require('express').createServer(),
    jsdav = require('jsdav'),
    DavHandler = require('jsDAV/lib/DAV/handler').jsDAV_Handler,
    FsTree = require('jsDAV/lib/DAV/tree/filesystem').jsDAV_Tree_Filesystem,
    log4js = require('log4js');

var config = {
    "host": "localhost",
    "port": "4444",
    "srvOptions": {
      "node": "LivelyKernel/"
    },
    "logLevel": "debug"
  };

var logger = log4js.getLogger();
logger.setLevel(config.logLevel);

var proxy = require('./lib/proxy')(logger);

app.tree = new FsTree(config.srvOptions.node);

var fileHandler = function(req, res) {
  req.url = req.url.replace(/\?.*/, ''); // only the bare file name
  if (req.method == 'POST' || req.method == 'PUT') {
    req.on('end', function() {  
        new DavHandler(app, req, res);
      });
  } else {
    new DavHandler(app, req, res);
  }
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


// GO GO GO
app.listen(config.port);

//jsdav.createServer(config.srvOptions, config.port, config.host);
