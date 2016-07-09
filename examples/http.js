
const axios = require('axios')
const Channel = require('..')
const co = require('co')

const ch = new Channel(0)

// start workers
for (var i = 0; i < 3; i++) {
  co(worker, i).catch(console.error)
}

// worker
function *worker(i) {
  while (1) {
    const v = yield ch.recv()
    if (!v) break

    console.log('[%d]: GET %s', i, v)
    const res = yield axios.get(v)
    console.log('[%d]: GET %s -> %s', i, v, res.status)
  }

  console.log('[%d]: done', i)
}

// queue some urls
co(function *(){
  yield ch.send('http://yahoo.com')
  yield ch.send('http://facebook.com')
  yield ch.send('http://youtube.com')
  yield ch.send('http://cloudup.com')
  yield ch.send('http://segment.com')
  yield ch.send('http://apex.sh')
  yield ch.send('http://github.com')
  yield ch.send('http://stripe.com')
  ch.close()
}).catch(console.error)
