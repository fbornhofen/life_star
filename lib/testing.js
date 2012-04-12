module.exports = function(app, logger) {

  var results = {};  

  app.post('/test-result/:id', function(req, res) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    }); 
    req.on('end', function() {
      try {
        results[req.params.id] = JSON.parse(data);
        res.send('ok');
      } catch (e) {
        results[req.params.id] = {
          "testRunId": req.params.id,
          "state": "failed"};
        logger.error(e + ' (' + data +')');
        res.send('failed');
      }
    });
  });

  app.get('/test-result/:id', function(req, res) {
    res.send(JSON.stringify(results[req.params.id]));
  });

  app.get('/test-result', function(req, res) {
    res.send(JSON.stringify(results));
  });
}

