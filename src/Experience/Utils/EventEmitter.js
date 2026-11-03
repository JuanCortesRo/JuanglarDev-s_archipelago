export default class EventEmitter {
  constructor() {
    this.callbacks = {}
  }

  on(name, callback) {
    if (!this.callbacks[name]) {
      this.callbacks[name] = []
    }
    this.callbacks[name].push(callback)

    return () => this.off(name, callback)
  }

  off(name, callback) {
    if (!this.callbacks[name]) return
    this.callbacks[name] = this.callbacks[name].filter((cb) => cb !== callback)
  }

  trigger(name, ...args) {
    if (!this.callbacks[name]) return
    this.callbacks[name].forEach((callback) => callback(...args))
  }
}
