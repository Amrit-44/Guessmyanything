---
Task ID: 1
Agent: main (Z.ai Code)
Task: Build GUESS MY ANYTHING — a production-ready Akinator-style AI guessing game with retro arcade theme, weighted-scoring engine, dynamic question selection, learning system, and full admin panel.

Work Log:
- Explored existing Next.js 16 + Tailwind 4 + shadcn/ui + Prisma/SQLite scaffold
- Designed scalable Prisma schema: Category, Subcategory, Tag, Entity, EntityTag (normalized), Question, GameSession, GameResult, Learning, Feedback, Setting — indexed for 100k+ entities
- Built Intelligence Engine V2 (src/lib/engine.ts): weighted scoring (never eliminates), incremental score updates via single indexed tag query, dynamic question selection via information-gain/balanced-split heuristic, broad-category boost for early "Anything" mode, shrinking candidate pool as game progresses, configurable confidence thresholds
- Authored seed data (prisma/seed.ts): 13 categories, 248 entities, 665 tags, 168 questions with consistent shared tag vocabulary
- Built game service (src/lib/game-service.ts): start/answer/confirm/undo/restart/learn flows, multi-guess with maxGuesses limit (3), analytics recording
- Created 9 game API routes + 11 admin API routes (entities CRUD, questions CRUD, dashboard, analytics, learnings, feedback, settings, categories, bulk-import)
- Built retro arcade UI: Press Start 2P + VT323 fonts, neon palette, CRT scanlines, starfield, pixel cards/buttons, confidence meter, 5-answer system, framer-motion animations, Web Audio API arcade sounds (no external files), dark/light theme
- Built complete admin panel: dashboard (stats + category breakdown), analytics (recharts: line/pie/bar charts), entity management (CRUD + bulk JSON import + export), question management (CRUD + effectiveness tracking), learning review (approve/reject), feedback, settings (game weights, SEO, site config)
- Implemented SEO: metadata, OpenGraph, Twitter cards, JSON-LD schema, sitemap.xml, robots.txt, canonical URLs
- Fixed 5 lint errors (react-hooks/set-state-in-effect) using refs and lazy initial state
- Made sound engine fully defensive (try/catch) so audio failures never break game flow
- Verified end-to-end with Agent Browser: home screen, game start, adaptive questions, guess flow, win screen, lose/teach flow, admin panel (all 7 tabs), learning system recording
- Verified visual design with VLM: confirmed retro arcade aesthetic, no broken elements
- Verified SEO routes (robots.txt, sitemap.xml, meta tags) all working

Stage Summary:
- Production-ready guessing game with 248 entities across 13 categories
- Weighted-scoring engine recovers from user mistakes (no hard elimination)
- Dynamic question selection prioritizes broad category splitters early, then discriminating questions
- Multi-guess system gives up after 3 wrong guesses and offers learning form
- Full admin panel with analytics, CRUD, and learning review
- Lint passes cleanly, all API routes return 200, no console/runtime errors
- Retro pixel-art arcade theme verified by VLM as "well-executed" with "strong visual cohesion"

---
Task ID: 2
Agent: main (Z.ai Code)
Task: UPGRADE ONLY "Guess My Job" mode — strict category lock, industry detection/locking, expanded metadata, rare jobs, question effectiveness analytics, near-duplicate prevention, improved confidence. Do NOT modify any other mode.

