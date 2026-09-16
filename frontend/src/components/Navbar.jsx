import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import logo from "../assets/logo.svg";
import { useStudentAuth } from "../context/StudentAuthContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQS", href: "/faq" },
];

function BrandLogo() {
  return (
    <a
      href="/"
      className="group flex items-center gap-3 transition-all duration-300 hover:opacity-95 active:scale-98"
    >
      {/* Logo Image */}
      <div className="relative flex h-15 w-25 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <img
          src={logo}
          alt="AIFinity Logo"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:rotate-6"
        />
      </div>
    </a>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const { user, loading: authLoading, logout } = useStudentAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#2E4F42]/12 bg-[#FBF8F0]/90 backdrop-blur-md transition-all shadow-[var(--shadow-card)]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <BrandLogo />

        {/* Desktop Links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              currentPath === link.href ||
              (link.href !== "/" && currentPath.startsWith(link.href));

            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  className={`rounded-lg px-3.5 py-2 text-xs font-sans font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#1B332C] text-[#E8C547] font-bold shadow-xs border border-[#C4952A]/30"
                      : "text-[#24413A] hover:bg-[#EDE6D3]/60 hover:text-[#1B332C]"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            );
          })}
        </ul>

        {/* CTA Buttons */}
        <div className="hidden items-center gap-3 md:flex relative">
          {authLoading ? (
            <div className="h-9 w-40 rounded-xl bg-[#EDE6D3]/70 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <>
              {/* User avatar + name → clicks to dashboard */}
              <a
                href="/dashboard"
                className="flex items-center gap-2 mr-1 rounded-xl px-2 py-1 hover:bg-[#EDE6D3]/60 transition-colors cursor-pointer"
                title="Go to Dashboard"
              >
                <a
                  href="/personal-intelligence"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-[#E8C547] text-[#1B332C] hover:bg-[#C4952A] hover:text-white transition-colors shadow-sm mr-1 cursor-pointer"
                  title="Personal Intelligence"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </a>
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#1B332C] text-[#E8C547] font-bold text-xs shadow-sm">
                  {getInitials(user.name)}
                </div>
                <span className="text-sm font-sans font-semibold text-[#1B332C] hidden xl:block">
                  {user.name || "User"}
                </span>
              </a>
              <a
                href="/assessment"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] px-3.5 py-1.5 text-xs font-bold text-[#E8C547] border border-[#C4952A]/40 shadow-xs hover:bg-[#2E4F42] hover:text-white transition-all duration-200"
              >
                <span>⚡ Take Assessment</span>
              </a>
              <Button
                onClick={handleLogout}
                size="sm"
                className="shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <a
                href="/assessment"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] px-3.5 py-1.5 text-xs font-bold text-[#E8C547] border border-[#C4952A]/40 shadow-xs hover:bg-[#2E4F42] hover:text-white transition-all duration-200"
              >
                <span>⚡ Take Assessment</span>
              </a>
              <a
                href="/login"
                className="px-3 py-1.5 text-xs font-sans font-semibold text-[#1B332C] hover:text-[#C4952A] transition-colors"
              >
                Log In
              </a>
              <Button
                as="a"
                href="/signup"
                size="sm"
                className="shadow-sm transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2E4F42]/20 bg-[#F1EDE1] text-[#1B332C] transition-all hover:bg-[#EDE6D3] active:scale-95 lg:hidden cursor-pointer"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="border-t border-[#2E4F42]/15 bg-[#FBF8F0] px-4 py-5 backdrop-blur-lg lg:hidden transition-all">
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const isActive =
                currentPath === link.href ||
                (link.href !== "/" && currentPath.startsWith(link.href));

              return (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className={`block rounded-md px-4 py-2.5 text-sm font-sans font-semibold transition-all ${
                      isActive
                        ? "bg-[#EDE6D3] text-[#1B332C] font-bold border-l-4 border-[#D9A62B]"
                        : "text-[#24413A] hover:bg-[#EDE6D3]/50 hover:text-[#1B332C]"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </a>
                </li>
              );
            })}
            <li className="pt-3 border-t border-[#2E4F42]/10 flex flex-col gap-2">
              <a
                href="/assessment"
                className="w-full text-center py-2.5 text-sm font-sans font-bold text-[#E8C547] bg-[#1B332C] rounded-xl shadow-xs border border-[#C4952A]/40 transition-colors"
                onClick={() => setOpen(false)}
              >
                ⚡ Take Assessment
              </a>
              {authLoading ? (
                <div className="h-10 w-full rounded-xl bg-[#EDE6D3]/70 animate-pulse" aria-hidden="true" />
              ) : user ? (
                <>
                  <div className="px-4 py-3 mb-1 bg-white/50 rounded-xl border border-[#2E4F42]/5 flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center h-10 w-10 rounded-full bg-[#1B332C] text-[#E8C547] font-bold text-sm shadow-sm">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-semibold text-gray-800">{user.name || "User"}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <a
                    href="/personal-intelligence"
                    className="w-full text-center py-2 text-sm font-sans font-bold text-[#D9A62B] hover:text-[#1B332C] bg-[#EDE6D3] rounded-xl transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    ✦ Personal Intelligence
                  </a>
                  <a
                    href="/dashboard"
                    className="w-full text-center py-2 text-sm font-sans font-semibold text-[#1B332C] hover:text-[#C4952A]"
                    onClick={() => setOpen(false)}
                  >
                    📊 Dashboard
                  </a>
                  <Button 
                    onClick={() => {
                      setOpen(false);
                      handleLogout();
                    }} 
                    size="md" 
                    className="w-full"
                  >
                    Log Out
                  </Button>
                </>
              ) : (
                <>
                  <a
                    href="/login"
                    className="w-full text-center py-2 text-sm font-sans font-semibold text-[#1B332C] hover:text-[#C4952A]"
                    onClick={() => setOpen(false)}
                  >
                    Log In
                  </a>
                  <Button as="a" href="/signup" size="md" className="w-full" onClick={() => setOpen(false)}>
                    Get Started
                  </Button>
                </>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}