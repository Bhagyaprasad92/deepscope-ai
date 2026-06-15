import React from 'react';
import styles from './ResultCard.module.css';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ResearchReport } from '@/lib/agents/ResearchService';

interface Props {
  report: ResearchReport;
}

export function ResultCard({ report }: Props) {
  const getConfidenceIcon = () => {
    if (report.confidence > 80) return <CheckCircle2 color="var(--success)" size={24} />;
    if (report.confidence > 50) return <AlertTriangle color="var(--warning)" size={24} />;
    return <ShieldAlert color="var(--danger)" size={24} />;
  };

  return (
    <div className={`glass-panel ${styles.card}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{report.title}</h2>
        <div className={styles.confidenceBadge}>
          {getConfidenceIcon()}
          <span>{report.confidence}% Confidence</span>
        </div>
      </div>
      
      <div className={styles.answerContainer}>
        <h3 className={styles.answer}>{report.answer}</h3>
      </div>
      
      <div className={styles.metaInfo}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Sources Analyzed</span>
          <span className={styles.metaValue}>{report.source_count}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Last Updated</span>
          <span className={styles.metaValue}>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
