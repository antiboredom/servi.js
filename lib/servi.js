'use strict'

var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    router = require('./router'),
    net = require('net'),
    nodestatic = require('node-static'),
    Path = require('path'),
    Handlebars = require('handlebars'),
    ejs = require('ejs'),
    pathToRegexp = require('path-to-regexp'),
    Datastore = require('nedb'),
    serviDB = require('./db');

var constants = {
  HTML:   'text/html',
  PLAIN:  'text/plain',
  POST:   'POST',
  GET:    'GET',
  DELETE: 'DELETE',
  PUT:    'PUT'
}

function Servi(isGlobal) {
  this._port = 3000;
  this.handle = {};
  this.constants = constants;
  this._scriptPath = global._scriptPath = module.parent.filename;
  this._templateEngine = "ejs";
  this.isGlobal = typeof isGlobal === 'boolean' ? true : false;

  if (this.isGlobal) {
    for (var method in Servi.prototype){
      global[method] = Servi.prototype[method].bind(this);
    }

    for (var constant in constants) {
      if (constants.hasOwnProperty(constant)) {
        global[constant] = constants[constant];
      }
    }
  }
}

Servi.prototype.port = function(p) {
  if (typeof p === 'number') {
    var oldPort = this._port;
    this._port = p;
    if (oldPort != this._port && this.server && this.server.address() != null) {
      try {
        this.server.close();
      } catch(e) {
        console.log(e);
      }
      this.listen(this._port);
      console.log('Server has started on port ' + this._port);
    }
  }
  return this._port;
};

Servi.prototype.start = function() {
  var that = this;

  this.server = http.createServer(onRequest);

  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    //console.log('Request for ' + pathname + ' received.');
    router.route(that, pathname, response, request);
  }

  this.listen(this._port);
  console.log('Server has started on port ' + this._port);
};

Servi.prototype.listen = function(port) {
  getPort(port, function(p) {
    this.server.listen(p);
    this._port = p;
  }.bind(this));
}

Servi.prototype.reset = function() {
  this.handle = {};
}

Servi.prototype.templateEngine = function(engine) {
  if (typeof engine === 'string') {
    this._templateEngine = engine;
  }
  return this._templateEngine;
}

Servi.prototype.scriptPath = function(path) {
  if (typeof path === 'string') {
    this._scriptPath = global._scriptPath = path;
  }
  return this._scriptPath;
}

Servi.prototype.end = function() {
  if (this.server) {
    this.server.close();
  }
}

Servi.prototype.route = function(path, func) {
  if (typeof this.handle === 'undefined') {
    this.handle = {};
  }

  if (typeof path === 'string' && typeof func === 'function') {
    var keys = [];
    var map = {
      fn: func,
      keys: keys,
      exp: pathToRegexp(path, keys)
    };
    this.handle[path] = map;
  }
};

Servi.prototype.defaultRoute = function(func) {
  this.route('___default___', func);
};

Servi.prototype.hasDefaultRoute = function() {
  return typeof this.handle === 'object' && typeof this.handle['___default___'] === 'object';
}

Servi.prototype.respond = function(str, server) {
  server.response.writeHead(200,  {'Content-Type': server.response.headerType});
  server.response.end(str + '\n');
};

Servi.prototype.loadFile = function(path) {
  //make this asynch
  path = Path.join(Path.dirname(this._scriptPath), path);
  return fs.readFileSync(path).toString();
};

Servi.prototype.moveFile = function(from, to, errorCB) {
  if (typeof errorCB === 'function') {
    fs.rename(from, to, errorCB);
  } else {
    fs.rename(from, to);
  }
};

Servi.prototype.uploadFile = function(file, destinationFolder) {
  var destination = Path.join(Path.dirname(this._scriptPath), destinationFolder, file.name);
  this.moveFile(file.path, destination, function(err){
    console.log(err);
  });
};

Servi.prototype.renderTemplate = function(templateString, data) {
  if (this._templateEngine === 'ejs') {
    return ejs.render(templateString, data);
  } else if (this._templateEngine === 'handlebars') {
    var template = Handlebars.compile(templateString);
    return template(data);
  }
};

Servi.prototype.template = function(templatePath, data) {
  return this.renderTemplate(this.loadFile(templatePath), data);
};

Servi.prototype.helper = function(name, func) {
  Handlebars.registerHelper(name, func);
};

Servi.prototype.partial = function(name, template) {
  Handlebars.registerPartial(name, template);
};

Servi.prototype.inspect = function(object) {
  return "<pre>" + JSON.stringify(object, null, 2) + "</pre>";
};

Servi.prototype.serveFiles = function(path) {
  path = Path.join(Path.dirname(this._scriptPath), path);
  this.staticServer = new nodestatic.Server(path);
};

Servi.prototype.useDatabase = function(dbName) {
  if (typeof dbName === 'undefined') {
    dbName = 'database';
  }
  var pathToDB = Path.join(Path.dirname(this._scriptPath), dbName + '.db');
  var db = new Datastore({ filename: pathToDB, autoload: true});
  return new serviDB.db(db);
  //if (this.isGlobal) {
    //global.database = this.database;
  //}
}

Servi.prototype.log = function(msg) {
  console.log(msg);
};

function getPort (port, cb) {
  var server = net.createServer();
  server.listen(port, function (err) {
    server.once('close', function () {
      cb(port);
    });
    server.close();
  });
  server.on('error', function (err) {
    getPort(port + 1, cb)
  });
}

module.exports = Servi

