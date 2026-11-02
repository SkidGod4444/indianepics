"use client";

/** The last resort: the root layout itself failed, so this page brings its own html and plain styles. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, display: "grid", minHeight: "100svh", placeItems: "center", background: "#ebe1cd", color: "#27190f", fontFamily: "Georgia, serif" }}>
        <main style={{ padding: 24, textAlign: "center" }}>
          <h1 style={{ fontWeight: 400 }}>This page could not be opened.</h1>
          <button onClick={reset} style={{ font: "inherit", padding: "8px 16px" }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
