"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Music, ChevronDown, Menu, X } from "lucide-react";
import MusicPlayer from "@/components/ui/AudioPlayerModal";
import { TraditionalInstruments } from "@/components/TraditionalIntruments";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const slideIn = {
  hidden: { x: -60, opacity: 0 },
  visible: { 
    x: 0, 
    opacity: 1,
    transition: { type: "spring", stiffness: 100, damping: 10 }
  }
};

const pulseAnimation = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      yoyo: Infinity,
      duration: 2,
      ease: "easeInOut",
      repeatDelay: 0.5
    }
  }
};
// Default instruments data************
//const customInstruments = [
 // {
  //  name: "Flute",
   // image: "/flute.jpg",
  //  description: "A wind instrument with a divine sound in Indian classical music."
 // },
  
//];
//********** */
const Index = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  const [currentWord, setCurrentWord] = useState(0);
  const words = ["Harmony", "Melody", "Rhythm", "Tradition", "Expression"];
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    const wordInterval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2000);

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearInterval(wordInterval);
    };
  }, []);

  const scrollToContent = () => {
    const aboutSection = document.getElementById("about");
    if (aboutSection) {
      aboutSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Navbar */}
     

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-silk to-background opacity-80"></div>
          
          {/* Animated circles with Framer Motion */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={pulseAnimation}
            className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-saffron/10"
          ></motion.div>
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={pulseAnimation}
            transition={{ delay: 1 }}
            className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-peacock/10"
          ></motion.div>
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={pulseAnimation}
            transition={{ delay: 0.5 }}
            className="absolute top-1/2 right-1/3 w-48 h-48 rounded-full bg-spice/10"
          ></motion.div>
        </div>

        <div className="container mx-auto px-4 z-10">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h1 
              variants={fadeIn}
              className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-6"
            >
              Experience the Soul of Indian Classical{" "}
              <div className="relative h-16 md:h-20 lg:h-24 mt-2 overflow-hidden">
                {words.map((word, index) => (
                  <motion.span
                    key={word}
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ 
                      y: currentWord === index ? 0 : 100,
                      opacity: currentWord === index ? 1 : 0
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0 flex items-center justify-center text-saffron"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </motion.h1>

            <motion.p 
              variants={fadeIn}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
            >
              Journey through the ancient traditions of ragas, rhythms, and melodies that have shaped the cultural identity of India for centuries.
            </motion.p>

            <motion.div 
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button className="bg-saffron hover:bg-saffron/90 text-white flex items-center gap-2 text-lg px-6 py-6">
                <Play size={20} />
                Listen to Samples
              </Button>
              <Button variant="outline" className="border-saffron text-saffron hover:bg-saffron/10 text-lg px-6 py-6">
                Discover Traditions
              </Button>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 1, repeat: Infinity, repeatType: "reverse" }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
          onClick={scrollToContent}
        >
          <ChevronDown className="w-10 h-10 text-saffron" />
        </motion.div>
      </section>

      {/* About Section */}
     

      {/* Instruments Section */}
      <section id="instruments" className="py-24 bg-white">
    
      <TraditionalInstruments/>
      </section>

      {/* Ragas Section */}
      <section id="ragas" className="py-24 bg-gradient-to-b from-white to-silk/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={staggerContainer}
          >
            <motion.h2 
              variants={fadeIn}
              className="text-3xl md:text-4xl font-serif font-bold mb-6 text-center"
            >
              The Magic of <span className="text-saffron">Ragas</span>
            </motion.h2>

            <motion.p 
              variants={fadeIn}
              className="text-lg text-muted-foreground mb-16 max-w-3xl mx-auto text-center"
            >
              Ragas are melodic frameworks that form the backbone of Indian classical music, 
              each with its own emotional resonance and time of day.
            </motion.p>

            <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8">
              {[
                {
                  name: "Yaman",
                  time: "Evening",
                  mood: "Peaceful, romantic",
                  color: "bg-gradient-to-br from-peacock/80 to-peacock/20"
                },
                {
                  name: "Bhairav",
                  time: "Morning",
                  mood: "Serious, devotional",
                  color: "bg-gradient-to-br from-saffron/80 to-saffron/20"
                },
                {
                  name: "Malkauns",
                  time: "Late night",
                  mood: "Mysterious, profound",
                  color: "bg-gradient-to-br from-spice/80 to-spice/20"
                },
                {
                  name: "Desh",
                  time: "Monsoon evenings",
                  mood: "Joyful, romantic",
                  color: "bg-gradient-to-br from-sage/80 to-sage/20"
                }
              ].map((raga, index) => (
                <motion.div
                  key={raga.name}
                  variants={fadeIn}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                  className={`${raga.color} text-white rounded-xl p-6 shadow-lg`}
                >
                  <h3 className="text-xl font-serif font-semibold mb-2">Raga {raga.name}</h3>
                  <p className="opacity-80 mb-1"><span className="font-medium">Time:</span> {raga.time}</p>
                  <p className="opacity-80"><span className="font-medium">Mood:</span> {raga.mood}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-saffron to-peacock text-white">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.h2 
              variants={fadeIn}
              className="text-3xl md:text-4xl font-serif font-bold mb-6"
            >
              Begin Your Musical Journey
            </motion.h2>

            <motion.p 
              variants={fadeIn}
              className="text-lg text-white/80 mb-10 max-w-2xl mx-auto"
            >
              Explore the depth and richness of Indian classical music through our curated 
              collection of performances, lessons, and historical insights.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
             <Button 
            onClick={() => setIsPlayerOpen(true)}
            className="bg-white text-saffron hover:bg-white/90 text-lg px-6 py-6"
          >
            Start Listening
          </Button>
          <Button 
            variant="outline" 
            className="border-white text-white hover:bg-white/10 text-lg px-6 py-6"
          >
            Browse Collections
          </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
      {isPlayerOpen && (
           <motion.div 
           initial={{ opacity: 0 }} 
           animate={{ opacity: 1 }} 
           exit={{ opacity: 0 }}
           className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
         >
           <motion.div 
             initial={{ scale: 0.9 }} 
             animate={{ scale: 1 }} 
             transition={{ duration: 0.3 }}
             className="relative bg-gray-900 text-white rounded-xl p-6 max-w-md w-full shadow-xl"
           >
             <button 
               onClick={() => setIsPlayerOpen(false)}
               className="absolute top-4 right-4 text-white hover:text-gray-400 transition z-10"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                 <line x1="18" y1="6" x2="6" y2="18"></line>
                 <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
             </button>
             <MusicPlayer audioSrc="/audio/output_028.mp3" />
           </motion.div>
         </motion.div>
    )
  }
      {/* Footer */}
      <footer className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8">
            <div className="max-w-xs">
              <a href="/member" className="flex items-center gap-2 mb-4">
                <Music className="h-6 w-6 text-saffron" />
                <span className="font-serif text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-saffron to-peacock">
                  Raga Realm
                </span>
              </a>
              <p className="text-muted-foreground">
                Exploring the rich traditions and timeless beauty of Indian classical music.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="font-semibold mb-4">Explore</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Ragas</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Instruments</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Artists</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">History</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Resources</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Blog</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Tutorials</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Events</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">FAQ</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Connect</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Contact</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Newsletter</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Community</a></li>
                  <li><a href="#" className="text-muted-foreground hover:text-saffron">Support</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-border mt-12 pt-6 text-center text-muted-foreground">
            <p>© {new Date().getFullYear()} Raga Realm. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;