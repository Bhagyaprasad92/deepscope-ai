import React from 'react';
import styles from './EmptyState.module.css';
import { ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmptyState: React.FC = () => (
  <motion.div 
    className={styles.container}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
  >
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <ImageIcon size={80} className={styles.icon} />
    </motion.div>
    <h2 className={styles.title}>Awaiting your query</h2>
    <p className={styles.description}>Enter a directive above and watch the autonomous research pipeline fire up.</p>
  </motion.div>
);
