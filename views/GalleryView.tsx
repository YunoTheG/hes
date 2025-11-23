import React from 'react';
import { INITIAL_GALLERY } from '../constants';

export const GalleryView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
           <h2 className="text-2xl font-bold text-[#0D2137]">School Gallery</h2>
           <p className="text-gray-500">Moments captured at HES</p>
        </div>
      </div>

      {/* Masonry Layout Approximation with Columns */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
        {INITIAL_GALLERY.map((photo) => (
          <div key={photo.id} className="break-inside-avoid relative group rounded-2xl overflow-hidden">
            <img 
              src={photo.imageURL} 
              alt={photo.caption} 
              className="w-full h-auto object-cover transform transition-transform duration-500 group-hover:scale-105"
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
              <p className="text-white font-medium text-lg">{photo.caption}</p>
              <p className="text-white/70 text-xs">{photo.uploadedAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};