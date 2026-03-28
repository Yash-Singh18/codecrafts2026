import mermaid from "mermaid";
import { useEffect, useId, useState } from "react";

let mermaidInitialized = false;

function ensureMermaid() {
  if (mermaidInitialized) return;

  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    flowchart: { curve: "basis" }
  });

  mermaidInitialized = true;
}

export default function MermaidViewer({ chart }) {
  const [svg, setSvg] = useState("");
  const [error, setError] = useState("");
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let isMounted = true;

    async function renderChart() {
      try {
        ensureMermaid();
        const { svg: rendered } = await mermaid.render(`mermaid-${id}`, chart);
        if (isMounted) {
          setSvg(rendered);
          setError("");
        }
      } catch (renderError) {
        if (isMounted) {
          setSvg("");
          setError(
            renderError instanceof Error
              ? renderError.message
              : "Failed to render Mermaid graph."
          );
        }
      }
    }

    if (chart.trim()) renderChart();

    return () => { isMounted = false; };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="fz-mermaid-fallback">
        {chart}
      </pre>
    );
  }

  return (
    <div
      className="fz-mermaid-viewer"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
