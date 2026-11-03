import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Experience from './Experience.js'

export default class Camera {
  constructor() {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.canvas = this.experience.canvas

    this.instance = new THREE.PerspectiveCamera(45, this.sizes.width / this.sizes.height, 0.1, 100)
    this.instance.position.set(4, 3, 6)
    this.instance.lookAt(0, 0, 0)
    this.scene.add(this.instance)

    this.controls = new OrbitControls(this.instance, this.canvas)
    this.controls.target.set(0, 0, 0)
    this.controls.enableDamping = true

    this._resizeHandler = () => {
      this.instance.aspect = this.sizes.width / this.sizes.height
      this.instance.updateProjectionMatrix()
    }
    this.sizes.on('resize', this._resizeHandler)
  }

  update() {
    this.controls.update()
  }

  destroy() {
    this.sizes.off('resize', this._resizeHandler)
    this.controls.dispose()
  }
}
