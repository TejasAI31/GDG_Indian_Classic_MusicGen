import Link from "next/link"
import { Spotlight } from "./Spotlight"
function HeroSection() {
    return (
        <div className="h-auto md:h-[40rem] w-full rounded-md flex flex-col items-center justify-center relative overflow-hidden mx-auto py-10 md:py-0"
        >
            <Spotlight
        className="-top-40 left-0 md:left-40 md:-top-20"
        fill="white"
      />
            <div className="p-4 relative x-10 w-full text-center"
            >
                <h1
                    className="mt-20 md:mt-0 text-4xl md:text-7xl font-bold bg-clip-text  bg-gradient-to-b from-neutral-50 to-neutral-400 cursor-pointer text-white"
                >Dive into the world on Indian classical music</h1>
                <p
                    className="mt-4 font-normal text-base md:text-lg text-neutral-300 max-w-lg mx-auto"
                >On our platform u can generate indian classical music from scratch .</p>
                <div className="mt-4">
                    <Link href="">
                    <button className="bg-gradient-to-r from-purple-500 to-purple-700 text-white border border-purple-300 dark:border-purple-600 px-4 py-2 font-medium relative overflow-hidden group transition-all duration-500 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-purple-500/50 hover:border-purple-400 dark:hover:border-purple-500 hover:-translate-y-1 active:translate-y-0 hover:bg-gradient-to-r hover:from-purple-600 hover:to-purple-800 hover:rounded-lg hover:shadow-xl">
  <span className="relative z-10">Explore features</span> 
  <span className="absolute bottom-0 left-0 w-0 h-1 bg-purple-300 group-hover:w-full transition-all duration-300"></span>
</button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default HeroSection