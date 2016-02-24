/**
 * Entry to all appHooks
 */
import Promise from 'bluebird';
let fs = Promise.promisifyAll(require('fs'));

import { Application } from '~/model/application';

function hooks(release, level) {
  return Promise.all(fs.readdirSync(__dirname))
  .filter(path => {
    return fs.statAsync(`${__dirname}/${path}`)
    .then(stat => {
      return stat.isDirectory();
    });
  })
  .filter(directory => {
    return fs.statAsync(`${__dirname}/${directory}/${level}.js`)
    .then(stat => {
      return stat.isFile();
    });
  })
  .map(directory => {
    return require(`${__dirname}/${directory}/${level}.js`).default.run(release);
  });
}

export function run(release, level = 'prebuild') {
  return Promise.all(hooks(release, level))
  .then(() => {
    return Application.findOne({
      'releases._id': release._id,
    });
  })
  .then(application => {
    if (application.release.latest != null && application.status != 'FAILED') {
    //  applicaiton.release.latest.buildDo();
    }

    return Promise.resolve();
  });
}
