'use client';

import { useEffect } from 'react';

export function SetCurrentGymCookie({ slug }: { slug: string }) {
  useEffect(() => {
    const maxAge = 60 * 60 * 24 * 365; // 1 year
    document.cookie = `inkuity_current_gym=${slug}; path=/; max-age=${maxAge}; samesite=lax${window.location.protocol === 'https:' ? '; secure' : ''}`;
  }, [slug]);

  return null;
}
