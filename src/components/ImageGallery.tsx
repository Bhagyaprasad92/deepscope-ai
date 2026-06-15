import React from 'react';
import styles from './ImageGallery.module.css';
import { ImageIcon } from 'lucide-react';

interface Image {
  url: string;
  attribution: string;
}

interface Props {
  images: Image[];
}

export function ImageGallery({ images }: Props) {
  if (!images || images.length === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        <ImageIcon size={20} className={styles.icon} />
        Related Media
      </h3>
      
      <div className={styles.grid}>
        {images.map((img, idx) => (
          <div key={idx} className={styles.imageWrapper}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={img.url} 
              alt="Related visualization" 
              className={styles.image}
              loading="lazy" 
            />
            <div className={styles.attribution}>
              Source: {img.attribution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
