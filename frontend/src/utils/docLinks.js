/**
 * Universal Documentation & Verified Learning Resource Resolver
 * Supports Any Domain: School/Boards (CBSE/NCERT), Medicine, Law, Engineering, 
 * Commerce & Finance, Psychology, Design, AI & Data Science, Software/Web, 
 * Mathematics, and Universal Open Textbooks.
 */

export function getPrimaryDocUrl(topic = "", field = "") {
  if (!topic && !field) return "https://www.youtube.com";
  const lower = `${topic} ${field}`.toLowerCase();

  // 1. School / CBSE / NCERT / Board Exam topics
  if (/class \d+|10th|12th|ncert|cbse|icse|sst|social science|board pyq|sample paper/i.test(lower)) {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} class 10 CBSE explanation`)}`;
  }

  // 2. Medicine & Healthcare
  if (/medicine|doctor|physician|surgeon|nurse|health|anatomy|physiology|pathology|pharmacology|clinical|cardio|neet|medical/i.test(lower)) {
    return `https://medlineplus.gov/search?query=${encodeURIComponent(topic)}`;
  }

  // 3. Law & Legal Studies
  if (/law|legal|judiciary|constitution|ipc|advocate|court|bar council|justice|civil rights/i.test(lower)) {
    return `https://indiankanoon.org/search/?formInput=${encodeURIComponent(topic)}`;
  }

  // 4. Commerce, Finance & Economics
  if (/finance|accounting|chartered accountant|ca|invest|banking|tax|economics|commerce|market|equity|stock|rbi/i.test(lower)) {
    return `https://www.investopedia.com/search?q=${encodeURIComponent(topic)}`;
  }

  // 5. Engineering & Physical Sciences
  if (/mechanical|civil engineering|electrical|robotics|aerospace|thermodynamics|circuits|structural/i.test(lower)) {
    return `https://www.engineeringtoolbox.com/search.htm?q=${encodeURIComponent(topic)}`;
  }

  // 6. Psychology & Counseling
  if (/psychology|counseling|cognitive|behavioral|mental health|therapy|psychiatry/i.test(lower)) {
    return `https://www.simplypsychology.org/?s=${encodeURIComponent(topic)}`;
  }

  // 7. Design & UI/UX
  if (/design|ui\/ux|graphic design|figma|typography|product design|user experience/i.test(lower)) {
    return `https://www.nngroup.com/search/?q=${encodeURIComponent(topic)}`;
  }

  // 8. Python & Backend
  if (/python|django|flask|fastapi|pandas|numpy/i.test(lower)) {
    return `https://docs.python.org/3/search.html?q=${encodeURIComponent(topic)}`;
  }

  // 9. React & Web Development
  if (/react|jsx|hooks|next\.js/i.test(lower)) {
    return `https://react.dev/reference/react`;
  }
  if (/javascript|js|frontend|html|css|dom|typescript|node|web/i.test(lower)) {
    return `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`;
  }

  // 10. DSA & Computer Science
  if (/dsa|data structure|algorithm|tree|graph|binary search|sorting|dp/i.test(lower)) {
    return `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(topic)}`;
  }

  // 11. Mathematics
  if (/math|algebra|calculus|geometry|trigonometry|statistics|probability/i.test(lower)) {
    return `https://mathworld.wolfram.com/search/?query=${encodeURIComponent(topic)}`;
  }

  // 12. Universal Fallback: High quality YouTube explanation
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(topic + " full explanation")}`;
}

export function getCuratedResources(topic = "", field = "") {
  const safeTopic = topic || field || "General Study";
  const query = encodeURIComponent(safeTopic);
  const combined = `${safeTopic} ${field}`.toLowerCase();
  const isPython = /python|django|flask|numpy|pandas|fastapi/i.test(combined);

  // 1. School / CBSE / NCERT / Boards
  if (/class \d+|10th|12th|ncert|cbse|icse|sst|social science|board exam/i.test(combined)) {
    return [
      {
        id: "ncert-doc",
        name: "NCERT Official Curriculum E-Books",
        provider: "National Council of Educational Research & Training",
        badge: "Official Textbooks",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Official government textbooks, syllabus chapters, and board exam blueprints.",
        url: "https://ncert.nic.in/textbook.php",
        icon: "🏛️"
      },
      {
        id: "yt-school",
        name: `${safeTopic} — Video Lectures`,
        provider: "YouTube Education",
        badge: "Video Classes",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "One-shot revision videos, animated timelines, and concept lectures.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " class 10 full chapter explanation")}`,
        icon: "📺"
      },
      {
        id: "gfg-school",
        name: `${safeTopic} — Quick Revision Notes`,
        provider: "GeeksforGeeks Academic",
        badge: "Chapter Notes",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Key dates, definitions, chapter summaries, and sample questions for exams.",
        url: `https://www.geeksforgeeks.org/search/?q=${query}`,
        icon: "📚"
      },
      {
        id: "wiki-school",
        name: `${safeTopic} — Comprehensive Reference`,
        provider: "Wikipedia Academic",
        badge: "Deep Dive",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Detailed historical context, maps, primary sources, and reference material.",
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${query}`,
        icon: "🌐"
      }
    ];
  }

  // 2. Medicine & Healthcare
  if (/medicine|doctor|physician|surgeon|nurse|health|anatomy|physiology|pathology|pharmacology|clinical|cardio|neet|medical/i.test(combined)) {
    return [
      {
        id: "medline-plus",
        name: "MedlinePlus Health & Medical Reference",
        provider: "National Institutes of Health (NIH)",
        badge: "Verified Medical Standard",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Peer-reviewed medical explanations, disease etiologies, anatomy guides, and drug monographs.",
        url: `https://medlineplus.gov/search?query=${query}`,
        icon: "🩺"
      },
      {
        id: "pubmed-ncbi",
        name: `${safeTopic} — Clinical Research & PubMed`,
        provider: "National Library of Medicine",
        badge: "Clinical Studies",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Primary biomedical literature, clinical trial outcomes, and healthcare systematic reviews.",
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${query}`,
        icon: "🔬"
      },
      {
        id: "yt-med",
        name: `${safeTopic} — Visual Anatomy & Clinical Classes`,
        provider: "Medical Lectures Hub",
        badge: "Video Lecture",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "3D anatomical reconstructions, clinical case discussions, and diagnostic protocols.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " medical lecture MBBS NEET")}`,
        icon: "📺"
      },
      {
        id: "who-guidelines",
        name: "WHO Global Clinical Protocols",
        provider: "World Health Organization",
        badge: "Global Standard",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "International diagnostic criteria, global health standards, and treatment guidelines.",
        url: `https://www.who.int/home/search?indexCatalogue=genericsearchindex1&searchQuery=${query}`,
        icon: "🌍"
      }
    ];
  }

  // 3. Law & Legal Studies
  if (/law|legal|judiciary|constitution|ipc|advocate|court|bar council|justice|civil rights/i.test(combined)) {
    return [
      {
        id: "indian-kanoon",
        name: "Indian Kanoon Legal Search",
        provider: "Indian Kanoon Repository",
        badge: "Supreme Court & Bare Acts",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Full text bare acts, high court rulings, constitutional bench precedents, and legal provisions.",
        url: `https://indiankanoon.org/search/?formInput=${query}`,
        icon: "⚖️"
      },
      {
        id: "bar-and-bench",
        name: `${safeTopic} — Case Analysis & Bar Updates`,
        provider: "Bar & Bench / LiveLaw",
        badge: "Case Law & Commentary",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Expert legal commentaries, constitutional landmark judgments, and statutory interpretations.",
        url: `https://www.barandbench.com/search?q=${query}`,
        icon: "📜"
      },
      {
        id: "yt-law",
        name: `${safeTopic} — Legal Concept Masterclass`,
        provider: "Judiciary & Law Academy",
        badge: "Video Lectures",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Detailed breakdown of sections, doctrine analysis, leading cases, and judiciary exam prep.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " law lecture case study")}`,
        icon: "📺"
      },
      {
        id: "bare-acts-portal",
        name: "Official Legislative Bare Acts",
        provider: "Legislative Department, Ministry of Law",
        badge: "Official Statutes",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Authentic statutory text, constitutional amendments, and codified statutes of India.",
        url: `https://legislative.gov.in/search?keys=${query}`,
        icon: "🏛️"
      }
    ];
  }

  // 4. Commerce, Finance & Business
  if (/finance|accounting|chartered accountant|ca|invest|banking|tax|economics|commerce|market|equity|stock|rbi|business/i.test(combined)) {
    return [
      {
        id: "investopedia-ref",
        name: "Investopedia Financial Reference",
        provider: "Investopedia",
        badge: "Finance Standard",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Clear definitions of accounting ratios, valuation models, macroeconomic indicators, and market mechanics.",
        url: `https://www.investopedia.com/search?q=${query}`,
        icon: "💰"
      },
      {
        id: "rbi-gov",
        name: `${safeTopic} — Reserve Bank of India Publications`,
        provider: "Reserve Bank of India",
        badge: "Official Regulatory Data",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Monetary policy updates, banking circulars, financial stability reports, and macroeconomic bulletins.",
        url: `https://www.rbi.org.in/Scripts/BS_Search.aspx?query=${query}`,
        icon: "🏛️"
      },
      {
        id: "yt-finance",
        name: `${safeTopic} — Business & Accounting Lectures`,
        provider: "Commerce & Finance Academy",
        badge: "Video Class",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Numerical ledger balancing, financial modeling tutorials, and corporate case breakdowns.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " commerce lecture explanation")}`,
        icon: "📺"
      },
      {
        id: "gfg-commerce",
        name: `${safeTopic} — Commerce & Economics Notes`,
        provider: "GeeksforGeeks Commerce",
        badge: "Revision Notes",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Summarized concepts for Class 11/12 Commerce, CA Foundation, and B.Com examination prep.",
        url: `https://www.geeksforgeeks.org/search/?q=${query}`,
        icon: "📊"
      }
    ];
  }

  // 5. Engineering & Physical Sciences
  if (/mechanical|civil engineering|electrical|electronics|robotics|aerospace|thermodynamics|circuits|structural/i.test(combined)) {
    return [
      {
        id: "eng-toolbox",
        name: "EngineeringToolBox Comprehensive Reference",
        provider: "The Engineering ToolBox",
        badge: "Formulas & Standards",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Design parameters, thermodynamic property tables, material stress curves, and empirical formulas.",
        url: `https://www.engineeringtoolbox.com/search.htm?q=${query}`,
        icon: "⚙️"
      },
      {
        id: "mit-ocw",
        name: `${safeTopic} — MIT OpenCourseWare`,
        provider: "Massachusetts Institute of Technology",
        badge: "University Lectures",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Undergraduate and graduate course syllabi, assignments, formula sheets, and lecture videos.",
        url: `https://ocw.mit.edu/search/?q=${query}`,
        icon: "🎓"
      },
      {
        id: "yt-eng",
        name: `${safeTopic} — Engineering Visualizations`,
        provider: "Engineering Academy",
        badge: "3D Video Simulations",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "CAD mechanics, circuit schematic walkthroughs, and practical engineering problem solving.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " engineering explanation lecture")}`,
        icon: "📺"
      },
      {
        id: "ieee-papers",
        name: `${safeTopic} — IEEE Technical Standards`,
        provider: "IEEE Xplore",
        badge: "Engineering Standards",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Industry benchmarks, hardware communication protocols, and modern technology whitepapers.",
        url: `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${query}`,
        icon: "📐"
      }
    ];
  }

  // 6. Psychology & Behavioral Sciences
  if (/psychology|counseling|cognitive|behavioral|mental health|therapy|psychiatry/i.test(combined)) {
    return [
      {
        id: "simply-psych",
        name: "Simply Psychology Scientific Guides",
        provider: "Simply Psychology Research",
        badge: "Core Theories",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Classic psychological experiments, developmental milestones, cognitive models, and behavioral theories.",
        url: `https://www.simplypsychology.org/?s=${query}`,
        icon: "🧠"
      },
      {
        id: "apa-org",
        name: "American Psychological Association (APA)",
        provider: "APA Official Portal",
        badge: "Clinical Standards",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "DSM-5 diagnostic frameworks, clinical practice guidelines, and behavioral research briefs.",
        url: `https://www.apa.org/search?query=${query}`,
        icon: "📚"
      },
      {
        id: "yt-psych",
        name: `${safeTopic} — Psychology Video Lectures`,
        provider: "Behavioral Sciences Hub",
        badge: "Video Class",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Case studies, cognitive neuroscience experiments, and therapeutic frameworks.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " psychology lecture explained")}`,
        icon: "📺"
      },
      {
        id: "pubmed-psych",
        name: "Behavioral Research & PubMed Articles",
        provider: "NCBI Behavioral Sciences",
        badge: "Empirical Studies",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Peer-reviewed cognitive experiments, neurological imaging studies, and meta-analyses.",
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${query}+psychology`,
        icon: "🔬"
      }
    ];
  }

  // 7. Mathematics & Statistics
  if (/math|algebra|calculus|geometry|trigonometry|statistics|probability/i.test(combined)) {
    return [
      {
        id: "wolfram-math",
        name: "Wolfram MathWorld Encyclopedia",
        provider: "Wolfram Research",
        badge: "Mathematical Rigor",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Rigorous proofs, algebraic theorems, geometric constructions, and calculus equations.",
        url: `https://mathworld.wolfram.com/search/?query=${query}`,
        icon: "📐"
      },
      {
        id: "khan-math",
        name: `${safeTopic} — Khan Academy Interactive Lessons`,
        provider: "Khan Academy",
        badge: "Step-by-Step Practice",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Interactive practice problems, step-by-step worked solutions, and foundational mastery.",
        url: `https://www.khanacademy.org/search?page_search_query=${query}`,
        icon: "✏️"
      },
      {
        id: "yt-math",
        name: `${safeTopic} — Visual Mathematics Video`,
        provider: "Maths Visual Academy",
        badge: "Visual Intuition",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Geometric visual proofs, numerical derivations, and intuitive explanations.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " mathematics visualization explanation")}`,
        icon: "📺"
      },
      {
        id: "gfg-math",
        name: `${safeTopic} — Quick Formulas & Theorems`,
        provider: "GeeksforGeeks Mathematics",
        badge: "Formula Sheet",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Cheat sheets, formulas, derivation summaries, and solved examples for competitive exams.",
        url: `https://www.geeksforgeeks.org/search/?q=${query}`,
        icon: "🔢"
      }
    ];
  }

  // 8. Python & Backend
  if (isPython) {
    return [
      {
        id: "python-official",
        name: "Python 3 Official Documentation",
        provider: "Python Software Foundation",
        badge: "Official Standard",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Authoritative language reference, standard library modules, and official tutorial guides.",
        url: `https://docs.python.org/3/search.html?q=${query}`,
        icon: "🐍"
      },
      {
        id: "real-python",
        name: `${safeTopic} — Real Python Deep Dives`,
        provider: "Real Python",
        badge: "Practical Guide",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Production-ready tutorials, idioms, design patterns, and code examples.",
        url: `https://realpython.com/search?q=${query}`,
        icon: "📖"
      },
      {
        id: "gfg-python",
        name: `${safeTopic} — GeeksforGeeks Practice & Notes`,
        provider: "GeeksforGeeks",
        badge: "Code Snippets",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Syntax quick-reference, edge cases, and algorithms.",
        url: `https://www.geeksforgeeks.org/search/?q=${query}`,
        icon: "💻"
      },
      {
        id: "yt-python",
        name: `${safeTopic} — Video Walkthroughs`,
        provider: "YouTube Academy",
        badge: "Video Tutorial",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Hands-on coding walkthroughs and full project demonstrations.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent("Python " + safeTopic + " full tutorial")}`,
        icon: "📺"
      }
    ];
  }

  // 9. Web / Frontend / Software Development
  if (/web|frontend|javascript|js|react|css|html|node|full stack|software/i.test(combined)) {
    return [
      {
        id: "mdn-doc",
        name: `${safeTopic} — MDN Web Documentation`,
        provider: "Mozilla Developer Network (MDN)",
        badge: "Official Web Standard",
        badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
        description: "Official web documentation with interactive code snippets, browser compatibility, and standard specifications.",
        url: `https://developer.mozilla.org/en-US/search?q=${query}`,
        icon: "🦊"
      },
      {
        id: "devdocs",
        name: `${safeTopic} — DevDocs Fast Reference`,
        provider: "DevDocs.io",
        badge: "Fast API Docs",
        badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
        description: "Instant searchable API documentation combining dozens of official developer specifications in one place.",
        url: `https://devdocs.io/#q=${query}`,
        icon: "⚡"
      },
      {
        id: "w3s-gfg",
        name: `${safeTopic} — GeeksforGeeks & Interactive Tutorials`,
        provider: "GeeksforGeeks",
        badge: "Interactive Examples",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Step-by-step guides, code sandboxes, and concept explanations.",
        url: `https://www.geeksforgeeks.org/search/?q=${query}`,
        icon: "📗"
      },
      {
        id: "yt-web",
        name: `${safeTopic} — Video Crash Courses`,
        provider: "YouTube Academy",
        badge: "Video Class",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "Visual concept explainers, coding demos, and architecture breakdowns.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " tutorial for developers")}`,
        icon: "📺"
      }
    ];
  }

  // 10. Universal Fallback: For ANY field or topic in the world!
  return [
    {
      id: "universal-scholar",
      name: `${safeTopic} — Academic Research & Scholarly Articles`,
      provider: "Google Scholar",
      badge: "Peer-Reviewed",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      description: "Verified academic publications, scholarly dissertations, and research papers from top institutions.",
      url: `https://scholar.google.com/scholar?q=${query}`,
      icon: "🎓"
    },
    {
      id: "universal-wiki",
      name: `${safeTopic} — Verified Encyclopedia Reference`,
      provider: "Wikipedia Reference",
      badge: "Complete Encyclopedia",
      badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
      description: "Comprehensive historical background, taxonomic classifications, literature reviews, and cross-references.",
      url: `https://en.wikipedia.org/wiki/Special:Search?search=${query}`,
      icon: "🌐"
    },
    {
      id: "universal-video",
      name: `${safeTopic} — Video Lecture Series`,
      provider: "Global Educational Lectures",
      badge: "Video Classes",
      badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
      description: "Full masterclasses, step-by-step concept walkthroughs, and practical demonstrations.",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " lecture complete guide")}`,
      icon: "📺"
    },
    {
      id: "universal-openstax",
      name: "Open Educational Textbooks & Blueprints",
      provider: "OpenStax & Academic Archives",
      badge: "Free Textbooks",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      description: "Peer-reviewed, publicly accessible college and secondary textbooks covering foundational curriculum.",
      url: `https://openstax.org/search?q=${query}`,
      icon: "📖"
    }
  ];
}
