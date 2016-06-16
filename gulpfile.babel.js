/**
 * gulpfile.babel.js
 * Transcodes and builds all needed files.
 */

import babel from 'gulp-babel'
import del from 'del'
import gulp from 'gulp'
import merge from 'merge2'

/**
 * overarching tasks
 */

gulp.task('clear', () => {
  return del(['build'])
})

gulp.task('build-entry', () => {
  return gulp.src('src/entry.js')
  .pipe(babel())
  .pipe(gulp.dest('build'))
})

/**
 * flightcheck
 * all clear and build functions for flightcheck process
 */

gulp.task('clear-flightcheck', () => {
  return del(['build/flightcheck'])
})

gulp.task('build-flightcheck', ['clear-flightcheck'], () => {
  const copy = gulp.src([
    'src/flightcheck/**/*',
    '!src/flightcheck/**/*.js'
  ])
  .pipe(gulp.dest('build/flightcheck'))

  const javascript = gulp.src('src/flightcheck/**/*.js')
  .pipe(babel({
    plugins: [
      ['babel-root-import', {
        'rootPathSuffix': '/build'
      }]
    ]
  }))
  .pipe(gulp.dest('build/flightcheck'))

  return merge(copy, javascript)
})

/**
 * houston
 * all clear and build functions for houston process
 */

gulp.task('clear-houston', () => {
  return del(['build/houston'])
})

gulp.task('build-houston', ['clear-houston'], () => {
  const copy = gulp.src([
    'src/houston/**/*',
    '!src/houston/**/*.js'
  ])
  .pipe(gulp.dest('build/houston'))

  const javascript = gulp.src([
    'src/houston/**/*.js'
  ])
  .pipe(babel({
    plugins: [
      ['babel-root-import', {
        'rootPathSuffix': '/build'
      }]
    ]
  }))
  .pipe(gulp.dest('build/houston'))

  return merge(copy, javascript)
})

/**
 * lib
 * all clear and build functions for lib helper files
 */

gulp.task('clear-lib', () => {
  return del(['build/lib'])
})

gulp.task('build-lib', ['clear-lib'], () => {
  return gulp.src([
    'src/lib/**/*.js'
  ])
  .pipe(babel({
    plugins: [
      ['babel-root-import', {
        'rootPathSuffix': '/build'
      }]
    ]
  }))
  .pipe(gulp.dest('build/lib'))
})

/**
 * strongback
 * all clear and build functions for strongback process
 */

gulp.task('clear-strongback', () => {
  // Strongback has some folders that are root. Avoid the permission error
  return del([
    'build/strongback/**',
    '!build/strongback',
    '!build/strongback/cache',
    '!build/strongback/cache/**/*',
    '!build/strongback/projects',
    '!build/strongback/projects/**/*'
  ])
})

gulp.task('build-strongback', ['clear-strongback'], () => {
  const copy = gulp.src([
    'src/strongback/**/*',
    '!src/strongback/**/*.js'
  ])
  .pipe(gulp.dest('build/strongback'))

  const javascript = gulp.src([
    'src/strongback/**/*.js'
  ])
  .pipe(babel({
    plugins: [
      ['babel-root-import', {
        'rootPathSuffix': '/build'
      }]
    ]
  }))
  .pipe(gulp.dest('build/strongback'))

  return merge(copy, javascript)
})

/**
 * wrapped tasks
 * functions to be ran
 */

gulp.task('build', [
  'build-entry',
  'build-flightcheck',
  'build-houston',
  'build-lib',
  'build-strongback'
])

gulp.task('watch', () => {
  gulp.watch('src/flightcheck/**/*', ['build-flightcheck'])
  gulp.watch('src/houston/**/*', ['build-houston'])
  gulp.watch('src/lib/**/*', ['build-lib'])
  gulp.watch('src/strongback/**/*', ['build-strongback'])
})
