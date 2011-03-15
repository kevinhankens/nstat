var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/kh');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/**
 * ToDo Model
 */
var ToDo = new Schema({
  user: ObjectId,
  title: String,
  body: String,
  created: String,
  modified: String,
});

mongoose.model('ToDo', ToDo);

var ToDoData = {
  model: mongoose.model('ToDo'),
  form: {
    'title': 'New To Do',
    'method': 'post',
    'action': '/create/new/todo',
    'elements': {
      'title': {
        'type': 'textfield',
        'title': 'Title',  
        'value': '',
        'attrs': {
        }
      },
      'body': {
        'type': 'textarea',
        'title': 'Body',  
        'value': '',
        'attrs': {
          'rows': 20,
          'cols': 80,
        }
      },
      'submit': {
        'type': 'submit',
        'value': 'Save',  
        'attrs': {
        }
      },
    },
  },
  loadOne: function(id, next) {
    ToDoData.model.findOne({_id: id}, function(err, docs) {
      if (!docs) {
        // @todo what's the best way to integrate res here?
        //req.flash('error', 'Post not found.');
        //res.redirect('/error/404');
        next({});
      } 
      else {
        next(docs); 
      }
    });
  },
};

module.exports.ToDo = ToDoData;

/**
 * Blog Post Model
 */
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
  form: {
    'title': 'New Blog Post',
    'method': 'post',
    'action': '/create/new/blog',
    'elements': {
      'title': {
        'title': 'Title',
        'type': 'textfield',
        'attrs': {
          'size': 80,
        },
      },
      'body': {
        'title': 'body',
        'type': 'textarea',
        'attrs': {
          'rows': 20,
          'cols': 80,
        }
      },
      'url': {
        'title': 'URL',
        'type': 'textfield',
        'attrs': {
          'size': 80,
        },
      },
      'submit': {
        'type': 'submit',
        'value': 'Save',
      },
    }
  },
  loadOne: function(id, next) {
    BlogData.model.findOne({_id: id}, function(err, docs) {
      if (!docs) {
        // @todo what's the best way to integrate flash and redirection?
        //req.flash('error', 'Post not found.');
        //res.redirect('/error/404');
      } 
      else {
        next(docs); 
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

module.exports.FormLookup = function(type) {
  return 
}
