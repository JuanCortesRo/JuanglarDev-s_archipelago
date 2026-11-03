import * as THREE from 'three'
import Experience from './Experience.js'

export default class Renderer {
  constructor() {
    this.experience = new Experience()
    this.sizes = this.experience.sizes
    this.scene = this.experience.scene
    this.camera = this.experience.camera
    this.canvas = this.experience.canvas

    this.instance = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    })

    this.instance.setSize(this.sizes.width, this.sizes.height)
    this.instance.setPixelRatio(this.sizes.pixelRatio)
    this.instance.outputColorSpace = THREE.SRGBColorSpace
    this.instance.toneMapping = THREE.ACESFilmicToneMapping
    this.instance.setClearColor(0x87ceeb)

    this._resizeHandler = () => {
      this.instance.setSize(this.sizes.width, this.sizes.height)
      this.instance.setPixelRatio(this.sizes.pixelRatio)
    }
    this.sizes.on('resize', this._resizeHandler)
  }

  update() {
    this.instance.render(this.scene, this.camera.instance)
  }

  destroy() {
    this.sizes.off('resize', this._resizeHandler)
    this.instance.dispose()
  }
}
