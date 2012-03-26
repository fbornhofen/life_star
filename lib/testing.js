module.exports = function(app, logger) {

  var results = {};  

  app.post('/test-result/:id', function(req, res) {
    var data = '';
    req.on('data', function(chunk) {
      data += chunk;
    }); 
    req.on('end', function() {
      results[req.params.id] = data;
      res.send('ok');
    });
  });

  app.get('/test-result/:id', function(req, res) {
    res.send(JSON.stringify(results[req.params.id]));
  });

  app.get('/test-result', function(req, res) {
    res.send(JSON.stringify(results));
  });
}

