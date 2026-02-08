# Quiz Game Kit - API Reference

This document describes the functions and data structures in the quiz-game-kit.

## Data Structures

### Question Object (in-memory)

After loading from SQLite, each question is represented as:

```javascript
{
    question: String,     // The question text
    options: String[4],   // Array of exactly 4 answer choices
    correct: Number,      // Index (0-3) of the correct answer
    funFact: String,      // Educational fact shown after answering
    wiki: String          // Optional Wikipedia URL for more info
}
```

### SQLite Schema (on disk)

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

### User Stats Object

```javascript
{
    seenQuestions: Number[],      // Indices of questions user has seen
    correctQuestions: Number[],   // Indices of questions answered correctly
    totalCorrect: Number,         // Lifetime count of correct answers
    totalAnswered: Number         // Lifetime count of total answers
}
```

### IndexedDB Cache Entry

```javascript
{
    bytes: ArrayBuffer,   // Raw .db file bytes
    cachedAt: Number      // Timestamp (Date.now()) when cached
}
```

## Core Functions

### Database Loading

#### `initDatabase()`
Loads the question database from IndexedDB cache or network.

**Actions:**
1. Initializes sql.js WASM runtime
2. Checks IndexedDB for a cached copy of the DB
3. If cached and less than 90 days old, uses the cached copy
4. Otherwise fetches from `QUIZ_DB_URL` and caches the result
5. Falls back to stale cache if network fetch fails
6. Parses the DB and populates the `questions` array
7. Hides loading indicator and enables the Start button

#### `openCacheDB()`
Opens (or creates) the IndexedDB database used for caching.

**Returns:** `Promise<IDBDatabase>`

#### `getCachedDB()`
Retrieves the cached DB entry for the current `QUIZ_DB_URL`.

**Returns:** `Promise<{bytes, cachedAt} | null>`

#### `setCachedDB(bytes)`
Stores DB bytes in IndexedDB with a timestamp.

**Parameters:**
- `bytes` (ArrayBuffer) - The raw .db file content

#### `parseDB(SQL, bytes)`
Parses a SQLite database and populates the global `questions` array.

**Parameters:**
- `SQL` (sql.js module) - Initialized sql.js instance
- `bytes` (ArrayBuffer) - Raw .db file content

### Question Selection

#### `selectSessionQuestions()`
Selects 20 questions for the current game session using a priority algorithm.

**Returns:** `Number[]` - Array of question indices

**Algorithm:**
1. Prioritizes unseen questions
2. Then questions previously answered incorrectly
3. Finally questions answered correctly
4. Shuffles the final selection

### User Data Management

#### `getUserData(username)`
Retrieves user statistics from localStorage.

**Parameters:**
- `username` (String) - The username

**Returns:** `UserStats` - User statistics object

#### `saveUserData(username, data)`
Saves user statistics to localStorage.

**Parameters:**
- `username` (String) - The username
- `data` (UserStats) - User statistics to save

### Game Flow

#### `startGame()`
Initializes a new game session.

**Actions:**
1. Validates username input
2. Loads user data
3. Selects session questions
4. Displays first question
5. Switches to game screen

#### `loadNextQuestion()`
Loads and displays the current question.

**Actions:**
1. Retrieves question from `sessionQuestions`
2. Shuffles answer options
3. Updates progress bar
4. Displays question and options
5. Clears previous result

#### `selectAnswer(selectedIndex)`
Handles answer selection and validation.

**Parameters:**
- `selectedIndex` (Number) - Index of selected option

**Actions:**
1. Validates answer
2. Updates score and stats
3. Displays result with fun fact
4. Shows confetti for correct answers
5. Updates streak
6. Saves progress to localStorage

#### `nextQuestion()`
Advances to the next question or completion screen.

#### `showCompletionScreen()`
Displays the completion screen with final results.

#### `playAgain()`
Starts a new game session for the current user.

#### `logout()`
Returns to login screen and resets session state.

#### `resetProgress()`
Clears all saved progress for current user (with confirmation).

