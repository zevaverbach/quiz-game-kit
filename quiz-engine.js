/**
 * Quiz Game Engine
 *
 * This module contains all the game logic and mechanics for the quiz.
 * It handles:
 * - Question selection and randomization
 * - User progress tracking via localStorage
 * - Score and streak calculations
 * - Answer validation
 * - UI updates and animations
 *
 * Configuration:
 * - QUESTIONS_PER_GAME: Number of questions per game session (default: 20)
 * - Storage key: quiz_game_{username} (can be customized)
 *
 * Dependencies:
 * - questions array (from questions.js)
 * - canvas-confetti library (CDN)
 * - HTML elements with specific IDs (see index.html)
 */

// Configuration
const QUESTIONS_PER_GAME = 20;

// Game state variables
let currentUser = null;
let currentQuestionIndex = 0;
let currentShuffledOptions = []; // Shuffled option indices for current question
let currentCorrectShuffled = 0;  // Index of correct answer after shuffling
let sessionScore = 0;
let streak = 0;
let sessionQuestions = []; // Questions for this session (20)
let sessionAnswered = 0;   // How many answered this session
let userStats = { seenQuestions: [], correctQuestions: [], totalCorrect: 0, totalAnswered: 0 };

// Initialize background animation
function createStars() {
    const bg = document.getElementById('bgAnimation');
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.animationDelay = Math.random() * 3 + 's';
        bg.appendChild(star);
    }

    // Add lightning bolts
    for (let i = 0; i < 5; i++) {
        const bolt = document.createElement('div');
        bolt.className = 'lightning-bolt';
        bolt.style.left = Math.random() * 100 + '%';
        bolt.style.top = Math.random() * 50 + '%';
        bolt.style.animationDelay = Math.random() * 8 + 's';
        bg.appendChild(bolt);
    }
}

// Local Storage functions
function getUserData(username) {
    const data = localStorage.getItem(`quiz_game_${username}`);
    return data ? JSON.parse(data) : {
        seenQuestions: [],      // All questions user has seen
        correctQuestions: [],   // Questions user has answered correctly
        totalCorrect: 0,        // Lifetime correct answers
        totalAnswered: 0        // Lifetime total answers
    };
}

function saveUserData(username, data) {
    localStorage.setItem(`quiz_game_${username}`, JSON.stringify(data));
}

// Select 20 questions with priority: unseen > incorrect > correct
function selectSessionQuestions() {
    const allIndices = questions.map((_, i) => i);
    const seen = new Set(userStats.seenQuestions);
    const correct = new Set(userStats.correctQuestions);

    // Categorize questions
    const unseen = allIndices.filter(i => !seen.has(i));
    const seenIncorrect = allIndices.filter(i => seen.has(i) && !correct.has(i));
    const seenCorrect = allIndices.filter(i => correct.has(i));

    // Shuffle each category
    shuffle(unseen);
    shuffle(seenIncorrect);
    shuffle(seenCorrect);

    // Build session: prioritize unseen, then incorrect, then correct
    const selected = [];

    // Add unseen questions first
    for (const i of unseen) {
        if (selected.length >= QUESTIONS_PER_GAME) break;
        selected.push(i);
    }

    // Add incorrect questions
    for (const i of seenIncorrect) {
        if (selected.length >= QUESTIONS_PER_GAME) break;
        selected.push(i);
    }

    // Add correct questions if still need more
    for (const i of seenCorrect) {
        if (selected.length >= QUESTIONS_PER_GAME) break;
        selected.push(i);
    }

    // Shuffle the final selection so it's not predictable
    shuffle(selected);

    return selected;
}

// Fisher-Yates shuffle
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Screen management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');

    // Hide header and greeting during game to maximize space
    const header = document.querySelector('.header');
    const greeting = document.querySelector('.user-greeting');
    if (screenId === 'gameScreen') {
        header.classList.add('hidden');
        greeting.classList.add('hidden');
    } else {
        header.classList.remove('hidden');
        if (greeting) greeting.classList.remove('hidden');
    }
}

