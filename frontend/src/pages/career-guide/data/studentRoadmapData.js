export const studentRoadmapData = {
  nodes: [
    {
      id: "student",
      label: "Student Career Roadmap",
      type: "nexus",
      description:
        "Start broad, then drill down. Ask for medicine, finance, technology, arts, commerce, or any field in the chat to generate a detailed roadmap."
    },
    {
      id: "science",
      label: "Science",
      type: "stream",
      domain: "science",
      parentId: "student",
      description: "Core analytical stream leading to medicine, engineering, research, and deep tech.",
      icon: "FlaskConical"
    },
    {
      id: "commerce",
      label: "Commerce",
      type: "stream",
      domain: "commerce",
      parentId: "student",
      description: "Business, finance, accounting, law, markets, and entrepreneurship.",
      icon: "TrendingUp"
    },
    {
      id: "arts",
      label: "Arts & Humanities",
      type: "stream",
      domain: "arts",
      parentId: "student",
      description: "Design, communication, psychology, civil services, law, and creative careers.",
      icon: "Palette"
    },
    {
      id: "technology",
      label: "Technology",
      type: "domain",
      domain: "science",
      level: "core",
      parentId: "science",
      description: "Engineering, software, AI, electronics, and product-building paths.",
      icon: "Cpu"
    },
    {
      id: "medicine",
      label: "Medicine",
      type: "domain",
      domain: "science",
      level: "core",
      parentId: "science",
      description: "PCB-led medical paths including MBBS, AYUSH, nursing, pharmacy, and allied health sciences.",
      icon: "HeartPulse"
    },
    {
      id: "research",
      label: "Research",
      type: "domain",
      domain: "science",
      level: "strong",
      parentId: "science",
      description: "Pure science, lab work, higher studies, and advanced R&D careers.",
      icon: "Atom"
    },
    {
      id: "finance",
      label: "Finance",
      type: "domain",
      domain: "commerce",
      level: "core",
      parentId: "commerce",
      description: "Accounting, banking, investments, risk, and capital markets.",
      icon: "BadgeDollarSign"
    },
    {
      id: "business",
      label: "Business & Management",
      type: "domain",
      domain: "commerce",
      level: "core",
      parentId: "commerce",
      description: "Management, operations, entrepreneurship, product strategy, and startups.",
      icon: "BriefcaseBusiness"
    },
    {
      id: "law",
      label: "Law",
      type: "domain",
      domain: "commerce",
      level: "strong",
      parentId: "commerce",
      description: "Corporate law, litigation, policy, and regulatory careers.",
      icon: "Gavel"
    },
    {
      id: "design",
      label: "Design & UX",
      type: "domain",
      domain: "arts",
      level: "core",
      parentId: "arts",
      description: "Visual design, UI/UX, product design, communication, and digital experiences.",
      icon: "Compass"
    },
    {
      id: "psychology",
      label: "Psychology",
      type: "domain",
      domain: "arts",
      level: "core",
      parentId: "arts",
      description: "Human behavior, counselling, HR, therapy, and organizational insight.",
      icon: "UserRoundSearch"
    },
    {
      id: "civil-services",
      label: "Civil Services",
      type: "domain",
      domain: "arts",
      level: "strong",
      parentId: "arts",
      description: "UPSC-centered public leadership, governance, policy, and administration.",
      icon: "Globe2"
    },
    {
      id: "ai-careers",
      label: "AI / Data Science",
      type: "career",
      domain: "science",
      level: "strong",
      parentId: "technology",
      description: "Machine learning, analytics, intelligent systems, and AI product work.",
      icon: "Brain",
      duration: "UG + specialization"
    },
    {
      id: "doctor-careers",
      label: "Clinical & Medical Careers",
      type: "career",
      domain: "science",
      level: "strong",
      parentId: "medicine",
      description: "Doctor, specialist, hospital, public health, and allied health outcomes.",
      icon: "Microscope",
      duration: "5+ yrs"
    },
    {
      id: "ca-careers",
      label: "CA / Banking / Investments",
      type: "career",
      domain: "commerce",
      level: "strong",
      parentId: "finance",
      description: "Chartered accountancy, banking exams, equity research, and investment paths.",
      icon: "Wallet",
      duration: "3-5 yrs"
    },
    {
      id: "startup-careers",
      label: "MBA / Startup / Growth",
      type: "career",
      domain: "commerce",
      level: "strong",
      parentId: "business",
      description: "Management, product leadership, consulting, and entrepreneurship.",
      icon: "Gem",
      duration: "3-6 yrs"
    },
    {
      id: "ux-careers",
      label: "UI / UX / Product Design",
      type: "career",
      domain: "arts",
      level: "strong",
      parentId: "design",
      description: "Design systems, interaction design, UX research, and product experiences.",
      icon: "DraftingCompass",
      duration: "Portfolio-driven"
    },
    {
      id: "upsc-careers",
      label: "IAS / IPS / Policy",
      type: "career",
      domain: "arts",
      level: "strong",
      parentId: "civil-services",
      description: "Administrative services, public policy, governance, and institutional leadership.",
      icon: "BookText",
      duration: "1-3 yrs prep"
    }
  ],
  edges: [
    { id: "e-student-science", source: "student", target: "science" },
    { id: "e-student-commerce", source: "student", target: "commerce" },
    { id: "e-student-arts", source: "student", target: "arts" },
    { id: "e-science-tech", source: "science", target: "technology" },
    { id: "e-science-medicine", source: "science", target: "medicine" },
    { id: "e-science-research", source: "science", target: "research" },
    { id: "e-commerce-finance", source: "commerce", target: "finance" },
    { id: "e-commerce-business", source: "commerce", target: "business" },
    { id: "e-commerce-law", source: "commerce", target: "law" },
    { id: "e-arts-design", source: "arts", target: "design" },
    { id: "e-arts-psychology", source: "arts", target: "psychology" },
    { id: "e-arts-civil", source: "arts", target: "civil-services" },
    { id: "e-tech-ai", source: "technology", target: "ai-careers" },
    { id: "e-medicine-doctor", source: "medicine", target: "doctor-careers" },
    { id: "e-finance-ca", source: "finance", target: "ca-careers" },
    { id: "e-business-startup", source: "business", target: "startup-careers" },
    { id: "e-design-ux", source: "design", target: "ux-careers" },
    { id: "e-civil-upsc", source: "civil-services", target: "upsc-careers" },
    {
      id: "impact-tech-finance",
      source: "technology",
      target: "finance",
      type: "impactEdge",
      label: "FinTech",
      description: "Technology and finance intersect in data-driven markets, payments, and digital products."
    },
    {
      id: "impact-psychology-business",
      source: "psychology",
      target: "business",
      type: "impactEdge",
      label: "Behavior -> Business",
      description: "Behavioral understanding improves leadership, marketing, product decisions, and management."
    },
    {
      id: "impact-design-technology",
      source: "design",
      target: "technology",
      type: "impactEdge",
      label: "UX -> Product",
      description: "Technology products become stronger when usability and interface design are built in."
    }
  ]
};
