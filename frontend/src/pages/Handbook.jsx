import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Container from "../components/Container";
import Section from "../components/Section";
import Card from "../components/Card";
import Button from "../components/Button";
import { getCuratedResources, getPrimaryDocUrl } from "../utils/docLinks";
import { readCachedStudentUser } from "../utils/studentAuthStorage";

// ─── CURATED UNIVERSAL KNOWLEDGE DISCIPLINES ────────────────────────────────

const KNOWLEDGE_DISCIPLINES = {
  "Social Science": {
    name: "Social Science",
    icon: "📜",
    tagline: "CBSE / NCERT Class 9-10 & Humanities Curriculum",
    categories: [
      {
        id: "sst-history",
        category: "History",
        icon: "📜",
        color: "#FEE2E2",
        textColor: "#B91C1C",
        topics: [
          {
            id: "nationalism-europe",
            title: "The Rise of Nationalism in Europe",
            level: "Chapter 1",
            summary: "The French Revolution, ideas of nationalism, role of culture in nation-building, Bismarck's Germany, unification of Italy.",
            keyPoints: [
              "French Revolution spread nationalism across Europe via Napoleonic Code",
              "Romanticism and cultural identity shaped national consciousness",
              "Germany unified under Otto von Bismarck via 'blood and iron'",
              "Unification of Italy achieved by Mazzini, Garibaldi, and Cavour"
            ],
            examTip: "5-mark questions frequently ask: 'Explain the role of the French Revolution in spreading nationalism in Europe'."
          },
          {
            id: "nationalism-india",
            title: "Nationalism in India — Non-Cooperation & Civil Disobedience",
            level: "Chapter 2",
            summary: "Gandhi's emergence, Non-Cooperation Movement 1920–22, Dandi March 1930, Quit India Movement 1942, role of diverse social groups.",
            keyPoints: [
              "Rowlatt Act (1919) and Jallianwala Bagh massacre (April 13, 1919) sparked national outrage",
              "Non-Cooperation Movement: surrender of titles, boycott of foreign goods and courts",
              "Salt Satyagraha & Dandi March (1930) marked the launch of Civil Disobedience",
              "Participation of peasants (Awadh), tribals (Alluri Sitaram Raju), and plantation workers"
            ],
            examTip: "Mandatory map work: Locate Jallianwala Bagh (Amritsar), Champaran, Chauri Chaura, and Dandi."
          }
        ]
      },
      {
        id: "sst-geo",
        category: "Geography",
        icon: "🌍",
        color: "#D1FAE5",
        textColor: "#047857",
        topics: [
          {
            id: "resources-dev",
            title: "Resources & Sustainable Development",
            level: "Chapter 1",
            summary: "Classification of resources, resource planning in India, land degradation, and soil conservation measures.",
            keyPoints: [
              "Classification: Biotic/Abiotic, Renewable/Non-renewable, National/International",
              "Three stages of Resource Planning in India",
              "Causes of land degradation: overgrazing, mining, deforestation, over-irrigation",
              "Conservation methods: contour ploughing, terrace farming, shelter belts"
            ],
            examTip: "Map identification: Major soil groups (Alluvial, Black, Red & Yellow, Laterite, Arid)."
          },
          {
            id: "agriculture",
            title: "Agriculture & Food Security",
            level: "Chapter 4",
            summary: "Farming types, major crops (Rice, Wheat, Millets, Jute, Cotton), institutional reforms, Green Revolution.",
            keyPoints: [
              "Primitive subsistence vs Intensive subsistence vs Commercial farming",
              "Kharif (Rice, Cotton, Jute), Rabi (Wheat, Mustard, Peas), Zaid (Watermelon, Cucumber)",
              "Rice requires high rainfall (>100cm) and high temperature (>25°C)",
              "Technological reforms: HYV seeds, Green & White Revolutions, Kissan Credit Card"
            ],
            examTip: "Frequent question: Compare climatic requirements and distribution of Rice vs Wheat."
          },
          {
            id: "minerals-energy",
            title: "Minerals & Energy Resources",
            level: "Chapter 5",
            summary: "Ferrous & non-ferrous minerals, conventional vs non-conventional energy, major mineral belts in India.",
            keyPoints: [
              "Ferrous: Iron ore (Jharkhand, Odisha, Karnataka), Manganese",
              "Non-ferrous: Bauxite (Odisha), Copper (Khetri, MP), Mica (Jharkhand)",
              "Conventional energy: Coal (Jharia, Bokaro), Petroleum (Mumbai High, Digboi)",
              "Non-conventional: Solar (Rajasthan), Wind (Tamil Nadu coast), Biogas"
            ],
            examTip: "Distinguish between Conventional and Non-conventional energy sources with examples."
          }
        ]
      },
      {
        id: "sst-polsci",
        category: "Political Science",
        icon: "⚖️",
        color: "#DBEAFE",
        textColor: "#1D4ED8",
        topics: [
          {
            id: "power-sharing",
            title: "Power Sharing — Federal Mechanisms",
            level: "Chapter 1",
            summary: "Why power sharing is desirable, forms of power sharing, Belgium accommodation vs Sri Lanka majoritarian crisis.",
            keyPoints: [
              "Prudential reason (reduces conflict) vs Moral reason (spirit of democracy)",
              "Belgium model: equal Dutch & French representation, community government",
              "Sri Lanka majoritarian crisis: Sinhala dominance alienated Sri Lankan Tamils",
              "Horizontal division (Legislature, Executive, Judiciary) vs Vertical division (Centre, State, Local)"
            ],
            examTip: "4-mark case study: Compare how Belgium and Sri Lanka handled ethnic diversity."
          },
          {
            id: "federalism",
            title: "Federalism & Decentralization in India",
            level: "Chapter 2",
            summary: "Features of federalism, Union/State/Concurrent lists, linguistic states, 73rd and 74th constitutional amendments.",
            keyPoints: [
              "Holding together (India, Spain) vs Coming together (USA, Australia) federations",
              "Three legislative lists: Union List (97), State List (66), Concurrent List (47)",
              "Decentralization (1992): mandatory local elections, 1/3 reservation for women, State Finance Commission",
              "Panchayati Raj 3-tier structure: Gram Panchayat, Panchayat Samiti, Zilla Parishad"
            ],
            examTip: "Explain 5 key provisions of the 1992 Constitutional Amendment on Panchayati Raj."
          }
        ]
      },
      {
        id: "sst-eco",
        category: "Economics",
        icon: "💰",
        color: "#FEF3C7",
        textColor: "#B45309",
        topics: [
          {
            id: "development",
            title: "Development & Human Well-being",
            level: "Chapter 1",
            summary: "Different development goals, per capita income vs Human Development Index (HDI), sustainable development.",
            keyPoints: [
              "Development goals vary: what is progress for one may be destructive for another",
              "World Bank criterion: Per Capita Income (PCI = Total Income / Total Population)",
              "UNDP criterion: Human Development Index (Life expectancy, Education, per capita GNI)",
              "Kerala model: low per capita income but high HDI due to health and education investments"
            ],
            examTip: "'Why is per capita income alone inadequate to measure development?' — high probability 3-marker."
          },
          {
            id: "sectors-economy",
            title: "Sectors of the Indian Economy",
            level: "Chapter 2",
            summary: "Primary, Secondary, Tertiary sectors, GDP contribution vs employment share, organised vs unorganised sector.",
            keyPoints: [
              "Historical transition: Primary -> Secondary -> Tertiary dominance in GDP",
              "Disguised unemployment: more workers employed than necessary (especially in agriculture)",
              "Organised sector (statutory benefits, job security) vs Unorganised sector (no protection)",
              "MGNREGA (2005): 100 days guaranteed wage employment in rural areas"
            ],
            examTip: "Explain disguised unemployment with an agricultural example and suggest solutions."
          },
          {
            id: "money-credit",
            title: "Money & Credit Systems",
            level: "Chapter 3",
            summary: "Evolution from barter, modern forms of currency, formal vs informal credit, role of RBI, Self-Help Groups.",
            keyPoints: [
              "Barter requirement: Double coincidence of wants; money eliminates this barrier",
              "Modern money: currency notes and demand deposits (bank accounts)",
              "Formal credit (Banks, Cooperatives) supervised by RBI; low interest rates",
              "Informal credit (Moneylenders, traders) charges exorbitant rates, leading to debt traps",
              "Self-Help Groups (SHGs): 15-20 rural women pooling savings for collateral-free credit"
            ],
            examTip: "Compare formal and informal credit sources on interest rate, collateral, and regulation."
          }
        ]
      }
    ]
  },

  "Science": {
    name: "Science",
    icon: "🔬",
    tagline: "CBSE / NCERT Class 9-10 & Natural Sciences Curriculum",
    categories: [
      {
        id: "sci-chem",
        category: "Chemistry",
        icon: "⚗️",
        color: "#FDE8FF",
        textColor: "#7C3AED",
        topics: [
          {
            id: "chemical-reactions",
            title: "Chemical Reactions & Equations",
            level: "Chapter 1",
            summary: "Balancing equations, types of reactions (combination, decomposition, displacement, redox), corrosion and rancidity.",
            keyPoints: [
              "Law of Conservation of Mass: total mass of reactants = total mass of products",
              "Exothermic (heat released, e.g. respiration) vs Endothermic (heat absorbed, e.g. photosynthesis)",
              "Redox: Oxidation is loss of electrons/gain of oxygen; Reduction is gain of electrons/loss of oxygen",
              "Corrosion prevention: galvanisation (zinc coating), alloying, painting"
            ],
            examTip: "Practice balancing: Fe + H2O -> Fe3O4 + H2 and identifying oxidising/reducing agents."
          },
          {
            id: "acids-bases-salts",
            title: "Acids, Bases & Salts",
            level: "Chapter 2",
            summary: "pH scale, neutralization reactions, chemical properties of salts (Baking soda, Washing soda, Bleaching powder, Plaster of Paris).",
            keyPoints: [
              "Acids release H+(aq) ions, turn blue litmus red; Bases release OH-(aq) ions, turn red litmus blue",
              "pH < 7 acidic, pH = 7 neutral, pH > 7 basic; digestive stomach acid pH ~ 1.5 - 3.0",
              "Baking Soda: NaHCO3 (used in fire extinguishers & cooking); Washing Soda: Na2CO3·10H2O",
              "Plaster of Paris (CaSO4·1/2H2O) forms Gypsum (CaSO4·2H2O) upon hydration"
            ],
            examTip: "Write chemical equations for the preparation of Bleaching Powder and Plaster of Paris."
          }
        ]
      },
      {
        id: "sci-bio",
        category: "Biology",
        icon: "🧬",
        color: "#D1FAE5",
        textColor: "#065F46",
        topics: [
          {
            id: "life-processes",
            title: "Life Processes — Nutrition, Respiration, Transport & Excretion",
            level: "Chapter 6",
            summary: "Autotrophic vs heterotrophic nutrition, aerobic vs anaerobic respiration, human double circulation, nephron ultrafiltration.",
            keyPoints: [
              "Photosynthesis: 6CO2 + 6H2O -> C6H12O6 + 6O2 in the presence of chlorophyll and sunlight",
              "Aerobic produces 38 ATP in mitochondria; Anaerobic in muscle produces Lactic acid + 2 ATP (cramps)",
              "Human heart: 4 chambers; pulmonary circulation (lungs) and systemic circulation (body)",
              "Nephron: functional filtration unit of kidney; glomerulus Bowman's capsule -> reabsorption -> collecting duct"
            ],
            examTip: "High-yield diagrams: Human Heart schematic, Alimentary Canal, and Structure of a Nephron."
          },
          {
            id: "control-coordination",
            title: "Control & Coordination — Nervous & Endocrine Systems",
            level: "Chapter 7",
            summary: "Neuron structure, reflex arc, central and peripheral nervous system, plant tropic movements, animal hormones.",
            keyPoints: [
              "Reflex Arc: Receptor -> Sensory neuron -> Spinal Cord (relay) -> Motor neuron -> Effector muscle",
              "Brain parts: Forebrain (Cerebrum - thinking), Midbrain, Hindbrain (Cerebellum - balance, Medulla - involuntary)",
              "Endocrine hormones: Insulin (pancreas/glucose regulation), Adrenaline (adrenal/fight-or-flight), Thyroxine (thyroid)",
              "Plant hormones: Auxin (shoot elongation), Gibberellins (stem growth), Cytokinin (cell division), Abscisic acid (inhibition)"
            ],
            examTip: "Trace the pathway of a reflex action with an everyday example (touching a hot pan)."
          }
        ]
      },
      {
        id: "sci-phy",
        category: "Physics",
        icon: "⚡",
        color: "#DBEAFE",
        textColor: "#1D4ED8",
        topics: [
          {
            id: "light-optics",
            title: "Light: Reflection & Refraction",
            level: "Chapter 10",
            summary: "Mirror formula, magnification, Snell's law of refraction, lens formula, power of a lens.",
            keyPoints: [
              "Mirror formula: 1/v + 1/u = 1/f; Magnification m = -v/u = h'/h",
              "Snell's Law: n = sin(i) / sin(r) = c / v",
              "Lens formula: 1/v - 1/u = 1/f; Magnification m = +v/u = h'/h",
              "Power of lens: P = 1 / f(in metres); SI unit is Dioptre (D); Convex has +P, Concave has -P"
            ],
            examTip: "Mandatory numerical on concave mirror and convex lens image position and magnification."
          },
          {
            id: "electricity",
            title: "Electricity & Circuitry",
            level: "Chapter 12",
            summary: "Ohm's law, factors affecting resistance, series vs parallel combinations, Joule's law of heating, electric power.",
            keyPoints: [
              "Ohm's Law: V = IR; Resistance R = ρ * (l / A)",
              "Series resistors: R_total = R1 + R2 + R3 (current remains constant)",
              "Parallel resistors: 1/R_total = 1/R1 + 1/R2 + 1/R3 (voltage remains constant across branches)",
              "Joule's Law of Heating: H = I^2 * R * t; Electric Power P = VI = I^2 * R = V^2 / R",
              "Commercial unit of energy: 1 kWh = 3.6 x 10^6 Joules"
            ],
            examTip: "Calculate total resistance and circuit current for combined series-parallel resistor networks."
          }
        ]
      }
    ]
  },

  "Mathematics": {
    name: "Mathematics",
    icon: "📐",
    tagline: "Class 10 CBSE, Algebra, Trigonometry & Higher Analytics",
    categories: [
      {
        id: "math-algebra",
        category: "Algebra & Number Systems",
        icon: "🔢",
        color: "#FEF3C7",
        textColor: "#B45309",
        topics: [
          {
            id: "real-numbers",
            title: "Real Numbers & Fundamental Theorem of Arithmetic",
            level: "Chapter 1",
            summary: "Fundamental theorem of arithmetic, proving irrationality of √2, √3, √5, HCF and LCM via prime factorization.",
            keyPoints: [
              "Every composite number can be uniquely expressed as a product of primes",
              "HCF(a, b) * LCM(a, b) = a * b (strictly valid for two positive integers)",
              "Proof of irrationality: proof by contradiction assuming p/q in co-prime form"
            ],
            examTip: "Guaranteed 3-mark question: 'Prove that √3 or (2 + 3√5) is an irrational number'."
          },
          {
            id: "quadratic-equations",
            title: "Quadratic Equations & Polynomials",
            level: "Chapter 4",
            summary: "Standard form ax^2 + bx + c = 0, discriminant D = b^2 - 4ac, nature of roots, quadratic formula.",
            keyPoints: [
              "Quadratic formula: x = (-b ± √(b^2 - 4ac)) / (2a)",
              "Nature of roots: D > 0 (two distinct real roots), D = 0 (two equal real roots), D < 0 (no real roots)",
              "Sum of roots α + β = -b/a; Product of roots α * β = c/a"
            ],
            examTip: "Find the value of k for which the quadratic equation has two equal roots (set D = 0)."
          }
        ]
      },
      {
        id: "math-trig",
        category: "Trigonometry & Geometry",
        icon: "📐",
        color: "#DBEAFE",
        textColor: "#1D4ED8",
        topics: [
          {
            id: "trig-identities",
            title: "Introduction to Trigonometry & Identities",
            level: "Chapter 8",
            summary: "Trigonometric ratios (sin, cos, tan, cot, sec, cosec), specific angle values (0°, 30°, 45°, 60°, 90°), fundamental identities.",
            keyPoints: [
              "sin^2(θ) + cos^2(θ) = 1; 1 + tan^2(θ) = sec^2(θ); 1 + cot^2(θ) = cosec^2(θ)",
              "sin(30°) = 1/2, cos(30°) = √3/2, tan(45°) = 1, sin(60°) = √3/2",
              "Heights and Distances: tan(θ) = perpendicular / base = height / shadow"
            ],
            examTip: "Identity proofs: LHS to RHS algebraic reduction involving factoring and conjugate multiplication."
          },
          {
            id: "circles-triangles",
            title: "Triangles & Circles (Theorems & Proofs)",
            level: "Chapter 6 & 10",
            summary: "Basic Proportionality Theorem (Thales Theorem), tangents to a circle, equal tangent lengths from external point.",
            keyPoints: [
              "BPT: If a line is drawn parallel to one side of a triangle, it divides the other two sides in the same ratio",
              "Tangent at any point of a circle is perpendicular to the radius at the point of contact",
              "Lengths of tangents drawn from an external point to a circle are equal"
            ],
            examTip: "Theorem proof: 'Prove that the lengths of tangents drawn from an external point to a circle are equal'."
          }
        ]
      },
      {
        id: "math-stat",
        category: "Statistics & Probability",
        icon: "📊",
        color: "#D1FAE5",
        textColor: "#047857",
        topics: [
          {
            id: "statistics-mean",
            title: "Statistics — Mean, Median & Mode of Grouped Data",
            level: "Chapter 14",
            summary: "Assumed mean method, step-deviation method, median class formula, mode formula, empirical relationship.",
            keyPoints: [
              "Mode = l + [ (f1 - f0) / (2f1 - f0 - f2) ] * h",
              "Median = l + [ (n/2 - cf) / f ] * h",
              "Empirical relationship: 3 * Median = Mode + 2 * Mean"
            ],
            examTip: "Find missing frequencies (x and y) given the median of a grouped distribution."
          }
        ]
      }
    ]
  },

  "Computer Science & Web": {
    name: "Computer Science & Web",
    icon: "💻",
    tagline: "Full-Stack Development, Algorithms, APIs & Modern Engineering",
    categories: [
      {
        id: "cs-fundamentals",
        category: "Programming & DSA",
        icon: "⚡",
        color: "#EDE6D3",
        textColor: "#1B332C",
        topics: [
          {
            id: "dsa-arrays-search",
            title: "Data Structures & Algorithmic Complexity",
            level: "Core Foundation",
            summary: "Time & Space complexity (Big-O), arrays, hashing, two-pointer techniques, binary search mechanics.",
            keyPoints: [
              "Hash maps provide average O(1) time complexity for insert, lookup, and delete",
              "Binary Search operates in O(log n) time by halving the search space on sorted inputs",
              "Two-pointer technique reduces nested loops from O(n^2) to O(n) linear scans"
            ],
            examTip: "In technical interviews, state brute-force complexity first, then optimize using hash maps or sorting."
          },
          {
            id: "async-concurrency",
            title: "Event Loop, Promises & Asynchronous Execution",
            level: "Intermediate",
            summary: "Call stack, microtask queue (Promises), macrotask queue (setTimeout), async/await error propagation.",
            keyPoints: [
              "JavaScript runtime is single-threaded: the call stack executes synchronous frames to completion",
              "Microtasks (resolved Promises, process.nextTick) drain before the next macrotask is dequeued",
              "Always wrap async functions in try/catch or use Promise.allSettled for resilient concurrency"
            ],
            examTip: "Tricky question: Predict console output order when combining setTimeout(0), Promise.resolve(), and synchronous logs."
          }
        ]
      },
      {
        id: "cs-web-arch",
        category: "Web & System Architecture",
        icon: "🌐",
        color: "#DBEAFE",
        textColor: "#1D4ED8",
        topics: [
          {
            id: "rest-apis-auth",
            title: "RESTful API Design, JWT & Security",
            level: "Core Engineering",
            summary: "HTTP methods, stateless architecture, JWT authentication, CORS, rate-limiting, and SQL injection prevention.",
            keyPoints: [
              "Idempotency: GET, PUT, DELETE should produce identical system state on repeated execution",
              "JWT tokens contain Header, Payload, and Signature; store in httpOnly cookies to mitigate XSS",
              "Always sanitize inputs and use parameterized database queries to eliminate SQL/NoSQL injection"
            ],
            examTip: "System design tip: Contrast horizontal vs vertical scaling and caching layers (Redis/CDN)."
          },
          {
            id: "react-state",
            title: "Modern React 19: State, Effects & Server Components",
            level: "Frontend Architecture",
            summary: "Component lifecycle, functional updaters, hooks dependency arrays, memoization, and reconciliation.",
            keyPoints: [
              "State updates are batched; use functional updater setCount(prev => prev + 1) when deriving from prior state",
              "useEffect cleanups prevent memory leaks on timers, web socket subscriptions, and abort controllers",
              "Avoid premature optimization; use React.memo and useMemo only for computationally expensive sub-trees"
            ],
            examTip: "Common interview bug: Stale closures in useEffect when dependencies are omitted."
          }
        ]
      }
    ]
  },

  "Commerce, Finance & Business": {
    name: "Commerce, Finance & Business",
    icon: "💰",
    tagline: "Accounting Principles, Corporate Finance, Capital Markets & Strategy",
    categories: [
      {
        id: "fin-accounting",
        category: "Financial Accounting",
        icon: "📊",
        color: "#FEF3C7",
        textColor: "#B45309",
        topics: [
          {
            id: "accounting-principles",
            title: "Double-Entry Bookkeeping & Financial Statements",
            level: "Foundation",
            summary: "Accounting equation (Assets = Liabilities + Equity), journal entries, trial balance, Balance Sheet and P&L statements.",
            keyPoints: [
              "Golden rules of accounting: Debit the receiver, Credit the giver; Debit what comes in, Credit what goes out",
              "Accrual concept: Revenues and expenses are recorded when incurred, not when cash changes hands",
              "Balance Sheet represents financial position at a specific point in time; P&L shows performance over a period"
            ],
            examTip: "State the treatment of prepaid expenses and accrued income in final accounts."
          },
          {
            id: "ratio-analysis",
            title: "Financial Ratio Analysis & Working Capital",
            level: "Intermediate",
            summary: "Liquidity ratios (Current, Quick), solvency ratios (Debt-to-Equity), profitability (ROE, ROA), cash flow cycles.",
            keyPoints: [
              "Current Ratio = Current Assets / Current Liabilities (ideal benchmark ~ 2:1)",
              "Debt-to-Equity Ratio measures financial leverage and financial risk",
              "Cash Flow Statement categorizes cash into Operating, Investing, and Financing activities"
            ],
            examTip: "Calculate Cash Flow from Operating Activities using the indirect method starting from Net Profit."
          }
        ]
      },
      {
        id: "fin-markets",
        category: "Corporate Finance & Markets",
        icon: "📈",
        color: "#D1FAE5",
        textColor: "#047857",
        topics: [
          {
            id: "time-value-money",
            title: "Time Value of Money, NPV & Valuation",
            level: "Core Finance",
            summary: "Present Value, Future Value, Net Present Value (NPV), Internal Rate of Return (IRR), Capital Asset Pricing Model (CAPM).",
            keyPoints: [
              "A dollar today is worth more than a dollar tomorrow due to its earning capacity",
              "NPV > 0 indicates a project generates returns above the cost of capital and adds firm value",
              "CAPM: Expected Return = Risk-Free Rate + Beta * (Market Return - Risk-Free Rate)"
            ],
            examTip: "Explain why NPV is theoretically superior to Payback Period and Accounting Rate of Return."
          }
        ]
      }
    ]
  },

  "Medicine & Healthcare": {
    name: "Medicine & Healthcare",
    icon: "🩺",
    tagline: "Human Anatomy, Physiology, Pathology, Pharmacology & Clinical Standards",
    categories: [
      {
        id: "med-anatomy",
        category: "Anatomy & Physiology",
        icon: "🫀",
        color: "#FEE2E2",
        textColor: "#B91C1C",
        topics: [
          {
            id: "cardiovascular-system",
            title: "Cardiovascular System & Hemodynamics",
            level: "Core Medical",
            summary: "Cardiac cycle, cardiac conduction system (SA node, AV node, Purkinje fibers), blood pressure regulation, coronary circulation.",
            keyPoints: [
              "Sinoatrial (SA) node acts as natural cardiac pacemaker generating 60-100 impulses/min",
              "Systole represents ventricular contraction; Diastole represents ventricular relaxation and ventricular filling",
              "Renin-Angiotensin-Aldosterone System (RAAS) regulates long-term arterial blood pressure and fluid balance"
            ],
            examTip: "Trace the cardiac electrical conduction pathway from SA node to ventricular myocardium."
          },
          {
            id: "respiratory-physiology",
            title: "Respiratory Physiology & Gas Exchange",
            level: "Core Medical",
            summary: "Alveolar gas exchange, partial pressures (pO2, pCO2), oxygen-hemoglobin dissociation curve, ventilation-perfusion ratio.",
            keyPoints: [
              "Fick's law of diffusion: Gas exchange rate is proportional to surface area and partial pressure gradient",
              "Oxygen-hemoglobin dissociation curve shifts right (Bohr effect) with increased CO2, acidity, and temperature",
              "Surfactant produced by Type II pneumocytes prevents alveolar collapse by reducing surface tension"
            ],
            examTip: "Explain factors causing a rightward vs leftward shift in the oxyhemoglobin dissociation curve."
          }
        ]
      },
      {
        id: "med-pharmacology",
        category: "Pharmacology & Pathology",
        icon: "💊",
        color: "#DBEAFE",
        textColor: "#1D4ED8",
        topics: [
          {
            id: "pharmacokinetics",
            title: "Pharmacokinetics & Pharmacodynamics",
            level: "Clinical Science",
            summary: "ADME (Absorption, Distribution, Metabolism, Excretion), bioavailability, half-life, receptor agonism and antagonism.",
            keyPoints: [
              "Bioavailability (F) is the fraction of administered drug that reaches systemic circulation unchanged",
              "Cytochrome P450 hepatic enzyme system is the primary pathway for phase I drug metabolism",
              "Therapeutic Index = Toxic Dose (TD50) / Effective Dose (ED50); narrow index requires therapeutic drug monitoring"
            ],
            examTip: "Differentiate between competitive and non-competitive enzyme inhibitors with Vmax and Km changes."
          }
        ]
      }
    ]
  },

  "Law & Legal Studies": {
    name: "Law & Legal Studies",
    icon: "⚖️",
    tagline: "Constitutional Law, Criminal Jurisprudence, Contracts & Procedural Rights",
    categories: [
      {
        id: "law-constitution",
        category: "Constitutional Law",
        icon: "📜",
        color: "#FEF3C7",
        textColor: "#B45309",
        topics: [
          {
            id: "fundamental-rights",
            title: "Fundamental Rights & Judicial Review (Articles 12-35)",
            level: "Core Jurisprudence",
            summary: "Right to Equality (Art 14), Freedoms (Art 19), Right to Life and Personal Liberty (Art 21), Constitutional remedies (Art 32).",
            keyPoints: [
              "Article 14 guarantees equality before law and equal protection of laws against arbitrary state action",
              "Article 21 has been expanded by the Supreme Court (Maneka Gandhi) to include the right to privacy, clean environment, and speedy trial",
              "Article 32 gives the Supreme Court power to issue prerogative writs: Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari"
            ],
            examTip: "Analyze the evolution of 'Due Process of Law' under Article 21 post-Maneka Gandhi judgment."
          },
          {
            id: "basic-structure",
            title: "Doctrine of Basic Structure & Judicial Precedents",
            level: "Constitutional Landmark",
            summary: "Kesavananda Bharati v. State of Kerala (1973), limits on Article 368 amending power, independence of judiciary.",
            keyPoints: [
              "Parliament's power to amend the Constitution under Article 368 is not absolute and cannot alter its 'Basic Structure'",
              "Basic features include Supremacy of Constitution, Rule of Law, Federalism, Separation of Powers, and Judicial Review",
              "Minerva Mills (1980) reaffirmed harmony between Fundamental Rights and Directive Principles"
            ],
            examTip: "Explain how Kesavananda Bharati balanced parliamentary sovereignty and constitutional supremacy."
          }
        ]
      },
      {
        id: "law-criminal",
        category: "Criminal Law & Contracts",
        icon: "⚖️",
        color: "#FEE2E2",
        textColor: "#B91C1C",
        topics: [
          {
            id: "mens-rea-actus-reus",
            title: "Elements of Crime: Actus Reus & Mens Rea",
            level: "Substantive Law",
            summary: "Principle of 'Actus non facit reum nisi mens sit rea', stages of crime (intention, preparation, attempt, commission).",
            keyPoints: [
              "A crime requires both a wrongful physical act (Actus Reus) and a guilty mental state (Mens Rea)",
              "Strict liability offenses (e.g. food adulteration, motor vehicle infractions) do not require proof of mens rea",
              "General exceptions: Infancy (doli incapax), Insanity (McNaghten's Rule), Self-defense"
            ],
            examTip: "Distinguish between preparation and attempt to commit an offense with legal case tests."
          }
        ]
      }
    ]
  },

  "Engineering & Physical Sciences": {
    name: "Engineering & Applied Sciences",
    icon: "⚙️",
    tagline: "Mechanics, Thermodynamics, Circuits, Structural Analysis & Systems",
    categories: [
      {
        id: "eng-mech",
        category: "Mechanical & Systems",
        icon: "⚙️",
        color: "#EDE6D3",
        textColor: "#1B332C",
        topics: [
          {
            id: "thermodynamics-laws",
            title: "Laws of Thermodynamics & Heat Engines",
            level: "Core Engineering",
            summary: "Zeroth, First (Conservation of Energy), Second (Entropy & Carnot cycle), and Third laws; heat pumps and refrigeration.",
            keyPoints: [
              "First Law: dQ = dU + dW (energy can neither be created nor destroyed, only converted)",
              "Second Law: Total entropy of an isolated system always increases; heat cannot spontaneously flow from cold to hot",
              "Carnot efficiency η = 1 - (T_cold / T_hot) defines maximum theoretical thermal conversion"
            ],
            examTip: "Derive the thermal efficiency of an ideal Carnot engine operating between two temperature reservoirs."
          },
          {
            id: "fluid-mechanics",
            title: "Fluid Mechanics & Bernoulli's Principle",
            level: "Applied Physics",
            summary: "Continuity equation, Bernoulli equation, laminar vs turbulent flow, Reynolds number, Navier-Stokes fundamentals.",
            keyPoints: [
              "Continuity equation A1*V1 = A2*V2 expresses conservation of mass in incompressible fluid flow",
              "Bernoulli's principle: P + 1/2*ρ*v^2 + ρ*g*h = constant along a streamline (conservation of mechanical energy)",
              "Reynolds number Re = (ρ * v * D) / μ determines flow regime (Re < 2000 laminar, Re > 4000 turbulent)"
            ],
            examTip: "Apply Bernoulli's theorem to explain the working principle of a Venturimeter."
          }
        ]
      }
    ]
  },

  "Psychology & Behavioral Sciences": {
    name: "Psychology & Behavioral Sciences",
    icon: "🧠",
    tagline: "Cognitive Science, Developmental Milestones, Disorders & Therapy",
    categories: [
      {
        id: "psych-cognitive",
        category: "Cognitive & Behavioral",
        icon: "🧠",
        color: "#FDE8FF",
        textColor: "#7C3AED",
        topics: [
          {
            id: "memory-models",
            title: "Memory Architecture & Cognitive Models",
            level: "Core Psychology",
            summary: "Atkinson-Shiffrin multi-store model, Baddeley & Hitch working memory model, encoding, storage, and retrieval decay.",
            keyPoints: [
              "Multi-store model: Sensory register -> Short-Term Memory (7 ± 2 items) -> Long-Term Memory",
              "Working memory components: Central Executive, Phonological Loop, Visuospatial Sketchpad, Episodic Buffer",
              "Ebbinghaus forgetting curve shows exponential decay of memory retention without active spaced repetition"
            ],
            examTip: "Critically evaluate the multi-store model versus the working memory model with empirical evidence."
          },
          {
            id: "conditioning-learning",
            title: "Classical & Operant Conditioning",
            level: "Foundational Theory",
            summary: "Pavlovian conditioning (UCS, CS, UCR, CR), Skinner's operant conditioning, reinforcement schedules, extinction.",
            keyPoints: [
              "Classical conditioning: pairing neutral stimulus with unconditional stimulus to elicit conditioned reflex",
              "Positive reinforcement increases behavior by presenting reward; Negative reinforcement increases behavior by removing unpleasant stimulus",
              "Variable-ratio schedule yields the highest rate of response and greatest resistance to extinction (e.g. gambling)"
            ],
            examTip: "Contrast negative reinforcement with punishment with concrete behavioral examples."
          }
        ]
      }
    ]
  }
};

