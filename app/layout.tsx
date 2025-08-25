import "./globals.css";

export const metadata = {
  title: "DAO Decision Dashboard",
  description:
    "Paste a proposal → get TL;DR, pros/cons, risks and a recommendation.",
  viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg">
        <div className="container">
          <nav className="topbar" aria-label="Global">
            <div className="brand">
              <span className="dot" aria-hidden /> Decision
              <span className="accent">Desk</span>
            </div>
            <ThemeBoot />
          </nav>

          <header className="hero" role="banner">
            <div className="chip">
              <span className="pulse" /> AI • UX • Decision Support
            </div>
            <h1 className="headline">
              DAO Decision <span className="gradient">Dashboard</span>
            </h1>
            <p className="subhead">
              Paste a proposal and get a crisp TL;DR, pros & cons, risks and a
              recommendation.
            </p>
          </header>

          {children}

          <footer className="footer">
            Built with Next.js • AI runs server-side • Nothing is stored
          </footer>
        </div>

        {/* set dark by default; you can add a toggle later if you want */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
          (function(){document.documentElement.setAttribute('data-theme','dark');})();
        `,
          }}
        />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "845425ab8c5b472eaa0be37b1b0433b9"}'
        ></script>
      </body>
    </html>
  );
}

/** no-op clientless theme boot (kept to avoid interactive code in layout) */
function ThemeBoot() {
  return <div className="theme-placeholder" aria-hidden />;
}
