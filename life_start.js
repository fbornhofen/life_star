var jsdav = require('jsdav');
var config = {
    "host": "localhost",
    "port": "4444",
    "srvOptions": {
      "node": "."
    }
  };

jsdav.createServer(config.srvOptions, config.port, config.host);
