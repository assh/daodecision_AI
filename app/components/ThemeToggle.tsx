"use client";

export default function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button className="theme-btn" aria-label="Toggle theme" onClick={toggle}>
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="currentColor"
          d="M12 3a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0V4a1 1 0 0 1 1-1Zm7 9a7 7 0 1 1-7-7 7 7 0 0 1 7 7ZM4 13a1 1 0 1 1 0-2H2a1 1 0 1 1 0-2h2a1 1 0 1 1 0 2H2a1 1 0 1 1 0 2h2Zm18 0a1 1 0 1 1 0-2h-2a1 1 0 1 1 0 2h2ZM12 19a1 1 0 0 1 1 1v2a1 1 0 1 1-2 0v-2a1 1 0 0 1 1-1Zm-7.78-2.22a1 1 0 0 1 1.42 0l1.41 1.41a1 1 0 1 1-1.41 1.42L4.22 18.2a1 1 0 0 1 0-1.42ZM18.36 5.64a1 1 0 1 1 1.41-1.41l1.42 1.41a1 1 0 1 1-1.42 1.42l-1.41-1.42Zm0 12.72 1.41 1.41a1 1 0 0 1-1.41 1.42l-1.42-1.42a1 1 0 1 1 1.42-1.41ZM5.64 5.64 4.22 4.22A1 1 0 1 1 5.64 2.8l1.41 1.42A1 1 0 0 1 5.64 5.64Z"
        />
      </svg>
      <span className="theme-label">Theme</span>
    </button>
  );
}
