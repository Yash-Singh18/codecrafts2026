import { UniversalKnowledgeGraph } from "./components/UniversalKnowledgeGraph";
import { studentRoadmapData } from "./data/studentRoadmapData";
import { generateGraphFromPrompt } from "./lib/graphGenerator";
import { useState } from "react";

export default function App() {
  const [graph, setGraph] = useState(studentRoadmapData);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  async function handleGenerate(prompt: string) {
    setGenerating(true);
    setGenerationError(null);

    try {
      const nextGraph = await generateGraphFromPrompt(prompt);
      setGraph(nextGraph);
    } catch (error) {
      setGenerationError((error as Error).message);
    } finally {
      setGenerating(false);
    }
  }

  function handleResetGraph() {
    setGraph(studentRoadmapData);
    setGenerationError(null);
  }

  return (
    <UniversalKnowledgeGraph
      graph={graph}
      generating={generating}
      generationError={generationError}
      onGenerateGraph={handleGenerate}
      onResetGraph={handleResetGraph}
    />
  );
}
