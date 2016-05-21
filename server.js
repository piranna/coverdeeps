#!/usr/bin/env node

const archy = require('archy')
const chalk = require('chalk')

const coverdeeps = require('.')

/**
 * Colors the percentage
 * If its bigger or equal 100% you get a green and bold color
 * If its bigger or equal 90% you get only a green color
 * If its bigger or equal to 80% you get a yellow color
 * Everything else is red
 * @example
 *   var colordString = coloredPercentage(0.8)
 * @requires chalk
 * @param    {Number} value The percentage represented as unit
 * @return   {String}       Returns a colored String
 */
function coloredPercentage(value)
{
  var result = (value*100).toFixed(2)+'%'

  if(value >= 1)   return chalk.green.bold(result)
  if(value >= 0.9) return chalk.green(result)
  if(value >= 0.8) return chalk.yellow(result)
  if(value >  0)   return chalk.red(result)

  return chalk.red.bold(result)
}

/**
 * Creates a tree for every dependency
 * @example
 *   Object.keys(dependencies).map(mapCreateTree, dependencies)
 * @param  {String} key The name of the dependency
 * @return {Object}     Returns a object containing the coverage
 *                      for the dependency
 */
function mapCreateTree(key)
{
  return coverdeeps2archy(this[key], key)
}

/**
 * Creates a coverage tree for all dependencies
 * @param   {Object} dependency The dependency itself
 * @param   {String} [key]      If the dependency has no name it retunrs just the
 *                              key of the dependency
 * @returns {Object}            Returns a archy compatible object containing
 *                              a label and nodes property
 */
function coverdeeps2archy(dependency, key)
{
  const name = dependency.name
  if(!name) return key

  const label = name+': '+coloredPercentage(dependency.covered)

  const dependencies = dependency.dependencies
  if(!dependencies) return label

  const nodes = Object.keys(dependencies).sort().map(mapCreateTree, dependencies)
  if(!nodes.length) return label

  const result =
  {
    label: label+' ('+coloredPercentage(dependency.covered_combined)+')',
    nodes: nodes
  }

  return result
}

/**
 * @constant
 * @type {String}
 * @default
 */
const moduleName = process.argv[2] || require('.').name

/**
 * Invokes coverdeeps and calls it with either the a
 * process argument or the name of the module
 */
coverdeeps(moduleName, function(error, result)
{
  if(error) throw error

  console.log(archy(coverdeeps2archy(result)))
})
