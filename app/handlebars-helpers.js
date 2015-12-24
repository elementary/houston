export function json(obj) {
  if (obj.constructor.name === 'model') {
    /* Make Mongoose Objects properly render JSON */
    return JSON.stringify(obj.toJSON(), null, 4);
  } else {
    return JSON.stringify(obj, null, 4);
  }
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
  return options.fn(context[context.length - 1]);
}
