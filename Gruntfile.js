module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.css': ['src/css/*.css']
        }
      }
    },
    watch: {
      files: ['src/**/*'],
      tasks: ['build']
    },
    concat: {
      dist: {
        options: {
          banner: '(function(window, document, undefined) {\n\'use strict\';\nangular.module("<%= pkg.name %>", []);\n',
          footer: '\n})(window, document);\n',
          process: function(src, filepath) {
            return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          }
        },
        files: {
          'dist/<%= pkg.name %>.js': ['src/js/*.js']
        }
      },
      dist_tpls: {
        options: {
          banner: '(function(window, document, undefined) {\n\'use strict\';\nangular.module("<%= pkg.name %>", ["templates"]);\n',
          footer: '\n})(window, document);\n',
          process: function(src, filepath) {
            return src.replace(/(^|\n)[ \t]*('use strict'|"use strict");?\s*/g, '$1');
          }
        },
        files: {
          'dist/<%= pkg.name %>-tpls.js': ['dist/<%= pkg.name %>-tpls.js', 'src/js/*.js']
        }
      }
    },
    uglify: {
      dist: {
        files: {
          'dist/<%= pkg.name %>.min.js': ['dist/<%= pkg.name %>.js']
        }
      },
      dist_tpls: {
        files: {
          'dist/<%= pkg.name %>-tpls.min.js': ['dist/<%= pkg.name %>-tpls.js']
        }
      }
    },
    html2js: {
      dist: {
        options: {
          module: 'templates',
          base: 'src/html'
        },
        files: {
          'dist/<%= pkg.name %>-tpls.js': ['src/html/*.html']
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-html2js');

  grunt.registerTask('build', [
    'html2js',
    'cssmin:dist',
    'concat:dist',
    'uglify:dist',
    'concat:dist_tpls',
    'uglify:dist_tpls'
  ]);

  grunt.registerTask('default', ['build']);

};