// ─── DYNAMIC TOPIC GENERATOR FOR ANY UNLISTED CUSTOM TOPIC ───────────────────

function generateUniversalModules(topicName = "General Study") {
  const clean = topicName.replace(/board|class \d+|cbse|icse/gi, "").trim() || topicName;
  return [
    {
      id: "universal-foundations",
      category: "Core Foundations",
      icon: "🏛️",
      color: "#EDE6D3",
      textColor: "#1B332C",
      topics: [
        {
          id: `fund-${encodeURIComponent(clean.toLowerCase().replace(/\s+/g, "-"))}`,
          title: `${clean}: Core Foundations & Principles`,
          level: "Module 1",
          summary: `Comprehensive overview of ${clean}, historical development, foundational definitions, standard terminology, and core axioms.`,
          keyPoints: [
            `Understand the primary definitions, scope, and foundational terminology governing ${clean}`,
            `Analyze the primary mechanisms and governing frameworks that dictate standard practice`,
            `Master the core principles that connect theoretical models with practical real-world execution`,
            `Identify the prerequisite concepts necessary for high-level mastery and critical problem-solving`
          ],
          examTip: `High-yield focus: Understand the exact definitions and core distinctions in ${clean}. Examiners test comparative scenarios.`
        }
      ]
    },
    {
      id: "universal-mechanisms",
      category: "Frameworks & Models",
      icon: "⚙️",
      color: "#DBEAFE",
      textColor: "#1D4ED8",
      topics: [
        {
          id: `mech-${encodeURIComponent(clean.toLowerCase().replace(/\s+/g, "-"))}`,
          title: `${clean}: Working Models & Key Methodologies`,
          level: "Module 2",
          summary: `In-depth structural breakdown of the operational rules, workflows, governing formulas, and analytical models used in ${clean}.`,
          keyPoints: [
            `Step-by-step operational workflows and execution patterns required in ${clean}`,
            `Standard diagnostic criteria, mathematical/logical formulas, and structural blueprints`,
            `Comparative analysis of competing theories, methodologies, or standard architectures`,
            `Techniques for error isolation, edge-case mitigation, and systematic quality assurance`
          ],
          examTip: `Focus on step-by-step derivations or procedural workflows. Structured answers with diagrams or points score highest.`
        }
      ]
    },
    {
      id: "universal-applications",
      category: "Real-World Applications",
      icon: "💡",
      color: "#D1FAE5",
      textColor: "#047857",
      topics: [
        {
          id: `app-${encodeURIComponent(clean.toLowerCase().replace(/\s+/g, "-"))}`,
          title: `${clean}: Practical Applications & Case Studies`,
          level: "Module 3",
          summary: `Real-world case analysis, industry applications, empirical scenarios, and problem-solving strategies in ${clean}.`,
          keyPoints: [
            `Real-world implementation scenarios and practical case study breakdowns`,
            `Best practices adopted by leading professionals, researchers, and organizations`,
            `Troubleshooting common failure modes and identifying operational bottlenecks`,
            `Ethical considerations, regulatory compliance, and modern developments in the field`
          ],
          examTip: `In subjective questions, always substantiate your answers with a concrete real-world case study or practical application.`
        }
      ]
    },
    {
      id: "universal-exam-tips",
      category: "Exam & Interview Tips",
      icon: "🎯",
      color: "#FEF3C7",
      textColor: "#B45309",
      topics: [
        {
          id: `exam-${encodeURIComponent(clean.toLowerCase().replace(/\s+/g, "-"))}`,
          title: `${clean}: High-Yield PYQs, Pitfalls & Exam Strategy`,
          level: "Module 4",
          summary: `Examination traps, common misconceptions, previous year question (PYQ) patterns, and active recall retention strategies.`,
          keyPoints: [
            `Review recurring question patterns and high-frequency topics tested in major assessments`,
            `Common misconception: Avoid confusing foundational principles with superficial edge cases`,
            `Time management strategy: Allocate time proportionally to question weightage and complexity`,
            `Active recall and spaced repetition protocol for long-term retention of key facts and formulas`
          ],
          examTip: `Solve previous year questions under timed conditions to identify conceptual blind spots before official testing.`
        }
      ]
    }
  ];
}

