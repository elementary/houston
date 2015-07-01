module.exports = {
  json: function(obj) {
    return JSON.stringify(obj, null, 4);
  },
  debianTime: function(date) {
    return date.toUTCString().replace('GMT', '+0000');
  },
  debianTimeNow: function() {
    return new Date().toUTCString().replace('GMT', '+0000');
  },
};
