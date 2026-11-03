import EventEmitter from './EventEmitter.js'

export default class Time extends EventEmitter {
  constructor() {
    super()

    this.start = performance.now()
    this.current = this.start
    this.elapsed = 0
    this.delta = 0.016

    this._rafId = null

    this._tick = () => {
      const now = performance.now()

      this.delta = (now - this.current) / 1000
      if (this.delta > 0.1) this.delta = 0.1

      this.current = now
      this.elapsed = (now - this.start) / 1000

      this.trigger('tick')

      this._rafId = window.requestAnimationFrame(this._tick)
    }

    this._rafId = window.requestAnimationFrame(this._tick)
  }

  destroy() {
    if (this._rafId !== null) {
      window.cancelAnimationFrame(this._rafId)
      this._rafId = null
    }
  }
}
