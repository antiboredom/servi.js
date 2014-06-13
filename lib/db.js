function serviDB(db) {
  this.db = db;
}

//wrap basic mongo/nedb functions
serviDB.prototype.insert = function() {
  return this.db.insert.apply(arguments);
};

serviDB.prototype.find = function() {
  return this.db.insert.find(arguments);
};

serviDB.prototype.findOne = function() {
  return this.db.insert.findOne(arguments);
};

serviDB.prototype.count = function() {
  return this.db.insert.count(arguments);
};

serviDB.prototype.update = function() {
  return this.db.insert.update(arguments);
};

serviDB.prototype.remove = function() {
  return this.db.insert.remove(arguments);
};

serviDB.prototype.ensureIndex = function() {
  return this.db.insert.ensureIndex(arguments);
};

serviDB.prototype.removeIndex = function() {
  return this.db.insert.removeIndex(arguments);
};

//convenience functions
serviDB.prototype.get = function(id, cb) {
  if (typeof cb === 'function') {
    this.findOne({_id: id}, function(err, doc){
      cb(doc);
    });
  } else {
    return this.findOne({_id: id});
  }
};

serviDB.prototype.getAll = function(cb) {
  if (typeof cb === 'function') {
    this.find({}, function(err, docs){
      cb(docs);
    });
  } else {
    return this.find({});
  }
};

serviDB.prototype.search = function(key, val, cb) {
  var params = {};
  params[key] = val;
  if (typeof cb === 'function') {
    this.find(params, function(err, docs){
      cb(docs);
    });
  } else {
    return this.find(params);
  }
};

serviDB.prototype.add = function(doc) {
  this.insert(doc);
};

serviDB.prototype.delete = function(id) {
  this.remove({_id: id});
};

serviDB.prototype.change = function(id, fields) {
  this.update({_id: id}, {$set: fields});
};

exports.db = serviDB;
