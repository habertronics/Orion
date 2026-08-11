import sharp from 'sharp'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outDir = resolve(root, 'public/reps/icons')

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#1a2e1f"/>
  <rect x="96" y="96" width="320" height="320" rx="28" fill="#0f1a12" stroke="#6ecf8e" stroke-width="18"/>
  <rect x="140" y="140" width="72" height="72" rx="10" fill="#6ecf8e"/>
  <rect x="300" y="140" width="72" height="72" rx="10" fill="#6ecf8e"/>
  <rect x="140" y="300" width="72" height="72" rx="10" fill="#6ecf8e"/>
  <rect x="236" y="236" width="40" height="40" rx="6" fill="#3d9a5c"/>
  <rect x="300" y="300" width="28" height="28" rx="4" fill="#9be4b0"/>
  <rect x="348" y="348" width="28" height="28" rx="4" fill="#9be4b0"/>
  <circle cx="392" cy="120" r="36" fill="#3d9a5c"/>
  <path d="M392 104v32M376 120h32" stroke="#eef6ef" stroke-width="8" stroke-linecap="round"/>
</svg>`

const buffer = Buffer.from(svg)

await Promise.all([
  sharp(buffer).resize(192, 192).png().toFile(resolve(outDir, 'icon-192.png')),
  sharp(buffer).resize(512, 512).png().toFile(resolve(outDir, 'icon-512.png')),
  sharp(buffer).resize(180, 180).png().toFile(resolve(outDir, 'apple-touch-icon.png')),
])

console.log('reps icons ok')
