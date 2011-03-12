exports.dynamicHelpers = {
  flashMessages: function(req, res) {
    var messages = [];
    messages.error = req.flash('error');
    messages.info = req.flash('info');
    return messages;
  },

  loggedIn: function(req, res) {
    return req.session.loggedIn ? true : false;
  }
};