// Start game
function startGame() {
    const usernameInput = document.getElementById('username');
    const username = usernameInput.value.trim();

    if (!username) {
        usernameInput.style.borderColor = '#ef4444';
        usernameInput.style.animation = 'shake 0.5s ease-out';
        setTimeout(() => {
            usernameInput.style.borderColor = '';
            usernameInput.style.animation = '';
        }, 500);
        return;
    }

    currentUser = username;
    localStorage.setItem('quiz_game_lastUser', username);
    userStats = getUserData(username);

    // Reset session state
    sessionScore = 0;
    sessionAnswered = 0;
    streak = 0;

    // Select 20 questions for this session
    sessionQuestions = selectSessionQuestions();

    document.getElementById('displayName').textContent = username;

    updateStats();
    showScreen('gameScreen');
    loadNextQuestion();
}

// Load next question
function loadNextQuestion() {
    if (sessionAnswered >= QUESTIONS_PER_GAME) {
        showCompletionScreen();
        return;
    }

    currentQuestionIndex = sessionQuestions[sessionAnswered];
    const question = questions[currentQuestionIndex];

    // Shuffle options to randomize answer positions
    currentShuffledOptions = [0, 1, 2, 3];
    shuffle(currentShuffledOptions);
    currentCorrectShuffled = currentShuffledOptions.indexOf(question.correct);

    document.getElementById('questionNumber').textContent = `Question ${sessionAnswered + 1} of ${QUESTIONS_PER_GAME}`;
    document.getElementById('questionText').textContent = question.question;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    currentShuffledOptions.forEach((originalIndex, displayIndex) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option';
        optionEl.textContent = question.options[originalIndex];
        optionEl.onclick = () => selectAnswer(displayIndex);
        optionsContainer.appendChild(optionEl);
    });

    document.getElementById('resultContainer').innerHTML = '';
    document.getElementById('nextBtn').style.display = 'none';

    updateStats();
}

// Select answer
function selectAnswer(selectedIndex) {
    const question = questions[currentQuestionIndex];
    const options = document.querySelectorAll('.option');
    const isCorrect = selectedIndex === currentCorrectShuffled;

    // Disable all options
    options.forEach((opt, i) => {
        opt.classList.add('disabled');
        opt.onclick = null;
        if (i === currentCorrectShuffled) {
            opt.classList.add('correct');
        } else if (i === selectedIndex && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });

    // Update score and streak
    if (isCorrect) {
        sessionScore++;
        streak++;
        fireConfetti();

        // Track correct answer (add if not already there)
        if (!userStats.correctQuestions.includes(currentQuestionIndex)) {
            userStats.correctQuestions.push(currentQuestionIndex);
        }
        userStats.totalCorrect++;
    } else {
        streak = 0;

        // Remove from correct if previously correct (they got it wrong this time)
        const correctIdx = userStats.correctQuestions.indexOf(currentQuestionIndex);
        if (correctIdx > -1) {
            userStats.correctQuestions.splice(correctIdx, 1);
        }
    }

    updateStreak();

    // Track that question was seen
    if (!userStats.seenQuestions.includes(currentQuestionIndex)) {
        userStats.seenQuestions.push(currentQuestionIndex);
    }
    userStats.totalAnswered++;
    sessionAnswered++;

    // Save to localStorage
    saveUserData(currentUser, userStats);

    // Show result
    const resultContainer = document.getElementById('resultContainer');
    const wikiLink = question.wiki ? `<a href="${question.wiki}" target="_blank" rel="noopener" class="wiki-link">📖 Learn more on Wikipedia →</a>` : '';
    const wikiLinkSmall = question.wiki ? `<a href="${question.wiki}" target="_blank" rel="noopener" class="wiki-link-small">[wiki]</a>` : '';
    resultContainer.innerHTML = `
        <div class="result-message ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? '✨ Correct! The gods are pleased!' : '❌ Incorrect! The correct answer was: ' + question.options[question.correct] + wikiLinkSmall}
        </div>
        <div class="fun-fact">
            <strong>📜 Did you know?</strong> ${question.funFact}
            ${wikiLink}
        </div>
    `;

    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').textContent = sessionAnswered < QUESTIONS_PER_GAME ? 'Next Question →' : 'View Results 🏆';

    updateStats();
}

// Update stats display
function updateStats() {
    const accuracy = sessionAnswered > 0 ? Math.round((sessionScore / sessionAnswered) * 100) : 0;
    const remaining = QUESTIONS_PER_GAME - sessionAnswered;

    document.getElementById('scoreDisplay').textContent = sessionScore;
    document.getElementById('answeredDisplay').textContent = sessionAnswered;
    document.getElementById('remainingDisplay').textContent = remaining;
    document.getElementById('accuracyDisplay').textContent = accuracy + '%';

    const progress = (sessionAnswered / QUESTIONS_PER_GAME) * 100;
    document.getElementById('progressBar').style.width = progress + '%';
}

// Update streak indicator
function updateStreak() {
    const indicator = document.getElementById('streakIndicator');
    const countEl = document.getElementById('streakCount');

    if (streak >= 2) {
        countEl.textContent = streak;
        indicator.classList.add('visible');
    } else {
        indicator.classList.remove('visible');
    }
}

// Fire confetti
function fireConfetti() {
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#d4af37', '#f4e4a6', '#996515', '#ffffff']
    });

    if (streak >= 3) {
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#d4af37', '#f4e4a6', '#996515']
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#d4af37', '#f4e4a6', '#996515']
            });
        }, 250);
    }
}

