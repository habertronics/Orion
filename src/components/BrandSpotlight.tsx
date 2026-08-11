import { useMemo, type CSSProperties } from 'react'
import './BrandSpotlight.css'

const COLS = 7
const ROWS = 5
const LOGO_SRC = '/brand/sophia-logo.png'

type Cell = {
  key: string
  col: number
  row: number
  /** Desfase de “ráfaga” (0–1) para que el viento no sea uniforme */
  gust: number
}

function buildCells(): Cell[] {
  const cells: Cell[] = []
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      // Pseudoaleatorio estable: ráfagas irregulares sin Math.random en cada render
      const gust = ((col * 17 + row * 31 + col * row * 7) % 100) / 100
      cells.push({ key: `${col}-${row}`, col, row, gust })
    }
  }
  return cells
}

export function BrandSpotlight() {
  const cells = useMemo(() => buildCells(), [])

  return (
    <div
      className="brand-spotlight"
      aria-hidden="true"
      style={
        {
          '--cols': COLS,
          '--rows': ROWS,
        } as CSSProperties
      }
    >
      <div className="brand-spotlight__mosaic">
        {cells.map((cell) => {
          const x = (cell.col / (COLS - 1)) * 100
          const y = (cell.row / (ROWS - 1)) * 100
          return (
            <span
              key={cell.key}
              className="brand-spotlight__tile"
              style={
                {
                  '--col': cell.col,
                  '--row': cell.row,
                  '--gust': cell.gust,
                  backgroundImage: `url(${LOGO_SRC})`,
                  backgroundPosition: `${x}% ${y}%`,
                } as CSSProperties
              }
            />
          )
        })}
      </div>
    </div>
  )
}
