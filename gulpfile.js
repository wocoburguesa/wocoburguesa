var gulp = require('gulp');
var path = require('path');
var merge = require('event-stream').merge;
var args = require('yargs').argv;
var plugins = require('gulp-load-plugins')();
var runSequence = require('run-sequence');
plugins.bower = require('main-bower-files');

var ROOT_DIR = './';
var BOWER_DIR = './bower_components/';
var DIST_DIR = './dist/';
var MEDIA_DIR= './media/';
var SCRIPTS_DIR = './scripts/';
var IMAGES_DIR = './images/';
var VIDEO_DIR = './videos/';
var AUDIO_DIR = './audio/';

var src = {
    styles: [
        ROOT_DIR + 'styles/**/*.css'
    ],
    scripts: [
        ROOT_DIR + 'scripts/**/*.js'
    ],
    templates: [
        ROOT_DIR + 'scripts/**/*.html'
    ]
};

var dest = {
    img: DIST_DIR + 'img/',
    js: DIST_DIR + 'scripts/',
    css: DIST_DIR + 'styles/',
    fonts: DIST_DIR + 'fonts/',
    vfonts: DIST_DIR + 'styles/fonts/',
    json: DIST_DIR + 'json/',
    audio: MEDIA_DIR + 'audio/',
    video: DIST_DIR+'video/'
};

var config = {
    bootstrapDir: './bower_components/bootstrap/dist/css',
};

function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}

gulp.task('scripts-vendor', function () {
    var jsFilter = plugins.filter('**/*.js');
    var listed = gulp.src(plugins.bower(), { base: BOWER_DIR })
        .pipe(jsFilter)
        .pipe(plugins.print(function(filepath) {
            return "script: " + filepath;
        }));

    return listed
        .pipe(plugins.order([
            'bower_components/jquery/**/*.js',
            'bower_components/angular/**/*.js',
            'bower_components/**/*.js'
         ], { base: ROOT_DIR }))
        .pipe(plugins.concat('vendor.js'))
        .pipe(plugins.ngAnnotate())
        .pipe(plugins.if(args.production, plugins.uglify({mangle: true})))
        .pipe(gulp.dest(dest.js))
});

gulp.task('scripts', function () {
    var jsFilter = plugins.filter('**/*.js');
    return gulp.src(src.scripts)
        .pipe(jsFilter)
        .pipe(plugins.if(!args.production, plugins.sourcemaps.init()))
        .pipe(plugins.ngAnnotate({
            add: true
        }))
        .on('error', swallowError)
        .pipe(plugins.concat('main.js'))
        .pipe(plugins.if(args.production, plugins.uglify({mangle: true})))
        .pipe(plugins.if(!args.production, plugins.sourcemaps.write()))
        .pipe(gulp.dest(dest.js));
});

gulp.task('styles-vendor', function () {
    var relative_img_path = path.relative(dest.css, dest.img)
           .replace(path.sep, '/'),
        vendor = gulp.src(BOWER_DIR + '**/*.css')
            .pipe(plugins.filter([
                '**/*.css', '!**/*.min.css'
            ]))
            .pipe(plugins.print(function (filepath) {
                return "stylesheet: " + filepath;
            }))
            .pipe(plugins.replace(
                /url\((["']?)(?:\\?(?:[^\)]+\/)?([^\/\)]+\.(?:gif|jpe?g|png)))*?\1\)/g,
                'url($1' + relative_img_path + '/vendor/$2$1)'
            ));
    return vendor.pipe(plugins.concat('vendor.css'))
        .pipe(plugins.if(args.production, plugins.cleanCss()))
        .pipe(gulp.dest(dest.css));
});

gulp.task('styles', function () {
    var localApp = gulp.src(src.styles)
            .pipe(plugins.filter('**/*.{scss,css}'));
//        localComponents = gulp.src('scripts/app/kroudy_components/**/*.css')
//                .pipe(plugins.filter('**/*.{scss,css}'));
//    return merge(localApp, localComponents)
    return localApp.pipe(plugins.concat('base.css'));
//        .pipe(plugins.if(args.production, plugins.cleanCss()))
//        .pipe(gulp.dest(dest.css));
});

gulp.task('bootstrap-fonts', function () {
  return gulp.src(BOWER_DIR + '/bootstrap/fonts/*.{eot,svg,ttf,woff,woff2}')
        .pipe(gulp.dest(dest.fonts));
});

/*gulp.task('videogular-fonts', function () {
  return gulp.src(BOWER_DIR + '/videogular-themes-default/fonts/*.{eot,svg,ttf,woff,woff2}')
        .pipe(gulp.dest(dest.vfonts));
});*/

gulp.task('fonts', function () {
    return gulp.src(plugins.bower(), { base: BOWER_DIR })
        .pipe(plugins.filter('**/*.{eot,svg,ttf,woff,woff2}'))
        .pipe(plugins.print(function (filepath) {
          // console.log('filepathFonts',filepath);
            return "font: " + filepath;
        }))
        .pipe(plugins.flatten())
        .pipe(gulp.dest(dest.fonts));
});

gulp.task('templates', function () {
    gulp.src(src.templates)
        .pipe(plugins.angularTemplatecache({
            module: 'wocoburguesa'
        }))
        .pipe(plugins.concat('templates.js'))
        .pipe(gulp.dest(dest.js));
});

gulp.task('images', function () {
    return gulp.src(IMAGES_DIR + '**/*.{gif,jpeg,jpg,png,svg}')
        .pipe(plugins.filter('**/*.{gif,jpeg,jpg,png,svg}'))
        .pipe(plugins.print(function (filepath) {
            return "image: " + filepath;
        }))
        .pipe(plugins.flatten())
        .pipe(gulp.dest(dest.img));
});

gulp.task('audios', function () {
    return gulp.src(AUDIO_DIR + '**/*.{mp3,mp4,vod}')
        .pipe(plugins.filter('**/*.{mp3,mp4,vod}'))
        .pipe(plugins.print(function (filepath) {
            return "audio: " + filepath;
        }))
        .pipe(plugins.flatten())
        .pipe(gulp.dest(dest.audio));
});

gulp.task('videos', function () {
    return gulp.src(VIDEO_DIR + '**/*.{mp3,webm,mp4,ogg,mov}')
        .pipe(plugins.filter('**/*.{mp3,webm,mp4,ogg,mov}'))
        .pipe(plugins.print(function (filepath) {
            return "video: " + filepath;
        }))
        .pipe(plugins.flatten())
        .pipe(gulp.dest(dest.video));
});

gulp.task('watch', function () {
    gulp.watch(src.scripts, ['scripts']);
});

gulp.task('compile', function (done) {
    runSequence(
//        ['images', 'scripts', 'bootstrap-fonts','videogular-fonts', 'templates', 'fonts','audios','json','videos'],
//        'scripts-vendor',
//        ['styles-vendor', 'styles'],
//        done
        ['scripts', 'bootstrap-fonts', 'templates', 'fonts','audios','videos'],
        'scripts-vendor',
        ['styles-vendor', 'styles'],
        done
    );
});

gulp.task('default', function () {
    console.log('test');
});
