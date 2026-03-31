import './LandingPage.css'

export default function LandingPage({ onNext }) {
  return (
    <div className="lp-root">
      {/* Background decorations */}
      <div className="lp-blob lp-blob-tr" />
      <div className="lp-blob lp-blob-bl" />

      <div className="lp-content">
        {/* JUST MY */}
        <p className="lp-eyebrow lp-anim-slide-down">JUST MY</p>

        {/* TYPE. */}
        <h1 className="lp-title">
          <span className="lp-letter lp-letter-1">T</span>
          <span className="lp-letter lp-letter-2">Y</span>
          <span className="lp-letter lp-letter-3">P</span>
          <span className="lp-letter lp-letter-4">E</span>
          <span className="lp-dot lp-anim-dot">■</span>
        </h1>

        {/* YOUR REPLY, PERFECTLY YOU */}
        <p className="lp-tagline lp-anim-fade" style={{ '--delay': '0.8s' }}>
          YOUR REPLY, PERFECTLY YOU
        </p>

        {/* Divider */}
        <div className="lp-divider lp-anim-fade" style={{ '--delay': '0.95s' }} />

        {/* Instrument Serif copy */}
        <p className="lp-copy lp-anim-fade" style={{ '--delay': '1.1s' }}>
          Every message you send<br />should feel exactly like you.
        </p>

        {/* Subtitle */}
        <p className="lp-sub lp-anim-fade" style={{ '--delay': '1.3s' }}>
          Your AI dating reply assistant
        </p>

        {/* CTA */}
        <button
          className="lp-cta lp-anim-fade"
          style={{ '--delay': '1.5s' }}
          onClick={onNext}
        >
          GET STARTED →
        </button>

        {/* Pagination */}
        <div className="lp-pagination lp-anim-fade" style={{ '--delay': '1.6s' }}>
          <span className="lp-dot-nav lp-dot-active" />
          <span className="lp-dot-nav" />
          <span className="lp-dot-nav" />
          <span className="lp-page-num">1 / 3</span>
        </div>
      </div>
    </div>
  )
}
