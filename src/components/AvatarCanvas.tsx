import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { AvatarConfig } from '../types/avatar';
import { HandRigState, FacialRigState, REST_RIGHT_HAND, REST_LEFT_HAND, NEUTRAL_FACE } from '../utils/asl-signs';

interface AvatarCanvasProps {
  avatarConfig: AvatarConfig;
  targetRightHand: HandRigState;
  targetLeftHand: HandRigState;
  targetFace: FacialRigState;
  isSigning: boolean;
  activeGloss?: string;
  framingMode?: 'face_focus' | 'standard' | 'wide';
  className?: string;
}

// Scratch math helpers to prevent garbage collection allocations in the render loop
const _vArm = new THREE.Vector3();
const _vMid = new THREE.Vector3();

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  avatarConfig,
  targetRightHand,
  targetLeftHand,
  targetFace,
  isSigning,
  activeGloss,
  framingMode = 'standard',
  className = ''
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const propsRef = useRef({
    avatarConfig,
    targetRightHand,
    targetLeftHand,
    targetFace,
    isSigning,
    activeGloss,
    framingMode
  });

  useEffect(() => {
    propsRef.current = {
      avatarConfig,
      targetRightHand,
      targetLeftHand,
      targetFace,
      isSigning,
      activeGloss,
      framingMode
    };
  }, [avatarConfig, targetRightHand, targetLeftHand, targetFace, isSigning, activeGloss, framingMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL to adapt pacing without reducing scene contents
    const isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 560;

    // Scene & Camera setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080d1a);
    scene.fog = new THREE.Fog(0x080d1a, 3.5, 8.0);

    // Initial camera tuned closer so the face is large, crisp, and clearly visible
    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 20);
    camera.position.set(0, 1.36, 1.95);
    camera.lookAt(0, 1.30, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.24; // Extra bright and vivid
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Studio Environment for high-fidelity PBR sheen
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Studio Lighting Rig with dedicated Face Spotlight
    const keyLight = new THREE.DirectionalLight(0xfff1e6, 2.4);
    keyLight.position.set(1.2, 2.6, 2.0);
    keyLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Dedicated Face Fill Light directly in front of head to highlight ASL expressions
    const faceLight = new THREE.PointLight(0xfff7ed, 2.0, 4.5);
    faceLight.position.set(0, 1.50, 1.2);
    scene.add(faceLight);

    const fillLight = new THREE.HemisphereLight(0xc7d2fe, 0x1e1b4b, 1.4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xa5b4fc, 2.0);
    rimLight.position.set(-1.6, 2.2, -1.6);
    scene.add(rimLight);

    // Floor contact grounding
    const shadowGeo = new THREE.PlaneGeometry(3.5, 3.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.65,
      depthWrite: false
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.0;
    scene.add(shadowMesh);

    // ==========================================
    // PROCEDURAL ANATOMICAL 3D HUMANOID RIG
    // ==========================================
    const avatarRoot = new THREE.Group();
    scene.add(avatarRoot);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.skinTone),
      roughness: 0.48,
      metalness: 0.04
    });

    const outfitMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.outfitColor),
      roughness: 0.70,
      metalness: 0.08
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.hairColor),
      roughness: 0.58,
      metalness: 0.14
    });

    const eyeIrisMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.eyeColor),
      roughness: 0.15,
      metalness: 0.1
    });

    const eyeWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.1,
      metalness: 0.02
    });

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
    const teethMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });

    const lipMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatarConfig.skinTone).offsetHSL(0.015, 0.32, -0.14),
      roughness: 0.38
    });

    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.88,
      roughness: 0.18
    });

    // 1. Torso & Upper Body Group
    const torsoPivot = new THREE.Group();
    avatarRoot.add(torsoPivot);

    const chestGroup = new THREE.Group();
    chestGroup.position.set(0, 0.82, 0);
    torsoPivot.add(chestGroup);

    // Ribcage / Chest
    const chestGeo = new THREE.CylinderGeometry(0.25, 0.20, 0.68, 24);
    chestGeo.scale(1.05, 1.0, 0.82);
    const chestMesh = new THREE.Mesh(chestGeo, outfitMat);
    chestMesh.position.y = 0.0;
    chestMesh.castShadow = !isSoftwareGl;
    chestGroup.add(chestMesh);

    // Deltoids
    const leftShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 16), outfitMat);
    leftShoulderMesh.position.set(-0.25, 0.26, 0.0);
    chestGroup.add(leftShoulderMesh);

    const rightShoulderMesh = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 16), outfitMat);
    rightShoulderMesh.position.set(0.25, 0.26, 0.0);
    chestGroup.add(rightShoulderMesh);

    // Neckline & Neck
    const collarGeo = new THREE.TorusGeometry(0.12, 0.035, 12, 24);
    const collarMesh = new THREE.Mesh(collarGeo, outfitMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 0.35;
    chestGroup.add(collarMesh);

    const neckGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.16, 16);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.y = 0.42;
    chestGroup.add(neckMesh);

    // 2. Head Group & High-Definition Facial Features
    const headPivot = new THREE.Group();
    headPivot.position.set(0, 0.58, 0.02);
    chestGroup.add(headPivot);

    // Cranium
    const headGeo = new THREE.SphereGeometry(0.188, 24, 24);
    headGeo.scale(0.96, 1.15, 1.0);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = !isSoftwareGl;
    headPivot.add(headMesh);

    // Chin & Jaw contour
    const jawGeo = new THREE.ConeGeometry(0.11, 0.16, 16);
    jawGeo.scale(1.1, 0.9, 0.75);
    const jawMesh = new THREE.Mesh(jawGeo, skinMat);
    jawMesh.rotation.x = Math.PI;
    jawMesh.position.set(0, -0.11, 0.07);
    headPivot.add(jawMesh);

    // Ears
    const earGeo = new THREE.CapsuleGeometry(0.026, 0.05, 8, 12);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.185, 0.0, -0.02);
    leftEar.rotation.z = 0.12;
    headPivot.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.x = 0.185;
    rightEar.rotation.z = -0.12;
    headPivot.add(rightEar);

    // Prominent Eyes with Eyelids
    function buildEye(isRight: boolean) {
      const eyeGroup = new THREE.Group();
      eyeGroup.position.set(isRight ? 0.070 : -0.070, 0.040, 0.158);

      const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), eyeWhiteMat);
      eyeGroup.add(sclera);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.020, 16, 16), eyeIrisMat);
      iris.position.z = 0.022;
      eyeGroup.add(iris);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.010, 12, 12), pupilMat);
      pupil.position.z = 0.028;
      eyeGroup.add(pupil);

      // Upper eyelid
      const eyelidGeo = new THREE.SphereGeometry(0.036, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const upperEyelid = new THREE.Mesh(eyelidGeo, skinMat);
      upperEyelid.rotation.x = -Math.PI * 0.45;
      eyeGroup.add(upperEyelid);

      return { group: eyeGroup, upperEyelid };
    }

    const rightEye = buildEye(true);
    const leftEye = buildEye(false);
    headPivot.add(rightEye.group);
    headPivot.add(leftEye.group);

    // Highly Expressive Eyebrows for ASL Non-Manual Markers (Questions, WH-words, Emphasis)
    const browGeo = new THREE.BoxGeometry(0.072, 0.018, 0.024);
    const rightBrowGroup = new THREE.Group();
    rightBrowGroup.position.set(0.072, 0.098, 0.170);
    const rightBrowMesh = new THREE.Mesh(browGeo, hairMat);
    rightBrowGroup.add(rightBrowMesh);
    headPivot.add(rightBrowGroup);

    const leftBrowGroup = new THREE.Group();
    leftBrowGroup.position.set(-0.072, 0.098, 0.170);
    const leftBrowMesh = new THREE.Mesh(browGeo, hairMat);
    leftBrowGroup.add(leftBrowMesh);
    headPivot.add(leftBrowGroup);

    // Dynamic Forehead Crease (becomes visible when furrowing for WH-questions)
    const creaseGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.04, 8);
    const creaseMat = new THREE.MeshBasicMaterial({ color: 0x4a2e1b, transparent: true, opacity: 0 });
    const foreheadCreaseMesh = new THREE.Mesh(creaseGeo, creaseMat);
    foreheadCreaseMesh.position.set(0, 0.11, 0.175);
    headPivot.add(foreheadCreaseMesh);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.024, 0.058, 12);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.rotation.x = Math.PI / 1.85;
    noseMesh.position.set(0, -0.005, 0.194);
    headPivot.add(noseMesh);

    // Articulated Mouth with Upper/Lower Lips and Visible Teeth (for mouthing morphemes)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.088, 0.178);
    headPivot.add(mouthGroup);

    const upperLipGeo = new THREE.CylinderGeometry(0.009, 0.012, 0.070, 12);
    upperLipGeo.rotateZ(Math.PI / 2);
    const mouthMesh = new THREE.Mesh(upperLipGeo, lipMat);
    mouthGroup.add(mouthMesh);

    const lowerLipGeo = new THREE.CylinderGeometry(0.010, 0.013, 0.062, 12);
    lowerLipGeo.rotateZ(Math.PI / 2);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLipMesh.position.y = -0.016;
    mouthGroup.add(lowerLipMesh);

    // Teeth mesh for realistic speech/morpheme mouthing
    const teethGeo = new THREE.BoxGeometry(0.042, 0.012, 0.012);
    const teethMesh = new THREE.Mesh(teethGeo, teethMat);
    teethMesh.position.set(0, -0.006, -0.005);
    mouthGroup.add(teethMesh);

    // Hair Geometry Builder (Guarantees forehead, brows, eyes, cheeks, and mouth remain 100% visible for ASL expressions)
    const hairGroup = new THREE.Group();
    headPivot.add(hairGroup);
    (window as any).__hairGroup = hairGroup;
    (window as any).__headPivot = headPivot;

    function buildHairGeometry(style: AvatarConfig['hairStyle']) {
      while (hairGroup.children.length > 0) hairGroup.remove(hairGroup.children[0]);

      // 1. Back-of-head Shell: sits on back skull and nape behind ears (covers z from -0.20 to 0.0, never reaching face)
      const backShellGeo = new THREE.SphereGeometry(0.192, 24, 20);
      backShellGeo.scale(0.99, 1.15, 0.75);
      const backShell = new THREE.Mesh(backShellGeo, hairMat);
      backShell.position.set(0, 0.03, -0.065);
      backShell.castShadow = !isSoftwareGl;

      // 2. Crown Dome: sits atop cranium, front hairline stops high at y >= 0.185, z <= 0.06
      const crownDomeGeo = new THREE.SphereGeometry(0.194, 24, 16);
      crownDomeGeo.scale(0.99, 0.65, 0.85);
      const crownDome = new THREE.Mesh(crownDomeGeo, hairMat);
      crownDome.position.set(0, 0.125, -0.035);
      crownDome.castShadow = !isSoftwareGl;

      if (style === 'fade') {
        hairGroup.add(backShell);
        hairGroup.add(crownDome);
        const crest = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.05, 20), hairMat);
        crest.position.set(0, 0.230, -0.025);
        hairGroup.add(crest);
      } else if (style === 'buzz') {
        backShell.scale.set(0.97, 1.12, 0.70);
        crownDome.scale.set(0.97, 0.58, 0.80);
        hairGroup.add(backShell);
        hairGroup.add(crownDome);
      } else if (style === 'short_curly') {
        hairGroup.add(backShell);
        hairGroup.add(crownDome);

        // Volumetric curls positioned proudly on top crown, upper temples, and back - NEVER drooping onto the face
        // 1. Top crown curls (y: 0.22 to 0.26, z: -0.10 to +0.03, cleanly above forehead)
        const crownCurls = [
          [-0.09, 0.240, -0.01], [0.0, 0.255, 0.010], [0.09, 0.240, -0.01],
          [-0.06, 0.250, -0.06], [0.06, 0.252, -0.06],
          [-0.11, 0.230, -0.09], [0.0, 0.245, -0.10], [0.11, 0.230, -0.09],
          [-0.05, 0.235, 0.030], [0.05, 0.235, 0.030]
        ];
        for (const [cx, cy, cz] of crownCurls) {
          const curl = new THREE.Mesh(new THREE.SphereGeometry(0.034, 10, 10), hairMat);
          curl.position.set(cx, cy, cz);
          curl.castShadow = !isSoftwareGl;
          hairGroup.add(curl);
        }

        // 2. Temple & Side curls (beside/above ears at |x| >= 0.175, z <= -0.01)
        const sideCurls = [
          [-0.180, 0.14, -0.02], [-0.185, 0.08, -0.03],
          [0.180, 0.14, -0.02], [0.185, 0.08, -0.03]
        ];
        for (const [sx, sy, sz] of sideCurls) {
          const curl = new THREE.Mesh(new THREE.SphereGeometry(0.030, 8, 8), hairMat);
          curl.position.set(sx, sy, sz);
          curl.castShadow = !isSoftwareGl;
          hairGroup.add(curl);
        }

        // 3. Back of skull curls
        const backCurls = [
          [-0.08, 0.16, -0.15], [0.0, 0.17, -0.16], [0.08, 0.16, -0.15],
          [-0.06, 0.10, -0.17], [0.06, 0.10, -0.17]
        ];
        for (const [bx, by, bz] of backCurls) {
          const curl = new THREE.Mesh(new THREE.SphereGeometry(0.034, 8, 8), hairMat);
          curl.position.set(bx, by, bz);
          hairGroup.add(curl);
        }
      } else if (style === 'long_wavy') {
        hairGroup.add(backShell);
        hairGroup.add(crownDome);

        // Long waves draped down the sides (behind ears, z <= -0.04) and back of torso
        const leftFall = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.068, 0.40, 12), hairMat);
        leftFall.position.set(-0.185, -0.06, -0.04);
        leftFall.rotation.z = -0.08;
        hairGroup.add(leftFall);

        const rightFall = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.068, 0.40, 12), hairMat);
        rightFall.position.set(0.185, -0.06, -0.04);
        rightFall.rotation.z = 0.08;
        hairGroup.add(rightFall);

        const backFall = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.44, 14), hairMat);
        backFall.position.set(0.0, -0.08, -0.16);
        backFall.rotation.x = -0.10;
        hairGroup.add(backFall);
      } else if (style === 'bob') {
        hairGroup.add(backShell);
        hairGroup.add(crownDome);

        // Side bob layers along jawline (strictly behind cheeks, x = ±0.185, z = -0.03)
        const leftBob = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.060, 0.22, 12), hairMat);
        leftBob.position.set(-0.185, 0.0, -0.03);
        leftBob.rotation.z = -0.06;
        hairGroup.add(leftBob);

        const rightBob = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.060, 0.22, 12), hairMat);
        rightBob.position.set(0.185, 0.0, -0.03);
        rightBob.rotation.z = 0.06;
        hairGroup.add(rightBob);
      } else {
        // sleek_back: Brushed back hair with clean chignon bun at the nape
        crownDome.position.set(0, 0.125, -0.045);
        hairGroup.add(backShell);
        hairGroup.add(crownDome);

        const sleekBun = new THREE.Mesh(new THREE.SphereGeometry(0.062, 16, 16), hairMat);
        sleekBun.position.set(0, 0.04, -0.19);
        sleekBun.scale.set(1.0, 0.9, 0.7);
        hairGroup.add(sleekBun);
      }
    }
    buildHairGeometry(avatarConfig.hairStyle);

    // Eyeglasses
    const glassesGroup = new THREE.Group();
    headPivot.add(glassesGroup);
    function buildGlasses(type: AvatarConfig['glasses']) {
      while (glassesGroup.children.length > 0) glassesGroup.remove(glassesGroup.children[0]);
      if (type === 'none') return;

      const ringGeo = new THREE.TorusGeometry(0.040, 0.005, 8, 20);
      const leftLens = new THREE.Mesh(ringGeo, frameMat);
      leftLens.position.set(-0.070, 0.040, 0.195);
      glassesGroup.add(leftLens);

      const rightLens = leftLens.clone();
      rightLens.position.x = 0.070;
      glassesGroup.add(rightLens);

      const bridge = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.04, 8), frameMat);
      bridge.rotateZ(Math.PI / 2);
      bridge.position.set(0, 0.040, 0.195);
      glassesGroup.add(bridge);
    }
    buildGlasses(avatarConfig.glasses);

    // 3. Articulated Hands & Kinematic Limbs
    function createFluentHand(isRight: boolean) {
      const handGroup = new THREE.Group();

      const wristMesh = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 12), skinMat);
      wristMesh.scale.set(1.0, 0.6, 1.1);
      handGroup.add(wristMesh);

      const palmMesh = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.085, 0.024), skinMat);
      palmMesh.position.set(0, 0.048, 0);
      handGroup.add(palmMesh);

      const fingers: Record<string, { baseGroup: THREE.Group; tipGroup: THREE.Group }> = {};
      const specs = [
        { name: 'thumb', x: isRight ? -0.042 : 0.042, y: 0.028, len: 0.042, rotZ: isRight ? -0.42 : 0.42 },
        { name: 'index', x: isRight ? -0.028 : 0.028, y: 0.092, len: 0.052, rotZ: 0 },
        { name: 'middle', x: 0.0, y: 0.096, len: 0.058, rotZ: 0 },
        { name: 'ring', x: isRight ? 0.024 : -0.024, y: 0.092, len: 0.05, rotZ: 0 },
        { name: 'pinky', x: isRight ? 0.042 : -0.042, y: 0.082, len: 0.04, rotZ: 0 }
      ];

      for (const sp of specs) {
        const baseGroup = new THREE.Group();
        baseGroup.position.set(sp.x, sp.y, 0);
        baseGroup.rotation.z = sp.rotZ;

        const basePhalanx = new THREE.Mesh(new THREE.CapsuleGeometry(0.010, sp.len * 0.5, 6, 8), skinMat);
        basePhalanx.position.y = sp.len * 0.25;
        baseGroup.add(basePhalanx);

        const tipGroup = new THREE.Group();
        tipGroup.position.y = sp.len * 0.5;

        const tipPhalanx = new THREE.Mesh(new THREE.CapsuleGeometry(0.0085, sp.len * 0.45, 6, 8), skinMat);
        tipPhalanx.position.y = sp.len * 0.22;
        tipGroup.add(tipPhalanx);

        baseGroup.add(tipGroup);
        handGroup.add(baseGroup);

        fingers[sp.name] = { baseGroup, tipGroup };
      }

      return { root: handGroup, fingers };
    }

    const rightHandRig = createFluentHand(true);
    const leftHandRig = createFluentHand(false);

    avatarRoot.add(rightHandRig.root);
    avatarRoot.add(leftHandRig.root);

    const rightArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.42, 14), outfitMat);
    scene.add(rightArmMesh);

    const leftArmMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.038, 0.42, 14), outfitMat);
    scene.add(leftArmMesh);

    rightHandRig.root.position.set(REST_RIGHT_HAND.x, REST_RIGHT_HAND.y, REST_RIGHT_HAND.z);
    leftHandRig.root.position.set(REST_LEFT_HAND.x, REST_LEFT_HAND.y, REST_LEFT_HAND.z);

    // ==========================================
    // RENDER & LIVE ASL EXPRESSIONS KINEMATICS
    // ==========================================
    const clock = new THREE.Clock();
    let frameId = 0;
    let isDisposed = false;
    let blinkTimer = 0;
    let isBlinking = false;

    const shoulderOriginRight = new THREE.Vector3(0.25, 1.08, 0.04);
    const shoulderOriginLeft = new THREE.Vector3(-0.25, 1.08, 0.04);

    function updateFluentArmSleeve(armMesh: THREE.Mesh, shoulderPos: THREE.Vector3, wristPos: THREE.Vector3) {
      _vArm.subVectors(wristPos, shoulderPos);
      const length = _vArm.length();
      _vMid.copy(shoulderPos).addScaledVector(_vArm, 0.5);

      armMesh.position.copy(_vMid);
      armMesh.scale.set(1, Math.max(0.2, length / 0.42), 1);
      armMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), _vArm.normalize());
    }

    function applyFluentFingerKinematics(
      hand: { fingers: Record<string, { baseGroup: THREE.Group; tipGroup: THREE.Group }> },
      target: HandRigState,
      rate: number,
      delta: number
    ) {
      for (const [name, finger] of Object.entries(hand.fingers)) {
        const fingerData = (target as any)[name] || { curl: 0.3 };
        const curl = fingerData.curl ?? 0.3;
        const pipCurl = fingerData.pipCurl ?? curl * 0.9;
        const spread = fingerData.spread ?? 0;

        finger.baseGroup.rotation.x = THREE.MathUtils.damp(
          finger.baseGroup.rotation.x,
          curl * (Math.PI * 0.56),
          rate,
          delta
        );
        finger.baseGroup.rotation.z = THREE.MathUtils.damp(
          finger.baseGroup.rotation.z,
          spread * 0.38,
          rate,
          delta
        );
        finger.tipGroup.rotation.x = THREE.MathUtils.damp(
          finger.tipGroup.rotation.x,
          pipCurl * (Math.PI * 0.56),
          rate,
          delta
        );
      }
    }

    function tick() {
      if (isDisposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const props = propsRef.current;

      const rate = props.isSigning ? 15 : 8;

      // 0. Dynamic Camera Framing Mode (Face Focus vs Standard vs Wide)
      let targetCamY = 1.34;
      let targetCamZ = 1.95;
      let targetLookY = 1.30;

      if (props.framingMode === 'face_focus') {
        targetCamY = 1.48;
        targetCamZ = 1.38; // Extreme close-up on face expressions!
        targetLookY = 1.45;
      } else if (props.framingMode === 'wide') {
        targetCamY = 1.30;
        targetCamZ = 2.45;
        targetLookY = 1.25;
      }

      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCamY, 6, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 6, delta);
      camera.lookAt(0, THREE.MathUtils.damp(1.30, targetLookY, 6, delta), 0);

      // 1. Natural Human Secondary Motion (Breathing)
      const breath = Math.sin(elapsed * 2.2) * 0.012;
      chestGroup.position.y = 0.82 + breath;

      // 2. Eye Blinking Cycle
      blinkTimer += delta;
      if (blinkTimer > 3.4) {
        isBlinking = true;
        if (blinkTimer > 3.55) {
          isBlinking = false;
          blinkTimer = Math.random() * 0.8;
        }
      }
      const targetBlinkAngle = isBlinking ? 0 : -Math.PI * 0.45;
      rightEye.upperEyelid.rotation.x = THREE.MathUtils.damp(rightEye.upperEyelid.rotation.x, targetBlinkAngle, 24, delta);
      leftEye.upperEyelid.rotation.x = THREE.MathUtils.damp(leftEye.upperEyelid.rotation.x, targetBlinkAngle, 24, delta);

      // 3. Wrist Position & Orientation Kinematics
      const rTarget = props.targetRightHand || REST_RIGHT_HAND;
      const lTarget = props.targetLeftHand || REST_LEFT_HAND;

      rightHandRig.root.position.x = THREE.MathUtils.damp(rightHandRig.root.position.x, rTarget.x, rate, delta);
      rightHandRig.root.position.y = THREE.MathUtils.damp(rightHandRig.root.position.y, rTarget.y, rate, delta);
      rightHandRig.root.position.z = THREE.MathUtils.damp(rightHandRig.root.position.z, rTarget.z, rate, delta);

      rightHandRig.root.rotation.x = THREE.MathUtils.damp(rightHandRig.root.rotation.x, rTarget.rotX, rate, delta);
      rightHandRig.root.rotation.y = THREE.MathUtils.damp(rightHandRig.root.rotation.y, rTarget.rotY, rate, delta);
      rightHandRig.root.rotation.z = THREE.MathUtils.damp(rightHandRig.root.rotation.z, rTarget.rotZ, rate, delta);

      leftHandRig.root.position.x = THREE.MathUtils.damp(leftHandRig.root.position.x, lTarget.x, rate, delta);
      leftHandRig.root.position.y = THREE.MathUtils.damp(leftHandRig.root.position.y, lTarget.y, rate, delta);
      leftHandRig.root.position.z = THREE.MathUtils.damp(leftHandRig.root.position.z, lTarget.z, rate, delta);

      leftHandRig.root.rotation.x = THREE.MathUtils.damp(leftHandRig.root.rotation.x, lTarget.rotX, rate, delta);
      leftHandRig.root.rotation.y = THREE.MathUtils.damp(leftHandRig.root.rotation.y, lTarget.rotY, rate, delta);
      leftHandRig.root.rotation.z = THREE.MathUtils.damp(leftHandRig.root.rotation.z, lTarget.rotZ, rate, delta);

      // 4. Fluid Finger Joint Articulation
      applyFluentFingerKinematics(rightHandRig, rTarget, rate, delta);
      applyFluentFingerKinematics(leftHandRig, lTarget, rate, delta);

      // 5. Forearm Sleeves
      updateFluentArmSleeve(rightArmMesh, shoulderOriginRight, rightHandRig.root.position);
      updateFluentArmSleeve(leftArmMesh, shoulderOriginLeft, leftHandRig.root.position);

      // 6. LIVE & HIGH-VISIBILITY ASL FACIAL EXPRESSIONS
      const face = props.targetFace || NEUTRAL_FACE;

      // Eyebrow Kinematics (Pronounced for ASL questions)
      const browY = 0.098 + face.browRaise * 0.038 - face.browFurrow * 0.024;
      const browTilt = face.browFurrow * 0.32 - face.browRaise * 0.12;

      rightBrowGroup.position.y = THREE.MathUtils.damp(rightBrowGroup.position.y, browY, 16, delta);
      leftBrowGroup.position.y = THREE.MathUtils.damp(leftBrowGroup.position.y, browY, 16, delta);
      rightBrowGroup.rotation.z = THREE.MathUtils.damp(rightBrowGroup.rotation.z, -browTilt, 16, delta);
      leftBrowGroup.rotation.z = THREE.MathUtils.damp(leftBrowGroup.rotation.z, browTilt, 16, delta);

      // Forehead crease visibility during WH-questions
      creaseMat.opacity = THREE.MathUtils.damp(creaseMat.opacity, face.browFurrow * 0.65, 14, delta);

      // Eye scaling (widen on questions, slight squint on furrow)
      const eyeScaleY = 1.0 + face.browRaise * 0.22 - face.browFurrow * 0.15;
      rightEye.group.scale.y = THREE.MathUtils.damp(rightEye.group.scale.y, eyeScaleY, 14, delta);
      leftEye.group.scale.y = THREE.MathUtils.damp(leftEye.group.scale.y, eyeScaleY, 14, delta);

      // Head Pitch (Nod), Yaw (Shake), Roll (Curious)
      headPivot.rotation.x = THREE.MathUtils.damp(headPivot.rotation.x, face.headPitch * 0.35, 14, delta);
      headPivot.rotation.y = THREE.MathUtils.damp(headPivot.rotation.y, face.headYaw * 0.42, 14, delta);
      headPivot.rotation.z = THREE.MathUtils.damp(headPivot.rotation.z, face.headRoll * 0.26, 14, delta);

      // Mouth Morphemes & Lip-Sync Animation
      let mouthingSyllable = 0;
      if (props.isSigning && props.activeGloss) {
        mouthingSyllable = (Math.sin(elapsed * 13) + 1) * 0.22;
      }

      const mouthScaleX = 1.0 + face.smile * 0.48 - face.mouthO * 0.32;
      const mouthScaleY = 1.0 + face.mouthOpen * 1.8 + mouthingSyllable + face.mouthO * 1.6;
      mouthGroup.scale.x = THREE.MathUtils.damp(mouthGroup.scale.x, mouthScaleX, 16, delta);
      mouthGroup.scale.y = THREE.MathUtils.damp(mouthGroup.scale.y, mouthScaleY, 16, delta);

      // Lower lip drops more to reveal teeth
      lowerLipMesh.position.y = THREE.MathUtils.damp(lowerLipMesh.position.y, -0.016 - (face.mouthOpen + mouthingSyllable) * 0.02, 16, delta);

      // Spine / Torso natural counter-balancing
      const handBalance = (rightHandRig.root.position.x + leftHandRig.root.position.x) * 0.08;
      torsoPivot.rotation.z = THREE.MathUtils.damp(torsoPivot.rotation.z, -handBalance, 8, delta);

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (isDisposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(tick, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) tick();
    else frameId = requestAnimationFrame(tick);

    const handleResize = () => {
      if (!container || isDisposed) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW && newH) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      isDisposed = true;
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    avatarConfig.skinTone,
    avatarConfig.hairStyle,
    avatarConfig.hairColor,
    avatarConfig.outfitColor,
    avatarConfig.eyeColor,
    avatarConfig.glasses
  ]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      role="region"
      aria-label="3D Sign Language Avatar Viewport"
      data-testid="avatar-canvas"
    />
  );
};
