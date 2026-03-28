import { useState } from "react";
import { studentRoadmapData } from "./data/studentRoadmapData";
import { generateGraphFromPrompt } from "./lib/graphGenerator";
import KnowledgeGraph from "./components/KnowledgeGraph";
import "./CareerGuidePage.css";

export default function CareerGuidePage() {
  const [graph, setGraph] = useState(studentRoadmapData);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  async function handleGenerate(prompt) {
    setGenerating(true);
    setGenerationError(null);
    try {
      const nextGraph = await generateGraphFromPrompt(prompt);
      setGraph(nextGraph);
    } catch (error) {
      setGenerationError(error.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleReset() {
    setGraph(studentRoadmapData);
    setGenerationError(null);
  }

  return (
    <div className="cg-page">
      <KnowledgeGraph
        graph={graph}
        generating={generating}
        generationError={generationError}
        onGenerateGraph={handleGenerate}
        onResetGraph={handleReset}
      />
    </div>
  );
}
