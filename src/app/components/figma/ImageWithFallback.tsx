import React, { useEffect, useState } from 'react';

type ImageWithFallbackProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string | null;
};

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, alt, style, className, fallbackSrc: fallbackOverride, ...rest } = props;
  const fallbackSrc = fallbackOverride ?? null;
  const [currentSrc, setCurrentSrc] = useState(src || fallbackSrc || '');
  const [didFallback, setDidFallback] = useState(false);

  useEffect(() => {
    setCurrentSrc(src || fallbackSrc || '');
    setDidFallback(false);
  }, [fallbackSrc, src]);

  const handleError = () => {
    if (fallbackSrc && !didFallback && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setDidFallback(true);
    } else {
      setCurrentSrc('');
      setDidFallback(true);
    }
  };

  if (!currentSrc) return null;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      data-original-url={src}
      onError={handleError}
    />
  );
}
