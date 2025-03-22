"use client";
import React from "react";
import { StickyScroll } from "./ui/sticky-scroll-reveal";

const musicGenerationPlatformContent = [
  {
    title: "Customizable Instrumentation:",
    description:
      "Complete creative control at your fingertips. Select from our vast library of instruments including orchestral strings, electronic synths, acoustic drums, bass, guitars, and more. Mix and match to create your perfect ensemble or let our AI suggest combinations based on your genre preferences.",
  },
  {
    title: "Precision Parameter Controls:",
    description:
      "Fine-tune your music with detailed parameter settings including BPM, key signature, time signature, song structure, and dynamic range. Adjust the energy curve of your track, set specific section lengths, and control the complexity level for each instrument to craft the exact sound you're looking for.",
  },
  {
    title: "Seed-Based Generation:",
    description:
      "Upload your own MP3 or MIDI file as a creative seed, and our AI will analyze its style, mood, and patterns to generate similar compositions. Perfect for extending demos, creating variations of your favorite tracks, or developing companion pieces that maintain your unique musical signature.",
  },
  {
    title: "Style Fusion Technology:",
    description:
      "Blend multiple genres and eras with our innovative Style Fusion technology. Combine classical orchestration with modern trap beats, merge jazz improvisations with electronic dance elements, or create entirely new genre hybrids. Our platform intelligently balances influences to create coherent, professional tracks that break creative boundaries.",
  },
];
  
function WhyChoseUs() {
  return (
    <div>
        <StickyScroll content={musicGenerationPlatformContent}/>
    </div>
  )
}

export default WhyChoseUs