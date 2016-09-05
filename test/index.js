
const WaitGroup = require('waitgroup')
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

    co(function *(){
      try {
        yield ch.send('hello')
      } catch (err) {
        err.message.should.equal('send on closed channel')
      }
    })

    return co(function *(){
      ch.close()

      const a = yield ch.recv()
      assert(a === undefined)

      const b = yield ch.recv()
      assert(b === undefined)
    })
  })

  it('should unblock recv()s on close()', function() {
    const wg = new WaitGroup(2)
    const ch = new Channel
    const vals = []

    co(function *(){
      const v = yield ch.recv()
      vals.push(v)
    })

    co(function *(){
      const v = yield ch.recv()
      vals.push(v)
      wg.done()
    })

    co(function *(){
      const v = yield ch.recv()
      vals.push(v)
      wg.done()
    })

    return co(function *(){
      yield ch.send('hello')
      ch.close()

      const v = yield ch.recv()
      assert(v === undefined)

      yield wg.wait()
      vals.should.eql(['hello', undefined, undefined])
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
  it('should block send() when the buffer is full', function() {
    const ch = new Channel(5)
    const wg = new WaitGroup(1)
    const vals = []

    co(function *(){
      yield ch.send('h')
      yield ch.send('e')
      yield ch.send('l')
      yield ch.send('l')
      yield ch.send('o')
      wg.done()
      yield ch.send('!')
      ch.close()
    })

    co(function *(){

    })

    return co(function *(){
      yield wg.wait()

      for (var i = 0; i < 5; i++) {
        vals.push(yield ch.recv())
      }

      vals.should.eql(['h', 'e', 'l', 'l', 'o'])
      assert.equal(yield ch.recv(), '!')
      assert.equal(yield ch.recv(), undefined)
    })
  })
})
