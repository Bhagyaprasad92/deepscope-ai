import React from 'react';
import styles from './ErrorBanner.module.css';
import { AlertCircle } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export const ErrorBanner: React.FC<Props> = ({ message, onRetry }) => (
  <div className={styles.banner} role="alert">
    <AlertCircle size={20} className={styles.icon} />
    <span className={styles.message}>{message}</span>
    {onRetry && (
      <button className={styles.retryBtn} onClick={onRetry} aria-label="Retry request">
        Retry
      </button>
    )}
  </div>
);
