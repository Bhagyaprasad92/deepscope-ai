import React from 'react';
import styles from './SourcePanel.module.css';
import { ExternalLink, BookOpen } from 'lucide-react';

interface Source {
  title: string;
  url: string;
  domain: string;
  published_date: string;
  relevance_score: number;
}

interface Props {
  sources: Source[];
}

export function SourcePanel({ sources }: Props) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        <BookOpen size={20} className={styles.icon} />
        Sources & Evidence
      </h3>
      
      <div className={styles.grid}>
        {sources.map((source, idx) => (
          <div key={idx} className={`glass-panel ${styles.sourceCard}`}>
            <div className={styles.cardHeader}>
              <span className={styles.domain}>{source.domain}</span>
              <span className={styles.score}>{Math.round(source.relevance_score * 100)}% Match</span>
            </div>
            
            <h4 className={styles.title}>{source.title}</h4>
            
            <div className={styles.footer}>
              <span className={styles.date}>
                {source.published_date ? new Date(source.published_date).toLocaleDateString() : 'Unknown Date'}
              </span>
              
              <a href={source.url} target="_blank" rel="noopener noreferrer" className={styles.openBtn}>
                Open Source <ExternalLink size={14} />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
