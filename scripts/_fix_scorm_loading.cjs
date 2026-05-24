// Patch ScormViewer: add loading overlay + timeout detection + error fallback
const fs = require("fs");

let src = fs.readFileSync("src/components/about/ScormViewer.tsx", "utf8");
const had = src.includes("\r\n");
if (had) src = src.replace(/\r\n/g, "\n");

// 1) Add ExternalLink to lucide imports
src = src.replace(
  `import { GraduationCap, X } from "lucide-react";`,
  `import { GraduationCap, X, ExternalLink, RefreshCw } from "lucide-react";`
);

// 2) Replace the single useState/useRef/iframeRef block to add iframeState
src = src.replace(
  `  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("not_started");
  const iframeRef = useRef<HTMLIFrameElement>(null);`,
  `  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("not_started");
  const [iframeState, setIframeState] = useState<"loading" | "loaded" | "timeout">("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);`
);

// 3) Reset iframeState whenever the modal opens, and set a 18-second timeout
const OLD_SCROLL_LOCK = `  // Lock body scroll while modal is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);`;

const NEW_SCROLL_LOCK = `  // Reset loading state + start timeout when modal opens.
  useEffect(() => {
    if (open) {
      setIframeState("loading");
      timeoutRef.current = setTimeout(() => setIframeState("timeout"), 18000);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [open]);

  // Lock body scroll while modal is open.
  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => { document.documentElement.style.overflow = ""; };
  }, [open]);`;

src = src.replace(OLD_SCROLL_LOCK, NEW_SCROLL_LOCK);

// 4) Add onLoad handler and loading/error overlay to the iframe section
const OLD_IFRAME = `            {/* SCORM iframe */}
            <iframe
              ref={iframeRef}
              src={resolvedUrl}
              title={title}
              className="flex-1 w-full border-none"
              allow="fullscreen"
              allowFullScreen
            />`;

const NEW_IFRAME = `            {/* Loading / timeout overlay */}
            {iframeState !== "loaded" && (
              <div className="absolute inset-0 top-[49px] flex flex-col items-center justify-center bg-[#0f0e0c] gap-5 z-10 px-6 text-center">
                {iframeState === "loading" && (
                  <>
                    <div className="w-10 h-10 rounded-full border-2 border-white/15 border-t-white/70 animate-spin" />
                    <p className="text-white/50 text-sm font-medium">Loading orientation content…</p>
                  </>
                )}
                {iframeState === "timeout" && (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-white/6 flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 text-white/50" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-base mb-1">Taking too long?</p>
                      <p className="text-white/45 text-sm max-w-xs">The content server may be slow. Try opening it directly in a new tab.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                      <button
                        onClick={() => { setIframeState("loading"); timeoutRef.current = setTimeout(() => setIframeState("timeout"), 25000); if (iframeRef.current) { iframeRef.current.src = ""; requestAnimationFrame(() => { if (iframeRef.current) iframeRef.current.src = resolvedUrl; }); } }}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/15 text-white text-sm font-bold transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Retry
                      </button>
                      <a
                        href={resolvedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-natural-accent text-white text-sm font-bold hover:opacity-85 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" /> Open in new tab
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* SCORM iframe */}
            <iframe
              ref={iframeRef}
              src={resolvedUrl}
              title={title}
              className="flex-1 w-full border-none"
              allow="fullscreen"
              allowFullScreen
              onLoad={() => {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setIframeState("loaded");
              }}
            />`;

src = src.replace(OLD_IFRAME, NEW_IFRAME);

// 5) Make the modal container position:relative so the overlay works
src = src.replace(
  `            className="fixed inset-0 z-[9999] flex flex-col bg-[#0f0e0c]"`,
  `            className="fixed inset-0 z-[9999] flex flex-col bg-[#0f0e0c] relative"`
);

if (had) src = src.replace(/\n/g, "\r\n");
fs.writeFileSync("src/components/about/ScormViewer.tsx", src, "utf8");
console.log("✓ ScormViewer: loading overlay + timeout + retry + open-in-new-tab");
