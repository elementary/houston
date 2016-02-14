import _ from 'lodash';

export function json(obj) {
  if (obj == null) { // Catch for undefined objects
    return obj;
  }

  if (typeof obj.toClean === 'function') { // Mongoose db object
    return JSON.stringify(obj.toClean(), null, 4);
  }

  return JSON.stringify(obj, null, 4);
}

export function debianTime(date) {
  return date.toUTCString().replace('GMT', '+0000');
}

export function debianTimeNow() {
  return new Date().toUTCString().replace('GMT', '+0000');
}

export function eachReverse(context) {
  var options = arguments[arguments.length - 1];
  var ret = '';
  if (context && context.length > 0) {
    for (var i = context.length - 1; i >= 0; i--) {
      ret += options.fn(context[i]);
    }
  } else {
    ret = options.inverse(this);
  }
  return ret;
};

export function lastElement(context) {
  var options = arguments[arguments.length - 1];

  if (context == null) {
    return null
  }

  return options.fn(context[context.length - 1]);
}

export function is(first, second, data) {
  if (_.isEqual(first, second)) {
    return data.fn(this);
  }

  return data.inverse(this);
}

export function isLength(array, length, data) {
  if (_.isArray(array) && array.length === length) {
    return data.fn(this);
  }

  return data.inverse(this);
}

export function hasLength(array, data) {
  if (_.isArray(array) && array.length > 0) {
    return data.fn(this);
  }

  return data.inverse(this);
}
