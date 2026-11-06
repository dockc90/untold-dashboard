import { VoiceOption } from '../types';

/**
 * High-fidelity voice preview player with ElevenLabs v4
 * Real-time synthesis and playback with ElevenLabs REST API
 * Memory Cache: In-memory AudioBuffer cache for zero-latency instant switching between voices.
 */

let activeAudioContext: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeStopCallback: (() => void) | null = null;

// In-memory cache for decoded audio buffers
const audioBufferCache = new Map<string, AudioBuffer>();

export const stopAllVoicePreviews = () => {
  if (activeStopCallback) {
    activeStopCallback();
    activeStopCallback = null;
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch (e) {}
    activeSourceNode = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export interface VoicePreviewOptions {
  speedMultiplier?: number;
  modelId?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  useSpeakerBoost?: boolean;
}

export const playDistinctVoicePreview = async (
  voice: VoiceOption,
  optionsOrSpeed: number | VoicePreviewOptions = 1.0,
  onEnd?: () => void
): Promise<() => void> => {
  stopAllVoicePreviews();

  let isCancelled = false;

  const cleanup = () => {
    isCancelled = true;
    if (activeSourceNode) {
      try {
        activeSourceNode.stop();
        activeSourceNode.disconnect();
      } catch (e) {}
      activeSourceNode = null;
    }
    if (activeStopCallback === stopFn) {
      activeStopCallback = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    onEnd?.();
  };

  const stopFn = cleanup;
  activeStopCallback = stopFn;

  const options: VoicePreviewOptions =
    typeof optionsOrSpeed === 'number'
      ? { speedMultiplier: optionsOrSpeed }
      : (optionsOrSpeed || {});

  const speedMultiplier = options.speedMultiplier || 1.0;
  const modelId = options.modelId || 'eleven_v4';
  const stability = options.stability ?? 0.5;
  const similarityBoost = options.similarityBoost ?? 0.75;
  const style = options.style ?? 0.15;
  const useSpeakerBoost = options.useSpeakerBoost !== false;

  // Priority 1: High-Fidelity Web Audio API with ElevenLabs
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      if (!activeAudioContext || activeAudioContext.state === 'closed') {
        activeAudioContext = new AudioContextClass();
      }
      if (activeAudioContext.state === 'suspended') {
        await activeAudioContext.resume();
      }

      const text = voice.sampleNarration.trim();
      const cacheKey = `${voice.id}_${modelId}_${stability}_${similarityBoost}_${style}_${text}`;
      let audioBuffer = audioBufferCache.get(cacheKey);

      if (!audioBuffer) {
        const query = new URLSearchParams({
          text,
          voice_id: voice.id,
          model_id: modelId,
          stability: stability.toString(),
          similarity_boost: similarityBoost.toString(),
          style: style.toString(),
          use_speaker_boost: useSpeakerBoost ? 'true' : 'false',
        });

        const res = await fetch(`/api/tts?${query.toString()}`);
        if (!res.ok || isCancelled) {
          throw new Error('TTS fetch failed');
        }
        const arrayBuf = await res.arrayBuffer();
        if (isCancelled) return stopFn;

        audioBuffer = await activeAudioContext.decodeAudioData(arrayBuf);
        audioBufferCache.set(cacheKey, audioBuffer);
      }

      if (isCancelled || !activeAudioContext) {
        return stopFn;
      }

      const source = activeAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.playbackRate.value = Math.max(0.7, Math.min(1.5, speedMultiplier));

      // Presence filter
      const filter = activeAudioContext.createBiquadFilter();
      if (voice.gender === 'male') {
        filter.type = 'lowshelf';
        filter.frequency.value = 240;
        filter.gain.value = 3.5;
      } else {
        filter.type = 'highshelf';
        filter.frequency.value = 3200;
        filter.gain.value = 3.0;
      }

      const gainNode = activeAudioContext.createGain();
      gainNode.gain.setValueAtTime(0.95, activeAudioContext.currentTime);

      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(activeAudioContext.destination);

      activeSourceNode = source;

      source.onended = () => {
        if (activeSourceNode === source) {
          activeSourceNode = null;
        }
        if (activeStopCallback === stopFn) {
          activeStopCallback = null;
        }
        onEnd?.();
      };

      source.start();
      return stopFn;
    }
  } catch (err) {
    console.warn('Web Audio ElevenLabs preview failed, using speech synthesis fallback:', err);
  }

  // Fallback: Browser Web Speech API
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(voice.sampleNarration);
      utterance.rate = Math.max(0.7, Math.min(1.5, speedMultiplier));
      utterance.pitch = 1.0;
      utterance.lang = 'ko-KR';

      utterance.onend = () => {
        if (activeStopCallback === stopFn) {
          activeStopCallback = null;
        }
        onEnd?.();
      };

      utterance.onerror = () => {
        if (activeStopCallback === stopFn) {
          activeStopCallback = null;
        }
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
      return stopFn;
    } catch (e) {
      onEnd?.();
      return () => {};
    }
  }

  onEnd?.();
  return () => {};
};
