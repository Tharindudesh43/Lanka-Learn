"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen, LayoutDashboard, Shield, GraduationCap,
  User, LogOut, ChevronDown, Menu, X, Layers,
  Home, Info, HelpCircle, Search,
} from "lucide-react";
import { UserRole } from "@/types";
import { getInitials } from "@/lib/utils";
import MainImage from "@/public/MainLogoLearn.png";

type NavLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  roles?: UserRole[];
};

const PUBLIC_LINKS: NavLink[] = [
  { href: "/",        label: "Home",        icon: <Home className="h-4 w-4" /> },
  { href: "/courses", label: "Courses",     icon: <BookOpen className="h-4 w-4" /> },
  { href: "/about",   label: "About Us",    icon: <Info className="h-4 w-4" /> },
  { href: "/help",    label: "Help Center", icon: <HelpCircle className="h-4 w-4" /> },
];

const AUTH_LINKS: NavLink[] = [
  { href: "/dashboard",  label: "My Learning", icon: <LayoutDashboard className="h-4 w-4" />, roles: [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN] },
  { href: "/instructor", label: "Instructor",  icon: <GraduationCap className="h-4 w-4" />,   roles: [UserRole.INSTRUCTOR, UserRole.ADMIN] },
  { href: "/admin",      label: "Admin",       icon: <Shield className="h-4 w-4" />,           roles: [UserRole.ADMIN] },
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  ADMIN:      { label: "Admin",      cls: "bg-purple-100 text-purple-700" },
  INSTRUCTOR: { label: "Instructor", cls: "bg-violet-100 text-violet-700" },
  STUDENT:    { label: "Student",    cls: "bg-emerald-100 text-emerald-700" },
};

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const loading = status === "loading";
  const user = session?.user;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handle(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, []);

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [searchOpen]);

  const authLinks = AUTH_LINKS.filter((l) => {
    if (!l.roles || !user) return false;
    return l.roles.includes(user.role);
  });

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const roleBadge = user ? (ROLE_BADGE[user.role] ?? ROLE_BADGE.STUDENT) : null;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 shadow-sm">
        <div className="w-full px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2">

            {/* Logo */}
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src={MainImage}
                alt="LearnHub"
                width={130}
                height={40}
                className="object-contain h-8 sm:h-9 w-auto"
                priority
              />
            </Link>

            {/* 
              Center nav — ONLY visible at xl+ (1280px). 
              Below that, everything goes into the hamburger menu.
              This avoids the cramped "squeezed" state at tablet/medium widths.
            */}
            <ul className="hidden xl:flex items-center gap-0.5 flex-1 justify-center min-w-0">
              {PUBLIC_LINKS.map((link) => (
                <li key={link.href} className="flex-shrink-0">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                      isActive(link.href)
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}

              {authLinks.length > 0 && (
                <li aria-hidden className="mx-1 h-5 w-px bg-slate-200 flex-shrink-0" />
              )}

              {authLinks.map((link) => (
                <li key={link.href} className="flex-shrink-0">
                  <Link
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                      isActive(link.href)
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">

              {/* Search button — icon only below sm, icon+kbd above */}
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="flex items-center justify-center sm:gap-2 h-9 w-9 sm:w-auto sm:px-3 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition text-sm flex-shrink-0"
                aria-label="Search courses"
              >
                <Search className="h-4 w-4 flex-shrink-0" />
                <span className="hidden lg:inline text-xs text-slate-400">
                  <kbd className="font-sans">⌘K</kbd>
                </span>
              </button>

              {loading && <div className="h-9 w-9 rounded-full bg-slate-200 animate-pulse flex-shrink-0" />}

              {/* Logged in */}
              {!loading && user && (
                <div className="relative flex-shrink-0" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((p) => !p)}
                    className="flex items-center gap-1.5 sm:gap-2 pl-0.5 sm:pl-1 pr-1 sm:pr-2 py-1 rounded-xl hover:bg-slate-100 transition group"
                    aria-label="Profile menu"
                    aria-expanded={dropdownOpen}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-blue-100 group-hover:border-blue-300 transition">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || "User"}
                          width={32}
                          height={32}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-xs font-bold text-blue-700">
                          {getInitials(user.name)}
                        </span>
                      )}
                    </div>
                    {/* Name hidden until lg — saves space at tablet width */}
                    <span className="hidden lg:block text-sm font-medium text-slate-700 max-w-[90px] truncate">
                      {user.name?.split(" ")[0] || "Account"}
                    </span>
                    <ChevronDown
                      className={`hidden sm:block h-3.5 w-3.5 text-slate-400 transition-transform duration-200 flex-shrink-0 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown — width clamps on very small screens */}
                  {dropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-[88vw] max-w-[280px] sm:w-64 bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-200/60 overflow-hidden z-[100]">

                      <div className="px-4 py-3 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-violet-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || ""}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span className="text-sm font-bold text-violet-700">
                                {getInitials(user.name)}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">
                              {user.name || "User"}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user.email}</p>
                            {roleBadge && (
                              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${roleBadge.cls}`}>
                                {roleBadge.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nav links inside dropdown — shown below xl since main nav is hidden there */}
                      <div className="xl:hidden px-2 pt-2 pb-1 border-b border-slate-100 max-h-64 overflow-y-auto">
                        {[...PUBLIC_LINKS, ...authLinks].map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                              isActive(link.href)
                                ? "bg-violet-50 text-violet-700"
                                : "text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            {link.icon}
                            {link.label}
                          </Link>
                        ))}
                      </div>

                      <div className="p-2">
                        <Link
                          href="/dashboard/profile"
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          Profile Settings
                        </Link>
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          <Layers className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          My Courses
                        </Link>
                        <Link
                          href="/help"
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                        >
                          <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          Help Center
                        </Link>
                      </div>

                      <div className="p-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            signOut({ callbackUrl: "/" });
                          }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                        >
                          <LogOut className="h-4 w-4 flex-shrink-0" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Logged out — auth buttons, only at md+ to avoid crowding small screens */}
              {!loading && !user && (
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  <Link
                    href="/auth/login"
                    className="px-3 lg:px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition whitespace-nowrap"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/register"
                    className="px-3 lg:px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-xl shadow-sm shadow-blue-200 transition whitespace-nowrap"
                  >
                    Get Started
                  </Link>
                </div>
              )}

              {/* Hamburger — visible below xl now (since center nav only shows at xl+) */}
              <button
                className="xl:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition flex-shrink-0"
                onClick={() => setMobileOpen((p) => !p)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar dropdown */}
        <div
          className={`border-t border-slate-100 bg-white overflow-hidden transition-all duration-200 ease-in-out ${
            searchOpen ? "max-h-20 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <form onSubmit={handleSearch} className="px-3 sm:px-4 lg:px-8 py-3">
            <div className="flex items-center gap-2 sm:gap-3 max-w-xl mx-auto bg-slate-50 border border-slate-200 rounded-xl px-3 sm:px-4 py-2.5 focus-within:border-violet-300 focus-within:bg-white transition-all">
              <Search className="h-4 w-4 text-slate-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search courses…"
                className="flex-1 min-w-0 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 transition flex-shrink-0"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              <kbd className="hidden sm:block text-[10px] text-slate-400 font-sans border border-slate-200 rounded px-1.5 py-0.5 flex-shrink-0">
                ↵ Search
              </kbd>
            </div>
          </form>
        </div>

        {/* Mobile/tablet menu — now triggers below xl */}
        <div
          className={`xl:hidden border-t border-slate-100 bg-white overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-[80vh] opacity-100 overflow-y-auto" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-3 sm:px-4 py-3 space-y-1">

            {PUBLIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive(link.href)
                    ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            {authLinks.length > 0 && (
              <div className="pt-1 mt-1 border-t border-slate-100 space-y-1">
                {authLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${
                      isActive(link.href)
                        ? "bg-blue-700 text-white shadow-sm shadow-blue-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            {!loading && !user && (
              <div className="flex flex-col gap-2 pt-3 mt-1 border-t border-slate-100">
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
                >
                  Log in
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-sm shadow-blue-200 transition"
                >
                  Get Started
                </Link>
              </div>
            )}

            {!loading && user && (
              <div className="pt-3 mt-1 border-t border-slate-100">
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="h-16" aria-hidden="true" />
    </>
  );
}