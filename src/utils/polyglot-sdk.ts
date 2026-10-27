/**
 * POLYGLOT Universal Integration SDK & Phone Permissions Bridge
 * Enables seamless integration of the live ASL translator into:
 * - Any website (React, Vue, Webflow, Shopify, WordPress, plain HTML)
 * - Mobile applications (iOS Swift, Android Kotlin, Flutter, React Native)
 * - Custom backend services (Node.js, Python, REST)
 */

export interface PhonePermissionsStatus {
  camera: 'granted' | 'denied' | 'prompt' | 'unsupported';
  microphone: 'granted' | 'denied' | 'prompt' | 'unsupported';
  haptics: boolean;
  orientation: boolean;
}

/**
 * Checks and requests permissions across iOS Safari, Android Chrome, and modern mobile browsers
 */
export async function checkPhonePermissions(): Promise<PhonePermissionsStatus> {
  const status: PhonePermissionsStatus = {
    camera: 'prompt',
    microphone: 'prompt',
    haptics: typeof navigator !== 'undefined' && 'vibrate' in navigator,
    orientation: typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
  };

  if (typeof navigator === 'undefined' || !navigator.permissions) {
    return status;
  }

  try {
    const cam = await navigator.permissions.query({ name: 'camera' as any });
    status.camera = cam.state as any;
  } catch {
    // Some browsers don't support camera permission query
  }

  try {
    const mic = await navigator.permissions.query({ name: 'microphone' as any });
    status.microphone = mic.state as any;
  } catch {
    // Some browsers don't support mic permission query
  }

  return status;
}

/**
 * Unified request for mobile device permissions
 */
export async function requestAllPhonePermissions(): Promise<{
  cameraGranted: boolean;
  micGranted: boolean;
  error?: string;
}> {
  let cameraGranted = false;
  let micGranted = false;

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      audio: true
    });

    cameraGranted = stream.getVideoTracks().length > 0;
    micGranted = stream.getAudioTracks().length > 0;

    // Release probe streams
    stream.getTracks().forEach(t => t.stop());

    // iOS DeviceOrientation permission trigger if present
    if (
      typeof (DeviceOrientationEvent as any) !== 'undefined' &&
      typeof (DeviceOrientationEvent as any).requestPermission === 'function'
    ) {
      try {
        await (DeviceOrientationEvent as any).requestPermission();
      } catch {
        // ignore
      }
    }

    return { cameraGranted, micGranted };
  } catch (err: any) {
    return {
      cameraGranted: false,
      micGranted: false,
      error: err.message || 'Permission request was dismissed or denied'
    };
  }
}

/**
 * Generates copy-paste integration embed snippets for any web CMS or framework
 */
export function generateEmbedSnippets(appUrl = window.location.origin) {
  return {
    // 1. One-line script tag widget
    scriptTag: `<!-- POLYGLOT Live ASL Translator Widget -->
<script
  src="${appUrl}/polyglot-widget.js"
  data-polyglot-theme="dark"
  data-polyglot-position="bottom-right"
  async
></script>`,

    // 2. Responsive responsive iframe embed
    iframeSnippet: `<!-- POLYGLOT Responsive Embed -->
<iframe
  src="${appUrl}?embed=true"
  width="100%"
  height="680"
  style="border: none; border-radius: 16px; overflow: hidden;"
  allow="camera; microphone; display-capture"
  title="POLYGLOT Live ASL Translator"
></iframe>`,

    // 3. React / Next.js Component
    reactComponent: `import { useEffect, useRef } from 'react';

export function PolyglotTranslatorEmbed() {
  return (
    <iframe
      src="${appUrl}?embed=true"
      className="w-full h-[650px] rounded-2xl border-0 shadow-2xl"
      allow="camera; microphone"
      title="POLYGLOT Live ASL Translator"
    />
  );
}`,

    // 4. Mobile App WebView (React Native / Flutter)
    reactNativeWebView: `// React Native integration using react-native-webview
import React from 'react';
import { WebView } from 'react-native-webview';

export default function PolyglotScreen() {
  return (
    <WebView
      source={{ uri: '${appUrl}?autostart=1' }}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
    />
  );
}`,

    flutterWebView: `// Flutter integration using webview_flutter
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PolyglotPage extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return WebView(
      initialUrl: '${appUrl}?autostart=1',
      javascriptMode: JavascriptMode.unrestricted,
    );
  }
}`
  };
}