// Next question
function nextQuestion() {
    if (sessionAnswered >= QUESTIONS_PER_GAME) {
        showCompletionScreen();
    } else {
        loadNextQuestion();
    }
}

// Show completion screen
function showCompletionScreen() {
    showScreen('completionScreen');
    document.getElementById('completionName').textContent = currentUser;
    document.getElementById('finalScore').textContent = `${sessionScore}/${QUESTIONS_PER_GAME}`;

    const percentage = Math.round((sessionScore / QUESTIONS_PER_GAME) * 100);
    let rank = '';

    if (percentage === 100) {
        rank = '🏛️ Oracle of Delphi - Perfect Round!';
        fireConfetti();
        setTimeout(fireConfetti, 500);
        setTimeout(fireConfetti, 1000);
    } else if (percentage >= 90) {
        rank = '⚡ Olympian Champion';
        fireConfetti();
    } else if (percentage >= 75) {
        rank = '🦁 Hero of Legend';
    } else if (percentage >= 60) {
        rank = '⚔️ Worthy Warrior';
    } else if (percentage >= 40) {
        rank = '📚 Eager Student';
    } else {
        rank = '🌱 Humble Mortal';
    }

    // Add lifetime stats
    const masteryPercent = Math.round((userStats.correctQuestions.length / questions.length) * 100);
    rank += `<br><small style="font-size: 0.7em; opacity: 0.8;">Mastered: ${userStats.correctQuestions.length}/${questions.length} questions (${masteryPercent}%)</small>`;

    document.getElementById('rankDisplay').innerHTML = rank;
}

// Reset progress (full reset)
function resetProgress() {
    if (confirm('Are you sure you want to reset ALL progress? This cannot be undone.')) {
        userStats = { seenQuestions: [], correctQuestions: [], totalCorrect: 0, totalAnswered: 0 };
        saveUserData(currentUser, userStats);

        // Start a new game
        sessionScore = 0;
        sessionAnswered = 0;
        streak = 0;
        sessionQuestions = selectSessionQuestions();

        showScreen('gameScreen');
        loadNextQuestion();
    }
}

// Play again (new session, keep progress)
function playAgain() {
    sessionScore = 0;
    sessionAnswered = 0;
    streak = 0;
    sessionQuestions = selectSessionQuestions();

    showScreen('gameScreen');
    loadNextQuestion();
}

// Logout
function logout() {
    currentUser = null;
    sessionScore = 0;
    streak = 0;
    sessionQuestions = [];
    sessionAnswered = 0;
    userStats = { seenQuestions: [], correctQuestions: [], totalCorrect: 0, totalAnswered: 0 };
    document.getElementById('username').value = '';
    document.getElementById('streakIndicator').classList.remove('visible');
    showScreen('loginScreen');
}

// Handle Enter key on login
document.getElementById('username').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        startGame();
    }
});

// Initialize
createStars();

// Restore remembered username
const lastUser = localStorage.getItem('quiz_game_lastUser');
if (lastUser) {
    document.getElementById('username').value = lastUser;
}
