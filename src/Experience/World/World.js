import Experience from '../Experience.js'
import Environment from './Environment.js'
import Islands from './Islands.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.environment = null
    this.islands = null

    this._onReady = () => this._build()

    if (this.resources.isReady) {
      this._build()
    } else {
      this.resources.on('ready', this._onReady)
    }
  }

  _build() {
    this.environment = new Environment()
    this.islands = new Islands()
  }

  update() {
    // Placeholder for future world updates (animations, character).
  }

  destroy() {
    this.resources.off('ready', this._onReady)

    if (this.islands) {
      this.islands.destroy()
      this.islands = null
    }

    if (this.environment) {
      this.environment.destroy()
      this.environment = null
    }
  }
}
