/* ============================================================ *\
    SETUP
\* ============================================================ */

'use strict';

// Gulp
var gulp = require('gulp');
var argv = require('yargs').argv;
var runSeq = require('run-sequence');

// Config
var config = require('./_config/project.json');
var creds = require('./_config/creds.json');

config.paths = require('./_config/paths')(config);

/* ============================================================ *\
    TASK MODULES
\* ============================================================ */

require('./gulpTasks/styles.js')(gulp, config, argv);
require('./gulpTasks/scripts.js')(gulp, config, argv);
require('./gulpTasks/sprites.js')(gulp, config);
require('./gulpTasks/image-minify.js')(gulp, config, argv);
require('./gulpTasks/copy-assets.js')(gulp, config);
require('./gulpTasks/clean.js')(gulp);
// require('./gulpTasks/release.js')(gulp, creds);
// require('./gulpTasks/compile-html.js')(gulp);
require('./gulpTasks/local-testing.js')(gulp, config);
require('./gulpTasks/new-component.js')(gulp, argv);

/* ============================================================ *\
	MAIN TASKS
\* ============================================================ */

gulp.task('watch:sass', function () {
  if (!argv.prod) {
    gulp.watch(
      [config.paths.src.styles + '/**/*.scss', config.paths.src.components + '/**/*.scss'],
      ['sass']
    );
  }
});

gulp.task('watch:js', function () {
  if (!argv.prod) {
    gulp.watch(
      [config.paths.src.scripts + '/**/*.js', config.paths.src.components + '/**/*.js'],
      ['scripts']
    );
  }
});

gulp.task('watch:sprites', function () {
  if (!argv.prod) {
    gulp.watch(
      [config.paths.src.images + '/svgs/*.svg'],
      ['sprites']
    );
  }
});

gulp.task('component', function (cb) {
  runSeq(['new-component'], cb);
})

gulp.task('watch', function (cb) {
  runSeq(['watch:sass', 'watch:js', 'watch:sprites'], cb);
});

gulp.task('serve', function (cb) {
  runSeq(['localServer'], cb);
});

// gulp.task('build', function (cb) {
// 	runSeq(['default'], ['copy'], ['compile-html'],  cb);
// });

// gulp.task('release', function (cb) {
// 	runSeq(['build'], ['package-release'],  cb);
// });

gulp.task('dev', function (cb) {
  runSeq(['default'], ['watch'], ['serve'], cb);
});

gulp.task('default', function (cb) {
  runSeq(['clean'], ['sass-generate-contents', 'copy:xml'], ['sass', 'scripts', 'scripts:vendor', 'scripts:ie', 'copy:fonts', 'imagemin'], ['sass:legacy:ie8'], cb);
});

// Karma configuration
module.exports = function(config) {

    var configObj = {

        //Karma jQuery
        //https://github.com/scf2k/karma-jquery

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',


        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['mocha', 'chai'],


        // list of files / patterns to load in the browser
        files: [
            'test/*Spec.js',
            '_source/scripts/**/*.js'
        ],


        // list of files to exclude
        exclude: [
        ],


        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
        },


        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        // reporters: ['progress'],
        reporters: ['mocha'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        //
        // IE, Chrome, SlimerJS, PhantomJS, TrifleJS, BrowserStack
        browsers: ['PhantomJS'],


        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true
    };


    config.set(configObj);
};

var express = require('express'),
	website = express(),
	http = require('http').Server(website),
	path = require('path'),
	logger = require('express-logger'),
	json = require('express-json'),
	bodyParser = require('body-parser'),
	expressSession = require('express-session'),
	methodOverride = require('express-method-override'),
	exphbs = require('express-handlebars'),
	chalk = require('chalk'),
	compression = require('compression');

var publicDir = path.join(__dirname, 'public');

website.engine('hbs', exphbs({
	extname:'hbs',
	defaultLayout:'index.hbs',
	partialsDir: ['views/_partials']
}));

website.enable('strict routing');
website.set('port', process.env.PORT || 3001);
website.set('views', path.join(__dirname, 'views'));
website.set('sassColors', path.resolve(__dirname, '_source/styles/_settings/_settings.colors.scss'));
website.set('folderStructure', path.resolve(__dirname, '_config/project.json'));
website.set('templateHelpers', require(path.resolve(__dirname, '_config/templateHelpers.js'))());
website.set('templateData', 'https://rawgit.com/code-computerlove/website-modern-industrial/master/content.json');
website.set('localJson', '{"blog": "api-feed-blog-list","jobs":"api-feed-jobs-list","content":"content"}');
website.set('apiConfig', path.resolve(__dirname, '_config/apiConfig.json'));
website.set('view engine', 'hbs');
website.set('locale', 'en-gb');
website.use(logger({path: './logs/logfile.txt'}));
website.use(expressSession({secret: '18dhN7skw9AY82jb',
                 saveUninitialized: true,
                 resave: true}));
website.use(json());
website.use(bodyParser.urlencoded({ extended: false }));
website.use(methodOverride());
website.use(require('./utils/expiry-headers'));
website.use(compression());
website.use(express.static(publicDir));
website.use(require('./utils/strip-slash'));



function shouldCompress(req, res) {
  if (req.headers['x-no-compression']) {
    // don't compress responses with this request header
    return false;
  }
  // fallback to standard filter function
  return compression.filter(req, res);
}

// 301 Redirects
require('./routes/redirects')(website);

// Setup routing
require('./routes/styleguide')(website);
require('./routes/blog')(website);
require('./routes/blog-article')(website);
require('./routes/jobs')(website);
require('./routes/jobs-article')(website);
require('./routes/sitemap')(website);
require('./routes/main')(website);

// performance-budget//
require('./performance-budget/performanceBudget')();
// performance-budget//

