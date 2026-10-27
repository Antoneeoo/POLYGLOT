import test from 'node:test';
import assert from 'node:assert/strict';
import { generateEmbedSnippets } from './polyglot-sdk';

test('generateEmbedSnippets generates valid iframe and script tags', () => {
  const snippets = generateEmbedSnippets('https://example.com');

  assert.ok(snippets.scriptTag.includes('polyglot-widget.js'));
  assert.ok(snippets.iframeSnippet.includes('allow="camera; microphone; display-capture"'));
  assert.ok(snippets.reactComponent.includes('PolyglotTranslatorEmbed'));
  assert.ok(snippets.reactNativeWebView.includes('react-native-webview'));
  assert.ok(snippets.flutterWebView.includes('webview_flutter'));
});
