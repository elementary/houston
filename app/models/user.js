import mongoose from 'mongoose';

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

UserSchema.statics.updateOrCreate = function(accessToken, profile) {
  return this.findOne({
    username: profile.username
  })
  .exec()
  .then(user => {
    if (user) {
      user.email = profile.emails[0].value;
      user.avatar = profile._json['avatar_url'];
      user.github = {accessToken: accessToken};
      return user.save();
    } else {
      return this.create({
        username: profile.username,
        email:    profile.emails[0].value,
        avatar:   profile._json['avatar_url'],
        github:   {accessToken: accessToken},
        joined:   Date.now(),
        active:   true,
      });
    }
  });
};

var User = mongoose.model('user', UserSchema);

export { UserSchema, User };
