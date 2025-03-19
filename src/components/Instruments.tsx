"use client"; // Required for client-side interactivity
import React from "react";
import { motion } from "framer-motion";

const instruments = [
  {
    id: 1,
    title: "Piano",
    description: "A versatile keyboard instrument used in various genres.",
    image: "/piano.jpg",
  },
  {
    id: 2,
    title: "Guitar",
    description: "A stringed instrument popular in rock, pop, and classical music.",
    image: "/guitar.jpg",
  },
  {
    id: 3,
    title: "Drums",
    description: "A percussion instrument that forms the backbone of rhythm.",
    image: "/drums.jpg",
  },
  {
    id: 4,
    title: "Violin",
    description: "A classical string instrument known for its expressive sound.",
    image: "/violin.jpg",
  },
  {
    id: 5,
    title: "Flute",
    description: "A woodwind instrument with a soothing and melodic tone.",
    image: "/flute.jpg",
  },
  {
    id: 6,
    title: "Saxophone",
    description: "A brass instrument famous for its use in jazz and blues.",
    image: "/saxophone.jpg",
  },
  {
    id: 7,
    title: "Trumpet",
    description: "A brass instrument with a bright and powerful sound.",
    image: "/trumpet.jpg",
  },
  {
    id: 8,
    title: "Bass",
    description: "A low-pitched string instrument essential for rhythm and harmony.",
    image: "/bass.jpg",
  },
  {
    id: 9,
    title: "Cello",
    description: "A deep-toned string instrument used in classical and modern music.",
    image: "/cello.jpg",
  },
  {
    id: 10,
    title: "Harp",
    description: "A plucked string instrument known for its angelic sound.",
    image: "/harp.jpg",
  },
];

const InstrumentGrid = () => {
  return (
    <div className="mt-11">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
        {instruments.map((instrument) => (
          <div key={instrument.id} className="flex justify-center">
            <motion.div
              whileHover={{ scale: 1.05 }} // Hover animation
              whileTap={{ scale: 0.95 }} // Tap animation
              className="flex flex-col rounded-lg bg-white dark:bg-zinc-900 overflow-hidden h-full max-w-sm shadow-lg cursor-pointer"
            >
              <div className="p-4 sm:p-6 flex flex-col items-center text-center flex-grow">
                {/* Instrument Image */}
                <img
                  src={instrument.image}
                  alt={instrument.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />

                {/* Instrument Title */}
                <p className="text-lg sm:text-xl text-black mt-4 mb-2 dark:text-neutral-200">
                  {instrument.title}
                </p>

                {/* Instrument Description */}
                <p className="text-sm text-neutral-600 dark:text-neutral-400 flex-grow">
                  {instrument.description}
                </p>

                {/* Learn More Button */}
                <span className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Learn More
                </span>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstrumentGrid;