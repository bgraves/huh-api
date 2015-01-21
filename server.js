var express = require('express');
var bodyParser = require('body-parser');
var multer = require('multer'); 
var uuid = require('node-uuid');
var fs = require('fs');
var app = express();
var MongoClient = require('mongodb').MongoClient;

var walksDirStr = '/usr/local/nginx/html/walks/';

// The API - JBG

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({
  dest: walksDirStr,
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now()
  }
}))

app.get('/', function(req, res) {
  res.send('huh-api');
});

app.post('/upload', function(req, res, next) {
  var obj = {};
  if(req.files.sound) {
    obj.sound = {};
    obj.sound.filename = req.files.sound.name;
  }
  if(req.files.image) {
    obj.image = {};
    obj.image.filename = req.files.image.name;
  }
  res.send(obj);
});

app.get('/delete', function(req, res, next) {
  var filename = walksDirStr + req.query.file;
  fs.unlink(filename, function (err) {
    if (err) {
      res.status(500).send({ status: 'error', message: 'file not deleted' });
    } else {
      res.send({});
    }
  });
});


app.get('/walks', function(req, res, next) {
  var collection = mongo.collection('walks');
  collection.find({}).toArray(function(err, docs) {
    if (err) {
      res.status(500).send({ status: 'error', message: 'could not retrieve walks' });
    } else {
      res.send(docs);
    }
  });
});

app.post('/walks', function(req, res, next) {
  insertWalk(req.body, function(err) {
    if(err) {
      res.status(500).send({ status: 'error', message: 'obj not saved' });
    }
    else res.send({});
  });
});

app.get('/walks/:id', function(req, res, next) {
  var title = req.params.id;
  getWalk(title, function(err, walk) {
    if(err) res.status(500).send({ status: 'error', message: err.message});
    else res.send(walk); 
  });
});

// MongoDB stuff - JBG
var url = 'mongodb://localhost:27017/huh';
var mongo;

MongoClient.connect(url, function(err, db) {
  mongo = db;
  app.listen(3000);
});


// Helper functions - JBG
var getWalk = function(title, callback) {
  var collection = mongo.collection('walks');
  collection.find({ title: title }).toArray(function(err, docs) {
    if(err) callback(err, null);
    else if(docs.length == 1) {
      callback(null, docs[0]);
    } else {
      callback(new Error('walk could not be retrieved'));
    }
  });
};

var insertWalk = function(walk, callback) {
  var collection = mongo.collection('walks');
  collection.remove({ title: walk.title }, function(err, result) {
    collection.insert(walk, function(err, result) {
      callback(err);
    });
  }); 
};

