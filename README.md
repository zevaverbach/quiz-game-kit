# Quiz Game Kit

A modular, dependency-free quiz game framework that makes it easy to create engaging trivia games on any topic.

## Features

- 🎯 **Zero Build Step**: Uses only CDN resources (fonts, animations, sql.js)
- 🗄️ **SQLite-based Questions**: Questions live in `.db` files, separate from the engine
- 🎨 **Pluggable Theming**: Easy CSS variable-based styling system
- 📦 **Modular Architecture**: Separate modules for styles and game logic
- 💾 **Progress Tracking**: LocalStorage-based user progress and statistics
- 🔥 **Streak System**: Keeps players engaged with achievement tracking
- 🎊 **Celebratory Effects**: Confetti animations for correct answers
- 📱 **Fully Responsive**: Works on desktop, tablet, and mobile devices
- 🧠 **Smart Question Selection**: Prioritizes unseen and incorrect questions
- 📊 **Detailed Statistics**: Track accuracy, progress, and lifetime stats
- 🗃️ **Offline Caching**: DB is cached in IndexedDB for 90 days

## Architecture

### Core Modules

1. **`index.html`** - HTML structure, `QUIZ_DB_URL`, and `QUIZ_THEME` configuration
2. **`styles.css`** - Core layout and styling with CSS variables

### Optional

- **`theme.css`** - Custom CSS theme overrides for your topic

### Shared (hosted on GitHub Pages)

