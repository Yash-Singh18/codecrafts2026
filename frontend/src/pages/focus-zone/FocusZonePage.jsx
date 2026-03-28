import "katex/dist/katex.min.css";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  Download,
  FileText,
  Sparkles,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  Upload,
  Zap,
  GraduationCap
} from "lucide-react";
import { useMemo, useState, useRef } from "react";
import jsPDF from "jspdf";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import { parseAndSummarizePdf } from "../../services/focusZone/summarizer";
import InteractiveMap from "./components/InteractiveMap";
import "./FocusZonePage.css";

function extractMainBody(summary) {
  return summary.replace(/```mermaid[\s\S]*?```/gi, "").trim();
}

export default function FocusZonePage() {
  const [file, setFile] = useState(null);
  const [vibe, setVibe] = useState("beginner");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const mainBody = useMemo(
    () => extractMainBody(result?.summary ?? ""),
    [result?.summary]
  );

  function onFileChange(event) {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setError("");
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile);
      setError("");
    } else {
      setError("Please drop a PDF file.");
    }
  }

  async function onSubmit() {
    if (!file) {
      setError("Choose a PDF before running the summarizer.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const nextResult = await parseAndSummarizePdf(file, {
        vibe,
        fileName: file.name
      });
      setResult(nextResult);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Summarization failed."
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadStudyGuide() {
    if (!result) return;

    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 40;
    const width = doc.internal.pageSize.getWidth() - margin * 2;
    let y = 48;

    const writeWrappedBlock = (title, body) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, margin, y);
      y += 18;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);

      const lines = doc.splitTextToSize(body, width);
      lines.forEach((line) => {
        if (y > 780) {
          doc.addPage();
          y = 48;
        }
        doc.text(line, margin, y);
        y += 14;
      });
      y += 12;
    };

    writeWrappedBlock("Study Guide", mainBody);

    if (result.cheatSheet.length) {
      writeWrappedBlock("Exam Cheat Sheet", result.cheatSheet.join("\n"));
    }

    doc.save(
      `${file?.name.replace(/\.pdf$/i, "") ?? "study-guide"}-study-guide.pdf`
    );
  }

  function startOver() {
    setResult(null);
    setFile(null);
    setError("");
  }

  // Upload screen
  if (!result) {
    return (
      <div className="fz-page">
        <div className="fz-upload">
          <div className="fz-upload__header">
            <div className="fz-upload__icon-wrap">
              <Zap size={28} />
            </div>
            <h1 className="fz-upload__title">
              Upload. Summarize. <span className="fz-upload__title-accent">Learn.</span>
            </h1>
            <p className="fz-upload__subtitle">
              Generate perfectly structured study guides, interactive logic maps, and cheat sheets in seconds.
            </p>
          </div>

          <div className="fz-upload__card">
            <label
              className={`fz-upload__dropzone ${dragOver ? 'fz-upload__dropzone--active' : ''} ${file ? 'fz-upload__dropzone--has-file' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
            >
              <div className="fz-upload__dropzone-icon">
                {file ? <CheckCircle2 size={32} /> : <Upload size={32} />}
              </div>
              <div className="fz-upload__dropzone-text">
                <p className="fz-upload__dropzone-primary">
                  {file ? file.name : "Click or drag to upload your PDF"}
                </p>
                <p className="fz-upload__dropzone-hint">
                  {file
                    ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
                    : "Supports documents up to 10 MB"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                accept="application/pdf"
                className="fz-upload__file-input"
                type="file"
                onChange={onFileChange}
              />
            </label>

            <div className="fz-upload__controls">
              <div className="fz-vibe-toggle">
                <button
                  className={`fz-vibe-toggle__btn ${vibe === 'beginner' ? 'fz-vibe-toggle__btn--active' : ''}`}
                  onClick={() => setVibe("beginner")}
                  type="button"
                >
                  <GraduationCap size={16} />
                  Beginner
                </button>
                <button
                  className={`fz-vibe-toggle__btn ${vibe === 'expert' ? 'fz-vibe-toggle__btn--active' : ''}`}
                  onClick={() => setVibe("expert")}
                  type="button"
                >
                  <Zap size={16} />
                  Expert
                </button>
              </div>

              <button
                className="fz-upload__submit"
                onClick={onSubmit}
                disabled={loading || !file}
              >
                {loading ? (
                  <>
                    <span className="fz-spinner" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Guide
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="fz-error">
                <p>{error}</p>
              </div>
            )}
          </div>

          {loading && (
            <div className="fz-loading-status">
              <div className="fz-loading-status__bar">
                <div className="fz-loading-status__progress" />
              </div>
              <p className="fz-loading-status__text">
                Parsing your PDF and generating study materials...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results screen
  return (
    <div className="fz-page">
      <div className="fz-results">
        {/* Header bar */}
        <div className="fz-results__header">
          <div className="fz-results__file-info">
            <div className="fz-results__file-icon">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="fz-results__file-name">
                {file?.name?.replace(/\.pdf$/i, "") ?? "Your Study Guide"}
              </h2>
              <div className="fz-results__meta">
                <span className="fz-badge fz-badge--accent">{result.chunks} chunks</span>
                <span className="fz-results__meta-sep" />
                <span className="fz-badge fz-badge--subtle">{vibe} mode</span>
                <span className="fz-results__meta-sep" />
                <span className="fz-badge fz-badge--subtle">{result.source}</span>
              </div>
            </div>
          </div>
          <div className="fz-results__actions">
            <button className="fz-btn fz-btn--ghost" onClick={startOver}>
              <RotateCcw size={16} />
              Start Over
            </button>
            <button className="fz-btn fz-btn--primary" onClick={downloadStudyGuide}>
              <Download size={16} />
              Download PDF
            </button>
          </div>
        </div>

        {/* Content sections */}
        <AnimatePresence mode="wait">
          <motion.div
            key={result.summary}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fz-results__grid"
          >
            {/* Summary */}
            <section className="fz-section">
              <div className="fz-section__header">
                <span className="fz-section__icon fz-section__icon--amber">
                  <Sparkles size={20} />
                </span>
                <h3 className="fz-section__title">Summary</h3>
              </div>
              <div className="fz-section__body fz-prose">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {mainBody}
                </ReactMarkdown>
              </div>
            </section>

            {/* Interactive Logic Map */}
            <section className="fz-section">
              <div className="fz-section__header">
                <span className="fz-section__icon fz-section__icon--blue">
                  <BrainCircuit size={20} />
                </span>
                <h3 className="fz-section__title">Logic Map</h3>
              </div>
              <div className="fz-section__body">
                <InteractiveMap tree={result.logicMap} />
              </div>
            </section>

            {/* Cheat Sheet */}
            {result.cheatSheet.length > 0 && (
              <section className="fz-section">
                <div className="fz-section__header">
                  <span className="fz-section__icon fz-section__icon--green">
                    <BookOpen size={20} />
                  </span>
                  <h3 className="fz-section__title">Exam Cheat Sheet</h3>
                </div>
                <div className="fz-section__body">
                  <ul className="fz-cheatsheet">
                    {result.cheatSheet.map((point, i) => (
                      <li key={i} className="fz-cheatsheet__item">
                        <span className="fz-cheatsheet__num">{i + 1}</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
