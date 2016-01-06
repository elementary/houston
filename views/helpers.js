export function json(obj) {
  if (typeof obj.toJSON === 'function') {
    /* Make Mongoose Objects properly render JSON */
    return JSON.stringify(obj.toJSON(), null, 4);
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
  return options.fn(context[context.length - 1]);
}

export function is(t1, t2, data) {
  if (t1 === t2) {
    return data.fn(this);
  }

  return data.inverse(this);
}
