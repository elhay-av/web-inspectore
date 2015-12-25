/* globals console, require, process, __dirname */

(function () {
	'use strict';

	var gulp = require('gulp'),
		path = require('path'),
		sass = require('gulp-sass'),
		minifyCSS = require('gulp-minify-css'),
		plumber = require('gulp-plumber'),

		uglify = require('gulp-uglify'),
		notify = require('gulp-notify'),
		concate = require('gulp-concat'),
		notifier = require('node-notifier'),
		extReplace = require('gulp-ext-replace'),
		livereload = require('gulp-livereload'),
		sourcemaps = require('gulp-sourcemaps'),
		gulpIf = require('gulp-if'),

	// resources location
		resources = path.join('wp-content/themes/joyn-child/'),
		paths = {
			scss: './scss/**/*.scss',
			css: './css/',
			cssMap: './map/',

			js: './js/*.js',
			jsMin: './js/min',
			jsMap: './map'
		},
		isDev = process.env.NODE_ENV === 'development',
		rename = require('gulp-rename'),
		bump = require('gulp-bump'),
		packageObj = require('./package.json');

	process.env.NODE_ENV = (process.env.NODE_ENV)? process.env.NODE_ENV: 'production';

	function clone(obj) {
		var newObbj = JSON.stringify(obj);
		return JSON.parse(newObbj);
	}

	function onChangeJs(event) {
		var fileName = path.basename(event.path);

		console.log('|onChangeJs| File ' + fileName + ' was ' + event.type);

		return gulp.src(paths.js)
			// pipe fallback function
			.pipe(plumber({
				errorHandler: notify.onError({
					title: 'Scss error',
					message: '<%= error.message %>',
					wait: true,
					sticky: true,
					time: 50000
				})
			}))
			// Compile to css
			.pipe(gulpIf(!isDev,uglify()))
			// Minify css files
			.pipe(concate('inspector.min.js'))
			// save the css
			.pipe(gulp.dest(paths.jsMin))

			.on('finish', function () {
				// Notify on done
				notifier.notify({title: 'Js File compiled', message: fileName});
			});
	}

	function onChangeScss(event) {
		var fileName = path.basename(event.path);

		console.log('|onChangeScss| File ' + fileName + ' was ' + event.type);

		return gulp.src(event.path)
			// pipe fallback function
			.pipe(plumber({
				errorHandler: notify.onError({
					title: 'Scss error',
					message: '<%= error.message %>',
					wait: true,
					sticky: true,
					time: 50000
				})
			}))
			// Compile to css
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(minifyCSS())
			// Minify css files
			.pipe(gulpIf(isDev, sourcemaps.write(paths.cssMap)))

			// save the css
			.pipe(gulp.dest(paths.css))

			.on('finish', function () {
				// Notify on done
				notifier.notify({title: 'Scss File compiled', message: fileName});
			});
	}

	function onChange_Scss(event) {
		var fileName = path.basename(event.path);

		console.log('|onChange_Scss| File ' + fileName + ' was ' + event.type);

		return gulp.src('./scss/style.scss')
			.pipe(plumber({
				errorHandler: notify.onError({
					title: 'Scss error',
					message: '<%= error.message %>',
					wait: true,
					sticky: true,
					time: 50000
				})
			}))
			// Compile to css
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(minifyCSS())
			// Minify css files
			.pipe(gulpIf(isDev, sourcemaps.write(paths.cssMap)))
			// save the css
			.pipe(gulp.dest(paths.css))

			.on('end', function () {
				// Notify on done
				notifier.notify({title: '_Scss File compiled', message: fileName});
			});
	}

	function onChangeCss(event) {
		var fileName = path.basename(event.path);

		console.log('|onChangeCss| File ' + fileName + ' was ' + event.type);

		return gulp.src(event.path)

			.pipe(livereload())

			.on('end', function () {
				// Notify on uploading done
				notifier.notify({title: 'Css File Reloaded', message: fileName});
			});
	}

	gulp.task('bump', function(){
		gulp.src('./package.json')
			.pipe(bump())
			.pipe(gulp.dest('./'));
	});

	gulp.task('watch:js', function () {

		gulp.watch(paths.js, onChangeJs);

	});

	gulp.task('watch:scss', function () {
		var scssSrc = [
				// include *.scss
				paths.scss,
				// exclude scss thar start with _*
				'!' + './scss/**/_*'
			],
			_scssSrc = './scss/**/_*.scss';

		gulp.watch(scssSrc, onChangeScss);

		gulp.watch(_scssSrc, onChange_Scss);

	});

	gulp.task('watch:css', function () {
		var cssSrc = paths.css + '*.css';

		gulp.watch(cssSrc, onChangeCss);
	});

	gulp.task('livereload:init', function () {
		livereload.listen({
			basePath: __dirname + '/html',
			start: true
		});
	});

	/*
	 *  Minify all *.scss files in resources/scss:
	 *   - minified  files (*.css)
	 *   - upload minified files to FTP server
	 */
	gulp.task('minify:scss', function () {

		gulp.src([
			// include *.scss
			paths.scss,
			// exclude scss thar start with _*
			'!' + './scss/_*'
		])
			// pipe fallback function
			.pipe(plumber({
				errorHandler: notify.onError({
					title: 'Scss error',
					message: '<%= error.message %>',
					wait: true,
					sticky: true,
					time: 50000
				})
			}))
			// Compile to css
			.pipe(sourcemaps.init())
			.pipe(sass())
			.pipe(minifyCSS())
			// Minify css files
			.pipe(gulpIf(isDev, sourcemaps.write(paths.cssMap)))
			// save the css
			.pipe(gulp.dest(paths.css))
			// Notify on done
			.pipe(notify({title: 'Scss File compiled', message: '<%= file.relative %>'}));
	});

	/**
	 * production environment
	 *
	 */
	gulp.task('env-pro', function () {
		process.env.NODE_ENV = 'production';
	});

	/**
	 * development environment
	 */
	gulp.task('env-dev', function () {
		process.env.NODE_ENV = 'development';
	});

	/*
	 * Run `build` task to minify all the files for the production env.
	 */
	gulp.task('build', ['env-pro', 'livereload:init', 'watch:scss', 'watch:css', 'watch:js'], function () {

		notifier.notify({title: 'Production', message: 'Gulp is ready in production environment.'});
	});

	/*
	 * Run default task and start working on development environment.
	 */
	gulp.task('default', ['env-dev', 'livereload:init', 'watch:scss', 'watch:css', 'watch:js'], function () {
		notifier.notify({title: 'Development', message: 'Gulp is ready in development environment.'});
	});

	console.log('==================================');
	console.log('ENV => ', process.env.NODE_ENV);
	console.log('==================================');
})();
