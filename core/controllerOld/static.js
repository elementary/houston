import app from '~/';

app.get('/', (req, res, next) => {
  res.render('home', {
    title: 'AppHub',
  });
});
