import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  // UserButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import Link from "next/link";
export const Navigation = () => {
  return (
    <nav className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <h1 className="text-xl font-semibold text-white">
              Harmony Ai
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton>
                <button className="px-2 py-1 text-sm border border-gray-500 text-white hover:bg-gray-700 transition-colors  rounded-md">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="px-2 py-1 text-sm border border-gray-500 text-white hover:bg-gray-700 transition-colors  rounded-md">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/user-profile">
                <span className="text-white hover:text-gray-400 transition-colors duration-200 px-2 py-1 rounded-md">
                  Profile
                </span>
              </Link>
              <SignOutButton>
                <button className="px-2 py-1 text-sm border border-gray-500 text-white hover:bg-gray-700 transition-colors  rounded-md">
                  Sign Out
                </button>
              </SignOutButton>
            </SignedIn>
          </div>
        </div>
      </div>
    </nav>
  );
};
