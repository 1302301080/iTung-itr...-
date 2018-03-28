/*!
{*******************************************************************}
{                                                                   }
{       eBroker Systems Javascript Component Library                }
{                                                                   }
{                                                                   }
{       Copyright(c) 2000-2016 eBroker Systems Ltd.                 }
{       ALL RIGHTS RESERVED                                         }
{                                                                   }
{   RESTRICTIONS                                                    }
{                                                                   }
{   THIS SOURCE CODE AND ALL RESULTING INTERMEDIATE FILES           }
{   ARE CONFIDENTIAL AND PROPRIETARY TRADE                          }
{   SECRETS OF EBROKER SYSTEMS LTD.THE REGISTERED DEVELOPER IS      }
{   LICENSED TO DISTRIBUTE THE PRODUCT AND ALL ACCOMPANYING         }
{   JAVASCRIPT FUNCTIONS AS PART OF AN EXECUTABLE PROGRAM ONLY.     }
{                                                                   }
{   THE SOURCE CODE CONTAINED WITHIN THIS FILE AND ALL RELATED      }
{   FILES OR ANY PORTION OF ITS CONTENTS SHALL AT NO TIME BE        }
{   COPIED, TRANSFERRED, SOLD, DISTRIBUTED, OR OTHERWISE MADE       }
{   AVAILABLE TO OTHER INDIVIDUALS WITHOUT EXPRESS WRITTEN CONSENT  }
{   AND PERMISSION FROM EBROKER SYSTEMS LTD.                        }
{                                                                   }
{   CONSULT THE END USER LICENSE AGREEMENT FOR INFORMATION ON       }
{   ADDITIONAL RESTRICTIONS.                                        }
{                                                                   }
{*******************************************************************}

{ $Id: Gruntfile.js,v 1.30 2017/12/26 03:14:33 leowong Exp $ Copyright 2000-2016 eBroker Systems Ltd. }
*/

