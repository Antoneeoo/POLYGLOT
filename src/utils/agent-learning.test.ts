import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_TRAINED_PROFILES,
  compareFeatures,
  classifyGesture,
  recordAgentTrainingSample
} from './agent-learning';

test('compareFeatures scores identical features with high confidence', () => {
  const helloSample = { ...DEFAULT_TRAINED_PROFILES[0].features };
  const comparison = compareFeatures(helloSample, helloSample);

  assert.ok(comparison.overallScore >= 0.95, `Expected score >= 0.95, got ${comparison.overallScore}`);
  assert.equal(comparison.suggestions.length, 0);
});

test('classifyGesture matches HELLO when palm and brow match', () => {
  const helloInput = {
    ...DEFAULT_TRAINED_PROFILES[0].features,
    wristX: 0.36,
    wristY: 0.64
  };

  const match = classifyGesture(helloInput, DEFAULT_TRAINED_PROFILES);
  assert.ok(match, 'Expected a match');
  assert.equal(match.gloss, 'HELLO');
  assert.ok(match.confidence >= 0.75);
  assert.equal(match.isAboveThreshold, true);
});

test('recordAgentTrainingSample updates sample count and improves metrics', () => {
  const initialProfiles = [...DEFAULT_TRAINED_PROFILES];
  const newSample = { ...initialProfiles[0].features };

  const { updatedProfiles, metricsUpdate } = recordAgentTrainingSample(
    initialProfiles,
    'HELLO',
    'Hello',
    'greeting',
    newSample
  );

  const updatedHello = updatedProfiles.find(p => p.gloss === 'HELLO');
  assert.ok(updatedHello);
  assert.equal(updatedHello.samplesCount, initialProfiles[0].samplesCount + 1);
  assert.ok(metricsUpdate.accuracy > 0.8);
  assert.ok(metricsUpdate.loss < 0.2);
});

test('recordAgentTrainingSample registers brand new custom sign', () => {
  const initialProfiles = [...DEFAULT_TRAINED_PROFILES];
  const customSample = {
    thumbCurl: 0, indexCurl: 0, middleCurl: 0, ringCurl: 0, pinkyCurl: 0,
    wristX: 0.1, wristY: 0.2, wristZ: 0.3,
    velocityX: 0.1, velocityY: 0.1,
    palmPitch: 0, palmYaw: 0, palmRoll: 0,
    browElevation: 0.5, mouthAperture: 0.1, smileDegree: 0.5, headNodRate: 0.2
  };

  const { updatedProfiles } = recordAgentTrainingSample(
    initialProfiles,
    'CUSTOM_CHEER',
    'Custom Cheer',
    'emotion',
    customSample,
    'smile'
  );

  const customSign = updatedProfiles.find(p => p.gloss === 'CUSTOM_CHEER');
  assert.ok(customSign, 'Custom sign should be created');
  assert.equal(customSign.userCreated, true);
  assert.equal(customSign.samplesCount, 1);
});
