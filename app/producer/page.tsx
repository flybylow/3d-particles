'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ProducerShaderBackground } from '@/components/ProducerShaderBackground'
import './producer.css'

const SECTIONS = ['hero', 'problem', 'solution', 'proof', 'revelation', 'credibility', 'closer']

const NAV_LABELS: Record<string, string> = {
  hero: 'Home',
  problem: 'Problem',
  solution: 'Solution',
  proof: 'Proof',
  revelation: 'Revelation',
  credibility: 'Credibility',
  closer: 'Contact'
}

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
    handleScroll()
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
              {NAV_LABELS[section] || section}
            </button>
          </div>
        ))}
      </nav>

      <div className="producer-sections">
        {/* HERO Section */}
        <section className="producer-section section-hero" id="hero">
          <div className="section-content">
            <h1>Turn Compliance Into Competitive Advantage</h1>
            <p className="hero-subline">
              The EU demands Digital Product Passports. Your product data is scattered across ERP systems, supplier files, and spreadsheets. We turn that scattered data into structured, compliant DPPs &mdash; and something much more valuable.
            </p>
            <a href="#closer" className="cta-button-primary" onClick={(e) => { e.preventDefault(); scrollToSection('closer'); }}>
              Book a demo
            </a>
          </div>
        </section>

        {/* PROBLEM Section */}
        <section className="producer-section section-problem" id="problem">
          <div className="section-content">
            <h2>You have a compliance problem you didn&apos;t create</h2>
            <p>
              February 2027. The EU Battery Regulation requires Digital Product Passports. Then textiles. Then construction materials. Then everything else. Your product data exists &mdash; but it&apos;s trapped in systems that don&apos;t talk to each other. Getting compliant feels like a cost with no return.
            </p>
          </div>
        </section>

        {/* SOLUTION Section */}
        <section className="producer-section section-solution" id="solution">
          <div className="section-content">
            <h2>We turn what you have into what you need</h2>
            <p>
              Tabulas connects to your existing systems and builds compliant Digital Product Passports. <strong>No new workflows. No rip-and-replace.</strong> Your data gets structured, validated, and ready for every stakeholder who needs it.
            </p>
          </div>
        </section>

        {/* PROOF POINTS Section */}
        <section className="producer-section section-proof" id="proof">
          <div className="section-content">
            <div className="proof-grid">
              <div className="proof-card">
                <h3>Compliant by design</h3>
                <p>Built for the EU Battery Regulation, ESPR, and every DPP mandate coming after. You implement once, we handle the regulatory evolution.</p>
              </div>
              <div className="proof-card">
                <h3>One passport, every stakeholder</h3>
                <p>Regulators verify compliance. Recyclers know what&apos;s inside. Repair services find every part. Consumers build trust with your brand. Same data, different views.</p>
              </div>
              <div className="proof-card">
                <h3>Pilot in 6 weeks</h3>
                <p>Start with one product line. See results before committing further. No 18-month implementation projects.</p>
              </div>
            </div>
          </div>
        </section>

        {/* REVELATION Section */}
        <section className="producer-section section-revelation" id="revelation">
          <div className="section-content">
            <h2>Compliance is the starting line, not the finish</h2>
            <p>
              When you structure your product data for compliance, you&apos;re not just checking a box. You&apos;re building a digital twin. That data becomes an asset. Your brand stays connected to the product after the sale. Your consumers get transparency they can actually interact with. Your supply chain becomes legible to every partner who needs it. You start with compliance. You end with a product that speaks for itself.
            </p>
          </div>
        </section>

        {/* CREDIBILITY Section */}
        <section className="producer-section section-credibility" id="credibility">
          <div className="section-content">
            <h2>Built by someone who&apos;s been on your factory floor</h2>
            <p>
              Ward&apos;s 4.5 years in manufacturing. Architecture aligned with CIRPASS-2 &mdash; the EU&apos;s own DPP research standards.
            </p>
          </div>
        </section>

        {/* CLOSER Section */}
        <section className="producer-section section-closer" id="closer">
          <div className="section-content">
            <p className="closer-lead-in">
              Those who start now will have room to learn, iterate, and lead before February 2027. The rest will rush, overpay, and arrive with a product that&apos;s compliant but forgettable.
            </p>
            <h2>Early adopters lead.<br />Late adopters explain.</h2>
            <div className="closer-ctas">
              <a href="mailto:hello@tabulas.io" className="cta-button-primary">
                Book a demo
              </a>
              <Link href="/consumer" className="cta-button-secondary">
                See how it works
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
