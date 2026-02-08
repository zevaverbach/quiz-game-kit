/**
 * Quiz Questions Module
 *
 * Define your quiz questions here. Each question should have:
 * - question: The question text (string)
 * - options: Array of 4 answer choices (string[])
 * - correct: Index of the correct answer (0-3) (number)
 * - funFact: Interesting fact shown after answering (string)
 * - wiki: Optional Wikipedia link for more info (string)
 */

const questions = [
    {
        question: "Sample question 1 - Replace with your content",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct: 2,
        funFact: "This is an interesting fact about the answer that will be shown to the user after they answer.",
        wiki: "https://en.wikipedia.org/wiki/Example"
    },
    {
        question: "Sample question 2 - Replace with your content",
        options: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
        correct: 0,
        funFact: "Another fun fact that provides context and makes learning engaging.",
        wiki: "https://en.wikipedia.org/wiki/Example"
    },
    {
        question: "Sample question 3 - Replace with your content",
        options: ["Answer A", "Answer B", "Answer C", "Answer D"],
        correct: 3,
        funFact: "Fun facts help reinforce learning and keep users engaged with your content.",
        wiki: "https://en.wikipedia.org/wiki/Example"
    },
    // Add more questions here...
    // Recommended: 50-200 questions for a good experience
    // The quiz engine will select 20 questions per game session
];

// Export for use in quiz-engine.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = questions;
}
