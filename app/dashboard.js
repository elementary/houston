var app = require.main.require('./app/index.js');

app.get('/dashboard', ensureAuthenticated, function(req, res) {
  console.log(req.user);
  res.render('dashboard', { user: req.user });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/auth/github');
}
