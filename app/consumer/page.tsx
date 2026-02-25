'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ConsumerShaderBackground } from '@/components/ConsumerShaderBackground'
import './consumer.css'

const SECTIONS = ['scan', 'trace', 'verify', 'trust']

export default function ConsumerPage() {
  const [currentSection, setCurrentSection] = useState(-1)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [scanLine, setScanLine] = useState(-0.2)
  const [brightness, setBrightness] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [showPassport, setShowPassport] = useState(false)
  const [isTracing, setIsTracing] = useState(false)
  const [traceProgress, setTraceProgress] = useState(0)

  const scanStartRef = useRef(0)
  const traceStartRef = useRef(0)
  const trustRef = useRef<HTMLElement>(null)
  const verifyRef = useRef<HTMLElement>(null)
  const [trustInView, setTrustInView] = useState(false)
  const [verifyInView, setVerifyInView] = useState(false)

  // Handle scroll to update current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.consumer-section')
      const windowHeight = window.innerHeight

      // If hero is in view (first section not yet centered), no nav active
      const firstSection = sections[0]
      if (firstSection) {
        const firstRect = firstSection.getBoundingClientRect()
        if (firstRect.top > windowHeight * 0.4) {
          setCurrentSection(-1)
          return
        }
      }

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        const sectionMiddle = rect.top + rect.height / 2

        if (sectionMiddle > 0 && sectionMiddle < windowHeight) {
          setCurrentSection(index)
        }
      })
    }

    handleScroll() // Initial check
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: 1.0 - e.clientY / window.innerHeight
      })
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scan animation
  useEffect(() => {
    if (!isScanning) return

    const animate = () => {
      const elapsed = performance.now() - scanStartRef.current
      const progress = elapsed / 1500

      setScanLine(-0.2 + progress * 1.4)

      if (progress >= 1) {
        setIsScanning(false)
        setShowPassport(true)
        setBrightness(0)
        setScanLine(-0.2)
      } else {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isScanning])

  // Trace animation
  useEffect(() => {
    if (!isTracing) return

    const animate = () => {
      const elapsed = performance.now() - traceStartRef.current
      const progress = Math.min(elapsed / 2000, 1.0)
      const easedProgress = 1 - Math.pow(1 - progress, 3)

      setTraceProgress(easedProgress)

      if (progress >= 1) {
        setIsTracing(false)
      } else {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [isTracing])

  const handleScan = useCallback(() => {
    if (isScanning) return
    setIsScanning(true)
    scanStartRef.current = performance.now()
    setBrightness(1)
    setScanLine(-0.2)
  }, [isScanning])

  const handleTrace = useCallback(() => {
    if (isTracing) return
    setIsTracing(true)
    traceStartRef.current = performance.now()
    setTraceProgress(0)
  }, [isTracing])

  // Trust section: animate examples when scrolled into view
  useEffect(() => {
    const el = trustRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setTrustInView(true),
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Verify section: animate badges when scrolled into view
  useEffect(() => {
    const el = verifyRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => e.isIntersecting && setVerifyInView(true),
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="consumer-page">
      <ConsumerShaderBackground
        currentSection={currentSection}
        mousePosition={mousePosition}
        scanLine={scanLine}
        brightness={brightness}
      />

      <nav className="consumer-nav">
        <Link href="/" className="nav-logo">TABULAS</Link>
        {SECTIONS.map((section, index) => (
          <div
            key={section}
            className={`nav-item ${currentSection === index ? 'active' : ''}`}
          >
            <button onClick={() => scrollToSection(section)}>
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          </div>
        ))}
      </nav>

      {/* Hero / Opening - cinematic moment before sections */}
      <div className="consumer-hero">
        <div className="consumer-hero-content">
          <p className="consumer-hero-line1">You buy a product. It has a digital passport.</p>
          <p className="consumer-hero-line2">Not paperwork. A living link to everything about it.</p>
        </div>
      </div>

      <div className="consumer-sections">
        {/* SCAN Section */}
        <section className="consumer-section section-scan" id="scan">
          <div className="section-content">
            <div className="scan-header">
              <h2>Scan. Meet Your Product.</h2>
              <button
                className={`scan-button ${isScanning ? 'scanning' : ''}`}
                onClick={handleScan}
              >
                <span className="scan-text">Scan</span>
                <div className="scan-ring" />
              </button>
            </div>
            <p>Point your phone. See where it came from, what it&apos;s made of, and if the label is honest.</p>

            <div className={`product-passport ${showPassport ? 'visible' : ''}`}>
              <img src="/consumer/product.png" alt="Product" className="product-image" />
              <div className="passport-items">
                <div className="passport-item">
                  <span className="passport-label">Origin</span>
                  <span className="passport-value">Colombia, South America</span>
                </div>
                <div className="passport-item">
                  <span className="passport-label">Certified</span>
                  <span className="passport-value">Fair Trade, Organic</span>
                </div>
                <div className="passport-item">
                  <span className="passport-label">Carbon</span>
                  <span className="passport-value">2.1 kg CO₂</span>
                </div>
                <div className="passport-item">
                  <span className="passport-label">Batch</span>
                  <span className="passport-value">#TBL-2026-0142</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRACE Section */}
        <section className="consumer-section section-trace has-image" id="trace">
          <img src="/consumer/phone.png" alt="" className="section-image" />
          <div className="section-content">
            <h2>Trace The Journey</h2>
            <p>Your coffee started on a farm in Colombia. It crossed an ocean. It was roasted in the Netherlands. Every step, every hand, every mile — documented. You&apos;re not trusting a label. You&apos;re reading a life story.</p>

            <button
              className={`trace-button ${isTracing ? 'tracing' : ''}`}
              onClick={handleTrace}
            >
              <span className="trace-text">Trace</span>
              <div className="trace-ring" />
            </button>

            <div className="journey-timeline">
              <div className="trace-line-container">
                <div
                  className="trace-line"
                  style={{ width: `${traceProgress * 100}%` }}
                />
                <div
                  className={`trace-head ${isTracing ? 'active' : ''}`}
                  style={{ left: `${traceProgress * 100}%` }}
                />
              </div>
              {[
                { label: 'Farm', detail: 'Colombia', step: 0 },
                { label: 'Transport', detail: 'Ship & Truck', step: 1 },
                { label: 'Production', detail: 'Netherlands', step: 2 },
                { label: 'Shop', detail: 'Local Store', step: 3 }
              ].map((item, index) => (
                <div
                  key={item.label}
                  className={`journey-step ${traceProgress >= index / 3 ? 'reached' : ''}`}
                >
                  <div className="step-dot" />
                  <div className="step-info">
                    <span className="step-label">{item.label}</span>
                    <span className="step-detail">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VERIFY Section */}
        <section ref={verifyRef} className={`consumer-section section-verify ${verifyInView ? 'in-view' : ''}`} id="verify">
          <div className="section-content">
            <h2>Verify The Claims</h2>
            <p>Organic? Fair trade? Sustainably sourced? Every claim is backed by real certifications you can check yourself. No more trusting marketing alone.</p>
            <div className="verify-badges">
              <span className="verify-badge">✓</span>
              <span className="verify-badge">✓</span>
              <span className="verify-badge">✓</span>
            </div>
          </div>
        </section>

        {/* TRUST Section */}
        <section ref={trustRef} className={`consumer-section section-trust ${trustInView ? 'in-view' : ''}`} id="trust">
          <div className="section-content section-trust-content">
            <h2>Trust What You Buy</h2>
            <p className="trust-intro">Ask your vacuum cleaner which filter to order. Check your bike&apos;s battery health. See where the cotton in your jacket was grown.</p>
            <ul className="trust-examples">
              <li><span className="trust-question">Need a repair?</span> Your product knows every part.</li>
              <li><span className="trust-question">Want to resell?</span> It proves what it&apos;s worth.</li>
              <li><span className="trust-question">Time to recycle?</span> It tells the recycler exactly what&apos;s inside.</li>
            </ul>
          </div>
        </section>

        {/* Privacy Block */}
        <div className="consumer-privacy">
          <p>Your product data stays yours. Not the brand&apos;s. Not ours. Yours.</p>
          <p>Stored in your personal data vault, secured with your own login.</p>
          <p>We don&apos;t see it. We don&apos;t sell it.</p>
        </div>

        {/* Closing Line */}
        <div className="consumer-closing">
          <p>Every product has a story. Now you can actually hear it.</p>
        </div>
      </div>
    </div>
  )
}
