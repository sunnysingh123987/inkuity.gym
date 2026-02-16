import { notFound } from 'next/navigation'
import { getGymBySlug } from '@/lib/actions/gyms'
import { GymLandingPage } from '@/components/landing/gym-landing-page'

interface GymPageProps {
  params: {
    slug: string
  }
  searchParams: {
    scan_id?: string
    qr_code?: string
  }
}

export async function generateMetadata({ params }: GymPageProps) {
  const { data: gym } = await getGymBySlug(params.slug)

  if (!gym) {
    return {
      title: 'Gym Not Found - Inkuity',
    }
  }

  return {
    title: `${gym.name} - Inkuity`,
    description: gym.description || `Welcome to ${gym.name}`,
  }
}

export default async function GymPage({ params, searchParams }: GymPageProps) {
  const { data: gym } = await getGymBySlug(params.slug)

  if (!gym) {
    notFound()
  }

  return (
    <GymLandingPage
      gym={gym}
      scanId={searchParams.scan_id}
      qrCode={searchParams.qr_code}
    />
  )
}
