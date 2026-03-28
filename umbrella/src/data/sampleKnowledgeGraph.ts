import type { KnowledgeGraphData } from "../types/knowledge";

export const sampleKnowledgeGraph: KnowledgeGraphData = {
  nodes: [
    {
      id: "architect",
      label: "The Future-Ready Architect",
      type: "nexus",
      description:
        "A student roadmap that integrates analytical rigor, commercial judgment, and humane design into one long-term learning system.",
      icon: "GraduationCap"
    },

    { id: "s-logic", label: "Logic", domain: "science", level: "basics", parentId: "architect", description: "Formal reasoning patterns that sharpen proof, structure, and computational thinking.", icon: "Variable" },
    { id: "s-arithmetic", label: "Arithmetic", domain: "science", level: "basics", parentId: "architect", description: "Numerical fluency for measurement, abstraction, and quantitative confidence.", icon: "Calculator" },
    { id: "s-scimethod", label: "Scientific Method", domain: "science", level: "basics", parentId: "architect", description: "Hypothesis, experimentation, and evidence-based iteration.", icon: "Microscope" },
    { id: "s-ds", label: "Data Structures", domain: "science", level: "core", parentId: "s-logic", description: "Organizing data for scalable search, retrieval, and algorithmic performance.", icon: "Network" },
    { id: "s-physics", label: "Physics", domain: "science", level: "core", parentId: "s-arithmetic", description: "Modeling motion, systems, and constraints in the physical world.", icon: "Atom" },
    { id: "s-prob", label: "Probability", domain: "science", level: "core", parentId: "s-scimethod", description: "Reasoning about uncertainty, inference, and predictive confidence.", icon: "Orbit" },
    { id: "s-algo", label: "Algorithms", domain: "science", level: "core", parentId: "s-ds", description: "Stepwise problem-solving patterns that transform logic into execution.", icon: "Cpu" },
    { id: "s-ai", label: "AI Systems", domain: "science", level: "strong", parentId: "s-algo", description: "Machine intelligence pipelines built on representation, optimization, and evaluation.", icon: "BrainCircuit" },
    { id: "s-quantum", label: "Quantum Computing", domain: "science", level: "strong", parentId: "s-physics", description: "Next-generation computing models rooted in superposition and entanglement.", icon: "Sparkles" },
    { id: "s-mlops", label: "ML Infrastructure", domain: "science", level: "strong", parentId: "s-prob", description: "Deployment, observability, and operational discipline for reliable intelligent products.", icon: "FlaskConical" },

    { id: "c-micro", label: "Microeconomics", domain: "commerce", level: "basics", parentId: "architect", description: "How incentives, scarcity, and trade-offs shape decisions.", icon: "CircleDollarSign" },
    { id: "c-accounting", label: "Accounting", domain: "commerce", level: "basics", parentId: "architect", description: "Reading the language of financial reality through statements and controls.", icon: "Wallet" },
    { id: "c-markets", label: "Market Systems", domain: "commerce", level: "basics", parentId: "architect", description: "Understanding buyers, sellers, pricing power, and market structure.", icon: "TrendingUp" },
    { id: "c-law", label: "Business Law", domain: "commerce", level: "core", parentId: "c-micro", description: "Contracts, governance, and legal constraints that shape execution.", icon: "Gavel" },
    { id: "c-finance", label: "Finance", domain: "commerce", level: "core", parentId: "c-accounting", description: "Capital allocation, risk, valuation, and cost of money.", icon: "BadgeDollarSign" },
    { id: "c-ops", label: "Operations Strategy", domain: "commerce", level: "core", parentId: "c-markets", description: "Coordinating systems, throughput, and process design for scale.", icon: "BriefcaseBusiness" },
    { id: "c-growth", label: "Growth Strategy", domain: "commerce", level: "core", parentId: "c-markets", description: "Positioning, market entry, and compounding distribution advantages.", icon: "LineChart" },
    { id: "c-global", label: "Global Strategy", domain: "commerce", level: "strong", parentId: "c-growth", description: "Competing across regions, regulation, supply chains, and cultural context.", icon: "Globe2" },
    { id: "c-vc", label: "Venture Capital", domain: "commerce", level: "strong", parentId: "c-finance", description: "Evaluating asymmetric upside, product bets, and founder-market fit.", icon: "Gem" },
    { id: "c-fintech", label: "Algorithmic Trading", domain: "commerce", level: "strong", parentId: "c-finance", description: "Executing financial strategy through models, automation, and market signals.", icon: "Landmark" },

    { id: "a-psych", label: "Psychology 101", domain: "arts", level: "basics", parentId: "architect", description: "Human perception, cognition, motivation, and behavioral patterns.", icon: "UserRoundSearch" },
    { id: "a-english", label: "English Composition", domain: "arts", level: "basics", parentId: "architect", description: "Clarity in writing, argument, and narrative framing.", icon: "BookText" },
    { id: "a-visual", label: "Visual Literacy", domain: "arts", level: "basics", parentId: "architect", description: "Reading symbols, hierarchy, and visual intent across media.", icon: "Palette" },
    { id: "a-design", label: "Design Thinking", domain: "arts", level: "core", parentId: "a-psych", description: "Problem framing, ideation, and iterative solution design around human needs.", icon: "Lightbulb" },
    { id: "a-ux", label: "UX Research", domain: "arts", level: "core", parentId: "a-psych", description: "Turning human observation into defensible product insight.", icon: "Compass" },
    { id: "a-story", label: "Narrative Systems", domain: "arts", level: "core", parentId: "a-english", description: "Using story structure to align people around meaning and action.", icon: "PenTool" },
    { id: "a-ethics", label: "Digital Ethics", domain: "arts", level: "strong", parentId: "a-design", description: "Evaluating power, fairness, consent, and responsibility in digital systems.", icon: "Scale" },
    { id: "a-ixd", label: "Interaction Design", domain: "arts", level: "strong", parentId: "a-ux", description: "Crafting responsive systems that feel legible, intuitive, and alive.", icon: "DraftingCompass" },
    { id: "a-spec", label: "Speculative Futures", domain: "arts", level: "strong", parentId: "a-story", description: "Imagining long-range consequences and designing with future scenarios in mind.", icon: "Waves" }
  ],
  edges: [
    { id: "e-architect-s-logic", source: "architect", target: "s-logic" },
    { id: "e-architect-s-arithmetic", source: "architect", target: "s-arithmetic" },
    { id: "e-architect-s-scimethod", source: "architect", target: "s-scimethod" },
    { id: "e-s-logic-s-ds", source: "s-logic", target: "s-ds" },
    { id: "e-s-arithmetic-s-physics", source: "s-arithmetic", target: "s-physics" },
    { id: "e-s-scimethod-s-prob", source: "s-scimethod", target: "s-prob" },
    { id: "e-s-ds-s-algo", source: "s-ds", target: "s-algo" },
    { id: "e-s-algo-s-ai", source: "s-algo", target: "s-ai" },
    { id: "e-s-physics-s-quantum", source: "s-physics", target: "s-quantum" },
    { id: "e-s-prob-s-mlops", source: "s-prob", target: "s-mlops" },

    { id: "e-architect-c-micro", source: "architect", target: "c-micro" },
    { id: "e-architect-c-accounting", source: "architect", target: "c-accounting" },
    { id: "e-architect-c-markets", source: "architect", target: "c-markets" },
    { id: "e-c-micro-c-law", source: "c-micro", target: "c-law" },
    { id: "e-c-accounting-c-finance", source: "c-accounting", target: "c-finance" },
    { id: "e-c-markets-c-ops", source: "c-markets", target: "c-ops" },
    { id: "e-c-markets-c-growth", source: "c-markets", target: "c-growth" },
    { id: "e-c-growth-c-global", source: "c-growth", target: "c-global" },
    { id: "e-c-finance-c-vc", source: "c-finance", target: "c-vc" },
    { id: "e-c-finance-c-fintech", source: "c-finance", target: "c-fintech" },

    { id: "e-architect-a-psych", source: "architect", target: "a-psych" },
    { id: "e-architect-a-english", source: "architect", target: "a-english" },
    { id: "e-architect-a-visual", source: "architect", target: "a-visual" },
    { id: "e-a-psych-a-design", source: "a-psych", target: "a-design" },
    { id: "e-a-psych-a-ux", source: "a-psych", target: "a-ux" },
    { id: "e-a-english-a-story", source: "a-english", target: "a-story" },
    { id: "e-a-design-a-ethics", source: "a-design", target: "a-ethics" },
    { id: "e-a-ux-a-ixd", source: "a-ux", target: "a-ixd" },
    { id: "e-a-story-a-spec", source: "a-story", target: "a-spec" },

    { id: "impact-s-arithmetic-c-fintech", source: "s-arithmetic", target: "c-fintech", type: "impactEdge", label: "Math -> Markets", description: "Numerical fluency matures into model-based decision making in algorithmic trading." },
    { id: "impact-s-prob-c-finance", source: "s-prob", target: "c-finance", type: "impactEdge", label: "Risk -> Valuation", description: "Probabilistic reasoning sharpens portfolio construction, pricing, and risk-adjusted judgment." },
    { id: "impact-s-ai-c-vc", source: "s-ai", target: "c-vc", type: "impactEdge", label: "AI -> Investment", description: "Understanding intelligent systems improves the ability to evaluate frontier product bets." },
    { id: "impact-s-mlops-a-ixd", source: "s-mlops", target: "a-ixd", type: "impactEdge", label: "Systems -> Experience", description: "Reliable AI infrastructure enables interactions that feel consistent and trustworthy." },
    { id: "impact-c-law-a-ethics", source: "c-law", target: "a-ethics", type: "impactEdge", label: "Policy -> Responsibility", description: "Legal structures and ethical frameworks meet where digital products touch public life." },
    { id: "impact-c-global-a-spec", source: "c-global", target: "a-spec", type: "impactEdge", label: "Scale -> Futures", description: "Global strategy becomes stronger when long-range societal consequences are part of planning." },
    { id: "impact-a-psych-s-ai", source: "a-psych", target: "s-ai", type: "impactEdge", label: "Behavior -> Intelligence", description: "Human cognition informs how intelligent systems are modeled, evaluated, and deployed." },
    { id: "impact-a-ux-c-growth", source: "a-ux", target: "c-growth", type: "impactEdge", label: "Research -> Growth", description: "Better user understanding creates sharper positioning and more resilient expansion strategies." },
    { id: "impact-a-english-c-vc", source: "a-english", target: "c-vc", type: "impactEdge", label: "Story -> Capital", description: "Clear narrative framing often determines whether complex ideas attract funding." }
  ]
};