### UI Updates

#### `updateStats()`
Updates the statistics display bar (score, answered, remaining, accuracy).

#### `updateStreak()`
Shows/hides the streak indicator based on current streak count.

### Utilities

#### `shuffle(array)`
Implements Fisher-Yates shuffle algorithm.

**Parameters:**
- `array` (Array) - Array to shuffle in place

**Returns:** `Array` - The shuffled array

#### `showScreen(screenId)`
Shows a screen and hides others.

**Parameters:**
- `screenId` (String) - ID of screen to show

#### `createStars()`
Generates animated background stars and lightning bolts.

#### `fireConfetti()`
Triggers confetti animation using canvas-confetti library.

## Global Variables

### Configuration
- `QUESTIONS_PER_GAME` (Number) - Questions per session (default: 20)
- `DB_CACHE_MAX_AGE_MS` (Number) - Cache TTL in milliseconds (default: 90 days)
- `QUIZ_DB_URL` (String) - URL to the SQLite .db file (set in index.html)
- `QUIZ_THEME` (Object, optional) - Theme overrides with these properties:
  - `storagePrefix` (String) - localStorage key prefix (default: `'quiz_game'`)
  - `correctMessage` (String) - Message shown on correct answer
  - `funFactLabel` (String) - Label before fun facts
  - `confettiColors` (String[]) - Colors for confetti burst
  - `confettiStreakColors` (String[]) - Colors for streak confetti
  - `ranks` (Array<{min, label}>) - Completion ranks sorted high-to-low by `min` percentage
- `theme` (Object) - Resolved theme config (merged QUIZ_THEME over defaults)

### State
- `questions` (Array) - All questions loaded from the DB
- `currentUser` (String|null) - Current username
- `currentQuestionIndex` (Number) - Current question index in session
- `currentShuffledOptions` (Number[]) - Shuffled option indices
- `currentCorrectShuffled` (Number) - Correct answer index after shuffle
- `sessionScore` (Number) - Correct answers this session
- `streak` (Number) - Current streak count
- `sessionQuestions` (Number[]) - Question indices for this session
- `sessionAnswered` (Number) - Questions answered this session
- `userStats` (UserStats) - Current user's statistics

## HTML Elements (IDs)

The quiz engine expects these HTML elements:

### Screens
- `loginScreen` - Login/welcome screen
- `gameScreen` - Main quiz interface
- `completionScreen` - Results screen

### Login
- `username` - Username input field
- `startBtn` - Start quiz button (disabled until DB loads)
- `loadingIndicator` - Loading spinner (hidden after DB loads)

### Game
- `displayName` - Username display
- `scoreDisplay` - Current score
- `answeredDisplay` - Questions answered
- `remainingDisplay` - Questions remaining
- `accuracyDisplay` - Accuracy percentage
- `progressBar` - Progress bar element
- `questionNumber` - Question number label
- `questionText` - Question text
- `optionsContainer` - Container for answer buttons
- `resultContainer` - Result feedback area
- `nextBtn` - Next question button
- `streakIndicator` - Streak indicator element
- `streakCount` - Streak count display

### Completion
- `completionName` - Username on completion screen
- `finalScore` - Final score display
- `rankDisplay` - Performance rank text

### Background
- `bgAnimation` - Background animation container

## Dependencies

### External (CDN)
- **sql.js** (v1.11.0) - SQLite compiled to WASM for loading .db files
- **canvas-confetti** (v1.9.2+) - Confetti animations
- **Google Fonts** (optional) - Custom fonts

### Browser APIs
- `localStorage` - User progress persistence
- `IndexedDB` - DB file caching
- `fetch` - DB file downloading
- `WebAssembly` - Required by sql.js
- DOM API - UI manipulation

## Browser Support

Requires modern browser with support for:
- ES6+ JavaScript (const, let, arrow functions, async/await, destructuring)
- CSS Custom Properties (variables)
- CSS Flexbox
- localStorage API
- IndexedDB API
- WebAssembly
