const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require("gulp-sass");
sass.compiler = require('sass')
const autoprefixer = require('autoprefixer');
const postcss = require('gulp-postcss');
const when = require('gulp-if')
const sourcemaps = require('gulp-sourcemaps')
const webpackStream = require('webpack-stream')
const browserSync = require('browser-sync').create();
const del = require('del')
const notify = require('gulp-notify')
const imageMin = require('gulp-imagemin')
const cache = require('gulp-cache')

let isDev = true

if(process.env.NODE_ENV === "production"){
  isDev = false
}

gulp.task("pug", function(){
  return gulp.src("./src/templates/pages/*.pug")
              .pipe(pug({
                pretty: true
              }))
              .pipe(gulp.dest('./build'))
})
gulp.task('sass', function(){
  return gulp.src("./src/sass/*.sass")
          .pipe(when(isDev, sourcemaps.init()))
          .pipe(sass({
            includePaths: ['node_modules'],
            outputStyle: isDev ? 'expanded' : 'compressed',
            precision: 5
          }).on('error', sass.logError))
          .pipe(when(!isDev,postcss([autoprefixer({ grid: 'autoplace'})])))
          .pipe(when(isDev, sourcemaps.write('.')))
          .pipe(gulp.dest('./build/css'))
})

function errorHandler(){
  let args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Compile Error',
    message: '<%= error.message %>'
  }).apply(this, args);
  this.emit('end')
}
let webpackConfig = {
  mode: isDev ? "development" : "production",
  output: {
    filename: "[name].js"
  },
  devtool: isDev ? 'cheap-module-inline-source-map' : false,
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: '/node_modules'
      }
    ]
  },
  optimization: {
    noEmitOnErrors: true
  }
}

gulp.task('webpack', function(){
  return gulp.src('./src/js/index.js')
        .pipe(webpackStream(webpackConfig))
        .pipe(gulp.dest('./build/js'))
})


gulp.task('server', function(){
  browserSync.init({
    server: "build",
    notify: false
  })
  browserSync.watch('build/**/*.*').on('change', browserSync.reload)
})


gulp.task('clean', function(){
  return del('build')
})

gulp.task('img', function(){
  return gulp.src('./src/assets/img/**/*.{gif,jpg,png,svg,jpeg}')
          .pipe(cache(imageMin({ optimizationLevel: 3, progressive: true, interlaced: true })))
          .pipe(gulp.dest('./build/assets/img'))
})

gulp.task('fonts', function () {
  return gulp.src('./src/fonts/**/*.*')
      .pipe(gulp.dest('./build/fonts'))
})


gulp.task('watch', function(){
  gulp.watch('src/sass/**/*.*', gulp.series('sass'));
  gulp.watch('src/assets/img/**/*.{gif,jpg,png,svg,jpeg}', gulp.series('img'));
  gulp.watch('src/fonts/**/*.*', gulp.series('fonts'));
  gulp.watch('src/templates/**/*.*', gulp.series('pug'));
  gulp.watch('src/js/**/*.js', gulp.series('webpack'))
})


gulp.task('build', gulp.series('clean', gulp.parallel('sass', 'img', 'fonts', 'pug', 'webpack')));
gulp.task('default', gulp.series('build', gulp.parallel('server', 'watch')))