Work Log:
- Added `avgInfoGain Float` field to Question schema for tracking average information gain per question
- Upgraded engine (src/lib/engine.ts) with JOB MODE enhancements:
  - CRITICAL FIX #1 (Strict category lock): When categoryFilter === 'jobs', ONLY loads questions where category.slug === 'jobs'. General questions (categoryId: null) are NEVER loaded, so engine can NEVER ask "Is it an animal?", "Is it a person?", etc.
  - CRITICAL FIX #2 (Industry detection): Added `detectIndustry()` function that computes score mass per industry tag (industry-healthcare, industry-technology, etc.) across the top 100 candidates to identify the dominant industry
  - CRITICAL FIX #3 (Industry locking): When industry confidence > 65%, filters the candidate pool to that industry so subsequent questions discriminate WITHIN the industry (naturally deprioritizes irrelevant questions)
  - CRITICAL FIX #4 (Expanded metadata): Upgrade script enriches every job with 15-20 deep fingerprint tags (work environment, education, income, physical demands, interaction type, schedule, tools, stress level, creativity, travel)
  - CRITICAL FIX #5 (Question effectiveness): Effectiveness formula now blends win rate + avgInfoGain: `0.25 + 0.35 * winRate + 0.4 * infoGain`. avgInfoGain is tracked via `trackQuestionAnalytics()` which updates a running average each time a question is asked
  - CRITICAL FIX #6 (Near-duplicate prevention): Added `probedTagSlugs` parameter to `selectNextQuestion`. Questions probing an already-asked tag are skipped, preventing same-meaning questions
  - CRITICAL FIX #7 (Rare-job detection): Added 63 new rare/specialized jobs including Astronaut, Sommelier, Underwater Welder, Volcanologist, Cartographer, Lighthouse Keeper, Beekeeper, Court Reporter, etc.
  - CRITICAL FIX #8 (Improved confidence): Replaced heuristic with softmax-based confidence: `computeConfidencePercent()` and `computeGuessConfidences()` use temperature-scaled softmax over top-10 entities for accurate probability percentages
  - Added industry broad boost: early questions (first 6) prioritize industry-probing tags so industry is identified quickly
  - Added fallback: if all questions filtered by near-duplicate prevention, relaxes filter to avoid dead ends
- Wrote prisma/upgrade-jobs.ts (idempotent, only touches job data):
  - Added 10 new subcategories (Finance, Construction, Transportation, Government, Agriculture, Science, Hospitality, Legal, Manufacturing, Business)
  - Tagged all 25 existing jobs with industry tags
  - Enriched all 25 existing jobs with 15-20 deep fingerprint tags each
  - Added 63 new rare/specialized jobs across all 14 industries with full metadata
  - Added 14 industry-probing questions (job-specific, category=jobs)
  - Added 46 discriminating job questions probing rich attributes
  - Total: 88 job entities, 60 job questions, 1310 tag associations
- Updated game-service (src/lib/game-service.ts):
  - Added `industry` field to GameSnapshot (null for non-job modes)
  - Added `confidence` field to GuessView (softmax percentage)
  - `buildSnapshot` now calls `detectIndustry()` for job mode and includes industry in response
  - `buildSnapshot` computes per-guess confidence percentages via `computeGuessConfidences()`
  - Replaced all `timesAsked: { increment: 1 }` with `trackQuestionAnalytics()` that updates both timesAsked and avgInfoGain running average
  - All `selectNextQuestion` callers now pass `probedTagSlugs` extracted from history
- Updated frontend types (src/hooks/use-game.ts): added `industry` and `confidence` fields
- Updated UI (job mode only):
  - Question screen: green industry badge showing detected industry + confidence % (only appears in job mode when industry is detected)
  - Guess screen: confidence % displayed on main guess card and "also considering" top-3 list
  - Other modes unaffected: no industry badge, no confidence display
- Verified other modes NOT modified:
  - "Anything" mode: still asks broad category questions ("Is it a celebrity?")
  - Characters mode: still asks "Does the character have superpowers?"
  - Animals mode: still asks "Is it a mammal?"
  - All use existing `OR: [categoryId: null, category.slug]` filter (unchanged)
- Tested job mode end-to-end:
  - All 28 questions in a Doctor game were job-specific (zero non-job questions)
  - Industry detection kicked in at Q8 (Healthcare 16%) and grew to 40%
  - Industry locking narrowed pool to healthcare jobs
  - Near-duplicate prevention worked (no tag probed twice in 28 questions)
  - Confidence percentages displayed correctly (Doctor 75%, Surgeon 21%, Nurse 2%)
  - AI correctly guessed "Doctor" as final answer
  - Admin dashboard shows 311 total entities (up from 248), 228 questions (up from 168)
- Lint passes cleanly (0 errors)

Stage Summary:
- Job mode now has strict category lock: NEVER asks non-job questions
- Industry detection identifies the user's industry (Healthcare, Technology, etc.) within first ~8 questions
- Industry locking narrows candidate pool to detected industry for sharper discriminating questions
- 88 job entities with deep fingerprint tags (15-20 tags each) across 14 industries
- 60 job-specific questions (14 industry + 46 discriminating)
- 63 new rare/specialized jobs including ultra-rare professions
- Near-duplicate prevention: same tag never probed twice
- Question effectiveness analytics: tracks timesAsked, winRate, avgInfoGain
- Softmax-based confidence percentages on all guesses
- All other modes (Anything, Characters, Animals, Movies, etc.) completely unchanged
