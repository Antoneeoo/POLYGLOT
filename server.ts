import express, { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));

// Initialize Gemini client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  } catch (err) {
    console.warn('Gemini client init skipped:', err);
  }
}

// Audio Transcription endpoint using gemini-3.5-transcribe
app.post('/api/transcribe-audio', async (req: Request, res: Response) => {
  const { audioData, mimeType } = req.body;
  if (!audioData) {
    return res.status(400).json({ error: 'Missing audioData parameter' });
  }

  if (aiClient) {
    try {
      const audioPart = {
        inlineData: {
          mimeType: mimeType || 'audio/webm',
          data: audioData
        }
      };

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: 'Transcribe this audio precisely into text.' }
          ]
        }
      });

      return res.json({ success: true, text: response.text || '' });
    } catch (err) {
      console.warn('Gemini transcribe-audio error:', err);
    }
  }

  return res.json({ success: false, fallback: true, error: 'AI transcription service unavailable' });
});

// Vision ASL Recognition & Translation endpoint using gemini-3.8-flash
app.post('/api/see-asl', async (req: Request, res: Response) => {
  const { imageData, targetLanguage = 'English' } = req.body;
  if (!imageData) {
    return res.status(400).json({ error: 'Missing imageData parameter' });
  }

  if (aiClient) {
    try {
      const cleanBase64 = imageData.replace(/^data:image\/\w+;base64,/, '');
      const imagePart = {
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      };

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            imagePart,
            {
              text: `You are an expert ASL (American Sign Language) vision recognition system.
Analyze this camera video frame of a person signing ASL.
Identify:
1. Handshape and finger configuration (e.g. 1-handshape, flat-B, fist-S, ILY, open-5)
2. Hand location relative to face/chest signing window
3. Facial Non-Manual Markers (eyebrows raised for question, furrowed, neutral, smile)
4. Identified ASL Gloss sign (e.g., HELLO, THANK_YOU, HOW, YOU, YES, NO, HELP, I_LOVE_YOU, NAME, etc.)
5. Translation into natural ${targetLanguage}.

Return strictly JSON with this format:
{
  "identifiedSign": "GLOSS_NAME",
  "confidence": 0.95,
  "handshape": "description of fingers",
  "location": "location in space",
  "facialExpression": "eyebrows_raised | eyebrows_furrowed | smile | neutral | head_shake | head_nod",
  "translatedText": "Natural sentence translation in ${targetLanguage}",
  "coachingFeedback": "Tips on how to improve this sign's clarity"
}`
            }
          ]
        }
      });

      const text = response.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return res.json({ success: true, ...parsed });
      }
    } catch (err) {
      console.warn('Gemini see-asl error:', err);
    }
  }

  return res.json({
    success: false,
    fallback: true,
    error: 'Visual ASL recognition service unavailable'
  });
});

// Translation endpoint
app.post('/api/translate', async (req: Request, res: Response) => {
  const { text, sourceLang, targetLang } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing text parameter' });
  }

  // Enhanced ASL Gloss & Deaf culture linguistic analysis using gemini-3.8-flash
  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are an expert ASL (American Sign Language) linguist and certified interpreter.
Translate the following sentence into accurate ASL Gloss notation with Non-Manual Markers (facial expressions, head tilts, and eyebrow movements).
Sentence: "${text}"
Source Language: ${sourceLang || 'auto'}
Target: ASL Gloss & English

Return JSON with this schema:
{
  "aslGloss": "string (ALL-CAPS ASL gloss words separated by spaces, fingerspelled names preceded by #)",
  "sentenceType": "statement | yes_no_question | wh_question | negation | greeting",
  "facialGrammarSummary": "detailed instructions for eyebrows, head tilt, and mouth morphemes",
  "culturalNote": "concise Deaf culture and linguistic nuance note"
}`
      });

      const responseText = response.text || '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return res.json({ success: true, ...parsed });
      }
    } catch (err) {
      console.warn('Gemini translation fallback:', err);
    }
  }

  // Fallback response handled gracefully
  return res.json({
    success: true,
    fallback: true,
    sourceText: text
  });
});

// Search Grounding endpoint using gemini-3.8-flash with googleSearch tool
app.post('/api/grounded-search', async (req: Request, res: Response) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  if (aiClient) {
    try {
      const response = await aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `You are the POLYGLOT Live ASL & Linguistics Research Agent.
Answer this question with grounded, up-to-date facts about sign languages, Deaf culture, regional variations, or accessibility tech.
Question: "${query}"`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      const searchQueries = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      return res.json({
        success: true,
        answer: response.text || '',
        searchQueries,
        sources
      });
    } catch (err) {
      console.warn('Google Search Grounding error:', err);
    }
  }

  return res.json({
    success: true,
    fallback: true,
    answer: `POLYGLOT Grounded Knowledge: ASL is a complete, natural language with its own grammar separate from English. Signs vary regionally across the US and internationally (e.g. BSL, LSF, Auslan).`,
    searchQueries: [query],
    sources: []
  });
});

// Universal Integration Health & OpenAPI Spec endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    appName: 'POLYGLOT',
    version: '2.4.0',
    capabilities: [
      'bidirectional_asl_translation',
      'live_vision_landmark_tracking',
      'live_audio_transcription',
      'grounded_search',
      '3d_avatar_rendering',
      'phone_permissions_bridge'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get(
      '*',
      rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 100,
        standardHeaders: true,
        legacyHeaders: false
      }),
      (_req, res) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      }
    );
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`POLYGLOT server running at http://localhost:${PORT}`);
  });
}

startServer();
