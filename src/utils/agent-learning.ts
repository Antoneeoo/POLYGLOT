/**
 * Live ASL Translator Agent Training & Learning Engine
 * Handles feature extraction, landmark pattern matching, agent fine-tuning,
 * accuracy scoring, and pedagogical feedback for ASL learners.
 */

import { FacialExpression } from './asl-grammar';

export interface GestureFeatures {
  // Finger curl values [0 (open) to 1 (closed)]
  thumbCurl: number;
  indexCurl: number;
  middleCurl: number;
  ringCurl: number;
  pinkyCurl: number;
  // Wrist position normalized to camera frame [-1 to 1]
  wristX: number;
  wristY: number;
  wristZ: number;
  // Movement velocity vector
  velocityX: number;
  velocityY: number;
  // Hand orientation
  palmPitch: number;
  palmYaw: number;
  palmRoll: number;
  // Facial markers
  browElevation: number; // 0 (furrowed) to 1 (raised)
  mouthAperture: number; // 0 (closed) to 1 (open)
  smileDegree: number;   // 0 to 1
  headNodRate: number;   // affirmative / negative head movement
}

export interface TrainedSignProfile {
  id: string;
  gloss: string;
  englishLabel: string;
  category: string;
  samplesCount: number;
  features: GestureFeatures;
  confidenceThreshold: number;
  facialRequirement: FacialExpression;
  userCreated?: boolean;
  notes?: string;
}

export interface RecognitionMatch {
  gloss: string;
  englishLabel: string;
  confidence: number; // 0 to 1
  isAboveThreshold: boolean;
  featureScores: {
    handshape: number;
    location: number;
    movement: number;
    facial: number;
  };
  feedbackSuggestions: string[];
}

export interface TrainingMetrics {
  totalSignsTrained: number;
  totalTrainingSamples: number;
  averageAccuracy: number;
  currentLoss: number;
  epochHistory: { epoch: number; accuracy: number; loss: number }[];
}

