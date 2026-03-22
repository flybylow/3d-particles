import type { Metadata } from 'next'
import { HomepageHero } from '@/components/HomepageHero'

export const metadata: Metadata = {
  title: '3D Animation',
  description:
    'Immersive particle animation transforming from barcodes to products',
}

export default function ParticlesPage() {
  return (
    <main>
      <HomepageHero />
    </main>
  )
}
