/**
 * ASL Grammar & Translation Engine
 * Converts English and multilingual spoken sentences into American Sign Language (ASL) Gloss
 * with Non-Manual Markers (NMM): facial expressions, head tilts, and grammatical eyebrow postures.
 */

export type FacialExpression =
  | 'neutral'
  | 'eyebrows_raised' // Yes/No questions (q:yn)
  | 'eyebrows_furrowed' // WH-questions (q:wh - who, what, when, where, why, how)
  | 'head_nod' // Affirmation / topic marker
  | 'head_shake' // Negation (not, never, don't, can't)
  | 'smile' // Warm greetings, gratitude
  | 'curious' // Puzzled / inquiring
  | 'intense'; // Emphatic / emergency

export interface GlossToken {
  id: string;
  originalWord: string;
  gloss: string;
  isFingerspelled: boolean;
  letters?: string[];
  facialExpression: FacialExpression;
  durationMs: number;
  pauseAfterMs: number;
  grammaticalRole?: 'time' | 'topic' | 'verb' | 'object' | 'wh-question' | 'negation' | 'pronoun';
}

export interface TranslationResult {
  sourceText: string;
  sourceLanguage: string;
  targetGloss: string;
  glossTokens: GlossToken[];
  sentenceType: 'statement' | 'yes_no_question' | 'wh_question' | 'negation' | 'greeting';
  facialGrammarSummary: string;
  culturalNote?: string;
}

// Known ASL signs in the core dictionary
export const KNOWN_ASL_SIGNS = new Set([
  'HELLO', 'HI', 'GOODBYE', 'BYE', 'THANK_YOU', 'THANKS', 'PLEASE',
  'YES', 'NO', 'HELP', 'SORRY', 'WELCOME', 'LOVE', 'I_LOVE_YOU',
  'HOW', 'WHAT', 'WHERE', 'WHEN', 'WHY', 'WHO', 'WHICH',
  'YOU', 'ME', 'I', 'WE', 'THEY', 'HE', 'SHE', 'MY', 'YOUR',
  'GOOD', 'BAD', 'HAPPY', 'SAD', 'FINE', 'NICE', 'MEET',
  'NAME', 'LEARN', 'PRACTICE', 'UNDERSTAND', 'FRIEND', 'FAMILY',
  'WORK', 'DEAF', 'HEARING', 'SIGN', 'LANGUAGE', 'EAT', 'FOOD',
  'WATER', 'DRINK', 'WANT', 'NEED', 'LIKE', 'TIME', 'TODAY',
  'TOMORROW', 'YESTERDAY', 'NOW', 'MORNING', 'AFTERNOON', 'NIGHT',
  'AGAIN', 'MORE', 'STOP', 'GO', 'COME', 'BEAUTIFUL', 'GREAT',
  'QUESTION', 'TEACH', 'STUDENT', 'SCHOOL', 'HOME', 'CAR', 'BOOK'
]);

// Multilingual vocabulary aliases mapped to standard English/ASL concept
const MULTILINGUAL_SYNONYMS: Record<string, string> = {
  // Spanish
  'hola': 'hello',
  'gracias': 'thank_you',
  'por favor': 'please',
  'si': 'yes',
  'sí': 'yes',
  'no': 'no',
  'ayuda': 'help',
  'amor': 'love',
  'te amo': 'i_love_you',
  'amigo': 'friend',
  'bueno': 'good',
  'como estas': 'how are you',
  'cómo estás': 'how are you',
  'como': 'how',
  'cómo': 'how',
  'que': 'what',
  'qué': 'what',
  'donde': 'where',
  'dónde': 'where',
  'cuando': 'when',
  'cuándo': 'when',
  'por que': 'why',
  'por qué': 'why',
  'quien': 'who',
  'quién': 'who',
  'nombre': 'name',
  'aprender': 'learn',
  // French
  'bonjour': 'hello',
  'merci': 'thank_you',
  's\'il vous plaît': 'please',
  'oui': 'yes',
  'aide': 'help',
  'ami': 'friend',
  'amour': 'love',
  'comment': 'how',
  'ou': 'where',
  'où': 'where',
  'pourquoi': 'why',
  'quand': 'when',
  // German
  'hallo': 'hello',
  'danke': 'thank_you',
  'bitte': 'please',
  'ja': 'yes',
  'nein': 'no',
  'hilfe': 'help',
  'freund': 'friend',
  'liebe': 'love',
  'wie': 'how',
  'wo': 'where',
  'warum': 'why',
  'wann': 'when',
  // Japanese (romaji)
  'konnichiwa': 'hello',
  'arigato': 'thank_you',
  'arigatou': 'thank_you',
  'hai': 'yes',
  'iie': 'no',
  'tasukete': 'help',
  'tomodachi': 'friend',
  'doko': 'where',
  'naze': 'why',
  // Chinese (pinyin)
  'ni hao': 'hello',
  'nihao': 'hello',
  'xie xie': 'thank_you',
  'xiexie': 'thank_you',
  'qing': 'please',
  'shi': 'yes',
  'pengyou': 'friend',
  // Arabic (transliterated)
  'marhaban': 'hello',
  'shukran': 'thank_you',
  'min fadlak': 'please',
  'naam': 'yes',
  'la': 'no',
  'sadiq': 'friend'
};