// Baseline pre-trained model signs
export const DEFAULT_TRAINED_PROFILES: TrainedSignProfile[] = [
  {
    id: 'sign-hello',
    gloss: 'HELLO',
    englishLabel: 'Hello / Hi',
    category: 'greeting',
    samplesCount: 42,
    confidenceThreshold: 0.72,
    facialRequirement: 'smile',
    features: {
      thumbCurl: 0.1, indexCurl: 0.05, middleCurl: 0.05, ringCurl: 0.05, pinkyCurl: 0.05,
      wristX: 0.35, wristY: 0.65, wristZ: 0.45,
      velocityX: 0.25, velocityY: -0.1,
      palmPitch: 0.2, palmYaw: -0.3, palmRoll: 0.1,
      browElevation: 0.6, mouthAperture: 0.2, smileDegree: 0.7, headNodRate: 0.1
    },
    notes: 'Salute outward from forehead with friendly smile.'
  },
  {
    id: 'sign-thank-you',
    gloss: 'THANK_YOU',
    englishLabel: 'Thank you',
    category: 'courtesy',
    samplesCount: 50,
    confidenceThreshold: 0.75,
    facialRequirement: 'smile',
    features: {
      thumbCurl: 0.1, indexCurl: 0.05, middleCurl: 0.05, ringCurl: 0.05, pinkyCurl: 0.05,
      wristX: 0.1, wristY: 0.45, wristZ: 0.5,
      velocityX: 0.1, velocityY: -0.2,
      palmPitch: 0.5, palmYaw: -0.1, palmRoll: 0.0,
      browElevation: 0.5, mouthAperture: 0.25, smileDegree: 0.75, headNodRate: 0.2
    },
    notes: 'Touch chin/lips and arc outward toward conversational partner.'
  },
  {
    id: 'sign-yes',
    gloss: 'YES',
    englishLabel: 'Yes',
    category: 'courtesy',
    samplesCount: 38,
    confidenceThreshold: 0.70,
    facialRequirement: 'head_nod',
    features: {
      thumbCurl: 0.8, indexCurl: 1.0, middleCurl: 1.0, ringCurl: 1.0, pinkyCurl: 1.0,
      wristX: 0.2, wristY: 0.3, wristZ: 0.35,
      velocityX: 0.0, velocityY: 0.4,
      palmPitch: 0.3, palmYaw: -0.2, palmRoll: 0.0,
      browElevation: 0.55, mouthAperture: 0.1, smileDegree: 0.4, headNodRate: 0.6
    },
    notes: 'S-fist nodding up and down like affirmative head motion.'
  },
  {
    id: 'sign-no',
    gloss: 'NO',
    englishLabel: 'No',
    category: 'courtesy',
    samplesCount: 36,
    confidenceThreshold: 0.72,
    facialRequirement: 'head_shake',
    features: {
      thumbCurl: 0.5, indexCurl: 0.7, middleCurl: 0.7, ringCurl: 0.95, pinkyCurl: 0.95,
      wristX: 0.2, wristY: 0.35, wristZ: 0.38,
      velocityX: 0.0, velocityY: -0.15,
      palmPitch: 0.25, palmYaw: -0.25, palmRoll: 0.0,
      browElevation: 0.3, mouthAperture: 0.05, smileDegree: 0.05, headNodRate: -0.5
    },
    notes: 'Snap index and middle fingers down to thumb with slight head shake.'
  },
  {
    id: 'sign-how',
    gloss: 'HOW',
    englishLabel: 'How',
    category: 'question',
    samplesCount: 30,
    confidenceThreshold: 0.68,
    facialRequirement: 'eyebrows_furrowed',
    features: {
      thumbCurl: 0.1, indexCurl: 0.2, middleCurl: 0.2, ringCurl: 0.2, pinkyCurl: 0.2,
      wristX: 0.15, wristY: 0.2, wristZ: 0.45,
      velocityX: 0.2, velocityY: 0.1,
      palmPitch: -0.3, palmYaw: -0.2, palmRoll: 0.4,
      browElevation: 0.15, mouthAperture: 0.2, smileDegree: 0.1, headNodRate: 0.0
    },
    notes: 'Roll curved hands forward into palms-up with furrowed brows.'
  },
  {
    id: 'sign-you',
    gloss: 'YOU',
    englishLabel: 'You',
    category: 'pronoun',
    samplesCount: 45,
    confidenceThreshold: 0.78,
    facialRequirement: 'neutral',
    features: {
      thumbCurl: 0.8, indexCurl: 0.0, middleCurl: 1.0, ringCurl: 1.0, pinkyCurl: 1.0,
      wristX: 0.15, wristY: 0.3, wristZ: 0.6,
      velocityX: 0.05, velocityY: 0.0,
      palmPitch: 0.1, palmYaw: 0.0, palmRoll: 0.0,
      browElevation: 0.5, mouthAperture: 0.05, smileDegree: 0.2, headNodRate: 0.05
    },
    notes: 'Direct 1-pointing index finger toward person.'
  },
  {
    id: 'sign-i-love-you',
    gloss: 'I_LOVE_YOU',
    englishLabel: 'I love you',
    category: 'emotion',
    samplesCount: 40,
    confidenceThreshold: 0.74,
    facialRequirement: 'smile',
    features: {
      thumbCurl: 0.0, indexCurl: 0.0, middleCurl: 1.0, ringCurl: 1.0, pinkyCurl: 0.0,
      wristX: 0.25, wristY: 0.45, wristZ: 0.5,
      velocityX: 0.05, velocityY: 0.1,
      palmPitch: 0.1, palmYaw: -0.1, palmRoll: 0.0,
      browElevation: 0.6, mouthAperture: 0.15, smileDegree: 0.85, headNodRate: 0.15
    },
    notes: 'Extend thumb, index, and pinky (ILY handshape) with warm smile.'
  },
  {
    id: 'sign-help',
    gloss: 'HELP',
    englishLabel: 'Help',
    category: 'verb',
    samplesCount: 32,
    confidenceThreshold: 0.70,
    facialRequirement: 'eyebrows_raised',
    features: {
      thumbCurl: 0.0, indexCurl: 1.0, middleCurl: 1.0, ringCurl: 1.0, pinkyCurl: 1.0,
      wristX: 0.02, wristY: 0.35, wristZ: 0.45,
      velocityX: 0.0, velocityY: 0.35,
      palmPitch: 0.2, palmYaw: -0.2, palmRoll: 0.0,
      browElevation: 0.75, mouthAperture: 0.15, smileDegree: 0.2, headNodRate: 0.1
    },
    notes: '10-fist resting on open palm lifts upward in aid.'
  }
];

/**
 * Calculates weighted similarity between two gesture feature sets
 */
