import '../components/BrandSpotlight.css'

export function BrandSpotlight() {
  return (
    <div className="brand-spotlight" aria-hidden="true">
      <img
        className="brand-spotlight__logo"
        src="/brand/sophia-logo.png"
        alt=""
        draggable={false}
      />
    </div>
  )
}
