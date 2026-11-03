import * as THREE from 'three'
import Experience from '../Experience.js'
import { islands, bridges } from './islandsConfig.js'

const WALK_MARGIN = 0.5

export default class Islands {
  constructor() {
    this.experience = new Experience()
    this.scene = this.experience.scene
    this.resources = this.experience.resources
    this.debug = this.experience.debug

    this.group = new THREE.Group()
    this.group.name = 'islands'
    this.scene.add(this.group)

    // Meshes the camera must not pass through (used by the follow camera in a later sprint).
    this.cameraObstacles = []

    this._islands = islands.map((island) => ({
      id: island.id,
      name: island.name,
      x: island.position.x,
      z: island.position.z,
      radius: island.radius,
    }))

    this._bridges = bridges.map((bridge) => {
      const from = this._getIsland(bridge.from)
      const to = this._getIsland(bridge.to)
      return { from, to, width: bridge.width }
    })

    this._materials = this._createMaterials()
    this._geometries = this._createGeometries()

    this._bridgeGeoms = this._bridges.map((bridge) => this._computeBridgeGeom(bridge))
    this._walkableIslands = this._islands.map((island) => ({
      x: island.x,
      z: island.z,
      radius: island.radius - WALK_MARGIN,
    }))

    this._buildIslands()
    this._buildBridges()
    this._buildProps()

    this._buildWalkableOutline()
  }

  _getIsland(id) {
    return this._islands.find((island) => island.id === id)
  }

  _createMaterials() {
    const items = this.resources.items
    return {
      grass: new THREE.MeshMatcapMaterial({ matcap: items.matcapGrass }),
      stone: new THREE.MeshMatcapMaterial({ matcap: items.matcapStone }),
      wood: new THREE.MeshMatcapMaterial({ matcap: items.matcapWood }),
      accent: new THREE.MeshMatcapMaterial({ matcap: items.matcapAccent }),
    }
  }

  _createGeometries() {
    return {
      islandTop: new THREE.CylinderGeometry(1, 1, 0.5, 8),
      islandUnder: new THREE.CylinderGeometry(1, 0, 3, 8),
      box: new THREE.BoxGeometry(1, 1, 1),
      cone: new THREE.ConeGeometry(1, 2, 8),
      cylinder: new THREE.CylinderGeometry(1, 1, 2, 8),
      dome: new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    }
  }

  _addMesh(geometry, material, x, y, z, scaleX, scaleY, scaleZ, rotationY = 0) {
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(x, y, z)
    mesh.scale.set(scaleX, scaleY, scaleZ)
    mesh.rotation.y = rotationY
    this.group.add(mesh)
    this.cameraObstacles.push(mesh)
    return mesh
  }

  _computeBridgeGeom(bridge) {
    const { from, to, width } = bridge
    const dx = to.x - from.x
    const dz = to.z - from.z
    const centerDistance = Math.hypot(dx, dz)
    const ux = dx / centerDistance
    const uz = dz / centerDistance

    const startX = from.x + ux * from.radius
    const startZ = from.z + uz * from.radius
    const endX = to.x - ux * to.radius
    const endZ = to.z - uz * to.radius
    const deckLength = centerDistance - from.radius - to.radius

    return {
      startX,
      startZ,
      endX,
      endZ,
      deckLength,
      ux,
      uz,
      halfWidth: width / 2,
      angle: Math.atan2(dx, dz),
    }
  }

  _buildIslands() {
    for (const island of this._islands) {
      const { x, z, radius } = island

      // Flat top slab, walkable surface at y = 0.
      this._addMesh(
        this._geometries.islandTop,
        this._materials.grass,
        x,
        -0.25,
        z,
        radius,
        1,
        radius
      )

      // Inverted cone hanging underneath, for the floating-island silhouette.
      this._addMesh(
        this._geometries.islandUnder,
        this._materials.stone,
        x,
        -2,
        z,
        radius,
        1,
        radius
      )
    }
  }

  _buildBridges() {
    for (const geom of this._bridgeGeoms) {
      const { startX, startZ, endX, endZ, deckLength, angle, halfWidth } = geom
      const width = halfWidth * 2

      const bridgeGroup = new THREE.Group()
      bridgeGroup.position.set((startX + endX) / 2, 0, (startZ + endZ) / 2)
      bridgeGroup.rotation.y = angle

      const deck = new THREE.Mesh(this._geometries.box, this._materials.wood)
      deck.scale.set(width, 0.1, deckLength)
      deck.position.y = -0.05
      bridgeGroup.add(deck)
      this.cameraObstacles.push(deck)

      for (const side of [-1, 1]) {
        const rail = new THREE.Mesh(this._geometries.box, this._materials.wood)
        rail.scale.set(0.1, 0.4, deckLength)
        rail.position.set(side * (width / 2 - 0.05), 0.2, 0)
        bridgeGroup.add(rail)
      }

      this.group.add(bridgeGroup)
    }
  }

