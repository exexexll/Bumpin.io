'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { FireworkStars } from './FireworkStars';

export function LiveLoveLaughSection() {
  const { scrollY } = useScroll();
  
  // Parallax effect (continues from Hero)
  const y = useTransform(scrollY, [0, 1000], [0, 200]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Same Background as Hero - Continues seamlessly */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 -z-10"
      >
        <Image
          src="/image.jpg"
          alt="Cinematic dusk sky"
          fill
          sizes="100vw"
          className="object-cover"
          quality={90}
        />
      </motion.div>

      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 -z-[5] bg-gradient-to-b from-black/60 via-black/50 to-black/70" />

      {/* Firework Stars Animation */}
      <FireworkStars />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center justify-start px-6 sm:px-12 lg:px-20">
        <div className="max-w-7xl">
          {/* LIVE */}
          <motion.h2
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0 }}
            className="font-playfair text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] 
                       font-bold text-white leading-none tracking-tight mb-2"
          >
            LIVE
          </motion.h2>

          {/* LOVE */}
          <motion.h2
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-playfair text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] 
                       font-bold text-white leading-none tracking-tight mb-2"
          >
            LOVE
          </motion.h2>

          {/* LAUGH */}
          <motion.h2
            initial={{ opacity: 0, x: -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="font-playfair text-8xl sm:text-9xl md:text-[10rem] lg:text-[12rem] xl:text-[14rem] 
                       font-bold text-white leading-none tracking-tight"
          >
            LAUGH
          </motion.h2>
        </div>
      </div>
    </section>
  );
}

