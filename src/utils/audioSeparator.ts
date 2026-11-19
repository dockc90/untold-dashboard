export interface SeparatedAudioStems {
  vocalsBlob: Blob;
  bgmBlob: Blob;
  vocalsUrl: string;
  bgmUrl: string;
  durationSec: number;
  isStereo: boolean;
}

function encodeWavFromAudioBuffer(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels || 1);
  const sampleRate = buffer.sampleRate || 44100;
  const length = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = length * blockAlign;
  const arrayBuf = new ArrayBuffer(44 + dataSize);
  const view = new DataView(arrayBuf);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // Linear PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const ch0 = buffer.getChannelData(0);
  const ch1 = numChannels > 1 ? buffer.getChannelData(1) : ch0;

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const s0 = Math.max(-1, Math.min(1, ch0[i] || 0));
    view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff, true);
    offset += 2;
    if (numChannels > 1) {
      const s1 = Math.max(-1, Math.min(1, ch1[i] || 0));
      view.setInt16(offset, s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuf], { type: 'audio/wav' });
}

function normalizePeak(buffer: AudioBuffer, targetPeak = 0.88): AudioBuffer {
  let maxAbs = 0;
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < data.length; i++) {
      const v = Math.abs(data[i]);
      if (v > maxAbs) maxAbs = v;
    }
  }
  if (maxAbs > 0.001) {
    const gain = Math.min(3.5, targetPeak / maxAbs);
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.max(-1, Math.min(1, data[i] * gain));
      }
    }
  }
  return buffer;
}

export async function separateVideoAudioStems(
  videoUrl: string,
  onProgress?: (progress: number) => void
): Promise<SeparatedAudioStems> {
  onProgress?.(0.1);
  const res = await fetch(videoUrl);
  if (!res.ok) {
    throw new Error(`동영상 오디오를 불러올 수 없습니다 (${res.status}).`);
  }
  const arrayBuffer = await res.arrayBuffer();

  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  const tempCtx = new AudioCtx();
  let decoded: AudioBuffer;
  try {
    decoded = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
  } catch {
    throw new Error('이 동영상에는 오디오 트랙이 없거나 브라우저에서 디코딩할 수 없는 코덱입니다.');
  } finally {
    try {
      await tempCtx.close();
    } catch {}
  }

  const sampleRate = decoded.sampleRate || 44100;
  const length = decoded.length;
  const isStereo = decoded.numberOfChannels >= 2;

  const left = decoded.getChannelData(0);
  const right = isStereo ? decoded.getChannelData(1) : left;

  // 1. Prepare Mid (speech-focused) and Side (stereo BGM-focused) raw buffers
  const midBuffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
  const sideBuffer = new AudioBuffer({ length, numberOfChannels: 1, sampleRate });
  const midData = midBuffer.getChannelData(0);
  const sideData = sideBuffer.getChannelData(0);

  for (let i = 0; i < length; i++) {
    const l = left[i] || 0;
    const r = right[i] || 0;
    midData[i] = isStereo ? (l + r) * 0.5 : l;
    sideData[i] = isStereo ? (l - r) * 0.85 : l;
  }

  // 2. Render Vocals/Speech Stem (Mid + Speech Bandpass 180Hz ~ 4500Hz + Presence Boost)
  const vocalsCtx = new OfflineAudioContext(1, length, sampleRate);
  const vocalsSrc = vocalsCtx.createBufferSource();
  vocalsSrc.buffer = midBuffer;

  const vHp = vocalsCtx.createBiquadFilter();
  vHp.type = 'highpass';
  vHp.frequency.value = 180;

  const vLp = vocalsCtx.createBiquadFilter();
  vLp.type = 'lowpass';
  vLp.frequency.value = 4500;

  const vPeak = vocalsCtx.createBiquadFilter();
  vPeak.type = 'peaking';
  vPeak.frequency.value = 1850;
  vPeak.Q.value = 1.0;
  vPeak.gain.value = 5.5;

  vocalsSrc.connect(vHp);
  vHp.connect(vLp);
  vLp.connect(vPeak);
  vPeak.connect(vocalsCtx.destination);
  vocalsSrc.start(0);
  const vocalsRendered = normalizePeak(await vocalsCtx.startRendering());

  // 3. Render BGM/Accompaniment Stem (Side + Sub-bass/Air preserve + Vocal-band notch)
  const bgmCtx = new OfflineAudioContext(1, length, sampleRate);

  if (isStereo) {
    const sideSrc = bgmCtx.createBufferSource();
    sideSrc.buffer = sideBuffer;
    const sideGain = bgmCtx.createGain();
    sideGain.gain.value = 1.15;
    sideSrc.connect(sideGain);
    sideGain.connect(bgmCtx.destination);
    sideSrc.start(0);
  }

  // Add low-bass (< 210Hz) and high-treble (> 4600Hz) from Mid so kick/bass & hi-hats stay punchy
  const midForBass = bgmCtx.createBufferSource();
  midForBass.buffer = midBuffer;
  const lowPass = bgmCtx.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 210;
  const bassGain = bgmCtx.createGain();
  bassGain.gain.value = isStereo ? 0.65 : 0.95;
  midForBass.connect(lowPass);
  lowPass.connect(bassGain);
  bassGain.connect(bgmCtx.destination);
  midForBass.start(0);

  const midForAir = bgmCtx.createBufferSource();
  midForAir.buffer = midBuffer;
  const highPass = bgmCtx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 4600;
  const airGain = bgmCtx.createGain();
  airGain.gain.value = isStereo ? 0.55 : 0.85;
  midForAir.connect(highPass);
  highPass.connect(airGain);
  airGain.connect(bgmCtx.destination);
  midForAir.start(0);

  if (!isStereo) {
    // For mono audio, also include a vocal-notched mid bed
    const midNotchSrc = bgmCtx.createBufferSource();
    midNotchSrc.buffer = midBuffer;
    const notch = bgmCtx.createBiquadFilter();
    notch.type = 'peaking';
    notch.frequency.value = 1400;
    notch.Q.value = 0.7;
    notch.gain.value = -14;
    const bedGain = bgmCtx.createGain();
    bedGain.gain.value = 0.45;
    midNotchSrc.connect(notch);
    notch.connect(bedGain);
    bedGain.connect(bgmCtx.destination);
    midNotchSrc.start(0);
  }

  const bgmRendered = normalizePeak(await bgmCtx.startRendering());

  const vocalsBlob = encodeWavFromAudioBuffer(vocalsRendered);
  const bgmBlob = encodeWavFromAudioBuffer(bgmRendered);

  return {
    vocalsBlob,
    bgmBlob,
    vocalsUrl: URL.createObjectURL(vocalsBlob),
    bgmUrl: URL.createObjectURL(bgmBlob),
    durationSec: decoded.duration || 0,
    isStereo,
  };
}