  _buildProps() {
    const G = this._geometries
    const M = this._materials

    for (const island of this._islands) {
      const { id, x, z } = island

      switch (id) {
        case 'muelle': {
          const angle = Math.PI / 4
          this._addMesh(G.box, M.wood, x + 4, 0.1, z + 4, 2.4, 0.2, 1.2, angle)
          this._addMesh(G.cylinder, M.accent, x + 3.5, 0.4, z + 4.5, 0.12, 0.3, 0.12)
          this._addMesh(G.cylinder, M.accent, x + 4.5, 0.4, z + 3.5, 0.12, 0.3, 0.12)
          break
        }
        case 'taller': {
          this._addMesh(G.box, M.stone, x - 1, 0.4, z - 1, 2.2, 0.8, 2.2)
          this._addMesh(G.box, M.accent, x - 1, 1.05, z - 1, 1.1, 0.5, 1.1)
          this._addMesh(G.box, M.stone, x + 1.6, 0.25, z + 1.2, 1.4, 0.5, 1.4)
          break
        }
        case 'bosque': {
          const trees = [
            [-1.5, -1.5, 1.0],
            [1.6, -1.8, 1.2],
            [0.2, 1.6, 0.9],
          ]
          for (const [offsetX, offsetZ, scale] of trees) {
            this._addMesh(G.cylinder, M.wood, x + offsetX, 0.3, z + offsetZ, 0.12, 0.3, 0.12)
            this._addMesh(G.cone, M.grass, x + offsetX, 1.0, z + offsetZ, scale, scale, scale)
          }
          break
        }
        case 'observatorio': {
          this._addMesh(G.cylinder, M.stone, x, 0.4, z, 1.2, 0.4, 1.2)
          this._addMesh(G.dome, M.accent, x, 0.8, z, 1.3, 1.3, 1.3)
          break
        }
        case 'faro': {
          this._addMesh(G.cylinder, M.accent, x, 1.5, z, 0.55, 1.5, 0.55)
          this._addMesh(G.cone, M.stone, x, 3.3, z, 0.7, 0.6, 0.7)
          break
        }
      }
    }
  }

  isWalkable(x, z) {
    for (const island of this._walkableIslands) {
      const dx = x - island.x
      const dz = z - island.z
      if (dx * dx + dz * dz <= island.radius * island.radius) return true
    }

    for (const geom of this._bridgeGeoms) {
      const relX = x - geom.startX
      const relZ = z - geom.startZ
      const along = relX * geom.ux + relZ * geom.uz
      if (along < 0 || along > geom.deckLength) continue

      const perp = relX * -geom.uz + relZ * geom.ux
      if (Math.abs(perp) <= geom.halfWidth) return true
    }

    return false
  }

  _buildWalkableOutline() {
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff00ff })
    this._outlineMaterial = lineMaterial

    this.walkableOutline = new THREE.Group()
    this.walkableOutline.name = 'walkable-outline'
    this.walkableOutline.visible = false

    const circleSegments = 64
    for (const island of this._walkableIslands) {
      const points = []
      for (let i = 0; i < circleSegments; i++) {
        const angle = (i / circleSegments) * Math.PI * 2
        points.push(
          new THREE.Vector3(Math.cos(angle) * island.radius, 0.05, Math.sin(angle) * island.radius)
        )
      }
      const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(points),
        lineMaterial
      )
      line.position.set(island.x, 0, island.z)
      this.walkableOutline.add(line)
    }

    for (const geom of this._bridgeGeoms) {
      const px = -geom.uz
      const pz = geom.ux
      const corners = [
        new THREE.Vector3(
          geom.startX - px * geom.halfWidth,
          0.05,
          geom.startZ - pz * geom.halfWidth
        ),
        new THREE.Vector3(geom.endX - px * geom.halfWidth, 0.05, geom.endZ - pz * geom.halfWidth),
        new THREE.Vector3(geom.endX + px * geom.halfWidth, 0.05, geom.endZ + pz * geom.halfWidth),
        new THREE.Vector3(
          geom.startX + px * geom.halfWidth,
          0.05,
          geom.startZ + pz * geom.halfWidth
        ),
      ]
      const line = new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(corners),
        lineMaterial
      )
      this.walkableOutline.add(line)
    }

    this.scene.add(this.walkableOutline)

    if (this.debug.active) {
      this.debug.addHelper('Walkable area', this.walkableOutline)
    }
  }

  destroy() {
    this.scene.remove(this.walkableOutline)

    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose()
    })
    this.scene.remove(this.group)

    Object.values(this._geometries).forEach((geometry) => geometry.dispose())
    Object.values(this._materials).forEach((material) => material.dispose())
    this._outlineMaterial.dispose()

    this.cameraObstacles = []
  }
}
