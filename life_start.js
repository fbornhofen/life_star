var app = require('express').createServer(),
    jsdav = require('jsdav'),
    DavHandler = require('jsDAV/lib/DAV/handler').jsDAV_Handler,
    FsTree = require('jsDAV/lib/DAV/tree/filesystem').jsDAV_Tree_Filesystem;

var config = {
    "host": "localhost",
    "port": "4444",
    "srvOptions": {
      "node": "LivelyKernel/"
    }
  };

var tree = new FsTree(config.srvOptions.node);
app.tree = tree;

var fileHandler = function(req, resp) {
  new DavHandler(app, req, resp);
};

app.get(/.*/, fileHandler);

// FIXME add proxy route

app.listen(config.port);

//jsdav.createServer(config.srvOptions, config.port, config.host);
