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

app.tree = new FsTree(config.srvOptions.node);

var fileHandler = function(req, resp) {
  req.url = req.url.replace(/\?.*/, ''); // only the bare file name
  new DavHandler(app, req, resp);
};


app.get(/.*/, fileHandler);

app.propfind(/.*/, fileHandler);

// FIXME add proxy route

app.listen(config.port);

//jsdav.createServer(config.srvOptions, config.port, config.host);
