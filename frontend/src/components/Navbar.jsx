import { useState, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import Button from "../components/Button";
import logo from "../assets/logo.svg";
import { useStudentAuth } from "../context/StudentAuthContext";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "FAQS", href: "/faq" },
  { label: "Revision", href: "/revision" },
];

function BrandLogo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2 sm:gap-3 transition-all duration-300 hover:opacity-95 active:scale-98 shrink-0"
    >
      {/* Logo Image */}
      <div className="relative flex h-12 w-20 sm:h-14 sm:w-24 items-center justify-center transition-transform duration-300 group-hover:scale-105">
        <img
          src={logo}
          alt="AIFinity Logo"
          className="w-full h-full object-contain transition-transform duration-300 group-hover:rotate-6"
        />
      </div>
    </Link>
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

  // Close drawer on path change
  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  // Handle Escape key and window resize
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-[#2E4F42]/12 bg-[#FBF8F0]/90 backdrop-blur-md transition-all shadow-[var(--shadow-card)] w-full">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <BrandLogo />

        {/* Desktop Links */}
        <ul className="hidden items-center gap-0.5 xl:gap-1 lg:flex shrink min-w-0">
          {NAV_LINKS.map((link) => {
            const isActive =
              currentPath === link.href ||
              (link.href !== "/" && currentPath.startsWith(link.href));

            return (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className={`rounded-lg px-2.5 py-1.5 xl:px-3.5 xl:py-2 text-xs font-sans font-semibold transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? "bg-[#1B332C] text-[#E8C547] font-bold shadow-xs border border-[#C4952A]/30"
                      : "text-[#24413A] hover:bg-[#EDE6D3]/60 hover:text-[#1B332C]"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* CTA Buttons */}
        <div className="hidden items-center gap-2 sm:gap-3 md:flex shrink-0 relative">
          {authLoading ? (
            <div className="h-9 w-36 rounded-xl bg-[#EDE6D3]/70 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <>
              {/* User avatar + name */}
              <div className="flex items-center mr-1">
                <Link
                  to="/personal-intelligence"
                  className="flex items-center justify-center h-9 w-9 rounded-full bg-[#E8C547] text-[#1B332C] hover:bg-[#C4952A] hover:text-white transition-colors shadow-sm mr-2 cursor-pointer shrink-0"
                  title="Personal Intelligence"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </Link>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-[#EDE6D3]/60 transition-colors cursor-pointer shrink-0"
                  title="Go to Dashboard"
                >
                  <div className="flex items-center justify-center h-9 w-9 rounded-full bg-[#1B332C] text-[#E8C547] font-bold text-xs shadow-sm shrink-0">
                    {getInitials(user.name)}
                  </div>
                  <span className="text-sm font-sans font-semibold text-[#1B332C] hidden xl:block max-w-[130px] truncate">
                    {user.name || "User"}
                  </span>
                </Link>
              </div>
              <Link
                to="/assessment"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] px-3.5 py-1.5 text-xs font-bold text-[#E8C547] border border-[#C4952A]/40 shadow-xs hover:bg-[#2E4F42] hover:text-white transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <span>⚡ Take Assessment</span>
              </Link>
              <Button
                onClick={handleLogout}
                size="sm"
                className="shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
              >
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/assessment"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1B332C] px-3.5 py-1.5 text-xs font-bold text-[#E8C547] border border-[#C4952A]/40 shadow-xs hover:bg-[#2E4F42] hover:text-white transition-all duration-200 whitespace-nowrap shrink-0"
              >
                <span>⚡ Take Assessment</span>
              </Link>
              <Link
                to="/login"
                className="px-3 py-1.5 text-xs font-sans font-semibold text-[#1B332C] hover:text-[#C4952A] transition-colors shrink-0"
              >
                Log In
              </Link>
              <Button
                as={Link}
                to="/signup"
                size="sm"
                className="shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 shrink-0"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="flex h-10 w-10 items-center justify-center rounded-md border border-[#2E4F42]/20 bg-[#F1EDE1] text-[#1B332C] transition-all hover:bg-[#EDE6D3] active:scale-95 lg:hidden cursor-pointer shrink-0"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
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
        <div className="border-t border-[#2E4F42]/15 bg-[#FBF8F0] px-4 py-5 backdrop-blur-lg lg:hidden transition-all w-full max-w-full overflow-hidden">
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => {
              const isActive =
                currentPath === link.href ||
                (link.href !== "/" && currentPath.startsWith(link.href));

              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={`block rounded-md px-4 py-2.5 text-sm font-sans font-semibold transition-all ${
                      isActive
                        ? "bg-[#EDE6D3] text-[#1B332C] font-bold border-l-4 border-[#D9A62B]"
                        : "text-[#24413A] hover:bg-[#EDE6D3]/50 hover:text-[#1B332C]"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
            <li className="pt-3 border-t border-[#2E4F42]/10 flex flex-col gap-2">
              <Link
                to="/assessment"
                className="w-full text-center py-2.5 text-sm font-sans font-bold text-[#E8C547] bg-[#1B332C] rounded-xl shadow-xs border border-[#C4952A]/40 transition-colors"
                onClick={() => setOpen(false)}
              >
                ⚡ Take Assessment
              </Link>
              {authLoading ? (
                <div className="h-10 w-full rounded-xl bg-[#EDE6D3]/70 animate-pulse" aria-hidden="true" />
              ) : user ? (
                <>
                  <div className="px-4 py-3 mb-1 bg-white/50 rounded-xl border border-[#2E4F42]/5 flex items-center gap-3">
                    <div className="flex shrink-0 items-center justify-center h-10 w-10 rounded-full bg-[#1B332C] text-[#E8C547] font-bold text-sm shadow-sm">
                      {getInitials(user.name)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name || "User"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/personal-intelligence"
                    className="w-full text-center py-2 text-sm font-sans font-bold text-[#D9A62B] hover:text-[#1B332C] bg-[#EDE6D3] rounded-xl transition-colors"
                    onClick={() => setOpen(false)}
                  >
                    ✦ Personal Intelligence
                  </Link>
                  <Link
                    to="/dashboard"
                    className="w-full text-center py-2 text-sm font-sans font-semibold text-[#1B332C] hover:text-[#C4952A]"
                    onClick={() => setOpen(false)}
                  >
                    📊 Dashboard
                  </Link>
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
                  <Link
                    to="/login"
                    className="w-full text-center py-2 text-sm font-sans font-semibold text-[#1B332C] hover:text-[#C4952A]"
                    onClick={() => setOpen(false)}
                  >
                    Log In
                  </Link>
                  <Button as={Link} to="/signup" size="md" className="w-full" onClick={() => setOpen(false)}>
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
