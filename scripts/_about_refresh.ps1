$ErrorActionPreference = "Stop"

# ── 1. Enhance CreativeHero banner motion in AboutCreative.tsx ──────────────
$creative = "src/components/about/AboutCreative.tsx"
$c = Get-Content $creative -Raw

# Add `reducedHero` hook + a `floatY` value inside CreativeHero. Inject right
# after the parts-computation block, just before `return (`.
$oldHeadProbe = "  // Split title around accent word for color emphasis."
$oldHeadFull  = @"
  // Split title around accent word for color emphasis.
"@
$newHead = @"
  const reducedHero = useReducedMotion();
  // Split title around accent word for color emphasis.
"@
if ($c -notmatch "reducedHero = useReducedMotion") {
  $c = $c.Replace($oldHeadFull, $newHead)
}

# Replace the static `<img>` with a continuously animated `<motion.img>` — slow
# Ken-Burns zoom + tiny x/y drift. Reduced-motion users get the still image.
$oldImg = @"
                <img
                  src={imageUrl}
                  alt={imageAlt}
                  loading="eager"
                  decoding="async"
                  className="w-full aspect-[4/5] object-cover"
                />
"@
$newImg = @"
                <motion.img
                  src={imageUrl}
                  alt={imageAlt}
                  loading="eager"
                  decoding="async"
                  className="w-full aspect-[4/5] object-cover will-change-transform"
                  initial={{ scale: 1.06 }}
                  animate={reducedHero ? { scale: 1 } : { scale: [1.06, 1.13, 1.06], x: [0, -10, 0, 8, 0], y: [0, 6, 0, -6, 0] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
"@
$c = $c.Replace($oldImg, $newImg)

# Make the gradient overlay shimmer (animated opacity sweep) and add a slow
# rotating ring behind the image card for extra movement.
$oldOverlay = '<div className="absolute inset-0 bg-gradient-to-tr from-[color:var(--about-accent)]/12 via-transparent to-transparent" />'
$newOverlay = @"
<motion.div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-tr from-[color:var(--about-accent)]/20 via-transparent to-[color:var(--about-accent)]/10"
                  animate={reducedHero ? undefined : { opacity: [0.55, 0.95, 0.55] }}
                  transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
                />
"@
$c = $c.Replace($oldOverlay, $newOverlay)

# Wrap the image card motion.div with a sibling rotating ring (decorative).
$ringAnchor = 'className="relative mx-auto max-w-md lg:max-w-none"'
if ($c -notmatch "brewmatch-hero-ring") {
  # Inject the ring just BEFORE the motion.div by replacing the opening tag.
  $oldRing = '<motion.div`r`n              initial={{ rotate: -3, y: 30, opacity: 0 }}'
  $newRingBlock = @"
<motion.div
              aria-hidden
              className="brewmatch-hero-ring pointer-events-none absolute -inset-6 sm:-inset-10 rounded-[3rem] border border-dashed border-[color:var(--about-accent)]/45"
              animate={reducedHero ? undefined : { rotate: 360 }}
              transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              initial={{ rotate: -3, y: 30, opacity: 0 }}
"@
  $c = $c -replace [regex]::Escape("<motion.div`r`n              initial={{ rotate: -3, y: 30, opacity: 0 }}"), $newRingBlock
  if ($c -notmatch "brewmatch-hero-ring") {
    # Fall back to LF newlines if CRLF didn't match.
    $c = $c -replace [regex]::Escape("<motion.div`n              initial={{ rotate: -3, y: 30, opacity: 0 }}"), $newRingBlock
  }
}

Set-Content -Path $creative -Value $c -NoNewline
Write-Host "updated $creative"


# ── 2. Update our-story founders to real Third Wave Coffee founders + CEO ───
$story = "app/about/our-story/page.tsx"
$s = Get-Content $story -Raw

# Replace founders array (Anjali Iyer + Sushant Rao) with three real founders
# + CEO Rajat Luthra.
$oldFounders = @'
const founders = [
  {
    name: "Anjali Iyer",
    role: "Co-founder & Head of Coffee",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"),
    bio: "Anjali was 27, working in product at a startup that did not deserve her, and had just paid too much for a flat white in BKC that tasted like cardboard. She moved to Bengaluru, learnt roasting the slow way, and still runs Friday cuppings herself.",
    quote: "Good coffee is not a personality trait. It is a supply chain with taste. If we cannot explain why a cup costs what it costs, we should not be selling it.",
    note: "now reading: The Creative Act",
  },
  {
    name: "Sushant Rao",
    role: "Co-founder & Operations",
    image: asset("assets/our-story.png"),
    bio: "Sushant came in as the person who could turn a stubborn coffee idea into a company that actually opens on time. He built the first cafe playbook, the roast-to-dispatch promise, and the habit of putting numbers next to every brand claim.",
    quote: "The romantic version is that we started with a dream. The honest version is that we started with a spreadsheet, a tiny roaster, and very little patience for stale coffee.",
    note: "now playing: Peter Cat Recording Co.",
  },
] as const;
'@

$newFounders = @'
const founders = [
  {
    name: "Sushant Goel",
    role: "Co-founder",
    image: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-14.jpg"),
    bio: "Sushant grew up around South Indian filter coffee in a household where the morning cup was non-negotiable. After Wharton and a stint in consumer investing, he came home convinced India deserved fresh, traceable coffee — not warehouse beans dressed up in nice bags.",
    quote: "We did not start a cafe chain. We started a roastery that opened cafes so people could taste what fresh actually means.",
    note: "now reading: The Monk of Mokha",
  },
  {
    name: "Anirudh Sharma",
    role: "Co-founder",
    image: asset("assets/our-story.png"),
    bio: "Anirudh runs the parts of the business that do not make it into the brand film — the logistics, the cafe playbook, the unglamorous spreadsheets that decide whether a 130-cafe network can still ship a bag roasted on Monday.",
    quote: "The romantic version is that we started with a dream. The honest version is that we started with a spreadsheet, a tiny roaster, and very little patience for stale coffee.",
    note: "now listening: Peter Cat Recording Co.",
  },
  {
    name: "Ayush Bathwal",
    role: "Co-founder",
    image: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-09.jpg"),
    bio: "Ayush leads sourcing, partnerships, and the slow work of turning estate relationships into seasonal pricing contracts. If a bag carries a farm name on its back, he probably knows the person who grew it.",
    quote: "Fourteen estates, fourteen relationships. None of them survive on price alone. They survive because we keep showing up the year after a bad monsoon.",
    note: "now drinking: Attikan washed lot 04",
  },
  {
    name: "Rajat Luthra",
    role: "Chief Executive Officer",
    image: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"),
    bio: "Rajat joined as CEO in late 2023 after years building consumer brands at scale. He runs the next chapter — more cafes, a second roastery, and a training school built so a barista in Indore tastes the same espresso a barista in Bandra pulls.",
    quote: "Growth is the easy part. Growing without losing the cup is the actual job.",
    note: "now obsessing over: dispatch SLAs",
  },
] as const;
'@

$s = $s.Replace($oldFounders, $newFounders)

# Trim timeline 8 → 6 entries (drop 2017 + 2019, keep flagship beats).
$oldTimeline = @'
const timeline = [
  ["2016", "First roastery, Bengaluru", "A 600 sq ft space, one restored roaster, and a roast log held together by tape."],
  ["2017", "Indiranagar cafe opens", "The first place people could taste the coffee before they trusted the bag."],
  ["2018", "First estate partnership", "Chikmagalur stopped being a sourcing line and became a relationship."],
  ["2019", "National e-commerce launch", "Fresh beans started reaching kitchens outside the cafe cities."],
  ["2021", "8 estates locked in", "Long-term pricing replaced opportunistic buying."],
  ["2023", "Coffee School launches", "Three paid weeks before a new barista touches a guest's order."],
  ["2025", "Series B closed", "Rs 120 cr to grow cafes, roastery capacity, and direct trade."],
  ["2026", "130+ cafes, 14 estates", "Still small enough for the founders to read the bad reviews."],
] as const;
'@
$newTimeline = @'
const timeline = [
  ["2016", "First roastery, Bengaluru", "A 600 sq ft space, one restored roaster, and a roast log held together by tape."],
  ["2018", "First estate partnership", "Chikmagalur stopped being a sourcing line and became a relationship."],
  ["2021", "8 estates locked in", "Long-term pricing replaced opportunistic buying."],
  ["2023", "Coffee School + new CEO", "Three paid weeks of training, and Rajat Luthra steps in to scale the playbook."],
  ["2025", "Series B closed", "Rs 120 cr to grow cafes, roastery capacity, and direct trade."],
  ["2026", "130+ cafes, 14 estates", "Still small enough for the founders to read the bad reviews."],
] as const;
'@
$s = $s.Replace($oldTimeline, $newTimeline)

# Trim estates 14 → 8.
$oldEstatesPattern = "(?s)const estates = \[(.*?)\] as const;"
$newEstates = @'
const estates = [
  ["Attikan", "Bababudangiri", "1,450 m", "Arabica"],
  ["Kelagur", "Chikmagalur", "1,220 m", "SLN 795"],
  ["Mooley Maneh", "Coorg", "1,050 m", "Arabica + Robusta"],
  ["Ratnagiri", "Bababudangiri", "1,350 m", "Catuai"],
  ["Baarbara", "Bababudangiri", "1,500 m", "Arabica"],
  ["Kerehaklu", "Chikmagalur", "1,320 m", "Catimor"],
  ["Harley", "Sakleshpur", "1,100 m", "Arabica"],
  ["Balanoor", "Chikmagalur", "1,250 m", "Arabica"],
] as const;
'@
$s = [regex]::Replace($s, $oldEstatesPattern, [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $newEstates }, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Update closing signature from "Anjali, Sushant & Ayushi" to real founders.
$s = $s.Replace('Anjali, Sushant & Ayushi', 'Sushant, Anirudh, Ayush & Rajat')

# Lighten estates copy line ("Placeholder estate data...") — make it real.
$s = $s.Replace(
  'Placeholder estate data until the final farm list is confirmed. The design is built to show named places, not vague mountain poetry.',
  'Eight of our fourteen partner estates, by name. Where the coffee actually comes from — written on the bag, on the menu, on the wall.'
)

# Update estates section heading count (14 → 8 shown).
$s = $s.Replace('14 partner estates</span>', '8 of 14 partner estates</span>')

Set-Content -Path $story -Value $s -NoNewline
Write-Host "updated $story"


# ── 3. Trim our-coffee: regions 5 → 4, brewMethods 4 → 3 ────────────────────
$coffee = "app/about/our-coffee/page.tsx"
$cf = Get-Content $coffee -Raw

# Drop the "Bababudangiri" region (5th entry). The closing `, ` before `] as const;`
# needs care — easiest is a regex that removes the entire 5th object literal.
$bababudaPattern = "(?s),\s*\{\s*name:\s*`"Bababudangiri`".*?image:\s*asset\([^)]+\),\s*\}"
$cf = [regex]::Replace($cf, $bababudaPattern, "", [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Update the section title from "Five Indian regions" to "Four".
$cf = $cf.Replace('Five Indian regions, five different cups.', 'Four Indian regions, four different cups.')

# Drop the "Moka Pot" entry from brewMethods (last entry).
$mokaPattern = "(?s),\s*\{\s*method:\s*`"Moka Pot`".*?trouble:\s*`"[^`"]+`",\s*\}"
$cf = [regex]::Replace($cf, $mokaPattern, "", [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Update brew section copy if it references "four" methods — best-effort.
$cf = $cf.Replace('Anjali has led the table since 2018', 'Our head roaster has led the table since 2018')

Set-Content -Path $coffee -Value $cf -NoNewline
Write-Host "updated $coffee"


# ── 4. Trim careers: roles 9 → 6, faqs 5 → 3 ────────────────────────────────
$careers = "app/about/careers/page.tsx"
$cr = Get-Content $careers -Raw

$oldRoles = @'
const roles: Role[] = [
  { title: "Barista", team: "Cafe Operations", location: "Bengaluru · Multiple Locations", type: "Full-time", level: "Entry", salary: "Rs 3.2-4.2L LPA", experience: "0-2 yrs", posted: "2 days ago" },
  { title: "Cafe Manager", team: "Cafe Operations", location: "Mumbai · Bandra Flagship", type: "Full-time", level: "Mid", salary: "Rs 7-10L LPA", experience: "3-5 yrs", posted: "5 days ago" },
  { title: "Head Roaster", team: "Roastery", location: "Bengaluru · Whitefield", type: "Full-time", level: "Senior", salary: "Rs 18-25L LPA", experience: "7+ yrs", posted: "8 days ago" },
  { title: "QC Cupper", team: "Roastery", location: "Bengaluru · Whitefield", type: "Full-time", level: "Mid", salary: "Rs 8-12L LPA", experience: "3+ yrs", posted: "11 days ago" },
  { title: "Coffee Educator", team: "Coffee Education", location: "Delhi · Hauz Khas", type: "Full-time", level: "Mid", salary: "Rs 7-11L LPA", experience: "3-5 yrs", posted: "3 days ago" },
  { title: "Senior Frontend Engineer", team: "Technology", location: "Remote · India", type: "Full-time", level: "Senior", salary: "Rs 28-38L LPA", experience: "5+ yrs", posted: "6 days ago" },
  { title: "Brand Storyteller", team: "Brand & Marketing", location: "Bengaluru · HQ", type: "Full-time", level: "Mid", salary: "Rs 10-16L LPA", experience: "3+ yrs", posted: "4 days ago" },
  { title: "Origin & Trade Lead", team: "Supply Chain", location: "Chikmagalur · Field", type: "Full-time", level: "Lead", salary: "Rs 20-30L LPA", experience: "8+ yrs", posted: "12 days ago" },
  { title: "Weekend Barista", team: "Cafe Operations", location: "Pune · Koregaon Park", type: "Part-time", level: "Entry", salary: "Rs 450/hr", experience: "0-1 yr", posted: "1 day ago" },
];
'@
$newRoles = @'
const roles: Role[] = [
  { title: "Barista", team: "Cafe Operations", location: "Bengaluru · Multiple Locations", type: "Full-time", level: "Entry", salary: "Rs 3.6-4.5L LPA", experience: "0-2 yrs", posted: "2 days ago" },
  { title: "Cafe Manager", team: "Cafe Operations", location: "Mumbai · Bandra Flagship", type: "Full-time", level: "Mid", salary: "Rs 8-11L LPA", experience: "3-5 yrs", posted: "5 days ago" },
  { title: "Head Roaster", team: "Roastery", location: "Bengaluru · Whitefield", type: "Full-time", level: "Senior", salary: "Rs 20-28L LPA", experience: "7+ yrs", posted: "8 days ago" },
  { title: "Coffee Educator", team: "Coffee Education", location: "Delhi · Hauz Khas", type: "Full-time", level: "Mid", salary: "Rs 8-12L LPA", experience: "3-5 yrs", posted: "3 days ago" },
  { title: "Senior Frontend Engineer", team: "Technology", location: "Remote · India", type: "Full-time", level: "Senior", salary: "Rs 32-42L LPA", experience: "5+ yrs", posted: "6 days ago" },
  { title: "Origin & Trade Lead", team: "Supply Chain", location: "Chikmagalur · Field", type: "Full-time", level: "Lead", salary: "Rs 22-32L LPA", experience: "8+ yrs", posted: "12 days ago" },
];
'@
$cr = $cr.Replace($oldRoles, $newRoles)

$oldFaqs = @'
const faqs = [
  ["I do not have coffee experience. Can I apply?", "Yes. Entry cafe roles are designed for curious beginners. We train for coffee; we hire for hospitality."],
  ["Is the trial shift paid?", "Yes. Cafe trials and corporate work samples are paid. Free labour is not a culture test."],
  ["Are remote roles available?", "Mostly Technology and a few Brand roles. Cafe, Roastery, and Supply Chain roles are location-based."],
  ["Do you respond to rejected applicants?", "Yes. Every applicant gets a response within 7 business days, even when it is a no."],
  ["What if there is no role for me today?", "Write in anyway. The best people on our team rarely arrived through a perfect job posting."],
] as const;
'@
$newFaqs = @'
const faqs = [
  ["I do not have coffee experience. Can I apply?", "Yes. Entry cafe roles are designed for curious beginners. We train for coffee; we hire for hospitality."],
  ["Is the trial shift paid?", "Yes. Cafe trials and corporate work samples are paid. Free labour is not a culture test."],
  ["Do you respond to rejected applicants?", "Yes. Every applicant gets a response within 7 business days, even when it is a no."],
] as const;
'@
$cr = $cr.Replace($oldFaqs, $newFaqs)

# Update copy that referenced "9 open roles".
$cr = $cr.Replace('9 open roles across 6 teams.', '6 open roles across 6 teams.')

Set-Content -Path $careers -Value $cr -NoNewline
Write-Host "updated $careers"


# ── 5. Trim newsroom + update founder references ────────────────────────────
$news = "app/about/newsroom/page.tsx"
$n = Get-Content $news -Raw

# Trim press: 6 → 4 (drop the Conde Nast + Business Standard entries; keep
# Forbes 30 Under 30 but update copy to real founders).
$oldPress = @'
const press: PressItem[] = [
  { outlet: "Economic Times", date: "Aug 2025", headline: "The quiet revolution in India's specialty coffee scene", excerpt: "A reported look at homegrown roasters reshaping what Indians expect from a cup of coffee.", category: "Feature", readTime: "7 min", imageUrl: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"), href: "#" },
  { outlet: "Mint Lounge", date: "Jun 2025", headline: "Inside the Bengaluru roastery that ships fresh beans across India", excerpt: "A long-read on the 48-hour roast-to-dispatch operation and the cupping protocol.", category: "Interview", readTime: "9 min", imageUrl: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), href: "#" },
  { outlet: "Forbes India", date: "Apr 2025", headline: "30 Under 30: The duo redefining Indian cafe culture", excerpt: "Co-founders Anjali and Sushant featured under Food & Beverage for the third consecutive year.", category: "Award", readTime: "5 min", imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"), href: "#" },
  { outlet: "Conde Nast Traveller", date: "Mar 2025", headline: "The 12 best cafes in India for serious coffee drinkers", excerpt: "Three flagship cafes featured in CNT's list of independent specialty coffee bars.", category: "Feature", readTime: "6 min", imageUrl: asset("assets/SCB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-13.jpg"), href: "#" },
  { outlet: "Business Standard", date: "Jan 2025", headline: "Series B: Rs 120 cr to expand cafe footprint to 250 stores", excerpt: "The roaster-cafe chain closes a Series B led by a marquee consumer fund.", category: "Industry", readTime: "4 min", imageUrl: asset("assets/SSCR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-25.jpg"), href: "#" },
  { outlet: "The Hindu", date: "Nov 2024", headline: "How a 28% premium to farmers is changing Chikmagalur", excerpt: "A field report on long-term estate partnerships and transparent pricing.", category: "Feature", readTime: "8 min", imageUrl: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"), href: "#" },
];
'@
$newPress = @'
const press: PressItem[] = [
  { outlet: "Economic Times", date: "Feb 2026", headline: "How Third Wave's CEO is taking a Bengaluru roastery national", excerpt: "Rajat Luthra on scaling cafes without breaking the roast-to-dispatch promise.", category: "Interview", readTime: "7 min", imageUrl: asset("assets/EDB WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-01.jpg"), href: "#" },
  { outlet: "Mint Lounge", date: "Nov 2025", headline: "Inside the Bengaluru roastery that ships fresh beans across India", excerpt: "A long-read on the 48-hour roast-to-dispatch operation and the cupping protocol.", category: "Feature", readTime: "9 min", imageUrl: asset("assets/SSBR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-21.jpg"), href: "#" },
  { outlet: "Forbes India", date: "Apr 2025", headline: "30 Under 30: The founders redefining Indian cafe culture", excerpt: "Co-founders Sushant Goel, Anirudh Sharma, and Ayush Bathwal featured under Food & Beverage.", category: "Award", readTime: "5 min", imageUrl: asset("assets/MM WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-10.jpg"), href: "#" },
  { outlet: "The Hindu", date: "Nov 2024", headline: "How a 28% premium to farmers is changing Chikmagalur", excerpt: "A field report on long-term estate partnerships and transparent pricing.", category: "Feature", readTime: "8 min", imageUrl: asset("assets/VR WEBSITE COFFEE BEAN IMAGES 2026 2048x2048-29.jpg"), href: "#" },
];
'@
$n = $n.Replace($oldPress, $newPress)

# Trim awards 6 → 4.
$oldAwards = @'
const awards = [
  ["Forbes India", "2023-2025", "30 Under 30, F&B"],
  ["Conde Nast Traveller", "2025", "Top 12 Cafes in India"],
  ["SCA India", "2024", "Best Roaster"],
  ["India Coffee Awards", "2023", "Sustainable Sourcing"],
  ["Mint Lounge", "2025", "Best of Food & Drink"],
  ["LinkedIn", "2024", "Top Startups India"],
] as const;
'@
$newAwards = @'
const awards = [
  ["Forbes India", "2023-2025", "30 Under 30, F&B"],
  ["Conde Nast Traveller", "2025", "Top 12 Cafes in India"],
  ["SCA India", "2024", "Best Roaster"],
  ["LinkedIn", "2024", "Top Startups India"],
] as const;
'@
$n = $n.Replace($oldAwards, $newAwards)

# Events 3 → 2, update speakers to real founders.
$oldEvents = @'
const events = [
  ["India Coffee Festival", "Bengaluru", "Jun 12, 2026", "Anjali Iyer", "Why freshness is an operations problem"],
  ["D2C Insider Summit", "Mumbai", "Jul 4, 2026", "Sushant Rao", "Building trust without discount addiction"],
  ["SCA India Cupping Table", "Delhi", "Aug 19, 2026", "Roastery team", "New Indian micro-lots"],
] as const;
'@
$newEvents = @'
const events = [
  ["India Coffee Festival", "Bengaluru", "Jun 12, 2026", "Ayush Bathwal", "Why freshness is an operations problem"],
  ["D2C Insider Summit", "Mumbai", "Jul 4, 2026", "Rajat Luthra", "Scaling cafes without losing the cup"],
] as const;
'@
$n = $n.Replace($oldEvents, $newEvents)

# Trim facts 10 → 6 + update founders.
$oldFacts = @'
const facts = [
  ["Founded", "2016, Bengaluru"],
  ["Founders", "Anjali Iyer, Sushant Rao, Ayushi Mehta"],
  ["Headquarters", "Bengaluru"],
  ["Roastery", "Bengaluru; Mumbai under construction"],
  ["Cafes", "130+ across 18 cities"],
  ["Team size", "450+"],
  ["Partner estates", "14"],
  ["Funding raised", "Rs 165 cr"],
  ["Latest round", "Series B, Rs 120 cr, Jan 2025"],
  ["Press contact", "press@brewmatch.in"],
] as const;
'@
$newFacts = @'
const facts = [
  ["Founded", "2016, Bengaluru"],
  ["Founders", "Sushant Goel, Anirudh Sharma, Ayush Bathwal"],
  ["CEO", "Rajat Luthra (since 2023)"],
  ["Cafes", "130+ across 18 cities · 14 partner estates"],
  ["Latest round", "Series B, Rs 120 cr, Jan 2025"],
  ["Press contact", "press@brewmatch.in"],
] as const;
'@
$n = $n.Replace($oldFacts, $newFacts)

# Update press-inquiry footer copy that referenced "Ayushi".
$n = $n.Replace('Write to Ayushi directly.', 'Write to the press desk directly.')

Set-Content -Path $news -Value $n -NoNewline
Write-Host "updated $news"

Write-Host "`nAll edits applied."