http.listen(website.get('port'), function(){
	console.log('Website ready, listening on port: ' + website.get('port'));
});

http.on('error', function(err) {

	console.error('');
	console.error(chalk.inverse('SERVER ERROR'))
	console.error(chalk.inverse('Error code: %s'), err.code);

	if(err.code === 'EADDRINUSE'){
		console.error('>> It looks like port ' + chalk.underline(website.get('port')) + ' is being used by another process. The port can only be used by ' + chalk.underline('one') + ' process.');
	}

	console.error('>> ' + chalk.underline('Full Error'), err);
	console.error('');
})

module.exports = website;

(function () {
  'use strict';

	module.exports = function(){
		
			var config = require('./project.json');
			var srcStyles = config.src + '/' + config.dirs.styles;

			return [
				srcStyles + '/_settings/*.scss', 
				'!' + srcStyles + '/_settings/_settings.old-ie-8.scss', 
				srcStyles + '/_tools/_tools.mixins.scss', 
				srcStyles + '/_tools/_tools.functions.scss', 
				srcStyles + '/_tools/*.scss', 
				srcStyles + '/_scope/*.scss', 
				srcStyles + '/_generic/*.scss', 
				srcStyles + '/_elements/*.scss', 
				srcStyles + '/_objects/*.scss',
				srcStyles + '/_components/*.scss',
				'views/_partials/**/*.scss', 
				srcStyles + '/_trumps/*.scss'
			];
		
	};
}());
'use strict';

function getConfig(paths) {
	var _DIR = '/';

	var config =  {
		src: {
			components: paths.dirs.components + _DIR,
			fonts:      paths.src + _DIR + paths.dirs.fonts + _DIR,
			images:     paths.src + _DIR + paths.dirs.images + _DIR,
			scripts:    paths.src + _DIR + paths.dirs.scripts + _DIR,
			styles:     paths.src + _DIR + paths.dirs.styles + _DIR
		},
		dest: {
			fonts:   paths.dest + _DIR + paths.dirs.fonts + _DIR,
			images:  paths.dest + _DIR + paths.dirs.images + _DIR,
			scripts: paths.dest + _DIR + paths.dirs.scripts + _DIR,
			styles:  paths.dest + _DIR + paths.dirs.styles + _DIR
		}
	};

	return config;
}

module.exports = getConfig;
(function () {
  'use strict';
  module.exports = function() {

    /**
     * Set of handlebar helpers that can be used in templates
     */

    return {
        /**
         * Get the string value of a JSON object, useful for debugging template data
         *
         * @param  {Object} obj JSON object
         * @return {String}     Provided object as a string
         *
         * @example
         * {{ json data }}
         */
        json: function(obj) {
            return JSON.stringify(obj);
        },

        /**
         * pass in multiple modifiers (BEM) to be used in partials
         *
         * @param  {modifierList} comma separated string
         * @return {modifier}     start of CSS class
         *
         * @example temaplate
         * {{>myPartial modifier="mod1,mod2" }}
         *
         * @example partial
         * {{ modifierArray modifier 'my-element-class'}}
         */

        modifierArray: function(modifierList, prefix){
            var arr = modifierList.split(',');
            var modifierStr = '';
            for(var i = 0; i < arr.length; i++){
                modifierStr += prefix + '--' + arr[i] + ' ';
            }

            return modifierStr;
        },
        
        /**
         * Helper that repeats blocks of code, providing an index to be utilised
         *
         * @param  {Bool} 	n           Number of times to repeat a code block
         * @param  {Obj} 	options
         * @return {String}             HTML string of content to be put into template
         *
         * @example
         * {{#repeat 4}} <h{{@index}}>Hello, World!</h{{@index}}> {{/repeat}}
         */
    	repeat: function (n, options) {
         	var content = '',
         	count = n - 1;

         	for (var i = 0; i <= count; i++) {
         		var data = {
         			index: i + 1
         		};
         		content += options.fn(this, {data: data});
         	}

         	return content;
         }
    };
  };
}());

/* ============================================================ *\
  Clean build folders
\* ============================================================ */

var del = require('del')

module.exports = function (gulp) {
  gulp.task('clean', function () {
    return del([
      './public/',
      './build/'
    ])
  })
}

/* ============================================================ *\
    COMPILE TEMPLATES / HTML
\* ============================================================ */

var rename = require('gulp-rename');
var handlebars = require('gulp-compile-handlebars');

var handlebarsConfig = require('../_config/handlebars.json');
var templateDataJson = require('../_config/templateData.json');
var templateHelpers = require('../_config/templateHelpers.js')();

module.exports = function(gulp) {

    gulp.task('compile-html', function () {
        var templateData = {
            data: templateDataJson
        },

        options = {
            batch : handlebarsConfig.partials,
            helpers: templateHelpers
        }
        
        return gulp.src(handlebarsConfig.views)
            .pipe(handlebars(templateData, options))
            .pipe(rename({extname: '.html'}))
            .pipe(gulp.dest('build'));
    });

}
/* ============================================================ *\
    MOVE / Copy files
\* ============================================================ */

module.exports = function(gulp, config) {
    gulp.task('copy:fonts', function(){
        return gulp.src([config.paths.src.fonts + '**/*'])
        .pipe(gulp.dest(config.paths.dest.fonts));
    })

    gulp.task('copy', function(){
        return gulp.src(['!' + config.paths.dest.styles, '!' + config.paths.dest.styles + '*.map', config.dest + '/**/*'])
        .pipe(gulp.dest(config.build));
    })

    gulp.task('copy:xml', function(){
        return gulp.src([config.src + '/sitemap.xml'])
        .pipe(gulp.dest(config.dest));
    })

}
/* ============================================================ *\
    IMAGES / minify images
\* ============================================================ */

var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var svgmin = require('gulp-svgmin');

