var app = require.main.require('./app/index.js');

/* GET dashboard page. */
app.get('/dashboard', function(req, res, next) {
  res.render('dashboard', {
  	title: 'Dashboard'
  });
});
