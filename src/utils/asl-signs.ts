/**
 * ASL Sign Poses, 3D Skeletal Rigging Keyframes, and Fingerspelling Engine.
 * Supports single-handed & two-handed signs, expressive facial morph targets,
 * head kinematics, and fluid lerp/slerp interpolation.
 */

export interface FingerPose {
  curl: number;    // 0 = straight/extended, 1 = tightly closed/fist
  pipCurl?: number;// knuckle secondary fold
  spread?: number; // -1 to 1 spread outwards
}

export interface HandRigState {
  visible: boolean;
  x: number;
  y: number;
  z: number;
  rotX: number; // Pitch
  rotY: number; // Yaw
  rotZ: number; // Roll
  thumb: FingerPose;
  index: FingerPose;
  middle: FingerPose;
  ring: FingerPose;
  pinky: FingerPose;
}

export interface FacialRigState {
  browRaise: number;   // 0 to 1 (Yes/No questions)
  browFurrow: number;  // 0 to 1 (WH questions)
  smile: number;       // 0 to 1
  mouthOpen: number;   // 0 to 1
  mouthO: number;      // 0 to 1 (mouthing O / who / wow)
  headPitch: number;   // -1 to 1 (nod forward/back)
  headYaw: number;     // -1 to 1 (shake left/right)
  headRoll: number;    // -1 to 1 (tilt)
  eyeBlink: number;    // 0 to 1
}

export interface AvatarPoseFrame {
  timeOffset: number; // 0.0 to 1.0 within keyframe sequence
  rightHand: HandRigState;
  leftHand: HandRigState;
  face: FacialRigState;
  torsoLean?: number;
}

export interface AslSignDefinition {
  gloss: string;
  category: 'greeting' | 'question' | 'courtesy' | 'pronoun' | 'verb' | 'noun' | 'emotion' | 'time' | 'alphabet' | 'number';
  description: string;
  isTwoHanded: boolean;
  frames: AvatarPoseFrame[];
  defaultDurationMs: number;
}

// Neutral rest pose (arms relaxed in front/chest area)
export const REST_RIGHT_HAND: HandRigState = {
  visible: true,
  x: 0.28,
  y: 0.95,
  z: 0.35,
  rotX: 0.2,
  rotY: -0.3,
  rotZ: -0.1,
  thumb: { curl: 0.3, spread: 0.2 },
  index: { curl: 0.4 },
  middle: { curl: 0.45 },
  ring: { curl: 0.5 },
  pinky: { curl: 0.5 }
};

export const REST_LEFT_HAND: HandRigState = {
  visible: true,
  x: -0.28,
  y: 0.95,
  z: 0.35,
  rotX: 0.2,
  rotY: 0.3,
  rotZ: 0.1,
  thumb: { curl: 0.3, spread: -0.2 },
  index: { curl: 0.4 },
  middle: { curl: 0.45 },
  ring: { curl: 0.5 },
  pinky: { curl: 0.5 }
};

export const NEUTRAL_FACE: FacialRigState = {
  browRaise: 0,
  browFurrow: 0,
  smile: 0.1,
  mouthOpen: 0.05,
  mouthO: 0,
  headPitch: 0,
  headYaw: 0,
  headRoll: 0,
  eyeBlink: 0
};

// Quick helper to clone hand rig state
export function cloneHandState(base: HandRigState, overrides: Partial<HandRigState> = {}): HandRigState {
  return {
    ...base,
    thumb: { ...base.thumb, ...(overrides.thumb || {}) },
    index: { ...base.index, ...(overrides.index || {}) },
    middle: { ...base.middle, ...(overrides.middle || {}) },
    ring: { ...base.ring, ...(overrides.ring || {}) },
    pinky: { ...base.pinky, ...(overrides.pinky || {}) },
    ...overrides
  };
}

// Quick helper to create open flat hand (5-handshape / B-handshape)
export function flatHand(overrides: Partial<HandRigState> = {}): HandRigState {
  return cloneHandState(REST_RIGHT_HAND, {
    thumb: { curl: 0.1, spread: 0.1 },
    index: { curl: 0.05, pipCurl: 0.05 },
    middle: { curl: 0.05, pipCurl: 0.05 },
    ring: { curl: 0.05, pipCurl: 0.05 },
    pinky: { curl: 0.05, pipCurl: 0.05 },
    ...overrides
  });
}

