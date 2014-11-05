var mongoose = require('mongoose');
var express = require('express');
var app = express();

// Set public directory
app.use(express.static(__dirname + '/public'));

// Connect to mongoDB database
mongoose.createConnection('mongodb://localhost/turkapp-db');

// data models
var models = require('./models');

//helper functions

//HTTP functions
 
var bodyParser = require('body-parser')
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
})); 

var tripConstraintsHelper = function(constraints) {
  var query = models.Trip.find({});
  for (var key in constraints) {
    match = key.match(/(.*)_(.*)/);
    if (match) {
      if (match[2] == '$lt') {
        query.where(match[1]);
        query.lt(constraints[key]);
      } else if (match[2] == '$gt'){
        query.where(match[1]);
        query.gt(constraints[key])
      }
    } else if (key == 'sort') {
      query.sort(constraints[key]);
    }
    else {
      query.where(key).equals(constraints[key]);
    }
  }
  return query;
} 

app.get('/api/trips', function (req, res) {
  var query = req.query;
  query = tripConstraintsHelper(query);
  query.exec(function(err, trips) {
    if (err)
      res.send(err);
    res.json(trips);
  });
});

app.get('/api/state', function (req, res) {
  req.query.finished = false;
  models.State.random(req.query, function(err, state) {
    if (err)
      res.send(err);
    res.json(state);
  });
});

app.get('/api/detstate', function (req, res) {
  req.query.finished = false;
  models.State.findOne(req.query, {}, { sort : {'createdAt' : -1}}, function(err, state) {
    if (err)
      res.send(err);
    res.json(state);
  });
});

app.get('/api/wizard/goal', function (req, res) {
  models.Goal.findOne(function(err, goal) {
    if (err)
      res.send(err);
    res.json(goal);
  });
});

app.post('/api/state', function(req, res) {
  newState = req.body;
  newState._id = new mongoose.Types.ObjectId();
  newState = new models.State(newState);
  newState.save(function(err) {
    if (err)
      res.send(err);
  });
});


// all other routes -> go to angular
app.get('*', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

// run server!
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening @ http://%s:%s', host, port);
});
