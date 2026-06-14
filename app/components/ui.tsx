/**
 * Shared UI primitives for Scorenow.
 * Scorenow design: cricket green #166534, amber #f59e0b, mobile-first.
 */
import React from "react";

// ── Role badge ───────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<string, string> = {
  "Batsman": "bg-blue-100 text-blue-800",
  "Bowler": "bg-amber-100 text-amber-800",
  "All-Rounder": "bg-green-100 text-green-800",
  "Wicketkeeper": "bg-purple-100 text-purple-800",
};

const ROLE_SHORT: Record<string, string> = {
  "Batsman": "BAT",
  "Bowler": "BOWL",
  "All-Rounder": "AR",
  "Wicketkeeper": "WK",
};

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-bold tracking-widest uppercase ${ROLE_COLORS[role] ?? "bg-gray-100 text-gray-600"}`}>
      {ROLE_SHORT[role] ?? role}
    </span>
  );
}

// ── Team color dot ────────────────────────────────────────────────────────────
export function TeamColorDot({ color, size = 12 }: { color: string; size?: number }) {
  return (
    <span
      style={{ backgroundColor: color, width: size, height: size }}
      className="inline-block rounded-full flex-shrink-0 border border-white/30 shadow-sm"
    />
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#f8fafc] border border-[#e2e8f0] rounded-[14px] shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Section label ─────────────────────────────────────────────────────────────
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[0.7rem] font-bold uppercase tracking-widest text-[#64748b] mb-2">
      {children}
    </p>
  );
}

// ── Primary button ────────────────────────────────────────────────────────────
export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] px-5 py-3 rounded-xl font-bold text-sm bg-[#166534] text-white active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ── Secondary button ──────────────────────────────────────────────────────────
export function SecondaryButton({
  children,
  onClick,
  disabled = false,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit" | "reset";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] px-5 py-3 rounded-xl font-semibold text-sm border-2 border-[#166534] text-[#166534] bg-white active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ── Danger button ─────────────────────────────────────────────────────────────
export function DangerButton({
  children,
  onClick,
  disabled = false,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[44px] px-4 py-2 rounded-xl font-semibold text-sm text-[#ef4444] border border-[#ef4444] bg-white active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  className = "",
}: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{label}{required && <span className="text-[#ef4444] ml-0.5">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 px-3 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#166534] placeholder:text-[#94a3b8]"
      />
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 px-3 rounded-xl border border-[#e2e8f0] bg-white text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#166534]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── Modal backdrop ────────────────────────────────────────────────────────────
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {title && (
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#e2e8f0]">
            <h2 className="font-bold text-[#0f172a] text-lg">{title}</h2>
            <button onClick={onClose} className="text-[#64748b] text-xl font-light hover:text-[#0f172a] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9]">&times;</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Top nav bar ────────────────────────────────────────────────────────────────
export function TopBar({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 bg-[#166534] text-white px-4 py-3 flex items-center gap-3 shadow-md">
      {onBack && (
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 active:bg-white/20"
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
      )}
      <h1 className="flex-1 font-bold text-lg tracking-tight truncate">{title}</h1>
      {right}
    </header>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, subtitle }: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      {icon && <div className="text-4xl text-[#94a3b8]">{icon}</div>}
      <p className="font-bold text-[#64748b] text-base">{title}</p>
      {subtitle && <p className="text-sm text-[#94a3b8]">{subtitle}</p>}
    </div>
  );
}

// ── Loading spinner ────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-[#166534]/20 border-t-[#166534] rounded-full animate-spin" />
    </div>
  );
}

// ── Score display ──────────────────────────────────────────────────────────────
export function ScoreDisplay({
  runs,
  wickets,
  overs,
  balls,
  totalOvers,
}: {
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  totalOvers: number;
}) {
  return (
    <div className="text-center">
      <div className="text-5xl font-black text-[#166534] leading-none">
        {runs}/{wickets}
      </div>
      <div className="text-sm text-[#64748b] mt-1 font-medium">
        {overs}.{balls} / {totalOvers} ov
      </div>
    </div>
  );
}

// ── Ball dot ──────────────────────────────────────────────────────────────────
const ballDotColor = (event: { runs: number; extraType: string | null; dismissal: unknown | null; isLegalDelivery: boolean }) => {
  if (event.dismissal) return "bg-[#ef4444] text-white font-bold";
  if (!event.isLegalDelivery) return "bg-amber-100 text-amber-800 border border-amber-300 text-xs";
  if (event.runs === 4) return "bg-blue-500 text-white font-bold";
  if (event.runs === 6) return "bg-[#166534] text-white font-bold";
  if (event.runs === 0) return "bg-[#e2e8f0] text-[#64748b]";
  return "bg-white border border-[#e2e8f0] text-[#0f172a]";
};

const ballDotLabel = (event: { runs: number; extraType: string | null; dismissal: unknown | null; isLegalDelivery: boolean }) => {
  if (event.dismissal) return "W";
  if (event.extraType === "wide") return `W${event.runs > 1 ? event.runs : ""}`;
  if (event.extraType === "no-ball") return `NB`;
  if (event.extraType === "bye") return `B${event.runs || ""}`;
  if (event.extraType === "leg-bye") return `LB${event.runs || ""}`;
  return String(event.runs);
};

export function BallDot({ event }: { event: { runs: number; extraType: string | null; dismissal: unknown | null; isLegalDelivery: boolean } }) {
  return (
    <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm ${ballDotColor(event)}`}>
      {ballDotLabel(event)}
    </span>
  );
}
