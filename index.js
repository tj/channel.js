
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
   */

  send(value) {
    return new Promise((resolve, reject) => {
      if (this.closed) return reject(new Error('send on closed channel'))

      // recv pending
      if (this.recvs.length) {
        this.recvs.pop().resolve(value)
        return resolve()
      }

      // room in buffer
      if (this.values.length < this.capacity) {
        this.values.push(value)
        return resolve()
      }

      // no recv pending, block
      this.sends.push({ value, resolve, reject })
    })
  }

  /**
   * Receive returns a value, blocking until one is present,
   * or returns undefined which can be used
   * to determine when a channel has been closed.
   */

  recv() {
    return new Promise((resolve, reject) => {
      // values in buffer
      if (this.values.length) {
        return resolve(this.values.pop())
      }

      // unblock pending sends
      if (this.sends.length) {
        const send = this.sends.pop()
        if (this.closed) return send.reject(new Error('send on closed channel'))
        send.resolve()
        return resolve(send.value)
      }

      // closed
      if (this.closed) {
        return resolve()
      }

      // no values, block
      this.recvs.push({ resolve, reject })
    })
  }

  /**
   * Close the channel.
   *
   * Subsequent close() calls will throw.
   */

  close() {
    if (this.closed) throw new Error('channel already closed')
    this.closed = true
  }

  /**
   * Return the number of values in the buffer.
   */

  get length() {
    return this.values.length
  }
}
