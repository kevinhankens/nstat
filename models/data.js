var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/kh');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var Blog = new Schema({
  user: ObjectId,
  title: String,
  body: String,
  url: String,
  created: String,
  modified: String,
});

mongoose.model('Blog', Blog);

var BlogData = {
  model: mongoose.model('Blog'),
  loadOne: function(req, res, next) {
    BlogData.model.findOne({_id: req.params.id}, function(err, docs) {
      if (!docs) {
        req.flash('error', 'Post not found.');
        res.redirect('/error/404');
      } 
      else {
        req.blog = docs;
        next(); 
      }
    });
  },
  loadAll: function(req, res, next) {
    if (typeof req.query.page == 'undefined') {
      req.query.page = 1;
    }
    record_skip = (req.query.page - 1) * 10;
    BlogData.model.find({}, [], {sort: [['created', -1]], skip: record_skip, limit: 10}, function(err, docs) {
      if (!docs) {
        req.flash('error', 'No posts found.');
        docs = {};
      }
      req.blogs = docs;
      next();
    });
  },
  count: function(req, res, next) {
    BlogData.model.find().count(function(err, count) {
      if (err) {
        var count = 0;
      }
      req.blog_count = count;
      next();
    });
  },
  aliasLookup: function(req, res, next) {
    BlogData.model.findOne({url: req.url}, function(err, docs) {
console.log(docs);
      if (!docs) {
        req.flash('error', 'Page Not Found');
        res.redirect('/error/404');
      }
      else {
        req.blog = docs;
        next();
      }
    });
  }
};

//module.exports.Blog = mongoose.model('Blog');
module.exports.Blog = BlogData;

var User = new Schema({
  username: String,
  password: String,
  firstname: String,
  lastname: String,
  created: String,
});

mongoose.model('User', User);

var UserData = {
  model: mongoose.model('User'),
  login: function(req, res, next) {
    UserData.model.findOne({username: req.body.login.username, password: req.body.login.password}, function(err, docs) {
      if (!docs) {
        req.flash('error', 'Login Failed');
      }
      else {
        req.session.loggedIn = true;
        req.flash('info', 'You are now logged in.');
      }
    });
    next();
  },
  requireLogin: function(req, res, next) {
    if (!req.session.loggedIn) {
      req.flash('error', 'Login Required.');
      res.redirect('/error/403');
    }
    else {
      next();
    }
  },
};

//module.exports.User = mongoose.model('User');
module.exports.User = UserData;
