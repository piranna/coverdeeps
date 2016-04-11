#!/usr/bin/env node

const coverdeeps = require('.')


const moduleName = process.argv[2] || require('.').name

coverdeeps(moduleName, function(error, result)
{
  if(error) throw error

  console.log(result)
})
