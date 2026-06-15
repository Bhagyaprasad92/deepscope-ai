import React from 'react';
import styles from './ResultCard.module.css';
import { CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import type { ResearchReport } from '@/lib/agents/ResearchService';

interface Props {
  report: ResearchReport;
}

export const ResultCard: React.FC<Props> = ({ report }) => {
  if (!report) return null;

  const confidence = report.confidence || 0;
  const title = report.title || 'Untitled Report';
  const answer = report.answer || 'No decisive answer found.';
  const sourceCount = report.source_count || 0;

  const getConfidenceIcon = () => {
    if (confidence > 80) return <CheckCircle2 color="var(--success, #00ff66)" size={24} />;
    if (confidence > 50) return <AlertTriangle color="var(--warning, #ffaa00)" size={24} />;
    return <ShieldAlert color="var(--danger, #ff003c)" size={24} />;
  };

  return (
    <div className={`glass-panel ${styles.card}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.confidenceBadge}>
          {getConfidenceIcon()}
          <span>{confidence}% Confidence</span>
        </div>
      </div>
      
      <div className={styles.answerContainer}>
        <h3 className={styles.answer}>{answer}</h3>
      </div>
      
      <div className={styles.metaInfo}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Sources Analyzed</span>
          <span className={styles.metaValue}>{sourceCount}</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Last Updated</span>
          <span className={styles.metaValue}>{new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
