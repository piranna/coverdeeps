'use strict'

// Dependencies
const https    = require('https')
const path     = require('path')
const url      = require('url')
const basename = path.basename
const get      = https.get
const parse    = url.parse

const async    = require('async')
const concat   = require('concat-stream')
const npm      = require('npm-remote-ls')
const RemoteLS = npm.RemoteLS

/**
 * @constant
 * @type {String}
 * @default
 */
const COVERALLS_IO = 'https://coveralls.io/github'


function getValueCoveralls(user, repo, callback)
{
  get(COVERALLS_IO+'/'+user+'/'+repo+'.json',
  function(res)
  {
    if(res.statusCode >= 400) return callback(null, 0)

    res.on('error', callback)

    res.pipe(concat(function(body)
    {
      body = JSON.parse(body)
      if(!body) return callback(null, 0)

      callback(null, body.covered_percent/100)  // Per-unit to easier calcs
    }))
  })
}

/**
 * Asynchronously returns the test coverage of a dependency
 * @example
 *   getPercentageProject('git+https://github.com/piranna/coverdeeps.git', function(err, percentage) {})
 * @requires path:basename
 * @requires https:get
 * @requires url:parse
 * @param    {String}   repo     The Name of the dependency
 * @param    {Function} callback The callback
 * @returns  {Function}          Returns the callback with an error if the
 *                               http code is higher or equal 400, or it returns
 *                               the percentage for the dependency
 */
function getPercentageProject(repo, callback)
{
  repo = parse(repo).pathname.split('/')

  const user = repo[repo.length-2]
  repo = basename(repo[repo.length-1], '.git')

  getValueCoveralls(user, repo, callback)
}

/**
 * Asynchronously returns the coverage of all dependencies
 * @example
 *   getPercentageDependencies(['dep1', 'dep2'], function(err, coverage) {})
 * @requires async:map
 * @param    {Array}    dependencies This array holds the dependencies
 *                                   for the module
 * @param    {Function} callback     This callback will be invoked with the result
 *                                   of the coverage
 * @returns  {Function}              Returnes the callback in error first style
 *                                   On Error: It'll return a error from async
 *                                   On Success: It'll return the coverage for
 *                                   all dependencies divided by the length of
 *                                   all dependencies
 */
function getPercentageDependencies(dependencies, callback)
{
  if(!dependencies) return callback(null, 1)

  const keys = Object.keys(dependencies)
  if(!keys.length) return callback(null, 1)

  async.map(dependencies, function(dependency, callback)
  {
    if(typeof dependency === 'string') return callback(null, 1)

    calcPercentage(dependency, callback)
  },
  function(error, results)
  {
    if(error) return callback(error)

    const covered = keys.reduce(function(prev, key)
    {
      return prev + (results[key].covered_combined || 0)
    }, 0)

    callback(null, covered / keys.length)
  })
}

/**
 * Asynchronously calculates the percentage for the
 * module and the module dependencies
 * @example
 *   var pkg = require('./package.json')
 *   calcPercentage(pkg, function(err, module))
 * @requires async:parallel
 * @param    {Object}   module   The module manifesst
 * @param    {Function} callback The callback will be invoked
 *                               with a object containing two new properties
 *                               a) module.covered which has the coverage for
 *                               the module itself and b) the coverage for
 *                               the dependencies of the module
 * @returns  {Function}          Returns the callback with the a
 *                               error or a object containing the coverage
 */
function calcPercentage(module, callback)
{
  async.parallel({
    module:       getPercentageProject     .bind(null, module.repository.url),
    dependencies: getPercentageDependencies.bind(null, module.dependencies)
  },
  function(error, result)
  {
    if(error) return callback(error)

    module.covered          = result.module
    module.covered_combined = result.module * result.dependencies

    callback(null, module)
  })
}

/**
 * Asynchronously calculates the percentage for the module
 * using the npm-remote-ls package for getting the package manifest
 * @example
 *   coverdeeps('moduleName', function(err, result) {  })
 * @requires npm-remote-ls:ls
 * @param  {String}   moduleName Name of the module
 * @param  {Function} callback   Callback is invoked with a error or a result
 * @return {Function}            Returns the callback with a error from the
 *                               npm-remote-ls package or returning
 *                               the percentage of the module
 */
function coverdeeps(moduleName, callback)
{
  RemoteLS({development: false}).ls(moduleName, 'latest', function(tree) {
    if(!tree) return callback(new Error(moduleName+' not found on NPM registry'))

    calcPercentage(tree, callback)
  });
}


module.exports = coverdeeps
