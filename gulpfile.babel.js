/**
 * gulpfile.babel.js
 * Transcodes and builds all needed files.
 */

import babel from 'gulp-babel'
import del from 'del'
import gulp from 'gulp'
import path from 'path'

/**
 * functionCopy
 * Returns gulp task for copying files based on file input
 *
 * @param [String] file - path of file to copy
 * @returns {Stream} - a gulp stream
 */
const functionCopy = (file) => {
  const buildFiles = (file == null) ? ['src/**/*', '!src/**/*.js'] : file

  return gulp.src(buildFiles, { base: 'src' })
  .pipe(gulp.dest('build'))
}

/**
 * functionBabel
 * Returns gulp task for building with babel based on file input
 *
 * @param [String] file - path of file to build with babel
 * @returns {Stream} - a gulp stream
 */
const functionBabel = (file) => {
  const buildFiles = (file == null) ? ['src/**/*.js'] : file

  return gulp.src(buildFiles, { base: 'src' })
  .pipe(babel())
  .pipe(gulp.dest('build'))
}

/**
 * clean
 * Removes any compiled files
 */
gulp.task('clean', () => {
  return del(['build'])
})

/**
 * build
 * Runs all build related tasks
 */
gulp.task('build', ['build-copy', 'build-babel'])

/**
 * build-copy
 * Copies all non built files to build directory
 */
gulp.task('build-copy', () => functionCopy())

/**
 * build-babel
 * Builds all src/ code with babel
 */
gulp.task('build-babel', () => functionBabel())

/**
 * watch
 * Watches files for change
 */
gulp.task('watch', () => {
  gulp.watch('src/**/*', (obj) => {
    if (obj == null || obj.type !== 'changed') return

    if (path.extname(obj.path) !== '.js') {
      functionCopy(obj.path)
    } else {
      functionBabel(obj.path)
    }
  })
})
