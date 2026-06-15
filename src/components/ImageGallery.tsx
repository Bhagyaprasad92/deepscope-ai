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

const ImageWithFallback = ({ src, alt, attribution }: { src: string; alt: string; attribution: string }) => {
  const [error, setError] = React.useState(false);

  return (
    <div className={styles.imageWrapper}>
      {error ? (
        <div className={styles.image} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-hud)', color: 'var(--text-dim)' }}>
          Image unavailable
        </div>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img 
          src={`/api/image-proxy?url=${encodeURIComponent(src)}`} 
          alt={alt} 
          className={styles.image}
          loading="lazy" 
          onError={() => setError(true)}
        />
      )}
      <div className={styles.attribution}>
        Source: {attribution}
      </div>
    </div>
  );
};

export const ImageGallery: React.FC<Props> = ({ images }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        <ImageIcon size={20} className={styles.icon} />
        Related Media
      </h3>
      
      <div className={styles.grid}>
        {images.map((img, idx) => (
          <ImageWithFallback key={idx} src={img.url} alt="Related visualization" attribution={img.attribution} />
        ))}
      </div>
    </div>
  );
}