module.exports = function(gulp, config, argv) {
    gulp.task('imagemin', function () {
        return gulp.src(config.paths.src.images + '**/*')
            .pipe(gulpif(argv.prod, imagemin({
                progressive: true,
                svgoPlugins: [{removeViewBox: false}],
                use: [pngquant()]
            }))) //Production only
            .pipe(gulp.dest(config.paths.dest.images));
    });

    gulp.task('svgmin', function () {
        return gulp.src(config.paths.src.images + '**/*.svg')
            .pipe(svgmin({
                plugins: [{
                    removeDimensions: true
                }, {
                    removeTitle: true
                }]
            }))
            .pipe(gulp.dest(config.paths.dest.images));
    });
}
/* ============================================================ *\
    LOCAL TESTING
\* ============================================================ */

var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');

module.exports = function(gulp, config) {

    gulp.task('browser-sync', function() {
        browserSync.init(null, {
            proxy: "http://localhost:3001",
            files: [config.dest + '/' +  '**/*.*'],
            browser: "google chrome",
            port: 7000,
            ui: {
                port: 7001
            }
        }, function browserSyncCallback() {
            console.log('browser-sync ready, listening on port: 7000')
        });
    });


    gulp.task('localServer', function(cb) {

        var started = false;

        //Reload website.js if templateData file changes (among other files)
        return nodemon({
            script: 'website.js',
            ext: 'js json'
        }).on('start', function() {
            if (!started) {
                cb();
                started = true;
            }
        });
    });

}
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');

var viewsPath = path.join(process.cwd(), 'views')
var partialsPath = path.join(viewsPath, '_partials');

var componentPath;
var hbsFileName;
var scssFileName;

module.exports = function(gulp, argv) {

    gulp.task('new-component', function (cb) {

        if(!argv.name) {
            noNameGivenOutput();
        } else {
            createComponentAssets();
        }

        cb();

    });

    function noNameGivenOutput() {
        console.log('');
        console.log('A component must have a name');
        console.log('');
        console.log('Example usage:')
        console.log('gulp component --name header');
        console.log('');
    }

    function createComponentAssets() {
        hbsFileName = argv.name + '.hbs';
        scssFileName = argv.name + '.scss';
        componentPath = path.join(partialsPath, argv.name);

        fs.mkdirSync(componentPath);
        console.log('');
        console.log(chalk.green('✓ Folder "%s" created'), argv.name);

        fs.writeFileSync(path.join(componentPath, hbsFileName), '<h1>' + argv.name +'</h1>', 'utf8');
        console.log(chalk.green('✓ Handlebars file "%s" created'), hbsFileName);

        fs.writeFileSync(path.join(componentPath, scssFileName), '//' + argv.name + ' styles', 'utf8');
        console.log(chalk.green('✓ Sass file "%s" created'), scssFileName);
        console.log('')
        console.log(chalk.bold('Component files created in "%s"'), componentPath);
        console.log('')
    }

}
/* ============================================================ *\
	PACKAGE THE FOLDER UP
\* ============================================================ */

var zip = require('gulp-zip');
var del = require('del');

module.exports = function(gulp, creds) {

	gulp.task('clean', function () {
		return del([
			'./public/',
			'./build/'
		]);
	});

	gulp.task('package-release', function () {

		var d = new Date();
		var packageName = creds.packageName + '' + d.getDay() + '.' + d.getMonth() + '.' + d.getFullYear() + '_' + d.getHours() + '.' + d.getMinutes();

		return gulp.src('build/**/*')
			.pipe(zip(packageName + '.zip'))
			.pipe(gulp.dest('release'));
	});

}
'use strict';

/* ============================================================ *\
    SCRIPTS JS / lint, concat and minify scripts
\* ============================================================ */

// Gulp dependencies
var sourcemaps   = require('gulp-sourcemaps');
var gulpif       = require('gulp-if')
var concat       = require('gulp-concat');

// JavaScript dependencies
var jshint       = require('gulp-jshint');
var uglify       = require('gulp-uglify');

// Config
var jshintConfig = require('../_config/jshint.json');

module.exports = function(gulp, config, argv) {

    gulp.task('scripts', function(){
        return gulp.src(['*.js', '**/*.js', '!node_modules/**/*.js', '!test-generator/**/*.js', '!public/**/*.js'])
            .pipe(jshint(jshintConfig))
            .pipe(jshint.reporter('default'))
            //.pipe(jshint.reporter('fail'))
            .pipe(gulpif(!argv.prod, sourcemaps.init())) //Default only
            .pipe(concat('bundle.js'))
            .pipe(gulpif(argv.prod, uglify())) //Production only
            .pipe(gulpif(!argv.prod, sourcemaps.write('.'))) //Default only
            .pipe(gulp.dest(config.paths.dest.scripts));
    });

    gulp.task('scripts:vendor', function(){
        return gulp.src([config.paths.src.scripts + 'vendor/*.js'])
            .pipe(gulpif(!argv.prod, jshint(jshintConfig))) //Default only
            .pipe(gulpif(!argv.prod, sourcemaps.init())) //Default only
            .pipe(concat('bundle-critical.js'))
            .pipe(gulpif(argv.prod, uglify())) //Production only
            .pipe(gulpif(!argv.prod, sourcemaps.write('.'))) //Default only
            .pipe(gulp.dest(config.paths.dest.scripts));
    });

    gulp.task('scripts:ie', function(){
        return gulp.src([config.paths.src.scripts + 'ie/*.js'])
            .pipe(concat('ie.js'))
            .pipe(gulpif(argv.prod, uglify())) //Production only
            .pipe(gulp.dest(config.paths.dest.scripts));
    });

}
/* ============================================================ *\
    SPRITES
\* ============================================================ */

var svgSpritesheet = require('gulp-svg-spritesheet');
var svg2png = require('gulp-svg2png');

