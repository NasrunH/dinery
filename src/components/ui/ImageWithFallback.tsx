"use client";

import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface ImageWithFallbackProps extends ImageProps {
  fallbackSrc?: string;
}

export default function ImageWithFallback({
  src,
  fallbackSrc = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
  alt,
  ...rest
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <Image
      {...rest}
      src={imgSrc}
      alt={alt || "Image"}
      onError={() => {
        setImgSrc(fallbackSrc);
      }}
    />
  );
}
