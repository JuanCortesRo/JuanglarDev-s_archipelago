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
npm run build        # genera el build de producción en dist/
npm run preview      # sirve el build de producción localmente
npm run lint         # ejecuta ESLint
npm run format       # formatea el código con Prettier
npm run report:assets  # informe de tamaños y presupuesto de assets (requiere build previo)
```

## Modo debug

Para abrir el panel de debug (monitor de FPS, draw calls, triángulos y helpers de escena), añade `#debug` a la URL:

```
http://localhost:5173/#debug
```

## Informe de assets

```bash
npm run build          # primero genera dist/
npm run report:assets  # luego lista tamaños, total y avisos de presupuesto
```

El informe agrupa los archivos de `dist/` por tipo (js, css, modelos, texturas, otros), muestra el tamaño total y avisa si el total cargado en tiempo de ejecución supera 10 MB o si alguna textura supera 1 MB. También comprueba las dimensiones de las imágenes PNG/JPG/WebP de `public/` (deben ser potencias de dos y no superar 2048 px). Los archivos de decoder de Draco duplicados que Three.js emite en `dist/assets/` se marcan como "no cargados en tiempo de ejecución" y se excluyen del presupuesto.

## Despliegue

- **URL pública**: https://juanglar-dev.vercel.app/
- El despliegue se hace en **Vercel** como sitio estático de Vite.
- Cada _push_ a `main` genera automáticamente un despliegue de producción (`npm run build` → `dist/`).
- Cada pull request genera un **despliegue de vista previa** (preview deployment) con su propia URL para revisar los cambios antes de fusionar.

## Convención de ramas

- Historias de usuario: `feature/US-xx`
- Historias técnicas: `feature/TS-xx`

Cada rama parte de `main` actualizado y se fusiona mediante pull request.
