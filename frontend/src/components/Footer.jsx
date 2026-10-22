import { Link } from "react-router-dom";
import Container from "../components/Container";
import logo from "../assets/logo.svg";

const FOOTER_COLUMNS = [
  {
    heading: "Product",
    links: [
      { label: "Concept Root", href: "/concept-root" },
      { label: "Mistake Map", href: "/mistake-map" },
      { label: "Skill Gap", href: "/skill-gap" },
      { label: "Roadmap", href: "/roadmap" },
      { label: "Assessment", href: "/assessment" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
      {label: "FAQS", href: "/faq"},
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Log In", href: "/login" },
      { label: "Sign Up", href: "/signup" },
    ],
  },
];

function GithubIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function LinkedinIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.74a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2z" />
    </svg>
  );
}

function TwitterIcon() {
  return (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-[#C4952A]/30 bg-[#1B332C] text-[#FBF8F0]">
      <Container>
        <div className="grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Col */}
          <div className="flex flex-col gap-4 sm:col-span-2">
            <Link to="/" className="group flex items-center gap-3 w-fit">
              {/* Logo Image */}
              <div className="relative flex h-14 w-14 items-center justify-center rounded-xl bg-white p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105">
                <img
                  src={logo}
                  alt="AIFinity Logo"
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:rotate-6"
                />
              </div>

              <div className="flex flex-col">
                <span className="font-sans text-xl font-bold tracking-tight text-[#FBF8F0] leading-none group-hover:text-[#E8C547] transition-colors">
                  AIFINITY<span className="ml-1 font-mono text-xs font-bold uppercase tracking-widest text-[#E8C547]"></span>
                </span>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#8B9690] leading-tight mt-0.5">
                  Learning Intelligence
                </span>
              </div>
            </Link>

            <div className="flex flex-col gap-1">
              <p className="font-sans text-sm text-[#E8C547] font-semibold italic">
                "Learn smarter. Learn deeper."
              </p>
              <p className="max-w-sm text-xs leading-5 text-[#EDE6D3]/80 font-sans">
                Building clear, intelligent, and guided learning paths from where you are to where you want to be.
              </p>
            </div>

            <div className="flex gap-3 mt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C4952A]/30 bg-[#2E4F42]/40 text-[#EDE6D3] transition-all duration-200 hover:border-[#E8C547] hover:text-[#E8C547] hover:bg-[#2E4F42] hover:-translate-y-0.5"
                aria-label="GitHub"
              >
                <GithubIcon />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C4952A]/30 bg-[#2E4F42]/40 text-[#EDE6D3] transition-all duration-200 hover:border-[#E8C547] hover:text-[#E8C547] hover:bg-[#2E4F42] hover:-translate-y-0.5"
                aria-label="LinkedIn"
              >
                <LinkedinIcon />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[#C4952A]/30 bg-[#2E4F42]/40 text-[#EDE6D3] transition-all duration-200 hover:border-[#E8C547] hover:text-[#E8C547] hover:bg-[#2E4F42] hover:-translate-y-0.5"
                aria-label="Twitter / X"
              >
                <TwitterIcon />
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h4 className="font-['Space_Mono'] text-xs font-bold uppercase tracking-wider text-[#E8C547]">
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      to={link.href}
                      className="text-xs font-sans text-[#EDE6D3]/90 transition-colors duration-200 hover:text-[#E8C547] hover:underline decoration-[#E8C547]/40"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-[#2E4F42]/50 py-6 sm:flex-row font-['Space_Mono'] text-xs text-[#8B9690]">
          <p>
            © {new Date().getFullYear()} AIFinity. All rights reserved. Developed by Faiz, Isika, and Aman Negi.
          </p>
          <div className="flex gap-6">
            <Link to="/privacy" className="transition-colors hover:text-[#E8C547]">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-[#E8C547]">
              Terms of Service
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}