import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeSentence,
  translateToAslGloss,
  translateAslGlossToEnglish,
  translateAslGlossToLanguage
} from './asl-grammar';

test('normalizeSentence handles multilingual greeting and questions', () => {
  const spanish = normalizeSentence('¡Hola! ¿Cómo estás?');
  assert.equal(spanish.isQuestion, true);
  assert.ok(spanish.normalized.includes('hello'));
  assert.ok(spanish.normalized.includes('how are you'));

  const french = normalizeSentence('Merci beaucoup!');
  assert.ok(french.normalized.includes('thank_you'));

  const negation = normalizeSentence("I don't understand sign language.");
  assert.equal(negation.isNegation, true);
});

test('translateToAslGloss converts questions into ASL gloss with NMM markers', () => {
  const result = translateToAslGloss('Where is the bathroom?');
  assert.equal(result.sentenceType, 'wh_question');
  assert.ok(result.facialGrammarSummary.includes('Furrow'));
  assert.ok(result.targetGloss.includes('WHERE'));

  const ynResult = translateToAslGloss('Can you help me?');
  assert.equal(ynResult.sentenceType, 'yes_no_question');
  assert.ok(ynResult.facialGrammarSummary.includes('Raise'));
});

test('translateToAslGloss handles fingerspelling for unknown proper nouns', () => {
  const result = translateToAslGloss('My name is Alice');
  const aliceToken = result.glossTokens.find(t => t.gloss === 'ALICE');
  assert.ok(aliceToken, 'Expected ALICE token');
  assert.equal(aliceToken.isFingerspelled, true);
  assert.deepEqual(aliceToken.letters, ['A', 'L', 'I', 'C', 'E']);
});

test('translateAslGlossToEnglish converts glosses into natural conversational English', () => {
  assert.equal(translateAslGlossToEnglish(['HOW', 'YOU']), 'How are you?');
  assert.equal(translateAslGlossToEnglish(['NICE', 'MEET', 'YOU']), 'Nice to meet you!');
  assert.equal(translateAslGlossToEnglish(['I_LOVE_YOU']), 'I love you!');
});

test('translateAslGlossToLanguage translates ASL glosses into target spoken languages', () => {
  assert.equal(translateAslGlossToLanguage(['HOW', 'YOU'], 'es'), '¿Cómo estás?');
  assert.equal(translateAslGlossToLanguage(['NICE', 'MEET', 'YOU'], 'fr'), 'Ravi de vous rencontrer !');
  assert.equal(translateAslGlossToLanguage(['HELLO'], 'de'), 'Hallo!');
  assert.equal(translateAslGlossToLanguage(['THANK', 'YOU'], 'ja'), 'ありがとうございます！');
  assert.equal(translateAslGlossToLanguage(['I', 'LOVE', 'YOU'], 'zh'), '我爱你！');
});
