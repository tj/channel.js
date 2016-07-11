
const sleep = require('co-sleep')
const Channel = require('..')
const co = require('co')

const ch = new Channel(100)

// Some kind of log consumer
co(function *() {
  while (1) {
    const v = yield ch.recv()
    if (!v) break
    console.log(v)
  }

  console.log('done')
})


for (var i = 0; i < 5; i++) co(worker, i)

// Some kind of log producers which ideally don't block,
// however applying some backpressure via the Channel
// capacity is necessary.
function *worker(i) {
  for (var j = 0; j < 150; j++) {
    yield sleep(Math.random() * 15 | 0)
    yield ch.send(`level=info worker=${i} message="something here ${j}"`)
  }
  ch.close()
}
