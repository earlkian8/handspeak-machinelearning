/*
  Static ASL data for the frontend.
  Mirrors the backend data so the UI can render instantly,
  while the API is the source of truth.
*/

const CONVERSATIONAL_100 = [
  'HELLO', 'BYE', 'THANKYOU', 'PLEASE', 'SORRY', 'YES', 'NO', 'OK', 'WELCOME',
  'I', 'ME', 'YOU', 'WE', 'HE', 'THEY', 'MY',
  'WHAT', 'WHO', 'WHERE', 'WHEN', 'WHY', 'HOW',
  'WANT', 'NEED', 'HAVE', 'GO', 'COME', 'LIKE', 'LOVE', 'KNOW', 'SEE', 'HELP',
  'EAT', 'DRINK', 'SLEEP', 'LEARN', 'THINK', 'FEEL', 'TELL', 'STOP', 'FINISH',
  'UNDERSTAND',
  'GOOD', 'BAD', 'HAPPY', 'SAD', 'ANGRY', 'SCARED', 'TIRED', 'SICK',
  'HUNGRY', 'THIRSTY', 'HOT', 'COLD', 'BIG', 'SMALL',
  'NOW', 'TODAY', 'TOMORROW', 'YESTERDAY', 'MORNING', 'NIGHT',
  'AGAIN', 'ALWAYS', 'NEVER', 'BEFORE',
  'WATER', 'FAMILY', 'MOTHER', 'FATHER', 'FRIEND', 'HOME', 'SCHOOL',
  'WORK', 'PHONE', 'NAME', 'DOCTOR', 'MONEY', 'SIGN',
  'AND', 'BUT', 'WITH', 'FOR', 'ALL', 'MORE', 'MANY', 'SOME', 'TOGETHER',
  'IMPORTANT', 'SAME', 'DIFFERENT', 'RIGHT', 'WRONG', 'BUSY', 'STRONG',
  'SAFE', 'REMEMBER', 'MEET', 'WAIT', 'LANGUAGE',
];

const ISLAND_BLUEPRINT = [
  { id: 'greetings', title: 'Greetings', icon: '👋' },
  { id: 'family', title: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'colors', title: 'Colors', icon: '🎨' },
  { id: 'food', title: 'Food', icon: '🍎' },
  { id: 'animals', title: 'Animals', icon: '🐾' },
];

const WORDS_PER_ISLAND = 20;

const humanizeWord = (word) => {
  if (word === 'THANKYOU') return 'THANK YOU';
  return word;
};

const buildWordEntry = (word, index, islandId) => {
  const label = humanizeWord(word);
  return {
    id: word.toLowerCase(),
    label,
    type: 'word',
    description: `Practice the ASL sign for ${label}.`,
    tip: 'Keep your hand centered and clearly visible in the frame.',
    diagramUrl: null,
    order: index + 1,
    chapterId: islandId,
  };
};

// ── Alphabet Signs ─────────────────────────────────────────────
export const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
  id: letter,
  label: letter,
  type: "alphabet",
  description: `Form the letter '${letter}' with your hand`,
  tip: "Ensure your hand is clearly visible in the frame.",
  diagramUrl: null,
}));

// ── Number Signs ───────────────────────────────────────────────
export const NUMBERS = Array.from({ length: 10 }, (_, i) => ({
  id: String(i),
  label: String(i),
  type: "number",
  description: `Form the number '${i}' with your hand`,
  tip: "Keep your hand steady and clearly visible.",
  diagramUrl: null,
}));

// ── Study Topics ───────────────────────────────────────────────
export const STUDY_TOPICS = [
  ...ISLAND_BLUEPRINT.map((island, islandIndex) => {
    const sliceStart = islandIndex * WORDS_PER_ISLAND;
    const words = CONVERSATIONAL_100.slice(sliceStart, sliceStart + WORDS_PER_ISLAND);

    return {
      id: island.id,
      title: island.title,
      order: islandIndex + 1,
      icon: island.icon,
      phrases: words.map((word, wordIndex) => {
        const entry = buildWordEntry(word, sliceStart + wordIndex, island.id);
        return {
          id: entry.id,
          label: entry.label,
          description: entry.description,
          tip: entry.tip,
          word: word,
        };
      }),
    };
  }),
];
