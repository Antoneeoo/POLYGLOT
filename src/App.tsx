import React, { useState, useEffect, useRef } from 'react';
import { AvatarConfig, DEFAULT_AVATAR } from './types/avatar';
import { AvatarCanvas } from './components/AvatarCanvas';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { TranslatorPanel } from './components/TranslatorPanel';
import { AgentTrainingLab } from './components/AgentTrainingLab';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { IntegrationStudioModal } from './components/IntegrationStudioModal';
import {
  translateToAslGloss,
  TranslationResult,
  GlossToken
} from './utils/asl-grammar';
import {
  ASL_SIGN_DICTIONARY,
  getFingerspellPose,
  interpolateHand,
  interpolateFace,
  HandRigState,
  FacialRigState,
  REST_RIGHT_HAND,
  REST_LEFT_HAND,
  NEUTRAL_FACE
} from './utils/asl-signs';
import { User } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import {
  initAuth,
  db,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType
} from './services/firebase';
import { ContactsPanel } from './components/ContactsPanel';
import {
  Smartphone,
  Monitor,
  User as UserIcon,
  Sliders,
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Languages,
  CheckCircle2,
  Code2,
  Eye,
  ZoomIn,
  Users
} from 'lucide-react';

export default function App() {
  // Viewport mode: Web Studio vs Mobile Device App
  const [viewMode, setViewMode] = useState<'web' | 'mobile'>('web');
  const [activeTab, setActiveTab] = useState<'translate' | 'contacts' | 'avatar' | 'training'>('translate');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contactPrefillText, setContactPrefillText] = useState<string>('');

  // Avatar state & Face Visibility Framing
  const [framingMode, setFramingMode] = useState<'standard' | 'face_focus' | 'wide'>('standard');
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('polyglot_avatar_config');
      return saved ? JSON.parse(saved) : DEFAULT_AVATAR;
    } catch {
      return DEFAULT_AVATAR;
    }
  });
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sign Kinematics & Playback
  const [currentRightHand, setCurrentRightHand] = useState<HandRigState>(REST_RIGHT_HAND);
  const [currentLeftHand, setCurrentLeftHand] = useState<HandRigState>(REST_LEFT_HAND);
  const [currentFace, setCurrentFace] = useState<FacialRigState>(NEUTRAL_FACE);
  const [isSigning, setIsSigning] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);

  // Translation tokens
  const [currentResult, setCurrentResult] = useState<TranslationResult | null>(null);
  const [activeTokenIndex, setActiveTokenIndex] = useState(-1);
  const [activeGlossDisplay, setActiveGlossDisplay] = useState('');

  // Audio synthesis for haptic cues
  const playAudioTone = (freq = 440, duration = 0.08) => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Save avatar configuration changes
  const handleUpdateAvatarConfig = (newConfig: AvatarConfig) => {
    setAvatarConfig(newConfig);
    try {
      localStorage.setItem('polyglot_avatar_config', JSON.stringify(newConfig));
    } catch {
      // ignore
    }
  };

  // Sign playback engine
  const playbackTimeoutRef = useRef<any>(null);
  const playbackAbortedRef = useRef(false);

  const stopPlayback = () => {
    playbackAbortedRef.current = true;
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    setIsPlaying(false);
    setIsSigning(false);
    setActiveTokenIndex(-1);
    setActiveGlossDisplay('');
    setCurrentRightHand(REST_RIGHT_HAND);
    setCurrentLeftHand(REST_LEFT_HAND);
    setCurrentFace(NEUTRAL_FACE);
  };

  const playGlossSequence = async (tokens: GlossToken[], startIndex = 0) => {
    stopPlayback();
    if (!tokens.length) return;

    playbackAbortedRef.current = false;
    setIsPlaying(true);
    setIsSigning(true);

    for (let i = startIndex; i < tokens.length; i++) {
      if (playbackAbortedRef.current) break;

      const token = tokens[i];
      setActiveTokenIndex(i);
      setActiveGlossDisplay(token.gloss);
      playAudioTone(520, 0.05);

      const signDef = ASL_SIGN_DICTIONARY[token.gloss];

      if (signDef) {
        // Play articulated sign keyframe sequence
        const frames = signDef.frames;
        const totalDuration = (token.durationMs / playbackSpeed);
        const frameTime = totalDuration / frames.length;

        for (let f = 0; f < frames.length; f++) {
          if (playbackAbortedRef.current) break;
          const frame = frames[f];

          setCurrentRightHand(frame.rightHand);
          setCurrentLeftHand(frame.leftHand);

          // Blend token facial expression with base keyframe
          let faceState = { ...frame.face };
          if (token.facialExpression === 'eyebrows_raised') {
            faceState.browRaise = Math.max(faceState.browRaise, 0.85);
            faceState.headPitch = 0.08;
          } else if (token.facialExpression === 'eyebrows_furrowed') {
            faceState.browFurrow = Math.max(faceState.browFurrow, 0.85);
            faceState.headPitch = 0.06;
          } else if (token.facialExpression === 'head_shake') {
            faceState.headYaw = f % 2 === 0 ? 0.3 : -0.3;
          } else if (token.facialExpression === 'smile') {
            faceState.smile = Math.max(faceState.smile, 0.7);
          }

          setCurrentFace(faceState);

          await new Promise(r => {
            playbackTimeoutRef.current = setTimeout(r, frameTime);
          });
        }
      } else if (token.letters && token.letters.length > 0) {
        // Fingerspell sequence for unknown words or names
        const letterTime = (token.durationMs / token.letters.length / playbackSpeed);

        for (const letter of token.letters) {
          if (playbackAbortedRef.current) break;
          const handPose = getFingerspellPose(letter);
          setCurrentRightHand(handPose);
          setCurrentLeftHand(REST_LEFT_HAND);

          playAudioTone(640, 0.03);

          await new Promise(r => {
            playbackTimeoutRef.current = setTimeout(r, letterTime);
          });
        }
      }

      // Smooth co-articulation transition to next sign
      if (!playbackAbortedRef.current && i < tokens.length - 1) {
        const nextToken = tokens[i + 1];
        const nextSign = ASL_SIGN_DICTIONARY[nextToken.gloss];
        if (nextSign && nextSign.frames.length > 0) {
          // Pre-emptively co-articulate hands toward the starting frame of next sign
          const nextStart = nextSign.frames[0];
          setCurrentRightHand(r => ({
            ...r,
            x: (r.x + nextStart.rightHand.x) * 0.5,
            y: (r.y + nextStart.rightHand.y) * 0.5,
            z: (r.z + nextStart.rightHand.z) * 0.5
          }));
        }
        await new Promise(r => {
          playbackTimeoutRef.current = setTimeout(r, Math.min(100, token.pauseAfterMs / playbackSpeed));
        });
      }
    }

    if (!playbackAbortedRef.current) {
      // Natural return to rest pose
      setActiveGlossDisplay('');
      setIsSigning(false);
      setCurrentRightHand(REST_RIGHT_HAND);
      setCurrentLeftHand(REST_LEFT_HAND);
      setCurrentFace(NEUTRAL_FACE);
      setIsPlaying(false);
    }
  };

  const handleTranslateTokens = (tokens: GlossToken[], result: TranslationResult) => {
    setCurrentResult(result);
    playGlossSequence(tokens, 0);
  };

  const handlePreviewDirectSign = (gloss: string) => {
    const signDef = ASL_SIGN_DICTIONARY[gloss];
    if (signDef) {
      const token: GlossToken = {
        id: `preview-${gloss}`,
        originalWord: gloss.toLowerCase(),
        gloss,
        isFingerspelled: false,
        facialExpression: 'neutral',
        durationMs: signDef.defaultDurationMs,
        pauseAfterMs: 150
      };
      playGlossSequence([token]);
    }
  };

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else if (currentResult && currentResult.glossTokens.length > 0) {
      playGlossSequence(currentResult.glossTokens, 0);
    }
  };

  const handleReplay = () => {
    if (currentResult && currentResult.glossTokens.length > 0) {
      playGlossSequence(currentResult.glossTokens, 0);
    }
  };

  // Auth and Firestore Connection Validation
  useEffect(() => {
    testFirestoreConnection();
    const unsubscribe = initAuth(
      user => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save Translation to Firestore
  const handleSaveToFirestore = async (originalText: string, gloss: string): Promise<boolean> => {
    if (!currentUser) return false;
    const id = `msg-${Date.now()}`;
    const path = `users/${currentUser.uid}/savedMessages/${id}`;
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'users', currentUser.uid, 'savedMessages', id), {
        id,
        userId: currentUser.uid,
        recipientName: 'General Practice',
        originalText,
        aslGloss: gloss,
        category: 'ASL Translation',
        createdAt: now,
        updatedAt: now
      });
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      return false;
    }
  };

  // Fingerspell a contact name on the 3D Avatar
  const handleFingerspellContact = (name: string) => {
    const clean = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
    if (!clean) return;
    const token: GlossToken = {
      id: `fingerspell-${clean}`,
      originalWord: clean,
      gloss: clean,
      isFingerspelled: true,
      letters: clean.split(''),
      facialExpression: 'smile',
      durationMs: Math.max(800, clean.length * 360),
      pauseAfterMs: 200
    };
    playGlossSequence([token]);
  };

  // Compose and trigger ASL greeting for a selected contact
  const handleSendContactGreeting = (greeting: string, _recipientName: string) => {
    setContactPrefillText(greeting);
    setActiveTab('translate');
    const result = translateToAslGloss(greeting, 'en');
    handleTranslateTokens(result.glossTokens, result);
  };

  // Replay arbitrary ASL gloss sequence from saved messages
  const handlePlayGlossString = (glossStr: string) => {
    const glosses = glossStr.trim().split(/\s+/);
    const tokens: GlossToken[] = glosses.map((g, idx) => {
      const isFingerspell = g.startsWith('#');
      const cleanGloss = isFingerspell ? g.slice(1) : g;
      return {
        id: `token-${idx}-${cleanGloss}`,
        originalWord: cleanGloss.toLowerCase(),
        gloss: cleanGloss,
        isFingerspelled: isFingerspell,
        letters: isFingerspell ? cleanGloss.split('') : undefined,
        facialExpression: 'neutral',
        durationMs: 700,
        pauseAfterMs: 120
      };
    });
    playGlossSequence(tokens);
  };

  // Main interactive stage with 3D avatar viewport and overlay HUD
  const renderAvatarStage = (isMobile = false) => {
    return (
      <div
        className={`relative w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col ${
          isMobile ? 'h-[360px]' : 'h-[460px] lg:h-[540px]'
        }`}
      >
        {/* 3D Canvas */}
        <AvatarCanvas
          avatarConfig={avatarConfig}
          targetRightHand={currentRightHand}
          targetLeftHand={currentLeftHand}
          targetFace={currentFace}
          isSigning={isSigning}
          activeGloss={activeGlossDisplay}
          framingMode={framingMode}
          className="w-full h-full"
        />

        {/* Top Header HUD Badge */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10 flex-wrap gap-2">
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-xs border border-slate-700/60 px-3 py-1.5 rounded-xl pointer-events-auto shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold text-white tracking-wide">
              {avatarConfig.name || 'Sign Avatar'}
            </span>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
              3D PBR Rig
            </span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Camera Framing Toggle: Face Focus vs Full Body View */}
            <div className="flex items-center bg-slate-900/90 border border-slate-700/70 p-0.5 rounded-xl">
              <button
                onClick={() => setFramingMode('face_focus')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  framingMode === 'face_focus'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Zoom into face for high-detail facial expressions and mouth morphemes"
              >
                <Eye className="w-3 h-3 text-indigo-300" />
                <span>Face Focus</span>
              </button>
              <button
                onClick={() => setFramingMode('standard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  framingMode === 'standard'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
                title="Standard view showing head, face, and signing hands"
              >
                <ZoomIn className="w-3 h-3 text-slate-400" />
                <span>Full View</span>
              </button>
            </div>

            <button
              onClick={() => setIsCustomizerOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium backdrop-blur-xs transition-colors cursor-pointer shadow-md"
              aria-label="Customize 3D Avatar looks"
            >
              <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Customize</span>
            </button>
            <button
              onClick={() => setSoundEnabled(s => !s)}
              className="p-1.5 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/70 text-slate-300 rounded-xl transition-colors cursor-pointer"
              title={soundEnabled ? 'Disable haptic sound cues' : 'Enable sound cues'}
              aria-label={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* Active Gloss Banner Overlay */}
        {activeGlossDisplay && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-indigo-950/90 border border-indigo-500/50 backdrop-blur-md px-4 py-1.5 rounded-xl shadow-xl flex items-center gap-2 animate-bounce">
              <span className="text-xs text-indigo-300 uppercase tracking-widest font-mono font-medium">Signing:</span>
              <span className="text-sm font-black text-white tracking-wider font-mono">
                {activeGlossDisplay}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Application Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                POLYGLOT
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  Universal ASL & All Languages
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Universal Real-Time ASL Translator, Expressive 3D Avatar, AI Training & Phone/Web Integration
              </p>
            </div>
          </div>

          {/* Desktop Navigation & View Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Embed & Integration Hub Button */}
            <button
              onClick={() => setIsIntegrationOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/30 hover:border-indigo-500/60 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              title="Integrate POLYGLOT into any website, iOS/Android mobile app, phone permissions, or backend APIs"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Integration &amp; SDKs</span>
            </button>

            {/* View Mode Toggle: Web Studio vs Mobile Device Frame */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('web')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'web'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Desktop Studio View"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Web Studio</span>
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  viewMode === 'mobile'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                aria-label="Mobile App View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mobile App View</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col gap-6">
        {/* ========================================================= */}
        {/* VIEW 1: DESKTOP WEB STUDIO VIEW                           */}
        {/* ========================================================= */}
        {viewMode === 'web' && (
          <div className="space-y-6">
            {/* Navigation Tabs for Studio */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <nav className="flex items-center gap-2 flex-wrap" aria-label="Main studio tabs">
                <button
                  onClick={() => setActiveTab('translate')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'translate'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Live Translator & 3D Avatar
                </button>
                <button
                  onClick={() => setActiveTab('contacts')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'contacts'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  Google Contacts &amp; ASL Messages
                </button>
                <button
                  onClick={() => setActiveTab('training')}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'training'
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Agent Training Lab & AI Tutor
                </button>
                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Customize Avatar
                </button>
              </nav>

              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Multilingual Neural Pipeline Online</span>
              </div>
            </div>

            {/* TAB 1: TRANSLATOR & 3D AVATAR DUAL-STAGE */}
            {activeTab === 'translate' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: 3D Humanoid Avatar Viewport */}
                <div className="lg:col-span-7 flex flex-col gap-3">
                  {renderAvatarStage(false)}

                  {/* Core ASL Signs Palette */}
                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Quick Core Signs Dictionary:
                      </span>
                      <span className="text-[10px] text-slate-500">Tap to animate avatar</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(ASL_SIGN_DICTIONARY).map(gloss => (
                        <button
                          key={gloss}
                          onClick={() => handlePreviewDirectSign(gloss)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-600 hover:text-white border border-slate-700/60 text-xs text-slate-300 transition-all cursor-pointer"
                        >
                          {gloss}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Bidirectional Translator Panel */}
                <div className="lg:col-span-5">
                  <TranslatorPanel
                    onTranslateGlossTokens={handleTranslateTokens}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                    onReplay={handleReplay}
                    playbackSpeed={playbackSpeed}
                    onChangeSpeed={setPlaybackSpeed}
                    activeTokenIndex={activeTokenIndex}
                    currentResult={currentResult}
                    onSimulateSignMatch={match => {
                      handlePreviewDirectSign(match.gloss);
                    }}
                    currentUser={currentUser}
                    onSaveToFirestore={handleSaveToFirestore}
                    externalInputText={contactPrefillText}
                  />
                </div>
              </div>
            )}

            {/* TAB: GOOGLE CONTACTS & ASL MESSAGING */}
            {activeTab === 'contacts' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 flex flex-col gap-3">
                  {renderAvatarStage(false)}
                  <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
                    <span>Select any contact to fingerspell their name or trigger custom translated ASL greetings with the 3D avatar.</span>
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <ContactsPanel
                    currentUser={currentUser}
                    onSendToTranslator={handleSendContactGreeting}
                    onFingerspellName={handleFingerspellContact}
                    onPlayGloss={handlePlayGlossString}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: AGENT TRAINING LAB */}
            {activeTab === 'training' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6">
                  {renderAvatarStage(false)}
                </div>
                <div className="lg:col-span-6">
                  <AgentTrainingLab
                    onPreviewSignGloss={handlePreviewDirectSign}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: MOBILE APP DEVICE VIEW                            */}
        {/* ========================================================= */}
        {viewMode === 'mobile' && (
          <MobileDeviceFrame
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            appName="POLYGLOT"
          >
            <div className="p-3.5 space-y-4">
              {/* 3D Avatar stage inside mobile device */}
              {renderAvatarStage(true)}

              {/* Mobile Tab Content */}
              {activeTab === 'translate' && (
                <TranslatorPanel
                  onTranslateGlossTokens={handleTranslateTokens}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                  onReplay={handleReplay}
                  playbackSpeed={playbackSpeed}
                  onChangeSpeed={setPlaybackSpeed}
                  activeTokenIndex={activeTokenIndex}
                  currentResult={currentResult}
                  onSimulateSignMatch={match => {
                    handlePreviewDirectSign(match.gloss);
                  }}
                  currentUser={currentUser}
                  onSaveToFirestore={handleSaveToFirestore}
                  externalInputText={contactPrefillText}
                />
              )}

              {activeTab === 'contacts' && (
                <ContactsPanel
                  currentUser={currentUser}
                  onSendToTranslator={handleSendContactGreeting}
                  onFingerspellName={handleFingerspellContact}
                  onPlayGloss={handlePlayGlossString}
                />
              )}

              {activeTab === 'avatar' && (
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
                  <h3 className="text-sm font-bold text-white">Avatar Appearance</h3>
                  <p className="text-xs text-slate-400">
                    Currently styling: <span className="text-indigo-400 font-semibold">{avatarConfig.name}</span>
                  </p>
                  <button
                    onClick={() => setIsCustomizerOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Open Avatar Studio Customizer
                  </button>
                </div>
              )}

              {activeTab === 'training' && (
                <AgentTrainingLab
                  onPreviewSignGloss={handlePreviewDirectSign}
                />
              )}
            </div>
          </MobileDeviceFrame>
        )}
      </main>

      {/* Avatar Customizer Modal */}
      <AvatarCustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        config={avatarConfig}
        onChangeConfig={handleUpdateAvatarConfig}
        onPreviewFace={setCurrentFace}
      />

      {/* Universal Integration Studio Modal (Web, Mobile iOS/Android, Permissions, REST APIs) */}
      <IntegrationStudioModal
        isOpen={isIntegrationOpen}
        onClose={() => setIsIntegrationOpen(false)}
      />
    </div>
  );
}
