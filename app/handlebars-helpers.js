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
