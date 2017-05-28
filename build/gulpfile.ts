/**
 * houston/build/gulpfile.ts
 * Builds all of houston. Places everything in houston/dest directory.
 */

import * as del from 'del'
import * as gulp from 'gulp'
import * as path from 'path'

import * as sourcemap from 'gulp-sourcemaps'

import * as typescript from 'gulp-typescript'

import * as common from './common'

const tsConfig = path.resolve(common.paths.root, 'tsconfig.json')
const tsProject = typescript.createProject(tsConfig)

/**
 * clean
 * Removes the build directory
 *
 * @async
 * @return {string[]} - A list of removed files
 */
gulp.task('clean', () => {
  return del([common.paths.dest], { force: true })
})

/**
 * typescript
 * Builds all typescript files into regular javascript files
 *
 * @return {stream} - A gulp task
 */
gulp.task('typescript', () => {
  const src = path.resolve(common.paths.src)
  const dest = path.resolve(common.paths.dest)

  return gulp.src([
    path.resolve(src, '**', '*.ts'),
    '!' + path.resolve(src, '**', '*.e2e.ts'),
    '!' + path.resolve(src, '**', '*.spec.ts')
  ], { base: src })
    .pipe(sourcemap.init())
    .pipe(tsProject())
    .pipe(sourcemap.write('.'))
    .pipe(gulp.dest(dest))
})

/**
 * build
 * Builds all houston assets
 *
 * @return {stream} - A gulp task
 */
gulp.task('build', gulp.series('clean', gulp.parallel('typescript')))

/**
 * watch
 * Builds all the houston assets, but watches for changes for faster building
 *
 * @return {void}
 */
gulp.task('watch', () => {
  gulp.watch(path.resolve(common.paths.src, '**', '*.ts'), gulp.series('typescript'))
})
