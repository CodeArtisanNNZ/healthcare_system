"use client";

import { useEffect, useState } from "react";

const images = [
  "/images/home-care-family.png",
  "/images/home-care-nurse.png",
  "/images/home-care-mother.png",
];

export function HeroImageRotator({ className }: { className: string }) {
  const [src, setSrc] = useState(images[0]);

  useEffect(() => {
    setSrc(images[Math.floor(Math.random() * images.length)]);
  }, []);

  return <div className={className} aria-hidden="true"><img src={src} alt="" /></div>;
}
