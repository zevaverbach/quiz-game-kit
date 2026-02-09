/**
 * Quiz Game Engine
 *
 * This module contains all the game logic and mechanics for the quiz.
 * It handles:
 * - Loading questions from a SQLite .db file via sql.js (WASM)
 * - Question selection and randomization
 * - User progress tracking via localStorage
 * - Score and streak calculations
 * - Answer validation
 * - UI updates and animations
 *
 * Configuration (set in index.html before loading this script):
 * - QUIZ_DB_URL: URL to the SQLite .db file
 * - QUIZ_THEME: Optional theme overrides (see defaults below)
 *
 * Dependencies:
 * - sql.js (CDN)
 * - canvas-confetti library (CDN)
 * - HTML elements with specific IDs (see index.html)
 */

// Theme configuration with defaults
const theme = Object.assign({
    storagePrefix: 'quiz_game',
    correctMessage: '✨ Correct! The gods are pleased!',
    funFactLabel: '📜 Did you know?',
    confettiColors: ['#d4af37', '#f4e4a6', '#996515', '#ffffff'],
    confettiStreakColors: ['#d4af37', '#f4e4a6', '#996515'],
    ranks: [
        { min: 100, label: '🏛️ Oracle of Delphi - Perfect Round!' },
        { min: 90,  label: '⚡ Olympian Champion' },
        { min: 75,  label: '🦁 Hero of Legend' },
        { min: 60,  label: '⚔️ Worthy Warrior' },
        { min: 40,  label: '📚 Eager Student' },
        { min: 0,   label: '🌱 Humble Mortal' },
    ]
}, typeof QUIZ_THEME !== 'undefined' ? QUIZ_THEME : {});

// Configuration
const QUESTIONS_PER_GAME = 20;
const DB_CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000; // 90 days

// Questions array — populated async from SQLite DB
let questions = [];

// Timeout wrapper — resolves to rejection if promise doesn't settle in time
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
    ]);
}

// IndexedDB helpers for caching the .db file
function openCacheDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('quiz_db_cache', 1);
        req.onupgradeneeded = () => req.result.createObjectStore('files');
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getCachedDB() {
    const db = await openCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readonly');
        const req = tx.objectStore('files').get(QUIZ_DB_URL);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
    });
}