// Common phrase maps
const PHRASE_MAPPINGS: Record<string, string[]> = {
  'how are you': ['HOW', 'YOU'],
  'nice to meet you': ['NICE', 'MEET', 'YOU'],
  'thank you very much': ['THANK_YOU', 'MORE'],
  'thank you': ['THANK_YOU'],
  'thanks a lot': ['THANK_YOU'],
  'good morning': ['GOOD', 'MORNING'],
  'good night': ['GOOD', 'NIGHT'],
  'good afternoon': ['GOOD', 'AFTERNOON'],
  'see you later': ['SEE', 'LATER'],
  'i love you': ['I_LOVE_YOU'],
  'what is your name': ['YOUR', 'NAME', 'WHAT'],
  'my name is': ['MY', 'NAME'],
  'where is the bathroom': ['BATHROOM', 'WHERE'],
  'can you help me': ['YOU', 'HELP', 'ME'],
  'i need help': ['ME', 'NEED', 'HELP'],
  'i understand': ['I', 'UNDERSTAND'],
  'i do not understand': ['I', 'UNDERSTAND', 'NO'],
  'i don\'t understand': ['I', 'UNDERSTAND', 'NO'],
  'sign language': ['SIGN', 'LANGUAGE'],
  'deaf culture': ['DEAF', 'CULTURE']
};

/**
 * Normalizes input text and applies multi-word phrase replacements
 */
