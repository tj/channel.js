
const Channel = require('..')
const co = require('co')

const ch = new Channel(0)
const ops = 1e6

// recv stuff
co(function* (){
  const start = new Date

  for (var i = 0; i < ops; i++) {
    yield ch.recv(i)
  }

  const delta = new Date - start
  const secs = delta / 1000

  console.log()
  console.log('  duration: %s', delta)
  console.log('     ops/s: %s', ops/secs)
  console.log()
})

// send stuff
co(function *(){
  for (var i = 0; i < ops; i++) {
    yield ch.send(i)
  }
  ch.close()
}).catch(console.error)
