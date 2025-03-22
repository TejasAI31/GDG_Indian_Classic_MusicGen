"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FeaturedCourses from "../components/FeaturedCourses";
import WhyChoseUs from "@/components/WhyChoseUs";
import HeroSection from "@/components/ui/HeroSection";
import Instructors from "@/components/Instructors";
import Footer from "@/components/Footer";

export default function Home() {
    const { user, isSignedIn } = useUser();
    const router = useRouter();
    
    // Only track loading state - remove initial loading based on isSignedIn
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isSignedIn) return; // Exit early if not signed in

        // Set loading state immediately before starting checks
        setIsLoading(true);

        const checkRoleAndRedirect = async () => {
            try {
                await new Promise(resolve => setTimeout(resolve, 2500));
                
                const role = user?.publicMetadata?.role as string | undefined;
                if (role === "admin") {
                    router.replace("/admin");
                } else {
                    router.replace("/member");
                }
            } catch (error) {
                console.error("Error during redirect:", error);
            } finally {
                setIsLoading(false); // Always clear loading state after completion
            }
        };

        checkRoleAndRedirect();
    }, [isSignedIn, user, router]);

    return (
        <main className="min-h-screen bg-black/[0.96] antialiased bg-grid-white/[0.02]">
            {isLoading ? (
                <div className="flex justify-center items-center h-screen">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="text-white ml-4">Redirecting to your dashboard...</p>
                </div>
            ) : (
                <>
                    <HeroSection />
                    <FeaturedCourses />
                    <WhyChoseUs />
                    <Instructors />
                    <Footer />
                </>
            )}
        </main>
    );
}