# Quiz Game Kit

A modular, dependency-free quiz game framework that makes it easy to create engaging trivia games on any topic.

## Features

- 🎯 **Zero Dependencies**: Uses only CDN resources (fonts, animations)
- 🎨 **Pluggable Theming**: Easy CSS variable-based styling system
- 📦 **Modular Architecture**: Separate modules for questions, styles, and game logic
- 💾 **Progress Tracking**: LocalStorage-based user progress and statistics
- 🔥 **Streak System**: Keeps players engaged with achievement tracking
- 🎊 **Celebratory Effects**: Confetti animations for correct answers
- 📱 **Fully Responsive**: Works on desktop, tablet, and mobile devices
- 🧠 **Smart Question Selection**: Prioritizes unseen and incorrect questions
- 📊 **Detailed Statistics**: Track accuracy, progress, and lifetime stats

## Architecture

The kit is split into four main modules:

### Core Modules

1. **`questions.js`** - Your quiz content (questions, answers, fun facts)
2. **`styles.css`** - Core layout and styling with CSS variables
3. **`quiz-engine.js`** - Game mechanics and logic
4. **`index.html`** - Minimal HTML structure

### Optional

- **`theme.css`** - Custom theme overrides for your topic

This modular design allows you to:
- Create multiple quiz games that share the same engine
- Update game mechanics across all quizzes at once
- Easily customize themes per topic
- Mix and match components as needed

## Quick Start

### 1. Copy the Files

Copy these files to your project:
```bash
cp -r quiz-game-kit/index.html your-quiz/
cp -r quiz-game-kit/styles.css your-quiz/
cp -r quiz-game-kit/quiz-engine.js your-quiz/
cp -r quiz-game-kit/questions.js your-quiz/
```

### 2. Add Your Questions

Edit `questions.js`:
```javascript
const questions = [
    {
        question: "Your question here?",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 2,  // Index of correct answer (0-3)
        funFact: "Interesting fact about the answer",
        wiki: "https://en.wikipedia.org/wiki/Topic"
    },
    // Add 50-200 questions for best experience
];
```

### 3. Customize the Text

Edit `index.html` to change:
- Title and header text
- Login screen messaging
- Button labels
- Any other user-facing text

### 4. Style Your Quiz (Optional)

Create `theme.css` to customize colors:
```css
:root {
    --gold: #your-primary-color;
    --navy: #your-background-color;
    --marble: #your-text-color;
}
```

### 5. Open in Browser

No build process needed! Just open `index.html` in any modern browser.

## Documentation

- **[Usage Guide](./docs/USAGE.md)** - Detailed instructions for creating your quiz
- **[API Reference](./docs/API.md)** - Function and data structure documentation

## How It Works

### Question Selection Algorithm

The quiz engine uses a smart algorithm to optimize learning:
1. **Unseen questions** - Prioritizes new content
2. **Incorrect questions** - Reviews challenging material
3. **Correct questions** - Reinforces mastery

Each game session presents 20 questions (configurable).

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

See the **[Greek Mythology Quiz Game](https://github.com/zevaverbach/greek-myth-quiz-game)** for a complete working example with:
- 200+ questions about Greek mythology
- Custom Greek-themed styling
- Modular architecture demonstration

## Creating Different Themed Quizzes

The same quiz-game-kit can power multiple themed quizzes:

- **Space Quiz** - Astronomy and space exploration
- **History Quiz** - Historical events and figures
- **Science Quiz** - Biology, chemistry, physics
- **Literature Quiz** - Books, authors, and literary works
- **Geography Quiz** - Countries, capitals, and landmarks

Each quiz just needs:
1. Custom `questions.js` with topic-specific content
2. Custom `theme.css` with appropriate colors/fonts
3. Updated text in `index.html`
4. Shared `styles.css` and `quiz-engine.js` from the kit

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

## Contributing

Contributions welcome! Areas for improvement:
- Additional quiz engine features
- New theme examples
- Documentation improvements
- Bug fixes
- Performance optimizations

## License

MIT

## Credits

Created with ❤️ for making educational games accessible to everyone.
