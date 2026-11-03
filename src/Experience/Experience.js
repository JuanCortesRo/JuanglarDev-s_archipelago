import * as THREE from 'three'
import Camera from './Camera.js'
import Renderer from './Renderer.js'
import Debug from './Utils/Debug.js'
import Resources from './Utils/Resources.js'
import Sizes from './Utils/Sizes.js'
import Time from './Utils/Time.js'
import World from './World/World.js'
import sources from './sources.js'

let instance = null

export default class Experience {
  constructor(canvas) {
    if (instance) return instance
    instance = this

    this.canvas = canvas

    this.debug = new Debug()
    this.sizes = new Sizes()
    this.time = new Time()
    this.scene = new THREE.Scene()
    this.resources = new Resources(sources)
    this.camera = new Camera()
    this.renderer = new Renderer()
    this.world = new World()

    this.debug.addRendererMonitor()

    if (this.debug.active) {
      this._registerHelpers()
    }

    this._tickHandler = () => {
      if (this.debug.active && this.debug.stats) {
        this.debug.stats.begin()
      }

      this.camera.update()
      this.world.update()
      this.renderer.update()

      if (this.debug.active && this.debug.stats) {
        this.debug.stats.end()
      }
    }
    this.time.on('tick', this._tickHandler)
  }

  _registerHelpers() {
    const axesHelper = new THREE.AxesHelper(10)
    const gridHelper = new THREE.GridHelper(30, 30, 0x888888, 0x444444)

    this.scene.add(axesHelper)
    this.scene.add(gridHelper)

    this.debug.addHelper('Axes', axesHelper)
    this.debug.addHelper('Grid', gridHelper)
  }

  destroy() {
    this.time.off('tick', this._tickHandler)

    this.world.destroy()
    this.camera.destroy()
    this.renderer.destroy()
    this.debug.destroy()
    this.resources.destroy()
    this.sizes.destroy()
    this.time.destroy()

    this.scene.traverse((child) => {
      if (child.geometry) child.geometry.dispose()

      const material = child.material
      if (material) {
        if (Array.isArray(material)) {
          material.forEach((mat) => mat.dispose())
        } else {
          material.dispose()
        }
      }
    })

    instance = null
  }
}
