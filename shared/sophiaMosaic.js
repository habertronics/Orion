const COLS = 7
const ROWS = 5
const LOGO_SRC = '/brand/sophia-logo.png'

/**
 * Mosaico ambientado Sofía (ráfagas de “viento”).
 * @param {{ tint?: string, placement?: 'top' | 'bottom', parent?: ParentNode }} [options]
 * - tint: color de marca (apps oscuras: logo como máscara)
 * - placement: 'top' (default) o 'bottom' (debajo de los botones de acceso)
 * - sin tint: PNG a color (portada clara)
 */
export function mountSophiaMosaic(options = {}) {
  const { tint = '', placement = 'top', parent = document.body } = options

  if (document.querySelector('.sophia-mosaic')) return

  const classes = ['sophia-mosaic']
  if (tint) classes.push('sophia-mosaic--tinted')
  if (placement === 'bottom') classes.push('sophia-mosaic--bottom')

  const root = document.createElement('div')
  root.className = classes.join(' ')
  root.setAttribute('aria-hidden', 'true')
  root.style.setProperty('--cols', String(COLS))
  root.style.setProperty('--rows', String(ROWS))
  if (tint) root.style.setProperty('--mosaic-tint', tint)

  const grid = document.createElement('div')
  grid.className = 'sophia-mosaic__grid'

  const maskSize = `${COLS * 100}% ${ROWS * 100}%`

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const gust = ((col * 17 + row * 31 + col * row * 7) % 100) / 100
      const x = (col / (COLS - 1)) * 100
      const y = (row / (ROWS - 1)) * 100
      const tile = document.createElement('span')
      tile.className = 'sophia-mosaic__tile'
      tile.style.setProperty('--col', String(col))
      tile.style.setProperty('--row', String(row))
      tile.style.setProperty('--gust', String(gust))

      if (tint) {
        tile.style.webkitMaskImage = `url("${LOGO_SRC}")`
        tile.style.maskImage = `url("${LOGO_SRC}")`
        tile.style.webkitMaskSize = maskSize
        tile.style.maskSize = maskSize
        tile.style.webkitMaskPosition = `${x}% ${y}%`
        tile.style.maskPosition = `${x}% ${y}%`
        tile.style.webkitMaskRepeat = 'no-repeat'
        tile.style.maskRepeat = 'no-repeat'
      } else {
        tile.style.backgroundImage = `url("${LOGO_SRC}")`
        tile.style.backgroundPosition = `${x}% ${y}%`
      }

      grid.appendChild(tile)
    }
  }

  root.appendChild(grid)
  parent.prepend(root)
}
