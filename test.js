const assert = require('chai').assert

const coverdeeps = require('.')

const name = require('./package.json').name


it('module coverage > 95%', function(done)
{
  this.timeout(10000)

  coverdeeps(name, function(err, result)
  {
    assert.ifError(err)

    assert.isAtLeast(result.covered, 0.95)

    done()
  })
})