async function setCachedDB(bytes) {
    const db = await openCacheDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').put({ bytes, cachedAt: Date.now() }, QUIZ_DB_URL);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

// Parse a .db ArrayBuffer/Uint8Array into the questions array
function parseDB(SQL, bytes) {
    const db = new SQL.Database(new Uint8Array(bytes));
    const results = db.exec("SELECT id, question, option_a, option_b, option_c, option_d, correct, fun_fact, wiki_url FROM questions ORDER BY id");

    if (results.length > 0) {
        questions = results[0].values.map(row => ({
            question: row[1],
            options: [row[2], row[3], row[4], row[5]],
            correct: row[6],
            funFact: row[7] || '',
            wiki: row[8] || ''
        }));
    }

    db.close();
}

// Load questions from SQLite database (with IndexedDB caching)
async function initDatabase() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const startBtn = document.getElementById('startBtn');

    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/${file}`
        });

        let cached = null;
        try { cached = await withTimeout(getCachedDB(), 2000); } catch (e) { /* IndexedDB unavailable or slow */ }

        const isStale = !cached || (Date.now() - cached.cachedAt) > DB_CACHE_MAX_AGE_MS;

        if (cached && !isStale) {
            // Use cached copy
            parseDB(SQL, cached.bytes);
        } else {
            // Fetch fresh copy (fall back to stale cache on network failure)
            try {
                const response = await fetch(QUIZ_DB_URL);
                if (!response.ok) {
                    throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
                }

                const buf = await response.arrayBuffer();
                parseDB(SQL, buf);
                try { await withTimeout(setCachedDB(buf), 2000); } catch (e) { /* cache write failed, non-fatal */ }
            } catch (fetchErr) {
                if (cached) {
                    console.warn('Network fetch failed, using stale cached DB:', fetchErr);
                    parseDB(SQL, cached.bytes);
                } else {
                    throw fetchErr;
                }
            }
        }

        loadingIndicator.style.display = 'none';
        startBtn.disabled = false;
    } catch (err) {
        loadingIndicator.innerHTML = `<span style="color: #ef4444;">Failed to load questions. Check the DB URL.</span>`;
        console.error('Database load error:', err);
    }
}

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

// Navigation state for back/forward browsing
let answerHistory = [];        // Per-position: {questionIndex, selectedIndex, isCorrect, shuffledOptions, correctShuffled}
let viewingIndex = 0;          // Which session position is currently displayed
let browseReturnPosition = null; // null = not browsing; set to position when user clicks Back

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
    const data = localStorage.getItem(`${theme.storagePrefix}_${username}`);
    return data ? JSON.parse(data) : {
        seenQuestions: [],      // All questions user has seen
        correctQuestions: [],   // Questions user has answered correctly
        totalCorrect: 0,        // Lifetime correct answers
        totalAnswered: 0        // Lifetime total answers
    };
}

function saveUserData(username, data) {
    localStorage.setItem(`${theme.storagePrefix}_${username}`, JSON.stringify(data));
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
    localStorage.setItem(`${theme.storagePrefix}_lastUser`, username);
    userStats = getUserData(username);

    // Reset session state
    sessionScore = 0;
    sessionAnswered = 0;
    streak = 0;
    answerHistory = [];
    viewingIndex = 0;
    browseReturnPosition = null;

    // Select 20 questions for this session
    sessionQuestions = selectSessionQuestions();

    document.getElementById('displayName').textContent = username;

    updateStats();
    showScreen('gameScreen');
    loadNextQuestion();
}

// Load next question
function loadNextQuestion() {
    hideModal();
    if (sessionAnswered >= QUESTIONS_PER_GAME) {
        showCompletionScreen();
        return;
    }

    viewingIndex = sessionAnswered;
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

    updateNavButtons();
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

    // Store in answer history before incrementing sessionAnswered
    answerHistory[viewingIndex] = {
        questionIndex: currentQuestionIndex,
        selectedIndex: selectedIndex,
        isCorrect: isCorrect,
        shuffledOptions: [...currentShuffledOptions],
        correctShuffled: currentCorrectShuffled
    };

    sessionAnswered++;

    // Save to localStorage
    saveUserData(currentUser, userStats);

    // Show result
    const resultContainer = document.getElementById('resultContainer');
    const wikiLink = question.wiki ? `<a href="${question.wiki}" target="_blank" rel="noopener" class="wiki-link">📖 Learn more on Wikipedia →</a>` : '';
    const wikiLinkSmall = question.wiki ? `<a href="${question.wiki}" target="_blank" rel="noopener" class="wiki-link-small">[wiki]</a>` : '';
    resultContainer.innerHTML = `
        <div class="result-message ${isCorrect ? 'correct' : 'incorrect'}">
            ${isCorrect ? theme.correctMessage : '❌ Incorrect! The correct answer was: ' + question.options[question.correct] + wikiLinkSmall}
        </div>
        <div class="fun-fact">
            <strong>${theme.funFactLabel}</strong> ${question.funFact}
            ${wikiLink}
        </div>
    `;

    document.getElementById('nextBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').textContent = sessionAnswered < QUESTIONS_PER_GAME ? 'Next Question →' : 'View Results 🏆';

    updateNavButtons();
    updateStats();
    showModal();
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
        colors: theme.confettiColors
    });

    if (streak >= 3) {
        setTimeout(() => {
            confetti({
                particleCount: 50,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: theme.confettiStreakColors
            });
            confetti({
                particleCount: 50,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: theme.confettiStreakColors
            });
        }, 250);
    }
}

// Result modal helpers (mobile bottom sheet)
function showModal() {
    const overlay = document.getElementById('resultModalOverlay');
    if (!overlay) return;
    document.getElementById('modalContent').innerHTML = document.getElementById('resultContainer').innerHTML;

    // Sync modal nav buttons with inline nav buttons
    const modalNextBtn = document.getElementById('modalNextBtn');
    const modalBackBtn = document.getElementById('modalBackBtn');
    const modalFwdBtn = document.getElementById('modalFwdBtn');
    if (modalNextBtn) {
        modalNextBtn.style.display = document.getElementById('nextBtn').style.display;
        modalNextBtn.textContent = document.getElementById('nextBtn').textContent;
    }
    if (modalBackBtn) modalBackBtn.style.display = document.getElementById('backBtn').style.display;
    if (modalFwdBtn) modalFwdBtn.style.display = document.getElementById('fwdBtn').style.display;

    overlay.classList.add('visible');
    document.getElementById('gameScreen').classList.add('modal-active');
}

function hideModal() {
    const overlay = document.getElementById('resultModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('visible');
    document.getElementById('gameScreen').classList.remove('modal-active');
}

// Show a previously answered question in read-only mode
function showReviewQuestion(position) {
    const entry = answerHistory[position];
    const question = questions[entry.questionIndex];

    document.getElementById('questionNumber').textContent = `Question ${position + 1} of ${QUESTIONS_PER_GAME}`;
    document.getElementById('questionText').textContent = question.question;

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    entry.shuffledOptions.forEach((originalIndex, displayIndex) => {
        const optionEl = document.createElement('div');
        optionEl.className = 'option disabled';
        optionEl.textContent = question.options[originalIndex];
        if (displayIndex === entry.correctShuffled) {
            optionEl.classList.add('correct');
        } else if (displayIndex === entry.selectedIndex && !entry.isCorrect) {
            optionEl.classList.add('incorrect');
        }
        optionsContainer.appendChild(optionEl);
    });

    // Show result and fun fact
    const wikiLink = question.wiki ? `<a href="${question.wiki}" target="_blank" rel="noopener" class="wiki-link">📖 Learn more on Wikipedia →</a>` : '';
    const wikiLinkSmall = question.wiki ? `<a href="${question.wiki}" target="_blank" rel="noopener" class="wiki-link-small">[wiki]</a>` : '';
    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = `
        <div class="result-message ${entry.isCorrect ? 'correct' : 'incorrect'}">
            ${entry.isCorrect ? theme.correctMessage : '❌ Incorrect! The correct answer was: ' + question.options[question.correct] + wikiLinkSmall}
        </div>
        <div class="fun-fact">
            <strong>${theme.funFactLabel}</strong> ${question.funFact}
            ${wikiLink}
        </div>
    `;

    document.getElementById('nextBtn').style.display = 'none';
    updateNavButtons();
}

// Navigate back to a previous question
function goBack() {
    if (viewingIndex <= 0) return;
    if (browseReturnPosition === null) {
        browseReturnPosition = viewingIndex;
    }
    viewingIndex--;
    showReviewQuestion(viewingIndex);
    showModal();
}

// Navigate forward toward the current question
function goForward() {
    if (browseReturnPosition === null) return;
    viewingIndex++;
    if (viewingIndex >= browseReturnPosition) {
        // Returned to where we were — exit browse mode
        const returnPos = browseReturnPosition;
        browseReturnPosition = null;
        viewingIndex = returnPos;
        // If we're at an unanswered question, load it fresh; otherwise show the answered one
        if (viewingIndex >= sessionAnswered) {
            loadNextQuestion();
        } else {
            showReviewQuestion(viewingIndex);
            // Show Next button since this is the latest answered question
            document.getElementById('nextBtn').style.display = 'inline-block';
            document.getElementById('nextBtn').textContent = sessionAnswered < QUESTIONS_PER_GAME ? 'Next Question →' : 'View Results 🏆';
            updateNavButtons();
            showModal();
        }
    } else {
        showReviewQuestion(viewingIndex);
        showModal();
    }
}

// Update visibility of back/forward/next buttons
function updateNavButtons() {
    const backBtn = document.getElementById('backBtn');
    const fwdBtn = document.getElementById('fwdBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!backBtn || !fwdBtn) return;

    // Back: visible when there are previous answered questions to review
    backBtn.style.display = (viewingIndex > 0) ? 'inline-block' : 'none';

    // Forward: visible only when browsing (browseReturnPosition is set) and not at the return position
    fwdBtn.style.display = (browseReturnPosition !== null && viewingIndex < browseReturnPosition) ? 'inline-block' : 'none';

    // Next: hide when browsing old questions
    if (browseReturnPosition !== null) {
        nextBtn.style.display = 'none';
    }
}

// Next question
function nextQuestion() {
    hideModal();
    browseReturnPosition = null;
    if (sessionAnswered >= QUESTIONS_PER_GAME) {
        showCompletionScreen();
    } else {
        loadNextQuestion();
    }
}

// Show completion screen
function showCompletionScreen() {
    hideModal();
    showScreen('completionScreen');
    document.getElementById('completionName').textContent = currentUser;
    document.getElementById('finalScore').textContent = `${sessionScore}/${QUESTIONS_PER_GAME}`;

    const percentage = Math.round((sessionScore / QUESTIONS_PER_GAME) * 100);
    let rank = '';

    // Find matching rank (ranks are sorted high-to-low by min)
    for (const r of theme.ranks) {
        if (percentage >= r.min) {
            rank = r.label;
            break;
        }
    }

    // Fire confetti for top scores
    if (percentage === 100) {
        fireConfetti();
        setTimeout(fireConfetti, 500);
        setTimeout(fireConfetti, 1000);
    } else if (percentage >= 90) {
        fireConfetti();
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
        answerHistory = [];
        viewingIndex = 0;
        browseReturnPosition = null;
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
    answerHistory = [];
    viewingIndex = 0;
    browseReturnPosition = null;
    sessionQuestions = selectSessionQuestions();

    showScreen('gameScreen');
    loadNextQuestion();
}

// Logout
function logout() {
    hideModal();
    currentUser = null;
    sessionScore = 0;
    streak = 0;
    sessionQuestions = [];
    sessionAnswered = 0;
    answerHistory = [];
    viewingIndex = 0;
    browseReturnPosition = null;
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
initDatabase();

// Restore remembered username
const lastUser = localStorage.getItem(`${theme.storagePrefix}_lastUser`);
if (lastUser) {
    document.getElementById('username').value = lastUser;
}
