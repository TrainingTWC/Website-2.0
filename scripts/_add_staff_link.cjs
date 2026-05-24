const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

let s = fs.readFileSync(path.join(ROOT, 'src/components/SiteFooter.tsx'), 'utf8').replace(/\r\n/g, '\n');

// 1. Add Lock to lucide import
s = s.replace(
  'import { Info, Heart, Instagram, Mail, MapPin } from "lucide-react";',
  'import { Info, Heart, Instagram, Mail, MapPin, Lock } from "lucide-react";'
);

// 2. Add staff link before the "Made with" span
const OLD = `          <span className="flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 fill-red-400 text-red-400" /> in India
          </span>`;

const NEW = `          <a
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

if (!s.includes(OLD)) throw new Error('Anchor not found');
s = s.replace(OLD, NEW);

fs.writeFileSync(path.join(ROOT, 'src/components/SiteFooter.tsx'), s, 'utf8');
console.log('✓ SiteFooter.tsx updated');
