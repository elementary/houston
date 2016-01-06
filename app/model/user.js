import mongoose from 'mongoose';
import Hubkit from 'hubkit';

import app from '~/';

var UserSchema = mongoose.Schema({
  username:   String,
  email:      String,
  avatar:     String,
  github: {
    accessToken: String,
    refreshToken: String,
  },
  joined:     Date,
  lastVisit:  Date,
  rights:     {
    type: String,
    default: 'user',
    enum: ['user', 'beta', 'reviewer', 'admin'],
  },
});

UserSchema.statics.updateOrCreate = function(accessToken, profile) {
  return this.findOne({
    username: profile.username,
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
      });
    }
  })
  .then(getRights);
};

// Checks github organizations and teams for correct permissions
function getRights(user) {
  const gh = new Hubkit({ token: user.github.accessToken, boolean: true });

  return Promise.all([
    gh.request(`GET /orgs/${app.config.rights.org}/members/${user.username}`),
    gh.request(`GET /teams/${app.config.rights.reviewer}/memberships/${user.username}`),
    gh.request(`GET /teams/${app.config.rights.admin}/memberships/${user.username}`),
  ])
  .then(([isBeta, isReviewer, isAdmin]) => {
    if (isAdmin) {
      user.rights = 'admin'
    } else if (isReviewer) {
      user.rights = 'reviewer'
    } else if (isBeta) {
      user.rights = 'beta'
    } else {
      user.rights = 'user'
    }
    return user.save();
  });
}

var User = mongoose.model('user', UserSchema);

export { UserSchema, User };
