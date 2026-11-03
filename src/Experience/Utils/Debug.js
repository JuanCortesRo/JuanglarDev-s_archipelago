import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'

export default class Debug extends EventEmitter {
  constructor() {
    super()

    this.experience = new Experience()
    this.active = window.location.hash === '#debug'

    this.ui = null
    this.stats = null
    this.helpersFolder = null
    this.rendererFolder = null

    this._pending = []

    if (this.active) {
      this._bootstrap()
    }
  }

  async _bootstrap() {
    try {
      const [{ default: GUI }, statsModule] = await Promise.all([
        import('lil-gui'),
        import('stats.js'),
      ])

      this.ui = new GUI({ title: 'Debug' })

      const Stats = statsModule.default ?? statsModule
      this.stats = new Stats()
      this.stats.showPanel(0)
      document.body.appendChild(this.stats.dom)

      for (const task of this._pending) task(this.ui)
      this._pending = []

      this.trigger('ready')
    } catch (error) {
      console.error('[Debug] failed to initialise:', error)
    }
  }

  _whenReady(task) {
    if (this.ui) {
      task(this.ui)
    } else {
      this._pending.push(task)
    }
  }

  whenReady(task) {
    if (!this.active) return
    this._whenReady(task)
  }

  addHelper(name, object3D) {
    if (!this.active) return

    object3D.visible = false

    this._whenReady(() => {
      if (!this.helpersFolder) {
        this.helpersFolder = this.ui.addFolder('Helpers')
      }
      this.helpersFolder.add(object3D, 'visible').name(name)
    })
  }

  addRendererMonitor() {
    if (!this.active) return

    this._whenReady(() => {
      if (!this.rendererFolder) {
        this.rendererFolder = this.ui.addFolder('Renderer')
      }

      const info = this.experience.renderer.instance.info.render

      this.rendererFolder.add(info, 'calls').name('Draw calls').disable()
      this.rendererFolder.add(info, 'triangles').name('Triangles').disable()
    })
  }

  destroy() {
    if (this.stats) {
      this.stats.dom.remove()
      this.stats = null
    }

    if (this.ui) {
      this.ui.destroy()
      this.ui = null
    }
  }
}