// Quick helper to create fist (S-handshape / A-handshape)
export function fistHand(overrides: Partial<HandRigState> = {}): HandRigState {
  return cloneHandState(REST_RIGHT_HAND, {
    thumb: { curl: 0.8, spread: -0.2 },
    index: { curl: 1.0, pipCurl: 0.9 },
    middle: { curl: 1.0, pipCurl: 0.9 },
    ring: { curl: 1.0, pipCurl: 0.9 },
    pinky: { curl: 1.0, pipCurl: 0.9 },
    ...overrides
  });
}

// Quick helper to create pointing 1-handshape (D / 1 / index pointing)
export function pointHand(overrides: Partial<HandRigState> = {}): HandRigState {
  return cloneHandState(REST_RIGHT_HAND, {
    thumb: { curl: 0.8, spread: -0.2 },
    index: { curl: 0.0, pipCurl: 0.0 },
    middle: { curl: 1.0, pipCurl: 0.9 },
    ring: { curl: 1.0, pipCurl: 0.9 },
    pinky: { curl: 1.0, pipCurl: 0.9 },
    ...overrides
  });
}

// Dictionary of ASL signs with full keyframe kinematics
export const ASL_SIGN_DICTIONARY: Record<string, AslSignDefinition> = {
  HELLO: {
    gloss: 'HELLO',
    category: 'greeting',
    description: 'Flat hand starts at forehead/temple and salutes diagonally forward with an open smile.',
    isTwoHanded: false,
    defaultDurationMs: 900,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: flatHand({ x: 0.22, y: 1.62, z: 0.28, rotX: 0.3, rotY: -0.2, rotZ: 0.4 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.5, headPitch: -0.05 }
      },
      {
        timeOffset: 0.5,
        rightHand: flatHand({ x: 0.38, y: 1.58, z: 0.48, rotX: 0.2, rotY: -0.4, rotZ: 0.15 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.7, headPitch: 0.05 }
      },
      {
        timeOffset: 1.0,
        rightHand: flatHand({ x: 0.42, y: 1.52, z: 0.52, rotX: 0.1, rotY: -0.4, rotZ: 0.05 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.6 }
      }
    ]
  },

  THANK_YOU: {
    gloss: 'THANK_YOU',
    category: 'courtesy',
    description: 'Flat hand touches fingertips to chin/lips and extends gracefully forward toward the other person.',
    isTwoHanded: false,
    defaultDurationMs: 950,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: flatHand({ x: 0.05, y: 1.48, z: 0.22, rotX: 0.8, rotY: -0.1, rotZ: -0.1 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.4, headPitch: 0.08 }
      },
      {
        timeOffset: 0.6,
        rightHand: flatHand({ x: 0.12, y: 1.35, z: 0.58, rotX: 0.3, rotY: -0.2, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.75, headPitch: 0.12 }
      },
      {
        timeOffset: 1.0,
        rightHand: flatHand({ x: 0.15, y: 1.32, z: 0.62, rotX: 0.2, rotY: -0.2, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.6, headPitch: 0.05 }
      }
    ]
  },

  PLEASE: {
    gloss: 'PLEASE',
    category: 'courtesy',
    description: 'Open flat hand rests on center of chest and rubs in a circular clockwise motion with a pleasant facial expression.',
    isTwoHanded: false,
    defaultDurationMs: 1100,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: flatHand({ x: 0.02, y: 1.25, z: 0.25, rotX: 0.2, rotY: 0.0, rotZ: -0.2 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.5, headPitch: 0.05 }
      },
      {
        timeOffset: 0.35,
        rightHand: flatHand({ x: -0.06, y: 1.29, z: 0.24, rotX: 0.2, rotY: 0.1, rotZ: -0.3 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.6 }
      },
      {
        timeOffset: 0.7,
        rightHand: flatHand({ x: 0.06, y: 1.22, z: 0.25, rotX: 0.15, rotY: -0.1, rotZ: -0.1 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.55 }
      },
      {
        timeOffset: 1.0,
        rightHand: flatHand({ x: 0.02, y: 1.25, z: 0.25, rotX: 0.2, rotY: 0.0, rotZ: -0.2 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.5 }
      }
    ]
  },

  YES: {
    gloss: 'YES',
    category: 'courtesy',
    description: 'S-handshape (fist) nods up and down repeatedly at chest level like a head nodding affirmatively.',
    isTwoHanded: false,
    defaultDurationMs: 850,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: fistHand({ x: 0.22, y: 1.35, z: 0.42, rotX: 0.5, rotY: -0.2, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.3, headPitch: 0.1 }
      },
      {
        timeOffset: 0.35,
        rightHand: fistHand({ x: 0.22, y: 1.26, z: 0.44, rotX: -0.2, rotY: -0.2, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.4, headPitch: -0.05 }
      },
      {
        timeOffset: 0.7,
        rightHand: fistHand({ x: 0.22, y: 1.35, z: 0.42, rotX: 0.5, rotY: -0.2, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.4, headPitch: 0.12 }
      },
      {
        timeOffset: 1.0,
        rightHand: fistHand({ x: 0.22, y: 1.28, z: 0.43, rotX: 0.1, rotY: -0.2, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.35, headPitch: 0.05 }
      }
    ]
  },

  NO: {
    gloss: 'NO',
    category: 'courtesy',
    description: 'Index and middle fingers tap firmly against thumb, closing together with a firm head shake.',
    isTwoHanded: false,
    defaultDurationMs: 800,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.22, y: 1.36, z: 0.42, rotX: 0.3, rotY: -0.3, rotZ: 0.1,
          thumb: { curl: 0.1, spread: 0.2 },
          index: { curl: 0.1 },
          middle: { curl: 0.1 },
          ring: { curl: 0.9 },
          pinky: { curl: 0.9 }
        }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, headYaw: 0.15, browFurrow: 0.3 }
      },
      {
        timeOffset: 0.5,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.22, y: 1.34, z: 0.43, rotX: 0.35, rotY: -0.3, rotZ: 0.1,
          thumb: { curl: 0.6, spread: -0.1 },
          index: { curl: 0.7, pipCurl: 0.6 },
          middle: { curl: 0.7, pipCurl: 0.6 },
          ring: { curl: 0.95 },
          pinky: { curl: 0.95 }
        }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, headYaw: -0.18, browFurrow: 0.4 }
      },
      {
        timeOffset: 1.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.22, y: 1.34, z: 0.43, rotX: 0.3, rotY: -0.3, rotZ: 0.1,
          thumb: { curl: 0.6, spread: -0.1 },
          index: { curl: 0.7, pipCurl: 0.6 },
          middle: { curl: 0.7, pipCurl: 0.6 },
          ring: { curl: 0.95 },
          pinky: { curl: 0.95 }
        }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, headYaw: 0.05, browFurrow: 0.2 }
      }
    ]
  },

  HOW: {
    gloss: 'HOW',
    category: 'question',
    description: 'Curved hands with backs together roll forward and outward so palms face upward with furrowed eyebrows.',
    isTwoHanded: true,
    defaultDurationMs: 950,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.1, y: 1.25, z: 0.38, rotX: 0.8, rotY: -0.2, rotZ: 0.8,
          thumb: { curl: 0.2 }, index: { curl: 0.6 }, middle: { curl: 0.6 }, ring: { curl: 0.6 }, pinky: { curl: 0.6 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.1, y: 1.25, z: 0.38, rotX: 0.8, rotY: 0.2, rotZ: -0.8,
          thumb: { curl: 0.2 }, index: { curl: 0.6 }, middle: { curl: 0.6 }, ring: { curl: 0.6 }, pinky: { curl: 0.6 }
        }),
        face: { ...NEUTRAL_FACE, browFurrow: 0.6, headPitch: 0.05 }
      },
      {
        timeOffset: 1.0,
        rightHand: flatHand({ x: 0.2, y: 1.22, z: 0.48, rotX: -0.2, rotY: -0.3, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.2, y: 1.22, z: 0.48, rotX: -0.2, rotY: 0.3, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browFurrow: 0.8, headPitch: 0.1, mouthOpen: 0.1 }
      }
    ]
  },

  YOU: {
    gloss: 'YOU',
    category: 'pronoun',
    description: 'Right index finger points directly forward toward the conversational partner.',
    isTwoHanded: false,
    defaultDurationMs: 750,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: pointHand({ x: 0.15, y: 1.3, z: 0.35, rotX: 0.4, rotY: -0.1, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, browRaise: 0.4, headPitch: 0.05 }
      },
      {
        timeOffset: 1.0,
        rightHand: pointHand({ x: 0.15, y: 1.3, z: 0.62, rotX: 0.1, rotY: 0.0, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, browRaise: 0.6, headPitch: 0.08 }
      }
    ]
  },

  ME: {
    gloss: 'ME',
    category: 'pronoun',
    description: 'Right index finger points inward and touches center of the chest.',
    isTwoHanded: false,
    defaultDurationMs: 750,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: pointHand({ x: 0.18, y: 1.32, z: 0.42, rotX: 0.4, rotY: -0.3, rotZ: 0.0 }),
        leftHand: REST_LEFT_HAND,
        face: NEUTRAL_FACE
      },
      {
        timeOffset: 1.0,
        rightHand: pointHand({ x: 0.02, y: 1.28, z: 0.22, rotX: 0.1, rotY: -1.2, rotZ: 0.2 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, headPitch: 0.05 }
      }
    ]
  },

  NICE: {
    gloss: 'NICE',
    category: 'verb',
    description: 'Right flat palm slides forward smoothly across the flat open palm of the left passive hand.',
    isTwoHanded: true,
    defaultDurationMs: 900,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: flatHand({ x: -0.05, y: 1.28, z: 0.4, rotX: 0.1, rotY: 0.0, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: 0.0, y: 1.22, z: 0.4, rotX: -0.1, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.5 }
      },
      {
        timeOffset: 1.0,
        rightHand: flatHand({ x: 0.18, y: 1.28, z: 0.48, rotX: 0.1, rotY: -0.1, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: 0.0, y: 1.22, z: 0.4, rotX: -0.1, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.65 }
      }
    ]
  },

  MEET: {
    gloss: 'MEET',
    category: 'verb',
    description: 'Both index fingers (1-handshapes) move toward each other and meet face-to-face in front of chest.',
    isTwoHanded: true,
    defaultDurationMs: 900,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: pointHand({ x: 0.28, y: 1.3, z: 0.45, rotX: 0.2, rotY: -0.6, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.28, y: 1.3, z: 0.45, rotX: 0.2, rotY: 0.6, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.4 }
      },
      {
        timeOffset: 1.0,
        rightHand: pointHand({ x: 0.06, y: 1.3, z: 0.46, rotX: 0.1, rotY: -0.8, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.06, y: 1.3, z: 0.46, rotX: 0.1, rotY: 0.8, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.65, headPitch: 0.08 }
      }
    ]
  },

  HELP: {
    gloss: 'HELP',
    category: 'verb',
    description: 'Right fist with thumb pointing upward (10-handshape) sits on flat open left palm; both lift upward together.',
    isTwoHanded: true,
    defaultDurationMs: 1000,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.02, y: 1.2, z: 0.42, rotX: 0.2, rotY: -0.2, rotZ: 0.0,
          thumb: { curl: 0.0, spread: 0.4 }, index: { curl: 1.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: 0.02, y: 1.12, z: 0.42, rotX: -0.1, rotY: 0.1, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browRaise: 0.5, headPitch: 0.05 }
      },
      {
        timeOffset: 1.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.02, y: 1.38, z: 0.48, rotX: 0.2, rotY: -0.2, rotZ: 0.0,
          thumb: { curl: 0.0, spread: 0.4 }, index: { curl: 1.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: 0.02, y: 1.3, z: 0.48, rotX: -0.1, rotY: 0.1, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browRaise: 0.6, headPitch: 0.1 }
      }
    ]
  },

  I_LOVE_YOU: {
    gloss: 'I_LOVE_YOU',
    category: 'emotion',
    description: 'Right hand forms the iconic I-L-Y handshape (thumb, index, and pinky extended; middle and ring folded) and extends with warm smile.',
    isTwoHanded: false,
    defaultDurationMs: 1100,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.25, y: 1.38, z: 0.42, rotX: 0.3, rotY: -0.2, rotZ: 0.1,
          thumb: { curl: 0.0, spread: 0.4 },
          index: { curl: 0.0 },
          middle: { curl: 1.0, pipCurl: 0.9 },
          ring: { curl: 1.0, pipCurl: 0.9 },
          pinky: { curl: 0.0 }
        }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.6 }
      },
      {
        timeOffset: 0.5,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.28, y: 1.48, z: 0.52, rotX: 0.1, rotY: -0.1, rotZ: -0.05,
          thumb: { curl: 0.0, spread: 0.5 },
          index: { curl: 0.0 },
          middle: { curl: 1.0, pipCurl: 0.9 },
          ring: { curl: 1.0, pipCurl: 0.9 },
          pinky: { curl: 0.0 }
        }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.85, headRoll: 0.08 }
      },
      {
        timeOffset: 1.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.28, y: 1.48, z: 0.52, rotX: 0.1, rotY: -0.1, rotZ: 0.05,
          thumb: { curl: 0.0, spread: 0.5 },
          index: { curl: 0.0 },
          middle: { curl: 1.0, pipCurl: 0.9 },
          ring: { curl: 1.0, pipCurl: 0.9 },
          pinky: { curl: 0.0 }
        }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.8 }
      }
    ]
  },

  WHAT: {
    gloss: 'WHAT',
    category: 'question',
    description: 'Both flat hands with palms facing upward move gently side to side with furrowed eyebrows and curious expression.',
    isTwoHanded: true,
    defaultDurationMs: 950,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: flatHand({ x: 0.24, y: 1.25, z: 0.45, rotX: -0.2, rotY: -0.2, rotZ: 0.1 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.24, y: 1.25, z: 0.45, rotX: -0.2, rotY: 0.2, rotZ: -0.1,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browFurrow: 0.7, headPitch: 0.06 }
      },
      {
        timeOffset: 0.5,
        rightHand: flatHand({ x: 0.32, y: 1.25, z: 0.45, rotX: -0.2, rotY: -0.4, rotZ: 0.15 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.32, y: 1.25, z: 0.45, rotX: -0.2, rotY: 0.4, rotZ: -0.15,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browFurrow: 0.9, mouthOpen: 0.12 }
      },
      {
        timeOffset: 1.0,
        rightHand: flatHand({ x: 0.26, y: 1.25, z: 0.45, rotX: -0.2, rotY: -0.2, rotZ: 0.1 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.26, y: 1.25, z: 0.45, rotX: -0.2, rotY: 0.2, rotZ: -0.1,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browFurrow: 0.8, headPitch: 0.08 }
      }
    ]
  },

  WHERE: {
    gloss: 'WHERE',
    category: 'question',
    description: 'Right index finger points up and wiggles side to side like a metronome with furrowed eyebrows.',
    isTwoHanded: false,
    defaultDurationMs: 900,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: pointHand({ x: 0.2, y: 1.42, z: 0.45, rotX: 0.1, rotY: -0.2, rotZ: -0.2 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, browFurrow: 0.75, headRoll: -0.06 }
      },
      {
        timeOffset: 0.5,
        rightHand: pointHand({ x: 0.24, y: 1.42, z: 0.45, rotX: 0.1, rotY: -0.2, rotZ: 0.2 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, browFurrow: 0.85, headRoll: 0.06 }
      },
      {
        timeOffset: 1.0,
        rightHand: pointHand({ x: 0.2, y: 1.42, z: 0.45, rotX: 0.1, rotY: -0.2, rotZ: -0.1 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, browFurrow: 0.8 }
      }
    ]
  },

  NAME: {
    gloss: 'NAME',
    category: 'noun',
    description: 'Both hands form H/U handshape (index and middle extended together) and right hand taps twice on top of left hand.',
    isTwoHanded: true,
    defaultDurationMs: 950,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.04, y: 1.34, z: 0.42, rotX: 0.2, rotY: -0.5, rotZ: 0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.04, y: 1.28, z: 0.42, rotX: 0.2, rotY: 0.5, rotZ: -0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: NEUTRAL_FACE
      },
      {
        timeOffset: 0.3,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: -0.02, y: 1.29, z: 0.42, rotX: 0.2, rotY: -0.5, rotZ: 0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.04, y: 1.28, z: 0.42, rotX: 0.2, rotY: 0.5, rotZ: -0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, headPitch: 0.05 }
      },
      {
        timeOffset: 0.6,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.04, y: 1.33, z: 0.42, rotX: 0.2, rotY: -0.5, rotZ: 0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.04, y: 1.28, z: 0.42, rotX: 0.2, rotY: 0.5, rotZ: -0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: NEUTRAL_FACE
      },
      {
        timeOffset: 1.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: -0.02, y: 1.29, z: 0.42, rotX: 0.2, rotY: -0.5, rotZ: 0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.04, y: 1.28, z: 0.42, rotX: 0.2, rotY: 0.5, rotZ: -0.3,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, headPitch: 0.05 }
      }
    ]
  },

  LEARN: {
    gloss: 'LEARN',
    category: 'verb',
    description: 'Right hand gathers knowledge from the open left palm and draws it up to touch the forehead.',
    isTwoHanded: true,
    defaultDurationMs: 1100,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: flatHand({ x: 0.0, y: 1.24, z: 0.42, rotX: 0.6, rotY: -0.2, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: 0.0, y: 1.18, z: 0.42, rotX: -0.2, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, browRaise: 0.2 }
      },
      {
        timeOffset: 1.0,
        rightHand: cloneHandState(REST_RIGHT_HAND, {
          x: 0.12, y: 1.62, z: 0.26, rotX: 0.2, rotY: -0.4, rotZ: 0.2,
          thumb: { curl: 0.7 }, index: { curl: 0.8 }, middle: { curl: 0.8 }, ring: { curl: 0.8 }, pinky: { curl: 0.8 }
        }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: 0.0, y: 1.18, z: 0.42, rotX: -0.2, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.1 }, index: { curl: 0.05 }, middle: { curl: 0.05 }, ring: { curl: 0.05 }, pinky: { curl: 0.05 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.5, headPitch: 0.08 }
      }
    ]
  },

  SIGN: {
    gloss: 'SIGN',
    category: 'verb',
    description: 'Both 1-handshapes circle alternately backwards and forwards toward body in fluid revolving motion.',
    isTwoHanded: true,
    defaultDurationMs: 1100,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: pointHand({ x: 0.18, y: 1.35, z: 0.45, rotX: 0.3, rotY: -0.2, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.18, y: 1.25, z: 0.38, rotX: 0.1, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.4 }
      },
      {
        timeOffset: 0.5,
        rightHand: pointHand({ x: 0.18, y: 1.25, z: 0.38, rotX: 0.1, rotY: -0.2, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.18, y: 1.35, z: 0.45, rotX: 0.3, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.55 }
      },
      {
        timeOffset: 1.0,
        rightHand: pointHand({ x: 0.18, y: 1.35, z: 0.45, rotX: 0.3, rotY: -0.2, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.18, y: 1.25, z: 0.38, rotX: 0.1, rotY: 0.2, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.5 }
      }
    ]
  },

  DEAF: {
    gloss: 'DEAF',
    category: 'noun',
    description: 'Right index finger touches side of mouth/cheek and then moves to touch near the ear.',
    isTwoHanded: false,
    defaultDurationMs: 900,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: pointHand({ x: 0.16, y: 1.48, z: 0.28, rotX: 0.4, rotY: -0.6, rotZ: 0.2 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.3 }
      },
      {
        timeOffset: 1.0,
        rightHand: pointHand({ x: 0.24, y: 1.58, z: 0.24, rotX: 0.3, rotY: -0.8, rotZ: 0.3 }),
        leftHand: REST_LEFT_HAND,
        face: { ...NEUTRAL_FACE, smile: 0.4, headPitch: 0.05 }
      }
    ]
  },

  PRACTICE: {
    gloss: 'PRACTICE',
    category: 'verb',
    description: 'Right A-handshape (fist with thumb along side) rubs back and forth along top of left index finger.',
    isTwoHanded: true,
    defaultDurationMs: 950,
    frames: [
      {
        timeOffset: 0.0,
        rightHand: fistHand({ x: 0.08, y: 1.3, z: 0.42, rotX: 0.2, rotY: -0.3, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.05, y: 1.26, z: 0.42, rotX: 0.0, rotY: 0.8, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.3 }
      },
      {
        timeOffset: 0.5,
        rightHand: fistHand({ x: -0.04, y: 1.3, z: 0.42, rotX: 0.2, rotY: -0.3, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.05, y: 1.26, z: 0.42, rotX: 0.0, rotY: 0.8, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.45 }
      },
      {
        timeOffset: 1.0,
        rightHand: fistHand({ x: 0.08, y: 1.3, z: 0.42, rotX: 0.2, rotY: -0.3, rotZ: 0.0 }),
        leftHand: cloneHandState(REST_LEFT_HAND, {
          x: -0.05, y: 1.26, z: 0.42, rotX: 0.0, rotY: 0.8, rotZ: 0.0,
          thumb: { curl: 0.8 }, index: { curl: 0.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
        }),
        face: { ...NEUTRAL_FACE, smile: 0.4 }
      }
    ]
  }
};

// Full American Fingerspelling Alphabet (A to Z)
export function getFingerspellPose(letter: string): HandRigState {
  const char = letter.toUpperCase();
  const base = cloneHandState(REST_RIGHT_HAND, {
    x: 0.28,
    y: 1.45,
    z: 0.42,
    rotX: 0.2,
    rotY: -0.2,
    rotZ: 0.0
  });

  switch (char) {
    case 'A': // Fist with thumb alongside
      return {
        ...base,
        thumb: { curl: 0.0, spread: 0.4 },
        index: { curl: 1.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'B': // Flat 4 fingers up, thumb across palm
      return {
        ...base,
        thumb: { curl: 0.8, spread: -0.3 },
        index: { curl: 0.0 }, middle: { curl: 0.0 }, ring: { curl: 0.0 }, pinky: { curl: 0.0 }
      };
    case 'C': // Curved C shape
      return {
        ...base,
        thumb: { curl: 0.4, spread: 0.2 },
        index: { curl: 0.5, pipCurl: 0.5 }, middle: { curl: 0.5, pipCurl: 0.5 },
        ring: { curl: 0.5, pipCurl: 0.5 }, pinky: { curl: 0.5, pipCurl: 0.5 }
      };
    case 'D': // Index up, thumb touches middle, ring, pinky
      return {
        ...base,
        thumb: { curl: 0.5, spread: -0.1 },
        index: { curl: 0.0 }, middle: { curl: 0.7, pipCurl: 0.7 },
        ring: { curl: 0.7, pipCurl: 0.7 }, pinky: { curl: 0.7, pipCurl: 0.7 }
      };
    case 'E': // Curled claw, thumb folded underneath
      return {
        ...base,
        thumb: { curl: 0.9, spread: -0.2 },
        index: { curl: 0.8, pipCurl: 0.8 }, middle: { curl: 0.8, pipCurl: 0.8 },
        ring: { curl: 0.8, pipCurl: 0.8 }, pinky: { curl: 0.8, pipCurl: 0.8 }
      };
    case 'F': // Index and thumb make circle, 3 fingers up
      return {
        ...base,
        thumb: { curl: 0.6, spread: -0.1 },
        index: { curl: 0.6, pipCurl: 0.6 },
        middle: { curl: 0.0 }, ring: { curl: 0.0 }, pinky: { curl: 0.0 }
      };
    case 'G': // Index and thumb horizontal parallel
      return {
        ...base,
        rotZ: -0.6,
        thumb: { curl: 0.1, spread: 0.3 },
        index: { curl: 0.0 },
        middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'H': // Index & middle horizontal parallel
      return {
        ...base,
        rotZ: -0.6,
        thumb: { curl: 0.8, spread: -0.2 },
        index: { curl: 0.0 }, middle: { curl: 0.0 },
        ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'I': // Pinky straight up, rest curled
      return {
        ...base,
        thumb: { curl: 0.8, spread: -0.2 },
        index: { curl: 1.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 },
        pinky: { curl: 0.0 }
      };
    case 'K': // Index up, middle forward, thumb between
      return {
        ...base,
        thumb: { curl: 0.2, spread: 0.2 },
        index: { curl: 0.0 }, middle: { curl: 0.3, pipCurl: 0.1 },
        ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'L': // L shape with index & thumb
      return {
        ...base,
        thumb: { curl: 0.0, spread: 0.8 },
        index: { curl: 0.0 },
        middle: { curl: 1.0 }, ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'O': // All fingers meet thumb in O shape
      return {
        ...base,
        thumb: { curl: 0.6, spread: 0.0 },
        index: { curl: 0.6, pipCurl: 0.6 }, middle: { curl: 0.6, pipCurl: 0.6 },
        ring: { curl: 0.6, pipCurl: 0.6 }, pinky: { curl: 0.6, pipCurl: 0.6 }
      };
    case 'U': // Index and middle together straight up
      return {
        ...base,
        thumb: { curl: 0.8, spread: -0.2 },
        index: { curl: 0.0 }, middle: { curl: 0.0 },
        ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'V': // Index and middle separated in V shape
      return {
        ...base,
        thumb: { curl: 0.8, spread: -0.2 },
        index: { curl: 0.0, spread: 0.3 }, middle: { curl: 0.0, spread: -0.3 },
        ring: { curl: 1.0 }, pinky: { curl: 1.0 }
      };
    case 'W': // Index, middle, ring up
      return {
        ...base,
        thumb: { curl: 0.8, spread: -0.2 },
        index: { curl: 0.0, spread: 0.2 }, middle: { curl: 0.0 }, ring: { curl: 0.0, spread: -0.2 },
        pinky: { curl: 1.0 }
      };
    case 'Y': // Thumb & pinky out (hang loose)
      return {
        ...base,
        thumb: { curl: 0.0, spread: 0.7 },
        index: { curl: 1.0 }, middle: { curl: 1.0 }, ring: { curl: 1.0 },
        pinky: { curl: 0.0, spread: -0.7 }
      };
    default: // Standard relaxed fist
      return {
        ...base,
        thumb: { curl: 0.5, spread: 0.0 },
        index: { curl: 0.7 }, middle: { curl: 0.7 }, ring: { curl: 0.7 }, pinky: { curl: 0.7 }
      };
  }
}

/**
 * Linear/smooth interpolation between two number values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(Math.max(t, 0), 1);
}

/**
 * Interpolates smoothly between two hand rig states
 */
export function interpolateHand(a: HandRigState, b: HandRigState, t: number): HandRigState {
  return {
    visible: a.visible || b.visible,
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
    rotX: lerp(a.rotX, b.rotX, t),
    rotY: lerp(a.rotY, b.rotY, t),
    rotZ: lerp(a.rotZ, b.rotZ, t),
    thumb: {
      curl: lerp(a.thumb.curl, b.thumb.curl, t),
      pipCurl: lerp(a.thumb.pipCurl || 0, b.thumb.pipCurl || 0, t),
      spread: lerp(a.thumb.spread || 0, b.thumb.spread || 0, t)
    },
    index: {
      curl: lerp(a.index.curl, b.index.curl, t),
      pipCurl: lerp(a.index.pipCurl || 0, b.index.pipCurl || 0, t),
      spread: lerp(a.index.spread || 0, b.index.spread || 0, t)
    },
    middle: {
      curl: lerp(a.middle.curl, b.middle.curl, t),
      pipCurl: lerp(a.middle.pipCurl || 0, b.middle.pipCurl || 0, t),
      spread: lerp(a.middle.spread || 0, b.middle.spread || 0, t)
    },
    ring: {
      curl: lerp(a.ring.curl, b.ring.curl, t),
      pipCurl: lerp(a.ring.pipCurl || 0, b.ring.pipCurl || 0, t),
      spread: lerp(a.ring.spread || 0, b.ring.spread || 0, t)
    },
    pinky: {
      curl: lerp(a.pinky.curl, b.pinky.curl, t),
      pipCurl: lerp(a.pinky.pipCurl || 0, b.pinky.pipCurl || 0, t),
      spread: lerp(a.pinky.spread || 0, b.pinky.spread || 0, t)
    }
  };
}

/**
 * Interpolates smoothly between two facial rig states
 */
export function interpolateFace(a: FacialRigState, b: FacialRigState, t: number): FacialRigState {
  return {
    browRaise: lerp(a.browRaise, b.browRaise, t),
    browFurrow: lerp(a.browFurrow, b.browFurrow, t),
    smile: lerp(a.smile, b.smile, t),
    mouthOpen: lerp(a.mouthOpen, b.mouthOpen, t),
    mouthO: lerp(a.mouthO, b.mouthO, t),
    headPitch: lerp(a.headPitch, b.headPitch, t),
    headYaw: lerp(a.headYaw, b.headYaw, t),
    headRoll: lerp(a.headRoll, b.headRoll, t),
    eyeBlink: lerp(a.eyeBlink, b.eyeBlink, t)
  };
}
