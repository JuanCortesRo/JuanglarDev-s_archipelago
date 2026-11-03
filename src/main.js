import './style.css'
import Experience from './Experience/Experience.js'

const canvas = document.querySelector('canvas.webgl')

const experience = new Experience(canvas)

// Exposed on window so the debug console can inspect or destroy the instance.
if (import.meta.env.DEV) {
  window.experience = experience
}
