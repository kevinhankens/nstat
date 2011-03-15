var express = require('express');
var app = express.createServer();

app.set('views', __dirname + '/views');
app.set('partials', __dirname + '/views/partials');
app.set('view engine', 'jade');

app.configure(function() {
  app.use(express.bodyDecoder());
  app.use(express.cookieDecoder());
  app.use(express.session({
    key: 'secret-key',
    secret: 'secret-phrase-here'
  }));
  app.use(express.logger());
  app.use(express.errorHandler());
  app.use(express.staticProvider(__dirname + '/static'));
});

app.helpers(require(__dirname + '/helpers/helpers.js').helpers);
app.dynamicHelpers(require(__dirname + '/helpers/dynamicHelpers.js').dynamicHelpers);

// Models
Data = require(__dirname + '/models/data.js');
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
Forms.getForm = function(type) {
  return Data[Data.type_to_object[type]].form;
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

app.get('/blog/new', UserAccount.requireLogin, function(req, res) {
  res.render('blog_edit', {locals: {
    'title': 'New Blog Post',
    'edit_method': 'post',
    'edit_action': '/blog/new',
    'edit_id': '',
    'edit_title': '',
    'edit_body': '',
    'edit_url': '',
  }});
});

app.post('/blog/new', UserAccount.requireLogin, function(req, res) {
  post = new BlogPost.model();
  post.title = req.body.blog.title;
  post.body = req.body.blog.body;
  post.url = req.body.blog.url;
  post.created = post.modified = new Date().getTime();
  post.save()

  res.redirect('/blog/' + post._id);
});

app.get('/content/:title', BlogPost.aliasLookup, function(req, res) {
  res.render('blog', {locals: {
    'title': req.blog.title,
    'blog': req.blog,
  }});
});

app.get('/blog/:id', BlogPost.loadOne, function(req, res) {
  res.render('blog', {locals: {
    'title': req.blog.title,
    'blog': req.blog
  }});
});

app.get('/blog/:id/delete', UserAccount.requireLogin, BlogPost.loadOne, function(req, res) {
  res.render('blog_delete', {locals: {
    'title': 'Are you sure you wish to delete: ' + req.blog.title + '?',
    'edit_action': '/blog/' + req.blog._id + '/delete',
    'edit_method': 'post',
    'cancel_url': '/blog/' + req.blog._id,
  }});
});

app.post('/blog/:id/delete', UserAccount.requireLogin, BlogPost.loadOne, function(req, res) {
  req.blog.remove();
  req.flash('info', 'Blog post deleted.');
  res.redirect('/blog');
});

app.get('/blog/:id/edit', UserAccount.requireLogin, BlogPost.loadOne, function(req, res) {
  res.render('blog_edit', {locals: {
    'title': 'Edit Blog Post',
    'edit_method': 'post',
    'edit_action': '/blog/' + req.blog.id + '/edit',
    'edit_id': req.blog.id,
    'edit_title': req.blog.title,
    'edit_body': req.blog.body,
    'edit_url': req.blog.url,
  }});
});

app.post('/blog/:id/edit', UserAccount.requireLogin, BlogPost.loadOne, function(req, res) {
  req.blog.title = req.body.blog.title;
  req.blog.body = req.body.blog.body;
  req.blog.url = req.body.blog.url;
  post.modified = new Date().getTime();
  req.blog.save();
  res.redirect('/blog/' + req.blog._id);
});

app.get('/blog', BlogPost.loadAll, BlogPost.count, function(req, res) {
  res.render('blog_all', {locals: {
    'title': 'Blogs',
    'blogs': req.blogs,
    'pager': {
      'start': (req.query.page * 10) - 9,
      'range': req.query.page * 10,
      'total': req.blog_count,
      'active': req.query.page,
    }
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
app.get('/new/:type', function(req, res) {
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
app.post('/new/:type', function(req, res) {
  data_obj = Data.getType(req.params.type);
  item = new data_obj.model();
  item.type = req.params.type;
  for (element in req.body) {
    item[element] = req.body[element];
  }
  item.save();

  res.redirect('/view/' + req.params.type + '/' + item._id);
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
  data_obj = Data.getType(req.params.type);
  data_obj.loadOne(req.params.id, function(docs) {
    for (element in req.body) {
      docs[element] = req.body[element];
    }
    docs.save();

    res.redirect('/view/' + req.params.type + '/' + req.params.id);
  });
});

app.get('/delete/:type/:id', function(req, res) {
  res.render('delete_confirm', {locals: {
    title: 'Confirm',
    type: req.params.type,
    id: req.params.id,
  }});
});

app.get('/delete-confirm/:type/:id', function(req, res) {
  data_obj = Data.getType(req.params.type);
  data_obj.loadOne(req.params.id, function(docs) {
    docs.remove();
    req.flash('info', 'Deleted!');
    res.redirect('/');
  });
});

app.listen(3000);
