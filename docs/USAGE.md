# Quiz Game Kit - Usage Guide

This guide walks you through creating your own quiz game using the quiz-game-kit.

## Quick Start

### 1. Copy the Kit Files

Copy these files to your project directory:
- `index.html` - HTML structure and DB configuration
- `styles.css` - Core styling
- `quiz-engine.js` - Game logic and DB loading
- `theme.css` (optional) - Theme customization

### 2. Create Your Question Database

Questions are stored in a SQLite `.db` file with this schema:

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

You can create `.db` files with:
- **DB Browser for SQLite** (GUI) - [sqlitebrowser.org](https://sqlitebrowser.org)
- **`sqlite3` CLI** - `sqlite3 my-quiz.db < schema.sql`
- **An LLM** - Ask it to generate INSERT statements from your content

**Requirements:**
- Each question must have exactly 4 options (option_a through option_d)
- `correct` is the zero-based index (0=option_a, 1=option_b, 2=option_c, 3=option_d)
- `fun_fact` is shown after the user answers
- `wiki_url` is optional but recommended

**Recommended:** 50-200 questions for best experience. The engine selects 20 per game session.

### 3. Host Your Database

Host the `.db` file on any static file server. GitHub Pages is the easiest:

1. Create a repo (e.g. `quiz-data`)
2. Add your `.db` file(s)
3. Enable GitHub Pages (Settings > Pages > Deploy from branch)
4. Your DB is available at `https://yourusername.github.io/quiz-data/your-quiz.db`

Multiple quizzes can share the same data repo — just add more `.db` files.

### 4. Configure the DB URL

Edit the `QUIZ_DB_URL` in `index.html`:
```html
<script>
    const QUIZ_DB_URL = "https://yourusername.github.io/quiz-data/your-quiz.db";
</script>
```

### 5. Customize the Text

Edit `index.html` to customize:
- `<title>` - Browser tab title
- `<h1>` - Main header
- `<p class="subtitle">` - Tagline
- Login screen text and labels
- Button text

### 6. Customize the Theme (Optional)

Create or edit `theme.css` to override the default styling:

```css
:root {
    /* Override color variables */
    --gold: #your-primary-color;
    --gold-light: #your-light-accent;
    --gold-dark: #your-dark-accent;
    --marble: #your-text-color;
    --navy: #your-background-color;
    --purple: #your-secondary-color;
    --lightning: #your-special-effect-color;

    /* Override fonts */
    --font-heading: 'YourFont', serif;
    --font-body: 'YourBodyFont', sans-serif;
}
```

Don't forget to:
1. Uncomment the theme.css link in `index.html`
2. Add your custom font imports to the `<head>` if needed

## Project Structure

```
your-quiz-game/
├── index.html          # HTML structure + QUIZ_DB_URL config
├── styles.css          # Core styles
├── quiz-engine.js      # Game logic + DB loading
└── theme.css           # Your custom theme (optional)
```

Questions live in a separate repo:
```
quiz-data/              # Hosted on GitHub Pages
├── your-quiz.db        # Your question database
├── another-quiz.db     # Another topic
└── README.md
```

## Configuration

### Questions Per Game

By default, the quiz shows 20 questions per game session. To change this, edit `quiz-engine.js`:

```javascript
const QUESTIONS_PER_GAME = 20; // Change to your desired number
```

### Cache Duration

The DB is cached in IndexedDB for 90 days by default. To change this:

```javascript
const DB_CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // Change 90 to desired days
```

### Storage Key

The game uses localStorage with the key pattern `quiz_game_{username}`. To customize this (e.g., for multiple quizzes on the same domain), edit the storage functions in `quiz-engine.js`:

```javascript
function getUserData(username) {
    const data = localStorage.getItem(`your_quiz_name_${username}`);
    // ...
}

function saveUserData(username, data) {
    localStorage.setItem(`your_quiz_name_${username}`, JSON.stringify(data));
}
```

## Question Selection Algorithm

The quiz engine prioritizes questions to optimize learning:

1. **Unseen questions** - Questions the user hasn't encountered yet
2. **Incorrect questions** - Questions answered incorrectly before
3. **Correct questions** - Questions already answered correctly

This ensures users see new content first and get extra practice on challenging material.

## Features Explained

### DB Loading and Caching

- On first visit, the `.db` file is fetched from `QUIZ_DB_URL` and cached in IndexedDB
- Subsequent visits load from IndexedDB with no network request
- After 90 days, the cache is refreshed from the network
- If a refresh fails (offline), the stale cache is used as fallback
- The "Start Quiz" button is disabled until the DB is loaded

### Progress Tracking
- User data is saved in localStorage by username
- Tracks which questions have been seen
- Tracks which questions were answered correctly
- Maintains lifetime statistics (total correct, total answered)

### Streak System
- Increments for consecutive correct answers
- Displays with fire emoji in top-right corner
- Resets on incorrect answer
- Persists during the current session only

### Celebratory Effects
- Confetti animation on correct answers
- Color-coded feedback (green for correct, red for incorrect)
- Fun facts displayed after each answer
- Wikipedia links for further learning

### Responsive Design
- Works on mobile, tablet, and desktop
- Touch-friendly buttons
- Optimized for various screen sizes
- Uses modern CSS (flexbox, custom properties, viewport units)

## Theme Examples

### Space Theme
```css
:root {
    --gold: #ffd700;
    --gold-light: #fff4b3;
    --gold-dark: #cc9900;
    --marble: #e8f4f8;
    --navy: #0a0e27;
    --purple: #2d1b4e;
    --lightning: #00ccff;
}
```

### Nature Theme
```css
:root {
    --gold: #76c893;
    --gold-light: #b5e48c;
    --gold-dark: #52b788;
    --marble: #f8f9fa;
    --navy: #1b4332;
    --purple: #2d6a4f;
    --lightning: #95d5b2;
}
```

### Fire Theme
```css
:root {
    --gold: #ff6b35;
    --gold-light: #ffaa00;
    --gold-dark: #cc3300;
    --marble: #fdf6e3;
    --navy: #1a0000;
    --purple: #4a1a1a;
    --lightning: #ff9500;
}
```

## Tips for Good Quiz Questions

1. **Clear and Unambiguous** - Questions should have one clearly correct answer
2. **Consistent Difficulty** - Mix easy, medium, and hard questions
3. **Plausible Distractors** - Wrong answers should be believable
4. **Educational Fun Facts** - Use fun facts to teach, not just inform
5. **Verify Accuracy** - Double-check all facts and answers
6. **Cite Sources** - Include Wikipedia or other reference links

## Troubleshooting

### "Failed to load questions" Error
- Check that `QUIZ_DB_URL` points to a valid, publicly accessible `.db` file
- Verify the hosting server allows CORS (GitHub Pages does by default)
- Open the DB URL directly in a browser to confirm it downloads
- Check the browser console for detailed error messages

### Questions Not Loading
- Verify the `.db` file uses the correct schema (table named `questions` with the expected columns)
- Open the `.db` in a SQLite client and confirm data exists
- Check that `correct` values are between 0 and 3

### Styles Not Applied
- Ensure `styles.css` is loaded in the `<head>`
- Check that CSS file paths are correct
- If using custom theme, ensure it's loaded after `styles.css`

### Progress Not Saving
- Check that localStorage is enabled in the browser
- Verify the username is being captured correctly
- Check browser console for storage-related errors

### Clearing the Cached DB
- Open DevTools > Application > IndexedDB > `quiz_db_cache` > `files`
- Delete the entry to force a fresh fetch on next load

## Examples

See the [system-design-quiz](https://github.com/zevaverbach/system-design-quiz) repository for a complete working example.
