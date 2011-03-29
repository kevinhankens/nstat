var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/kh');

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

var DataDef = function() {
  this.title = 'Data';
  this.loadOne = function(id, next) {
    this.model.findOne({_id: id}, function(err, docs) {
      if (!docs) {
        docs = {error: true};
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
  this.update = function(req, res, fields, files) {
    // @todo This is temp - should be dependent upon the data def
    this.item.images = {};

    for (field in fields) {
      // Extract information via the field name. e.g. input-multi-images-nstatvalue
      // The first item is not used, the second item denotes single/multi values,
      // the third is the index to use in the data object and the last item denotes
      // that this is a default value for input such as file items.
      var field_info = field.match(/^input-([^-]+)-([^-]+)-([^-]+)[-]*(.*)$/);
      var cardinality = field_info[1];
      var data_index = field_info[2];
      var field_type = field_info[3];
      var default_value = field_info[4];

      // The data object needs to be considerate of default values. This is a little
      // weird, but basically if it is not a default value and not empty, then we
      // know that it's an intended value. Else, if the field was empty, but has a
      // corresponding default value, use that. Finally, if it is not a default value
      // (which should never be captured), then we'll enter an empty string.
      if (default_value == '' && fields[field] != '') {
        // If the field is not empty and is not a default.
        this.item[data_index] = fields[field];
      }
      else if (typeof fields[field + '-nstatvalue'] != 'undefined') {
        // If the field is empty and has a default value.
        this.item.images[data_index] = fields[field + '-nstatvalue'];
      }
      else if (default_value == '') {
        // If the field is empty and has no default value.
        // @todo should this default to a string?
        this.item[data_index] = '';
      }
    }

    // Created/Modified dates and Monthly subdirs
    var d = new Date();
    this.item['created'] = typeof this.item['created'] == 'undefined' ? d.getTime() : this.item['created'];
    this.item['modified'] = d.getTime();
    var month = d.getMonth();
    var year = d.getFullYear();
    var monthdir = year.toString() + month.toString();
    var filedir_thumb = __dirname + '/static/images/thumbs/' + monthdir;
    var filedir_full = __dirname + '/static/images/full/' + monthdir;
    var exec = this.exec;

    for (file in files) {
      // @todo exception handling for bad paths
      // @todo other image types - why does png fail?
      // @todo add ordinals to avoid overwriting. fs.stat()? 
      //var filepath_thumb = filedir_thumb + '/' + files[file].name;
      //var filepath_full = filedir_full + '/' + files[file].name;
      exec('mkdir ' + filedir_thumb + '; ' +
           'mkdir ' + filedir_full + '; ' +
           'convert ' + files[file].path + ' -resize 100x100 ' + filedir_thumb + '/' + files[file].name + '; ' +
           'chmod 755 ' + filedir_thumb + '/' + files[file].name + '; ' +
           'mv ' + files[file].path + ' ' + filedir_full + '/' + files[file].name + '; ' +
           'chmod 755 ' + filedir_full + '/' + files[file].name
      );
      this.item.images[file] = '/' + monthdir + '/' + files[file].name;

    }

    this.item.save();
    res.redirect('/view/' + req.params.type + '/' + this.item._id);

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

ToDoData.form = function() {
  return {
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
};

module.exports.ToDo = ToDoData;

/**
 * Blog Post Model
 */
var BlogData = new DataDef();
BlogData.title = 'Blog';

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

BlogData.form = function() { 
  return {
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
      'images': {
        'title': 'Images',
        'type': 'file',
        'name': 'images',
        'multi': true,
        'attrs': {},
        'value': '',
      },
      'submit': {
        'type': 'submit',
        'value': 'Save',
      },
    }
  };
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
  modified: String,
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
