"use client";

import Image, { ImageProps } from "next/image";
import { useState, useEffect } from "react";

const DEFAULT_FALLBACK = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

interface ImageWithFallbackProps extends Omit<ImageProps, "src"> {
  src?: string | null;
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc = DEFAULT_FALLBACK,
  alt,
  unoptimized = true, // By-pass Next.js image proxy bottleneck for fast direct CDN loading
  ...rest
}: ImageWithFallbackProps) {
  const safeFallback = (fallbackSrc && typeof fallbackSrc === "string" && fallbackSrc.trim() !== "") 
    ? fallbackSrc 
    : DEFAULT_FALLBACK;

  const getValidSrc = (val?: string | null): string => {
    if (!val || typeof val !== "string" || val.trim() === "") {
      return safeFallback;
    }
    return val.trim();
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getValidSrc(src));
  const [hasError, setHasError] = useState<boolean>(false);

  // Sinkronkan state imgSrc dan hasError secara otomatis saat prop 'src' atau 'fallbackSrc' berubah
  useEffect(() => {
    setImgSrc(getValidSrc(src));
    setHasError(false);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      unoptimized={unoptimized}
      src={hasError ? safeFallback : imgSrc}
      alt={alt || "Image"}
      onError={() => {
        if (!hasError && imgSrc !== safeFallback) {
          setHasError(true);
          setImgSrc(safeFallback);
        }
      }}
    />
  );
}
