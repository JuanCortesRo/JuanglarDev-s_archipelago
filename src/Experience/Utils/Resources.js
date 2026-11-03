import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import EventEmitter from './EventEmitter.js'
import Experience from '../Experience.js'

export default class Resources extends EventEmitter {
  constructor(sources) {
    super()

    this.experience = new Experience()
    this.sources = sources

    this.items = {}
    this.toLoad = this.sources.length
    this.loaded = 0

    this.loadingManager = new THREE.LoadingManager()

    this.textureLoader = new THREE.TextureLoader(this.loadingManager)

    this.gltfLoader = new GLTFLoader(this.loadingManager)

    this.dracoLoader = new DRACOLoader(this.loadingManager)
    this.dracoLoader.setDecoderPath('/draco/')
    this.gltfLoader.setDRACOLoader(this.dracoLoader)

    this.startLoading()
  }

  startLoading() {
    if (this.sources.length === 0) {
      this.trigger('ready')
      return
    }

    for (const source of this.sources) {
      if (source.type === 'gltfModel') {
        this.gltfLoader.load(
          source.path,
          (file) => this.sourceLoaded(source, file),
          undefined,
          () => this.sourceError(source)
        )
      } else if (source.type === 'texture') {
        this.textureLoader.load(
          source.path,
          (file) => this.sourceLoaded(source, file),
          undefined,
          () => this.sourceError(source)
        )
      }
    }
  }

  sourceLoaded(source, file) {
    if (source.type === 'texture') {
      file.colorSpace = THREE.SRGBColorSpace
    }

    this.items[source.name] = file
    this.loaded++

    this.trigger('progress', {
      loaded: this.loaded,
      total: this.toLoad,
      ratio: this.loaded / this.toLoad,
    })

    if (this.loaded === this.toLoad) {
      this.trigger('ready')
    }
  }

  sourceError(source) {
    this.loaded++
    this.trigger('error', { url: source.path })
  }

  destroy() {
    for (const name of Object.keys(this.items)) {
      const item = this.items[name]
      if (item && item.dispose) {
        item.dispose()
      }
    }
    this.items = {}
  }
}
