"use client";

import { useState } from "react";
import { Search, Loader2, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";

import { ResultCard } from "@/components/ResultCard";
import { SourcePanel } from "@/components/SourcePanel";
import { ImageGallery } from "@/components/ImageGallery";
import { ExportMenu } from "@/components/ExportMenu";
import { EmptyState } from "@/components/EmptyState";
import { ErrorBanner } from "@/components/ErrorBanner";

export default function Home() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("IDLE");
  const [report, setReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setReport(null);
    setStatus("INITIALIZING_UPLINK");

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.body) throw new Error("No signal detected.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value);
        
        const lines = chunkValue.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.status) setStatus(data.status.replace(/ /g, '_').toUpperCase());
            if (data.report) setReport(data.report);
            if (data.error) {
              console.error(data.error, data.details);
              setErrorMsg(`${data.error} Details: ${data.details || 'Unknown'}`);
              setStatus("CRITICAL_ERROR");
            }
          } catch (e) {
             // skip incomplete chunks
          }
        }
      }
    } catch (error) {
      console.error(error);
      if (!errorMsg) setErrorMsg(error instanceof Error ? error.message : String(error));
      setStatus("UPLINK_FAILED");
    } finally {
      setIsLoading(false);
      if (status !== "CRITICAL_ERROR" && status !== "UPLINK_FAILED") {
         setStatus("IDLE");
      }
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
           <div className={styles.systemStatus}>
             <div className={styles.blinker}></div>
             SYSTEM: ONLINE
           </div>
           <div className={styles.systemStatus}>
             <Activity size={14} />
             DATALINK: {status}
           </div>
        </div>
      </header>

      <motion.div 
        className={styles.hero}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h1 className={styles.title}>DeepScope_AI</h1>
        <p className={styles.subtitle}>
          Planetary Data Aggregation Network v9.4
        </p>
      </motion.div>

      <main style={{ width: '100%', flex: 1 }}>
        <form onSubmit={handleSearch} className={styles.searchContainer}>
          <div className={styles.searchBox}>
            <div className={styles.searchIconWrapper}>
               <Search size={24} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ENTER QUERY DIRECTIVE..."
              className={styles.searchInput}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.searchButton}
              disabled={isLoading || !query.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  PROCESSING
                </>
              ) : "EXECUTE"}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <ErrorBanner message={errorMsg} onRetry={() => { setErrorMsg(""); setStatus("IDLE"); }} />
            </motion.div>
          )}
          {isLoading && !report && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`hud-panel ${styles.loadingPanel}`}>
               <Loader2 className="animate-spin" size={20} />
               <span>&gt;_ {status}</span>
            </motion.div>
          )}
          {!isLoading && !report && !errorMsg && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState />
            </motion.div>
          )}

          {report && (
            <motion.div 
              className={styles.resultsContainer}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, staggerChildren: 0.1 }}
            >
              <ResultCard report={report} />
              
              {report.findings && report.findings.length > 0 && (
                <motion.div className={`hud-panel ${styles.findingsPanel}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <h3 className={styles.findingsHeader}>Key Analytics Extracted</h3>
                  <ul className={styles.findingsList}>
                    {report.findings.map((f: string, i: number) => (
                      <motion.li key={i} className={styles.findingItem} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                        <span className={styles.findingBullet}>[&gt;]</span> 
                        <span>{f}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}

              <ImageGallery images={report.images} />
              <SourcePanel sources={report.references} />
              <ExportMenu report={report} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
