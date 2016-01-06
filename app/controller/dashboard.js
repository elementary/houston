import Hubkit from 'hubkit';
import Promise from 'bluebird';
import _ from 'lodash';
import ini from 'ini';

import app from '~/';
import { isBeta } from './auth';
import { Application } from '~/model/application';

app.get('/dashboard', isBeta, (req, res, next) => {
  // Create a new Hubkit instance with user's token
  const token = req.user.github.accessToken
  const gh = new Hubkit({token});

  // Wrap Hubkit call in bluebird for extended promise support (filter & map)
  return Promise.all(gh.request('GET /user/repos', {
    type: 'public',
  })
  .catch(error => {
    return res.render('error', {
      message: 'Houston encountered a problem communicating with GitHub',
      stack: error,
    });
  }))
  .filter(repo => {
    return gh.request(`GET /repos/${repo.full_name}/contents/.apphub`)
    .then(() => true)
    .catch(() => false);
  })
  .map(repo => {
    return Application.findOne({
      'github.owner': repo.owner.login,
      'github.name': repo.name,
    })
    .then(application => {
      if (application == null) {
        return Application.create({
          github: {
            owner: repo.owner.login,
            name: repo.name,
            repoUrl: repo.git_url,
            APItoken: token,
          },
        });
      }

      return application;
    })
    .then(application => {
      return application.fetchGithub();
    });
  })
  .then(applications => {
    return res.render('dashboard', {
      title: 'Dashboard',
      user: req.user,
      applications,
    });
  });
});
