// Generated on 2014-03-18 using generator-angular 0.7.1
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);
  require('time-grunt')(grunt);

  grunt.registerMultiTask('echoMessage', 'Echo message', function () {
      grunt.log.writeln(grunt.log.wordlist([this.data], {color: 'yellow'}));
  });
  
  grunt.initConfig({
    yeoman: {
      // configurable paths
      app: require('./bower.json').appPath || 'app',
      dist: 'dist'
    },
    watch: {
       coffee: {
        files: ['<%= yeoman.app %>/scripts/{,*/}*.coffee'],
        tasks: ['coffee:dist']
      },
      coffeeTest: {
        files: ['test/spec/{,*/}*.coffee'],
        tasks: ['coffee:test']
      },
      livereload: {
        options: {
          livereload: '<%= connect.options.livereload %>'
        },
        files: [
          '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
        ]
      }
    },
    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost',
        livereload: 35729
      },
      livereload: {
        options: {
          open: true,
          base: [
            '.tmp',
            '<%= yeoman.app %>'
          ]
        }
      },
      test: {
        options: {
          port: 9001,
          base: [
            '.tmp',
            'test',
            '<%= yeoman.app %>'
          ]
        }
      },
      dist: {
        options: {
          base: '<%= yeoman.dist %>'
        }
      }
    },
    clean: {
      dist: {
        files: [{
          dot: true,
          src: [
            '.tmp',
            '<%= yeoman.dist %>/*',
            '!<%= yeoman.dist %>/.git*'
          ]
        }]
      },
      // cleans cdnified and test components
      deploy: {
          src: [
              '<%= yeoman.dist %>/bower_components/angular',
              '<%= yeoman.dist %>/bower_components/jquery',
          ]
      },
      server: '.tmp'
    },
    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      all: [
        '<%= yeoman.app %>/scripts/{,*/}*.js'
      ]
    },
     coffee: {
      options: {
        sourceMap: true,
        sourceRoot: ''
      },
      dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.app %>/scripts',
          src: '{,*/}*.coffee',
          dest: '.tmp/scripts',
          ext: '.js'
        }]
      },
      test: {
        files: [{
          expand: true,
          cwd: 'test/spec',
          src: '{,*/}*.coffee',
          dest: '.tmp/spec',
          ext: '.js'
        }]
      }
    },
     // not used since Uglify task does concat,
    // but still available if needed
    concat: {
      dist: {
          src: '<%= yeoman.app %>/scripts/**/*.js',
          dest: '<%= yeoman.dist %>/scripts/icmm_js.js'
      }
    },
    rev: {
      dist: {
        files: {
          src: [
            '<%= yeoman.dist %>/scripts/{,*/}*.js',
          ]
        }
      }
    },
    // Put files not handled in other tasks here
    copy: {
       dist: {
        files: [{
          expand: true,
          dot: true,
          cwd: '<%= yeoman.app %>',
          dest: '<%= yeoman.dist %>',
          src: [
            'bower_components/**/*',
          ]
        }]
      },
    },
    concurrent: {
      server: [
        'coffee:dist',
      ],
      test: [
        'coffee',
      ],
      dist: [
        'coffee',
      ]
    },
    karma: {
      unit: {
        configFile: 'karma.conf.js',
        singleRun: true
      }
    },
    cdnify: {
      dist: {
        html: ['<%= yeoman.dist %>/*.html']
      }
    },
    ngmin: {
     dist: {
        files: [{
          expand: true,
          cwd: '<%= yeoman.dist %>/scripts',
          src: '*.js',
          dest: '<%= yeoman.dist %>/scripts'
        }]
      }
    },
    ngtemplates: {
        dist: {
            options: {
                module: 'de.cismet.crisma.widgets.worldstateTreeWidget.directives',
                htmlmin:  '<%= htmlmin.deploy %>',
                usemin: 'scripts/crisma-worldstate-tree-widget-angular.min.js'
            },
            cwd: '<%= yeoman.app %>',
            src: 'templates/**.html',
            dest: '<%= yeoman.dist %>/scripts/crisma-worldstate-tree-widget-angular.min.js'
        },
        deploy: {
            options: {
                module: 'de.cismet.crisma.widgets.worldstateTreeWidget.directives'
            },
            cwd: '<%= yeoman.app %>',
            src: 'templates/**.html',
            dest: '<%= yeoman.dist %>/scripts/crisma-worldstate-tree-widget-angular-tpl.js'
        }
    },
    // we do this since the grunt-google-cdn plugin is stale, quick and dirty
    replace: {
        cdnify: {
            src: ['<%= yeoman.dist %>/index.html'],
            dest: ['<%= yeoman.dist %>/index.html'],
            replacements: [
                {from: 'bower_components/angular/angular.js', to: '//ajax.googleapis.com/ajax/libs/angularjs/1.2.7/angular.min.js'},
                {from: 'bower_components/jquery/dist/jquery.js', to: '//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js'},
            ]
        },
        // we would like to use uglify but its dead code removal won't find the debug statements as they don't use a 
        // global var but an injected one, maybe reconsider debug config in the future
        debugCode: {
            // this is the concatenated file
            src: ['.tmp/concat/scripts/icmm_js.min.js'],
            dest: ['.tmp/concat/scripts/icmm_js.min.js'],
            replacements: [
                // unfortunately we cannot simply match opening { and count other opening { and then match the last closing one
                // if this is needed some time in the future, we have to match everything and process the text in a to-function
                // 
                {from: /if\s*\(\s*DEBUG\s*\)\s*\{\s*console\s*\.\s*log\s*\(\s*('|").*\1??\s*\)\s*;?\s*\}/g, to: ''}
            ]
            
        }
    },
    uglify: {
        my_target: {
            files: {
                'dist/scripts/icmm_js.min.js': ['<%= yeoman.dist %>/scripts/*.js']
            }
        }
    },
    echoMessage: {
        message: 'REMEMBER TO UPDATE REPLACE AND CLEAN TASKS IF BOWER DEPS ARE CHANGED!'
    }
  });

  grunt.registerTask('serve', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }

    grunt.task.run([
      'clean:server',
      'concurrent:server',
      'connect:livereload',
      'watch'
    ]);
  });

  grunt.registerTask('server', function () {
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve']);
  });

  grunt.registerTask('test', [
    'clean:server',
    'concurrent:test',
    'connect:test',
//    'karma'
  ]);

  grunt.registerTask('build', [
    'clean:dist',
    'concat',
    'concurrent:dist',
    'concat',
    'copy:dist',
    'cdnify',
    'replace:cdnify',
    'clean:deploy',
    'ngmin',
    'replace:debugCode',
    'uglify',
    'echoMessage'
  ]);

  grunt.registerTask('default', [
    'jshint',
    'test',
    'build'
  ]);
};
