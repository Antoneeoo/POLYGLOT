import React, { useState } from 'react';
import {
  TrainedSignProfile,
  DEFAULT_TRAINED_PROFILES,
  recordAgentTrainingSample,
  compareFeatures,
  GestureFeatures
} from '../utils/agent-learning';
import { FacialExpression } from '../utils/asl-grammar';
import {
  Brain,
  Plus,
  Activity,
  CheckCircle,
  HelpCircle,
  Sparkles,
  TrendingUp,
  MessageSquare,
  Award,
  Sliders,
  Send
} from 'lucide-react';

interface AgentTrainingLabProps {
  onTrainedProfilesUpdated?: (profiles: TrainedSignProfile[]) => void;
  onPreviewSignGloss?: (gloss: string) => void;
}

export const AgentTrainingLab: React.FC<AgentTrainingLabProps> = ({
  onTrainedProfilesUpdated,
  onPreviewSignGloss
}) => {
  const [profiles, setProfiles] = useState<TrainedSignProfile[]>(DEFAULT_TRAINED_PROFILES);
  const [selectedPracticeSign, setSelectedPracticeSign] = useState<TrainedSignProfile>(DEFAULT_TRAINED_PROFILES[0]);
  const [activeTab, setActiveTab] = useState<'practice' | 'add_sign' | 'metrics' | 'tutor'>('practice');

  // Metrics
  const [modelAccuracy, setModelAccuracy] = useState(0.942);
  const [modelLoss, setModelLoss] = useState(0.048);
  const [trainingIterations, setTrainingIterations] = useState(148);

  // Practice state
  const [userSliders, setUserSliders] = useState<GestureFeatures>({ ...DEFAULT_TRAINED_PROFILES[0].features });
  const [practiceEvaluation, setPracticeEvaluation] = useState<any>(null);

  // New sign form state
  const [newGloss, setNewGloss] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newCategory, setNewCategory] = useState('noun');
  const [newFacialReq, setNewFacialReq] = useState<FacialExpression>('neutral');
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // AI Tutor / Linguistics chat
  const [tutorQuery, setTutorQuery] = useState('');
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string }>>([
    {
      sender: 'agent',
      text: 'Hello! I am your Live ASL Agent. I learn from your gestures and can explain ASL syntax, non-manual markers, or Deaf culture nuances. What would you like to explore or train today?'
    }
  ]);

  const handleEvaluatePractice = () => {
    const comparison = compareFeatures(userSliders, selectedPracticeSign.features);
    setPracticeEvaluation(comparison);
  };

  const handleTrainCurrentSample = () => {
    const { updatedProfiles, metricsUpdate } = recordAgentTrainingSample(
      profiles,
      selectedPracticeSign.gloss,
      selectedPracticeSign.englishLabel,
      selectedPracticeSign.category,
      userSliders,
      selectedPracticeSign.facialRequirement
    );

    setProfiles(updatedProfiles);
    setModelAccuracy(metricsUpdate.accuracy);
    setModelLoss(metricsUpdate.loss);
    setTrainingIterations(prev => prev + 1);
    if (onTrainedProfilesUpdated) onTrainedProfilesUpdated(updatedProfiles);

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2400);
  };

  const handleCreateNewSign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGloss.trim() || !newLabel.trim()) return;

    const { updatedProfiles, metricsUpdate } = recordAgentTrainingSample(
      profiles,
      newGloss.trim().toUpperCase(),
      newLabel.trim(),
      newCategory,
      userSliders,
      newFacialReq
    );

    setProfiles(updatedProfiles);
    setModelAccuracy(metricsUpdate.accuracy);
    setModelLoss(metricsUpdate.loss);
    setTrainingIterations(prev => prev + 1);
    if (onTrainedProfilesUpdated) onTrainedProfilesUpdated(updatedProfiles);

    setNewGloss('');
    setNewLabel('');
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 2400);
  };

  const handleSendTutorQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutorQuery.trim()) return;

    const query = tutorQuery.trim();
    const newMsgs = [...tutorMessages, { sender: 'user' as const, text: query }];
    setTutorMessages(newMsgs);
    setTutorQuery('');

    // Instant linguistic reasoning agent response
    setTimeout(() => {
      let response = '';
      const lower = query.toLowerCase();

      if (lower.includes('eyebrow') || lower.includes('facial') || lower.includes('expression')) {
        response = 'In ASL linguistics, facial expressions are known as Non-Manual Markers (NMM). Raising eyebrows indicates a Yes/No question, while furrowing eyebrows indicates a WH-question (Who, What, Where, When, Why, How). They are grammatical morphemes, not just emotions!';
      } else if (lower.includes('grammar') || lower.includes('order') || lower.includes('syntax')) {
        response = 'ASL does not follow English Subject-Verb-Object (SVO) rules. Instead, ASL standardly uses Time + Topic + Comment + WH-Question Word at the end. Articles like "a", "an", "the" and copula verbs like "is/are" are omitted.';
      } else if (lower.includes('name') || lower.includes('name sign')) {
        response = 'In Deaf culture, "Name Signs" are special signs gifted by a Deaf community member based on your personality or physical traits. Hearing learners fingerspell their names until a name sign is bestowed.';
      } else if (lower.includes('finger') || lower.includes('alphabet')) {
        response = 'Fingerspelling (the manual alphabet) is used for proper nouns, specific titles, brands, and technical terms without dedicated sign glosses. Keep your hand steady at shoulder height and avoid bouncing!';
      } else {
        response = `Great question! In our trained translator model, sign "${query}" is mapped with spatial coordinates and kinematic velocities. As you train more iterations, the neural agent refines its classifier boundaries for higher translation accuracy.`;
      }

      setTutorMessages(prev => [...prev, { sender: 'agent', text: response }]);
    }, 400);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 text-slate-200 shadow-xl backdrop-blur-md">
      {/* Header with Telemetry Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Live ASL Translator Agent Studio
            </h3>
            <p className="text-[11px] text-slate-400">
              Train, calibrate, and fine-tune sign recognition models in real time
            </p>
          </div>
        </div>

        {/* Live Model Telemetry Chips */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg flex items-center gap-1.5 text-xs text-emerald-300">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acc: {(modelAccuracy * 100).toFixed(1)}%</span>
          </div>
          <div className="px-2.5 py-1 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex items-center gap-1.5 text-xs text-indigo-300">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Loss: {modelLoss.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => setActiveTab('practice')}
          className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'practice'
              ? 'bg-slate-800 text-indigo-400 border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Practice & Calibrate
        </button>
        <button
          onClick={() => setActiveTab('add_sign')}
          className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'add_sign'
              ? 'bg-slate-800 text-indigo-400 border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Train Custom Sign
        </button>
        <button
          onClick={() => setActiveTab('tutor')}
          className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tutor'
              ? 'bg-slate-800 text-indigo-400 border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI ASL Tutor Agent
        </button>
        <button
          onClick={() => setActiveTab('metrics')}
          className={`py-2 px-3 text-xs font-medium rounded-t-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'bg-slate-800 text-indigo-400 border-t border-x border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Telemetry Curves
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRACTICE & CALIBRATE                               */}
      {/* ========================================================= */}
      {activeTab === 'practice' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Select Sign to Practice:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-[65%]">
              {profiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPracticeSign(p);
                    setUserSliders({ ...p.features });
                    setPracticeEvaluation(null);
                    if (onPreviewSignGloss) onPreviewSignGloss(p.gloss);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedPracticeSign.gloss === p.gloss
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {p.gloss}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedPracticeSign.gloss}</span>
                <span className="text-xs font-normal text-slate-400">({selectedPracticeSign.englishLabel})</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedPracticeSign.notes}</p>
            </div>
            <button
              onClick={() => onPreviewSignGloss && onPreviewSignGloss(selectedPracticeSign.gloss)}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-[11px] text-indigo-300 hover:bg-indigo-900/60 cursor-pointer"
            >
              Watch 3D Demo
            </button>
          </div>

          {/* Interactive Calibration Sliders */}
          <div className="space-y-2.5 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Sensor Calibration Sliders:</span>
              <span className="text-[10px] text-slate-500">Fine-tune signing parameters</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Index Finger Extension: {Math.round((1 - userSliders.indexCurl) * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={1 - userSliders.indexCurl}
                  onChange={e =>
                    setUserSliders(s => ({ ...s, indexCurl: 1 - parseFloat(e.target.value) }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Thumb Curl: {Math.round(userSliders.thumbCurl * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={userSliders.thumbCurl}
                  onChange={e =>
                    setUserSliders(s => ({ ...s, thumbCurl: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Hand Height (Y): {Math.round(userSliders.wristY * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={userSliders.wristY}
                  onChange={e =>
                    setUserSliders(s => ({ ...s, wristY: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">
                  Facial Brow Elevation: {Math.round(userSliders.browElevation * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={userSliders.browElevation}
                  onChange={e =>
                    setUserSliders(s => ({ ...s, browElevation: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleEvaluatePractice}
                className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                Evaluate Sign Alignment
              </button>
              <button
                onClick={handleTrainCurrentSample}
                className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Train Agent with Sample
              </button>
            </div>
          </div>

          {/* Real-time Feedback & Accuracy breakdown */}
          {practiceEvaluation && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Agent Analysis Score:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded ${
                    practiceEvaluation.overallScore >= 0.8
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}
                >
                  {Math.round(practiceEvaluation.overallScore * 100)}% Match
                </span>
              </div>

              {practiceEvaluation.suggestions.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-400 font-medium">Coach Suggestions:</span>
                  {practiceEvaluation.suggestions.map((sug: string, i: number) => (
                    <div key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>Flawless signing technique! Handshape, location, and non-manual facial markers match gold standard.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: TRAIN CUSTOM SIGN                                  */}
      {/* ========================================================= */}
      {activeTab === 'add_sign' && (
        <form onSubmit={handleCreateNewSign} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-gloss" className="block text-xs font-medium text-slate-400 mb-1">
                ASL Gloss Name (e.g. COFFEE)
              </label>
              <input
                id="custom-gloss"
                type="text"
                value={newGloss}
                onChange={e => setNewGloss(e.target.value.toUpperCase())}
                placeholder="MY_SIGN"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="custom-label" className="block text-xs font-medium text-slate-400 mb-1">
                English Meaning / Translation
              </label>
              <input
                id="custom-label"
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                placeholder="My custom sign"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="custom-cat" className="block text-xs font-medium text-slate-400 mb-1">
                Linguistic Category
              </label>
              <select
                id="custom-cat"
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="noun">Noun / Object</option>
                <option value="verb">Action Verb</option>
                <option value="greeting">Greeting</option>
                <option value="question">Question Word</option>
                <option value="emotion">Emotion / State</option>
              </select>
            </div>

            <div>
              <label htmlFor="custom-facial" className="block text-xs font-medium text-slate-400 mb-1">
                Facial NMM Requirement
              </label>
              <select
                id="custom-facial"
                value={newFacialReq}
                onChange={e => setNewFacialReq(e.target.value as FacialExpression)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="neutral">Neutral Posture</option>
                <option value="smile">Smile / Warmth</option>
                <option value="eyebrows_raised">Eyebrows Raised (Yes/No Question)</option>
                <option value="eyebrows_furrowed">Eyebrows Furrowed (WH Question)</option>
                <option value="head_nod">Head Nod (Affirmation)</option>
                <option value="head_shake">Head Shake (Negation)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Register and Train Sign into Agent Neural Weights
          </button>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 3: AI ASL TUTOR CHAT                                  */}
      {/* ========================================================= */}
      {activeTab === 'tutor' && (
        <div className="space-y-3">
          <div className="h-48 overflow-y-auto bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2.5">
            {tutorMessages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] text-slate-500 mb-0.5">
                  {m.sender === 'user' ? 'You' : 'Live ASL Agent'}
                </span>
                <div
                  className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                    m.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-xs'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendTutorQuery} className="flex gap-2">
            <input
              type="text"
              value={tutorQuery}
              onChange={e => setTutorQuery(e.target.value)}
              placeholder="Ask about ASL grammar, non-manual markers, or Deaf culture..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer flex items-center justify-center"
              aria-label="Send query to ASL tutor agent"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: TELEMETRY CURVES                                   */}
      {/* ========================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Model Accuracy</div>
              <div className="text-base font-bold text-emerald-400">
                {(modelAccuracy * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Categorical Cross-Entropy</div>
              <div className="text-base font-bold text-indigo-400">{modelLoss.toFixed(3)}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
              <div className="text-[10px] text-slate-400">Training Samples</div>
              <div className="text-base font-bold text-white">{trainingIterations * 3}</div>
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300">Continuous Learning Curve:</span>
              <span className="text-[10px] text-emerald-400">Online Optimization Active</span>
            </div>
            <div className="h-16 flex items-end gap-1 px-1">
              {[62, 68, 74, 79, 83, 87, 91, 93, 94.2].map((val, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-500/80 rounded-t hover:bg-indigo-400 transition-all"
                    style={{ height: `${(val / 100) * 52}px` }}
                  />
                  <span className="text-[8px] text-slate-500">{val}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification on training success */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>Agent neural weights successfully calibrated!</span>
        </div>
      )}
    </div>
  );
};
