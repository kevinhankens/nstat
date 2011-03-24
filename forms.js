module.exports.Form = function(def) {
  this.def = def;
  this.renderedForm = '';
  this.renderForm = function() {
    var renderedForm = '<form method="' 
      + this.def.method 
      + '" action="' + this.def.action
      + '" enctype="multipart/form-data">';
    for(element in this.def.elements) {
      var title = typeof this.def.elements[element].title != 'undefined' ? '<h5>' + this.def.elements[element].title + '</h5>'  : '';
      var tag = '';
      var attrs = this.renderAttrs(element);

      if (this.def.elements[element].multi) {
        for (key in this.def.elements[element].value) {
          var value = this.def.elements[element].value[key]
          tag += this.renderElement(this.def.elements[element].type, value, attrs);
        }
        multi = ' multi';
        add = '<div class="form-add" ord="1">Add another</div>';
      }
      else {
        tag = this.renderElement(this.def.elements[element].type, this.def.elements[element].value, attrs);
        multi = ''
        add = '';
      }

      renderedForm += '<div id="form-' + element + '" class="form-item' + multi + '">' + title + tag + add + '</div>';
    }
    return renderedForm + '</form>';
  }
  this.renderElement = function(type, value, attrs) {
    var tag = '';
    switch(type) {
      case 'textarea':
        var value = typeof value != 'undefined' ? value : '';
        tag = '<textarea id="form-' + element + '-input" name="' + element + '"' + attrs + '>' + value + '</textarea>';
        break;
      default:
        tag = '<input id="form-' + element + '-input" name="' + element + '" type="' +type + '" value="' + value + '"' + attrs + ' />';
        break;
    }

    return tag
  }
  this.renderAttrs = function(element) {
    if (typeof this.def.elements[element].attrs != 'undefined') {
      var attrs = '';
      for (attr in this.def.elements[element].attrs) {
        attrs += ' ' + attr + '="' + this.def.elements[element].attrs[attr] + '"';
      }
    }
    else {
      attrs = '';
    }
    return attrs;
  }
};


