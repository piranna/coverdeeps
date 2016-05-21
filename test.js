const assert = require('assert')

const coverdeeps = require('.')

const name = require('./package.json').name


it('0% coverage', function(done)
{
  this.timeout(5000)

  coverdeeps(name, function(err, result)
  {
    assert.ifError(err)

    assert.strictEqual(result.covered, 0)

    done()
  })
})
