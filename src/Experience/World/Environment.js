import * as THREE from 'three'
import Experience from '../Experience.js'

export default class Environment {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene

    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6)

    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.2)
    this.directionalLight.position.set(5, 10, 5)

    this.scene.add(this.ambientLight, this.directionalLight)
  }

  destroy() {
    this.scene.remove(this.ambientLight, this.directionalLight)
    this.ambientLight = null
    this.directionalLight = null
  }
}
