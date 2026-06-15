import React from 'react';
import styles from './ExportMenu.module.css';
import { Download, FileText, FileJson } from 'lucide-react';
import type { ResearchReport } from '@/lib/agents/ResearchService';

interface Props {
  report: ResearchReport;
}

export const ExportMenu: React.FC<Props> = ({ report }) => {
  const exportAsJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `deepscope-report-${Date.now()}.json`);
    dlAnchorElem.click();
  };

  const exportAsMarkdown = () => {
    const md = `# ${report?.title || 'Report'}
    
## Answer
${report?.answer || 'No answer'}

**Confidence**: ${report?.confidence || 0}%
*${report?.confidence_reason || ''}*

## Key Findings
${(report?.findings || []).map(f => `- ${f}`).join('\n')}

## Sources
${(report?.references || []).map(r => `- [${r.title || r.url}](${r.url}) (${r.domain || ''})`).join('\n')}
`;
    const dataStr = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `deepscope-report-${Date.now()}.md`);
    dlAnchorElem.click();
  };

  const exportAsPDF = () => {
    // In a real implementation, this would use jsPDF or call a backend service.
    // For this prototype, we trigger the print dialog which allows "Save as PDF"
    window.print();
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        <Download size={20} className={styles.icon} />
        Export Report
      </h3>
      
      <div className={styles.buttonGroup}>
        <button onClick={exportAsPDF} className={styles.btn} aria-label="Export report as PDF" title="Export as PDF">
          <FileText size={16} /> Save as PDF
        </button>
        <button onClick={exportAsMarkdown} className={styles.btn} aria-label="Export report as Markdown" title="Export as Markdown">
          <FileText size={16} /> Markdown
        </button>
        <button onClick={exportAsJSON} className={styles.btn} aria-label="Export report as JSON" title="Export as JSON">
          <FileJson size={16} /> JSON
        </button>
      </div>
    </div>
  );
}