- **`quiz-engine.js`** - Game mechanics, DB loading, and logic — loaded from [quiz-data](https://github.com/zevaverbach/quiz-data)
- **`.db` files** - SQLite databases containing your questions

Both the engine and question databases are hosted in a shared [quiz-data](https://github.com/zevaverbach/quiz-data) repo served via GitHub Pages. This means engine updates apply to all quizzes automatically, and questions are decoupled from the quiz app.

Questions are loaded at runtime via [sql.js](https://github.com/sql-js/sql.js/) (SQLite compiled to WASM).

## Quick Start

### 1. Copy the Files

Copy these files to your project:
```bash
cp quiz-game-kit/index.html your-quiz/
cp quiz-game-kit/styles.css your-quiz/
```

That's it — `quiz-engine.js` is loaded from a shared CDN URL, so you don't need a local copy.

### 2. Create Your Question Database

Create a SQLite `.db` file with this schema:

```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK(correct BETWEEN 0 AND 3),
    fun_fact TEXT,
    wiki_url TEXT
);
```

The `correct` field is a 0-based index: 0 = option_a, 1 = option_b, 2 = option_c, 3 = option_d.

You can create and populate `.db` files with any SQLite client (DB Browser for SQLite, the `sqlite3` CLI, or even an LLM). 50-200 questions is recommended for a good experience.

### 3. Host Your Database

Host the `.db` file anywhere that serves static files. GitHub Pages works well:

1. Create a repo (e.g. `quiz-data`)
2. Add your `.db` files
3. Enable GitHub Pages
4. Your DB is served at `https://yourusername.github.io/quiz-data/your-quiz.db`

### 4. Configure the URL and Theme

Edit the configuration block in `index.html`:
```html
<script>
    const QUIZ_DB_URL = "https://yourusername.github.io/quiz-data/your-quiz.db";
    const QUIZ_THEME = {
        storagePrefix: 'my_quiz',           // localStorage key prefix
        correctMessage: '✨ Correct!',       // shown on correct answer
        funFactLabel: '💡 Fun fact:',        // label before fun facts
        confettiColors: ['#d4af37', '#f4e4a6', '#996515', '#ffffff'],
        confettiStreakColors: ['#d4af37', '#f4e4a6', '#996515'],
        ranks: [
            { min: 100, label: '🏆 Perfect Round!' },
            { min: 90,  label: '⚡ Champion' },
            { min: 75,  label: '🦁 Hero' },
            { min: 60,  label: '⚔️ Warrior' },
            { min: 40,  label: '📚 Student' },
            { min: 0,   label: '🌱 Beginner' },
        ]
    };
</script>
```

All `QUIZ_THEME` properties are optional — any you omit will use sensible defaults. You can also skip `QUIZ_THEME` entirely if the defaults work for you.

### 5. Customize the Text

Edit `index.html` to change:
- Title and header text
- Login screen messaging
- Button labels

### 6. Style Your Quiz (Optional)

Create `theme.css` to customize colors:
```css
:root {
    --gold: #your-primary-color;
    --navy: #your-background-color;
    --marble: #your-text-color;
}
```

### 7. Open in Browser

No build process needed! Just open `index.html` in any modern browser, or deploy to GitHub Pages.

## Question Loading Flow

```
Page loads
  → sql.js WASM loads from CDN
  → Check IndexedDB for cached DB
  → If cached and < 90 days old → use cached copy
  → Otherwise → fetch .db from QUIZ_DB_URL, cache in IndexedDB
  → questions[] populated
  → "Start Quiz" button enabled
  → User logs in → game proceeds
```

The DB is cached in IndexedDB after the first fetch, so subsequent visits load instantly with no network request. After 90 days the cache is refreshed. If a refresh fails (e.g. offline), the stale cache is used as a fallback.

## Documentation

- **[Usage Guide](./docs/USAGE.md)** - Detailed instructions for creating your quiz
- **[API Reference](./docs/API.md)** - Function and data structure documentation

## How It Works

### Question Selection Algorithm

The quiz engine uses a smart algorithm to optimize learning:
1. **Unseen questions** - Prioritizes new content
2. **Incorrect questions** - Reviews challenging material
3. **Correct questions** - Reinforces mastery

Each game session presents 20 questions (configurable via `QUESTIONS_PER_GAME`).

### Progress Tracking

- Saves user progress in localStorage
- Tracks which questions have been seen
- Records correct and incorrect answers
- Maintains lifetime statistics
- Per-user data (multi-user support)

### Theme System

Styles use CSS custom properties (variables) for easy theming:
```css
:root {
    --gold: #d4af37;           /* Primary accent */
    --gold-light: #f4e4a6;     /* Light accent */
    --gold-dark: #996515;      /* Dark accent */
    --marble: #f5f5f0;         /* Text color */
    --navy: #1a1a2e;           /* Background */
    --purple: #4a1a6b;         /* Secondary */
    --lightning: #00d4ff;      /* Effects */
    --font-heading: 'Cinzel', serif;
    --font-body: 'Spectral', serif;
}
```

Simply override these variables in `theme.css` to completely reskin the quiz.

## Example Implementation

See the **[System Design Quiz](https://github.com/zevaverbach/system-design-quiz)** for a complete working example with:
- 200 questions on system design topics
- Custom tech-themed styling
- Questions hosted in the [quiz-data](https://github.com/zevaverbach/quiz-data) repo

## Creating Different Themed Quizzes

The same quiz-game-kit can power multiple themed quizzes. Each quiz just needs:
1. A `.db` file with topic-specific questions (hosted in your quiz-data repo)
2. `QUIZ_DB_URL` set in `index.html`
3. `QUIZ_THEME` with topic-appropriate messages, colors, and ranks (optional)
4. Custom `theme.css` with appropriate CSS colors/fonts (optional)
5. Updated text in `index.html`

## SQLite Schema Reference

```sql
CREATE TABLE questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK(correct BETWEEN 0 AND 3),
    fun_fact TEXT,
    wiki_url TEXT
);
```

| Column | Description |
|--------|-------------|
| `question` | The question text |
| `option_a` through `option_d` | The four answer choices |
| `correct` | 0-based index of the correct option (0=a, 1=b, 2=c, 3=d) |
| `fun_fact` | Interesting fact shown after answering |
| `wiki_url` | Optional Wikipedia link for further reading |

## Browser Support

Works on all modern browsers:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

Requires:
- JavaScript ES6+ support
- CSS Custom Properties
- LocalStorage API
- IndexedDB API
- WebAssembly (for sql.js)

## License

MIT
