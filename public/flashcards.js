const input = document.getElementById('flashcard-input');
const generateButton = document.getElementById('generate-cards');
const autoPinyinButton = document.getElementById('auto-pinyin');
const showHanziButton = document.getElementById('show-hanzi');
const showPinyinButton = document.getElementById('show-pinyin');
const shuffleButton = document.getElementById('shuffle-cards');
const resetButton = document.getElementById('reset-cards');
const prevButton = document.getElementById('prev-card');
const nextButton = document.getElementById('next-card');
const flashcard = document.getElementById('flashcard');
const cardFront = document.getElementById('card-front');
const cardBack = document.getElementById('card-back');
const cardStatus = document.getElementById('card-status');
const cardCounter = document.getElementById('card-counter');
const focusToggle = document.getElementById('toggle-focus');
const completionCard = document.getElementById('flashcard-complete');
const restartButton = document.getElementById('restart-cards');
const restartShuffleButton = document.getElementById('restart-shuffle');

let cards = [];
let currentIndex = 0;
let isFlipped = false;
let displayMode = 'hanzi';
let isFocusMode = false;
let isComplete = false;

const separators = ['|', '\t', ' - ', ' — ', ' – ', '/', ','];
const hanziRegex = /[\u4e00-\u9fff]/;

function parseLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  for (const separator of separators) {
    const index = trimmed.indexOf(separator);
    if (index > -1) {
      const front = trimmed.slice(0, index).trim();
      const back = trimmed.slice(index + separator.length).trim();
      if (!front && !back) return null;
      return {
        front: front || back,
        back: back || front,
      };
    }
  }

  return { front: trimmed, back: trimmed };
}

function getPinyin(text) {
  if (!window.pinyinPro || typeof window.pinyinPro.pinyin !== 'function') {
    return null;
  }
  try {
    return window.pinyinPro.pinyin(text, { toneType: 'symbol' });
  } catch {
    return null;
  }
}

function autoGeneratePinyin() {
  const lines = input.value.split(/\r?\n/);
  const updated = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    for (const separator of separators) {
      const index = trimmed.indexOf(separator);
      if (index > -1) {
        const front = trimmed.slice(0, index).trim();
        const back = trimmed.slice(index + separator.length).trim();
        if (!front || back || !hanziRegex.test(front)) {
          return line;
        }
        const pinyin = getPinyin(front);
        return pinyin ? `${front} | ${pinyin}` : line;
      }
    }

    if (!hanziRegex.test(trimmed)) return line;
    const pinyin = getPinyin(trimmed);
    return pinyin ? `${trimmed} | ${pinyin}` : line;
  });

  input.value = updated.join('\n');
}

function parseCards(text) {
  return text
    .split(/\r?\n/)
    .map(parseLine)
    .filter(Boolean);
}

function updateButtons() {
  const hasCards = cards.length > 0;
  prevButton.disabled = !hasCards || isComplete;
  nextButton.disabled = !hasCards || isComplete;
  shuffleButton.disabled = cards.length < 2;
  resetButton.disabled = !hasCards;
  autoPinyinButton.disabled = !window.pinyinPro || typeof window.pinyinPro.pinyin !== 'function';
}

function updateFocusMode() {
  document.body.classList.toggle('flashcards-focus', isFocusMode);
  focusToggle.textContent = isFocusMode ? 'Exit focus mode' : 'Enter focus mode';
}

function updateToggleState() {
  const isHanzi = displayMode === 'hanzi';
  showHanziButton.classList.toggle('is-active', isHanzi);
  showPinyinButton.classList.toggle('is-active', !isHanzi);
  showHanziButton.setAttribute('aria-pressed', String(isHanzi));
  showPinyinButton.setAttribute('aria-pressed', String(!isHanzi));
}

