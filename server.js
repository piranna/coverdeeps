#!/usr/bin/env node

const archy = require('archy')
const chalk = require('chalk')

const coverdeeps = require('.')


function coloredPercentage(value)
{
  var result = (value*100).toFixed(2)+'%'

  if(value >= 1)   return chalk.green.bold(result)
  if(value >= 0.9) return chalk.green(result)
  if(value >= 0.8) return chalk.yellow(result)
  if(value >  0)   return chalk.red(result)

  return chalk.red.bold(result)
}

function mapCreateTree(key)
{
  return coverdeeps2archy(this[key], key)
}

function coverdeeps2archy(dependency, key)
{
  const name = dependency.name
  if(!name) return key

  const label = name+': '
  const covered = coloredPercentage(dependency.covered)

  const dependencies = dependency.dependencies
  if(!dependencies) return label+covered

  const result =
  {
    label: label+coloredPercentage(dependency.covered_combined)+' ('+covered+')',
    nodes: Object.keys(dependencies).sort().map(mapCreateTree, dependencies)
  }

  return result
}


const moduleName = process.argv[2] || require('.').name

coverdeeps(moduleName, function(error, result)
{
  if(error) throw error

  console.log(archy(coverdeeps2archy(result)))
})
