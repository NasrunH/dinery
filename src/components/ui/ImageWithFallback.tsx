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
  const getSafeSrc = (val?: string | null): string => {
    if (!val || typeof val !== "string" || val.trim() === "") {
      return fallbackSrc;
    }
    return val;
  };

  const [imgSrc, setImgSrc] = useState<string>(() => getSafeSrc(src));

  useEffect(() => {
    setImgSrc(getSafeSrc(src));
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      unoptimized={unoptimized}
      src={imgSrc}
      alt={alt || "Image"}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
