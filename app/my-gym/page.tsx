import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function MyGymRedirect() {
  const cookieStore = await cookies();
  const slug = cookieStore.get('inkuity_current_gym')?.value;

  if (slug) {
    redirect(`/${slug}/portal/dashboard`);
  }

  redirect('/');
}
