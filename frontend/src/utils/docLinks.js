/**
 * Universal Documentation & Verified Learning Resource Resolver
 * Supports Any Domain: Web/Frontend, Backend, Python, DSA, and School (e.g. CBSE/NCERT Class 10 SST, Science, etc.)
 */

export function getPrimaryDocUrl(topic = "") {
  if (!topic) return "https://devdocs.io";
  const lower = topic.toLowerCase();

  // 1. School / CBSE / NCERT / SST
  if (/sst|social science|history|geography|civics|economics|class 10|class 12|ncert|cbse|biology|chemistry|physics/i.test(lower)) {
    return "https://ncert.nic.in/textbook.php";
  }

  // 2. Python
  if (/python|django|flask|numpy|pandas|fastapi/i.test(lower)) {
    return `https://docs.python.org/3/search.html?q=${encodeURIComponent(topic)}`;
  }

  // 3. React
  if (/react|jsx|hooks|next\.js/i.test(lower)) {
    return `https://react.dev/reference/react`;
  }

  // 4. Web / Frontend / JS / CSS / HTML / DOM
  if (/javascript|js|frontend|html|css|dom|typescript|node|web/i.test(lower)) {
    return `https://developer.mozilla.org/en-US/search?q=${encodeURIComponent(topic)}`;
  }

  // 5. DSA / Algorithms
  if (/dsa|data structure|algorithm|tree|graph|binary search|sorting|dp/i.test(lower)) {
    return `https://www.geeksforgeeks.org/search/?q=${encodeURIComponent(topic)}`;
  }

  // 6. Universal default: DevDocs or GeeksforGeeks
  return `https://devdocs.io/#q=${encodeURIComponent(topic)}`;
}

export function getCuratedResources(topic = "", field = "") {
  const safeTopic = topic || "Web Development";
  const query = encodeURIComponent(safeTopic);
  const combined = (safeTopic + " " + field).toLowerCase();

  const isSchool = /sst|social science|history|geography|civics|economics|class 10|class 12|ncert|cbse|biology|chemistry|physics/i.test(combined);
  const isPython = /python|django|flask|numpy|pandas|fastapi/i.test(combined);

  if (isSchool) {
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
        id: "yt-school",
        name: `${safeTopic} — Animated Video Lectures`,
        provider: "YouTube Education",
        badge: "Video Classes",
        badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
        description: "One-shot revision videos, animated timelines, and concept lectures.",
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(safeTopic + " class 10 full chapter explanation")}`,
        icon: "📺"
      },
      {
        id: "wiki-school",
        name: `${safeTopic} — Comprehensive Encyclopedia`,
        provider: "Wikipedia Academic",
        badge: "Deep Dive",
        badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        description: "Detailed historical context, maps, primary sources, and reference material.",
        url: `https://en.wikipedia.org/wiki/Special:Search?search=${query}`,
        icon: "🌐"
      }
    ];
  }

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

  // Web & General Tech Standard Documentation
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
