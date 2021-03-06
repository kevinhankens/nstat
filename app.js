var express = require('express')
  , form = require('connect-form')
  , sys = require('sys')
  , exec = require('child_process').exec;

var app = express.createServer(
  // connect-form middleware
  form({ keepExtensions: true })
);

app.set('views', __dirname + '/views');
app.set('partials', __dirname + '/views/partials');
app.set('view engine', 'jade');

app.configure(function() {
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({
    key: 'secret-key',
    secret: 'secret-phrase-here'
  }));
  app.use(express.logger());
  app.use(express.errorHandler());
  app.use(express.static(__dirname + '/static'));
});

app.helpers(require(__dirname + '/helpers/helpers.js').helpers);
app.dynamicHelpers(require(__dirname + '/helpers/dynamicHelpers.js').dynamicHelpers);

// Config
Config = require(__dirname + '/config.js');

// Models
Data = require(__dirname + '/models.js');
BlogPost = Data.Blog;
ToDo = Data.ToDo;
UserAccount = Data.User;
Data.type_to_object = {
  'blog': 'Blog',
  'todo': 'ToDo',
};
Data.getType = function(type) {
  return Data[this.type_to_object[type]];
};

// Forms
Forms = require(__dirname + '/forms.js');
// Add a method that grabs the form JSON from the data def.
Forms.getForm = function(type) {
  return Data[Data.type_to_object[type]].form();
}

// Routing
app.get('/', function(req, res) {
  publicConfig = Config.settings.getPublic();
  data_obj = Data.getType('blog');
  data_obj.loadLatest(function(docs) {
console.log(docs);
    docs.teaser = docs.body.substring(0, 140);
    docs.teaser = docs.teaser.replace(/\w+$/, '');
    res.render('home', {locals: {
      'last_blog': docs,
      'Config': publicConfig,
    }});
  });
});

app.get('/account/logout', function(req, res) {
  if (req.session.loggedIn) {
    req.flash('info', 'You are now logged out.');
    req.session.loggedIn = false;
  }
  res.redirect('/');
});

app.get('/account', function(req, res) {
  if (req.session.loggedIn) {
    req.flash('info', 'You are logged in');
    res.redirect('/');
  }
  else {
    res.render('login', {locals: {
      'title': 'Login'
    }});
  }
});

app.post('/account', UserAccount.login, function(req, res) {
  res.redirect('/');
});

// @todo url aliases need to become more generic - i.e. not tied to blog type.
app.get('/content/:title', BlogPost.aliasLookup, function(req, res) {
  req.blog.type = 'blog';
  publicConfig = Config.settings.getPublic();
  publicConfig.page_title = req.blog.title;
  res.render('blog', {locals: {
    'Config': publicConfig,
    'data': req.blog,
  }});
});

/**
 * Generic Form Builder
 * @todo build authentication methods
 */
app.get('/new/:type', UserAccount.requireLogin, function(req, res) {
  form_definition = Forms.getForm(req.params.type);
  form_definition.action = '/new/' + req.params.type;
  var itemForm = new Forms.Form(form_definition);
  publicConfig = Config.settings.getPublic();
  publicConfig.page_title = form_definition.title;
  res.render('edit_form', {locals: {
    'Config': publicConfig,
    'type': req.params.type,
    'form': itemForm.renderForm(),
  }});
});

// @todo we need sanitation here.
app.post('/new/:type', UserAccount.requireLogin, function(req, res) {
  req.form.complete(function(err, fields, files) {
    data_obj = Data.getType(req.params.type);
    data_obj.item = new data_obj.model();
    data_obj.exec = exec;
    data_obj.item.type = req.params.type;
    data_obj.update(req, res, fields, files);
  });
});

// @todo needs has_method and has_template checks
app.get('/view/:type/:id', function(req, res) {
  data_obj = Data.getType(req.params.type);
  data_obj.loadOne(req.params.id, function(docs) {

  if (docs.error == true) {
    res.redirect('/error/404');
  }
  else {
    docs.type = req.params.type;
    publicConfig = Config.settings.getPublic();
    publicConfig.page_title = docs.title;
    res.render(req.params.type, {locals: {
      'Config': publicConfig,
      'data': docs
    }});
  }
  });
});

// @todo allow view overrides? has_template?
app.get('/view/:type', function(req, res) {
  data_obj = Data.getType(req.params.type);
  data_obj.loadAll(req.query.page, function(data) {
    publicConfig = Config.settings.getPublic();
    publicConfig.page_title = data_obj.title;
    res.render('list', {locals: {
      'Config': publicConfig,
      'data': data.docs,
      'type': req.params.type,
      'pager': {
        'start': data.pager.start,
        'range': data.pager.range,
        'total': data.pager.count,
        'active': data.pager.active,
        'type': req.params.type,
      }
    }}); 
  });
});

app.get('/edit/:type/:id', UserAccount.requireLogin, function(req, res) {
  data_obj = Data.getType(req.params.type);
  form_definition = Forms.getForm(req.params.type);
  form_definition.action = '/save/' + req.params.type + '/' + req.params.id;

  data_obj.loadOne(req.params.id, function(docs) {
    for (element in form_definition.elements) {
      if (form_definition.elements[element].type != 'submit') {
        form_definition.elements[element].value = docs[element];
      }
    }
    var itemForm = new Forms.Form(form_definition);

    publicConfig = Config.settings.getPublic();
    publicConfig.page_title = form_definition.title;
    res.render('edit_form', {locals: {
      'Config': publicConfig,
      'type': req.params.type,
      'form': itemForm.renderForm(),
    }});
  });
});

app.post('/save/:type/:id', UserAccount.requireLogin, function(req, res) {
  req.form.complete(function(err, fields, files) {
    data_obj = Data.getType(req.params.type);
    data_obj.exec = exec;
    data_obj.loadOne(req.params.id, function(docs) {
      data_obj.item = docs;
      data_obj.update(req, res, fields, files);
    });
  });
});

app.get('/delete/:type/:id', UserAccount.requireLogin, function(req, res) {
  publicConfig = Config.settings.getPublic();
  publicConfig.page_title = 'Confirm';
  res.render('delete_confirm', {locals: {
    'Config': publicConfig,
    type: req.params.type,
    id: req.params.id,
  }});
});

app.get('/delete-confirm/:type/:id', UserAccount.requireLogin, function(req, res) {
  data_obj = Data.getType(req.params.type);
  data_obj.loadOne(req.params.id, function(docs) {
    docs.remove();
    req.flash('info', 'Deleted!');
    res.redirect('/');
  });
});

// Defaults and error handling.
app.get('/error/:type', function(req, res) {
  switch (req.params.type) {
    case '404':
      var title = 'Sorry, the page you were looking for was not found.';
      req.flash('error', 'Page not found.');
      break;
    case '403':
      var title = 'Access Denied';
      req.flash('error', 'Access denied.');
      break;
  }
  publicConfig = Config.settings.getPublic();
  publicConfig.page_title = title;
  res.render('error', {locals: {
    'Config': publicConfig,
  }});
});

app.get('*', function(req, res) {
  res.redirect('/error/404');
});

app.listen(3000);
