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
  res.render('home', {locals: {
    'title': 'Kevin Hankens',
  }});
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
  res.redirect('/account');
});

app.get('/content/:title', BlogPost.aliasLookup, function(req, res) {
  res.render('blog', {locals: {
    'title': req.blog.title,
    'data': req.blog,
  }});
});

app.get('/error/:type', function(req, res) {
  var title = 'Access Denied';
  switch (req.params.type) {
    case '404':
      req.flash('error', 'Page not found.');
      break;
    case '403':
      req.flash('error', 'Access denied.');
      break;
  }
  res.render('error', {locals: {
    title: 'Error',
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
  res.render('edit_form', {locals: {
    'title': form_definition.title,
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
    docs.type = req.params.type;
    res.render(req.params.type, {locals: {
      'title': docs.title,
      'data': docs
    }});
  });
});

// @todo allow view overrides? has_template?
app.get('/view/:type', function(req, res) {
  data_obj = Data.getType(req.params.type);
  data_obj.loadAll(req.query.page, function(data) {
    res.render('list', {locals: {
      'title': 'List',
      'data': data.docs,
      'type': req.params.type,
      'pager': {
        'start': data.pager.start,
        'range': data.pager.range,
        'total': data.pager.count,
        'active': data.pager.active,
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

    res.render('edit_form', {locals: {
      'title': form_definition.title,
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
  res.render('delete_confirm', {locals: {
    title: 'Confirm',
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

app.listen(3000);
