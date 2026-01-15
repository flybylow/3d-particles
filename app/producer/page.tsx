'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProducerShaderBackground } from '@/components/ProducerShaderBackground'
import './producer.css'

const SECTIONS = ['hero', 'proof', 'closer']

export default function ProducerPage() {
  const [currentSection, setCurrentSection] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 })

  // Handle scroll to update current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.producer-section')
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="producer-page">
      <ProducerShaderBackground
        currentSection={currentSection}
        mousePosition={mousePosition}
      />

      <nav className="producer-nav">
        <Link href="/" className="nav-logo">TABULAS</Link>
        {SECTIONS.map((section, index) => (
          <div
            key={section}
            className={`nav-item ${currentSection === index ? 'active' : ''}`}
          >
            <button onClick={() => scrollToSection(section)}>
              {section === 'hero' ? 'Home' : section === 'proof' ? 'Why Us' : 'Contact'}
            </button>
          </div>
        ))}
      </nav>

      <div className="producer-sections">
        {/* HERO Section */}
        <section className="producer-section section-hero" id="hero">
          <div className="section-content">
            <h1>Your products have stories.</h1>
            <p className="hero-subline">
              Regulators want proof. Consumers want trust.<br />
              We build the bridge.
            </p>
            <p className="hero-tagline">
              Digital Product Passports that turn compliance into competitive advantage.
            </p>
            <a href="#closer" className="cta-button-primary" onClick={(e) => { e.preventDefault(); scrollToSection('closer'); }}>
              Book a demo
            </a>
          </div>
        </section>

        {/* PROOF POINTS Section */}
        <section className="producer-section section-proof" id="proof">
          <div className="section-content">
            <div className="proof-grid">
              <div className="proof-card">
                <span className="proof-icon">&#x1F4CB;</span>
                <h3>Feb 2027 ready</h3>
                <p>Built for EU Battery Regulation and beyond</p>
              </div>
              <div className="proof-card">
                <span className="proof-icon">&#x1F517;</span>
                <h3>One passport, every stakeholder</h3>
                <p>Regulators, recyclers, consumers &mdash; all served</p>
              </div>
              <div className="proof-card">
                <span className="proof-icon">&#x26A1;</span>
                <h3>Weeks, not months</h3>
                <p>Pilot in 6 weeks, scale when ready</p>
              </div>
            </div>
          </div>
        </section>

        {/* CLOSER Section */}
        <section className="producer-section section-closer" id="closer">
          <div className="section-content">
            <h2>Early adopters lead.<br />Late adopters explain.</h2>
            <a href="mailto:hello@tabulas.io" className="cta-button-primary">
              Talk to us
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
