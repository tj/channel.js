
const assert = require('assert')
const Channel = require('..')
const co = require('co')

describe('general', function() {
  it('should support recv() after close()', function() {
    const ch = new Channel

    co(function *(){
      yield ch.send('hello')
      yield ch.send('world')
      ch.close()
    })

    return co(function *(){
      const a = yield ch.recv()
      a.should.equal('hello')

      const b = yield ch.recv()
      b.should.equal('world')
    })
  })

  it('should error on send() after close()', function(cb) {
    const ch = new Channel

    co(function *(){
      ch.close()

      try {
        yield ch.send('hello')
      } catch (err) {
        err.message.should.equal('send on closed channel')
        cb()
      }
    })
  })

  it('should recv() undefined after close()', function() {
    const ch = new Channel

    return co(function *(){
      ch.close()

      const a = yield ch.recv()
      assert(a === undefined)

      const b = yield ch.recv()
      assert(b === undefined)
    })
  })
})

describe('unbuffered', function() {
  it('should support send() first', function() {
    const ch = new Channel

    co(function *(){
      yield ch.send('hello')
    })

    return co(function *(){
      const v = yield ch.recv()
      v.should.equal('hello')
    })
  })

  it('should support recv() first', function() {
    const ch = new Channel

    const p = co(function *(){
      const v = yield ch.recv()
      v.should.equal('hello')
    })

    co(function *(){
      yield ch.send('hello')
    })

    return p
  })
})


describe('buffered', function() {
  it('should block send() until received', function() {
    const ch = new Channel(5)
    let lastSent = false

    co(function *(){
      yield ch.send('h')
      yield ch.send('e')
      yield ch.send('l')
      yield ch.send('l')
      yield ch.send('o')

      yield ch.send('!')
      lastSent = true
    })

    return co(function *(){
      assert.equal(yield ch.recv(), 'h')
      assert.equal(yield ch.recv(), 'e')
      assert.equal(yield ch.recv(), 'l')
      assert.equal(yield ch.recv(), 'l')
      assert.equal(yield ch.recv(), 'o')
      assert(!lastSent)
      assert.equal(yield ch.recv(), '!')
    })
  })
})
