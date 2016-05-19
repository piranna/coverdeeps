'use strict'

const path     = require('path')
const https    = require('https')
const url      = require('url')
const basename = path.basename
const get      = https.get
const parse    = url.parse

const async    = require('async')
const concat   = require('concat-stream')
const npm      = require('npm-remote-ls')
const RemoteLS = npm.RemoteLS

const COVERALL_IO = 'https://coveralls.io/github'

/**
 * Asynchronously returns the test coverage of a dependency
 * @example
 *   getPercentageProject('git+https://github.com/piranna/coverdeeps.git', function(err, percentage) {})
 * @param    {String}   repo     The Name of the dependency
 * @param    {Function} callback The callback
 * @requires path:basename
 * @requires https:get
 * @requires url:parse
 * @returns  {Function}          Returns the callback with an error if the
 *                              http code is higher or equal 400, or it returns
 *                              the percentage for the dependency
 *
 */
function getPercentageProject(repo, callback)
{
  repo = parse(repo).pathname.split('/')

  const user = repo[repo.length-2]
  repo = basename(repo[repo.length-1], '.git')

  get(COVERALL_IO+'/'+user+'/'+repo+'.json',
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


function coverdeeps(moduleName, callback)
{
  RemoteLS({development: false}).ls(moduleName, 'latest', function(tree) {
    if(!tree) return callback(new Error(moduleName+' not found on NPM registry'))

    calcPercentage(tree, callback)
  });
}


module.exports = coverdeeps
