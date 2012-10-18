/*global require, module*/
var express = require('express'),
    DavHandler = require('jsDAV/lib/DAV/handler').jsDAV_Handler,
    FsTree = require('jsDAV/lib/DAV/tree/filesystem').jsDAV_Tree_Filesystem,
    defaultPlugins = require("jsDAV/lib/DAV/server").DEFAULT_PLUGINS,
    log4js = require('log4js'),
    proxy = require('./lib/proxy'),
    testing = require('./lib/testing'),
    WorkspaceHandler = require('./lib/workspace').WorkspaceHandler,
    spawn = require('child_process').spawn;

module.exports = function serverSetup(config) {

  config.host                = config.host || "localhost";
  config.port                = config.port || 9001;
  config.srvOptions          = config.srvOptions || {node: config.fsNode || "../LivelyKernel/"};
  config.logLevel            = config.logLevel || "debug";
  config.enableTesting       = config.enableTesting;
  config.sslServerKey        = config.sslServerKey;
  config.sslServerCert       = config.sslServerCert;
  config.sslCACert           = config.sslCACert;
  config.enableSSL           = config.enableSSL && config.sslServerKey && config.sslServerCert && config.sslCACert;
  config.enableSSLClientAuth = config.enableSSL && config.enableSSLClientAuth;
  config.behindProxy         = config.behindProxy || false;

  var app = express(), srv;

  if (config.enableSSL) {
    var https = require('https'),
        fs = require('fs'),
        options = {
          // Specify the key and certificate file
          key: fs.readFileSync(config.sslServerKey),
          cert: fs.readFileSync(config.sslServerCert),
          // Specify the Certificate Authority certificate
          ca: fs.readFileSync(config.sslCACert),

          // This is where the magic happens in Node. All previous steps simply
          // setup SSL (except the CA). By requesting the client provide a
          // certificate, we are essentially authenticating the user.
          requestCert: config.enableSSLClientAuth,

          // If specified as "true", no unauthenticated traffic will make it to
          // the route specified.
          rejectUnauthorized: config.enableSSLClientAuth
        }
    srv = require('https').createServer(options, app);
  } else {
    srv = require('http').createServer(app);
  }

  // express specifically handles the case of sitting behind a proxy, see
  // http://expressjs.com/guide.html#proxies
  if (config.behindProxy) app.enable('trust proxy');

  app.use(express.bodyParser());
  app.use(express.cookieParser());

  // store auth information into a cookie
  app.use(express.cookieSession({
    key: 'livelykernel-sign-on',
    secret: 'foo',
    proxy: config.behindProxy,
    cookie: {path: '/', httpOnly: false, maxAge: null}
  }));

  if (config.behindProxy) {
    // the proxy server can set x-forwarded-* headers for client
    // authorization, extract those and assign to the session cookie

    function extractEmailFromCert(certSource, session, next) {
      if (!certSource) { return false };
      // fix the newlines in certSource
      certSource = '-----BEGIN CERTIFICATE-----\n'
                 + certSource
                   .replace('-----BEGIN CERTIFICATE----- ', '')
                   .replace('-----END CERTIFICATE----- ', '')
                   .replace(/ /g, '\n')
                 + '-----END CERTIFICATE-----\n';
      var openssl = spawn('openssl', ["x509", "-inform", "pem", "-email", "-noout"], {
        stdio: ['pipe', 'pipe', process.stderr]
      });

      var result = '';
      openssl.stdout.on('data', function(data) { result += data.toString(); })

      openssl.on('exit', function() {
        if (result.length > 0) session.email = result.replace(/\n/g, '');
        next();
      });

      // send the cert to openssl, decode it and query for the email
      openssl.stdin.write(certSource);
      openssl.stdin.end();

      return true;
    }

    function extractApacheClientCertHeadersIntoCookie(req, res, next) {
      var session = req.session;
      if (!session.user) {
        var user = req.get('x-forwarded-user');
        if (user) session.user = user;
      }
      if (!session.email) {
        var email = req.get('x-forwarded-email');
        if (email && email !== '(null)') session.email = email;
        if (extractEmailFromCert(req.get('ssl_client_cert'), session, next)) { return; }
      }
      next();
    }

    app.use(extractApacheClientCertHeadersIntoCookie);
  }

  // set up logger, proxy and testing routes
  var logger = log4js.getLogger();
  logger.setLevel(config.logLevel);

  // Proxy routes
  var proxyHandler = proxy(logger);
  function extractURLFromProxyRequest(req) {
    // example: /proxy/localhost:5984/test/_all_docs?limit=3
    //       => http://localhost:5984/test/_all_docs?limit=3
    return req.protocol + '://' + req.url.slice('/proxy/'.length);
  }

  app.all(/\/proxy\/(.*)/, function(req, res) {
    var url = extractURLFromProxyRequest(req);
    logger.info('Proxy %s %s', req.method, url);
    proxyHandler[req.method.toLowerCase()](url, req, res);
  });

  // test server
  if (config.enableTesting) { testing(app, logger); };

  // setup workspace handler / routes
  var workspaceHandler = new WorkspaceHandler({}, config.srvOptions.node);
  workspaceHandler.registerWith(app);

  // set up DAV
  srv.tree = new FsTree(config.srvOptions.node);
  srv.tmpDir = './tmp'; // httpPut writes tmp files
  srv.options = {};
  // for showing dir contents
  srv.plugins = {browser: defaultPlugins.browser};
  // https server has slightly different interface
  if (!srv.baseUri) srv.baseUri = '/';
  if (!srv.getBaseUri) srv.getBaseUri = function() { return this.baseUri };

  function fileHandler(req, res) {
    if (req.url.match(/\?\d+/)) {
      logger.info('replacing etag');
      req.url = req.url.replace(/\?.*/, ''); // only the bare file name
    }
    logger.info(req.method + ' ' + req.url);
    new DavHandler(srv, req, res);
  };

  // DAV routes
  app.all(/.*/, fileHandler);

  // GO GO GO
  srv.listen(config.port);
};