export function compareFeatures(input: GestureFeatures, reference: GestureFeatures): {
  overallScore: number;
  handshapeScore: number;
  locationScore: number;
  movementScore: number;
  facialScore: number;
  suggestions: string[];
} {
  const suggestions: string[] = [];

  // 1. Handshape similarity (Euclidean distance on 5 finger curls)
  const dThumb = Math.abs(input.thumbCurl - reference.thumbCurl);
  const dIndex = Math.abs(input.indexCurl - reference.indexCurl);
  const dMiddle = Math.abs(input.middleCurl - reference.middleCurl);
  const dRing = Math.abs(input.ringCurl - reference.ringCurl);
  const dPinky = Math.abs(input.pinkyCurl - reference.pinkyCurl);

  const avgHandDiff = (dThumb + dIndex + dMiddle + dRing + dPinky) / 5;
  const handshapeScore = Math.max(0, 1 - avgHandDiff * 1.4);

  if (dIndex > 0.35) {
    suggestions.push(reference.indexCurl < 0.3 ? 'Extend your index finger straighter' : 'Curl your index finger closer to your palm');
  }
  if (dThumb > 0.4) {
    suggestions.push(reference.thumbCurl < 0.3 ? 'Keep thumb extended outwards' : 'Tuck thumb alongside or over fingers');
  }

  // 2. Location similarity (wrist coordinate)
  const dLoc = Math.hypot(
    input.wristX - reference.wristX,
    input.wristY - reference.wristY,
    input.wristZ - reference.wristZ
  );
  const locationScore = Math.max(0, 1 - dLoc * 1.5);

  if (dLoc > 0.3) {
    if (input.wristY < reference.wristY - 0.2) suggestions.push('Raise hands higher toward chest/chin signing space');
    else if (input.wristY > reference.wristY + 0.2) suggestions.push('Lower hands slightly toward standard signing window');
  }

  // 3. Movement velocity & orientation similarity
  const dVel = Math.hypot(input.velocityX - reference.velocityX, input.velocityY - reference.velocityY);
  const dOrientation = (Math.abs(input.palmPitch - reference.palmPitch) + Math.abs(input.palmYaw - reference.palmYaw)) / 2;
  const movementScore = Math.max(0, 1 - (dVel * 1.2 + dOrientation * 0.8) / 2);

  // 4. Facial marker scoring (crucial for ASL grammar!)
  const dBrow = Math.abs(input.browElevation - reference.browElevation);
  const dSmile = Math.abs(input.smileDegree - reference.smileDegree);
  const facialScore = Math.max(0, 1 - (dBrow * 0.7 + dSmile * 0.5));

  if (reference.browElevation < 0.3 && input.browElevation > 0.45) {
    suggestions.push('Furrow eyebrows for WH-question syntax');
  } else if (reference.browElevation > 0.65 && input.browElevation < 0.5) {
    suggestions.push('Raise eyebrows for Yes/No question marker');
  }

  if (reference.smileDegree > 0.6 && input.smileDegree < 0.35) {
    suggestions.push('Express warmer facial engagement for this greeting/courtesy sign');
  }

  // Weighted overall calculation: ASL is 40% handshape, 25% location, 20% movement, 15% facial grammar
  const overallScore = Math.max(
    0,
    Math.min(
      1,
      handshapeScore * 0.40 +
      locationScore * 0.25 +
      movementScore * 0.20 +
      facialScore * 0.15
    )
  );

  return {
    overallScore,
    handshapeScore,
    locationScore,
    movementScore,
    facialScore,
    suggestions
  };
}

/**
 * Classifies an incoming gesture against all trained sign profiles
 */
export function classifyGesture(
  input: GestureFeatures,
  profiles: TrainedSignProfile[] = DEFAULT_TRAINED_PROFILES
): RecognitionMatch | null {
  if (!profiles.length) return null;

  let bestMatch: RecognitionMatch | null = null;
  let highestScore = -1;

  for (const profile of profiles) {
    const comparison = compareFeatures(input, profile.features);
    if (comparison.overallScore > highestScore) {
      highestScore = comparison.overallScore;
      bestMatch = {
        gloss: profile.gloss,
        englishLabel: profile.englishLabel,
        confidence: Number(comparison.overallScore.toFixed(3)),
        isAboveThreshold: comparison.overallScore >= profile.confidenceThreshold,
        featureScores: {
          handshape: Number(comparison.handshapeScore.toFixed(2)),
          location: Number(comparison.locationScore.toFixed(2)),
          movement: Number(comparison.movementScore.toFixed(2)),
          facial: Number(comparison.facialScore.toFixed(2))
        },
        feedbackSuggestions: comparison.suggestions
      };
    }
  }

  return bestMatch;
}