export function normalizeSentence(text: string): { normalized: string; isQuestion: boolean; isWhQuestion: boolean; isNegation: boolean } {
  const trimmed = text.trim();
  const isQuestion = trimmed.endsWith('?') || /^(is|are|do|does|can|could|would|will|did|should|what|who|where|when|why|how)\b/i.test(trimmed);
  const isWhQuestion = /\b(what|who|where|when|why|how|which)\b/i.test(trimmed);
  const isNegation = /\b(not|no|never|don't|can't|won't|isn't|aren't|didn't|doesn't|haven't|hardly)\b/i.test(trimmed);

  let cleaned = trimmed
    .toLowerCase()
    .replace(/[?!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Check multilingual replacements
  for (const [foreign, eng] of Object.entries(MULTILINGUAL_SYNONYMS)) {
    const regex = new RegExp(`\\b${foreign}\\b`, 'gi');
    cleaned = cleaned.replace(regex, eng);
  }

  return {
    normalized: cleaned,
    isQuestion,
    isWhQuestion,
    isNegation
  };
}

/**
 * Converts English/Multilingual text into structured ASL Gloss Tokens with Non-Manual Markers
 */
export function translateToAslGloss(inputText: string, sourceLang = 'auto'): TranslationResult {
  if (!inputText || !inputText.trim()) {
    return {
      sourceText: '',
      sourceLanguage: sourceLang,
      targetGloss: '',
      glossTokens: [],
      sentenceType: 'statement',
      facialGrammarSummary: 'Neutral expression'
    };
  }

  const { normalized, isQuestion, isWhQuestion, isNegation } = normalizeSentence(inputText);

  let sentenceType: TranslationResult['sentenceType'] = 'statement';
  let defaultExpression: FacialExpression = 'neutral';
  let facialSummary = 'Maintain relaxed, neutral facial posture.';

  if (isWhQuestion) {
    sentenceType = 'wh_question';
    defaultExpression = 'eyebrows_furrowed';
    facialSummary = 'Furrow eyebrows (down and in), tilt head slightly forward, hold last sign.';
  } else if (isQuestion) {
    sentenceType = 'yes_no_question';
    defaultExpression = 'eyebrows_raised';
    facialSummary = 'Raise eyebrows, widen eyes, tilt head slightly forward, hold last sign.';
  } else if (isNegation) {
    sentenceType = 'negation';
    defaultExpression = 'head_shake';
    facialSummary = 'Shake head gently side-to-side throughout the negative clause.';
  } else if (/\b(hello|hi|welcome|thank|love|good|great|happy)\b/i.test(normalized)) {
    sentenceType = 'greeting';
    defaultExpression = 'smile';
    facialSummary = 'Warm open smile, engaged eye contact.';
  }

  // Check exact full phrase matches first (only if exact match)
  for (const [phrase, glossList] of Object.entries(PHRASE_MAPPINGS)) {
    if (normalized === phrase) {
      const tokens: GlossToken[] = glossList.map((g, idx) => {
        const isLast = idx === glossList.length - 1;
        const expr = (isWhQuestion && isLast) ? 'eyebrows_furrowed' :
                     (isQuestion && isLast) ? 'eyebrows_raised' :
                     defaultExpression;

        return {
          id: `token-${idx}-${g}`,
          originalWord: g.toLowerCase(),
          gloss: g,
          isFingerspelled: !KNOWN_ASL_SIGNS.has(g),
          letters: !KNOWN_ASL_SIGNS.has(g) ? g.split('') : undefined,
          facialExpression: expr,
          durationMs: 950,
          pauseAfterMs: 150
        };
      });

      return {
        sourceText: inputText,
        sourceLanguage: sourceLang,
        targetGloss: glossList.join(' '),
        glossTokens: tokens,
        sentenceType,
        facialGrammarSummary: facialSummary,
        culturalNote: 'In ASL grammar, Non-Manual Markers (facial expressions and head movement) carry syntactic meaning just like vocal intonation in spoken languages.'
      };
    }
  }

  // Token-by-token ASL Grammar Transformation
  // ASL syntax drops English articles ("a", "an", "the"), copulas ("is", "are", "am", "was", "were"),
  // and rearranges into Time + Topic + Comment + WH-Question word at end.
  const rawWords = normalized.split(/\s+/).filter(Boolean);
  const wordsToDrop = new Set(['a', 'an', 'the', 'is', 'are', 'am', 'was', 'were', 'be', 'been', 'to', 'of', 'for']);

  const timeWords: string[] = [];
  const contentWords: string[] = [];
  const whWords: string[] = [];
  const negWords: string[] = [];

  const timeSet = new Set(['today', 'tomorrow', 'yesterday', 'now', 'morning', 'afternoon', 'night', 'soon', 'later']);
  const whSet = new Set(['what', 'who', 'where', 'when', 'why', 'how', 'which']);
  const negSet = new Set(['not', 'no', 'never', 'dont', 'cant', 'wont']);

  for (const word of rawWords) {
    if (wordsToDrop.has(word)) continue;

    if (timeSet.has(word)) {
      timeWords.push(word.toUpperCase());
    } else if (whSet.has(word)) {
      whWords.push(word.toUpperCase());
    } else if (negSet.has(word)) {
      negWords.push(word.toUpperCase());
    } else {
      contentWords.push(word);
    }
  }

  // Build ASL word sequence: TIME -> TOPIC/CONTENT -> NEGATION -> WH-WORD
  const orderedWords: { word: string; role?: GlossToken['grammaticalRole'] }[] = [];

  timeWords.forEach(w => orderedWords.push({ word: w, role: 'time' }));
  contentWords.forEach(w => orderedWords.push({ word: w, role: 'topic' }));
  negWords.forEach(w => orderedWords.push({ word: w, role: 'negation' }));
  whWords.forEach(w => orderedWords.push({ word: w, role: 'wh-question' }));

  if (orderedWords.length === 0) {
    // Fallback if everything was dropped
    orderedWords.push({ word: rawWords[0] || 'HELLO' });
  }

  const glossTokens: GlossToken[] = orderedWords.map((item, index) => {
    const cleanKey = item.word.toUpperCase().replace(/[^A-Z_]/g, '');
    const isKnown = KNOWN_ASL_SIGNS.has(cleanKey);
    const isLast = index === orderedWords.length - 1;

    let expr = defaultExpression;
    if (item.role === 'wh-question' || (isWhQuestion && isLast)) {
      expr = 'eyebrows_furrowed';
    } else if (isQuestion && isLast) {
      expr = 'eyebrows_raised';
    } else if (item.role === 'negation') {
      expr = 'head_shake';
    }

    return {
      id: `tok-${index}-${cleanKey}`,
      originalWord: item.word,
      gloss: cleanKey,
      isFingerspelled: !isKnown,
      letters: !isKnown ? cleanKey.split('') : undefined,
      facialExpression: expr,
      durationMs: isKnown ? 950 : Math.max(700, cleanKey.length * 320),
      pauseAfterMs: 140,
      grammaticalRole: item.role
    };
  });

  const finalGloss = glossTokens.map(t => (t.isFingerspelled ? `#${t.gloss}` : t.gloss)).join(' ');

  return {
    sourceText: inputText,
    sourceLanguage: sourceLang,
    targetGloss: finalGloss,
    glossTokens,
    sentenceType,
    facialGrammarSummary: facialSummary,
    culturalNote: 'In ASL, WH-questions place the question word (WHAT, WHERE, WHO) typically at the end of the clause with furrowed brows.'
  };
}

/**
 * Multilingual phrase translations from ASL Gloss patterns
 */
const MULTILINGUAL_ASL_TRANSLATIONS: Record<string, Record<string, string>> = {
  'HOW YOU': {
    en: 'How are you?',
    es: '¿Cómo estás?',
    fr: 'Comment allez-vous ?',
    de: 'Wie geht es dir?',
    ja: 'お元気ですか？',
    zh: '你好吗？',
    pt: 'Como você está?',
    it: 'Come stai?',
    ar: 'كيف حالك؟',
    hi: 'आप कैसे हैं?',
    ru: 'Как дела?'
  },
  'NICE MEET YOU': {
    en: 'Nice to meet you!',
    es: '¡Mucho gusto en conocerte!',
    fr: 'Ravi de vous rencontrer !',
    de: 'Schön, dich kennenzulernen!',
    ja: 'はじめまして！',
    zh: '很高兴认识你！',
    pt: 'Prazer em conhecer você!',
    it: 'Piacere di conoscerti!',
    ar: 'تشرفت بمعرفتك!',
    hi: 'आपसे मिलकर अच्छा लगा!',
    ru: 'Приятно познакомиться!'
  },
  'YOUR NAME WHAT': {
    en: 'What is your name?',
    es: '¿Cómo te llamas?',
    fr: 'Comment vous appelez-vous ?',
    de: 'Wie heißt du?',
    ja: 'お名前は何ですか？',
    zh: '你叫什么名字？',
    pt: 'Qual é o seu nome?',
    it: 'Come ti chiami?',
    ar: 'ما اسمك؟',
    hi: 'आपका नाम क्या है?',
    ru: 'Как тебя зовут?'
  },
  'MY NAME': {
    en: 'My name is...',
    es: 'Mi nombre es...',
    fr: 'Je m\'appelle...',
    de: 'Mein Name ist...',
    ja: '私の名前は...',
    zh: '我的名字是...',
    pt: 'Meu nome é...',
    it: 'Mi chiamo...',
    ar: 'اسمي...',
    hi: 'मेरा नाम है...',
    ru: 'Меня зовут...'
  },
  'YOU HELP ME': {
    en: 'Can you help me?',
    es: '¿Puedes ayudarme?',
    fr: 'Pouvez-vous m\'aider ?',
    de: 'Kannst du mir helfen?',
    ja: '手伝っていただけますか？',
    zh: '你能帮我吗？',
    pt: 'Você pode me ajudar?',
    it: 'Puoi aiutarmi?',
    ar: 'هل يمكنك مساعدتي؟',
    hi: 'क्या आप मेरी मदद कर सकते हैं?',
    ru: 'Ты можешь мне помочь?'
  },
  'BATHROOM WHERE': {
    en: 'Where is the bathroom?',
    es: '¿Dónde está el baño?',
    fr: 'Où sont les toilettes ?',
    de: 'Wo ist die Toilette?',
    ja: 'お手洗いはどこですか？',
    zh: '洗手间在哪里？',
    pt: 'Onde fica o banheiro?',
    it: 'Dov\'è il bagno?',
    ar: 'أين الحمام؟',
    hi: 'शौचालय कहाँ है?',
    ru: 'Где туалет?'
  },
  'THANK YOU': {
    en: 'Thank you very much!',
    es: '¡Muchas gracias!',
    fr: 'Merci beaucoup !',
    de: 'Vielen Dank!',
    ja: 'ありがとうございます！',
    zh: '非常感谢！',
    pt: 'Muito obrigado!',
    it: 'Grazie mille!',
    ar: 'شكراً جزيلاً!',
    hi: 'बहुत बहुत धन्यवाद!',
    ru: 'Большое спасибо!'
  },
  'I LOVE YOU': {
    en: 'I love you!',
    es: '¡Te amo!',
    fr: 'Je t\'aime !',
    de: 'Ich liebe dich!',
    ja: '大好きです！',
    zh: '我爱你！',
    pt: 'Eu te amo!',
    it: 'Ti amo!',
    ar: 'أحبك!',
    hi: 'मैं तुमसे प्यार करता हूँ!',
    ru: 'Я люблю тебя!'
  },
  'HELLO': {
    en: 'Hello!',
    es: '¡Hola!',
    fr: 'Bonjour !',
    de: 'Hallo!',
    ja: 'こんにちは！',
    zh: '你好！',
    pt: 'Olá!',
    it: 'Ciao!',
    ar: 'مرحباً!',
    hi: 'नमस्ते!',
    ru: 'Здравствуйте!'
  },
  'GOODBYE': {
    en: 'Goodbye!',
    es: '¡Adiós!',
    fr: 'Au revoir !',
    de: 'Auf Wiedersehen!',
    ja: 'さようなら！',
    zh: '再见！',
    pt: 'Adeus!',
    it: 'Arrivederci!',
    ar: 'مع السلامة!',
    hi: 'अलविदा!',
    ru: 'До свидания!'
  },
  'YES': {
    en: 'Yes.',
    es: 'Sí.',
    fr: 'Oui.',
    de: 'Ja.',
    ja: 'はい。',
    zh: '是的。',
    pt: 'Sim.',
    it: 'Sì.',
    ar: 'نعم.',
    hi: 'हाँ।',
    ru: 'Да.'
  },
  'NO': {
    en: 'No.',
    es: 'No.',
    fr: 'Non.',
    de: 'Nein.',
    ja: 'いいえ。',
    zh: '不。',
    pt: 'Não.',
    it: 'No.',
    ar: 'لا.',
    hi: 'नहीं।',
    ru: 'Нет.'
  },
  'PLEASE': {
    en: 'Please.',
    es: 'Por favor.',
    fr: 'S\'il vous plaît.',
    de: 'Bitte.',
    ja: 'お願いします。',
    zh: '请。',
    pt: 'Por favor.',
    it: 'Per favore.',
    ar: 'من فضلك.',
    hi: 'कृपया।',
    ru: 'Пожалуйста.'
  }
};

/**
 * Reverse translation: Converts ASL Gloss sequence into target natural language
 */
export function translateAslGlossToLanguage(glosses: string[], targetLang = 'en'): string {
  if (!glosses || glosses.length === 0) return '';

  const clean = glosses.map(g => g.toUpperCase().replace(/[#_]/g, ' ').trim()).filter(Boolean);
  if (clean.length === 0) return '';

  const joined = clean.join(' ');
  const normalizedKey = joined === 'YOU HOW' ? 'HOW YOU'
    : joined === 'NAME WHAT YOU' ? 'YOUR NAME WHAT'
    : joined === 'HELP ME YOU' ? 'YOU HELP ME'
    : joined === 'THANK YOU MORE' ? 'THANK YOU'
    : joined;

  // Direct phrase match
  if (MULTILINGUAL_ASL_TRANSLATIONS[normalizedKey]) {
    const langMap = MULTILINGUAL_ASL_TRANSLATIONS[normalizedKey];
    if (langMap[targetLang]) return langMap[targetLang];
    if (langMap['en']) return langMap['en'];
  }

  // Check single words
  const singleMatch = clean.length === 1 && MULTILINGUAL_ASL_TRANSLATIONS[clean[0]];
  if (singleMatch && singleMatch[targetLang]) {
    return singleMatch[targetLang];
  }

  // Generic naturalizer
  let natural = joined.toLowerCase();
  natural = natural.charAt(0).toUpperCase() + natural.slice(1);
  return natural + '.';
}

/**
 * Backward compatibility wrapper for English translation
 */
export function translateAslGlossToEnglish(glosses: string[]): string {
  return translateAslGlossToLanguage(glosses, 'en');
}
