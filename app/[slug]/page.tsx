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
    title: `${gym.name} — Member Portal | Inkuity`,
    description: gym.description || `Welcome to ${gym.name}. Check in, track workouts, follow diet plans, and build your fitness streak. Powered by Inkuity — the free gym management platform.`,
    openGraph: {
      title: `${gym.name} — Gym Member Portal`,
      description: gym.description || `Join ${gym.name} on Inkuity. QR check-ins, workout tracking, nutrition planning, and more.`,
      url: `https://inkuity.com/${gym.slug}`,
      siteName: 'Inkuity',
      type: 'website',
      ...(gym.logo_url ? { images: [{ url: gym.logo_url }] } : {}),
    },
    twitter: {
      card: 'summary',
      title: `${gym.name} — Powered by Inkuity`,
      description: gym.description || `Join ${gym.name}. Track workouts, follow diet plans, and build streaks.`,
    },
    alternates: {
      canonical: `https://inkuity.com/${gym.slug}`,
    },
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
