/**
 * gulpfile.babel.js
 * Transcodes and builds all needed files.
 */

import del from 'del'
import gulp from 'gulp'
import path from 'path'

import babel from 'gulp-babel'
import postcss from 'gulp-postcss'
import cssnext from 'postcss-cssnext'

const browsers = [
  'last 4 version',
  'not ie <= 11'
]

/**
 * functionCopy
 * Returns gulp task for copying files based on file input
 *
 * @param {String} [file] - path of file to copy
 * @returns {Stream} - a gulp stream
 */
const functionCopy = (file) => {
  const buildFiles = (file == null) ? ['src/**/*', '!src/**/*.js', '!src/**/*.css'] : file

  return gulp.src(buildFiles, { base: 'src' })
  .pipe(gulp.dest('build'))
}

/**
 * functionBabel
 * Returns gulp task for building with babel based on file input
 *
 * @param {String} [file] - path of file to build with babel
 * @returns {Stream} - a gulp stream
 */
const functionBabel = (file) => {
  const buildFiles = (file == null) ? ['src/**/*.js'] : file

  return gulp.src(buildFiles, { base: 'src' })
  .pipe(babel())
  .pipe(gulp.dest('build'))
}

/**
 * functionPostCSS
 * Returns gulp task for building stylesheets with PostCSS
 *
 * @param {String} [file] - path of the file to build with PostCSS
 * @returns {Stream} - a gulp stream
 */
const functionPostCSS = (file) => {
  const buildFiles = (file == null) ? ['src/**/*.css'] : file

  return gulp.src(buildFiles, { base: 'src' })
  .pipe(postcss([
    cssnext({ browsers })
  ]))
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
gulp.task('build', ['build-copy', 'build-babel', 'build-postcss'])

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
 * build-postcss
 * Builds all src/ stylesheets with PostCSS
 */
gulp.task('build-postcss', () => functionPostCSS())

/**
 * watch
 * Watches files for change
 */
gulp.task('watch', () => {
  gulp.watch('src/**/*', (obj) => {
    if (obj == null || obj.type !== 'changed') return

    if (path.extname(obj.path) === '.css') {
      functionPostCSS(obj.path)
    } else if (path.extname(obj.path) === '.js') {
      functionBabel(obj.path)
    } else {
      functionCopy(obj.path)
    }
  })
})
