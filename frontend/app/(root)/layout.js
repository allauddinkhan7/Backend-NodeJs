// app/(root)/layout.js
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { currentUser } from '@/lib/actions/user.actions';

export default function RootLayout({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const user = await currentUser();
      setUser(user);
      setLoading(false);
      if (!user) {
        router.push('/sign-in');
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null; // Redirecting to sign-in
  }

  return (
    <>
      <div>{children}</div>
    </>
  );
}