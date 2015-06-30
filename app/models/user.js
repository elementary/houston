var mongoose = require('mongoose');

var UserSchema = mongoose.Schema({
  username:   String,
  emails:     String,
  avatar:     String,
  github:     {accessToken: String, refreshToken: String},
  joined:     Date,
  lastVisit:  Date,
  active:     Boolean,
  rights:     String,
});

UserSchema.statics.findOrCreateGitHub =
  function(accessToken, refreshToken, profile) {
    var self = this;
    return self.findOne({username: profile.username}).exec()
      .then(function(user) {
        if (user) {
          return user;
        } else {
          return self.create({
            username: profile.username,
            email:    profile.emails[0].value,
            avatar:   profile._json['avatar_url'],
            github:   {accessToken: accessToken, refreshToken: refreshToken},
            joined:   Date.now(),
            active:   true,
          });
        }
      });
  };

var User = mongoose.model('user', UserSchema);

module.exports = {UserSchema: UserSchema, User: User};
