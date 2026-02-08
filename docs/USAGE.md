# Quiz Game Kit - Usage Guide

This guide will walk you through creating your own quiz game using the quiz-game-kit.

## Quick Start

### 1. Copy the Kit Files

Copy these files to your project directory:
- `index.html` - HTML structure
- `styles.css` - Core styling
- `quiz-engine.js` - Game logic
- `questions.js` - Question template
- `theme.css` (optional) - Theme customization

### 2. Customize Your Questions

Edit `questions.js` to add your quiz content:

```javascript
const questions = [
    {
        question: "Your question here?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 2,  // Index of correct answer (0-3)
        funFact: "Interesting fact about the answer",
        wiki: "https://en.wikipedia.org/wiki/Related_Topic"
    },
    // Add more questions...
];
```

**Requirements:**
- Each question must have exactly 4 options
- `correct` is the zero-based index (0-3) of the correct answer
- `funFact` is shown after the user answers
- `wiki` link is optional but recommended

**Recommended:** 50-200 questions for best experience. The engine selects 20 per game session.

### 3. Customize the Text

Edit `index.html` to customize:
- `<title>` - Browser tab title
- `<h1>` - Main header
- `<p class="subtitle">` - Tagline
- Login screen text and labels
- Button text

### 4. Customize the Theme (Optional)

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
├── index.html          # HTML structure (customize text)
├── questions.js        # Your quiz content (required)
├── theme.css          # Your custom theme (optional)
├── quiz-game-kit/     # The reusable framework
│   ├── styles.css     # Core styles (don't edit)
│   ├── quiz-engine.js # Game logic (don't edit)
│   ├── questions.js   # Template (replace with yours)
│   └── theme.css      # Example themes
└── README.md          # Your project documentation
```

## Configuration

### Questions Per Game

By default, the quiz shows 20 questions per game session. To change this, edit `quiz-engine.js`:

```javascript
const QUESTIONS_PER_GAME = 20; // Change to your desired number
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

### Progress Tracking
- User data is saved in localStorage by username
- Tracks which questions have been seen
- Tracks which questions were answered correctly
- Maintains lifetime statistics (total correct, total answered)

### Streak System
- Increments for consecutive correct answers
- Displays with fire emoji (🔥) in top-right corner
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

### Questions Not Showing
- Check that `questions.js` is loaded before `quiz-engine.js`
- Verify the `questions` array is properly formatted
- Open browser console to check for JavaScript errors

### Styles Not Applied
- Ensure `styles.css` is loaded in the `<head>`
- Check that CSS file paths are correct
- If using custom theme, ensure it's loaded after `styles.css`

### Progress Not Saving
- Check that localStorage is enabled in the browser
- Verify the username is being captured correctly
- Check browser console for storage-related errors

## Examples

See the [greek-myth-quiz-game](https://github.com/zevaverbach/greek-myth-quiz-game) repository for a complete working example.

## Support

For questions or issues:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the code comments in `quiz-engine.js`

## Contributing

Contributions are welcome! Please submit pull requests to improve:
- Documentation
- Quiz engine features
- Bug fixes
- Example themes