// ─── DOMAIN MATCHER ─────────────────────────────────────────────────────────

function detectDomainFromTopic(topic = "") {
  const t = topic.toLowerCase();
  if (!t) return null;

  if (/social science|sst|history|geography|civics|economics|nationalism|federalism|power sharing|agriculture|minerals|development|money|credit|political science|cbse 10/i.test(t)) {
    return "Social Science";
  }
  if (/science|physics|chemistry|biology|light|optics|electricity|acid|base|salt|metal|life process|control|coordination|chemical reaction/i.test(t)) {
    return "Science";
  }
  if (/math|algebra|calculus|trigonometry|geometry|statistics|probability|polynomial|real number|quadratic|circle|triangle/i.test(t)) {
    return "Mathematics";
  }
  if (/software|web|frontend|backend|full stack|react|javascript|python|dsa|algorithm|developer|cloud|devops|cybersecurity|node|html|css|code/i.test(t)) {
    return "Computer Science & Web";
  }
  if (/commerce|finance|accounting|accountant|banking|investment|tax|market|equity|stock|rbi|business|management|ca /i.test(t)) {
    return "Commerce, Finance & Business";
  }
  if (/medicine|doctor|physician|surgeon|nurse|health|anatomy|physiology|pathology|pharmacology|clinical|cardio|neet|medical/i.test(t)) {
    return "Medicine & Healthcare";
  }
  if (/law|legal|judiciary|constitution|ipc|advocate|court|bar council|justice|civil rights|bare act/i.test(t)) {
    return "Law & Legal Studies";
  }
  if (/engineering|mechanical|civil engineering|electrical|robotics|aerospace|thermodynamics|circuits|structural/i.test(t)) {
    return "Engineering & Physical Sciences";
  }
  if (/psychology|counseling|cognitive|behavioral|mental health|therapy|psychiatry/i.test(t)) {
    return "Psychology & Behavioral Sciences";
  }

  return null;
}

