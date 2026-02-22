import { notFound } from 'next/navigation'
import { getGymBySlug } from '@/lib/actions/gyms'
import { getPublicGymReviews } from '@/lib/actions/reviews'
import { GymLandingPage } from '@/components/landing/gym-landing-page'

interface GymPageProps {
  params: {
    slug: string
  }
  searchParams: {
    ref?: string
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

  const { data: reviews } = await getPublicGymReviews(gym.id)

  return <GymLandingPage gym={gym} referralCode={searchParams.ref} reviews={reviews || []} />
}
