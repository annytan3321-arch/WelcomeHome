import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import type { ImageKey } from '../data/properties.ts';
import { PROPERTY_IMAGES } from '../utils/propertyImages.ts';

interface PropertyImageProps {
  imageKey: ImageKey;
  alt: string;
  className?: string;
}

export const PropertyImage: React.FC<PropertyImageProps> = ({
  imageKey,
  alt,
  className = 'h-full w-full object-cover',
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !PROPERTY_IMAGES[imageKey]) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4 text-center text-slate-500">
        <Building2 className="h-8 w-8 text-slate-400" />
        <span className="mt-2 text-xs font-medium text-slate-600 line-clamp-1">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={PROPERTY_IMAGES[imageKey]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
