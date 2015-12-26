import app from '~/';


/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('home', { title: 'AppHub' });
});
