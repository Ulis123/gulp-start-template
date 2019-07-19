const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const browsersync = require('browser-sync').create();
const htmlmin = require('gulp-htmlmin');
const rigger = require('gulp-rigger');
const autoprefixer = require('gulp-autoprefixer');
const sass = require('gulp-sass');
const csso = require('gulp-csso');
const plumber = require('gulp-plumber');
const debug = require('gulp-debug');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const newer = require('gulp-newer');
const imagemin = require('gulp-imagemin');
const pngquant = require('imagemin-pngquant');
const jpegRecompress = require('imagemin-jpeg-recompress');
const imageminZopfli = require('imagemin-zopfli');
const imageminMozjpeg = require('imagemin-mozjpeg');
const imageminGiflossy = require('imagemin-giflossy');

const paths = {
    html: {
        src: [
            "./src/html/index.html",
        ],
        dist: "./dist/",
        watch: "./src/**/*.html"
    },
    styles: {
        src: "./src/styles/**/*.{sass,scss,css}",
        dist: "./dist/styles/",
        watch: [
            "./src/styles/**/*.{sass,scss,css}"
        ]
    },
    scripts: {
        src: "./src/js/**/*.js",
        dist: "./dist/js/",
        watch: [
            "./src/js/**/*.js"
        ]
    },
    images: {
        src: [
            "./src/img/**/*.{jpg,jpeg,png,gif,svg}",
            "!./src/img/svg/*.svg",
            "!./src/img/favicon.{jpg,jpeg,png,gif}"
        ],
        dist: "./dist/img/",
        watch: "./src/img/**/*.{jpg,jpeg,png,gif,svg}"
    },
    fonts: {
        src: "./src/fonts/**/*.{ttf,otf,woff,woff2}",
        dist: "./dist/fonts/",
        watch: "./src/fonts/**/*.{ttf,otf,woff,woff2}"
    },
    server_config: {
        src: "./src/.htaccess",
        dist: "./dist/"
    }
};

const server = () => {
    browsersync.init({
        server: "./dist/",
        tunnel: true,
        notify: true
    });
};

const serverConfig = () => gulp.src(paths.server_config.src)
    .pipe(gulp.dest(paths.server_config.dist))
    .pipe(debug({
        "title": "Server config"
    }));

const html = () => gulp.src(paths.html.src)
    .pipe(rigger())
    .pipe(plumber())
    .pipe(htmlmin({
        collapseWhitespace: true
    }))
    .pipe(gulp.dest(paths.html.dist))
    .pipe(debug({
        "title": "HTML files"
    }))
    .on("end", browsersync.reload);

const styles = () => gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(csso())
    .pipe(rename({
        suffix: ".min"
    }))
    .pipe(sourcemaps.write("./maps/"))
    .pipe(gulp.dest(paths.styles.dist))
    .pipe(debug({
        "title": "CSS files"
    }))
    .pipe(browsersync.stream());

const scripts = () => gulp.src(paths.scripts.src)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(babel({
        presets: ["@babel/preset-env"]
    }))
    .pipe(uglify())
    .pipe(rename({
        suffix: ".min"
    }))
    .pipe(sourcemaps.write(paths.scripts.dist))
    .pipe(gulp.dest(paths.scripts.dist))
    .pipe(debug({
        "title": "JS files"
    }))
    .on("end", browsersync.reload);

const images = () => gulp.src(paths.images.src)
    .pipe(newer(paths.images.dist))
    .pipe(imagemin([
        imageminGiflossy({
            optimizationLevel: 3,
            optimize: 3,
            lossy: 2
        }),
        imageminZopfli({
            more: true
        }),
        jpegRecompress({
            progressive: true,
            max: 80,
            min: 70
        }),
        imagemin.svgo({
            plugins: [{
                    removeViewBox: false
                },
                {
                    removeUnusedNS: false
                },
                {
                    removeUselessStrokeAndFill: false
                },
                {
                    cleanupIDs: false
                },
                {
                    removeComments: true
                },
                {
                    removeEmptyAttrs: true
                },
                {
                    removeEmptyText: true
                },
                {
                    collapseGroups: true
                }
            ]
        }),
        imageminMozjpeg({
            progressive: true,
            quality: 70
        }),
        pngquant({
            quality: [0.5, 0.6],
            speed: 5
        })
    ]))
    .pipe(gulp.dest(paths.images.dist))
    .pipe(debug({
        "title": "Images"
    }))
    .on("end", browsersync.reload);

const fonts = () => gulp.src(paths.fonts.src)
    .pipe(gulp.dest(paths.fonts.dist))
    .pipe(debug({
        "title": "Fonts"
    }));


gulp.task("watch", function () {
    return new Promise((resolve, reject) => {
        gulp.watch(paths.styles.watch, gulp.series(styles));
        gulp.watch(paths.html.watch, gulp.series(html));
        gulp.watch(paths.fonts.watch, gulp.series(fonts));
        gulp.watch(paths.scripts.watch, gulp.series(scripts));
        gulp.watch(paths.images.watch, gulp.series(images));
        resolve();
    });
});


gulp.task('default', gulp.series(
    gulp.parallel(serverConfig, html, styles, scripts, fonts, images),
    gulp.parallel("watch", server)
));
