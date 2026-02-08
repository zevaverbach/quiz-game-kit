# Quiz Game Kit - API Reference

This document describes the functions and data structures in the quiz-game-kit.

## Data Structures

### Question Object

```javascript
{
    question: String,     // The question text
    options: String[4],   // Array of exactly 4 answer choices
    correct: Number,      // Index (0-3) of the correct answer
    funFact: String,      // Educational fact shown after answering
    wiki: String          // Optional Wikipedia URL for more info
}
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

## Core Functions

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

**Actions:**
1. Increments question index
2. Either loads next question or shows completion
3. Hides "Next" button until new question is answered

#### `showCompletionScreen()`
Displays the completion screen with final results.

**Actions:**
1. Calculates final score
2. Determines rank based on performance
3. Updates UI with results
4. Fires victory confetti

#### `playAgain()`
Starts a new game session for the current user.

**Actions:**
1. Resets session variables
2. Selects new session questions
3. Returns to game screen

#### `logout()`
Returns to login screen.

**Actions:**
1. Resets all session data
2. Clears username
3. Shows login screen

#### `resetProgress()`
Clears all saved progress for current user.

**Actions:**
1. Confirms with user (browser alert)
2. Deletes localStorage data
3. Reloads page

### UI Updates

#### `updateStats()`
Updates the statistics display bar.

**Updates:**
- Current score
- Questions answered in session
- Questions remaining in session
- Accuracy percentage

#### `updateStreak()`
Updates the streak indicator display.

**Actions:**
- Shows streak counter if streak > 0
- Hides when streak is 0
- Animates indicator

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

**Actions:**
- Creates 100 twinkling stars
- Creates 5 animated lightning bolts
- Randomizes positions and timing

#### `fireConfetti()`
Triggers confetti animation using canvas-confetti library.

**Parameters:** None

**Actions:**
- Fires confetti from bottom of screen
- Uses multiple particle counts and spreads
- Randomizes colors

## Global Variables

### Configuration
- `QUESTIONS_PER_GAME` (Number) - Questions per session (default: 20)

### State
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
- **canvas-confetti** (v1.9.2+) - Confetti animations
- **Google Fonts** (optional) - Custom fonts

### Browser APIs
- `localStorage` - User progress persistence
- DOM API - UI manipulation

## Browser Support

Requires modern browser with support for:
- ES6+ JavaScript (const, let, arrow functions, destructuring)
- CSS Custom Properties (variables)
- CSS Flexbox
- localStorage API
- Modern DOM APIs

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