/**
 * Agent Learning / Fine-Tuning Simulator:
 * Integrates new user training samples and updates model weights and loss curves
 */
export function recordAgentTrainingSample(
  currentProfiles: TrainedSignProfile[],
  signGloss: string,
  englishLabel: string,
  category: string,
  newSample: GestureFeatures,
  facialReq: FacialExpression = 'neutral'
): { updatedProfiles: TrainedSignProfile[]; metricsUpdate: { accuracy: number; loss: number } } {
  const existingIdx = currentProfiles.findIndex(p => p.gloss.toUpperCase() === signGloss.toUpperCase());

  let updatedProfiles: TrainedSignProfile[];

  if (existingIdx >= 0) {
    const existing = currentProfiles[existingIdx];
    const n = existing.samplesCount;
    // Exponential moving average for profile weights
    const alpha = 1 / (n + 1);

    const mergedFeatures: GestureFeatures = {
      thumbCurl: existing.features.thumbCurl * (1 - alpha) + newSample.thumbCurl * alpha,
      indexCurl: existing.features.indexCurl * (1 - alpha) + newSample.indexCurl * alpha,
      middleCurl: existing.features.middleCurl * (1 - alpha) + newSample.middleCurl * alpha,
      ringCurl: existing.features.ringCurl * (1 - alpha) + newSample.ringCurl * alpha,
      pinkyCurl: existing.features.pinkyCurl * (1 - alpha) + newSample.pinkyCurl * alpha,
      wristX: existing.features.wristX * (1 - alpha) + newSample.wristX * alpha,
      wristY: existing.features.wristY * (1 - alpha) + newSample.wristY * alpha,
      wristZ: existing.features.wristZ * (1 - alpha) + newSample.wristZ * alpha,
      velocityX: existing.features.velocityX * (1 - alpha) + newSample.velocityX * alpha,
      velocityY: existing.features.velocityY * (1 - alpha) + newSample.velocityY * alpha,
      palmPitch: existing.features.palmPitch * (1 - alpha) + newSample.palmPitch * alpha,
      palmYaw: existing.features.palmYaw * (1 - alpha) + newSample.palmYaw * alpha,
      palmRoll: existing.features.palmRoll * (1 - alpha) + newSample.palmRoll * alpha,
      browElevation: existing.features.browElevation * (1 - alpha) + newSample.browElevation * alpha,
      mouthAperture: existing.features.mouthAperture * (1 - alpha) + newSample.mouthAperture * alpha,
      smileDegree: existing.features.smileDegree * (1 - alpha) + newSample.smileDegree * alpha,
      headNodRate: existing.features.headNodRate * (1 - alpha) + newSample.headNodRate * alpha
    };

    const updated: TrainedSignProfile = {
      ...existing,
      samplesCount: n + 1,
      features: mergedFeatures,
      confidenceThreshold: Math.max(0.65, Math.min(0.85, existing.confidenceThreshold + 0.005))
    };

    updatedProfiles = [
      ...currentProfiles.slice(0, existingIdx),
      updated,
      ...currentProfiles.slice(existingIdx + 1)
    ];
  } else {
    // New custom sign
    const newProfile: TrainedSignProfile = {
      id: `sign-custom-${Date.now()}`,
      gloss: signGloss.toUpperCase().replace(/\s+/g, '_'),
      englishLabel,
      category,
      samplesCount: 1,
      confidenceThreshold: 0.65,
      facialRequirement: facialReq,
      userCreated: true,
      features: { ...newSample },
      notes: 'Custom sign trained by user.'
    };
    updatedProfiles = [...currentProfiles, newProfile];
  }

  // Compute updated accuracy and loss
  const totalSamples = updatedProfiles.reduce((acc, p) => acc + p.samplesCount, 0);
  const accuracy = Math.min(0.985, 0.78 + Math.log10(totalSamples + 1) * 0.08);
  const loss = Math.max(0.015, 0.45 * Math.exp(-totalSamples / 120));

  return {
    updatedProfiles,
    metricsUpdate: {
      accuracy: Number(accuracy.toFixed(3)),
      loss: Number(loss.toFixed(3))
    }
  };
}
