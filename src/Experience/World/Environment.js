import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.debug = this.experience.debug

    this.background = new THREE.Color(0x87ceeb)
    this.scene.background = this.background

    this.fog = new THREE.Fog(0x87ceeb, 25, 120)
    this.scene.fog = this.fog

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    this.directionalLight.position.set(5, 10, 5)

    this.scene.add(this.ambientLight, this.directionalLight)

    this._setupDebug()
  }

  _setupDebug() {
    if (!this.debug.active) return

    this.debug.whenReady((gui) => {
      const folder = gui.addFolder('Environment')
      const params = {
        background: '#87ceeb',
        fogColor: '#87ceeb',
        fogNear: this.fog.near,
        fogFar: this.fog.far,
      }

      folder.addColor(params, 'background').onChange((value) => this.background.set(value))
      folder.addColor(params, 'fogColor').onChange((value) => this.fog.color.set(value))
      folder.add(params, 'fogNear', 0, 150, 1).onChange((value) => {
        this.fog.near = value
      })
      folder.add(params, 'fogFar', 10, 400, 1).onChange((value) => {
        this.fog.far = value
      })
    })
  }

  destroy() {
    this.scene.remove(this.ambientLight, this.directionalLight)
    this.ambientLight = null
    this.directionalLight = null

    this.scene.fog = null
    this.scene.background = null
  }
}
