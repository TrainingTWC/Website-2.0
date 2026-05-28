const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "../src/components/SiteFooter.tsx");
let raw = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

// 1. Remove the Lock import since we no longer use it
raw = raw.replace(/, Lock/g, "").replace(/Lock, /g, "");

// 2. Remove the unused useRouter import if present (we'll use plain anchor)
// (Keep the import if it's used elsewhere — check first)
const usesRouter = (raw.match(/router\./g) || []).length;
if (usesRouter === 0) {
  raw = raw.replace(/import \{ useRouter \} from "next\/navigation";\n/g, "");
}

// 3. Replace the bottom bar section: remove Staff link, make "Made with ❤️" the hidden trigger
const OLD = `          <a
            href="/admin"
            className="flex items-center gap-1 opacity-40 hover:opacity-70 transition-opacity"
            title="Staff login"
          >
            <Lock className="w-3 h-3" />
            <span>Staff</span>
          </a>
          <span className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 fill-red-400 text-red-400" /> in India
          </span>`;

const NEW = `          <a
            href="/admin"
            className="flex items-center gap-1.5"
            style={{ cursor: "default", textDecoration: "none", color: "inherit" }}
            tabIndex={-1}
            aria-hidden="true"
          >
            Made with <Heart className="w-3 h-3 fill-red-400 text-red-400" /> in India
          </a>`;

if (!raw.includes(OLD)) {
  console.error("ERROR: Could not find the Staff+Heart block to replace.");
  console.error("Looking for:\n" + OLD);
  process.exit(1);
}

raw = raw.replace(OLD, NEW);
fs.writeFileSync(file, raw, "utf8");
console.log("✅ SiteFooter.tsx patched — Staff link removed, 'Made with ❤️ in India' is now the hidden admin link");
