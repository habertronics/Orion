import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#163a4a"/>
  <circle cx="256" cy="256" r="118" fill="none" stroke="#3db8ae" stroke-width="28"/>
  <circle cx="256" cy="256" r="42" fill="#eef5f4"/>
  <path d="M256 98v48M256 366v48M98 256h48M366 256h48" stroke="#7fd4cd" stroke-width="22" stroke-linecap="round"/>
</svg>`

const buffer = Buffer.from(svg)

await Promise.all([
  sharp(buffer).resize(192, 192).png().toFile('public/pwa-192.png'),
  sharp(buffer).resize(512, 512).png().toFile('public/pwa-512.png'),
  sharp(buffer).resize(180, 180).png().toFile('public/apple-touch-icon.png'),
])

writeFileSync('public/favicon.svg', svg)
console.log('icons ok')
