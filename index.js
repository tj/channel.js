
const Deferred = require('deferred')

module.exports = class Channel {

  /**
   * Initialize channel with the given buffer `capacity`. By default
   * the channel is unbuffered. A channel is basically a FIFO queue
   * for use with async/await or co().
   */

  constructor(capacity = 0) {
    this.capacity = capacity
    this.values = []
    this.sends = []
    this.recvs = []
    this.closed = false
  }

  /**
   * Send value, blocking unless there is room in the buffer.
   *
   * Calls to send() on a closed buffer will error.
   */

  send(value) {
    if (this.closed) {
      return Promise.reject(new Error('send on closed channel'))
    }

    // recv pending
    if (this.recvs.length) {
      this.recvs.shift().resolve(value)
      return Promise.resolve()
    }

    // room in buffer
    if (this.values.length < this.capacity) {
      this.values.push(value)
      return Promise.resolve()
    }

    // no recv pending, block
    const promise = new Deferred
    this.sends.push({ value, promise })
    return promise
  }

  /**
   * Receive returns a value or blocks until one is present.
   *
   * A recv() on a closed channel will return undefined.
   */

  recv() {
    // values in buffer
    if (this.values.length) {
      return Promise.resolve(this.values.shift())
    }

    // unblock pending sends
    if (this.sends.length) {
      const send = this.sends.shift()

      if (this.closed) {
        send.promise.reject(new Error('send on closed channel'))
        return Promise.resolve()
      }

      send.promise.resolve()
      return Promise.resolve(send.value)
    }

    // closed
    if (this.closed) {
      return Promise.resolve()
    }

    // no values, block
    const promise = new Deferred
    this.recvs.push(promise)
    return promise
  }

  /**
   * Close the channel. Any pending recv() calls will be unblocked.
   *
   * Subsequent close() calls will throw.
   */

  close() {
    if (this.closed) throw new Error('channel already closed')
    this.closed = true
    const recvs = this.recvs
    this.recvs = []
    recvs.forEach(p => p.resolve())
  }
}
