import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Tabulas — Digital Product Passport infrastructure',
  description:
    'Digital Product Passport infrastructure for the EU circular economy.',
}

/** Main Vercel deployment; replace with a dedicated DPP Browser URL if different. */
const DPP_BROWSER_URL = 'https://tabulas.eu'
/** Replace with your prodlist_triple deployment URL when known. */
const PRODUCT_LIST_URL = 'https://prodlist.tabulas.eu'

export default function HomePage() {
  return (
    <main className={styles.landing}>
      <h1 className={styles.brand}>Tabulas</h1>
      <p className={styles.tagline}>
        Digital Product Passport infrastructure for the EU circular economy.
      </p>

      <section className={styles.section} aria-labelledby="projects-heading">
        <h2 id="projects-heading" className={styles.sectionTitle}>
          Projects
        </h2>
        <ul className={styles.list}>
          <li>
            <a href={DPP_BROWSER_URL} rel="noopener noreferrer">
              DPP Browser
            </a>
          </li>
          <li>
            <a href={PRODUCT_LIST_URL} rel="noopener noreferrer">
              Product List (Comunica/SPARQL)
            </a>
          </li>
          <li>
            <a href="https://log.tabulas.eu" rel="noopener noreferrer">
              Log Service
            </a>
          </li>
          <li>
            <span className={styles.muted}>BIM Viewer — </span>
            <span className={styles.muted}>(not deployed)</span>
          </li>
          <li>
            <Link href="/particles">3D Animation</Link>
            <span className={styles.muted}> · </span>
            <a
              href="https://github.com/flybylow/3d-particles"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="resources-heading">
        <h2 id="resources-heading" className={styles.sectionTitle}>
          Resources
        </h2>
        <ul className={styles.list}>
          <li>
            <a href="https://github.com/flybylow" rel="noopener noreferrer">
              GitHub
            </a>
          </li>
          <li>
            <a
              href="https://tabulas.eu/ontology/dpp/"
              rel="noopener noreferrer"
            >
              Ontology
            </a>
          </li>
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="standards-heading">
        <h2 id="standards-heading" className={styles.sectionTitle}>
          Standards
        </h2>
        <ul className={styles.standardsList}>
          <li>W3C Verifiable Credentials (VCDM 2.0)</li>
          <li>EPCIS 2.0</li>
          <li>GS1 Digital Link</li>
          <li>ETIM Classification</li>
          <li>SD-JWT VC + OpenID4VP</li>
        </ul>
      </section>
    </main>
  )
}