module.exports = function(gulp, config) {

    gulp.task('sprites', function() {
        return gulp.src(config.paths.src.images + 'svgs/*.svg')
            .pipe(svgSpritesheet({
                cssPathNoSvg: '../' + config.dirs.images + '/sprite.png',
                cssPathSvg:   '../' + config.dirs.images + '/sprite.svg',
                padding:      5,
                pixelBase:    config.pixelBaseNoUnit,
                positioning:  'packed',
                templateSrc:  config.src + '/svg-sprite-sass.tpl',
                templateDest: config.paths.src.styles + '_tools/_tools.sprites.scss',
                units:        'em'
            }))
            .pipe(gulp.dest(config.paths.dest.images + 'sprite.svg'))
            .pipe(svg2png())
            .pipe(gulp.dest(config.paths.dest.images + 'sprite.png'));
    });

}
'use strict';
/* ============================================================ *\
    STYLES / SCSS
\* ============================================================ */

// Gulp dependencies
var sourcemaps      = require('gulp-sourcemaps');
var gulpif          = require('gulp-if')
var rename          = require('gulp-rename');

// Sass dependencies
var sgc             = require('gulp-sass-generate-contents');
var sass            = require('gulp-sass');

// CSS dependencies
var autoprefixer    = require('autoprefixer');
var postcss         = require('gulp-postcss');
// var pixrem          = require('pixrem');
var cssNano         = require('cssnano');
var mqPacker        = require('css-mqpacker');

var pxtorem         = require('postcss-pxtorem');
var pxtoremOptions  = require('../_config/pxtorem.json');

// Config
var creds           = require('../_config/creds.json');
var itcss           = require('../_config/itcss');

var stylesConfig = {
  browsers: {
    normal: ['> 5%', 'Android 3'],
    ie8: ['IE 8']
  }
};

var pxtoremFile = require('../_config/pxtorem.json');

module.exports = function (gulp, config, argv) {
  var sassConfig = {
    errLogToConsole: true,
    includePaths: [config.paths.src.components],
    outputStyle: 'compact'
  };

  function getPostCssPlugins (browsers) {
    var plugins = [
      autoprefixer({
        browsers: browsers
      }),
      mqPacker({
        sort: true
      }),
      pxtorem(pxtoremOptions)
    ];

    if (argv.prod) {
      plugins.push(cssNano());
    }

    return plugins;
  }

  function pxToRem () {
    fs.writeFile(fileName, processedCss, function (err) {
      if (err) throw err
      console.log('Rem file written.')
    })
  }

  gulp.task('sass-generate-contents', function () {
    return gulp.src(itcss())
      .pipe(sgc(config.paths.src.styles + 'main.scss', creds))
      .pipe(gulp.dest(config.paths.src.styles));
  });

  gulp.task('sass', ['sprites'], function () {
    return gulp.src(config.paths.src.styles + 'main.scss')
      .pipe(gulpif(!argv.prod, sourcemaps.init())) // Default only
      .pipe(sass(sassConfig))
      .pipe(postcss(getPostCssPlugins(stylesConfig.browsers.normal)))
      .pipe(gulpif(!argv.prod, sourcemaps.write('.'))) // Default only
      .pipe(gulp.dest(config.paths.dest.styles));
  });

  gulp.task('sass:legacy:ie8', ['sprites'], function () {
    return gulp.src(config.paths.src.styles + 'ie8.scss')
      .pipe(sass(sassConfig))
      .pipe(postcss(getPostCssPlugins(stylesConfig.browsers.ie8)))
      .pipe(gulp.dest(config.paths.dest.styles));
  });
}

// Returns merged JSON.
//
// Eg.
// merge( { a: { b: 1, c: 2 } }, { a: { b: 3, d: 4 } } )
// -> { a: { b: 3, c: 2, d: 4 } }
//
// @arguments JSON's
//
// Code from: https://github.com/rxaviers/cldr
// 
module.exports = function() {
    var destination = {},
        sources = [].slice.call( arguments, 0 );
    sources.forEach(function( source ) {
        var prop;
        for ( prop in source ) {
            if ( prop in destination && Array.isArray( destination[ prop ] ) ) {
                
                // Concat Arrays
                destination[ prop ] = destination[ prop ].concat( source[ prop ] );
                
            } else if ( prop in destination && typeof destination[ prop ] === "object" ) {
                
                // Merge Objects
                destination[ prop ] = merge( destination[ prop ], source[ prop ] );
                
            } else {
                
                // Set new values
                destination[ prop ] = source[ prop ];
                
            }
        }
    });
    return destination;
};

//console.log(JSON.stringify(merge({ a: { b: 1, c: 2 } }, { a: { b: 3, d: 4 } })));
var getData = require('../utils/get-api-data.js');

