import app from 'houston/app';


/* GET home page. */
app.get('/', function(req, res, next) {
  res.render('home', { title: 'AppHub' });
});
