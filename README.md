# han-Lexicon

A personal **Korean–English dictionary** Progressive Web App. Add the Korean words you discover, organize them with chunks, collocations, idioms, and example sentences, then study them offline with flashcards, six exercise types, free recall, personal production, and a daily mini-text activity — all driven by an SM-2 spaced-repetition engine.

- **No account. No server. No cloud sync. No API keys. No environment variables.**
- **All data lives in your browser's IndexedDB.**
- **Installable on Android, iPhone, and desktop.**
- **Works fully offline after the first successful load.**

The entire interface is in English. The target language is Korean (Hangul), with optional IPA pronunciation and Korean (ko-KR) speech synthesis via the Web Speech API.

---

## Table of contents

1. [How to install and run the project locally](#1-how-to-install-and-run-the-project-locally)
2. [How to create a GitHub repository](#2-how-to-create-a-github-repository)
3. [How to upload the code using Git commands or the GitHub web interface](#3-how-to-upload-the-code-using-git-commands-or-the-github-web-interface)
4. [How to import the repository into Vercel](#4-how-to-import-the-repository-into-vercel)
5. [How to deploy the application](#5-how-to-deploy-the-application)
6. [How to open the application on Android and iPhone](#6-how-to-open-the-application-on-android-and-iphone)
7. [How to install it on the home screen](#7-how-to-install-it-on-the-home-screen)
8. [How to test offline functionality](#8-how-to-test-offline-functionality)
9. [How to export a JSON backup](#9-how-to-export-a-json-backup)
10. [How to restore a JSON backup](#10-how-to-restore-a-json-backup)
11. [How to export the dictionary as CSV](#11-how-to-export-the-dictionary-as-csv)

---

## Stack

- **Next.js 16** with the App Router
- **React 19** + **TypeScript 5**
- **Tailwind CSS 4** with **shadcn/ui** components
- **Zustand** for UI state and settings
- **Dexie.js** for IndexedDB
- **next-themes** for light/dark mode
- **recharts** for statistics charts
- **Web Speech API** for Korean text-to-speech
- PWA: `manifest.json` + `sw.js` + icons (192, 512, maskable)

The project uses no backend, no Prisma database, no API routes, no authentication, and no telemetry.

---

## File structure

```
han-lexicon/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (offline cache)
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   └── icon-maskable-512.png
├── scripts/
│   └── gen-icons.js            # Icon generator (regenerates the PNGs above)
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, PWA metadata, SW registration
│   │   ├── page.tsx            # Main app shell (single route, tab navigation)
│   │   └── globals.css         # Tailwind + theme tokens
│   ├── lib/
│   │   ├── types.ts            # All TypeScript domain types
│   │   ├── db.ts               # Dexie (IndexedDB) database
│   │   ├── store.ts            # Zustand store (settings + navigation)
│   │   ├── crud.ts             # CRUD operations + SRS review + daily stats
│   │   ├── search.ts           # Bidirectional fuzzy search (Levenshtein)
│   │   ├── sm2.ts              # SM-2 spaced-repetition algorithm
│   │   ├── stats.ts            # Dashboard + chart aggregators
│   │   ├── export.ts           # JSON backup, restore, CSV export
│   │   ├── tts.ts              # Korean speech synthesis (Web Speech API)
│   │   ├── demo-data.ts        # 7 demo entries (5 complete + 2 incomplete)
│   │   ├── utils-han.ts        # ID, dates, validation, status helpers
│   │   └── utils.ts            # shadcn cn() helper
│   ├── components/
│   │   ├── theme-provider.tsx
│   │   ├── common/
│   │   │   ├── BottomNav.tsx       # 5-tab nav + floating add button
│   │   │   ├── AudioButton.tsx     # Korean TTS button
│   │   │   ├── IpaKeyboard.tsx     # Popover IPA symbol keyboard
│   │   │   └── Primitives.tsx      # StatusBadge, PosBadge, EmptyState, IpaText
│   │   ├── dictionary/
│   │   │   ├── DictionaryView.tsx  # List + filters
│   │   │   ├── WordDetail.tsx      # Read-only word card
│   │   │   ├── WordForm.tsx        # Create/edit dialog with sub-element editors
│   │   │   └── FormFields.tsx
│   │   ├── search/
│   │   │   └── SearchView.tsx      # Bidirectional search + history
│   │   ├── study/
│   │   │   ├── StudyView.tsx       # Activity menu
│   │   │   ├── StudyShell.tsx      # Shared scaffolding + session config
│   │   │   ├── SrsDashboard.tsx
│   │   │   ├── FlashcardActivity.tsx
│   │   │   ├── FreeRecallActivity.tsx
│   │   │   ├── ExerciseActivity.tsx   # 6 exercise types
│   │   │   ├── PersonalProductionActivity.tsx
│   │   │   └── DailyMiniTextActivity.tsx
│   │   ├── statistics/
│   │   │   └── StatisticsView.tsx  # Dashboard + recharts
│   │   ├── settings/
│   │   │   └── SettingsView.tsx    # Theme, font, goals, IPA, reminders, backup
│   │   └── ui/                     # shadcn/ui components
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── tailwind.config.ts
├── eslint.config.mjs
└── README.md
```

---

## 1. How to install and run the project locally

You need **Node.js 18+** (Node 20 LTS recommended) and **npm**.

```bash
# 1. Clone or unzip the project
git clone <your-repo-url> han-lexicon
cd han-lexicon

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open <http://localhost:3000> in your browser. The app boots, seeds 7 demo entries into IndexedDB on first launch, and you can immediately browse, search, study, and view statistics.

To produce a production build:

```bash
npm run build
npm start
```

The dev server runs on port 3000. No environment variables are required.

> **Note on the demo data:** the seven demo entries are seeded exactly once, only when the database is empty. They can be edited and deleted like any other entry. To re-seed them at any time, open **Settings → Data management → Re-seed demo data**.

---

## 2. How to create a GitHub repository

1. Sign in to <https://github.com> (create a free account if you don't have one).
2. Click the **+** icon in the top-right corner, then **New repository**.
3. Fill in the form:
   - **Repository name:** `han-lexicon` (or any name you prefer)
   - **Description:** `A personal Korean–English dictionary PWA`
   - **Visibility:** Public or Private — your choice
   - **Initialize this repository with:** leave **unchecked** (do not add README/license/.gitignore from GitHub — the project already includes them)
4. Click **Create repository**. GitHub will show you the empty repository page with clone instructions. Keep this page open.

---

## 3. How to upload the code using Git commands or the GitHub web interface

### Option A — Git commands (recommended)

From inside the project folder:

```bash
# Initialize git if not already
git init
git branch -M main

# Stage every file
git add .

# Commit
git commit -m "Initial commit: han-Lexicon PWA"

# Add the remote (use the URL GitHub gave you in step 2)
git remote add origin https://github.com/<your-username>/han-lexicon.git

# Push
git push -u origin main
```

If you have SSH set up, replace the HTTPS URL with the SSH one (`git@github.com:<your-username>/han-lexicon.git`).

### Option B — GitHub web interface (no Git CLI)

1. On your empty GitHub repository page, click **uploading an existing file** (the link is in the "…or push an existing repository from the command line" section).
2. Drag and drop **the entire project folder contents** (not the folder itself — select all files and folders inside `han-lexicon/` and drop them).
3. Add a commit message like `Initial commit: han-Lexicon PWA`.
4. Click **Commit changes**.

> ⚠️ The web interface has a 100-file limit per upload. If you hit it, upload in batches, or use Git CLI.

---

## 4. How to import the repository into Vercel

1. Sign in to <https://vercel.com> with your GitHub account (create a free account if needed).
2. Click **Add New… → Project**.
3. Vercel will list your GitHub repositories. Find `han-lexicon` and click **Import**.
4. Vercel auto-detects Next.js and pre-fills the build settings:
   - **Framework Preset:** Next.js
   - **Build Command:** `next build` (already the default)
   - **Output Directory:** `.next` (already the default)
   - **Install Command:** `npm install` (already the default)
5. **No environment variables are needed.** Leave the section empty.

---

## 5. How to deploy the application

1. On the import page from step 4, simply click **Deploy**.
2. Vercel runs `npm install` then `npm run build`. The build typically takes 60–90 seconds.
3. When done, Vercel shows a "Congratulations!" page with a **Visit** link to your live URL: `https://han-lexicon-<random>.vercel.app`.
4. Every future `git push` to `main` triggers an automatic redeploy.

**Custom domain (optional):** from your project's **Settings → Domains**, add a custom domain and follow the DNS instructions Vercel provides.

---

## 6. How to open the application on Android and iPhone

### Android (Chrome)

1. Open the deployed URL in Chrome.
2. The app loads and seeds demo data on first launch.
3. You can use it immediately as a normal web page, or install it (see section 7).

### iPhone (Safari)

1. Open the deployed URL in Safari.
2. The app loads and seeds demo data on first launch.
3. You can use it immediately as a normal web page, or add it to your home screen (see section 7).

> Korean text-to-speech requires a Korean (ko-KR) voice installed on the device. On iOS, install a Korean voice in **Settings → Accessibility → Spoken Content → Voices → Korean**. On Android, voices are managed in **Settings → Languages → Text-to-speech**. If no Korean voice is available, the audio button shows an error toast — the rest of the app still works.

---

## 7. How to install it on the home screen

### Android (Chrome)

1. Open the deployed URL in Chrome.
2. A prompt may appear automatically: **"Add han-Lexicon to Home screen"**. Tap **Install**.
3. If no prompt appears, open Chrome's ⋮ menu → **Install app** / **Add to Home screen**.
4. Confirm. The app now appears in your app drawer and on the home screen with its own icon. Launching it opens in a standalone window (no browser chrome).

### iPhone (Safari)

1. Open the deployed URL in Safari.
2. Tap the **Share** icon (square with an up arrow) at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Edit the title if you want, then tap **Add**.
5. The han-Lexicon icon appears on your home screen. Tap it to launch in standalone mode.

### Desktop (Chrome / Edge)

1. Open the deployed URL.
2. Click the **⊕ Install** icon in the address bar, or open the browser menu → **Install han-Lexicon…**
3. The app installs as a desktop application.

---

## 8. How to test offline functionality

1. Open the deployed (or local) app at least once while online. The service worker installs and pre-caches the shell, manifest, and icons.
2. Confirm the service worker is registered: open browser DevTools → **Application** → **Service Workers**. You should see `sw.js` with status "activated and is running".
3. Disconnect from the internet:
   - **Desktop:** turn on DevTools → **Network** → **Offline** checkbox, then refresh.
   - **Android:** enable airplane mode, then re-open the installed app.
   - **iPhone:** enable airplane mode, then re-open the home-screen app.
4. The app should load with no connection. All of these still work offline:
   - Browsing the dictionary
   - Searching
   - All study activities
   - Statistics
   - Adding, editing, deleting entries
   - Korean speech synthesis (if a Korean voice is installed on the device)
5. The only things that need a connection are first-time install, deployment, and GitHub sync — all of which happen on your dev machine, not in the app.

---

## 9. How to export a JSON backup

1. Open the app and go to **Settings → Backup & restore**.
2. Tap **Export JSON backup**.
3. The browser downloads a file named `han-lexicon-backup-YYYY-MM-DD.json`.
4. The backup contains:
   - All word entries (with chunks, collocations, idioms, examples, IPA, notes, tags)
   - Review logs (SRS history)
   - Daily statistics
   - Search history
   - All your settings

Save this file somewhere safe. It is the **only** copy of your data — han-Lexicon never syncs to the cloud.

---

## 10. How to restore a JSON backup

1. Open the app and go to **Settings → Backup & restore**.
2. Tap **Restore from JSON** and pick your `han-lexicon-backup-*.json` file.
3. A yellow confirmation panel appears showing exactly how many words, review logs, daily stats, and search history entries will be restored.
4. **Read the warning carefully:** restoring **wipes your current data** and replaces it with the file's contents.
5. Tap **Confirm restore** to proceed, or **Cancel** to abort.
6. After restore, the app re-renders with the imported data.

If the file is invalid (wrong format, missing fields, not JSON), the restore is aborted before any data is wiped and an error toast lists the problem.

---

## 11. How to export the dictionary as CSV

1. Open the app and go to **Settings → Backup & restore**.
2. Tap **Export CSV**.
3. The browser downloads `han-lexicon-dictionary-YYYY-MM-DD.csv` (UTF-8 with BOM, so Excel and Numbers open it with Korean characters intact).
4. The CSV contains one row per word entry, with columns:
   - `id, korean, english, romanization, ipa, partOfSpeech, usageContext, notes, tags, status, createdAt, updatedAt, chunks, collocations, idioms, examples`
5. Sub-elements (chunks, collocations, idioms, examples) are joined with ` | ` inside their respective columns. Use this format for spreadsheet analysis or to share with another tool.

---

## Feature summary

| Section | What it does |
| --- | --- |
| **Dictionary** | Create, edit, delete word entries with chunks (min 2), collocations (min 2), idioms (min 1), and example sentences. Validation shows exactly what is missing. |
| **Search** | Bidirectional Korean↔English fuzzy search across every word, translation, chunk, collocation, idiom, example, usage context, note, tag, and IPA. Tolerant to typos, casing, partial words, word order, extra spaces, and punctuation. |
| **Study** | Flashcards (both directions, words or sub-elements), free recall, fill-in-the-blanks, complete-the-collocation, unscramble chunks, idiom quiz, word matching, listening & dictation, personal production, daily mini text, plus an SRS dashboard with due/upcoming/learning/mastered/missed buckets. |
| **Statistics** | KPIs (total, complete, incomplete, learning, mastered, without IPA, accuracy, study time, current & longest streak), daily goals progress, word of the day, and four charts: vocabulary growth, daily activity, accuracy over time, mastered growth. |
| **Settings** | Theme (light/dark/system), font size, daily goals (new words / reviews), hide IPA during exercises, Korean native voice preference, speech rate, daily reminder (local notifications only), JSON backup & restore, CSV export, re-seed demo data, clear all data. |

---

## Privacy

han-Lexicon stores 100% of its data in your browser's IndexedDB on the device you are using. **Nothing ever leaves your device.** There is no analytics, no telemetry, no error reporting, no third-party scripts. Backups are files you create and save yourself.

Clearing your browser's storage (or "Clear site data" in DevTools) will erase all han-Lexicon data — export a backup first if you want to keep it.

---

## License

You may use, modify, and distribute this project freely for personal or educational use.
