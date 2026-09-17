import React, { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Container from "../components/Container";
import Section from "../components/Section";
import Card from "../components/Card";
import Button from "../components/Button";
import { getCuratedResources, getPrimaryDocUrl } from "../utils/docLinks";

// 100% Accurate, Production-Grade Educational Handbook Data
const HANDBOOK_CHAPTERS = [
  {
    id: "js-core",
    category: "JavaScript Core",
    icon: "⚡",
    topics: [
      {
        id: "variables-scope",
        title: "Variables, Scoping & Hoisting",
        level: "Foundational",
        summary: "Understand memory allocation differences between var, let, and const, temporal dead zone (TDZ), and lexical scoping.",
        code: `// 1. var vs let/const & Block Scope
function scopeExample() {
  if (true) {
    var functionScoped = "Accessible outside block";
    let blockScoped = "Locked inside block";
    const immutableRef = { version: 1 };
    immutableRef.version = 2; // Allowed (mutating properties)
    // immutableRef = {};     // TypeError: Assignment to constant variable
  }
  console.log(functionScoped); // OK
  // console.log(blockScoped); // ReferenceError: blockScoped is not defined
}

// 2. Temporal Dead Zone (TDZ)
// console.log(a); // ReferenceError: Cannot access 'a' before initialization
let a = 10;`,
        keyTakeaways: [
          "var is function-scoped and hoisted with undefined initialization.",
          "let and const are block-scoped and hoisted into the Temporal Dead Zone (TDZ).",
          "const prevents variable reassignment, but object properties can still be mutated."
        ],
        commonMistake: "Mutating arrays or objects declared with const without realizing Object.freeze() is needed for shallow immutability."
      },
      {
        id: "closures",
        title: "Closures & Lexical Environment",
        level: "Core",
        summary: "A closure is the combination of a function bundled together with references to its surrounding state (lexical environment).",
        code: `// Practical Pattern: Private State Encapsulation
function createCounter(initialValue = 0) {
  let count = initialValue; // Private variable enclosed

  return {
    increment() {
      count += 1;
      return count;
    },
    decrement() {
      count -= 1;
      return count;
    },
    getValue() {
      return count;
    }
  };
}

const counter = createCounter(10);
console.log(counter.increment()); // 11
console.log(counter.increment()); // 12
console.log(counter.getValue());  // 12
console.log(counter.count);       // undefined (fully encapsulated!)`,
        keyTakeaways: [
          "Inner functions retain access to outer function scope even after the outer function has returned.",
          "Essential for data encapsulation, memoization, and partial application / currying.",
          "Be careful with closures in loops or event listeners to prevent accidental memory leaks."
        ],
        commonMistake: "Creating closures inside high-frequency loops without clearing references, causing retained DOM nodes in memory."
      },
      {
        id: "async-promises",
        title: "Promises, Event Loop & Async/Await",
        level: "Intermediate",
        summary: "JavaScript's single-threaded concurrency model: Call Stack, Web APIs, Microtask Queue (Promises), and Macrotask Queue (setTimeout).",
        code: `// Microtask vs Macrotask Execution Order
console.log("1: Synchronous");

setTimeout(() => {
  console.log("4: Macrotask (setTimeout)");
}, 0);

Promise.resolve().then(() => {
  console.log("2: Microtask (Promise 1)");
}).then(() => {
  console.log("3: Microtask (Promise 2)");
});

console.log("1.5: Synchronous end");
// Output order: 1 -> 1.5 -> 2 -> 3 -> 4!

// Clean Async/Await with Robust Error Handling
async function fetchStudentProfile(userId) {
  try {
    const response = await fetch(\`/api/users/\${userId}\`);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Fetch failed:", error.message);
    return { success: false, error: error.message };
  }
}`,
        keyTakeaways: [
          "Microtasks (Promises, queueMicrotask) execute before Macrotasks (setTimeout, setInterval, I/O).",
          "async functions always return a Promise implicitly.",
          "Always wrap await calls in try/catch or chain .catch() to avoid unhandled promise rejections."
        ],
        commonMistake: "Awaiting sequential async calls in a loop when Promise.all() could execute them concurrently."
      },
      {
        id: "prototypes-this",
        title: "this Keyword & Prototype Chain",
        level: "Core",
        summary: "How `this` is determined by call-site (Default, Implicit, Explicit, and `new` binding), and how arrow functions inherit `this` lexically.",
        code: `const user = {
  name: "Ishika",
  // Standard method: 'this' binds to calling object
  greetNormal() {
    return \`Hello, \${this.name}\`;
  },
  // Arrow function: inherits 'this' lexically from surrounding scope (window/global here)
  greetArrow: () => {
    return \`Hello, \${this?.name || "anonymous"}\`;
  }
};

console.log(user.greetNormal()); // "Hello, Ishika"
console.log(user.greetArrow());  // "Hello, anonymous" (or undefined)

// Explicit Binding: call, apply, bind
function displayRole(level, tenure) {
  return \`\${this.name} is a \${level} with \${tenure} years experience\`;
}

console.log(displayRole.call(user, "Lead Engineer", 4));
const boundGreet = displayRole.bind(user, "Staff Engineer");
console.log(boundGreet(5));`,
        keyTakeaways: [
          "Regular functions bind `this` based on how they are invoked at runtime.",
          "Arrow functions do NOT have their own `this`, `arguments`, or `prototype`; they capture `this` from enclosing lexical scope.",
          "`bind` creates a new function with fixed `this` reference."
        ],
        commonMistake: "Using arrow functions for object methods or class prototype methods where dynamic `this` was expected."
      }
    ]
  },
  {
    id: "dom-browser",
    category: "DOM & Browser APIs",
    icon: "🌐",
    topics: [
      {
        id: "dom-manipulation",
        title: "Modern DOM Manipulation & Events",
        level: "Foundational",
        summary: "Event bubbling, capturing, event delegation, and avoiding expensive layout thrashing in browser reflows.",
        code: `// Pattern: Event Delegation (1 listener for all child buttons)
const container = document.querySelector("#tasks-container");

container.addEventListener("click", (event) => {
  // Check if click originated from or inside a delete button
  const deleteBtn = event.target.closest(".btn-delete");
  if (!deleteBtn) return;

  const taskId = deleteBtn.dataset.id;
  console.log("Deleting task ID:", taskId);
  // Perform action without attaching 100 separate event listeners!
});

// Efficient Batch DOM Insertion (Prevents layout thrashing)
function appendTasksEfficiently(tasks) {
  const fragment = document.createDocumentFragment();
  tasks.forEach(task => {
    const el = document.createElement("div");
    el.className = "task-item";
    el.textContent = task.title;
    fragment.appendChild(el);
  });
  // Single reflow!
  container.appendChild(fragment);
}`,
        keyTakeaways: [
          "Use event delegation with event.target.closest() to minimize listener memory footprint.",
          "Use DocumentFragment or requestAnimationFrame to batch DOM mutations.",
          "Always remove global window/document listeners when components unmount."
        ],
        commonMistake: "Modifying layout properties (like offsetTop, clientWidth) interleaved with DOM writes, causing forced synchronous reflow."
      },
      {
        id: "storage-apis",
        title: "Web Storage & Client Persistence",
        level: "Foundational",
        summary: "Comparing LocalStorage, SessionStorage, Cookies, and IndexedDB for client-side state.",
        code: `// Safe Type-Aware LocalStorage Wrapper
const SafeStorage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.warn(\`Error reading key "\${key}":\`, err);
      return defaultValue;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.error(\`Storage quota exceeded or disabled:\`, err);
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (err) {}
  }
};

SafeStorage.set("user_preferences", { theme: "chalkboard", autoSave: true });
const prefs = SafeStorage.get("user_preferences");
console.log(prefs.theme); // "chalkboard"`,
        keyTakeaways: [
          "LocalStorage is synchronous and limited to ~5MB per origin.",
          "SessionStorage clears when the tab/window session closes.",
          "Never store sensitive authentication tokens (like refresh tokens) in LocalStorage if XSS is a risk; prefer HttpOnly cookies."
        ],
        commonMistake: "Failing to wrap JSON.parse(localStorage.getItem(...)) in try/catch, crashing when stored value is malformed."
      }
    ]
  },
  {
    id: "react-essentials",
    category: "React 19 & Modern Hooks",
    icon: "⚛️",
    topics: [
      {
        id: "hooks-state-lifecycle",
        title: "useState, useEffect & Cleanups",
        level: "Core",
        summary: "Predictable state updates, functional updater syntax, dependency array stability, and effect teardowns.",
        code: `import { useState, useEffect } from "react";

function TimerTracker({ intervalSeconds = 1, onTick }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    // 1. Setup subscription / timer
    const timerId = setInterval(() => {
      // Functional updater ensures latest state without stale closures
      setSeconds(prev => prev + 1);
    }, intervalSeconds * 1000);

    // 2. Teardown / cleanup function: Runs on unmount or before re-running effect
    return () => {
      clearInterval(timerId);
    };
  }, [intervalSeconds]); // Only restart interval if intervalSeconds changes!

  return <div>Active Session: {seconds}s</div>;
}`,
        keyTakeaways: [
          "Always use functional updater `setCount(prev => prev + 1)` when next state depends on prior state.",
          "Every object or function referenced inside useEffect MUST be in its dependency array, or memoized with useMemo/useCallback.",
          "Cleanups are mandatory for timers, subscriptions, and abort controllers."
        ],
        commonMistake: "Omitting dependencies from useEffect causing stale closures, or creating infinite re-render loops with non-memoized objects."
      },
      {
        id: "custom-hooks",
        title: "Custom Hooks & State Composition",
        level: "Intermediate",
        summary: "Extract reusable stateful logic into modular, testable hooks without component inheritance.",
        code: `import { useState, useEffect } from "react";

// Reusable custom hook for window dimensions
export function useWindowDimensions() {
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768
  });

  useEffect(() => {
    let timeoutId = null;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
          isMobile: window.innerWidth < 768
        });
      }, 100); // 100ms debounce
    };

    window.addEventListener("resize", handleResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return dimensions;
}`,
        keyTakeaways: [
          "Custom hooks must always start with 'use' so React lint rules can enforce hook invariants.",
          "Hooks share stateful logic, not the state itself; each invocation gets isolated state.",
          "Great for API fetching, media queries, local storage synchronization, and form management."
        ],
        commonMistake: "Invoking hooks conditionally or inside nested loops, violating the Rules of Hooks."
      }
    ]
  }
];

export default function Handbook() {
  const [searchParams] = useSearchParams();
  const incomingTopic = searchParams.get("topic") || "";

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState(incomingTopic);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  // When topic param changes (e.g. back-navigation), sync search
  useEffect(() => {
    if (incomingTopic) {
      setSearchQuery(incomingTopic);
      setSelectedCategory("All");
    }
  }, [incomingTopic]);

  const activeTopic = searchQuery || incomingTopic || "Web Development";
  const curatedDocs = useMemo(() => getCuratedResources(activeTopic, ""), [activeTopic]);
  const primaryDocUrl = useMemo(() => getPrimaryDocUrl(activeTopic), [activeTopic]);

  // Filter topics based on category and search query
  const filteredTopics = useMemo(() => {
    return HANDBOOK_CHAPTERS.flatMap((chapter) => {
      if (selectedCategory !== "All" && chapter.category !== selectedCategory) {
        return [];
      }
      return chapter.topics.filter((t) => {
        const query = searchQuery.toLowerCase();
        return (
          t.title.toLowerCase().includes(query) ||
          t.summary.toLowerCase().includes(query) ||
          t.keyTakeaways.some((k) => k.toLowerCase().includes(query))
        );
      });
    });
  }, [selectedCategory, searchQuery]);

  const handleCopyCode = (id, code) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Header Banner */}
      <div className="border-b border-[#2E4F42]/12 bg-[#FBF8F0] py-10 px-4 sm:px-6 lg:px-8 shadow-xs">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link
                  to="/roadmap"
                  className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1"
                >
                  ← Back to Roadmap
                </Link>
                <span className="text-[#8B9690]">•</span>
                <span className="rounded-full bg-[#E8C547]/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#1B332C]">
                  Official Curriculum Reference
                </span>
              </div>
              <h1
                className="text-3xl sm:text-4xl font-extrabold text-[#1B332C]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {incomingTopic ? `${incomingTopic} — Study & Documentation Guide` : "Handbook & Official Documentation Hub"}
              </h1>
              <p className="mt-1.5 text-sm text-[#5B6B5F] max-w-2xl">
                100% verified documentation, standard references, runtime models, code patterns, and official textbooks for any learning milestone.
              </p>
              {/* Roadmap context banner */}
              {incomingTopic && (
                <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#E8C547]/20 border border-[#E8C547]/40 px-4 py-2 text-xs font-semibold text-[#1B332C]">
                  <span>📍</span>
                  <span>Studying for your roadmap phase: <strong>{incomingTopic}</strong></span>
                </div>
              )}
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2.5 shrink-0">
              <div className="flex items-center gap-2">
                <a
                  href={primaryDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] text-[#E8C547] px-4 py-2.5 text-xs font-bold hover:bg-[#2E4F42] transition shadow-xs"
                >
                  <span>📖 Open Official Docs ↗</span>
                </a>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(incomingTopic ? `/assessment?topic=${encodeURIComponent(incomingTopic)}` : "/assessment")}
                >
                  Practice in Assessment →
                </Button>
              </div>
              {incomingTopic && (
                <a
                  href={`/resources/project-ideas?topic=${encodeURIComponent(incomingTopic)}`}
                  className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1"
                >
                  💡 Build a Project with this →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        {/* Official Documentation & Verified Resources Grid */}
        <div className="mb-10 rounded-2xl border border-[#2E4F42]/15 bg-[#FBF8F0] p-6 sm:p-7 shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-[#2E4F42]/10 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8C547]/30 text-xs">
                  🌐
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-[#1B332C]">
                  Verified Documentation & Learning Sources for <span className="text-[#C4952A]">"{activeTopic}"</span>
                </h3>
              </div>
              <p className="text-xs text-[#5B6B5F] mt-1">
                Official specifications, textbooks, and interactive sandbox guides from authoritative educational providers.
              </p>
            </div>
            <a
              href={primaryDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#2E4F42] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Primary Source ↗</span>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {curatedDocs.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col justify-between rounded-xl border border-[#2E4F42]/10 bg-white p-4 hover:border-[#2E4F42]/30 hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-2xl">{doc.icon}</span>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${doc.badgeColor}`}>
                      {doc.badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-[#1B332C] group-hover:text-[#2E4F42] transition-colors leading-snug">
                    {doc.name}
                  </h4>
                  <p className="text-[11px] text-[#8B9690] font-medium mt-0.5">
                    {doc.provider}
                  </p>
                  <p className="text-xs text-[#5B6B5F] mt-2 line-clamp-2">
                    {doc.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#2E4F42]/08 flex items-center justify-between text-xs font-bold text-[#2E4F42]">
                  <span>Open Resource</span>
                  <span className="transition-transform group-hover:translate-x-1">↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {["All", "JavaScript Core", "DOM & Browser APIs", "React 19 & Modern Hooks"].map((cat) => (
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
          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search concepts or syntax..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#2E4F42]/15 bg-[#FBF8F0] px-4 py-2 text-xs text-[#1B332C] placeholder-[#8B9690] focus:outline-none focus:ring-2 focus:ring-[#2E4F42]"
            />
          </div>
        </div>

        {/* Topics List */}
        {filteredTopics.length === 0 ? (
          <div className="rounded-2xl border border-[#2E4F42]/12 bg-[#FBF8F0] p-8 sm:p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8C547]/20 text-[#1B332C] text-xl mb-3">
              📚
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#1B332C]">
              Dedicated Official Documentation Available for "{activeTopic}"
            </h3>
            <p className="text-xs sm:text-sm text-[#5B6B5F] mt-1.5 max-w-xl mx-auto">
              This topic belongs to external standards & official syllabuses (e.g., MDN Web Docs, DevDocs, Python.org, or NCERT). Click any of the verified documentation cards above to read the complete official guides, textbooks, and interactive sandboxes.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <a
                href={primaryDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1B332C] px-5 py-2.5 text-xs font-bold text-[#E8C547] hover:bg-[#2E4F42] transition shadow-xs"
              >
                <span>Read Official Docs ↗</span>
              </a>
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
                className="rounded-xl border border-[#2E4F42]/15 bg-white px-4 py-2.5 text-xs font-semibold text-[#1B332C] hover:bg-[#EDE6D3] transition"
              >
                Clear filter to view all local code chapters
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-[#8B9690]">
                Interactive Reference Chapters ({filteredTopics.length})
              </span>
            </div>
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                id={topic.id}
                className="rounded-2xl border border-[#2E4F42]/12 bg-[#FBF8F0] p-6 sm:p-8 shadow-[var(--shadow-card)] transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2E4F42]/10 pb-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
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

                  <button
                    type="button"
                    onClick={() => handleCopyCode(topic.id, topic.code)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E4F42]/15 bg-white px-3 py-1.5 text-xs font-semibold text-[#1B332C] hover:bg-[#EDE6D3] active:scale-95 transition self-start sm:self-auto"
                  >
                    <span>{copiedId === topic.id ? "✓ Copied" : "Copy Code"}</span>
                  </button>
                </div>

                <p className="text-sm text-[#24413A] leading-relaxed mb-5">
                  {topic.summary}
                </p>

                {/* Code Block */}
                <div className="rounded-xl overflow-hidden border border-[#1B332C]/30 bg-[#162923] p-4 text-xs font-mono text-[#FBF8F0] shadow-inner mb-6">
                  <pre className="overflow-x-auto leading-5">
                    <code>{topic.code}</code>
                  </pre>
                </div>

                {/* Two Columns: Key Takeaways & Common Mistake */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
                  <div className="rounded-xl border border-[#2E4F42]/10 bg-[#EDE6D3]/40 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#2E4F42] mb-2.5 flex items-center gap-1.5">
                      <span>✓</span> Key Takeaways
                    </h4>
                    <ul className="space-y-1.5 text-xs text-[#24413A]">
                      {topic.keyTakeaways.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[#2E4F42] font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#B91C1C] mb-2 flex items-center gap-1.5">
                      <span>⚠️</span> Common Pitfall to Avoid
                    </h4>
                    <p className="text-xs text-[#7F1D1D] leading-relaxed">
                      {topic.commonMistake}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
