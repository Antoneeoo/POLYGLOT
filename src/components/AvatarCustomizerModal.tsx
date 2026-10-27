import React, { useState } from 'react';
import {
  AvatarConfig,
  SKIN_TONE_PRESETS,
  HAIR_COLOR_PRESETS,
  OUTFIT_COLOR_PRESETS,
  EYE_COLOR_PRESETS
} from '../types/avatar';
import { FacialRigState, NEUTRAL_FACE } from '../utils/asl-signs';
import { X, Sparkles, Check, User, Smile, HelpCircle, Eye, Glasses, Shirt } from 'lucide-react';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AvatarConfig;
  onChangeConfig: (newConfig: AvatarConfig) => void;
  onPreviewFace: (face: FacialRigState) => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onPreviewFace
}) => {
  const [activeTab, setActiveTab] = useState<'looks' | 'expressions' | 'clothing'>('looks');

  if (!isOpen) return null;

  const handleRandomize = () => {
    const randomSkin = SKIN_TONE_PRESETS[Math.floor(Math.random() * SKIN_TONE_PRESETS.length)].hex;
    const randomHair = HAIR_COLOR_PRESETS[Math.floor(Math.random() * HAIR_COLOR_PRESETS.length)].hex;
    const hairStyles: AvatarConfig['hairStyle'][] = ['fade', 'short_curly', 'sleek_back', 'long_wavy', 'bob', 'buzz'];
    const randomStyle = hairStyles[Math.floor(Math.random() * hairStyles.length)];
    const outfitColors = OUTFIT_COLOR_PRESETS[Math.floor(Math.random() * OUTFIT_COLOR_PRESETS.length)].hex;
    const eyeColors = EYE_COLOR_PRESETS[Math.floor(Math.random() * EYE_COLOR_PRESETS.length)].hex;
    const glassesStyles: AvatarConfig['glasses'][] = ['none', 'modern_round', 'classic_square'];
    const randomGlasses = glassesStyles[Math.floor(Math.random() * glassesStyles.length)];

    onChangeConfig({
      ...config,
      skinTone: randomSkin,
      hairColor: randomHair,
      hairStyle: randomStyle,
      outfitColor: outfitColors,
      eyeColor: eyeColors,
      glasses: randomGlasses
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-modal-title"
    >
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="avatar-modal-title" className="text-lg font-semibold text-white">
                Customize 3D ASL Avatar
              </h2>
              <p className="text-xs text-slate-400">
                Personalize visual identity, hair, clothing, and test expressive facial grammar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              aria-label="Randomize avatar look"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Randomize
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close customizer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/50">
          <button
            onClick={() => setActiveTab('looks')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'looks'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            Appearance & Face
          </button>
          <button
            onClick={() => setActiveTab('clothing')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'clothing'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shirt className="w-4 h-4" />
            Outfit & Accessories
          </button>
          <button
            onClick={() => setActiveTab('expressions')}
            className={`py-3 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'expressions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smile className="w-4 h-4" />
            Expressive Gestures & NMM
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {activeTab === 'looks' && (
            <div className="space-y-6">
              {/* Avatar Name */}
              <div>
                <label htmlFor="avatar-name-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Avatar Identifier
                </label>
                <input
                  id="avatar-name-input"
                  type="text"
                  value={config.name}
                  onChange={e => onChangeConfig({ ...config, name: e.target.value })}
                  placeholder="e.g. Maya"
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Skin Tone */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Skin Tone
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                  {SKIN_TONE_PRESETS.map(preset => {
                    const isSelected = config.skinTone.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onChangeConfig({ ...config, skinTone: preset.hex })}
                        className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/40'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                        aria-label={`Skin tone: ${preset.label}`}
                      >
                        <span
                          className="w-7 h-7 rounded-full shadow-inner border border-white/20 flex items-center justify-center"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-900" />}
                        </span>
                        <span className="text-[10px] text-slate-300 font-medium truncate w-full">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Hair Style */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Hair Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'short_curly', label: 'Curly Coils' },
                    { id: 'fade', label: 'Textured Fade' },
                    { id: 'sleek_back', label: 'Sleek Back' },
                    { id: 'long_wavy', label: 'Long Waves' },
                    { id: 'bob', label: 'Classic Bob' },
                    { id: 'buzz', label: 'Buzz Cut' }
                  ].map(style => (
                    <button
                      key={style.id}
                      onClick={() => onChangeConfig({ ...config, hairStyle: style.id as any })}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                        config.hairStyle === style.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Hair Color
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {HAIR_COLOR_PRESETS.map(preset => {
                    const isSelected = config.hairColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onChangeConfig({ ...config, hairColor: preset.hex })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/40'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                        aria-label={`Hair color: ${preset.label}`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-[10px] text-slate-300 truncate w-full text-center">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eye Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Eye Color
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {EYE_COLOR_PRESETS.map(preset => {
                    const isSelected = config.eyeColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onChangeConfig({ ...config, eyeColor: preset.hex })}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                            : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-4 h-4 rounded-full border border-white/20 shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-xs truncate">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'clothing' && (
            <div className="space-y-6">
              {/* Outfit Color */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Apparel Color Theme
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {OUTFIT_COLOR_PRESETS.map(preset => {
                    const isSelected = config.outfitColor.toLowerCase() === preset.hex.toLowerCase();
                    return (
                      <button
                        key={preset.id}
                        onClick={() => onChangeConfig({ ...config, outfitColor: preset.hex })}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/40'
                            : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                        }`}
                        aria-label={`Outfit color: ${preset.label}`}
                      >
                        <span
                          className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center"
                          style={{ backgroundColor: preset.hex }}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-[10px] text-slate-300 truncate w-full text-center">
                          {preset.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Eyeglasses */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                  Eyewear
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'No Glasses' },
                    { id: 'modern_round', label: 'Round Frames' },
                    { id: 'classic_square', label: 'Classic Frames' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => onChangeConfig({ ...config, glasses: item.id as any })}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer flex items-center gap-2 ${
                        config.glasses === item.id
                          ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300'
                          : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <Glasses className="w-4 h-4 shrink-0 text-slate-400" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'expressions' && (
            <div className="space-y-4">
              <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-200">
                <p className="font-semibold mb-1">Non-Manual Markers (NMM) in ASL:</p>
                In ASL linguistics, facial expressions are not merely decorative feelings—they are essential grammatical morphemes that alter sentence syntax, questions, and negation.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() =>
                    onPreviewFace({
                      ...NEUTRAL_FACE,
                      smile: 0.8,
                      headPitch: 0.05
                    })
                  }
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <Smile className="w-4 h-4 text-emerald-400" />
                    Warm Greeting (Smile)
                  </div>
                  <p className="text-xs text-slate-400">
                    Used for HELLO, THANK YOU, WELCOME, and polite affirmation.
                  </p>
                </button>

                <button
                  onClick={() =>
                    onPreviewFace({
                      ...NEUTRAL_FACE,
                      browRaise: 0.9,
                      headPitch: 0.12
                    })
                  }
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <Eye className="w-4 h-4 text-blue-400" />
                    Yes/No Question (q:yn)
                  </div>
                  <p className="text-xs text-slate-400">
                    Eyebrows raised, eyes widened, head tilted slightly forward.
                  </p>
                </button>

                <button
                  onClick={() =>
                    onPreviewFace({
                      ...NEUTRAL_FACE,
                      browFurrow: 0.9,
                      headPitch: 0.08,
                      mouthOpen: 0.1
                    })
                  }
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <HelpCircle className="w-4 h-4 text-amber-400" />
                    WH-Question (q:wh)
                  </div>
                  <p className="text-xs text-slate-400">
                    Eyebrows furrowed down and in for WHAT, WHERE, WHO, WHEN, WHY, HOW.
                  </p>
                </button>

                <button
                  onClick={() =>
                    onPreviewFace({
                      ...NEUTRAL_FACE,
                      headYaw: 0.35,
                      browFurrow: 0.35
                    })
                  }
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-white mb-1">
                    <X className="w-4 h-4 text-rose-400" />
                    Negation (Head Shake)
                  </div>
                  <p className="text-xs text-slate-400">
                    Head shakes side to side throughout NOT, NO, NEVER, DON'T.
                  </p>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => onPreviewFace(NEUTRAL_FACE)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Reset to Neutral
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <div className="text-xs text-slate-400">
            Appearance saved automatically to your profile
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            Done Customizing
          </button>
        </div>
      </div>
    </div>
  );
};
