export function json(obj) {
  return JSON.stringify(obj, null, 4);
}

export function debianTime(date) {
  return date.toUTCString().replace('GMT', '+0000');
}

export function debianTimeNow() {
  return new Date().toUTCString().replace('GMT', '+0000');
}
