"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const COUNTRIES = [
  { code: "AF", name: "Afghanistan", dial: "+93", flag: "🇦🇫" },
  { code: "AL", name: "Albania", dial: "+355", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", dial: "+213", flag: "🇩🇿" },
  { code: "AR", name: "Argentina", dial: "+54", flag: "🇦🇷" },
  { code: "AU", name: "Australia", dial: "+61", flag: "🇦🇺" },
  { code: "AT", name: "Austria", dial: "+43", flag: "🇦🇹" },
  { code: "BD", name: "Bangladesh", dial: "+880", flag: "🇧🇩" },
  { code: "BE", name: "Belgium", dial: "+32", flag: "🇧🇪" },
  { code: "BR", name: "Brazil", dial: "+55", flag: "🇧🇷" },
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "CN", name: "China", dial: "+86", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", dial: "+57", flag: "🇨🇴" },
  { code: "HR", name: "Croatia", dial: "+385", flag: "🇭🇷" },
  { code: "CZ", name: "Czech Republic", dial: "+420", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", dial: "+45", flag: "🇩🇰" },
  { code: "EG", name: "Egypt", dial: "+20", flag: "🇪🇬" },
  { code: "FI", name: "Finland", dial: "+358", flag: "🇫🇮" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "DE", name: "Germany", dial: "+49", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "GR", name: "Greece", dial: "+30", flag: "🇬🇷" },
  { code: "HK", name: "Hong Kong", dial: "+852", flag: "🇭🇰" },
  { code: "HU", name: "Hungary", dial: "+36", flag: "🇭🇺" },
  { code: "IN", name: "India", dial: "+91", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", dial: "+62", flag: "🇮🇩" },
  { code: "IE", name: "Ireland", dial: "+353", flag: "🇮🇪" },
  { code: "IL", name: "Israel", dial: "+972", flag: "🇮🇱" },
  { code: "IT", name: "Italy", dial: "+39", flag: "🇮🇹" },
  { code: "JP", name: "Japan", dial: "+81", flag: "🇯🇵" },
  { code: "JO", name: "Jordan", dial: "+962", flag: "🇯🇴" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "KR", name: "South Korea", dial: "+82", flag: "🇰🇷" },
  { code: "KW", name: "Kuwait", dial: "+965", flag: "🇰🇼" },
  { code: "LB", name: "Lebanon", dial: "+961", flag: "🇱🇧" },
  { code: "LK", name: "Sri Lanka", dial: "+94", flag: "🇱🇰" },
  { code: "MY", name: "Malaysia", dial: "+60", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", dial: "+960", flag: "🇲🇻" },
  { code: "MX", name: "Mexico", dial: "+52", flag: "🇲🇽" },
  { code: "MA", name: "Morocco", dial: "+212", flag: "🇲🇦" },
  { code: "MM", name: "Myanmar", dial: "+95", flag: "🇲🇲" },
  { code: "NP", name: "Nepal", dial: "+977", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", dial: "+31", flag: "🇳🇱" },
  { code: "NZ", name: "New Zealand", dial: "+64", flag: "🇳🇿" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "NO", name: "Norway", dial: "+47", flag: "🇳🇴" },
  { code: "OM", name: "Oman", dial: "+968", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", dial: "+92", flag: "🇵🇰" },
  { code: "PH", name: "Philippines", dial: "+63", flag: "🇵🇭" },
  { code: "PL", name: "Poland", dial: "+48", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "QA", name: "Qatar", dial: "+974", flag: "🇶🇦" },
  { code: "RO", name: "Romania", dial: "+40", flag: "🇷🇴" },
  { code: "RU", name: "Russia", dial: "+7", flag: "🇷🇺" },
  { code: "SA", name: "Saudi Arabia", dial: "+966", flag: "🇸🇦" },
  { code: "SG", name: "Singapore", dial: "+65", flag: "🇸🇬" },
  { code: "ZA", name: "South Africa", dial: "+27", flag: "🇿🇦" },
  { code: "ES", name: "Spain", dial: "+34", flag: "🇪🇸" },
  { code: "SE", name: "Sweden", dial: "+46", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", dial: "+41", flag: "🇨🇭" },
  { code: "TW", name: "Taiwan", dial: "+886", flag: "🇹🇼" },
  { code: "TH", name: "Thailand", dial: "+66", flag: "🇹🇭" },
  { code: "TR", name: "Turkey", dial: "+90", flag: "🇹🇷" },
  { code: "UA", name: "Ukraine", dial: "+380", flag: "🇺🇦" },
  { code: "AE", name: "UAE", dial: "+971", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", dial: "+44", flag: "🇬🇧" },
  { code: "US", name: "United States", dial: "+1", flag: "🇺🇸" },
  { code: "VN", name: "Vietnam", dial: "+84", flag: "🇻🇳" },
];

interface PhoneInputProps {
  value: string;
  dialCode: string;
  onChange: (value: string, dialCode: string, countryCode: string) => void;
  error?: string;
  name?: string;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

export function PhoneInput({ value, dialCode, onChange, error, name = "mobilenumber" }: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState<DropdownPos>({ top: 0, left: 0, width: 300 });
  const [selected, setSelected] = useState(
    COUNTRIES.find((c) => c.dial === dialCode) ?? COUNTRIES.find((c) => c.code === "LK")!
  );

  const triggerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + window.scrollY + 6,
      left: rect.left + window.scrollX,
      width: 300,
    });
  }, []);

  const openDropdown = () => {
    updatePosition();
    setOpen(true);
  };

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 50);
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideTrigger && !insideDropdown) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const selectCountry = (country: typeof COUNTRIES[0]) => {
    setSelected(country);
    setOpen(false);
    setSearch("");
    onChange(value, country.dial, country.code);
  };

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
            zIndex: 99999,
            overflow: "hidden",
            animation: "dialDropIn 0.18s ease both",
          }}
          role="listbox"
        >
          <div style={{ padding: "10px 10px 8px", borderBottom: "1px solid #f1f5f9" }}>
            <input
              ref={searchRef}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1.5px solid #e2e8f0",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "'DM Sans', sans-serif",
                color: "#1e293b",
                outline: "none",
                background: "#f8fafc",
              }}
              placeholder="Search country or code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div
            style={{
              maxHeight: 220,
              overflowY: "auto",
              padding: 6,
              scrollbarWidth: "thin",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: 16, fontSize: 13, color: "#94a3b8" }}>
                No countries found
              </div>
            ) : (
              filtered.map((country) => (
                <div
                  key={country.code}
                  onClick={() => selectCountry(country)}
                  role="option"
                  aria-selected={selected.code === country.code}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: selected.code === country.code ? "#eff6ff" : "transparent",
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => {
                    if (selected.code !== country.code)
                      (e.currentTarget as HTMLDivElement).style.background = "#f0f4ff";
                  }}
                  onMouseLeave={(e) => {
                    if (selected.code !== country.code)
                      (e.currentTarget as HTMLDivElement).style.background = "transparent";
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{country.flag}</span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13.5,
                      color: selected.code === country.code ? "#1d4ed8" : "#1e293b",
                      fontWeight: selected.code === country.code ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {country.name}
                  </span>
                  <span
                    style={{
                      fontSize: 12.5,
                      color: selected.code === country.code ? "#1d4ed8" : "#1765d3",
                      fontWeight: 600,
                      flexShrink: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {country.dial}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <style>{`
        @keyframes dialDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .phone-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 14px; }
        .phone-field label {
          font-size: 12.5px;
          font-weight: 600;
          color: #374151;
          letter-spacing: 0.2px;
          font-family: 'Outfit', sans-serif;
        }
        .phone-input-row {
          display: flex;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
          background: #fff;
          position: relative;
        }
        .phone-input-row:focus-within {
          border-color: #1d4ed8;
          box-shadow: 0 0 0 3px rgba(29,78,216,0.1);
        }
        .phone-input-row.has-err {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.08);
        }
        .dial-trigger {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 12px;
          padding: 0px 10px 0 12px;
          background: #fff;
          border-right: 1.5px solid #e2e8f0;
          border-radius: 8px 0 0 8px;
          cursor: pointer;
          white-space: nowrap;
          flex-shrink: 0;
          transition: background 0.15s;
          min-width: 90px;
          user-select: none;
          height: 100%;
        }
        .dial-trigger:hover { background: #f1f5f9; }
        .dial-flag { font-size: 18px; line-height: 1; color: #1c4abd; margin-bottom: 3px; }
        .dial-code { font-size: 13.5px; font-weight: 600; color: #1e293b; font-family: 'DM Sans', sans-serif; }
        .dial-chevron { font-size: 10px; color: #94a3b8; transition: transform 0.2s; display: inline-block; }
        .dial-chevron.open { transform: rotate(180deg); }
        .phone-number-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 11px 14px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1e293b;
          background: transparent;
          min-width: 0;
        }
        .phone-number-input::placeholder { color: #94a3b8; }
        .phone-err { font-size: 11.5px; color: #ef4444; font-weight: 500; margin-top: 2px; }
      `}</style>

      <div className="phone-field">
        <label htmlFor={name}>Mobile Number</label>

        <div className={`phone-input-row${error ? " has-err" : ""}`}>
          <div
            ref={triggerRef}
            className="dial-trigger"
            onClick={() => (open ? setOpen(false) : openDropdown())}
            role="button"
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="dial-flag">{selected.flag}</span>
            <span className="dial-code">{selected.dial}</span>
            <span className={`dial-chevron${open ? " open" : ""}`}>▼</span>
          </div>

          <input
            id={name}
            name={name}
            type="tel"
            className="phone-number-input"
            placeholder="77 123 4567"
            value={value}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d\s\-]/g, "");
              onChange(raw, selected.dial, selected.code);
            }}
            autoComplete="tel-national"
          />
        </div>

        {error && <span className="phone-err">{error}</span>}
      </div>

      {dropdown}
    </>
  );
}