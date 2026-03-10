import type { MetadataRoute } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://inkuity.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-02-21'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-02-21'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic gym landing pages
  let gymPages: MetadataRoute.Sitemap = []
  try {
    const supabase = createAdminSupabaseClient()
    const { data: gyms } = await supabase
      .from('gyms')
      .select('slug, updated_at')
      .order('created_at', { ascending: false })

    if (gyms) {
      gymPages = gyms.map((gym) => ({
        url: `${baseUrl}/${gym.slug}`,
        lastModified: gym.updated_at ? new Date(gym.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
  }

  return [...staticPages, ...gymPages]
}