module.exports = function (grunt) {
    grunt.initConfig({
        rootPath: './',
        bower_componentsFolder: '../bower_components',
        publicFolder: './public',
        stylesheetsFolder: './public/stylesheets',
        javascriptsFolder: './public/javascripts',
        releaseFolder: './release/',
        concat: {
            global: {
                src: ['<%= publicFolder %>/iTrader/src/js/oms.js', '<%= publicFolder %>/iTrader/src/js/common.js', '<%= publicFolder %>/iTrader/src/js/socket.js',
                    '<%= publicFolder %>/iTrader/src/js/data.js', '<%= publicFolder %>/iTrader/src/js/rules.js', '<%= publicFolder %>/iTrader/src/js/dialog.js',
                    '<%= publicFolder %>/iTrader/src/js/component/search_product.js', '<%= publicFolder %>/iTrader/src/js/component/settlement.js',
                    '<%= publicFolder %>/iTrader/src/js/component/cash_transfer.js'],
                dest: '<%= publicFolder %>/iTrader/dist/js/iTrader.global.js'
            },
            trade: {
                src: [
                    '<%= publicFolder %>/iTrader/src/js/trade.js'],
                dest: '<%= publicFolder %>/iTrader/dist/js/iTrader.trade.js'
            },
            assets: {
                src: ['<%= publicFolder %>/iTrader/src/js/assets.js'],
                dest: '<%= publicFolder %>/iTrader/dist/js/iTrader.assets.js'
            },
            user: {
                src: ['<%= publicFolder %>/iTrader/src/js/common.js', '<%= publicFolder %>/iTrader/src/js/user.js', '<%= publicFolder %>/iTrader/src/js/rules.js',
                    '<%= publicFolder %>/iTrader/src/js/dialog.js', '<%= publicFolder %>/iTrader/src/js/rules.js'],
                dest: '<%= publicFolder %>/iTrader/dist/js/iTrader.user.js'
            },
            risk: {
                src: ['<%= publicFolder %>/iTrader/src/js/risk.js', '<%= publicFolder %>/iTrader/src/js/common.js'],
                dest: '<%= publicFolder %>/iTrader/dist/js/iTrader.risk.js'
            },
            seajs: {
                src: ['<%= publicFolder %>/iTrader/src/js/sea.js'],
                dest: '<%= publicFolder %>/iTrader/dist/js/iTrader.sea.js'
            },
            shared: {
                src: ['<%= publicFolder %>/shared/src/js/*.js'],
                dest: '<%= publicFolder %>/shared/dist/js/iTrader.shared.js'
            },
            i18n_en: {
                src: ['<%= publicFolder %>/i18n/src/iTrader_en-US.js', '<%= publicFolder %>/i18n/src/*_en-US.js'],
                dest: '<%= publicFolder %>/i18n/dist/en-US.js'
            },
            i18n_cn: {
                src: ['<%= publicFolder %>/i18n/src/iTrader_zh-CN.js', '<%= publicFolder %>/i18n/src/*_zh-CN.js'],
                dest: '<%= publicFolder %>/i18n/dist/zh-CN.js'
            },
            i18n_hk: {
                src: ['<%= publicFolder %>/i18n/src/iTrader_zh-HK.js', '<%= publicFolder %>/i18n/src/*_zh-HK.js'],
                dest: '<%= publicFolder %>/i18n/dist/zh-HK.js'
            },
            style_light: {
                src: ['<%= publicFolder %>/iTrader/src/css/light/*.css', '<%= publicFolder %>/iTrader/src/css/*.css',
                    '<%= publicFolder %>/iTrader/src/css/mobile.css'],
                dest: '<%= publicFolder %>/iTrader/dist/css/light/iTrader.style.css'
            },
            style_dark: {
                src: ['<%= publicFolder %>/iTrader/src/css/dark/*.css', '<%= publicFolder %>/iTrader/src/css/*.css'],
                dest: '<%= publicFolder %>/iTrader/dist/css/dark/iTrader.style.css'
            },
            style_lightblue: {
                src: ['<%= publicFolder %>/iTrader/src/css/lightblue/*.css', '<%= publicFolder %>/iTrader/src/css/*.css'],
                dest: '<%= publicFolder %>/iTrader/dist/css/lightblue/iTrader.style.css'
            },
            style_mobile: {
                src: ['<%= publicFolder %>/iTrader/src/css/mobile/*.css'],
                dest: '<%= publicFolder %>/iTrader/dist/css/mobile/iTrader.mobile.css'
            },
            style_eipo: {
                src: ['<%= publicFolder %>/eipo/src/css/*.css'],
                dest: '<%= publicFolder %>/eipo/dist/css/iTrader.eipo.style.css'
            }
        },
        uglify: {
            iTrader: {
                options: {
                    mangle: { except: ['jQuery', '$', 'require', 'exports', 'module'] }
                },
                files: [{
                    expand: true,
                    cwd: '<%= publicFolder %>/shared/src/js',
                    src: '**/*.js',
                    dest: '<%= publicFolder %>/shared/dist/js'
                }, {
                    expand: true,
                    cwd: '<%= publicFolder %>/iTrader/src/js',
                    src: '**/*.js',
                    dest: '<%= publicFolder %>/iTrader/dist/js'
                }, {
                    expand: true,
                    cwd: '<%= publicFolder %>/eipo/src/js',
                    src: '**/*.js',
                    dest: '<%= publicFolder %>/eipo/dist/js'
                }]
            },
            iTrader_datatables: {
                files: {
                    '<%= bower_componentsFolder %>/datatables/media/js/dataTables.iTrader.bootstrap.min.js': ['<%= bower_componentsFolder %>/datatables/media/js/dataTables.iTrader.bootstrap.js'],
                }
            }
        },
        copy: {
            fonts: {
                files: [
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootswatch/fonts', src: '*', dest: '<%= stylesheetsFolder %>/bootswatch/fonts' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/font-awesome/fonts', src: '*', dest: '<%= stylesheetsFolder %>/font-awesome/fonts/' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/sui/fonts', src: '*', dest: '<%= stylesheetsFolder %>/sui/fonts' },
                ]
            },
            stylesheets: {
                files: [
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootswatch/', src: ['dark/*.css', 'light/*.css', 'lightblue/*.css'], dest: '<%= stylesheetsFolder %>/bootswatch/' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap3-dialog/dist/css', src: '**/*.css', dest: '<%= stylesheetsFolder %>/bootstrap3-dialog/css/' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/font-awesome/css', src: '*.css', dest: '<%= stylesheetsFolder %>/font-awesome/css/' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/flag-icon-css/css', src: '*.css', dest: '<%= stylesheetsFolder %>/flag-icon-css/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/datatables/media/css', src: '*bootstrap*.css', dest: '<%= stylesheetsFolder %>/datatables/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap-tokenfield/dist/css', src: '*bootstrap*.css', dest: '<%= stylesheetsFolder %>/bootstrap-tokenfield/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery-spinner/dist/css', src: '*.css', dest: '<%= stylesheetsFolder %>/jquery-spinner/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap-datepicker/dist/css', src: '*.css', dest: '<%= stylesheetsFolder %>/bootstrap-datepicker/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery-selectric/public/themes', src: ['dark/*.css', 'light/*.css', 'lightblue/*.css'], dest: '<%= stylesheetsFolder %>/jquery-selectric/themes' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/datatables.net-buttons-dt/css', src: '*.css', dest: '<%= stylesheetsFolder %>/datatables.net-buttons-dt/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/layer/build/skin', src: '**', dest: '<%= stylesheetsFolder %>/layer/skin' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/perfect-scrollbar/css', src: '*.css', dest: '<%= stylesheetsFolder %>/perfect-scrollbar' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/sui/css', src: '*.css', dest: '<%= stylesheetsFolder %>/sui/css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/loaders.css/', src: '*.css', dest: '<%= stylesheetsFolder %>/loaders.css' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/pnotify/dist/custom', src: '*.css', dest: '<%= stylesheetsFolder %>/pnotify' },
                    { expand: true, cwd: '<%= publicFolder %>/iTrader/dist/css/', src: '**/*.css', dest: '<%= stylesheetsFolder %>/iTrader/css' },
                    { expand: true, cwd: '<%= publicFolder %>/eipo/dist/css/', src: '**/*.css', dest: '<%= stylesheetsFolder %>/eipo/css' },
                ]
            },
            javascripts: {
                files: [
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery/dist', src: '*.js', dest: '<%= javascriptsFolder %>/jquery' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/lodash/dist', src: '*.js', dest: '<%= javascriptsFolder %>/lodash' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap/dist/js', src: '*bootstrap*.js', dest: '<%= javascriptsFolder %>/bootstrap/js' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/datatables/media/js', src: ['*bootstrap*.js', '*jquery.dataTables.*js'], dest: '<%= javascriptsFolder %>/datatables/js' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/socket.io-client', src: 'socket.io.js', dest: '<%= javascriptsFolder %>/socket.io-client' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/js-cookie/src', src: 'js.cookie.js', dest: '<%= javascriptsFolder %>/js-cookie' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery-validation/dist', src: '*jquery*.js', dest: '<%= javascriptsFolder %>/jquery-validation' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery-validation/src/localization', src: 'messages*.js', dest: '<%= javascriptsFolder %>/jquery-validation/localization' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap3-dialog/dist/js', src: '*.js', dest: '<%= javascriptsFolder %>/bootstrap3-dialog/js' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap-tokenfield/dist', src: '*.js', dest: '<%= javascriptsFolder %>/bootstrap-tokenfield' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/teamdf/jquery-number', src: '*.js', dest: '<%= javascriptsFolder %>/jquery-number' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery-spinner/dist/js', src: '*.js', dest: '<%= javascriptsFolder %>/jquery-spinner/js' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/bootstrap-datepicker/dist/js', src: '*.js', dest: '<%= javascriptsFolder %>/bootstrap-datepicker/js' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/moment/min', src: 'moment.min.js', dest: '<%= javascriptsFolder %>/moment/min' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/jquery-selectric/public', src: '*.js', dest: '<%= javascriptsFolder %>/jquery-selectric' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/datatables.net-buttons/js', src: '*.js', dest: '<%= javascriptsFolder %>/datatables.net-buttons/js' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/layer/build', src: 'layer.js', dest: '<%= javascriptsFolder %>/layer' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/js-shortcuts', src: 'js-shortcuts.js', dest: '<%= javascriptsFolder %>/js-shortcuts' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/echarts/dist', src: '*.js', dest: '<%= javascriptsFolder %>/echarts' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/seajs/dist', src: 'sea.js', dest: '<%= javascriptsFolder %>/seajs' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/perfect-scrollbar/js', src: '*.js', dest: '<%= javascriptsFolder %>/perfect-scrollbar' },
                    { expand: true, cwd: '<%= bower_componentsFolder %>/pnotify/dist/custom', src: '*.js', dest: '<%= javascriptsFolder %>/pnotify' },
                    { expand: true, cwd: '<%= publicFolder %>/shared/dist/js', src: '*.js', dest: '<%= javascriptsFolder %>/shared' },
                    { expand: true, cwd: '<%= publicFolder %>/iTrader/dist/js', src: 'iTrader*.js', dest: '<%= javascriptsFolder %>/iTrader' },
                    { expand: true, cwd: '<%= publicFolder %>/iTrader/dist/js/modules', src: '**/*.js', dest: '<%= javascriptsFolder %>/iTrader/modules' },
                    { expand: true, cwd: '<%= publicFolder %>/eipo/dist/js', src: '*.js', dest: '<%= javascriptsFolder %>/eipo' },
                ]
            },
            others: {
                files: [
                    { expand: true, cwd: '<%= bower_componentsFolder %>/flag-icon-css/flags', src: '**', dest: '<%= stylesheetsFolder %>/flag-icon-css/flags' },
                ]
            },
            release: {
                files: [
                    { expand: true, cwd: '<%= publicFolder %>/html', src: '**/*', dest: '<%= releaseFolder %>/public/html' },
                    { expand: true, cwd: '<%= publicFolder %>/i18n/dist', src: '**/*', dest: '<%= releaseFolder %>/public/i18n/dist' },
                    { expand: true, cwd: '<%= publicFolder %>/images', src: '**/*', dest: '<%= releaseFolder %>/public/images' },
					{ expand: true, cwd: '<%= publicFolder %>/favicons', src: '**/*', dest: '<%= releaseFolder %>/public/favicons' },
                    { expand: true, cwd: '<%= publicFolder %>/javascripts', src: '**/*', dest: '<%= releaseFolder %>/public/javascripts' },
                    { expand: true, cwd: '<%= publicFolder %>/stylesheets', src: '**/*', dest: '<%= releaseFolder %>/public/stylesheets' },
                    { expand: true, cwd: '<%= rootPath %>/admin/public', src: '**/*', dest: '<%= releaseFolder %>/admin/public' },
                    { expand: true, cwd: '<%= rootPath %>/admin/views', src: '**/*', dest: '<%= releaseFolder %>/admin/views' },
                    { expand: true, cwd: '<%= rootPath %>/admin/config', src: '**/*', dest: '<%= releaseFolder %>/admin/config' },
                    { expand: true, cwd: '<%= publicFolder %>/', src: 'favicon.ico', dest: '<%= releaseFolder %>/public/' },
					{ expand: true, cwd: '<%= rootPath %>/config', src: '**/*', dest: '<%= releaseFolder %>/config' },
                    { expand: true, cwd: '<%= rootPath %>/dll', src: '**/*', dest: '<%= releaseFolder %>/dll' },
                    { expand: true, cwd: '<%= rootPath %>/views', src: '**/*', dest: '<%= releaseFolder %>/views' },
                    { expand: true, cwd: '<%= rootPath %>/', src: 'config.js', dest: '<%= releaseFolder %>/' },
                    { expand: true, cwd: '<%= rootPath %>/', src: 'package.json', dest: '<%= releaseFolder %>/' },
                    { expand: true, cwd: '<%= rootPath %>/', src: 'Messages.xml', dest: '<%= releaseFolder %>/' },
                ]
            }
        },
        watch: {
            scripts: {
                files: ['<%= publicFolder %>/iTrader/src/**/*.js'],
                tasks: ['concat', 'copy'],
            },
        },
    })
    grunt.loadNpmTasks('grunt-contrib-concat')
    grunt.loadNpmTasks('grunt-contrib-uglify')
    grunt.loadNpmTasks('grunt-contrib-watch')
    grunt.loadNpmTasks('grunt-contrib-less')
    grunt.loadNpmTasks('grunt-contrib-copy')

    grunt.registerTask('default', ['concat', 'uglify', 'copy'])
}