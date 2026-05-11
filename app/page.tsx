import { redirect } from 'next/navigation';

export default function Home() {
  // Simple redirect to dashboard (which will then redirect to login if no session)
  redirect('/dashboard');
}