var blog = function (website, apiConfigData) {

	var utils = require('../utils/common.js')();
	var apiData = JSON.parse(apiConfigData);

	this.getAll = function(){

		var dataUrl = apiData.env + '/' + apiData.blog.getAllBlogs;
		return getData(JSON.parse(website.settings.localJson).blog + '.json', dataUrl);

	};

	this.get = function(pageUrl){

		var dataUrl = apiData.env + '/' + apiData.blog.getBlogByUrl + '?link=/blog/' + String(pageUrl);
		var jsonName = pageUrl.replace(/\//g, '-');

		return getData(jsonName + '.json', dataUrl);
	};

}

module.exports = blog
var getData = require('../utils/get-api-data.js');

var jobs = function (website, apiConfigData) {

	var utils = require('../utils/common.js')();
	var apiData = JSON.parse(apiConfigData);

	this.getAll = function(){

		var dataUrl = apiData.env + '/' + apiData.jobs.getAllJobs;
		return getData(JSON.parse(website.settings.localJson).jobs + '.json', dataUrl);

	};

	this.get = function(pageUrl){

		var dataUrl = apiData.env + '/' + apiData.jobs.getJobByUrl + '?link=/jobs/' + String(pageUrl);
		var jsonName = pageUrl.replace(/\//g, '-');

		return getData(jsonName + '.json', dataUrl);
	};

}

module.exports = jobs
var getData = require('../utils/get-api-data.js');

var staticContent = function (website) {

	this.get = function(){

		return getData(JSON.parse(website.settings.localJson).content +'.json', website.settings.templateData);

	};

}

module.exports = staticContent
module.exports = function () {
  'use strict'

  var fs = require('fs')
  var files = {
    root: __dirname,
    styles: '/../public/_client/styles/',
    fonts: '/../public/_client/fonts/',
    images: '/../public/_client/images/'
  }

  var styleSize = 0
  var fontSize = 0
  var imageSize = 0

  var fileSizeObj = {
    'styles': [],
    'fonts': [],
    'images': []
  }

  function init () {
    readDirectory(files.styles, 'styles')
    readDirectory(files.fonts, 'fonts')
    readDirectory(files.images, 'images')

    setTimeout(function () {
      // console.log(fileSizeObj)
    }, 1000)
  }

  function readDirectory (filePath, fileType) {
    fs.readdir(files.root + filePath, function (err, fileName) {
      if (err) throw err
      readFileNames(filePath, fileName, fileType)
    })
  }

  function readFileNames (filePath, fileName, fileType) {
    for (var index = 0; index <= fileName.length; index++) {
      if (fileName[index] === undefined) return

      var isLastItem = false
      if (index === (fileName.length - 1)) {
        isLastItem = true
      }

      getFileSize(filePath, fileName[index], fileType, isLastItem)
    }
  }

  function getFileSize (filePath, fileName, fileType, isLastItem) {
    var stats = fs.statSync(files.root + filePath + fileName)
    var fileSize = (stats['size']) / 1000
    var obj = {
      name: fileName,
      size: fileSize
    }

    fileSizeObj[fileType].push(obj)

    if (fileType === 'styles') {
      styleSize += fileSize
      if (!isLastItem) return
      fileSizeObj[fileType].push(styleSize)
    }
    if (fileType === 'fonts') {
      fontSize += fileSize
      if (!isLastItem) return
      fileSizeObj[fileType].push(fontSize)
    }
    if (fileType === 'images') {
      imageSize += fileSize
      if (!isLastItem) return
      fileSizeObj[fileType].push(imageSize)
    }
  }

  init()
}

var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');

var blogModel = require('../models/blog.js');
var staticContentModel = require('../models/staticContent.js');

Promise.promisifyAll(fs);

var WebsiteController = function (website) {
	// Public functions
	var website = website;
	var utils = require('../utils/common.js')();

	this.get = function(request, response) {
		if (!request.body) return response.sendStatus(400);
		
		var pageUrl = request.params[0];		
		var view = 'blog-article';

		apiConfigRequest = utils.getApiData(website.settings.apiConfig);
		apiConfigRequest.then(function(data){

			var blog = new blogModel(website, data);
			var content = new staticContentModel(website);
			var canonicalUrl = utils.getCanonicalUrl(request);
			
			var fileReqs = [blog.get(pageUrl), content.get()];

			//Asynchronous get data
			Promise.all(fileReqs).then(function(data){
				feedData = JSON.parse(String(data[0]));
				templateData = JSON.parse(String(data[1]));
				url = view;

				response.render(url, createModel({
					feedData: feedData, 
					templateData: templateData,
					canonicalUrl : canonicalUrl,
					articleUrl : canonicalUrl
				}));
			});
		})
		.error(function(){
			response.redirect('/404');
		});

		return;
	};


	function createModel(params){

		var data = params.templateData;
		var article = params.feedData;
		var articleBody = article.Body;
		var summary = article.Summary;
		var meta = article.Meta;
		var articleTitle = summary.Title;
		var articleDate = new Date(summary.ArticleDate).toISOString();
		var articleDateFormatted = utils.formatDate(summary.ArticleDate);
		var articleAuthors = article.Authors;
		var thumbnailUrl = article.Thumbnail.ImageUrl;

		var model = {
			layout: false,
			siteTitle: meta.Title || articleTitle,
			siteDescription: meta.Description,
			title: articleTitle,
			body: articleBody,
			articleDate: articleDate,
			articleDateFormatted: articleDateFormatted,
			articleAuthors: articleAuthors,
			data: data,
			helpers: website.settings.templateHelpers,
			blogNavigationActive: 'is-active',
			showOpenGraph: true,
			thumbnailUrl: thumbnailUrl,
			articleUrl: params.articleUrl,
			theme: data.blog.theme,
			canonicalUrl: params.canonicalUrl
		}

		return model;
	}

};

module.exports = function(website) {
	var controller = new WebsiteController(website);
	website.get('/blog/*', controller.get);

};
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');

var blogModel = require('../models/blog.js');
var staticContentModel = require('../models/staticContent.js');

Promise.promisifyAll(fs);

var WebsiteController = function (website) {
	// Public functions
	var utils = require('../utils/common.js')();

	this.get = function(request, response) {

		var url = utils.parseUrl(request.params[0], 'blog');	

		apiConfigRequest = utils.getApiData(website.settings.apiConfig);
		apiConfigRequest.then(function(data){
			
			var blog = new blogModel(website, data);
			var content = new staticContentModel(website);
	
			var fileReqs = [blog.getAll(), content.get()];
			
			//Asynchronous get data
			Promise.all(fileReqs).then(function(data){
				feedData = JSON.parse(String(data[0]));
				templateData = JSON.parse(String(data[1]));

				response.render(url, createModel({
					feedData: feedData, 
					templateData: templateData,
					canonicalUrl : utils.getCanonicalUrl(request)
				}));
			});
		})
		.error(function(){
			response.redirect('/404');
		});

	};


	function createModel(params){

		var data = params.templateData;
		var blogListData = params.feedData;
		utils.setDates(blogListData, 'ArticleDate');
		
		var firstItem = blogListData.shift();

		var model = {
			layout: false,
			siteTitle: data.blog.metaData.siteTitle,
			siteDescription: data.blog.metaData.siteDescription,
			apiData: blogListData,
			data: data,
			helpers: website.settings.templateHelpers,
			blogNavigationActive: 'is-active',
			theme: data.blog.theme,
			latestArticle: firstItem,
			canonicalUrl: params.canonicalUrl
		}

		return model;
	}

};

module.exports = function(website) {
	var controller = new WebsiteController(website);
	website.get('/blog', controller.get);
};
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');

var jobsModel = require('../models/jobs.js');
var staticContentModel = require('../models/staticContent.js');

Promise.promisifyAll(fs);

var WebsiteController = function (website) {
	// Public functions
	var website = website;
	var utils = require('../utils/common.js')();

	this.get = function(request, response) {
		if (!request.body) return response.sendStatus(400);
		
		var pageUrl = request.params[0];		
		var view = 'jobs-article'

		apiConfigRequest = utils.getApiData(website.settings.apiConfig);
		apiConfigRequest.then(function(data){

			var jobs = new jobsModel(website, data);
			var content = new staticContentModel(website);
			var canonicalUrl = utils.getCanonicalUrl(request);
			
			var fileReqs = [];

			var jsonName = pageUrl.replace(/\//g, '-');

			fileReqs.push(jobs.get(pageUrl), content.get());

			//Asynchronous get data
			Promise.all(fileReqs).then(function(data){
				feedData = JSON.parse(String(data[0]));
				templateData = JSON.parse(String(data[1]));
				url = view;

				response.render(url, createModel({
					feedData: feedData, 
					templateData: templateData,
					canonicalUrl : canonicalUrl,
					articleUrl : canonicalUrl
				}));
			});
		})
		.error(function(){
			response.redirect('/404');
		});

		return;

	};

	function createModel(params){

		var data = params.templateData;
		var article = params.feedData;
		var articleBody = article.Body;
		var summary = article.Summary;
		var meta = article.Meta;
		var articleTitle = summary.Title;
		var articleDate = new Date(summary.PublishedDate).toISOString();
		var articleDateFormatted = utils.formatDate(summary.PublishedDate);
		var articleAuthors = article.Authors;
		var emailLink  = 'mailto:' + data.jobs.email + '?subject=' + articleTitle.replace(/\s/g, '%20');
		

		var model = {
			layout: false,
			siteTitle: meta.Title || articleTitle,
			siteDescription: meta.Description,
			title: articleTitle,
			body: articleBody,
			articleDate: articleDate,
			articleDateFormatted: articleDateFormatted,
			articleAuthors: articleAuthors,
			data: data,
			helpers: website.settings.templateHelpers,
			jobNavigationActive: 'is-active',
			emailLink: emailLink,
			theme: data.jobs.theme,
			canonicalUrl: params.canonicalUrl
		}

		return model;
	}

};

module.exports = function(website) {
	var controller = new WebsiteController(website);
	website.get('/jobs/*', controller.get);

};
var path = require('path');
var Promise = require('bluebird');
var fs = require('fs');

var jobsModel = require('../models/jobs.js');
var staticContentModel = require('../models/staticContent.js');

Promise.promisifyAll(fs);

var WebsiteController = function (website) {
	// Public functions
	var utils = require('../utils/common.js')();

	this.get = function(request, response) {
		var url = utils.parseUrl(request.params[0], 'jobs');

		apiConfigRequest = utils.getApiData(website.settings.apiConfig);
		apiConfigRequest.then(function(data){

			var jobs = new jobsModel(website, data);
			var content = new staticContentModel(website);

			var fileReqs = [jobs.getAll(), content.get()];

			//Asynchronous get data
			Promise.all(fileReqs).then(function(data){
				feedData = JSON.parse(String(data[0]));
				templateData = JSON.parse(String(data[1]));

				response.render(url, createModel({
					feedData: feedData, 
					templateData: templateData,
					canonicalUrl : utils.getCanonicalUrl(request)
				}));
			});
		})
		.error(function(){
			response.redirect('/404');
		});


	};

	function createModel(params){

		var data = params.templateData;
		var jobsListData = params.feedData;
		utils.setDates(jobsListData, 'PublishedDate');

		var model = {
			layout: false,
			siteTitle: data.jobs.metaData.siteTitle,
			siteDescription: data.jobs.metaData.siteDescription,
			apiData: jobsListData,
			data: data,
			helpers: website.settings.templateHelpers,
			jobNavigationActive: 'is-active',
			theme: data.jobs.theme,
			canonicalUrl: params.canonicalUrl
		}

		return model;
	}

};

module.exports = function(website) {	
	var controller = new WebsiteController(website);
	website.get('/jobs', controller.get);

};
var path = require('path');
var fs = require('fs');
var refreshData = require('../utils/refresh-api-data.js');

var blogModel = require('../models/blog.js');
var staticContentModel = require('../models/staticContent.js');

var WebsiteController = function (website) {
	// Public functions
	var utils = require('../utils/common.js')();

	this.get = function(request, response) {
		if (!request.body) return response.sendStatus(400);

		var url = utils.parseUrl(request.params.loc, 'index');

		apiConfigRequest = utils.getApiData(website.settings.apiConfig);
		apiConfigRequest.then(function(data){

			var blog = new blogModel(website, data);
			var content = new staticContentModel(website);

			var fileReqs = [blog.getAll(), content.get()];

			//Asynchronous get data
			Promise.all(fileReqs).then(function(data){
				feedData = JSON.parse(String(data[0]));
				templateData = JSON.parse(String(data[1]));

				response.render(url, createModel({
					feedData: feedData, 
					templateData: templateData,
					canonicalUrl : utils.getCanonicalUrl(request)
				}));

				//update data if requested
				var qs = request.query.publish;
				if(qs){
					refreshData(qs, website);
				}

			});
		})
		.error(function(err){
			console.error(err);
			response.redirect('/404');
		});

	};

	function createModel(params){
		var blogListData = params.feedData;
		var data = params.templateData;
		var firstItem = blogListData.shift();
		utils.setDates([firstItem], 'ArticleDate');

		var model = {
			layout: false,
			siteTitle: data.metaData.siteTitle,
			siteDescription: data.metaData.siteDescription,
			data: data,
			helpers: website.settings.templateHelpers,
			blogContent: firstItem,
			canonicalUrl: params.canonicalUrl
		}
		return model;
	}

};

module.exports = function(website) {
	var controller = new WebsiteController(website);
	website.get(['/','/:loc'], controller.get);

};
redirect = require("express-redirect");

module.exports = function(website) {

	redirect(website);

	website.redirect("/approach*", "/", 301);
	website.redirect("/services*", "/", 301);
	website.redirect("/work*", "/", 301);
	website.redirect("/contact*", "/", 301);
	website.redirect("/privacy-policy*", "/", 301);
	website.redirect("/terms-conditions*", "/", 301);
	website.redirect("/blogs*", "/blog", 301);
};
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));

var WebsiteController = function (website) {
	this.get = function(request, response) {
		response.header('Content-Type', 'application/xml');

		getSitemap()
			.then(function(content) { 
				response.send(content);
			})
			.error(function() { 
				response.redirect('/404');
			});
	};

	function getSitemap() {
		var sitemap = './public/_client/sitemap.xml';
		return fs.readFileAsync(sitemap);
	}
}

module.exports = function(website) {
	var controller = new WebsiteController(website);
	website.get('/sitemap.xml', controller.get);
};
(function () {
  'use strict';
	var fs = require('fs');

	var staticContentModel = require('../models/staticContent.js');

	var WebsiteController = function (website) {
		// Public functions
		var utils = require('../utils/common.js')();

		this.get = function(request, response) {
			if (!request.body) {
				return response.sendStatus(400);
			}

			var content = new staticContentModel(website);

			//Asynchronous get data
			content.get().then(function(data){
				var templateData = JSON.parse(String(data));

				response.render('styleguide', createModel({
					templateData: templateData,
					canonicalUrl : utils.getCanonicalUrl(request)
				}));
			})
			.error(function(){
				response.redirect('/404');
			});



			//response.render('styleguide', createModel({canonicalUrl : utils.getCanonicalUrl(request)}));
		};

		function createModel(params){
	    var colArr = getFileContents(website.settings.sassColors);

			var model = {
				layout: false,
				data: params.templateData,
				helpers: website.settings.templateHelpers,
				colors: colArr,
				canonicalUrl: params.canonicalUrl
			}
			return model;
		}

		function getFileContents(file){
			var colorItem;
			var regHex = /#\w+;/g;
			var colArr = [];

			file = fs.readFile(file, 'utf8', function (err,data) {

				while (colorItem = regHex.exec(data)){
					var color = colorItem[0].replace(';','');
					if(colArr.indexOf(color) === -1){ 
						colArr.push(color);
					}
				}

				return data;

			});

			return colArr;
		}

	};

	module.exports = function(website) {
		var controller = new WebsiteController(website);
		website.get('/styleguide', controller.get);

	};
}());

/*jshint expr: true, es5: true */

(function () {
    'use strict';
    describe('As a test test', function() {

        // Enables chai should syntax
        //
        // rather than assert.equals(valueOne, valueTwo)
        //
        // valueOne.should.equal(valueTwo);
        chai.should();

        // before('Runs before ANY tests have run', function(){

        // });

        // beforeEach('Runes before each individual test has run',function() {

        // });

        describe('When I test', function() {

            it('should complete test, checking that true is equal to true', function() {
                expect(true).to.be.true;
            });

        });

        // afterEach('Runs after each individual test has run', function() {

        // });

        // after('Runs after ALL tests have run', function() {

        // });

    });
}());

(function () {
	'use strict';

	var fs = require('fs');
	var rp = require('request-promise');
	var path = require('path');

	module.exports = function(){

		var utils = {}; 

		utils.getApiData = function (filePath){
			var file = fs.readFileAsync(filePath, 'utf8', function (err,data) {
					if(err){
						return err;
					}
					return data;
				});
			return file;
		};

		utils.getApiServiceData = function(url){
			return rp(url);
		};

		utils.saveFile = function(dir,content,name){

			if (!fs.existsSync(dir)){
			    fs.mkdirSync(dir);
			}

			var filepath = path.join(dir, name);

			return fs.writeFileAsync(filepath, JSON.stringify(content));
		};

		utils.parseUrl = function(url, page){
			if(url === '/' || url === '' || url === undefined || url === 'favicon.ico'){
				// this acts as the default view file when working locally
				url = page;
			}else {
				url = '404';
			}
			return url;
		};

		utils.formatDateNum = function(str){
			str = String(str);
			return (str.length === 1) ? ('0' + str) : str;
		};

		utils.formatDate = function(isoString){
			var d = new Date(isoString);
			var day = String(d.getDay());
			var month = String(d.getMonth());
			var cDay = utils.formatDateNum(day);
			var cMonth = utils.formatDateNum(parseInt(month)+1);
			return cDay + '.' + cMonth + '.' + d.getFullYear();
		};

		utils.getSingleAuthor = function(arr){
			return arr[0];
		};

		utils.setDates = function(listData,prop){
			for (var i = 0; i < listData.length; i++){
				var d = listData[i][prop];
				listData[i].PublishedDate = utils.formatDate(d);
				listData[i].ArticleDateFormatted = utils.formatDate(d);
				listData[i].ArticleDate = new Date(d).toISOString();
			}
		};

		utils.getCanonicalUrl = function(request){

			return request.protocol + '://' + request.get('host') + request.originalUrl.replace(/\/$/, '');
		};

		return utils;
	};
}());


(function () {
	'use strict';

	module.exports = function(req, res, next) {
	    if(req.url.indexOf('/') === 0 || 
	    	req.url.indexOf('/_client/styles/') === 0 || 
	    	req.url.indexOf('/_client/images/') === 0 || 
	    	req.url.indexOf('/_client/fonts/') === 0) {
	        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
	        res.setHeader('Expires', new Date(Date.now() + 604800000).toUTCString());
	    }

	    return next();
	};
}());
(function () {
  'use strict';

	var fs = require('fs'),
		path = require('path'),
		Promise = require('bluebird');

	Promise.promisifyAll(fs);

	module.exports = function(fileName, fallbackUrl){

		var utils = require('./common.js')();

		var location = path.join(__dirname, '../_api-data/');
		var filePath = path.join(location, fileName);


		if (fs.existsSync(filePath)){
			return utils.getApiData(filePath).then(function(data){
				return data;
			}).error(function(err){
				console.log(err);
			});
		}

		return utils.getApiServiceData(fallbackUrl)
				.then(function(data){
					//save new data
					utils.saveFile(location, JSON.parse(data), fileName);
					
					return data;

				})
				.error(function(err){
					console.log(err);
				});
	};
}());
(function () {
  'use strict';

	var fs = require('fs'),
	path = require('path'),
	Promise = require('bluebird');
	

	Promise.promisifyAll(fs);

	module.exports = function(type, website){
		var utils = require('./common.js')(website);

		var newData;
		var blogList;
		var jobsList;
		var jobArticle;
		var blogArticle;
		var fileName;
		var apiConfig = utils.getApiData(website.settings.apiConfig);

		function doNothing(){
				return new Promise(function(){
					// do nothing
					console.error('publish querystring value not handled: querystring = ' + String(type));
				});
			}

		apiConfig.then(function(apiPaths){
			apiPaths = JSON.parse(apiPaths);
			blogList = apiPaths.env + '/' + apiPaths.blog.getAllBlogs;
			jobsList = apiPaths.env + '/' + apiPaths.jobs.getAllJobs;
			jobArticle = apiPaths.env + '' + apiPaths.jobs.getJobByUrl + '?link=/jobs/' + String(type);
			blogArticle = apiPaths.env + '' + apiPaths.blog.getBlogByUrl + '?link=/blog/' + String(type);

			switch(type){
				case 'content':
							newData = utils.getApiServiceData(website.settings.templateData);
							fileName = JSON.parse(website.settings.localJson).content;
							break;
				case	'blog-list':
							newData = utils.getApiServiceData(blogList);
							fileName = JSON.parse(website.settings.localJson).blog;
							break;
				case	'job-list':
							newData = utils.getApiServiceData(blogList);
							fileName = JSON.parse(website.settings.localJson).jobs;
							break;
				default: newData = doNothing();
							break;
			}		

			newData.then(function(data){
				//replace existing file or add new one

				var location = path.join(__dirname, '../_api-data/');
				fileName = fileName +'.json';

				utils.saveFile(location, JSON.parse(data), fileName);

			}).error(function(err){
				console.error(err);
				//do nothing.
			});

		});

	};
}());
(function () {
  'use strict';

	module.exports = function(req, res, next) {
	    if (req.path.substr(-1) === '/' && req.path.length > 1) {
	        var query = req.url.slice(req.path.length);
	        res.redirect(301, req.path.slice(0, -1) + query);
	    } else {
	        next();
	    }
	};
}());

(function () {
  'use strict';

  var http = require('http');
  var chai = require('chai');

  function getRequest(url, assertion, done) {
    http.get(url, function(res){
      var body = '';
      res.on('data', function(d){
        body += d;
      })
      .on('end', function(){
        assertion(body);
        done();
      });
      
    });
  }

  describe('as a dev I want to request an api service', function() {

    chai.should();

    var jsonObj;

    describe('When I call the api for all blogs', function() {

    	var url = 'http://code.website.2.web2008.dev/Umbraco/Api/BlogsApi/GetAllBlogs/';    

    	it('should return json data containing a list of published blogs', function(done){
    		
    		var assertion = function(body) {
  				jsonObj = JSON.parse(body);
  				jsonObj.should.be.an('array');
  			};

  			getRequest(url, assertion, done);
    		
    	});
    	
    	it('should include url data for each item', function(done){
    		var assertion = function(body){
    			jsonObj = JSON.parse(body)[0];
  				jsonObj.should.have.property('Url');
    		};
    		
    		getRequest(url, assertion, done);

    	});

    });

    describe('When I call the api for jobs', function() {

    	var url = 'http://code.website.2.web2008.dev/Umbraco/Api/JobsApi/GetAllJobs/';

    	it('should return json data containing a list of published jobs', function(done) {
  			var assertion = function(body) {
  				jsonObj = JSON.parse(body);
  				jsonObj.should.be.an('array');
    		};

  			getRequest(url, assertion, done);
    	
    	});	

    	it('should include job title data for each item', function(done){      
    		var assertion = function(body){
    			jsonObj = JSON.parse(body)[0];
    			jsonObj.should.have.property('Title');
    		};

    		getRequest(url, assertion, done);

    	});

    });
  });
}());
(function(window, undefined){
	'use strict';

	var Website = Website || {};

	Website = function(){

		function init(){
			
		}

		init();
	};

})(window);
//vendor file
//# sourceMappingURL=bundle.js.map
