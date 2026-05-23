"use strict";
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "src", "components", "HomeContent.tsx");
const rawBuf = fs.readFileSync(file);

// Strip BOM if present, normalize CRLF->LF
let src = rawBuf.toString("utf8");
const hasBOM = src.startsWith("\uFEFF");
if (hasBOM) src = src.slice(1);
src = src.replace(/\r\n/g, "\n");

// ── Patch 1: scrollTo ──
const p1_old = [
  "function scrollTo(id: string) {",
  "  const el = document.getElementById(id);",
  "  const lenis = (window as any).__lenis;",
  "  if (lenis && el) {",
  "    lenis.scrollTo(el, {",
  "      duration: 1.0,",
  "      easing: (t: number) => 1 - Math.pow(1 - t, 3),",
  "    });",
  "    return;",
  "  }",
  "  el?.scrollIntoView({ behavior: \"smooth\", block: \"start\" });",
  "}"
].join("\n");

const p1_new = [
  "function scrollTo(id: string) {",
  "  const el = document.getElementById(id);",
  "  if (!el) return;",
  "  const lenis = (window as any).__lenis;",
  "  if (lenis) {",
  "    const top = Math.round(el.getBoundingClientRect().top + window.scrollY);",
  "    lenis.scrollTo(top, { duration: 1.0, easing: (t: number) => 1 - Math.pow(1 - t, 3) });",
  "    return;",
  "  }",
  "  el.scrollIntoView({ behavior: \"smooth\", block: \"start\" });",
  "}"
].join("\n");

if (!src.includes(p1_old)) { console.error("PATCH 1 FAILED: scrollTo_old not found"); process.exit(1); }
src = src.replace(p1_old, p1_new);
console.log("Patch 1 OK");

// ── Patch 2: handleNavTo ──
const p2_old = [
  "  const handleNavTo = useCallback((target: string) => {",
  "    if (target.startsWith(\"/\")) { router.push(target); return; }",
  "    if (target === \"third-circle\") { router.push(\"/third-circle\"); return; }",
  "    const el = typeof document !== \"undefined\" && document.getElementById(target);",
  "    if (el) { scrollTo(target); } else { router.push(\"/#\" + target); }",
  "  }, [router]);"
].join("\n");

const p2_new = [
  "  const handleNavTo = useCallback((target: string) => {",
  "    if (target.startsWith(\"/\")) { router.push(target); return; }",
  "    if (target === \"third-circle\") { router.push(\"/third-circle\"); return; }",
  "    const el = typeof document !== \"undefined\" && document.getElementById(target);",
  "    if (el) { scrollTo(target); return; }",
  "    if (target.startsWith(\"chapter-\")) {",
  "      const chapterEls = typeof document !== \"undefined\" && document.querySelectorAll(\"[data-snap-chapter]\");",
  "      if (chapterEls && chapterEls.length > 0) {",
  "        const first = chapterEls[0] as HTMLElement;",
  "        const lenis = (window as any).__lenis;",
  "        if (lenis) { const top = Math.round(first.getBoundingClientRect().top + window.scrollY); lenis.scrollTo(top, { duration: 1.0, easing: (t: number) => 1 - Math.pow(1 - t, 3) }); }",
  "        else first.scrollIntoView({ behavior: \"smooth\", block: \"start\" });",
  "        return;",
  "      }",
  "    }",
  "    if (typeof window !== \"undefined\") window.location.hash = target;",
  "  }, [router]);",
  "",
  "  // Hash-on-load: when page loads with #chapter-* hash, poll until element is ready",
  "  useEffect(() => {",
  "    if (typeof window === \"undefined\") return;",
  "    const hash = window.location.hash.slice(1);",
  "    if (!hash.startsWith(\"chapter-\")) return;",
  "    let attempts = 0;",
  "    let pollTimer: ReturnType<typeof setTimeout>;",
  "    const poll = () => {",
  "      attempts++;",
  "      const el = document.getElementById(hash) ?? document.querySelector<HTMLElement>(\"[data-snap-chapter]\");",
  "      if (el) {",
  "        const lenis = (window as any).__lenis;",
  "        const top = Math.round(el.getBoundingClientRect().top + window.scrollY);",
  "        if (lenis) lenis.scrollTo(top, { duration: 1.2, easing: (t: number) => 1 - Math.pow(1 - t, 3) });",
  "        else window.scrollTo({ top, behavior: \"smooth\" });",
  "        return;",
  "      }",
  "      if (attempts < 25) pollTimer = setTimeout(poll, 120);",
  "    };",
  "    const t = setTimeout(poll, 300);",
  "    return () => { clearTimeout(t); clearTimeout(pollTimer); };",
  "  }, []);"
].join("\n");

if (!src.includes(p2_old)) { console.error("PATCH 2 FAILED: handleNavTo_old not found"); process.exit(1); }
src = src.replace(p2_old, p2_new);
console.log("Patch 2 OK");

// Re-add BOM and write with LF (no CRLF - git autocrlf will handle on commit)
if (hasBOM) src = "\uFEFF" + src;
fs.writeFileSync(file, src, "utf8");
const size = fs.statSync(file).size;
console.log("Written:", size, "bytes");

// Validate no replacement chars
if (fs.readFileSync(file, "utf8").includes("\uFFFD")) {
  console.error("WARNING: U+FFFD replacement char found!");
  process.exit(1);
}
console.log("UTF-8 validation OK");