function resolveFaces(card) {
  if (!card.back || card.front === card.back) {
    return { front: card.front, back: card.back };
  }

  const frontHasHanzi = hanziRegex.test(card.front);
  const backHasHanzi = hanziRegex.test(card.back);

  if (displayMode === 'hanzi') {
    if (frontHasHanzi && !backHasHanzi) return { front: card.front, back: card.back };
    if (backHasHanzi && !frontHasHanzi) return { front: card.back, back: card.front };
  } else {
    if (frontHasHanzi && !backHasHanzi) return { front: card.back, back: card.front };
    if (backHasHanzi && !frontHasHanzi) return { front: card.front, back: card.back };
  }

  return { front: card.front, back: card.back };
}

function updateCard() {
  if (!cards.length) {
    cardFront.textContent = 'Paste a list to begin';
    cardBack.textContent = '';
    cardCounter.textContent = '0 / 0';
    cardStatus.textContent = 'Generate a set to start flipping.';
    flashcard.classList.remove('is-flipped');
    flashcard.setAttribute('aria-pressed', 'false');
    flashcard.classList.remove('is-dimmed');
    completionCard.classList.remove('is-visible');
    isComplete = false;
    updateButtons();
    return;
  }

  const card = cards[currentIndex];
  const faces = resolveFaces(card);
  cardFront.textContent = faces.front || '';
  cardBack.textContent = faces.back || '';
  cardCounter.textContent = `${currentIndex + 1} / ${cards.length}`;
  cardStatus.textContent = isFlipped ? 'Showing back. Tap to flip.' : 'Showing front. Tap to flip.';
  flashcard.classList.toggle('is-flipped', isFlipped);
  flashcard.setAttribute('aria-pressed', String(isFlipped));
  updateButtons();
  updateToggleState();
  updateFocusMode();

  completionCard.classList.toggle('is-visible', isComplete);
  flashcard.classList.toggle('is-dimmed', isComplete);
}

function goToPreviousCard() {
  if (!cards.length || isComplete) return;
  currentIndex = Math.max(0, currentIndex - 1);
  isFlipped = false;
  updateCard();
}

function goToNextCard() {
  if (!cards.length || isComplete) return;
  if (currentIndex >= cards.length - 1) {
    isComplete = true;
    updateCard();
    return;
  }
  currentIndex += 1;
  isFlipped = false;
  updateCard();
}

function shuffleCards() {
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  currentIndex = 0;
  isFlipped = false;
  isComplete = false;
  updateCard();
}

function generateCards() {
  cards = parseCards(input.value);
  currentIndex = 0;
  isFlipped = false;
  isComplete = false;
  updateCard();
}

function resetFlip() {
  isFlipped = false;
  updateCard();
}

function restartCards(shuffleFirst) {
  isComplete = false;
  if (shuffleFirst && cards.length > 1) {
    shuffleCards();
    return;
  }
  currentIndex = 0;
  isFlipped = false;
  updateCard();
}

function setDisplayMode(mode) {
  displayMode = mode;
  isFlipped = false;
  updateCard();
}

function flipCard() {
  if (!cards.length) return;
  isFlipped = !isFlipped;
  updateCard();
}

function toggleFocusMode() {
  isFocusMode = !isFocusMode;
  updateFocusMode();
}

generateButton.addEventListener('click', generateCards);
autoPinyinButton.addEventListener('click', autoGeneratePinyin);
shuffleButton.addEventListener('click', shuffleCards);
resetButton.addEventListener('click', resetFlip);
showHanziButton.addEventListener('click', () => setDisplayMode('hanzi'));
showPinyinButton.addEventListener('click', () => setDisplayMode('pinyin'));
nextButton.addEventListener('click', goToNextCard);
prevButton.addEventListener('click', goToPreviousCard);
focusToggle.addEventListener('click', toggleFocusMode);
restartButton.addEventListener('click', () => restartCards(false));
restartShuffleButton.addEventListener('click', () => restartCards(true));
flashcard.addEventListener('click', flipCard);
flashcard.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    flipCard();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.target && ['TEXTAREA', 'INPUT'].includes(event.target.tagName)) return;
  if (event.key === 'ArrowLeft') goToPreviousCard();
  if (event.key === 'ArrowRight') goToNextCard();
  if (event.key === ' ') {
    event.preventDefault();
    flipCard();
  }
});

generateCards();
updateFocusMode();
