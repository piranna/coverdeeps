#!/usr/bin/env node

const archy = require('archy')

const coverdeeps = require('.')


function coloredPercentage(value)
{
  return (value*100).toFixed(2)+'%'
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
