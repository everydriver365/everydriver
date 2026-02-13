import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CrossfadeImagesProps {
  images: string[];
  alt: string;
  interval?: number;
  className?: string;
}

export function CrossfadeImages({ images, alt, interval = 4000, className = "" }: CrossfadeImagesProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [images.length, interval]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={current}
          src={images[current]}
          alt={alt}
          className="w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        />
      </AnimatePresence>
    </div>
  );
}