// ─── MAIN UNIVERSAL HANDBOOK COMPONENT ──────────────────────────────────────

export default function Handbook() {
  const [searchParams, setSearchParams] = useSearchParams();
  const incomingTopic = searchParams.get("topic") || "";

  // Read student profile goal if available
  const cachedUser = useMemo(() => readCachedStudentUser(), []);
  const profileGoal = cachedUser?.careerGoal || cachedUser?.field || "";

  // Auto-detect discipline from incoming topic or student profile goal
  const initialDiscipline = useMemo(() => {
    return detectDomainFromTopic(incomingTopic) || detectDomainFromTopic(profileGoal) || "Social Science";
  }, [incomingTopic, profileGoal]);

  const [activeDiscipline, setActiveDiscipline] = useState(initialDiscipline);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  // Sync active discipline when incoming topic or profile changes
  useEffect(() => {
    const target = incomingTopic || profileGoal;
    if (target) {
      const d = detectDomainFromTopic(target);
      if (d) {
        setActiveDiscipline(d);
      } else {
        setActiveDiscipline("Custom Universal");
      }
    }
    setSearchQuery("");
    setSelectedCategory("All");
  }, [incomingTopic, profileGoal]);

  // Determine active topic name for headers and resource resolvers
  const displayTopic = incomingTopic || (activeDiscipline !== "Custom Universal" ? activeDiscipline : "General Knowledge");
  const curatedDocs = useMemo(() => getCuratedResources(displayTopic, activeDiscipline), [displayTopic, activeDiscipline]);
  const primaryDocUrl = useMemo(() => getPrimaryDocUrl(displayTopic, activeDiscipline), [displayTopic, activeDiscipline]);

  // Determine current chapter modules based on discipline
  const disciplineData = useMemo(() => {
    if (activeDiscipline === "Custom Universal" || !KNOWLEDGE_DISCIPLINES[activeDiscipline]) {
      return generateUniversalModules(incomingTopic || "Universal Knowledge");
    }
    return KNOWLEDGE_DISCIPLINES[activeDiscipline].categories;
  }, [activeDiscipline, incomingTopic]);

  // Categories list for filter pills
  const availableCategories = useMemo(() => {
    return ["All", ...disciplineData.map(ch => ch.category)];
  }, [disciplineData]);

  // Filter topics by selectedCategory and searchQuery
  const filteredTopics = useMemo(() => {
    return disciplineData
      .filter(ch => selectedCategory === "All" || ch.category === selectedCategory)
      .flatMap(ch => ch.topics.map(t => ({
        ...t,
        chapterCategory: ch.category,
        chapterIcon: ch.icon,
        chapterColor: ch.color,
        chapterTextColor: ch.textColor
      })))
      .filter(t => {
        if (!searchQuery || !searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return (
          t.title.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          (t.keyPoints && t.keyPoints.some(k => k.toLowerCase().includes(q))) ||
          (t.examTip && t.examTip.toLowerCase().includes(q))
        );
      });
  }, [disciplineData, selectedCategory, searchQuery]);

  const handleCopyNotes = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const isSchoolSubject = /social science|science|mathematics/i.test(activeDiscipline);

  return (
    <div className="min-h-screen pb-20 bg-[#FAF7F0] text-[#1B332C]">
      {/* ── Top Hero Banner ── */}
      <div className="border-b border-[#2E4F42]/12 bg-[#FBF8F0] py-10 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Link to="/roadmap" className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1">
                  ← Back to Roadmap
                </Link>
                <span className="text-[#8B9690]">•</span>
                <span className="rounded-full bg-[#E8C547]/30 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#1B332C]">
                  {isSchoolSubject ? `CBSE Class 10 — ${activeDiscipline}` : activeDiscipline}
                </span>
                <span className="text-[#8B9690]">•</span>
                <span className="text-xs font-medium text-[#5B6B5F]">
                  Curriculum Study Guide
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-[#1B332C] tracking-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {activeDiscipline === "Social Science"
                  ? "Social Science — NCERT Study Guide & Chapter Notes"
                  : incomingTopic
                  ? `${incomingTopic} — Study Notes`
                  : `${activeDiscipline} — Curriculum Handbook`}
              </h1>
              <p className="mt-2 text-sm text-[#5B6B5F] max-w-2xl leading-relaxed">
                {isSchoolSubject
                  ? "Chapter-wise notes, key points to remember, high-yield board exam tips, and official NCERT textbook links for CBSE Class 10."
                  : "Verified standard specifications, high-yield study frameworks, concept notes, and direct practice assessments for your curriculum."}
              </p>

              {incomingTopic && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#E8C547]/20 border border-[#E8C547]/40 px-3.5 py-1.5 text-xs font-semibold text-[#1B332C]">
                  <span>📍</span>
                  <span>Active Roadmap Milestone: <strong>{incomingTopic}</strong></span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={primaryDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] text-[#E8C547] px-4 py-2.5 text-xs font-bold hover:bg-[#2E4F42] transition shadow-xs"
                >
                  <span>📺 Watch Video Lectures ↗</span>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(displayTopic ? `/assessment?topic=${encodeURIComponent(displayTopic)}&field=${encodeURIComponent(activeDiscipline)}` : "/assessment")}
                >
                  {isSchoolSubject ? "Solve Board PYQs →" : "Test Knowledge in Assessment →"}
                </Button>
              </div>
              {isSchoolSubject ? (
                <a
                  href="https://ncert.nic.in/textbook.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1"
                >
                  🏛️ Download Official NCERT Textbooks (Free) →
                </a>
              ) : (
                <a
                  href={primaryDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1"
                >
                  📖 Open Authoritative Reference Guide →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Container ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">

        {/* ── Curated Resources Grid ── */}
        <div className="mb-10 rounded-2xl border border-[#2E4F42]/15 bg-[#FBF8F0] p-6 sm:p-7 shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#2E4F42]/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8C547]/30 text-xs">
                  📚
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1B332C]">
                  Verified Study & Reference Portals for <span className="text-[#C4952A]">"{displayTopic}"</span>
                </h3>
              </div>
              <p className="text-xs text-[#5B6B5F] mt-1">
                Authoritative reference textbooks, video lecture series, quick revision notes, and research archives.
              </p>
            </div>
            <a
              href={primaryDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#2E4F42] hover:underline shrink-0 flex items-center gap-1"
            >
              Explore Full Library ↗
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {curatedDocs.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col justify-between rounded-xl border border-[#2E4F42]/10 bg-white p-4 transition-all hover:border-[#2E4F42]/30 hover:shadow-md hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xl">{doc.icon}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${doc.badgeColor}`}>
                      {doc.badge}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-[#1B332C] group-hover:text-[#2E4F42] transition-colors line-clamp-2">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-[#8B9690] mt-0.5">{doc.provider}</p>
                  <p className="text-xs text-[#5B6B5F] mt-2 line-clamp-2">{doc.description}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2E4F42]/08 flex items-center justify-between text-xs font-bold text-[#2E4F42]">
                  <span>Open Resource</span>
                  <span className="transition-transform group-hover:translate-x-1">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ── Filter & Search Controls ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-all shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#1B332C] text-[#E8C547] shadow-xs"
                    : "bg-[#FBF8F0] text-[#5B6B5F] border border-[#2E4F42]/12 hover:bg-[#EDE6D3] hover:text-[#1B332C]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder={`Search concepts in ${activeDiscipline}…`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#2E4F42]/15 bg-[#FBF8F0] px-4 py-2 pr-8 text-xs text-[#1B332C] placeholder-[#8B9690] focus:outline-none focus:ring-2 focus:ring-[#2E4F42]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#8B9690] hover:text-[#1B332C]"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── TOPICS / CHAPTERS LIST ── */}
        <div className="space-y-6">
          {filteredTopics.length === 0 ? (
            <div className="rounded-2xl border border-[#2E4F42]/12 bg-[#FBF8F0] p-10 text-center">
              <p className="text-sm text-[#5B6B5F]">
                No topics match your current search.
                <button
                  className="ml-2 font-bold text-[#2E4F42] underline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("All");
                  }}
                >
                  Clear filter
                </button>
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B9690]">
                  Curriculum Modules ({filteredTopics.length})
                </span>
                <span className="text-xs text-[#5B6B5F]">
                  Click "Watch Video" for targeted lectures or "Copy Notes" for revision
                </span>
              </div>

              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="rounded-2xl border border-[#2E4F42]/12 bg-[#FBF8F0] p-6 sm:p-7 shadow-[var(--shadow-card)] transition-all hover:border-[#2E4F42]/25"
                >
                  {/* Topic Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E4F42]/10 pb-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span
                          className="rounded-md px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide border"
                          style={{
                            background: topic.chapterColor,
                            color: topic.chapterTextColor,
                            borderColor: topic.chapterTextColor + "30"
                          }}
                        >
                          {topic.chapterIcon} {topic.chapterCategory}
                        </span>
                        <span className="rounded-md bg-[#EDE6D3] px-2 py-0.5 text-[10px] font-mono font-bold text-[#2E4F42] uppercase">
                          {topic.level}
                        </span>
                      </div>
                      <h2
                        className="text-xl sm:text-2xl font-bold text-[#1B332C]"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {topic.title}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyNotes(topic.id, `${topic.title}\n\nSummary:\n${topic.summary}\n\nKey Points:\n${topic.keyPoints?.map(p => `• ${p}`).join("\n")}\n\nExam Tip:\n${topic.examTip || ""}`)}
                        className="rounded-xl border border-[#2E4F42]/20 bg-white px-3 py-2 text-xs font-semibold text-[#1B332C] hover:bg-[#EDE6D3] transition"
                      >
                        {copiedId === topic.id ? "✓ Copied!" : "📋 Copy Notes"}
                      </button>
                      <a
                        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(topic.title + " explanation lecture")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] text-[#E8C547] px-4 py-2 text-xs font-bold hover:bg-[#2E4F42] transition shadow-xs"
                      >
                        📺 Watch Video Lecture ↗
                      </a>
                    </div>
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-[#24413A] leading-relaxed mb-5">{topic.summary}</p>

                  {/* Key Takeaways & Exam Tip Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Key Points */}
                    <div className="rounded-xl border border-[#2E4F42]/10 bg-[#EDE6D3]/40 p-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E4F42] mb-3 flex items-center gap-1.5">
                        <span>✓</span> Key Points to Remember
                      </h4>
                      <ul className="space-y-2 text-xs text-[#24413A]">
                        {topic.keyPoints?.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-[#C4952A] font-bold mt-0.5">•</span>
                            <span className="leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* High-Yield Exam / Interview Tip */}
                    <div className="rounded-xl border border-[#C4952A]/30 bg-[#FEF3C7]/40 p-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#B45309] mb-2 flex items-center gap-1.5">
                          <span>💡</span> High-Yield Exam / Masterclass Tip
                        </h4>
                        <p className="text-xs text-[#78350F] leading-relaxed">
                          {topic.examTip || "Practice formulating concise answers and comparing theoretical models with realistic practical applications."}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#C4952A]/20 flex items-center justify-between flex-wrap gap-2">
                        <Link
                          to={`/assessment?topic=${encodeURIComponent(topic.title)}&field=${encodeURIComponent(activeDiscipline)}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-[#B45309] hover:underline"
                        >
                          <span>✍️ Test on this Topic in Assessment →</span>
                        </Link>
                        <a
                          href={`https://www.google.com/search?q=${encodeURIComponent(topic.title + " questions and answers pdf")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-semibold text-[#5B6B5F] hover:underline"
                        >
                          Find Sample Questions ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Focused Action Banner ── */}
        <div className="mt-12 rounded-2xl border border-[#2E4F42]/15 bg-gradient-to-r from-[#1B332C] to-[#2E4F42] p-8 text-center text-white shadow-lg">
          <h3 className="text-xl sm:text-2xl font-extrabold text-[#E8C547]" style={{ fontFamily: "var(--font-display)" }}>
            Ready to test your preparation in {activeDiscipline}?
          </h3>
          <p className="mt-2 text-sm text-[#FBF8F0]/80 max-w-2xl mx-auto">
            Solve Previous Year Questions (PYQs) and attempt timed assessments tailored to your syllabus.
          </p>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            <Link
              to="/roadmap"
              className="rounded-xl bg-[#E8C547] px-5 py-2.5 text-xs font-bold text-[#1B332C] hover:bg-[#F2D675] transition shadow-md"
            >
              ← Back to My Roadmap
            </Link>
            <Link
              to={displayTopic ? `/assessment?topic=${encodeURIComponent(displayTopic)}&field=${encodeURIComponent(activeDiscipline)}` : "/assessment"}
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              Practice {isSchoolSubject ? "Board PYQs" : "Assessment"} →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
