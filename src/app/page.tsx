"use client"; // Required for hooks in Next.js App Router

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      const role = user?.publicMetadata?.role as string | undefined;

      if (role === "admin") {
        router.replace("/admin"); // Redirect to admin dashboard
      } else {
        router.replace("/member"); // Redirect to member dashboard if role is missing or undefined
      }
    }
  }, [isSignedIn, user, router]);

  return null; // No UI, since we are redirecting immediately
}
