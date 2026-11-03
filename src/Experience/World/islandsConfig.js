// Pure data describing the archipelago layout. This will move to a JSON file in Sprint 2,
// so keep it free of any Three.js / code logic.

export const islands = [
  { id: 'muelle', name: 'Muelle de Bienvenida', position: { x: 0, z: 0 }, radius: 6 },
  { id: 'taller', name: 'Taller de Proyectos', position: { x: 28, z: 0 }, radius: 5 },
  { id: 'bosque', name: 'Bosque de Habilidades', position: { x: 0, z: -28 }, radius: 5.5 },
  { id: 'observatorio', name: 'Observatorio', position: { x: -28, z: 0 }, radius: 5 },
  { id: 'faro', name: 'Faro de Contacto', position: { x: 0, z: 28 }, radius: 5 },
]

export const bridges = [
  { from: 'muelle', to: 'taller', width: 2.5 },
  { from: 'muelle', to: 'bosque', width: 2.5 },
  { from: 'muelle', to: 'observatorio', width: 2.5 },
  { from: 'muelle', to: 'faro', width: 2.5 },
]
