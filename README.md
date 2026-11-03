# Archipiélago de Juanglar Dev

Portafolio interactivo en 3D construido con Three.js. El visitante controla un personaje que recorre cinco islas flotantes conectadas por puentes:

- **Muelle de Bienvenida** — punto de partida y centro del archipiélago
- **Taller de Proyectos** — proyectos
- **Bosque de Habilidades** — habilidades
- **Observatorio** — línea de tiempo
- **Faro de Contacto** — contacto

## Requisitos

- Node.js 18 o superior
- npm

## Cómo ejecutar

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

Otros comandos:

```bash
npm run build    # genera el build de producción en dist/
npm run preview  # sirve el build de producción localmente
npm run lint     # ejecuta ESLint
npm run format   # formatea el código con Prettier
```

## Modo debug

Para abrir el panel de debug (monitor de FPS, draw calls, triángulos y helpers de escena), añade `#debug` a la URL:

```
http://localhost:5173/#debug
```

## Convención de ramas

- Historias de usuario: `feature/US-xx`
- Historias técnicas: `feature/TS-xx`

Cada rama parte de `main` actualizado y se fusiona mediante pull request.
