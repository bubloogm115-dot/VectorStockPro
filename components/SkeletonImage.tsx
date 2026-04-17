import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SkeletonImageProps extends ImageProps {
  wrapperClassName?: string;
  skeletonClassName?: string;
}

export default function SkeletonImage({
  wrapperClassName = '',
  skeletonClassName = 'bg-gray-200 animate-pulse',
  className = '',
  onLoad,
  ...props
}: SkeletonImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {!isLoaded && (
        <div className={`absolute inset-0 z-0 ${skeletonClassName}`} />
      )}
      <Image
        {...props}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 z-10 relative`}
        onLoad={(e) => {
          setIsLoaded(true);
          if (onLoad) onLoad(e);
        }}
      />
    </div>
  );
}
