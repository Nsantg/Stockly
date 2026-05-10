import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LandingPage from './LandingPage';

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  return <LandingPage isLoggedIn={!!session} />;
}
