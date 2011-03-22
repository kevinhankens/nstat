var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/kh');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var DataDef = function() {
  this.loadOne = function(id, next) {
    this.model.findOne({_id: id}, function(err, docs) {
      if (!docs) {
        docs = {};
      }
      next(docs);
    });
  }
  this.loadAll = function(page, next) {
    if (typeof page == 'undefined') {
      page = 1;
    }
    record_skip = (page - 1) * 10;
    data_object = this;
    this.model.find({}, [], {sort: [['created', -1]], skip: record_skip, limit: 10}, function(err, docs) {
      if (!docs) {
        docs = {};
      }
      data_object.model.find().count(function(err, count) {
        if (!count) {
          count = 0;
        }
        next({'pager': {
            'count': count, 
            'range': count > 10 ? page * 10 : count, 
            'active': page, 
            'start': (page * 10) - 9
          }, 
          'docs': docs}
        );
      });
    });
  }
  this.count = function(docs, next) {
  }
}

/**
 * ToDo Model
 */
var ToDoData = new DataDef();

var ToDo = new Schema({
  user: ObjectId,
  title: String,
  body: String,
  created: String,
  modified: String,
});

mongoose.model('ToDo', ToDo);
ToDoData.model = mongoose.model('ToDo');

ToDoData.form = {
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
};

module.exports.ToDo = ToDoData;

/**
 * Blog Post Model
 */
var BlogData = new DataDef();

var Blog = new Schema({
  user: ObjectId,
  title: String,
  body: String,
  url: String,
  images: {},
  created: String,
  modified: String,
});

mongoose.model('Blog', Blog);
BlogData.model = mongoose.model('Blog'),

BlogData.form = {
  'title': 'New Blog Post',
  'method': 'post',
  'action': '/create/new/blog',
  'elements': {
    'title': {
      'title': 'Title',
      'type': 'textfield',
      'value': '',
      'attrs': {
        'size': 80,
      },
    },
    'body': {
      'title': 'body',
      'type': 'textarea',
      'value': '',
      'attrs': {
        'rows': 20,
        'cols': 80,
      }
    },
    'url': {
      'title': 'URL',
      'type': 'textfield',
      'value': '',
      'attrs': {
        'size': 80,
      },
    },
    'image': {
       'title': 'Images',
       'type': 'file',
       'name': 'image',
       'multi': true,
       'value': '',
    },
    'submit': {
      'type': 'submit',
      'value': 'Save',
    },
  }
};

BlogData.aliasLookup = function(req, res, next) {
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
      next();
    });
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
