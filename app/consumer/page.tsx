'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ConsumerShaderBackground } from '@/components/ConsumerShaderBackground'
import './consumer.css'

const SECTIONS = ['scan', 'trace', 'verify', 'trust']

export default function ConsumerPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })
  const [scanLine, setScanLine] = useState(-0.2)
  const [brightness, setBrightness] = useState(0)
  const [isScanning, setIsScanning] = useState(false)
  const [showPassport, setShowPassport] = useState(false)
  const [isTracing, setIsTracing] = useState(false)
  const [traceProgress, setTraceProgress] = useState(0)

  const scanStartRef = useRef(0)
  const traceStartRef = useRef(0)

  // Handle scroll to update current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.consumer-section')
      const windowHeight = window.innerHeight

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect()
        const sectionMiddle = rect.top + rect.height / 2

        if (sectionMiddle > 0 && sectionMiddle < windowHeight) {
          setCurrentSection(index)
        }
      })
    }

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

      <div className="consumer-sections">
        {/* SCAN Section */}
        <section className="consumer-section section-scan" id="scan">
          <div className="section-content">
            <div className="scan-header">
              <h2>Scan Any Product</h2>
              <button
                className={`scan-button ${isScanning ? 'scanning' : ''}`}
                onClick={handleScan}
              >
                <span className="scan-text">Scan</span>
                <div className="scan-ring" />
              </button>
            </div>
            <p>Point your phone at any barcode. Get instant access to the product story.</p>

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
            <p>Follow the complete path from raw materials to finished product. Every step documented, every hand it passed through.</p>

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
        <section className="consumer-section section-verify" id="verify">
          <div className="section-content">
            <h2>Verify The Claims</h2>
            <p>Organic? Fair trade? Sustainably sourced? We check the certifications so you don't have to trust marketing alone.</p>
          </div>
        </section>

        {/* TRUST Section */}
        <section className="consumer-section section-trust" id="trust">
          <div className="section-content">
            <h2>Trust What You Buy</h2>
            <p>Make informed decisions based on facts.</p>
          </div>
        </section>
      </div>
    </div>
  )
}
