var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');

var UserSchema = mongoose.Schema({
    username:	String,
    emails:	String,
    avatar:     String,
    github:	{accessToken: String, refreshToken: String},
    joined:	Date,
    last_visit:	Date,
    active:	Boolean,
    rights:	String
});

UserSchema.plugin(findOrCreate);

var User = mongoose.model('user', UserSchema);

module.exports = {UserSchema: UserSchema, User: User};
