import * as THREE from 'three'
import Experience from '../Experience.js'
import Environment from './Environment.js'

export default class World {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources

    this.cube = null
    this.environment = null

    this._onReady = () => this._build()

    if (this.resources.isReady) {
      this._build()
    } else {
      this.resources.on('ready', this._onReady)
    }
  }

  _build() {
    this.cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshNormalMaterial())
    this.scene.add(this.cube)

    this.environment = new Environment()
  }

  update() {
    // Placeholder for future world updates (animations, character, islands).
  }

  destroy() {
    this.resources.off('ready', this._onReady)

    if (this.environment) {
      this.environment.destroy()
      this.environment = null
    }

    if (this.cube) {
      this.cube.geometry.dispose()
      this.cube.material.dispose()
      this.scene.remove(this.cube)
      this.cube = null
    }
  }
}
