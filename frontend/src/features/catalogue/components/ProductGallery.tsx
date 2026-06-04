import React from "react";

type ProductGalleryProps = {
  images?: string[];
  mainImage: string;
  title: string;
};

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images = [],
  mainImage,
  title,
}) => {
  const [activeImage, setActiveImage] = React.useState(mainImage);
  const allImages = images.length > 0 ? images : [mainImage];

  return (
    <div className="flex flex-col gap-6">
      <div className="aspect-square overflow-hidden rounded-artisan bg-background-warm/30 border-2 border-gold-accent/20 shadow-artisan-md relative group">
        <img
          src={activeImage}
          alt={title}
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-artisan"></div>
      </div>
      {allImages.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setActiveImage(img)}
              className={`aspect-square overflow-hidden rounded-artisan border-2 transition-all duration-300 shadow-sm ${
                activeImage === img ? "border-primary-red ring-2 ring-primary-red/20 scale-105" : "border-gold-accent/10 opacity-60 hover:opacity-100 hover:border-gold-accent/40"
              }`}
            >
              <img src={img} alt={`${title} ${idx + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
