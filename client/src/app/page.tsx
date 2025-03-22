"use client"; // Required for hooks in Next.js App Router

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import FeaturedCourses from "../components/FeaturedCourses";
import WhyChoseUs from "@/components/WhyChoseUs";
import HeroSection from "@/components/ui/HeroSection";
import MusicSchoolTestinomials from "@/components/TestinomialCards"
import UpcomingWebinars from "@/components/UpcomingWebinars";
import Instructors from "@/components/Instructors";
import Footer from "@/components/Footer";
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

  return  (
    <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
      <HeroSection/>
      <FeaturedCourses/>
      <WhyChoseUs/>      
      <Instructors/>
      <Footer/>
    </main>
  ); 
}
