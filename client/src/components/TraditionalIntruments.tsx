import { motion } from 'framer-motion';
import Image from 'next/image';

interface Instrument {
  name: string;
  image: string;
  description: string;
}

interface TraditionalInstrumentsProps {
  instruments?: Instrument[]; // Make it optional with default values
}

const defaultInstruments: Instrument[] = [
  {
    name: "Sitar",
    image: "/sitar.png",
    description: "A stringed instrument that's iconic to Indian classical music, especially in the Hindustani tradition."
  },
  {
    name: "Tabla",
    image: "/tabla.png",
    description: "A pair of hand drums that provide the rhythmic foundation for Hindustani classical music."
  },
  {
    name: "Veena",
    image: "/veena.png",
    description: "An ancient string instrument that's fundamental to the Carnatic music tradition."
  }
];

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export const TraditionalInstruments = ({ 
  instruments = defaultInstruments 
}: TraditionalInstrumentsProps) => {
  return (
    <section id="instruments" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={staggerContainer}
        >
          <motion.h2 
            variants={fadeIn}
            className="text-3xl md:text-4xl font-serif font-bold mb-16 text-center"
          >
            Traditional <span className="text-saffron">Instruments</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {instruments.map((instrument, index) => (
              <motion.div
                key={instrument.name}
                variants={fadeIn}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10, transition: { duration: 0.3 } }}
                className="bg-card rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 shadow-white/20 hover:shadow-white/30"
              >
                <div className="h-48 overflow-hidden">
                  <Image 
                    src={instrument.image} 
                    alt={instrument.name} 
                    width={400}
                    height={192}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-serif font-semibold mb-2">{instrument.name}</h3>
                  <p className="text-muted-foreground">{instrument.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};