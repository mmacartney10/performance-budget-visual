var gulp = require('gulp');
var sass = require('gulp-sass');
var handlebars = require('gulp-compile-handlebars');
var rename = require('gulp-rename');
var data = require('./performanceBudget.json');
var performanceBudget = require('performance-budget');

var runSeq = require('run-sequence');

gulp.task('handlebars', function () {
	var templateData = data,
	options = {}

	return gulp.src('./index.handlebars')
		.pipe(handlebars(templateData, options))
		.pipe(rename('index.html'))
		.pipe(gulp.dest('dist'));
});

gulp.task('styles', function () {
  return gulp.src('./sass/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('dist'));
});

gulp.task('performance-budget', function () {
	return gulp.src('./_src/**/*')
		.pipe(performanceBudget({
			budget: 2000000
		}))
		.pipe(gulp.dest('dest'));
});

gulp.task('default', function (cb) {
	runSeq(['styles'], ['performance-budget'], ['handlebars'], ['watch'], cb);
});

gulp.task('watch', function (cb) {
  gulp.watch('./index.handlebars', ['handlebars']),
  gulp.watch('./sass/*.scss', ['styles'])
});
