import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
      {images.map((src, i) => (
        <motion.img
          key={i}
          src={src}
          alt={alt}
          className="w-full block"
          style={i === 0 ? {} : { position: "absolute", top: 0, left: 0, height: "100%", objectFit: "cover" }}
          animate={{ opacity: i === current ? 1 : 0 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}