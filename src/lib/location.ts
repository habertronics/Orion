export type ApproxLocation = {
  lat: number
  lng: number
  accuracy: number
  capturedAt: string
}

export type LocationResult =
  | { ok: true; location: ApproxLocation }
  | { ok: false; error: 'unsupported' | 'denied' | 'unavailable' }

/** Approximate GPS: lower accuracy, usable for research geography without street-level precision. */
export function captureApproximateLocation(): Promise<LocationResult> {
  if (!('geolocation' in navigator)) {
    return Promise.resolve({ ok: false, error: 'unsupported' })
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          ok: true,
          location: {
            lat: Number(position.coords.latitude.toFixed(3)),
            lng: Number(position.coords.longitude.toFixed(3)),
            accuracy: Math.round(position.coords.accuracy),
            capturedAt: new Date().toISOString(),
          },
        })
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          resolve({ ok: false, error: 'denied' })
          return
        }
        resolve({ ok: false, error: 'unavailable' })
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60_000,
      },
    )
  })
}
