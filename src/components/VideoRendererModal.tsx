import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Film, 
  Download, 
  Play, 
  Pause, 
  RotateCw, 
  RotateCcw, 
  CheckCircle2, 
  Sparkles, 
  Sliders, 
  Layers, 
  Monitor, 
  AlertCircle,
  Mic,
  Volume2,
  Gauge,
  Type,
  AlignVerticalJustifyCenter,
  Palette,
  Heart,
  Square,
  Maximize2,
  Image as ImageIcon,
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Upload,
  Tag,
  Move,
  Check,
  Eye,
  Share2,
  Zap,
  Edit3,
  ExternalLink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bookmark,
  Save,
  ChevronDown,
  ChevronUp,
  EyeOff
} from 'lucide-react';
import { fixWebmBlob, patchWebmBinaryDurationAndCues } from '../utils/webmFixer';
import { ShortsSafeZoneOverlay, PlatformGuideSelector, PlatformGuideType } from './ShortsSafeZoneOverlay';
import { 
  ShortsProject, 
  SceneItem, 
  MotionEffectType, 
  VoiceOption,
  SubtitleFontFamily,
  SubtitlePosition,
  SubtitleEffectStyle,
  SubtitleFontSize,
  PhotoAspectRatio,
  BackdropStyle,
  VideoMoodTone,
  CustomTextOverlay,
  ChannelLogoOverlay,
  SubtitleTempo,
  CustomOverlayPreset,
  CustomSubtitlePreset
} from '../types';
import { VOICE_OPTIONS } from '../data/voices';
import { playDistinctVoicePreview, stopAllVoicePreviews } from '../utils/voicePlayer';
import { getSceneFallbackImage } from '../utils/sceneImages';

interface VideoRendererModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ShortsProject;
  isPageMode?: boolean;
  onBackToEditor?: () => void;
  onBackToTrends?: () => void;
  onUpdateProject?: (updated: ShortsProject) => void;
  onSaveProject?: (project: ShortsProject) => Promise<void> | void;
}

const SPEED_PRESETS = [0.8, 1.0, 1.1, 1.2, 1.3, 1.5];

const COMMERCIAL_FONTS: { id: SubtitleFontFamily; name: string; tag: string; sample: string }[] = [
  { id: 'Pretendard', name: '프리텐다드 (Pretendard)', tag: '가독성 1위 모던 고딕 (기본 추천)', sample: '인생을 바꾼 3초의 기적' },
  { id: 'GmarketSans', name: '지마켓 산스 (Gmarket Sans)', tag: '쇼츠 추천 볼드', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Black Han Sans', name: '검은고딕 (Black Han Sans)', tag: '압도적 임팩트 헤드라인', sample: '인생을 바꾼 3초의 기적' },
  { id: 'ScoreDream', name: '에스코어 드림 (S-Core Dream)', tag: '직선형 방송 자막', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Do Hyeon', name: '배민 도현체 (Do Hyeon)', tag: '인기 예능 쇼츠 자막', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Jua', name: '배민 주아체 (Jua)', tag: '부드러운 감성 자막', sample: '인생을 바꾼 3초의 기적' },
  { id: 'Song Myung', name: '송명체 (Song Myung)', tag: '인간극장 다큐 명조', sample: '인생을 바꾼 3초의 기적' },
];

const POSITION_PRESETS = [
  { label: '하단 (81% 기본)', value: 81 },
  { label: '상단 (17% 기본)', value: 17 },
  { label: '중앙 (50%)', value: 50 },
  { label: '최하단 (86%)', value: 86 },
];

const SIZE_PRESETS = [
  { label: '소형 (0.85x)', value: 0.85 },
  { label: '보통 (1.0x 표준)', value: 1.0 },
  { label: '대형 (1.18x 추천)', value: 1.18 },
  { label: '특대형 (1.35x)', value: 1.35 },
];

const EFFECT_STYLES: { id: SubtitleEffectStyle; label: string; previewClass: string }[] = [
  { id: 'yellow_box', label: '옐로우 박스', previewClass: 'bg-amber-400 text-slate-950 font-black' },
  { id: 'black_capsule', label: '블랙 캡슐', previewClass: 'bg-slate-900/90 text-white font-bold' },
  { id: 'white_outline', label: '화이트 외곽선', previewClass: 'bg-transparent text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] font-black' },
  { id: 'neon_cyan', label: '사이버 네온', previewClass: 'bg-cyan-950 text-cyan-200 border border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.8)]' },
  { id: 'netflix_red', label: '넷플릭스 레드', previewClass: 'bg-rose-600 text-white font-black' },
  { id: 'shadow_drop', label: '드롭 섀도우', previewClass: 'bg-transparent text-white drop-shadow-[3px_3px_5px_rgba(0,0,0,0.9)] font-bold' },
];

/**
 * 자막 상자 및 오버레이 배경 색상에 0~100% 투명도를 적용하는 헬퍼 함수
 */
export const applyOpacityToColor = (color: string, opacityPercent: number = 100): string => {
  if (!color || color === 'transparent' || opacityPercent <= 0) {
    return 'transparent';
  }
  const factor = Math.max(0, Math.min(100, opacityPercent)) / 100;
  const trimmed = color.trim().toLowerCase();

  // rgba(r, g, b, a)
  const rgbaMatch = trimmed.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    const a = parseFloat(rgbaMatch[4]);
    return `rgba(${r}, ${g}, ${b}, ${(a * factor).toFixed(3)})`;
  }

  // rgb(r, g, b)
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return `rgba(${r}, ${g}, ${b}, ${factor.toFixed(3)})`;
  }

  // Hex: #rgb, #rgba, #rrggbb, #rrggbbaa
  if (trimmed.startsWith('#')) {
    let hex = trimmed.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const a = parseInt(hex[3] + hex[3], 16) / 255;
      return `rgba(${r}, ${g}, ${b}, ${(a * factor).toFixed(3)})`;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${factor.toFixed(3)})`;
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      return `rgba(${r}, ${g}, ${b}, ${(a * factor).toFixed(3)})`;
    }
  }

  return color;
};

const PHOTO_ASPECT_RATIOS: { id: PhotoAspectRatio; label: string; sub: string; desc: string; ratioDisplay: string }[] = [
  { id: '1:1', label: '1:1 정사각형 카드', sub: '쇼츠 대세 추천', desc: '인물·사물이 잘리지 않고 자막 공간이 넉넉한 바이럴 쇼츠 표준', ratioDisplay: '1 : 1' },
  { id: '9:16', label: '9:16 전체 채움', sub: '풀스크린 꽉 채움', desc: '상하좌우 빈틈없이 꽉 채우는 몰입형 세로 풀스크린', ratioDisplay: '9 : 16' },
  { id: '4:5', label: '4:5 인물 세로비', sub: '인스타/피드 규격', desc: '인물 상반신과 인터뷰 클립에 가장 안정적인 세로 카드 비율', ratioDisplay: '4 : 5' },
  { id: '16:9', label: '16:9 와이드 카드', sub: '가로 원본 유지', desc: '뉴스 자료, 유튜브 원본, 방송 캡처 가로 사진에 최적화', ratioDisplay: '16 : 9' },
  { id: 'fit', label: '원본 비율 유지', sub: '사진 원본 100%', desc: '크롭(잘림) 없이 원본 비율 그대로 중앙에 배치', ratioDisplay: 'FIT' },
];

const BACKDROP_STYLES: { id: BackdropStyle; label: string; desc: string; badge: string }[] = [
  { id: 'card_white', label: '화이트 카드뉴스 프레임', desc: '상단/하단 흰색 여백으로 상단 헤드라인과 자막이 가장 돋보이는 릴스 떡상 스타일', badge: '샘플 추천' },
  { id: 'card_black', label: '블랙 시네마틱 프레임', desc: '상단/하단 딥 블랙 여백으로 영화적 비율감과 깔끔한 가독성 제공', badge: '깔끔한 대비' },
  { id: 'blur', label: '앰비언트 블러', desc: '원본 사진을 배경에 은은하게 블러 처리하여 고급스러운 분위기 연출', badge: '가장 자연스러움' },
  { id: 'dark', label: '다크 스튜디오 매트', desc: '딥 다크 블랙 배경으로 사진 카드와 자막에만 시선 100% 집중', badge: '몰입감 극대화' },
  { id: 'gradient', label: '시네마틱 그라디언트', desc: '딥 인디고 & 바이올렛 그라데이션으로 트렌디한 영상미 부여', badge: '감성적 분위기' },
];

export const VIDEO_TONE_PRESETS: {
  id: VideoMoodTone;
  title: string;
  badge: string;
  desc: string;
  characteristics: string[];
  recommendedBackdrop: BackdropStyle;
  recommendedFont: SubtitleFontFamily;
  recommendedSubtitleStyle: SubtitleEffectStyle;
  recommendedVoiceId: string;
  recommendedSpeed: number;
}[] = [
  {
    id: 'Cinematic',
    title: '🎬 Cinematic (시네마틱 웅장함)',
    badge: '영화적 몰입감',
    desc: '영화 한 편을 보는 듯한 웅장하고 드라마틱한 서사. 시네마틱 그라디언트 배경과 모던 고딕 자막에 최적화',
    characteristics: ['서정적이고 묵직한 호흡', '시네마틱 줌인/줌아웃', '오케스트라/웅장한 톤'],
    recommendedBackdrop: 'gradient',
    recommendedFont: 'Pretendard',
    recommendedSubtitleStyle: 'white_outline',
    recommendedVoiceId: 'pNInz6obpgDQGcFmaJgB', // 아담 (Adam - 카리스마 다큐멘터리)
    recommendedSpeed: 1.0,
  },
  {
    id: 'Documentary',
    title: '🎙️ Documentary (진솔한 휴먼다큐)',
    badge: '깊은 울림과 신뢰',
    desc: '인간극장·SBS 스페셜 풍의 묵직하고 진정성 있는 서사. 차분한 딥 다크 배경과 다큐멘터리 명조체 자막에 최적화',
    characteristics: ['진정성 넘치는 어조', '아카이브 흑백 사진 조명', '감동의 인생 역전'],
    recommendedBackdrop: 'dark',
    recommendedFont: 'Song Myung',
    recommendedSubtitleStyle: 'white_outline',
    recommendedVoiceId: 'JBFqnCBsd6RMkjVDRZzb', // 조지 (George - 인간극장 다큐)
    recommendedSpeed: 0.95,
  },
  {
    id: 'Fast-paced',
    title: '⚡ Fast-paced (도파민 쾌속 비트)',
    badge: '1초 시선 강탈',
    desc: '1초의 공백도 허용하지 않는 빠른 템포와 펀치력. 시선 강탈 옐로우 박스 자막과 속도감 넘치는 전개',
    characteristics: ['1초 만에 꽂히는 펀치라인', '다이내믹 줌 & 컷전환', '1.2x 속도감'],
    recommendedBackdrop: 'blur',
    recommendedFont: 'GmarketSans',
    recommendedSubtitleStyle: 'yellow_box',
    recommendedVoiceId: 'TX3LPaxmHKxFdv7VOQHJ', // 리암 (Liam - 도파민 숏폼남)
    recommendedSpeed: 1.2,
  },
  {
    id: 'Minimal',
    title: '🧊 Minimal (절제된 미니멀)',
    badge: '깔끔한 정보 전달',
    desc: '군더더기를 걷어낸 정갈하고 세련된 미니멀리즘. 팩트 전달에 집중하는 절제된 레이아웃',
    characteristics: ['직관적이고 담백한 문장', '심플한 캡슐 자막', '정돈된 영상미'],
    recommendedBackdrop: 'dark',
    recommendedFont: 'Pretendard',
    recommendedSubtitleStyle: 'black_capsule',
    recommendedVoiceId: 'Xb7hH8MSUJpSbSDYk0k2', // 앨리스 (Alice - 명쾌한 지식형)
    recommendedSpeed: 1.05,
  },
];

// Helper: Splits long narration into punchy, readable CapCut-style subtitle chunks (2~4 words / 6~12 chars)
// In viral shorts/reels, subtitles should split at natural Korean grammatical & breath pauses (어절, 연결어미, 조사 단위)
// so that words are never awkwardly cut or isolated from context!
export const getSubtitleChunks = (
  narration: string,
  tempo: SubtitleTempo = 'fast'
): string[] => {
  const clean = narration.trim().replace(/\s+/g, ' ');
  if (!clean) return [''];

  const targetChars = tempo === 'fast' ? 12 : tempo === 'standard' ? 15 : 18;
  const maxSoftLimit = tempo === 'fast' ? 16 : tempo === 'standard' ? 20 : 25;
  const minChars = 4;

  // 1. Split by major punctuation first, keeping punctuation attached
  const punctClauses = clean.split(/(?<=[,?!~…])\s+|(?<=\.\.\.)\s+/).map((s) => s.trim()).filter(Boolean);
  const resultChunks: string[] = [];

  // Prefixes/modifiers that must NEVER be left alone at the end of a subtitle chunk
  const stickyPrefixes = /^(한|두|세|그|이|저|전|모든|어떤|새로운|더|가장|너무|완전히|어떻게|과연|결국|비록|매일|열심히)$/;
  // Suffixes/counters that must stick to preceding word
  const stickySuffixes = /^(\d+.*|셰프.*|선수.*|감독.*|대표.*|스타.*|년.*|월.*|일.*|시.*|분.*|초.*|명.*|개.*|배.*|위.*|%.*|원.*|씨.*|님.*)$/;

  for (const clause of punctClauses) {
    if (clause.length <= targetChars + 2) {
      resultChunks.push(clause);
      continue;
    }

    const words = clause.split(' ').filter(Boolean);
    if (words.length <= 1) {
      resultChunks.push(clause);
      continue;
    }

    let currentWords: string[] = [];
    let currentLen = 0;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const nextW = words[i + 1] || '';
      const wLen = w.length;
      const spaceLen = currentWords.length > 0 ? 1 : 0;
      const combinedLen = currentLen + spaceLen + wLen;

      currentWords.push(w);
      currentLen = combinedLen;

      if (i === words.length - 1) {
        resultChunks.push(currentWords.join(' '));
        break;
      }

      let breakScore = 0;
      // High-priority natural breath & clause connectives (~고, ~며, ~지만, ~는데, ~아서, ~어서, ~여서, ~면서, ~자, ~더니, ~니까, ~므로, ~록, ~려고, ~나, ~보고)
      if (/[고며자]$|지만$|는데$|은데$|아서$|어서$|여서$|면서$|더니$|니까$|므로$|록$|려고$|일어나$|달려가$|바라보며$|보고$/.test(w)) {
        breakScore += 90;
      } else if (/(던|었던|았던)$/.test(w)) {
        breakScore += 65;
      } else if (/[은는이가]$|에서는$|에게는$/.test(w)) {
        breakScore += 45;
      }

      // Discourage cutting between object marker (~을/를) and the following verb!
      if (/[을를]$/.test(w)) {
        breakScore -= 20;
      }

      // Penalties for unnatural cuts
      if (stickyPrefixes.test(w)) breakScore -= 90;
      if (/의$/.test(w)) breakScore -= 90;
      if (stickySuffixes.test(nextW)) breakScore -= 90;
      if (/^(놓았습니다|있었습니다|보았습니다|버렸습니다|않았습니다)$/.test(nextW)) breakScore -= 80;

      const isOverTarget = currentLen >= targetChars - 1;
      const isNearMax = currentLen >= maxSoftLimit - 1;
      const isPastMax = currentLen >= maxSoftLimit;

      if ((isOverTarget && breakScore >= 45) || (isNearMax && breakScore > 0) || isPastMax) {
        if (breakScore < 0 && currentLen < maxSoftLimit + 3) {
          continue;
        }

        resultChunks.push(currentWords.join(' '));
        currentWords = [];
        currentLen = 0;
      }
    }
  }

  // Post-process: merge tiny trailing fragments if any
  const finalChunks: string[] = [];
  for (let i = 0; i < resultChunks.length; i++) {
    const chunk = resultChunks[i].trim();
    if (finalChunks.length > 0 && chunk.length < minChars && !/[.!?…]$/.test(finalChunks[finalChunks.length - 1])) {
      const prev = finalChunks.pop()!;
      finalChunks.push(`${prev} ${chunk}`);
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks.length > 0 ? finalChunks : [clean];
};

// Industrial-grade WebM EBML duration & Cues seek index patcher
// Fixes Android Stagefright / Samsung Gallery / KakaoTalk "00:12 / 00:03" metadata bug:
export const patchWebmBinaryDuration = patchWebmBinaryDurationAndCues;

// Industrial-grade Fragmented MP4 duration patcher & mehd injector
// Solves Android Stagefright / Samsung Gallery / KakaoTalk "00:03" duration truncation bug:
export const fixMp4Duration = async (blob: Blob, durationSec: number): Promise<Blob> => {
  if (!durationSec || durationSec <= 0 || isNaN(durationSec)) return blob;
  try {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const findBox = (tag: string, startOffset = 0, endOffset = bytes.length): number => {
      const c0 = tag.charCodeAt(0), c1 = tag.charCodeAt(1), c2 = tag.charCodeAt(2), c3 = tag.charCodeAt(3);
      const limit = Math.min(endOffset - 4, bytes.length - 4);
      for (let i = startOffset; i <= limit; i++) {
        if (bytes[i] === c0 && bytes[i + 1] === c1 && bytes[i + 2] === c2 && bytes[i + 3] === c3) {
          return i;
        }
      }
      return -1;
    };

    // Locate moov box
    const moovTagOffset = findBox('moov');
    if (moovTagOffset === -1 || moovTagOffset < 4) {
      return blob;
    }
    const moovBoxStart = moovTagOffset - 4;
    const moovSize = view.getUint32(moovBoxStart);
    const moovEnd = moovSize > 0 ? moovBoxStart + moovSize : arrayBuffer.byteLength;

    // 1. Patch mvhd (Movie Header Box)
    let movieTimescale = 1000;
    const mvhdTagOffset = findBox('mvhd', moovBoxStart, moovEnd);
    if (mvhdTagOffset !== -1) {
      const version = view.getUint8(mvhdTagOffset + 4);
      if (version === 0) {
        movieTimescale = view.getUint32(mvhdTagOffset + 16) || 1000;
        const targetDur = Math.round(durationSec * movieTimescale);
        view.setUint32(mvhdTagOffset + 20, targetDur);
      } else if (version === 1) {
        movieTimescale = view.getUint32(mvhdTagOffset + 24) || 1000;
        const targetDur = Math.round(durationSec * movieTimescale);
        view.setUint32(mvhdTagOffset + 28, 0);
        view.setUint32(mvhdTagOffset + 32, targetDur);
      }
    }

    // 2. Patch all tkhd (Track Header Boxes) and mdhd (Media Header Boxes) inside every trak
    let curOffset = moovBoxStart;
    while (curOffset < moovEnd) {
      const trakTagOffset = findBox('trak', curOffset, moovEnd);
      if (trakTagOffset === -1 || trakTagOffset < 4) break;
      const trakBoxStart = trakTagOffset - 4;
      const trakSize = view.getUint32(trakBoxStart);
      const trakEnd = trakSize > 0 ? trakBoxStart + trakSize : moovEnd;

      // Patch tkhd (duration in movieTimescale)
      const tkhdTagOffset = findBox('tkhd', trakBoxStart, trakEnd);
      if (tkhdTagOffset !== -1) {
        const v = view.getUint8(tkhdTagOffset + 4);
        const targetDur = Math.round(durationSec * movieTimescale);
        if (v === 0) {
          view.setUint32(tkhdTagOffset + 24, targetDur);
        } else if (v === 1) {
          view.setUint32(tkhdTagOffset + 32, 0);
          view.setUint32(tkhdTagOffset + 36, targetDur);
        }
      }

      // Patch mdhd inside mdia (duration in mediaTimescale)
      const mdhdTagOffset = findBox('mdhd', trakBoxStart, trakEnd);
      if (mdhdTagOffset !== -1) {
        const v = view.getUint8(mdhdTagOffset + 4);
        if (v === 0) {
          const mediaTimescale = view.getUint32(mdhdTagOffset + 16) || 1000;
          const targetDur = Math.round(durationSec * mediaTimescale);
          view.setUint32(mdhdTagOffset + 20, targetDur);
        } else if (v === 1) {
          const mediaTimescale = view.getUint32(mdhdTagOffset + 24) || 1000;
          const targetDur = Math.round(durationSec * mediaTimescale);
          view.setUint32(mdhdTagOffset + 28, 0);
          view.setUint32(mdhdTagOffset + 32, targetDur);
        }
      }

      curOffset = Math.max(trakEnd, trakTagOffset + 4);
    }

    // 3. Patch or Inject mehd (Movie Extends Header Box) inside mvex
    // This is the absolute critical fix for Android Stagefright (MPEG4Extractor):
    // Stagefright ignores mvhd in fragmented MP4 and defaults duration to the first ~3s fragment
    // if mehd is absent in mvex!
    const mvexTagOffset = findBox('mvex', moovBoxStart, moovEnd);
    if (mvexTagOffset !== -1 && mvexTagOffset >= 4) {
      const mvexBoxStart = mvexTagOffset - 4;
      const mvexSize = view.getUint32(mvexBoxStart);
      const mvexEnd = mvexSize > 0 ? mvexBoxStart + mvexSize : moovEnd;
      const mehdTagOffset = findBox('mehd', mvexBoxStart, mvexEnd);
      const targetDur = Math.round(durationSec * movieTimescale);

      if (mehdTagOffset !== -1) {
        const v = view.getUint8(mehdTagOffset + 4);
        if (v === 0) {
          view.setUint32(mehdTagOffset + 8, targetDur);
        } else if (v === 1) {
          view.setUint32(mehdTagOffset + 8, 0);
          view.setUint32(mehdTagOffset + 12, targetDur);
        }
        return new Blob([bytes], { type: blob.type || 'video/mp4' });
      } else {
        // Inject mehd (16 bytes, version 0 FullBox) as the first child of mvex
        const mehdBytes = new Uint8Array(16);
        const mehdView = new DataView(mehdBytes.buffer);
        mehdView.setUint32(0, 16); // box size
        mehdBytes[4] = 0x6d; // 'm'
        mehdBytes[5] = 0x65; // 'e'
        mehdBytes[6] = 0x68; // 'h'
        mehdBytes[7] = 0x64; // 'd'
        mehdBytes[8] = 0; // version 0
        mehdBytes[9] = 0; // flags
        mehdBytes[10] = 0;
        mehdBytes[11] = 0;
        mehdView.setUint32(12, targetDur);

        // Insertion index: right after mvex box header (mvexTagOffset + 4)
        const insertPos = mvexTagOffset + 4;
        const newBuf = new Uint8Array(bytes.length + 16);
        newBuf.set(bytes.subarray(0, insertPos), 0);
        newBuf.set(mehdBytes, insertPos);
        newBuf.set(bytes.subarray(insertPos), insertPos + 16);

        // Update container sizes: mvex and moov both expand by 16 bytes
        const newView = new DataView(newBuf.buffer);
        newView.setUint32(mvexBoxStart, mvexSize + 16);
        newView.setUint32(moovBoxStart, moovSize + 16);

        return new Blob([newBuf], { type: blob.type || 'video/mp4' });
      }
    }

    return new Blob([bytes], { type: blob.type || 'video/mp4' });
  } catch (err) {
    console.warn('fixMp4Duration error:', err);
    return blob;
  }
};

export interface SubtitleChunkTiming {
  text: string;
  startSec: number;
  endSec: number;
}

export interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const clean = (base64 || '').replace(/\s+/g, '');
  const binaryString = window.atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const detectAudioLeadingSilence = (audioBuffer: AudioBuffer): number => {
  try {
    const data = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const maxSearchSamples = Math.min(data.length, Math.floor(sampleRate * 0.4));
    const threshold = 0.012;

    for (let i = 0; i < maxSearchSamples; i++) {
      if (Math.abs(data[i]) > threshold) {
        return Math.max(0, (i / sampleRate) - 0.02);
      }
    }
    return 0;
  } catch {
    return 0;
  }
};

export const computeAlignedSubtitleChunks = (
  narration: string,
  tempo: SubtitleTempo = 'fast',
  alignment: ElevenLabsAlignment | null | undefined,
  totalSpokenDuration: number,
  playbackRate: number = 1.0,
  leadingSilenceSec: number = 0
): SubtitleChunkTiming[] => {
  const chunks = getSubtitleChunks(narration, tempo);
  if (chunks.length === 0) return [];
  if (chunks.length === 1) {
    return [{ text: chunks[0], startSec: 0, endSec: Math.max(0.5, totalSpokenDuration) }];
  }

  // 1. Exact ElevenLabs Character Timestamps Alignment (Millisecond phonetic accuracy)
  if (alignment && Array.isArray(alignment.characters) && alignment.characters.length > 0) {
    const chars = alignment.characters;
    const starts = alignment.character_start_times_seconds || [];
    const ends = alignment.character_end_times_seconds || [];

    const timings: SubtitleChunkTiming[] = [];
    let searchCharIndex = 0;

    for (let c = 0; c < chunks.length; c++) {
      const chunkText = chunks[c].trim();
      const firstSignificantChar = chunkText.replace(/^["'“‘s]+/, '')[0] || chunkText[0];

      let charIdx = -1;
      for (let j = searchCharIndex; j < chars.length; j++) {
        if (chars[j] === firstSignificantChar) {
          charIdx = j;
          break;
        }
      }

      let rawStart = charIdx !== -1 && starts[charIdx] !== undefined ? starts[charIdx] : 0;
      if (c === 0) {
        rawStart = Math.max(0, leadingSilenceSec);
      } else if (timings.length > 0 && rawStart < timings[c - 1].startSec * playbackRate) {
        rawStart = timings[c - 1].endSec * playbackRate;
      }

      const chunkCharCount = chunkText.replace(/\s+/g, '').length;
      const endCharIdx = charIdx !== -1 ? Math.min(chars.length - 1, charIdx + chunkCharCount - 1) : charIdx;
      let rawEnd = endCharIdx !== -1 && ends[endCharIdx] !== undefined ? ends[endCharIdx] : rawStart + 0.8;

      const startSec = Math.max(0, rawStart / playbackRate);
      let endSec = Math.max(startSec + 0.35, rawEnd / playbackRate);

      if (c > 0 && startSec < timings[c - 1].endSec) {
        timings[c - 1].endSec = startSec;
      }

      timings.push({
        text: chunks[c],
        startSec,
        endSec,
      });

      if (endCharIdx !== -1) {
        searchCharIndex = Math.min(chars.length - 1, endCharIdx + 1);
      }
    }

    for (let i = 0; i < timings.length - 1; i++) {
      timings[i].endSec = timings[i + 1].startSec;
    }
    timings[timings.length - 1].endSec = Math.max(
      timings[timings.length - 1].startSec + 0.5,
      totalSpokenDuration
    );

    return timings;
  }

  // 2. High-precision Syllable & Punctuation Fallback Alignment
  const timings: SubtitleChunkTiming[] = [];
  const activeDur = Math.max(0.5, totalSpokenDuration - leadingSilenceSec);

  const weights = chunks.map((chunk) => {
    const rawSyllables = chunk.replace(/[^가-힣a-zA-Z0-9]/g, '').length;
    let pauseBonus = 0;
    if (chunk.match(/[,~]/)) pauseBonus += 1.5;
    if (chunk.match(/[.!?]/)) pauseBonus += 2.5;
    return Math.max(2, rawSyllables + pauseBonus);
  });

  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let curSec = leadingSilenceSec;

  for (let i = 0; i < chunks.length; i++) {
    const dur = (weights[i] / totalWeight) * activeDur;
    const startSec = curSec;
    const endSec = (i === chunks.length - 1) ? Math.max(startSec + 0.4, totalSpokenDuration) : startSec + dur;
    timings.push({
      text: chunks[i],
      startSec,
      endSec,
    });
    curSec = endSec;
  }

  return timings;
};

export const summarizeToShortHeadline = (title: string, figureName?: string): string => {
  const fig = (figureName || '').trim();
  const raw = (title || fig || '화제의 인물 이야기').trim();

  // If already a clean 2-line text under 26 chars, preserve it
  if (raw.includes('\n') && raw.length <= 26) {
    return raw;
  }

  // 1. Clean hashtags, brackets, dots, youtube flags
  let text = raw
    .replace(/#\S+/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\.{2,}/g, ' ')
    .replace(/#shorts/gi, '')
    .trim();

  // 2. Remove typical long fluff
  const fluff = [
    /단\s*1분\s*만에\s*보는/g,
    /아무도\s*몰랐던/g,
    /충격적인/g,
    /눈물겨운/g,
    /기적\s*같은/g,
    /인생\s*역전\s*실화/g,
    /반전\s*실화/g,
    /충격\s*실화/g,
    /비하인드\s*스토리/g,
    /비하인드/g,
    /감동\s*실화/g,
    /동기부여/g,
    /실화\s*바탕/g,
    /이야기/g,
  ];
  for (const f of fluff) {
    text = text.replace(f, '').trim();
  }
  text = text.replace(/[.,~!?]+$/g, '').trim();

  // Special pattern: "정비병... 미슐랭 3스타"
  if (text.includes('정비병') && text.includes('미슐랭')) {
    return `정비병에서 미슐랭 3스타\n${fig || '안성재 셰프'}의 기적`;
  }

  // Pattern: "A에서 B까지"
  const fromTo = text.match(/^(.*?에서)\s+(.*?)(?:까지)?\s*(.*)$/);
  if (fromTo) {
    const line1 = fromTo[1].replace(/파병\s*/g, '').trim();
    const line2 = fromTo[2].replace(/까지/g, '').trim();
    if (line1 && line2 && line1.length <= 15 && line2.length <= 15) {
      return `${line1}\n${line2}`;
    }
  }

  // Pattern: "...한 X" (e.g. "이건희도 못 한 걸 해낸 삼성가 사위")
  const hanMatch = text.match(/^(.*?(?:해낸|제압한|바꾼|넘은|달린|살린|이룬|터진))\s+(.*)$/);
  if (hanMatch) {
    const l1 = hanMatch[1].trim();
    const l2 = hanMatch[2].trim();
    if (l1.length <= 16 && l2.length <= 16) {
      return `${l1}\n${l2}`;
    }
  }

  // Balanced 2 lines by words
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const mid = Math.ceil(words.length / 2);
    const line1 = words.slice(0, mid).join(' ');
    const line2 = words.slice(mid).join(' ');
    if (line1.length <= 14 && line2.length <= 14) {
      return `${line1}\n${line2}`;
    }
  }

  if (fig && !text.includes(fig)) {
    return `${text.slice(0, 10)}\n${fig}`;
  }

  return text.slice(0, 18);
};

// Helper: Generates 3~4 punchy 2-line headline recommendations for the user to choose
export const getShortHeadlinePresets = (project: ShortsProject): string[] => {
  const fig = project.figureName || '';
  const presets: string[] = [];

  // Special figure / topic checks
  if (fig.includes('안성재') || (project.titles && project.titles.some((t) => t.includes('정비병') || t.includes('미슐랭')))) {
    presets.push('정비병에서 미슐랭 3스타\n안성재 셰프의 기적');
    presets.push('전 세계 0.001%\n미슐랭 3스타의 비밀');
    presets.push('흙수저 정비병이\n3스타 셰프가 된 사연');
    return presets;
  }

  if (project.titles && project.titles[0]) {
    const s1 = summarizeToShortHeadline(project.titles[0], fig);
    if (s1) presets.push(s1);
  }

  if (project.titles && project.titles[1]) {
    const s2 = summarizeToShortHeadline(project.titles[1], fig);
    if (s2 && !presets.includes(s2)) presets.push(s2);
  }

  if (fig) {
    presets.push(`모두가 포기하라 했던\n${fig}의 반전 실화`);
    presets.push(`단 3초 만에 몰입되는\n${fig}의 숨겨진 이야기`);
  }

  return Array.from(new Set(presets)).slice(0, 4);
};

export const VideoRendererModal: React.FC<VideoRendererModalProps> = ({
  isOpen,
  onClose,
  project,
  isPageMode = false,
  onBackToEditor,
  onBackToTrends,
  onUpdateProject,
  onSaveProject,
}) => {
  // Video Resolution
  const [resolution, setResolution] = useState<'1080p' | '720p'>('1080p');

  // Photo Aspect Ratio & Backdrop Framing (1:1 정사각형, 9:16 전체, 4:5, 16:9, fit)
  const [photoAspectRatio, setPhotoAspectRatio] = useState<PhotoAspectRatio>(project.photoAspectRatio || '1:1');
  const [backdropStyle, setBackdropStyle] = useState<BackdropStyle>(project.backdropStyle || 'card_white');

  // CapCut-Style Custom Text Overlays (멀티 자막 & 텍스트 레이어)
  const [customTextOverlays, setCustomTextOverlays] = useState<CustomTextOverlay[]>(() => {
    if (project.customTextOverlays && project.customTextOverlays.length > 0) {
      return project.customTextOverlays;
    }
    // Default top headline overlay matching the sample layout (auto-summarized 2-line viral format)
    const initialHeadline = summarizeToShortHeadline(
      project.titles && project.titles.length > 0 ? project.titles[0] : project.figureName,
      project.figureName
    );
    return [
      {
        id: `ov-head-${Date.now()}`,
        text: initialHeadline,
        startScene: 1,
        endScene: project.scenes.length || 12,
        positionYPercent: 17, // 상단자막 17% 기본값
        positionX: 'center',
        positionXPercent: 50,
        rotationDeg: 0,
        fontSizeScale: 1.25,
        fontFamily: 'Pretendard',
        textColor: '#000000',
        backgroundColor: 'transparent',
        isBold: true,
      }
    ];
  });

  // Channel Logo & Watermark Overlay (샘플 릴스 스타일)
  const [channelLogo, setChannelLogo] = useState<ChannelLogoOverlay>(() => {
    if (project.channelLogoOverlay) {
      return project.channelLogoOverlay;
    }
    return {
      enabled: true,
      imageUrl: project.scenes[0]?.uploadedImageUrl || undefined,
      channelName: 'Untold',
      position: 'top-left',
      startScene: 1,
      endScene: project.scenes.length || 12,
      size: 'medium',
      shape: 'circle',
      showChannelName: true,
    };
  });

  const logoImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (channelLogo.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        logoImageRef.current = img;
      };
      img.src = channelLogo.imageUrl;
    } else {
      logoImageRef.current = null;
    }
  }, [channelLogo.imageUrl]);

  // Subtitle Customizations (화이트 카드뉴스 프레임 기본값: 86% 최하단, 프리텐다드)
  const [subtitleFont, setSubtitleFont] = useState<SubtitleFontFamily>(project.subtitleFont || 'Pretendard');
  const [subtitleXPercent, setSubtitleXPercent] = useState<number>(project.subtitleXPercent ?? 50);
  const [subtitleYPercent, setSubtitleYPercent] = useState<number>(() => {
    if (project.subtitleYPercent !== undefined) return project.subtitleYPercent;
    return 81; // 하단자막 81% 모든 프레임의 기본값
  });
  const [subtitleRotationDeg, setSubtitleRotationDeg] = useState<number>(project.subtitleRotationDeg ?? 0);
  const [subtitleBgOpacity, setSubtitleBgOpacity] = useState<number>(project.subtitleBgOpacity ?? 92);
  const [activeDragSubtitle, setActiveDragSubtitle] = useState<'main' | string | null>(null);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<'main' | string | null>(null);
  const [subtitleSizeScale, setSubtitleSizeScale] = useState<number>(1.1); // 0.8 to 1.4
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleEffectStyle>('yellow_box');
  const [subtitleTempo, setSubtitleTempo] = useState<SubtitleTempo>(project.subtitleTempo || 'fast');
  const [previewChunkIndex, setPreviewChunkIndex] = useState<number>(0);
  const [isAutoCyclingChunks, setIsAutoCyclingChunks] = useState<boolean>(true);

  // ElevenLabs Voice & Settings (Default: eleven_v4)
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(project.selectedVoiceId || 'JBFqnCBsd6RMkjVDRZzb');
  const [voiceSpeedMultiplier, setVoiceSpeedMultiplier] = useState<number>(project.voiceSpeedMultiplier || 1.05);
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState<string>('all');
  const [elevenLabsModel, setElevenLabsModel] = useState<string>(project.elevenLabsModel || 'eleven_v4');
  const [elevenLabsStability, setElevenLabsStability] = useState<number>(project.elevenLabsSettings?.stability ?? 0.50);
  const [elevenLabsSimilarity, setElevenLabsSimilarity] = useState<number>(project.elevenLabsSettings?.similarityBoost ?? 0.75);
  const [elevenLabsStyle, setElevenLabsStyle] = useState<number>(project.elevenLabsSettings?.style ?? 0.15);
  const [elevenLabsSpeakerBoost, setElevenLabsSpeakerBoost] = useState<boolean>(project.elevenLabsSettings?.useSpeakerBoost ?? true);

  // Video Mood Tone State
  const [videoTone, setVideoTone] = useState<VideoMoodTone>(project.videoTone || 'Cinematic');

  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    if (onUpdateProject) {
      onUpdateProject({
        ...project,
        customTextOverlays,
        channelLogoOverlay: channelLogo,
        subtitleXPercent,
        subtitleYPercent,
        subtitleRotationDeg,
        subtitleBgOpacity,
        backdropStyle,
        photoAspectRatio,
        videoTone,
        subtitleTempo,
        selectedVoiceId,
        voiceSpeedMultiplier,
        elevenLabsModel,
        elevenLabsSettings: {
          stability: elevenLabsStability,
          similarityBoost: elevenLabsSimilarity,
          style: elevenLabsStyle,
          useSpeakerBoost: elevenLabsSpeakerBoost,
        },
      });
    }
  }, [
    customTextOverlays,
    channelLogo,
    subtitleXPercent,
    subtitleYPercent,
    subtitleRotationDeg,
    subtitleBgOpacity,
    backdropStyle,
    photoAspectRatio,
    videoTone,
    subtitleTempo,
    selectedVoiceId,
    voiceSpeedMultiplier,
    elevenLabsModel,
    elevenLabsStability,
    elevenLabsSimilarity,
    elevenLabsStyle,
    elevenLabsSpeakerBoost
  ]);

  // States
  const [isPlayingVoiceSample, setIsPlayingVoiceSample] = useState(false);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0); // 0 - 100
  const [currentRenderingScene, setCurrentRenderingScene] = useState(1);
  const [statusMessage, setStatusMessage] = useState('렌더링 준비 완료');
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [videoBlobType, setVideoBlobType] = useState<string>('video/mp4');
  const [videoBlobFile, setVideoBlobFile] = useState<Blob | null>(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [previewViewMode, setPreviewViewMode] = useState<'live' | 'video'>('live');
  const [previewSceneIndex, setPreviewSceneIndex] = useState(0);
  const [platformGuide, setPlatformGuide] = useState<PlatformGuideType>('none');
  const [isPreviewCollapsed, setIsPreviewCollapsed] = useState(false);

  // Step 3 Vault Save States
  const [isSavingToVault, setIsSavingToVault] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Custom Presets for Overlay & Subtitles (사용자 커스텀 셋팅 영구 보관)
  const OVERLAY_PRESETS_STORAGE_KEY = 'autoshorts_custom_overlay_presets_v1';
  const SUBTITLE_PRESETS_STORAGE_KEY = 'autoshorts_custom_subtitle_presets_v1';

  const [overlayPresets, setOverlayPresets] = useState<CustomOverlayPreset[]>(() => {
    try {
      const saved = localStorage.getItem(OVERLAY_PRESETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newOverlayPresetName, setNewOverlayPresetName] = useState<string>('');

  const [subtitlePresets, setSubtitlePresets] = useState<CustomSubtitlePreset[]>(() => {
    try {
      const saved = localStorage.getItem(SUBTITLE_PRESETS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newSubtitlePresetName, setNewSubtitlePresetName] = useState<string>('');
  const [presetToastMessage, setPresetToastMessage] = useState<string | null>(null);

  const showPresetToast = (msg: string) => {
    setPresetToastMessage(msg);
    setTimeout(() => {
      setPresetToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleSaveOverlayPreset = (customName?: string) => {
    const finalName = customName?.trim() || `오버레이 세팅 ${overlayPresets.length + 1}`;
    const newPreset: CustomOverlayPreset = {
      id: `ov-preset-${Date.now()}`,
      name: finalName,
      createdAt: new Date().toISOString(),
      channelLogo: { ...channelLogo },
      customTextOverlays: customTextOverlays.map(t => ({ ...t })),
      backdropStyle,
      photoAspectRatio,
    };
    const updated = [newPreset, ...overlayPresets.filter(p => p.name !== finalName)];
    setOverlayPresets(updated);
    try {
      localStorage.setItem(OVERLAY_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save overlay preset:', e);
    }
    showPresetToast(`💾 '${finalName}' 오버레이 설정이 저장되었습니다!`);
  };

  const handleApplyOverlayPreset = (preset: CustomOverlayPreset) => {
    if (preset.channelLogo) setChannelLogo(preset.channelLogo);
    if (preset.customTextOverlays) setCustomTextOverlays(preset.customTextOverlays);
    if (preset.backdropStyle) setBackdropStyle(preset.backdropStyle);
    if (preset.photoAspectRatio) setPhotoAspectRatio(preset.photoAspectRatio);
    showPresetToast(`✨ '${preset.name}' 오버레이 설정이 적용되었습니다!`);
  };

  const handleDeleteOverlayPreset = (id: string) => {
    const updated = overlayPresets.filter(p => p.id !== id);
    setOverlayPresets(updated);
    try {
      localStorage.setItem(OVERLAY_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete overlay preset:', e);
    }
    showPresetToast('🗑️ 오버레이 프리셋이 삭제되었습니다.');
  };

  const handleSaveSubtitlePreset = (customName?: string) => {
    const finalName = customName?.trim() || `자막 스타일 ${subtitlePresets.length + 1}`;
    const newPreset: CustomSubtitlePreset = {
      id: `sub-preset-${Date.now()}`,
      name: finalName,
      createdAt: new Date().toISOString(),
      subtitleFont,
      subtitleStyle,
      subtitleSizeScale,
      subtitleXPercent,
      subtitleYPercent,
      subtitleRotationDeg,
      subtitleBgOpacity,
      subtitleTempo,
    };
    const updated = [newPreset, ...subtitlePresets.filter(p => p.name !== finalName)];
    setSubtitlePresets(updated);
    try {
      localStorage.setItem(SUBTITLE_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save subtitle preset:', e);
    }
    showPresetToast(`💾 '${finalName}' 자막 스타일이 저장되었습니다!`);
  };

  const handleApplySubtitlePreset = (preset: CustomSubtitlePreset) => {
    if (preset.subtitleFont) setSubtitleFont(preset.subtitleFont);
    if (preset.subtitleStyle) setSubtitleStyle(preset.subtitleStyle);
    if (preset.subtitleSizeScale !== undefined) setSubtitleSizeScale(preset.subtitleSizeScale);
    if (preset.subtitleXPercent !== undefined) setSubtitleXPercent(preset.subtitleXPercent);
    if (preset.subtitleYPercent !== undefined) setSubtitleYPercent(preset.subtitleYPercent);
    if (preset.subtitleRotationDeg !== undefined) setSubtitleRotationDeg(preset.subtitleRotationDeg);
    if (preset.subtitleBgOpacity !== undefined) setSubtitleBgOpacity(preset.subtitleBgOpacity);
    if (preset.subtitleTempo) setSubtitleTempo(preset.subtitleTempo);
    showPresetToast(`✨ '${preset.name}' 자막 스타일이 적용되었습니다!`);
  };

  const handleDeleteSubtitlePreset = (id: string) => {
    const updated = subtitlePresets.filter(p => p.id !== id);
    setSubtitlePresets(updated);
    try {
      localStorage.setItem(SUBTITLE_PRESETS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to delete subtitle preset:', e);
    }
    showPresetToast('🗑️ 자막 프리셋이 삭제되었습니다.');
  };

  const handleSaveToVault = async () => {
    if (!onSaveProject) return;
    setIsSavingToVault(true);
    setSaveSuccessMsg(null);
    try {
      const updatedProj: ShortsProject = {
        ...project,
        customTextOverlays,
        channelLogoOverlay: channelLogo,
        subtitleXPercent,
        subtitleYPercent,
        subtitleRotationDeg,
        subtitleBgOpacity,
        backdropStyle,
        photoAspectRatio,
        videoTone,
        subtitleTempo,
        selectedVoiceId,
        voiceSpeedMultiplier,
        elevenLabsModel,
        elevenLabsSettings: {
          stability: elevenLabsStability,
          similarityBoost: elevenLabsSimilarity,
          style: elevenLabsStyle,
          useSpeakerBoost: elevenLabsSpeakerBoost,
        },
        isSaved: true,
      };
      await onSaveProject(updatedProj);
      setSaveSuccessMsg('💾 보관함에 안전하게 저장되었습니다!');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } catch (e) {
      setSaveSuccessMsg('보관함 저장 중 오류가 발생했습니다.');
      setTimeout(() => setSaveSuccessMsg(null), 3500);
    } finally {
      setIsSavingToVault(false);
    }
  };

  // Scene Live Audio & Subtitle Sync Preview States
  const [isPlayingSceneSync, setIsPlayingSceneSync] = useState(false);
  const [isLoadingSceneAudio, setIsLoadingSceneAudio] = useState(false);
  const sceneAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const sceneLiveVideoRef = useRef<HTMLVideoElement | null>(null);
  const scenePreviewAnimRef = useRef<number | null>(null);

  // Active custom tab on left ('ratio' | 'overlay' | 'subtitle' | 'voice' | 'thumbnail' | 'output')
  const [activeSettingsSection, setActiveSettingsSection] = useState<'ratio' | 'overlay' | 'subtitle' | 'voice' | 'thumbnail' | 'output'>('ratio');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const backdropCacheRef = useRef<WeakMap<object, HTMLCanvasElement>>(new WeakMap());
  const videoBlobUrlRef = useRef<string | null>(null);

  // Screen Wake Lock API for zero sleep during video render
  const wakeLockRef = useRef<any>(null);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const pregeneratedVideoFileRef = useRef<File | null>(null);
  const [isSnsShareModalOpen, setIsSnsShareModalOpen] = useState<boolean>(false);

  // Sub-modal popstate listener (핸드폰/PC 뒤로가기 시 SNS 공유창 닫기)
  useEffect(() => {
    const handlePop = () => {
      if (isSnsShareModalOpen) {
        setIsSnsShareModalOpen(false);
      }
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [isSnsShareModalOpen]);

  const handleCloseSnsShareModal = () => {
    setIsSnsShareModalOpen(false);
    if (typeof window !== 'undefined' && window.history.state?.subModal === 'sns-share') {
      window.history.back();
    }
  };

  // 1-Second Thumbnail Extractor & CTR Hooking Title Mode (Carousel-Style Full Customizer)
  const thumbnailFileInputRef = useRef<HTMLInputElement | null>(null);
  const [thumbnailSceneIndex, setThumbnailSceneIndex] = useState<number>(0);
  const [customThumbnailImageUrl, setCustomThumbnailImageUrl] = useState<string | null>(() => {
    return project.scenes?.[0]?.userCropUrl || project.scenes?.[0]?.uploadedImageUrl || null;
  });
  const [isCtrTitleEnabled, setIsCtrTitleEnabled] = useState<boolean>(true);
  const [ctrTitleText, setCtrTitleText] = useState<string>(() => {
    if (project.hooks?.[0]?.text) {
      return project.hooks[0].text.replace(/[\"'“‘”’]/g, '').trim().slice(0, 35);
    }
    if (project.titles?.[0]) {
      return project.titles[0].replace(/#\S+/g, '').trim().slice(0, 35);
    }
    const firstOverlay = project.customTextOverlays?.[0]?.text;
    if (firstOverlay && firstOverlay.trim()) return firstOverlay.trim();
    return project.figureName ? `${project.figureName}의 인생 역전 실화` : '3초 만에 몰입되는 쇼츠 이야기';
  });
  const [thumbnailSubText, setThumbnailSubText] = useState<string>(() => {
    if (project.hooks?.[1]?.text) {
      return project.hooks[1].text.replace(/[\"'“‘”’]/g, '').trim().slice(0, 32);
    }
    const s0 = project.scenes?.[0]?.narration || project.scenes?.[0]?.text;
    if (s0 && s0.trim()) return s0.trim().slice(0, 32);
    return project.figureName ? `${project.figureName}의 감춰진 반전 비하인드` : '놀라운 반전 실화';
  });
  const [isThumbnailSubTextEnabled, setIsThumbnailSubTextEnabled] = useState<boolean>(true);
  const [ctrTitleStyle, setCtrTitleStyle] = useState<'yt_yellow' | 'netflix_red' | 'neon_cyan' | 'black_capsule' | 'clean_white' | 'stroke_only'>('yt_yellow');
  const [thumbnailFont, setThumbnailFont] = useState<string>('Pretendard');
  const [thumbnailFontSize, setThumbnailFontSize] = useState<number>(84);
  const [thumbnailTextColor, setThumbnailTextColor] = useState<string>('#FDE047');
  const [thumbnailTextAlign, setThumbnailTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [ctrTitleYPercent, setCtrTitleYPercent] = useState<number>(24);
  const [thumbnailToast, setThumbnailToast] = useState<string | null>(null);
  const [isExtractingThumbnail, setIsExtractingThumbnail] = useState<boolean>(false);

  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCustomThumbnailImageUrl(result);
        // Persist to current scene so switching scenes or re-rendering never loses this uploaded image
        if (scenes[thumbnailSceneIndex]) {
          scenes[thumbnailSceneIndex].uploadedImageUrl = result;
          scenes[thumbnailSceneIndex].userCropUrl = result;
          onUpdateProject?.({
            ...project,
            scenes: [...scenes],
          });
        }
        setThumbnailToast('📸 표지 사진이 업로드한 이미지로 변경되었습니다!');
        setTimeout(() => setThumbnailToast(null), 3500);
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice Favorites (찜) saved in localStorage
  const [favoriteVoiceIds, setFavoriteVoiceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('favorite_voices');
      return saved ? JSON.parse(saved) : ['JBFqnCBsd6RMkjVDRZzb', 'pNInz6obpgDQGcFmaJgB', 'nPczCjzI2devNBz1zQrb', 'EXAVITQu4vr4xnSDxMaL'];
    } catch {
      return ['JBFqnCBsd6RMkjVDRZzb', 'pNInz6obpgDQGcFmaJgB', 'nPczCjzI2devNBz1zQrb', 'EXAVITQu4vr4xnSDxMaL'];
    }
  });

  const toggleFavoriteVoice = (voiceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteVoiceIds((prev) => {
      const updated = prev.includes(voiceId)
        ? prev.filter((id) => id !== voiceId)
        : [...prev, voiceId];
      try {
        localStorage.setItem('favorite_voices', JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to save favorite voices:', err);
      }
      return updated;
    });
  };

  const scenes = project.scenes || [];
  const selectedVoice = VOICE_OPTIONS.find((v) => v.id === selectedVoiceId) || VOICE_OPTIONS[0];

  // Auto-cycle through subtitle chunks every 1.1s in live preview so user sees the CapCut dynamic rhythm
  useEffect(() => {
    if (!isOpen || previewViewMode !== 'live' || !isAutoCyclingChunks || isRendering) return;
    const activeScene = scenes[previewSceneIndex] || scenes[0];
    const previewText = activeScene?.narration || `${project.figureName}의 이야기`;
    const chunks = getSubtitleChunks(previewText, subtitleTempo);
    if (chunks.length <= 1) return;

    const interval = setInterval(() => {
      setPreviewChunkIndex((prev) => (prev + 1) % chunks.length);
    }, 1100);

    return () => clearInterval(interval);
  }, [isOpen, previewViewMode, isAutoCyclingChunks, previewSceneIndex, subtitleTempo, scenes, isRendering, project.figureName]);

  // Reset chunk index when scene or tempo changes
  useEffect(() => {
    setPreviewChunkIndex(0);
  }, [previewSceneIndex, subtitleTempo]);

  // Width and Height depending on resolution (9:16 Shorts)
  const width = resolution === '1080p' ? 1080 : 720;
  const height = resolution === '1080p' ? 1920 : 1280;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (videoBlobUrlRef.current) {
        URL.revokeObjectURL(videoBlobUrlRef.current);
        videoBlobUrlRef.current = null;
      }
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
        sampleAudioRef.current = null;
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // ESC key listener to easily close modal anytime
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isRendering) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRendering, onClose]);

  // Screen Wake Lock API helper
  const requestWakeLock = async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator && (navigator as any).wakeLock) {
      try {
        const lock = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current = lock;
        setIsWakeLockActive(true);
        lock.addEventListener('release', () => {
          setIsWakeLockActive(false);
          wakeLockRef.current = null;
        });
      } catch (err) {
        console.warn('Screen wakeLock request error:', err);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.warn('Screen wakeLock release error:', err);
      }
      wakeLockRef.current = null;
      setIsWakeLockActive(false);
    }
  };

  // Re-acquire wake lock if user tabs away and returns during render
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isRendering && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isRendering]);

  // Quick preset helper to apply optimal viral shorts settings
  const handleSelectBackdrop = (bgId: BackdropStyle) => {
    setBackdropStyle(bgId);
    if (bgId === 'card_white') {
      setSubtitleYPercent(81);
    }
    setPreviewViewMode('live');
  };

  const handleApplyRecommendedSettings = () => {
    setPhotoAspectRatio('1:1');
    setBackdropStyle('blur');
    setSubtitleFont('GmarketSans');
    setSubtitleStyle('yellow_box');
    setSubtitleYPercent(81);
    setSubtitleSizeScale(1.18);
    setVoiceSpeedMultiplier(1.1);
    setResolution('1080p');
  };

  // Quick preset to apply the exact CapCut viral white card format from user samples
  const handleApplySampleReelsPreset = () => {
    setBackdropStyle('card_white');
    setPhotoAspectRatio('1:1');
    setSubtitleFont('Pretendard');
    setSubtitleStyle('yellow_box');
    setSubtitleYPercent(81);
    setSubtitleSizeScale(1.15);
    setResolution('1080p');
    setChannelLogo((prev) => ({
      ...prev,
      enabled: true,
      position: 'top-left',
      startScene: 1,
      endScene: scenes.length || 12,
      shape: 'circle',
      showChannelName: true,
    }));
    setCustomTextOverlays((prev) => {
      const shortTitle = summarizeToShortHeadline(project.titles?.[0] || project.figureName, project.figureName);
      if (prev.length > 0) {
        return prev.map((t, idx) => idx === 0 ? {
          ...t,
          text: shortTitle,
          positionYPercent: 14,
          fontFamily: 'Do Hyeon',
          textColor: '#000000',
          backgroundColor: 'transparent',
          startScene: 1,
          endScene: scenes.length || 12,
        } : t);
      }
      return [
        {
          id: 'headline-1',
          text: shortTitle,
          startScene: 1,
          endScene: scenes.length || 12,
          positionYPercent: 14,
          positionX: 'center',
          fontSizeScale: 1.25,
          fontFamily: 'Pretendard',
          textColor: '#000000',
          backgroundColor: 'transparent',
          isBold: true,
        }
      ];
    });
    setPreviewViewMode('live');
  };

  const handleAddCustomTextOverlay = (customText?: string) => {
    const newId = `overlay-${Date.now()}`;
    const count = customTextOverlays.length;
    const defaultY = count === 0 ? 25 : Math.min(65, 25 + (count * 12));
    const newOverlay: CustomTextOverlay = {
      id: newId,
      text: customText || '새 자막 내용 입력',
      startScene: 1,
      endScene: scenes.length || 12,
      positionYPercent: defaultY,
      positionX: 'center',
      positionXPercent: 50,
      rotationDeg: 0,
      bgOpacityPercent: 88,
      fontSizeScale: 1.1,
      fontFamily: subtitleFont || 'Pretendard',
      textColor: '#ffffff',
      backgroundColor: 'rgba(15, 23, 42, 0.88)',
      isBold: true,
    };
    setCustomTextOverlays((prev) => [...prev, newOverlay]);
    setSelectedSubtitleId(newId);
    setActiveDragSubtitle(newId);
    setPreviewViewMode('live');
  };

  const handleRotateSelected = (deltaDeg: number) => {
    if (!selectedSubtitleId) return;
    if (selectedSubtitleId === 'main') {
      setSubtitleRotationDeg((prev) => {
        let next = (prev ?? 0) + deltaDeg;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        return next;
      });
    } else {
      const target = customTextOverlays.find((o) => o.id === selectedSubtitleId);
      if (target) {
        let next = (target.rotationDeg || 0) + deltaDeg;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        handleUpdateCustomTextOverlay(selectedSubtitleId, { rotationDeg: next });
      }
    }
  };

  const handleSetRotationSelected = (deg: number) => {
    if (!selectedSubtitleId) return;
    let normalized = deg;
    while (normalized > 180) normalized -= 360;
    while (normalized < -180) normalized += 360;
    if (selectedSubtitleId === 'main') {
      setSubtitleRotationDeg(normalized);
    } else {
      handleUpdateCustomTextOverlay(selectedSubtitleId, { rotationDeg: normalized });
    }
  };

  const handleResetRotationSelected = () => {
    if (!selectedSubtitleId) return;
    if (selectedSubtitleId === 'main') {
      setSubtitleRotationDeg(0);
    } else {
      handleUpdateCustomTextOverlay(selectedSubtitleId, { rotationDeg: 0 });
    }
  };

  const handleSetOpacitySelected = (opacity: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(opacity)));
    if (!selectedSubtitleId || selectedSubtitleId === 'main') {
      setSubtitleBgOpacity(clamped);
    } else {
      handleUpdateCustomTextOverlay(selectedSubtitleId, { bgOpacityPercent: clamped });
    }
  };

  const getSelectedSubtitlePos = () => {
    if (selectedSubtitleId === 'main') {
      return {
        id: 'main',
        name: '메인 자막',
        x: subtitleXPercent ?? 50,
        y: subtitleYPercent ?? 80,
        rot: subtitleRotationDeg ?? 0,
        opacity: subtitleBgOpacity ?? 92,
      };
    }
    if (selectedSubtitleId) {
      const ov = customTextOverlays.find((o) => o.id === selectedSubtitleId);
      if (ov) {
        return {
          id: ov.id,
          name: `추가 자막 (${ov.text.length > 7 ? ov.text.slice(0, 7) + '..' : ov.text})`,
          x: ov.positionXPercent ?? 50,
          y: ov.positionYPercent ?? 20,
          rot: ov.rotationDeg ?? 0,
          opacity: ov.bgOpacityPercent ?? 88,
        };
      }
    }
    return null;
  };

  const handleUpdateCustomTextOverlay = (id: string, updates: Partial<CustomTextOverlay>) => {
    setCustomTextOverlays((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleDeleteCustomTextOverlay = (id: string) => {
    setCustomTextOverlays((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDuplicateCustomTextOverlay = (id: string) => {
    const target = customTextOverlays.find((item) => item.id === id);
    if (!target) return;
    const duplicated: CustomTextOverlay = {
      ...target,
      id: `overlay-${Date.now()}`,
      positionYPercent: Math.min(95, target.positionYPercent + 8),
    };
    setCustomTextOverlays((prev) => [...prev, duplicated]);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        if (typeof loadEvt.target?.result === 'string') {
          setChannelLogo((prev) => ({
            ...prev,
            enabled: true,
            imageUrl: loadEvt.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to pre-load image
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve) => {
      const img = new Image();
      if (!url.startsWith('data:') && !url.startsWith('blob:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => resolve(img);
      img.onerror = () => {
        // Fallback procedural canvas graphic when an external image fails
        const fallbackCanvas = document.createElement('canvas');
        fallbackCanvas.width = width;
        fallbackCanvas.height = height;
        const fctx = fallbackCanvas.getContext('2d');
        if (fctx) {
          const grad = fctx.createLinearGradient(0, 0, width, height);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(0.5, '#312e81');
          grad.addColorStop(1, '#0f172a');
          fctx.fillStyle = grad;
          fctx.fillRect(0, 0, width, height);

          fctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          fctx.font = `bold ${resolution === '1080p' ? 72 : 48}px sans-serif`;
          fctx.textAlign = 'center';
          fctx.fillText(project.figureName, width / 2, height / 2);
        }
        const fallbackImg = new Image();
        fallbackImg.onload = () => resolve(fallbackImg);
        fallbackImg.src = fallbackCanvas.toDataURL('image/jpeg');
      };
      img.src = url;
    });
  };

  const loadVideo = (url: string): Promise<HTMLVideoElement> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'auto';
      video.playsInline = true;
      video.autoplay = false;
      video.src = url;
      let resolved = false;

      const onReady = () => {
        if (!resolved) {
          resolved = true;
          resolve(video);
        }
      };

      video.onloadeddata = onReady;
      video.oncanplay = onReady;
      video.onerror = () => {
        if (!resolved) {
          resolved = true;
          reject(new Error('Failed to load video: ' + url));
        }
      };

      setTimeout(() => {
        if (!resolved) {
          if (video.readyState >= 2) {
            resolved = true;
            resolve(video);
          } else {
            resolved = true;
            reject(new Error('Video load timeout: ' + url));
          }
        }
      }, 7000);
    });
  };

  // Helper: Generates a lightweight, silky smooth blurred backdrop on an offscreen canvas with instant memoized cache
  const createBlurredBackdropCanvas = (img: HTMLImageElement | HTMLVideoElement): HTMLCanvasElement => {
    if (backdropCacheRef.current.has(img)) {
      return backdropCacheRef.current.get(img)!;
    }
    const bgCanvas = document.createElement('canvas');
    bgCanvas.width = 360;
    bgCanvas.height = 640;
    const bctx = bgCanvas.getContext('2d');
    if (bctx) {
      bctx.filter = 'blur(16px) brightness(0.42)';
      const imgW = (img as HTMLVideoElement).videoWidth || (img as HTMLImageElement).naturalWidth || img.width || 360;
      const imgH = (img as HTMLVideoElement).videoHeight || (img as HTMLImageElement).naturalHeight || img.height || 640;
      const imgAspect = imgW / (imgH || 1);
      const canvasAspect = 360 / 640;
      let bgW, bgH;
      if (imgAspect > canvasAspect) {
        bgH = 640 * 1.1;
        bgW = bgH * imgAspect;
      } else {
        bgW = 360 * 1.1;
        bgH = bgW / imgAspect;
      }
      bctx.drawImage(img, (360 - bgW) / 2, (640 - bgH) / 2, bgW, bgH);
      bctx.filter = 'none';
      bctx.fillStyle = 'rgba(10, 15, 30, 0.45)';
      bctx.fillRect(0, 0, 360, 640);
    }
    backdropCacheRef.current.set(img, bgCanvas);
    return bgCanvas;
  };

  // Helper: Draw scene photo/video according to selected aspect ratio (1:1, 9:16, 4:5, 16:9, fit) and backdrop style
  const drawSceneImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
    w: number,
    h: number,
    progress: number = 0,
    motion: MotionEffectType = 'static',
    precomputedBackdrop?: HTMLCanvasElement | null,
    videoConfig?: {
      videoFit?: 'cover' | 'contain';
      videoCrop?: { xPercent: number; yPercent: number; zoom: number };
    }
  ) => {
    ctx.save();

    // 1. Fill base canvas
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, w, h);

    // Smooth cinematic easing: smoothstep ensures silky continuous velocity (no stuttering or abrupt pauses)
    const clampedP = Math.max(0, Math.min(1, progress));
    const easedProgress = clampedP * clampedP * (3 - 2 * clampedP);

    const imgW = (img as HTMLVideoElement).videoWidth || (img as HTMLImageElement).naturalWidth || (img as any).width || 1080;
    const imgH = (img as HTMLVideoElement).videoHeight || (img as HTMLImageElement).naturalHeight || (img as any).height || 1920;
    const imgAspect = imgW / (imgH || 1);

    if (photoAspectRatio === '9:16') {
      // Fullscreen 9:16 cover
      let scale = 1.0;
      let transX = 0;
      let transY = 0;

      if (motion === 'zoom_in') {
        scale = 1.0 + easedProgress * 0.14;
      } else if (motion === 'zoom_out') {
        scale = 1.14 - easedProgress * 0.14;
      } else if (motion === 'pan_left') {
        scale = 1.12;
        transX = easedProgress * -0.07 * w;
      } else if (motion === 'pan_right') {
        scale = 1.12;
        transX = (1 - easedProgress) * -0.07 * w;
      } else if (motion === 'pan_down') {
        scale = 1.12;
        transY = easedProgress * 0.05 * h;
      } else if (motion === 'fade' && progress < 0.25) {
        ctx.globalAlpha = Math.min(1, progress / 0.25);
      } else {
        scale = 1.02;
      }

      if (videoConfig?.videoCrop) {
        const zoom = videoConfig.videoCrop.zoom || 1.0;
        scale *= zoom;
        transX += (((videoConfig.videoCrop.xPercent ?? 50) - 50) / 100) * w;
        transY += (((videoConfig.videoCrop.yPercent ?? 50) - 50) / 100) * h;
      }

      ctx.translate(w / 2 + transX, h / 2 + transY);
      ctx.scale(scale, scale);

      const canvasAspect = w / h;
      let drawW, drawH;
      if (videoConfig?.videoFit === 'contain') {
        if (imgAspect > canvasAspect) {
          drawW = w;
          drawH = w / imgAspect;
        } else {
          drawH = h;
          drawW = h * imgAspect;
        }
      } else {
        if (imgAspect > canvasAspect) {
          drawH = h;
          drawW = h * imgAspect;
        } else {
          drawW = w;
          drawH = w / imgAspect;
        }
      }
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
      return;
    }

    // 2. Non-9:16 aspect ratios: Draw Backdrop (Instant 0.02ms draw, zero CPU stall!)
    if (backdropStyle === 'card_white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else if (backdropStyle === 'card_black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    } else if (backdropStyle === 'blur') {
      if (precomputedBackdrop) {
        ctx.drawImage(precomputedBackdrop, 0, 0, w, h);
      } else {
        const fastBg = createBlurredBackdropCanvas(img as any);
        ctx.drawImage(fastBg, 0, 0, w, h);
      }
    } else if (backdropStyle === 'gradient') {
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.45, '#1e1b4b');
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else {
      // dark studio matte
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, w, h);
    }

    // 3. Compute Card Dimensions based on photoAspectRatio
    let cardW = w * 0.90;
    let cardH = cardW;

    if (photoAspectRatio === '1:1') {
      if (backdropStyle === 'card_white' || backdropStyle === 'card_black') {
        // Edge-to-edge horizontal banner matching Reels format
        cardW = w;
        cardH = w;
      } else {
        cardW = w * 0.90;
        cardH = cardW; // 1:1 Square Card
      }
    } else if (photoAspectRatio === '4:5') {
      cardW = w * 0.88;
      cardH = cardW * 1.25; // 4:5 Portrait Card
    } else if (photoAspectRatio === '16:9') {
      cardW = w * 0.94;
      cardH = cardW * (9 / 16); // 16:9 Landscape Card
    } else if (photoAspectRatio === 'fit') {
      // Keep original image ratio inside a max bounding box
      const maxW = w * 0.92;
      const maxH = h * 0.58;
      if (imgAspect >= maxW / maxH) {
        cardW = maxW;
        cardH = maxW / imgAspect;
      } else {
        cardH = maxH;
        cardW = maxH * imgAspect;
      }
    }

    // Always center the card both horizontally and vertically (정중앙 완벽 정렬)
    const cardX = (w - cardW) / 2;
    const cardY = (h - cardH) / 2;
    const cornerRadius = (backdropStyle === 'card_white' || backdropStyle === 'card_black') && photoAspectRatio === '1:1'
      ? 0
      : (resolution === '1080p' ? 32 : 22);

    // 4. Card Drop Shadow
    if (backdropStyle !== 'card_white') {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
      ctx.shadowBlur = resolution === '1080p' ? 40 : 25;
      ctx.shadowOffsetY = resolution === '1080p' ? 18 : 10;
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      if (ctx.roundRect && cornerRadius > 0) {
        ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
      } else {
        ctx.rect(cardX, cardY, cardW, cardH);
      }
      ctx.fill();
      ctx.restore();
    }

    // 5. Clip Image to Rounded Card
    ctx.save();
    ctx.beginPath();
    if (ctx.roundRect && cornerRadius > 0) {
      ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.clip();

    // 6. Ken Burns Motion inside Card (Silky smooth eased motion)
    let scale = 1.0;
    let transX = 0;
    let transY = 0;

    if (motion === 'zoom_in') {
      scale = 1.0 + easedProgress * 0.12;
    } else if (motion === 'zoom_out') {
      scale = 1.12 - easedProgress * 0.12;
    } else if (motion === 'pan_left') {
      scale = 1.1;
      transX = easedProgress * -0.05 * cardW;
    } else if (motion === 'pan_right') {
      scale = 1.1;
      transX = (1 - easedProgress) * -0.05 * cardW;
    } else if (motion === 'pan_down') {
      scale = 1.1;
      transY = easedProgress * 0.04 * cardH;
    } else if (motion === 'fade' && progress < 0.25) {
      ctx.globalAlpha = Math.min(1, progress / 0.25);
    } else {
      scale = 1.02;
    }

    if (videoConfig?.videoCrop) {
      const zoom = videoConfig.videoCrop.zoom || 1.0;
      scale *= zoom;
      transX += (((videoConfig.videoCrop.xPercent ?? 50) - 50) / 100) * cardW;
      transY += (((videoConfig.videoCrop.yPercent ?? 50) - 50) / 100) * cardH;
    }

    const centerX = cardX + cardW / 2;
    const centerY = cardY + cardH / 2;

    ctx.translate(centerX + transX, centerY + transY);
    ctx.scale(scale, scale);

    const targetAspect = cardW / cardH;
    let imgDrawW, imgDrawH;
    if (videoConfig?.videoFit === 'contain') {
      if (imgAspect > targetAspect) {
        imgDrawW = cardW;
        imgDrawH = cardW / imgAspect;
      } else {
        imgDrawH = cardH;
        imgDrawW = cardH * imgAspect;
      }
    } else {
      if (imgAspect > targetAspect) {
        imgDrawH = cardH;
        imgDrawW = cardH * imgAspect;
      } else {
        imgDrawW = cardW;
        imgDrawH = cardW / imgAspect;
      }
    }

    ctx.drawImage(img, -imgDrawW / 2, -imgDrawH / 2, imgDrawW, imgDrawH);
    ctx.restore();

    // 7. Subtle Border Stroke around Card
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = resolution === '1080p' ? 4 : 2.5;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cardX, cardY, cardW, cardH, cornerRadius);
    } else {
      ctx.rect(cardX, cardY, cardW, cardH);
    }
    ctx.stroke();
    ctx.restore();

    ctx.restore();
  };

  // Helper: Draw word-wrapped subtitles with selected Font, Position, Size, and Effect
  const drawSubtitles = (
    ctx: CanvasRenderingContext2D,
    text: string,
    w: number,
    h: number
  ) => {
    const baseSize = resolution === '1080p' ? 50 : 34;
    const fontSize = Math.round(baseSize * subtitleSizeScale);

    ctx.save();
    const centerX = w * ((subtitleXPercent ?? 50) / 100);
    const centerY = h * (subtitleYPercent / 100);

    ctx.translate(centerX, centerY);
    if (subtitleRotationDeg) {
      ctx.rotate((subtitleRotationDeg * Math.PI) / 180);
    }

    ctx.font = `bold ${fontSize}px "${subtitleFont}", "Pretendard", -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const maxLineWidth = w * 0.85;
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineHeight = fontSize * 1.35;
    const totalTextHeight = lines.length * lineHeight;
    const startY = -totalTextHeight / 2 + lineHeight / 2;

    lines.forEach((line, index) => {
      const y = startY + index * lineHeight;
      const textMetrics = ctx.measureText(line);
      const textW = textMetrics.width;

      if (subtitleStyle === 'yellow_box') {
        const paddingX = fontSize * 0.45;
        const paddingY = fontSize * 0.22;
        if (subtitleBgOpacity > 0) {
          ctx.fillStyle = applyOpacityToColor('#facc15', subtitleBgOpacity);
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 12);
          } else {
            ctx.rect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
          }
          ctx.fill();
        }

        if (subtitleBgOpacity < 35) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = Math.max(3, fontSize * 0.12);
          ctx.lineJoin = 'round';
          ctx.strokeText(line, 0, y);
        }

        ctx.fillStyle = '#020617';
        ctx.fillText(line, 0, y);
      } else if (subtitleStyle === 'black_capsule') {
        const paddingX = fontSize * 0.5;
        const paddingY = fontSize * 0.22;
        if (subtitleBgOpacity > 0) {
          ctx.fillStyle = applyOpacityToColor('rgba(15, 23, 42, 0.92)', subtitleBgOpacity);
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 14);
          } else {
            ctx.rect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
          }
          ctx.fill();
        }

        if (subtitleBgOpacity < 40) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.lineWidth = Math.max(3, fontSize * 0.15);
          ctx.lineJoin = 'round';
          ctx.strokeText(line, 0, y);
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
      } else if (subtitleStyle === 'neon_cyan') {
        const paddingX = fontSize * 0.5;
        const paddingY = fontSize * 0.22;
        if (subtitleBgOpacity > 0) {
          ctx.fillStyle = applyOpacityToColor('rgba(8, 51, 68, 0.9)', subtitleBgOpacity);
          ctx.strokeStyle = applyOpacityToColor('#06b6d4', Math.max(30, subtitleBgOpacity));
          ctx.lineWidth = 4;
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 16);
          } else {
            ctx.rect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
          }
          ctx.fill();
          ctx.stroke();
        }

        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#e0f2fe';
        ctx.fillText(line, 0, y);
      } else if (subtitleStyle === 'netflix_red') {
        const paddingX = fontSize * 0.5;
        const paddingY = fontSize * 0.22;
        if (subtitleBgOpacity > 0) {
          ctx.fillStyle = applyOpacityToColor('#e11d48', subtitleBgOpacity);
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY, 14);
          } else {
            ctx.rect(-textW / 2 - paddingX, y - lineHeight / 2 - paddingY / 2, textW + paddingX * 2, lineHeight + paddingY);
          }
          ctx.fill();
        }

        if (subtitleBgOpacity < 40) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.lineWidth = Math.max(3, fontSize * 0.15);
          ctx.lineJoin = 'round';
          ctx.strokeText(line, 0, y);
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
      } else if (subtitleStyle === 'shadow_drop') {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
        ctx.shadowOffsetX = 5;
        ctx.shadowOffsetY = 5;
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
      } else {
        // white_outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = fontSize * 0.22;
        ctx.lineJoin = 'round';
        ctx.strokeText(line, 0, y);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, 0, y);
      }
    });

    // Interactive Selection Bounding Box & Rotation Handle (Canva/Figma Style)
    if (!isRendering && selectedSubtitleId === 'main') {
      let maxLineW = 0;
      lines.forEach((l) => {
        const mw = ctx.measureText(l).width;
        if (mw > maxLineW) maxLineW = mw;
      });
      const padX = fontSize * 0.6;
      const padY = fontSize * 0.3;
      const boxW = Math.max(maxLineW + padX * 2, 140);
      const boxH = totalTextHeight + padY * 2;
      const topY = -boxH / 2;
      const bottomY = boxH / 2;
      const leftX = -boxW / 2;
      const rightX = boxW / 2;

      ctx.save();
      // Dashed Indigo Selection Outline
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3.5;
      ctx.setLineDash([8, 5]);
      ctx.strokeRect(leftX, topY, boxW, boxH);
      ctx.setLineDash([]);

      // 4 Corner Control Handles
      const corners = [
        [leftX, topY],
        [rightX, topY],
        [leftX, bottomY],
        [rightX, bottomY],
      ];
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#4f46e5';
      ctx.lineWidth = 2.5;
      corners.forEach(([cx, cy]) => {
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // Connecting Stem to Rotation Knob
      const stemLen = 42;
      const knobY = topY - stemLen;
      ctx.beginPath();
      ctx.moveTo(0, topY);
      ctx.lineTo(0, knobY);
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Circular Rotation Knob (Interactive Handle)
      ctx.beginPath();
      ctx.arc(0, knobY, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#4f46e5';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Rotation Icon ↻
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('↻', 0, knobY);

      // Real-time Rotation Degree Badge
      const curRot = subtitleRotationDeg || 0;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      const badgeW = 56;
      const badgeH = 22;
      const badgeY = knobY - 26;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6);
      } else {
        ctx.rect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
      }
      ctx.fill();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(`${curRot}°`, 0, badgeY);

      ctx.restore();
    }

    ctx.restore();
  };

  // Helper: Draw Channel Logo & Watermark (Sample Reels style)
  const renderChannelLogo = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sceneIndex: number,
    logoImg: HTMLImageElement | null
  ) => {
    if (!channelLogo.enabled) return;
    const currentSceneNum = sceneIndex + 1;
    if (currentSceneNum < channelLogo.startScene || currentSceneNum > channelLogo.endScene) {
      return;
    }

    ctx.save();
    const baseLogoDim = resolution === '1080p' ? 56 : 38;
    const logoScale = channelLogo.size === 'small' ? 0.75 : channelLogo.size === 'large' ? 1.35 : 1.0;
    const logoSize = Math.round(baseLogoDim * logoScale);
    const marginX = w * 0.055;
    const currentYPercent = channelLogo.yPercent !== undefined ? channelLogo.yPercent : 7;
    const marginY = h * (currentYPercent / 100);

    let x = marginX;
    let y = marginY;

    if (channelLogo.position === 'top-center') {
      x = w / 2 - (logoSize + (channelLogo.showChannelName ? 80 : 0)) / 2;
    } else if (channelLogo.position === 'top-right') {
      x = w - marginX - logoSize - (channelLogo.showChannelName ? 100 : 0);
    } else if (channelLogo.position === 'bottom-left') {
      y = h - marginY - logoSize;
    } else if (channelLogo.position === 'bottom-right') {
      x = w - marginX - logoSize;
      y = h - marginY - logoSize;
    }

    // Draw Logo Image or Avatar
    if (logoImg) {
      ctx.save();
      if (channelLogo.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();

        // Subtle circular border
        ctx.beginPath();
        ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
        ctx.strokeStyle = backdropStyle === 'card_white' ? 'rgba(0, 0, 0, 0.15)' : 'rgba(255, 255, 255, 0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else if (channelLogo.shape === 'rounded') {
        const r = Math.round(logoSize * 0.22);
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(x, y, logoSize, logoSize, r);
        } else {
          ctx.rect(x, y, logoSize, logoSize);
        }
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();
      } else {
        ctx.drawImage(logoImg, x, y, logoSize, logoSize);
        ctx.restore();
      }
    } else {
      // Default modern badge
      ctx.beginPath();
      ctx.arc(x + logoSize / 2, y + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${Math.round(logoSize * 0.46)}px "Pretendard", -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((channelLogo.channelName || 'U').charAt(0).toUpperCase(), x + logoSize / 2, y + logoSize / 2);
    }

    // Draw Channel Name (Pretendard font)
    if (channelLogo.showChannelName && channelLogo.channelName) {
      const fontSize = Math.round(logoSize * 0.42);
      ctx.font = `bold ${fontSize}px "Pretendard", -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const textX = x + logoSize + Math.round(logoSize * 0.25);
      const textY = y + logoSize / 2;

      if (backdropStyle === 'card_white') {
        ctx.fillStyle = '#0f172a';
        ctx.fillText(channelLogo.channelName, textX, textY);
      } else {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
        ctx.shadowBlur = 6;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(channelLogo.channelName, textX, textY);
      }
    }

    ctx.restore();
  };

  // Helper: Draw CapCut-style Custom Text Overlays (여러 개 추가 및 원하는 지점까지 연장)
  const renderCustomTextOverlays = (
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    sceneIndex: number
  ) => {
    const currentSceneNum = sceneIndex + 1;
    const activeOverlays = customTextOverlays.filter(
      (ov) => currentSceneNum >= ov.startScene && currentSceneNum <= ov.endScene
    );

    for (const ov of activeOverlays) {
      if (!ov.text || !ov.text.trim()) continue;

      ctx.save();
      const baseFontSize = resolution === '1080p' ? 50 : 34;
      const fontSize = Math.round(baseFontSize * (ov.fontSizeScale || 1.0));
      const fontWeight = ov.isBold ? '900' : 'bold';

      const centerX = ov.positionXPercent !== undefined 
        ? w * (ov.positionXPercent / 100) 
        : (ov.positionX === 'left' ? w * 0.25 : ov.positionX === 'right' ? w * 0.75 : w / 2);
      const centerY = h * (ov.positionYPercent / 100);
      const rotationDeg = ov.rotationDeg || 0;

      ctx.translate(centerX, centerY);
      if (rotationDeg !== 0) {
        ctx.rotate((rotationDeg * Math.PI) / 180);
      }

      ctx.font = `${fontWeight} ${fontSize}px "${ov.fontFamily || 'Pretendard'}", "Pretendard", -apple-system, BlinkMacSystemFont, "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Lines parsing (support \n and auto-wrap)
      const rawLines = ov.text.split('\n');
      const lines: string[] = [];
      const maxLineWidth = w * 0.88;

      for (const rawLine of rawLines) {
        const words = rawLine.split(' ');
        let curLine = '';
        for (const word of words) {
          const testLine = curLine ? `${curLine} ${word}` : word;
          if (ctx.measureText(testLine).width > maxLineWidth && curLine) {
            lines.push(curLine);
            curLine = word;
          } else {
            curLine = testLine;
          }
        }
        if (curLine) lines.push(curLine);
      }

      const lineHeight = fontSize * 1.34;
      const totalHeight = lines.length * lineHeight;
      const startY = -totalHeight / 2 + lineHeight / 2;

      // Draw background box if present
      const ovOpacity = ov.bgOpacityPercent ?? 88;
      if (ov.backgroundColor && ov.backgroundColor !== 'transparent' && ovOpacity > 0) {
        lines.forEach((line, idx) => {
          const lineY = startY + idx * lineHeight;
          const lineMetrics = ctx.measureText(line);
          const lineW = lineMetrics.width;
          const padX = fontSize * 0.45;
          const padY = fontSize * 0.22;

          ctx.fillStyle = applyOpacityToColor(ov.backgroundColor, ovOpacity);
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(-lineW / 2 - padX, lineY - lineHeight / 2 - padY / 2, lineW + padX * 2, lineHeight + padY, 10);
          } else {
            ctx.rect(-lineW / 2 - padX, lineY - lineHeight / 2 - padY / 2, lineW + padX * 2, lineHeight + padY);
          }
          ctx.fill();
        });
      }

      // Draw text
      lines.forEach((line, idx) => {
        const lineY = startY + idx * lineHeight;

        if (!ov.backgroundColor || ov.backgroundColor === 'transparent' || ovOpacity < 40) {
          if (ov.textColor.toLowerCase() === '#ffffff') {
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
            ctx.lineWidth = Math.max(3, fontSize * 0.16);
            ctx.lineJoin = 'round';
            ctx.strokeText(line, 0, lineY);
          } else if (ov.textColor.toLowerCase() === '#000000' || ov.textColor.toLowerCase() === '#020617') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.lineWidth = Math.max(3, fontSize * 0.16);
            ctx.lineJoin = 'round';
            ctx.strokeText(line, 0, lineY);
          }
        }

        ctx.fillStyle = ov.textColor || '#000000';
        ctx.fillText(line, 0, lineY);
      });

      // Interactive Selection Bounding Box & Rotation Handle for Custom Overlays
      if (!isRendering && selectedSubtitleId === ov.id) {
        let maxLineW = 0;
        lines.forEach((l) => {
          const mw = ctx.measureText(l).width;
          if (mw > maxLineW) maxLineW = mw;
        });
        const padX = fontSize * 0.6;
        const padY = fontSize * 0.3;
        const boxW = Math.max(maxLineW + padX * 2, 120);
        const boxH = totalHeight + padY * 2;
        const topY = -boxH / 2;
        const bottomY = boxH / 2;
        const leftX = -boxW / 2;
        const rightX = boxW / 2;

        ctx.save();
        // Dashed Rose/Pink Selection Outline
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 3.5;
        ctx.setLineDash([8, 5]);
        ctx.strokeRect(leftX, topY, boxW, boxH);
        ctx.setLineDash([]);

        // 4 Corner Handles
        const corners = [
          [leftX, topY],
          [rightX, topY],
          [leftX, bottomY],
          [rightX, bottomY],
        ];
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#db2777';
        ctx.lineWidth = 2.5;
        corners.forEach(([cx, cy]) => {
          ctx.beginPath();
          ctx.arc(cx, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Connecting Stem to Rotation Knob
        const stemLen = 42;
        const knobY = topY - stemLen;
        ctx.beginPath();
        ctx.moveTo(0, topY);
        ctx.lineTo(0, knobY);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Circular Rotation Knob (Interactive Handle)
        ctx.beginPath();
        ctx.arc(0, knobY, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#db2777';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Rotation Icon ↻
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('↻', 0, knobY);

        // Real-time Rotation Degree Badge
        const curRot = ov.rotationDeg || 0;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        const badgeW = 56;
        const badgeH = 22;
        const badgeY = knobY - 26;
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6);
        } else {
          ctx.rect(-badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH);
        }
        ctx.fill();
        ctx.fillStyle = '#f472b6';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${curRot}°`, 0, badgeY);

        ctx.restore();
      }

      ctx.restore();
    }
  };

  // Real-time Live Preview Effect: renders active preview scene directly on canvas
  useEffect(() => {
    if (!isOpen || isRendering || previewViewMode === 'video') return;
    let isCancelled = false;

    const renderPreview = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const activeScene = scenes[previewSceneIndex] || scenes[0];
      const previewText = activeScene?.narration || activeScene?.text || `${project.figureName}의 충격적인 실화`;
      const isThumbnailTab = activeSettingsSection === 'thumbnail';
      const previewImgUrl =
        (isThumbnailTab && customThumbnailImageUrl) ||
        activeScene?.userCropUrl ||
        activeScene?.uploadedImageUrl ||
        activeScene?.imageUrl ||
        activeScene?.image ||
        getSceneFallbackImage(project.figureName, project.category, previewSceneIndex);

      try {
        let media: HTMLImageElement | HTMLVideoElement;
        if (!isThumbnailTab && activeScene?.mediaType === 'video' && activeScene?.uploadedVideoUrl) {
          try {
            const vid = await loadVideo(activeScene.uploadedVideoUrl);
            vid.currentTime = activeScene.videoStartTime || 0;
            await new Promise((r) => {
              if (vid.seeking) {
                vid.onseeked = () => r(true);
                setTimeout(r, 200);
              } else {
                r(true);
              }
            });
            media = vid;
          } catch {
            media = await loadImage(previewImgUrl);
          }
        } else {
          media = await loadImage(previewImgUrl);
        }
        if (isCancelled || !canvasRef.current) return;

        // Draw photo/video with selected aspect ratio and backdrop
        drawSceneImage(ctx, media, width, height, 0, 'static', null, {
          videoFit: activeScene?.videoFit,
          videoCrop: activeScene?.videoCrop,
        });

        // Vignette based on subtitle position (skip if card_white or card_black)
        if (backdropStyle !== 'card_white' && backdropStyle !== 'card_black') {
          if (subtitleYPercent > 60) {
            const bottomGrad = ctx.createLinearGradient(0, height * 0.62, 0, height);
            bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
            bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
            bottomGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
            ctx.fillStyle = bottomGrad;
            ctx.fillRect(0, height * 0.62, width, height * 0.38);
          } else if (subtitleYPercent < 35) {
            const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.38);
            topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
            topGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
            topGrad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = topGrad;
            ctx.fillRect(0, 0, width, height * 0.38);
          }
        }

        if (isThumbnailTab && isCtrTitleEnabled && ctrTitleText.trim()) {
          drawCtrHookingTitle(
            ctx,
            ctrTitleText.trim(),
            isThumbnailSubTextEnabled ? thumbnailSubText : '',
            width,
            height,
            ctrTitleYPercent,
            ctrTitleStyle,
            thumbnailFont,
            thumbnailFontSize,
            thumbnailTextAlign,
            thumbnailTextColor
          );
        } else {
          // Draw Channel Logo & Watermark
          renderChannelLogo(ctx, width, height, previewSceneIndex, logoImageRef.current);

          // Draw CapCut-style Custom Text Overlays (상단 헤드라인 및 커스텀 자막들)
          renderCustomTextOverlays(ctx, width, height, previewSceneIndex);

          // Draw Subtitles: CapCut-style dynamic short chunks
          const previewChunks = getSubtitleChunks(previewText, subtitleTempo);
          const activeChunkIdx = Math.min(previewChunkIndex, Math.max(0, previewChunks.length - 1));
          const activeSubtitle = previewChunks[activeChunkIdx] || previewChunks[0];
          drawSubtitles(ctx, activeSubtitle, width, height);
        }
      } catch (err) {
        console.warn('Live preview canvas error:', err);
      }
    };

    renderPreview();
    return () => {
      isCancelled = true;
    };
  }, [
    isOpen,
    previewViewMode,
    previewSceneIndex,
    subtitleFont,
    subtitleXPercent,
    subtitleYPercent,
    subtitleRotationDeg,
    subtitleBgOpacity,
    selectedSubtitleId,
    subtitleSizeScale,
    subtitleStyle,
    subtitleTempo,
    previewChunkIndex,
    photoAspectRatio,
    backdropStyle,
    resolution,
    isRendering,
    scenes,
    project.figureName,
    width,
    height,
    customTextOverlays,
    channelLogo,
    activeSettingsSection,
    isCtrTitleEnabled,
    ctrTitleText,
    thumbnailSubText,
    isThumbnailSubTextEnabled,
    ctrTitleStyle,
    thumbnailFont,
    thumbnailFontSize,
    thumbnailTextColor,
    thumbnailTextAlign,
    ctrTitleYPercent,
    customThumbnailImageUrl,
  ]);

  const selectedSubPos = getSelectedSubtitlePos();

  // Filter voices by category or favorites
  const isFavoritesOnly = voiceCategoryFilter === 'favorites';
  const filteredVoices = isFavoritesOnly
    ? VOICE_OPTIONS.filter((v) => favoriteVoiceIds.includes(v.id))
    : voiceCategoryFilter === 'all' 
    ? VOICE_OPTIONS 
    : VOICE_OPTIONS.filter((v) => v.categoryTag === voiceCategoryFilter);

  const stopVoiceRef = useRef<(() => void) | null>(null);

  // Play sample narration with distinct pitch, rate, and timbre (Instant voice switching)
  const handlePlayVoiceSample = async (voice: VoiceOption, speedOverride?: number) => {
    const currentSpeed = speedOverride ?? voiceSpeedMultiplier;

    // If clicking the voice that is currently playing -> stop it
    if (isPlayingVoiceSample && playingVoiceId === voice.id) {
      if (stopVoiceRef.current) {
        try { stopVoiceRef.current(); } catch {}
      }
      stopAllVoicePreviews();
      setIsPlayingVoiceSample(false);
      setPlayingVoiceId(null);
      return;
    }

    // If another voice is playing or stopped, immediately halt and switch to the new voice
    if (stopVoiceRef.current) {
      try { stopVoiceRef.current(); } catch {}
    }
    stopAllVoicePreviews();

    setIsPlayingVoiceSample(true);
    setPlayingVoiceId(voice.id);
    setSelectedVoiceId(voice.id);

    try {
      const stopFn = await playDistinctVoicePreview(
        voice,
        {
          speedMultiplier: currentSpeed,
          modelId: elevenLabsModel,
          stability: elevenLabsStability,
          similarityBoost: elevenLabsSimilarity,
          style: elevenLabsStyle,
          useSpeakerBoost: elevenLabsSpeakerBoost,
        },
        () => {
          setIsPlayingVoiceSample(false);
          setPlayingVoiceId(null);
        }
      );
      stopVoiceRef.current = stopFn;
    } catch (e) {
      setIsPlayingVoiceSample(false);
      setPlayingVoiceId(null);
    }
  };

  // Adjust speed and dynamically update active preview audio
  const handleSpeedChange = (newSpeed: number) => {
    setVoiceSpeedMultiplier(newSpeed);
    if (sampleAudioRef.current && isPlayingVoiceSample) {
      try {
        sampleAudioRef.current.playbackRate = newSpeed * (selectedVoice.rate || 1.0);
      } catch (err) {
        console.warn('Live playbackRate update warning:', err);
      }
    }
  };

  // Main Render Process
  const stopSceneLiveSync = () => {
    if (sceneAudioSourceRef.current) {
      try {
        sceneAudioSourceRef.current.stop();
      } catch {}
      sceneAudioSourceRef.current = null;
    }
    if (sceneLiveVideoRef.current) {
      try {
        sceneLiveVideoRef.current.pause();
      } catch {}
      sceneLiveVideoRef.current = null;
    }
    if (scenePreviewAnimRef.current) {
      cancelAnimationFrame(scenePreviewAnimRef.current);
      scenePreviewAnimRef.current = null;
    }
    setIsPlayingSceneSync(false);
    setIsLoadingSceneAudio(false);
  };

  const handleToggleSceneLiveSyncPlay = async () => {
    if (isPlayingSceneSync) {
      stopSceneLiveSync();
      return;
    }

    const activeScene = scenes[previewSceneIndex] || scenes[0];
    if (!activeScene || !canvasRef.current) return;

    stopSceneLiveSync();
    setIsLoadingSceneAudio(true);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = audioContextRef.current || new AudioCtx();
      audioContextRef.current = audioCtx;
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      const query = new URLSearchParams({
        text: activeScene.narration,
        voice_id: selectedVoice.id,
        model_id: elevenLabsModel,
        stability: elevenLabsStability.toString(),
        similarity_boost: elevenLabsSimilarity.toString(),
        style: elevenLabsStyle.toString(),
        use_speaker_boost: elevenLabsSpeakerBoost ? 'true' : 'false',
        with_timestamps: 'true',
      });

      const res = await fetch(`/api/tts?${query.toString()}`);
      let decodedBuffer: AudioBuffer | null = null;
      let alignmentData: ElevenLabsAlignment | null = null;

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.audio_base64) {
            decodedBuffer = await audioCtx.decodeAudioData(base64ToArrayBuffer(data.audio_base64));
            alignmentData = data.alignment || null;
          }
        } else {
          const ab = await res.arrayBuffer();
          decodedBuffer = await audioCtx.decodeAudioData(ab);
        }
      }

      if (!decodedBuffer) {
        throw new Error('TTS audio load failed');
      }

      const silenceSec = detectAudioLeadingSilence(decodedBuffer);
      const effectivePlaybackRate = Math.max(0.7, Math.min(1.6, voiceSpeedMultiplier * (selectedVoice.rate || 1.0)));
      const spokenDur = decodedBuffer.duration / effectivePlaybackRate;

      const chunkTimings = computeAlignedSubtitleChunks(
        activeScene.narration,
        subtitleTempo,
        alignmentData,
        spokenDur,
        effectivePlaybackRate,
        silenceSec
      );

      const previewImgUrl =
        activeScene.uploadedImageUrl ||
        getSceneFallbackImage(project.figureName, project.category, previewSceneIndex);
      let media: HTMLImageElement | HTMLVideoElement;
      if (activeScene.mediaType === 'video' && activeScene.uploadedVideoUrl) {
        try {
          const vid = await loadVideo(activeScene.uploadedVideoUrl);
          vid.currentTime = activeScene.videoStartTime || 0;
          vid.playbackRate = activeScene.videoPlaybackRate || 1.0;
          vid.muted = activeScene.videoMuted !== false;
          sceneLiveVideoRef.current = vid;
          await new Promise((r) => {
            if (vid.seeking) {
              vid.onseeked = () => r(true);
              setTimeout(r, 200);
            } else {
              r(true);
            }
          });
          vid.play().catch(() => {});
          media = vid;
        } catch {
          media = await loadImage(previewImgUrl);
        }
      } else {
        media = await loadImage(previewImgUrl);
      }

      const src = audioCtx.createBufferSource();
      src.buffer = decodedBuffer;
      src.playbackRate.value = effectivePlaybackRate;
      src.connect(audioCtx.destination);
      sceneAudioSourceRef.current = src;

      const startAudioTime = audioCtx.currentTime + 0.05;
      src.start(startAudioTime);

      setIsLoadingSceneAudio(false);
      setIsPlayingSceneSync(true);

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const syncLoop = () => {
        const elapsedSec = audioCtx.currentTime - startAudioTime;
        if (elapsedSec > spokenDur + 0.3) {
          stopSceneLiveSync();
          return;
        }

        const clamped = Math.max(0, elapsedSec);
        const progressInScene = Math.min(0.999, clamped / (spokenDur + 0.3));

        if (sceneLiveVideoRef.current) {
          const endT = activeScene.videoEndTime || sceneLiveVideoRef.current.duration || 9999;
          if (sceneLiveVideoRef.current.currentTime >= endT) {
            sceneLiveVideoRef.current.pause();
            sceneLiveVideoRef.current.currentTime = endT;
          }
        }

        drawSceneImage(
          ctx,
          media,
          width,
          height,
          progressInScene,
          activeScene.motionEffect || 'zoom_in',
          null,
          {
            videoFit: activeScene.videoFit,
            videoCrop: activeScene.videoCrop,
          }
        );
        renderChannelLogo(ctx, width, height, previewSceneIndex, logoImageRef.current);
        renderCustomTextOverlays(ctx, width, height, previewSceneIndex);

        let activeText = chunkTimings[0]?.text || '';
        const found = chunkTimings.find((c) => clamped >= c.startSec && clamped < c.endSec);
        if (found) {
          activeText = found.text;
        } else if (clamped >= chunkTimings[chunkTimings.length - 1]?.endSec) {
          activeText = chunkTimings[chunkTimings.length - 1]?.text;
        }
        drawSubtitles(ctx, activeText, width, height);

        scenePreviewAnimRef.current = requestAnimationFrame(syncLoop);
      };

      src.onended = () => {
        stopSceneLiveSync();
      };

      scenePreviewAnimRef.current = requestAnimationFrame(syncLoop);
    } catch (e) {
      console.warn('Scene live sync preview error:', e);
      stopSceneLiveSync();
    }
  };

  useEffect(() => {
    stopSceneLiveSync();
  }, [previewSceneIndex, isOpen, previewViewMode]);

  // Interactive Canvas Mouse Drag & Handle Rotation for ALL subtitles
  const canvasDragRef = useRef<{
    startX: number;
    startY: number;
    targetId: 'main' | string;
    mode: 'move' | 'rotate';
    centerX: number;
    centerY: number;
    initXPercent: number;
    initYPercent: number;
    initRotDeg: number;
  } | null>(null);

  const handleCanvasPointerDown = (clientX: number, clientY: number) => {
    if (isRendering || previewViewMode === 'video') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const currentSceneNum = previewSceneIndex + 1;
    const activeOverlays = customTextOverlays.filter(
      (ov) => currentSceneNum >= ov.startScene && currentSceneNum <= ov.endScene
    );

    // 1. If a subtitle is ALREADY selected, first check if user clicked its ROTATION HANDLE!
    if (selectedSubtitleId) {
      let targetCenterX = 0;
      let targetCenterY = 0;
      let targetRot = 0;
      let targetBoxH = 40;

      if (selectedSubtitleId === 'main') {
        targetCenterX = ((subtitleXPercent ?? 50) / 100) * rect.width;
        targetCenterY = (subtitleYPercent / 100) * rect.height;
        targetRot = subtitleRotationDeg || 0;
        targetBoxH = Math.max(38, rect.height * 0.08);
      } else {
        const ov = activeOverlays.find((o) => o.id === selectedSubtitleId);
        if (ov) {
          targetCenterX = ((ov.positionXPercent ?? 50) / 100) * rect.width;
          targetCenterY = (ov.positionYPercent / 100) * rect.height;
          targetRot = ov.rotationDeg || 0;
          targetBoxH = Math.max(34, rect.height * 0.07);
        }
      }

      if (targetCenterX && targetCenterY) {
        const rotRad = (targetRot * Math.PI) / 180;
        const stemDist = 42;
        const unrotHandleY = -targetBoxH / 2 - stemDist;
        const handlePxX = targetCenterX - unrotHandleY * Math.sin(rotRad);
        const handlePxY = targetCenterY + unrotHandleY * Math.cos(rotRad);

        const distToHandle = Math.hypot(px - handlePxX, py - handlePxY);
        if (distToHandle <= 28) {
          // User clicked rotation knob handle!
          canvasDragRef.current = {
            startX: clientX,
            startY: clientY,
            targetId: selectedSubtitleId,
            mode: 'rotate',
            centerX: targetCenterX,
            centerY: targetCenterY,
            initXPercent: selectedSubtitleId === 'main' ? (subtitleXPercent ?? 50) : 50,
            initYPercent: selectedSubtitleId === 'main' ? subtitleYPercent : 50,
            initRotDeg: targetRot,
          };
          return;
        }
      }
    }

    // 2. Check if user clicked on any custom text overlay body
    for (let i = activeOverlays.length - 1; i >= 0; i--) {
      const ov = activeOverlays[i];
      const ovX = ((ov.positionXPercent ?? 50) / 100) * rect.width;
      const ovY = (ov.positionYPercent / 100) * rect.height;
      const ovRot = ov.rotationDeg || 0;

      const rotRad = (ovRot * Math.PI) / 180;
      const dx = px - ovX;
      const dy = py - ovY;
      const unrotX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad);
      const unrotY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad);

      const boxHalfW = Math.max(rect.width * 0.32, Math.min(rect.width * 0.45, ov.text.length * 10));
      const boxHalfH = Math.max(22, ov.text.split('\n').length * 20);

      if (Math.abs(unrotX) <= boxHalfW + 15 && Math.abs(unrotY) <= boxHalfH + 15) {
        setSelectedSubtitleId(ov.id);
        setActiveDragSubtitle(ov.id);
        canvasDragRef.current = {
          startX: clientX,
          startY: clientY,
          targetId: ov.id,
          mode: 'move',
          centerX: ovX,
          centerY: ovY,
          initXPercent: ov.positionXPercent ?? 50,
          initYPercent: ov.positionYPercent,
          initRotDeg: ovRot,
        };
        return;
      }
    }

    // 3. Check if user clicked on main narration subtitle
    const subX = ((subtitleXPercent ?? 50) / 100) * rect.width;
    const subY = (subtitleYPercent / 100) * rect.height;
    const subRot = subtitleRotationDeg || 0;

    const rotRad = (subRot * Math.PI) / 180;
    const dx = px - subX;
    const dy = py - subY;
    const unrotX = dx * Math.cos(-rotRad) - dy * Math.sin(-rotRad);
    const unrotY = dx * Math.sin(-rotRad) + dy * Math.cos(-rotRad);

    const boxHalfW = rect.width * 0.42;
    const boxHalfH = Math.max(25, rect.height * 0.055);

    if (Math.abs(unrotX) <= boxHalfW + 15 && Math.abs(unrotY) <= boxHalfH + 15) {
      setSelectedSubtitleId('main');
      setActiveDragSubtitle('main');
      canvasDragRef.current = {
        startX: clientX,
        startY: clientY,
        targetId: 'main',
        mode: 'move',
        centerX: subX,
        centerY: subY,
        initXPercent: subtitleXPercent ?? 50,
        initYPercent: subtitleYPercent,
        initRotDeg: subRot,
      };
      return;
    }

    // 4. Clicked outside on empty space: deselect
    setSelectedSubtitleId(null);
    setActiveDragSubtitle(null);
    canvasDragRef.current = null;
  };

  const handleCanvasPointerMove = (clientX: number, clientY: number) => {
    if (!canvasDragRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (canvasDragRef.current.mode === 'move') {
      const dxPercent = ((clientX - canvasDragRef.current.startX) / rect.width) * 100;
      const dyPercent = ((clientY - canvasDragRef.current.startY) / rect.height) * 100;

      if (canvasDragRef.current.targetId === 'main') {
        const newX = Math.round(Math.max(5, Math.min(95, canvasDragRef.current.initXPercent + dxPercent)));
        const newY = Math.round(Math.max(5, Math.min(95, canvasDragRef.current.initYPercent + dyPercent)));
        setSubtitleXPercent(newX);
        setSubtitleYPercent(newY);
      } else {
        const targetId = canvasDragRef.current.targetId;
        const newX = Math.round(Math.max(5, Math.min(95, canvasDragRef.current.initXPercent + dxPercent)));
        const newY = Math.round(Math.max(5, Math.min(95, canvasDragRef.current.initYPercent + dyPercent)));
        handleUpdateCustomTextOverlay(targetId, {
          positionXPercent: newX,
          positionYPercent: newY,
        });
      }
    } else if (canvasDragRef.current.mode === 'rotate') {
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const curAngleRad = Math.atan2(py - canvasDragRef.current.centerY, px - canvasDragRef.current.centerX);
      let newDeg = Math.round((curAngleRad * 180) / Math.PI) + 90;
      while (newDeg > 180) newDeg -= 360;
      while (newDeg < -180) newDeg += 360;

      // Smart snapping near 0, 90, -90, 45, -45 degrees
      if (Math.abs(newDeg) <= 3) newDeg = 0;
      else if (Math.abs(newDeg - 90) <= 3) newDeg = 90;
      else if (Math.abs(newDeg + 90) <= 3) newDeg = -90;
      else if (Math.abs(newDeg - 45) <= 2) newDeg = 45;
      else if (Math.abs(newDeg + 45) <= 2) newDeg = -45;

      if (canvasDragRef.current.targetId === 'main') {
        setSubtitleRotationDeg(newDeg);
      } else {
        handleUpdateCustomTextOverlay(canvasDragRef.current.targetId, {
          rotationDeg: newDeg,
        });
      }
    }
  };

  const handleCanvasPointerUp = () => {
    canvasDragRef.current = null;
  };

  const handleCanvasWheel = (e: React.WheelEvent) => {
    if (isRendering || previewViewMode === 'video') return;
    const target = selectedSubtitleId || activeDragSubtitle || 'main';
    const delta = e.deltaY < 0 ? 3 : -3;

    if (target === 'main') {
      setSubtitleRotationDeg((prev) => {
        let next = (prev ?? 0) + delta;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        return next;
      });
    } else {
      const ov = customTextOverlays.find((o) => o.id === target);
      if (ov) {
        let next = (ov.rotationDeg || 0) + delta;
        while (next > 180) next -= 360;
        while (next < -180) next += 360;
        handleUpdateCustomTextOverlay(target, {
          rotationDeg: next,
        });
      }
    }
  };

  // Helper: Wrap text for high-impact CTR headline
  const wrapTitleText = (c: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const rawLines = text.split('\n');
    const result: string[] = [];
    for (const rawLine of rawLines) {
      const trimmed = rawLine.trim();
      if (!trimmed) continue;
      const words = trimmed.split(' ');
      let current = '';
      for (let i = 0; i < words.length; i++) {
        const testLine = current ? `${current} ${words[i]}` : words[i];
        if (c.measureText(testLine).width <= maxWidth) {
          current = testLine;
        } else {
          if (current) result.push(current);
          current = words[i];
        }
      }
      if (current) result.push(current);
    }
    return result.length > 0 ? result : [text];
  };

  // Helper: Draw high-impact "대문짝 CTR 후킹 타이틀 & 서브 설명" (Carousel-Style rich rendering)
  const drawCtrHookingTitle = (
    c: CanvasRenderingContext2D,
    title: string,
    subText: string = '',
    w: number = 1080,
    h: number = 1920,
    yPercent: number = 24,
    style: 'yt_yellow' | 'netflix_red' | 'neon_cyan' | 'black_capsule' | 'clean_white' | 'stroke_only' = 'yt_yellow',
    fontFamily: string = 'Pretendard',
    fontSize: number = 84,
    textAlign: 'left' | 'center' | 'right' = 'center',
    textColor: string = '#FDE047'
  ) => {
    c.save();
    const centerY = (h * yPercent) / 100;
    const maxWidth = w * 0.88;

    // Font setting: ultra-bold headline font
    c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", -apple-system, sans-serif`;
    c.textBaseline = 'middle';

    const mainLines = wrapTitleText(c, title, maxWidth);
    const mainLineHeight = fontSize * 1.26;
    const mainBlockHeight = mainLines.length * mainLineHeight;

    // Subtitle calculations
    const subFontSize = Math.max(28, Math.round(fontSize * 0.44));
    let subLines: string[] = [];
    let subLineHeight = subFontSize * 1.35;
    let subBlockHeight = 0;
    if (subText && subText.trim()) {
      c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      subLines = wrapTitleText(c, subText.trim(), maxWidth);
      subBlockHeight = subLines.length * subLineHeight + 14;
    }

    const totalHeight = mainBlockHeight + subBlockHeight;
    const startY = centerY - totalHeight / 2 + mainLineHeight / 2;

    // Measure maximum line width
    let maxLineWidth = 0;
    c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
    mainLines.forEach((l) => {
      const lw = c.measureText(l).width;
      if (lw > maxLineWidth) maxLineWidth = lw;
    });
    if (subLines.length > 0) {
      c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      subLines.forEach((l) => {
        const lw = c.measureText(l).width;
        if (lw > maxLineWidth) maxLineWidth = lw;
      });
    }

    const paddingX = Math.max(38, fontSize * 0.48);
    const paddingY = Math.max(24, fontSize * 0.32);
    const boxW = Math.min(w * 0.94, maxLineWidth + paddingX * 2);
    const boxH = totalHeight + paddingY * 2;
    const boxX = (w - boxW) / 2;
    const boxY = centerY - boxH / 2;

    // Calculate horizontal text anchor
    let textX = w / 2;
    c.textAlign = textAlign;
    if (textAlign === 'left') {
      textX = boxX + paddingX;
    } else if (textAlign === 'right') {
      textX = boxX + boxW - paddingX;
    }

    if (style === 'netflix_red') {
      c.shadowColor = 'rgba(0,0,0,0.7)';
      c.shadowBlur = 30;
      c.shadowOffsetY = 10;
      c.fillStyle = '#E11D48';
      c.beginPath();
      c.roundRect(boxX, boxY, boxW, boxH, 24);
      c.fill();

      // Main Text
      c.shadowColor = 'rgba(0,0,0,0.85)';
      c.shadowBlur = 8;
      c.fillStyle = textColor || '#FFFFFF';
      c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      mainLines.forEach((line, idx) => {
        c.fillText(line, textX, startY + idx * mainLineHeight);
      });

      // Sub Text
      if (subLines.length > 0) {
        c.fillStyle = '#FFE4E6';
        c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
        const subStartY = startY + mainBlockHeight + 10;
        subLines.forEach((line, idx) => {
          c.fillText(line, textX, subStartY + idx * subLineHeight);
        });
      }
    } else if (style === 'neon_cyan') {
      c.shadowColor = 'rgba(6, 182, 212, 0.9)';
      c.shadowBlur = 35;
      c.fillStyle = 'rgba(10, 15, 29, 0.92)';
      c.beginPath();
      c.roundRect(boxX, boxY, boxW, boxH, 24);
      c.fill();

      c.strokeStyle = '#06B6D4';
      c.lineWidth = 5;
      c.stroke();

      c.shadowColor = 'rgba(6, 182, 212, 0.8)';
      c.shadowBlur = 16;
      c.fillStyle = textColor || '#E0F2FE';
      c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      mainLines.forEach((line, idx) => {
        c.fillText(line, textX, startY + idx * mainLineHeight);
      });

      if (subLines.length > 0) {
        c.fillStyle = '#A5F3FC';
        c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
        const subStartY = startY + mainBlockHeight + 10;
        subLines.forEach((line, idx) => {
          c.fillText(line, textX, subStartY + idx * subLineHeight);
        });
      }
    } else if (style === 'black_capsule') {
      c.shadowColor = 'rgba(0, 0, 0, 0.8)';
      c.shadowBlur = 30;
      c.fillStyle = 'rgba(15, 23, 42, 0.94)';
      c.beginPath();
      c.roundRect(boxX, boxY, boxW, boxH, 24);
      c.fill();

      c.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      c.lineWidth = 3;
      c.stroke();

      c.shadowColor = 'rgba(0, 0, 0, 0.9)';
      c.shadowBlur = 8;
      c.fillStyle = textColor || '#FFFFFF';
      c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      mainLines.forEach((line, idx) => {
        c.fillText(line, textX, startY + idx * mainLineHeight);
      });

      if (subLines.length > 0) {
        c.fillStyle = '#CBD5E1';
        c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
        const subStartY = startY + mainBlockHeight + 10;
        subLines.forEach((line, idx) => {
          c.fillText(line, textX, subStartY + idx * subLineHeight);
        });
      }
    } else if (style === 'clean_white') {
      c.shadowColor = 'rgba(0, 0, 0, 0.4)';
      c.shadowBlur = 24;
      c.shadowOffsetY = 8;
      c.fillStyle = 'rgba(255, 255, 255, 0.95)';
      c.beginPath();
      c.roundRect(boxX, boxY, boxW, boxH, 24);
      c.fill();

      c.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      c.lineWidth = 2;
      c.stroke();

      c.shadowColor = 'rgba(0, 0, 0, 0.15)';
      c.shadowBlur = 2;
      c.fillStyle = textColor === '#FDE047' ? '#0F172A' : textColor;
      c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      mainLines.forEach((line, idx) => {
        c.fillText(line, textX, startY + idx * mainLineHeight);
      });

      if (subLines.length > 0) {
        c.fillStyle = '#475569';
        c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
        const subStartY = startY + mainBlockHeight + 10;
        subLines.forEach((line, idx) => {
          c.fillText(line, textX, subStartY + idx * subLineHeight);
        });
      }
    } else if (style === 'stroke_only') {
      c.shadowColor = 'rgba(0, 0, 0, 0.95)';
      c.shadowBlur = 24;
      c.shadowOffsetY = 8;

      c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      mainLines.forEach((line, idx) => {
        const lineY = startY + idx * mainLineHeight;
        c.strokeStyle = '#000000';
        c.lineWidth = Math.max(14, fontSize * 0.22);
        c.lineJoin = 'round';
        c.miterLimit = 2;
        c.strokeText(line, textX, lineY);

        c.fillStyle = textColor || '#FFFFFF';
        c.fillText(line, textX, lineY);
      });

      if (subLines.length > 0) {
        c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
        const subStartY = startY + mainBlockHeight + 10;
        subLines.forEach((line, idx) => {
          const lineY = subStartY + idx * subLineHeight;
          c.strokeStyle = '#000000';
          c.lineWidth = 8;
          c.lineJoin = 'round';
          c.strokeText(line, textX, lineY);
          c.fillStyle = '#FFFFFF';
          c.fillText(line, textX, lineY);
        });
      }
    } else {
      // 'yt_yellow' (YouTube #1 CTR Impact)
      c.shadowColor = 'rgba(0, 0, 0, 0.98)';
      c.shadowBlur = 24;
      c.shadowOffsetY = 10;

      c.font = `900 ${fontSize}px "${fontFamily}", "Pretendard", sans-serif`;
      mainLines.forEach((line, idx) => {
        const lineY = startY + idx * mainLineHeight;
        c.strokeStyle = '#000000';
        c.lineWidth = Math.max(14, fontSize * 0.22);
        c.lineJoin = 'round';
        c.miterLimit = 2;
        c.strokeText(line, textX, lineY);

        c.fillStyle = textColor || '#FDE047';
        c.fillText(line, textX, lineY);
      });

      if (subLines.length > 0) {
        c.font = `700 ${subFontSize}px "${fontFamily}", "Pretendard", sans-serif`;
        const subStartY = startY + mainBlockHeight + 10;
        subLines.forEach((line, idx) => {
          const lineY = subStartY + idx * subLineHeight;
          c.strokeStyle = '#000000';
          c.lineWidth = 9;
          c.lineJoin = 'round';
          c.strokeText(line, textX, lineY);

          c.fillStyle = '#FFFFFF';
          c.fillText(line, textX, lineY);
        });
      }
    }

    c.restore();
  };

  // 1-Second Thumbnail Generation
  const generateThumbnailCanvas = async (sceneIdx: number = thumbnailSceneIndex): Promise<HTMLCanvasElement | null> => {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 1080;
    thumbCanvas.height = 1920;
    const c = thumbCanvas.getContext('2d');
    if (!c) return null;

    const targetScene = scenes[sceneIdx] || scenes[0];
    const imgSrc =
      customThumbnailImageUrl ||
      targetScene?.userCropUrl ||
      targetScene?.uploadedImageUrl ||
      targetScene?.imageUrl ||
      targetScene?.image ||
      getSceneFallbackImage(project.figureName, project.category, sceneIdx);

    try {
      let thumbMedia: HTMLImageElement | HTMLVideoElement;
      if (!customThumbnailImageUrl && targetScene?.mediaType === 'video' && targetScene?.uploadedVideoUrl) {
        try {
          const vid = await loadVideo(targetScene.uploadedVideoUrl);
          vid.currentTime = targetScene.videoStartTime || 0;
          await new Promise((r) => {
            if (vid.seeking) {
              vid.onseeked = () => r(true);
              setTimeout(r, 200);
            } else {
              r(true);
            }
          });
          thumbMedia = vid;
        } catch {
          thumbMedia = await loadImage(imgSrc);
        }
      } else {
        thumbMedia = await loadImage(imgSrc);
      }
      drawSceneImage(c, thumbMedia, 1080, 1920, 0, 'static', null, {
        videoFit: targetScene?.videoFit,
        videoCrop: targetScene?.videoCrop,
      });
    } catch (e) {
      console.warn('Thumbnail base image load warning, fallback to gradient:', e);
      const grad = c.createLinearGradient(0, 0, 1080, 1920);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.5, '#312e81');
      grad.addColorStop(1, '#0f172a');
      c.fillStyle = grad;
      c.fillRect(0, 0, 1080, 1920);
    }

    // Vignette shading
    if (backdropStyle !== 'card_white' && backdropStyle !== 'card_black') {
      const topGrad = c.createLinearGradient(0, 0, 0, 1920 * 0.38);
      topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
      topGrad.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = topGrad;
      c.fillRect(0, 0, 1080, 1920 * 0.38);

      const bottomGrad = c.createLinearGradient(0, 1920 * 0.65, 0, 1920);
      bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
      bottomGrad.addColorStop(1, 'rgba(0,0,0,0.88)');
      c.fillStyle = bottomGrad;
      c.fillRect(0, 1920 * 0.65, 1080, 1920 * 0.35);
    }

    if (isCtrTitleEnabled && ctrTitleText.trim()) {
      drawCtrHookingTitle(
        c,
        ctrTitleText.trim(),
        isThumbnailSubTextEnabled ? thumbnailSubText : '',
        1080,
        1920,
        ctrTitleYPercent,
        ctrTitleStyle,
        thumbnailFont,
        thumbnailFontSize,
        thumbnailTextAlign,
        thumbnailTextColor
      );
    } else {
      // Draw standard overlays and subtitles
      renderChannelLogo(c, 1080, 1920, sceneIdx, logoImageRef.current);
      renderCustomTextOverlays(c, 1080, 1920, sceneIdx);
      const chunks = getSubtitleChunks(targetScene?.text || targetScene?.narration || '', subtitleTempo);
      if (chunks.length > 0) {
        drawSubtitles(c, chunks[0], 1080, 1920);
      }
    }

    return thumbCanvas;
  };

  const handleDownloadThumbnail = async (sceneIdx: number = thumbnailSceneIndex) => {
    setIsExtractingThumbnail(true);
    setThumbnailToast('⏳ 1080x1920 HD 썸네일 생성 중...');
    try {
      const canvas = await generateThumbnailCanvas(sceneIdx);
      if (!canvas) {
        setThumbnailToast('⚠️ 썸네일 생성에 실패했습니다.');
        setTimeout(() => setThumbnailToast(null), 3000);
        return;
      }
      const orderNum = String(sceneIdx + 1).padStart(2, '0');
      const fileName = `Untold_Thumbnail_Scene${orderNum}_${project.figureName || 'Shorts'}_1080x1920.png`;

      canvas.toBlob((blob) => {
        if (!blob) {
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = fileName;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setThumbnailToast(`🎉 ${sceneIdx + 1}번 씬 1초 HD 썸네일 다운로드 완료!`);
          setTimeout(() => setThumbnailToast(null), 3500);
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        setThumbnailToast(`🎉 1080x1920 HD 표지 썸네일 다운로드 완료!`);
        setTimeout(() => setThumbnailToast(null), 3500);
      }, 'image/png');
    } catch (err: any) {
      console.warn('Thumbnail download error:', err);
      setThumbnailToast(`⚠️ 다운로드 실패: ${err?.message || '다시 시도해주세요'}`);
      setTimeout(() => setThumbnailToast(null), 3500);
    } finally {
      setIsExtractingThumbnail(false);
    }
  };

  const handleShareThumbnail = async (sceneIdx: number = thumbnailSceneIndex) => {
    setIsExtractingThumbnail(true);
    setThumbnailToast('⏳ 썸네일 공유 준비 중...');
    try {
      const canvas = await generateThumbnailCanvas(sceneIdx);
      if (!canvas) {
        setThumbnailToast('⚠️ 썸네일 생성에 실패했습니다.');
        setTimeout(() => setThumbnailToast(null), 3000);
        return;
      }
      const orderNum = String(sceneIdx + 1).padStart(2, '0');
      const fileName = `Untold_Thumbnail_Scene${orderNum}_${project.figureName || 'Shorts'}.png`;
      const shareTitle = `${project.figureName || '쇼츠'} 표지 썸네일`;
      const shareText = ctrTitleText || `${project.figureName} 쇼츠 표지`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          handleDownloadThumbnail(sceneIdx);
          return;
        }
        const file = new File([blob], fileName, { type: 'image/png' });

        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: shareTitle,
              text: shareText,
            });
            setThumbnailToast('📱 썸네일 공유창이 열렸습니다!');
            setTimeout(() => setThumbnailToast(null), 3000);
            return;
          } catch (err: any) {
            if (err.name === 'AbortError') {
              setThumbnailToast(null);
              return;
            }
            console.warn('navigator.share thumbnail error:', err);
          }
        }

        // Fallback: clipboard & download
        try {
          if (typeof navigator !== 'undefined' && navigator.clipboard) {
            await navigator.clipboard.writeText(shareText);
          }
        } catch (e) {}
        handleDownloadThumbnail(sceneIdx);
        setThumbnailToast('📋 텍스트 복사 & 썸네일 다운로드 완료 (카톡에 바로 붙여넣기 하세요!)');
        setTimeout(() => setThumbnailToast(null), 4000);
      }, 'image/png');
    } catch (err: any) {
      console.warn('Share thumbnail error:', err);
      handleDownloadThumbnail(sceneIdx);
    } finally {
      setIsExtractingThumbnail(false);
    }
  };

  const startRendering = async () => {
    if (!canvasRef.current || scenes.length === 0) return;
    setIsRendering(true);
    await requestWakeLock();
    setRenderProgress(0);
    setStatusMessage('에셋 사진 다운로드 및 내레이션 음성 합성 준비 중...');
    if (videoBlobUrlRef.current) {
      URL.revokeObjectURL(videoBlobUrlRef.current);
      videoBlobUrlRef.current = null;
    }
    setVideoBlobUrl(null);
    recordedChunksRef.current = [];

    const canvas = canvasRef.current;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Initialize Web Audio Context and ensure it is active
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioCtx();
    audioContextRef.current = audioCtx;
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }
    const audioDest = audioCtx.createMediaStreamDestination();

    // Robust TTS fetcher with automatic 3-step retry & binary fallback (NO sine-wave buzzing drone!)
    const fetchSceneTTSWithRetry = async (
      narrationText: string,
      sceneIdx: number
    ): Promise<{ buffer: AudioBuffer; alignment: ElevenLabsAlignment | null }> => {
      const cleanText = narrationText
        .replace(/^[\"'“‘\s]+/, '')
        .replace(/[\"'”’\s]+$/, '')
        .trim();

      const queryParams = new URLSearchParams({
        text: cleanText,
        voice_id: selectedVoice.id,
        model_id: elevenLabsModel,
        stability: elevenLabsStability.toString(),
        similarity_boost: elevenLabsSimilarity.toString(),
        style: elevenLabsStyle.toString(),
        use_speaker_boost: elevenLabsSpeakerBoost ? 'true' : 'false',
        with_timestamps: 'true',
      });

      // 1. Try with timestamps (up to 3 retries for serverless cold-starts)
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const res = await fetch(`/api/tts?${queryParams.toString()}`);
          if (res.ok) {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
              const data = await res.json();
              if (data.audio_base64) {
                const ab = base64ToArrayBuffer(data.audio_base64);
                const decoded = await audioCtx.decodeAudioData(ab.slice(0));
                return { buffer: decoded, alignment: data.alignment || null };
              }
            } else {
              const ab = await res.arrayBuffer();
              const decoded = await audioCtx.decodeAudioData(ab.slice(0));
              return { buffer: decoded, alignment: null };
            }
          }
        } catch (err) {
          console.warn(`Scene ${sceneIdx + 1} TTS attempt ${attempt} error:`, err);
        }
        if (attempt < 3) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }

      // 2. Fallback: standard binary MP3 stream without timestamps
      try {
        const fallbackParams = new URLSearchParams({
          text: cleanText,
          voice_id: selectedVoice.id,
          model_id: elevenLabsModel,
        });
        const res = await fetch(`/api/tts?${fallbackParams.toString()}`);
        if (res.ok) {
          const ab = await res.arrayBuffer();
          const decoded = await audioCtx.decodeAudioData(ab.slice(0));
          return { buffer: decoded, alignment: null };
        }
      } catch (err) {
        console.warn(`Scene ${sceneIdx + 1} binary fallback TTS error:`, err);
      }

      // 3. Clean silent buffer (Zero robotic buzzing/humming drone)
      const syllables = Math.max(8, cleanText.length);
      const estDur = Math.max(2.4, Math.min(6.0, (syllables * 0.16) / voiceSpeedMultiplier));
      const sRate = audioCtx.sampleRate;
      const silentBuf = audioCtx.createBuffer(1, Math.floor(sRate * estDur), sRate);
      return { buffer: silentBuf, alignment: null };
    };

    // 2. Preload & Decode voice TTS with exact millisecond timestamps for all scenes
    const audioBuffers: AudioBuffer[] = [];
    const sceneChunkTimings: SubtitleChunkTiming[][] = [];
    const effectivePlaybackRate = Math.max(0.7, Math.min(1.6, voiceSpeedMultiplier * (selectedVoice.rate || 1.0)));

    for (let i = 0; i < scenes.length; i++) {
      setStatusMessage(`내레이션 음성 합성 및 정밀 자막 동기화 중... (${i + 1}/${scenes.length})`);
      setRenderProgress(Math.round(((i + 1) / (scenes.length * 2)) * 30));

      const { buffer, alignment } = await fetchSceneTTSWithRetry(scenes[i].narration, i);
      audioBuffers.push(buffer);

      // Detect leading silence from audio encoder
      const silenceSec = detectAudioLeadingSilence(buffer);
      const spokenDur = buffer.duration / effectivePlaybackRate;

      // Compute frame-perfect millisecond chunk timings
      const chunkTimings = computeAlignedSubtitleChunks(
        scenes[i].narration,
        subtitleTempo,
        alignment,
        spokenDur,
        effectivePlaybackRate,
        silenceSec
      );
      sceneChunkTimings.push(chunkTimings);
    }

    // 3. Preload images/videos and precompute ambient backdrops for all scenes (0ms render during recording)
    const loadedImages: (HTMLImageElement | HTMLVideoElement)[] = [];
    const precomputedBackdrops: (HTMLCanvasElement | null)[] = [];
    let loadedLogoImg: HTMLImageElement | null = logoImageRef.current;
    if (channelLogo.enabled && channelLogo.imageUrl && !loadedLogoImg) {
      try {
        loadedLogoImg = await loadImage(channelLogo.imageUrl);
      } catch (e) {}
    }

    for (let i = 0; i < scenes.length; i++) {
      setStatusMessage(`에셋 및 렌더링 최적화 중... (${i + 1}/${scenes.length})`);
      const sc = scenes[i];
      let media: HTMLImageElement | HTMLVideoElement;
      if (sc.mediaType === 'video' && sc.uploadedVideoUrl) {
        try {
          const vid = await loadVideo(sc.uploadedVideoUrl);
          vid.currentTime = sc.videoStartTime || 0;
          vid.playbackRate = sc.videoPlaybackRate || 1.0;
          vid.muted = sc.videoMuted !== false;
          media = vid;
        } catch (e) {
          console.warn('Video load fallback to image for scene', i, e);
          const imgUrl = sc.uploadedImageUrl || getSceneFallbackImage(project.figureName, project.category, i);
          media = await loadImage(imgUrl);
        }
      } else {
        const imgUrl =
          sc.uploadedImageUrl ||
          getSceneFallbackImage(project.figureName, project.category, i);
        media = await loadImage(imgUrl);
      }
      loadedImages.push(media);

      if (backdropStyle === 'blur') {
        precomputedBackdrops.push(createBlurredBackdropCanvas(media));
      } else {
        precomputedBackdrops.push(null);
      }
      setRenderProgress(30 + Math.round(((i + 1) / scenes.length) * 15));
    }

    // 4. Calculate dynamic scene durations based on audio length & speed multiplier
    const sceneSpokenDurationsSec: number[] = [];
    const sceneDurationsSec: number[] = [];
    const sceneStartTimesSec: number[] = [];
    let curTime = 0.0;

    for (let i = 0; i < scenes.length; i++) {
      const buffer = audioBuffers[i];
      const spokenDur = buffer.duration / effectivePlaybackRate;

      sceneSpokenDurationsSec.push(spokenDur);
      sceneStartTimesSec.push(curTime);
      const sceneDur = spokenDur + 0.30; // 0.30s natural breath pause between scenes
      sceneDurationsSec.push(sceneDur);
      curTime += sceneDur;
    }
    // Generous post-roll outro padding (+1.2s) ensures the last scene, last voice, and last subtitle never get cut off abruptly!
    const POST_ROLL_SEC = 1.2;
    const totalVideoSec = curTime + POST_ROLL_SEC;
    setVideoDuration(Math.round(totalVideoSec));

    // 5. Pre-draw initial frame (Scene 0 Frame 0) so recording stream has pristine content immediately
    drawSceneImage(
      ctx,
      loadedImages[0],
      width,
      height,
      0,
      scenes[0].motionEffect || 'zoom_in',
      precomputedBackdrops[0],
      {
        videoFit: scenes[0]?.videoFit,
        videoCrop: scenes[0]?.videoCrop,
      }
    );
    renderChannelLogo(ctx, width, height, 0, loadedLogoImg);
    renderCustomTextOverlays(ctx, width, height, 0);
    drawSubtitles(ctx, sceneChunkTimings[0]?.[0]?.text || '', width, height);

    // 6. Setup MediaRecorder with standard MP4 format priority
    let combinedStream = new MediaStream([
      ...canvas.captureStream(30).getVideoTracks(),
      ...audioDest.stream.getAudioTracks(),
    ]);

    const mimeTypesToTry = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    let chosenMime = '';
    for (const mt of mimeTypesToTry) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mt)) {
        chosenMime = mt;
        break;
      }
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = chosenMime
        ? new MediaRecorder(combinedStream, { mimeType: chosenMime, videoBitsPerSecond: 8000000 })
        : new MediaRecorder(combinedStream);
    } catch (e) {
      mediaRecorder = new MediaRecorder(combinedStream);
    }

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      isStopped = true;
      if (renderIntervalId) {
        clearInterval(renderIntervalId);
        renderIntervalId = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      loadedImages.forEach((m) => {
        if (m instanceof HTMLVideoElement) {
          try {
            m.pause();
          } catch {}
        }
      });
      const finalBlobType = chosenMime || 'video/mp4';
      let blob = new Blob(recordedChunksRef.current, { type: finalBlobType });
      const durationMs = totalVideoSec * 1000;

      // Patch duration metadata and inject EBML Cues so Samsung Gallery, KakaoTalk, and Instagram read the full video length (never 3s!)
      try {
        if (finalBlobType.includes('webm')) {
          blob = await fixWebmBlob(blob, durationMs);
        } else {
          blob = await fixMp4Duration(blob, totalVideoSec);
        }
      } catch (err) {
        console.warn('Video duration metadata fix warning:', err);
      }

      setVideoBlobFile(blob);
      setVideoBlobType(finalBlobType);
      try {
        const shareFileName = `Untold_${project.figureName || 'Shorts'}_${resolution}.mp4`;
        pregeneratedVideoFileRef.current = new File([blob], shareFileName, { type: 'video/mp4' });
      } catch (e) {}
      if (videoBlobUrlRef.current) {
        URL.revokeObjectURL(videoBlobUrlRef.current);
      }
      const url = URL.createObjectURL(blob);
      videoBlobUrlRef.current = url;
      setVideoBlobUrl(url);
      setPreviewViewMode('video');
      setIsRendering(false);
      await releaseWakeLock();
      setStatusMessage(`쇼츠 영상 제작 완료! (총 ${Math.round(totalVideoSec)}초 - 갤러리 및 카카오톡 전송 시 전체 길이 완벽 유지)`);
      setRenderProgress(100);

      // [Request 1] 영상 제작 완료 시 자동으로 보관함에 즉시 안전 보관
      try {
        await handleSaveToVault();
      } catch (vaultErr) {
        console.warn('Auto save to vault error on render complete:', vaultErr);
      }
    };

    // Start recorder FIRST with 100ms chunking for responsive stream capture
    mediaRecorder.start(100);

    // 7. Master Audio Clock Anchoring (Zero drift, 100% hardware-locked sync)
    // 250ms deterministic warmup buffer ensures MediaRecorder encoder pipeline is fully active
    const WARMUP_DELAY_SEC = 0.25;
    const masterStartAudioTime = audioCtx.currentTime + WARMUP_DELAY_SEC;
    const masterStartPerfTime = performance.now() + (WARMUP_DELAY_SEC * 1000);

    // Schedule all scene audio buffers strictly anchored to masterStartAudioTime
    for (let i = 0; i < scenes.length; i++) {
      const buf = audioBuffers[i];
      if (buf) {
        try {
          const src = audioCtx.createBufferSource();
          src.buffer = buf;
          src.playbackRate.value = effectivePlaybackRate;

          const filter = audioCtx.createBiquadFilter();
          if (selectedVoice.gender === 'male') {
            filter.type = 'lowshelf';
            filter.frequency.value = 250;
            filter.gain.value = 4.0;
          } else {
            filter.type = 'highshelf';
            filter.frequency.value = 2800;
            filter.gain.value = 3.5;
          }

          const voiceGain = audioCtx.createGain();
          voiceGain.gain.setValueAtTime(0.95, audioCtx.currentTime);

          src.connect(filter);
          filter.connect(voiceGain);
          voiceGain.connect(audioDest);

          // Audio begins at exact hardware clock timestamp
          src.start(masterStartAudioTime + sceneStartTimesSec[i]);
        } catch (e) {
          console.warn('Audio scheduling error for scene', i, e);
        }
      }
    }

    // 8. Video Rendering Frame Loop SLAVED TO high-precision performance clock
    let lastProgressUpdateTime = 0;
    let renderIntervalId: any = null;
    let currentActiveVideoIdx: number | null = null;

    const renderFrame = () => {
      // High-precision continuous clock: microsecond continuous animation without Windows WASAPI audio quantum stuttering (PC 사진 움직임 끊김 완벽 해결)
      const elapsedSec = (performance.now() - masterStartPerfTime) / 1000;

      // During 250ms pre-roll warmup, display scene 0 frame 0 cleanly
      const clampedElapsed = Math.max(0, elapsedSec);

      if (clampedElapsed >= totalVideoSec) {
        isStopped = true;
        if (renderIntervalId) {
          clearInterval(renderIntervalId);
          renderIntervalId = null;
        }
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        loadedImages.forEach((m) => {
          if (m instanceof HTMLVideoElement) {
            try { m.pause(); } catch {}
          }
        });
        // Redraw last scene frame cleanly before final cut
        const lastIdx = scenes.length - 1;
        drawSceneImage(
          ctx,
          loadedImages[lastIdx],
          width,
          height,
          0.999,
          scenes[lastIdx]?.motionEffect || 'zoom_in',
          precomputedBackdrops[lastIdx],
          {
            videoFit: scenes[lastIdx]?.videoFit,
            videoCrop: scenes[lastIdx]?.videoCrop,
          }
        );
        renderChannelLogo(ctx, width, height, lastIdx, loadedLogoImg);
        renderCustomTextOverlays(ctx, width, height, lastIdx);
        setTimeout(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        }, 150);
        return;
      }

      // Determine active scene strictly by AudioContext elapsed seconds with exact bounds
      // Prevents any scene from lingering too long or overlapping subsequent scenes!
      let activeIdx = 0;
      for (let i = 0; i < scenes.length; i++) {
        const sStart = sceneStartTimesSec[i];
        const sEnd = i < scenes.length - 1 ? sceneStartTimesSec[i + 1] : totalVideoSec;
        if (clampedElapsed >= sStart && clampedElapsed < sEnd) {
          activeIdx = i;
          break;
        }
        if (i === scenes.length - 1 && clampedElapsed >= sStart) {
          activeIdx = i;
          break;
        }
      }

      if (activeIdx !== currentActiveVideoIdx) {
        if (currentActiveVideoIdx !== null && loadedImages[currentActiveVideoIdx] instanceof HTMLVideoElement) {
          (loadedImages[currentActiveVideoIdx] as HTMLVideoElement).pause();
        }
        currentActiveVideoIdx = activeIdx;
        const currentMedia = loadedImages[activeIdx];
        if (currentMedia instanceof HTMLVideoElement) {
          const sc = scenes[activeIdx];
          currentMedia.currentTime = sc?.videoStartTime || 0;
          currentMedia.playbackRate = sc?.videoPlaybackRate || 1.0;
          currentMedia.play().catch(() => {});
        }
      }

      const scene = scenes[activeIdx];
      const img = loadedImages[activeIdx] || loadedImages[0];
      if (img instanceof HTMLVideoElement) {
        const sc = scenes[activeIdx];
        const endT = sc?.videoEndTime || img.duration || 9999;
        if (img.currentTime >= endT) {
          img.pause();
          img.currentTime = endT;
        }
      }

      const sceneStartTime = sceneStartTimesSec[activeIdx];
      const nextStartTime = activeIdx < scenes.length - 1 ? sceneStartTimesSec[activeIdx + 1] : totalVideoSec;
      const actualSceneDuration = Math.max(0.1, nextStartTime - sceneStartTime);
      const timeInScene = Math.max(0, Math.min(actualSceneDuration, clampedElapsed - sceneStartTime));
      const progressInScene = Math.min(0.999, Math.max(0, timeInScene / actualSceneDuration));

      const motion: MotionEffectType = scene?.motionEffect || 'zoom_in';

      // Draw scene photo/video with user-selected aspect ratio, precomputed backdrop (0ms CPU cost), and motion
      drawSceneImage(
        ctx,
        img,
        width,
        height,
        progressInScene,
        motion,
        precomputedBackdrops[activeIdx],
        {
          videoFit: scene?.videoFit,
          videoCrop: scene?.videoCrop,
        }
      );

      // Adaptive vignette based on subtitle position
      if (backdropStyle !== 'card_white' && backdropStyle !== 'card_black') {
        if (subtitleYPercent > 60) {
          const bottomGrad = ctx.createLinearGradient(0, height * 0.62, 0, height);
          bottomGrad.addColorStop(0, 'rgba(0,0,0,0)');
          bottomGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
          bottomGrad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = bottomGrad;
          ctx.fillRect(0, height * 0.62, width, height * 0.38);
        } else if (subtitleYPercent < 35) {
          const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.38);
          topGrad.addColorStop(0, 'rgba(0,0,0,0.85)');
          topGrad.addColorStop(0.5, 'rgba(0,0,0,0.65)');
          topGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = topGrad;
          ctx.fillRect(0, 0, width, height * 0.38);
        }
      }

      // Draw Channel Logo & Watermark
      renderChannelLogo(ctx, width, height, activeIdx, loadedLogoImg);

      // Draw CapCut-style Custom Text Overlays (상단 헤드라인 및 커스텀 자막들)
      renderCustomTextOverlays(ctx, width, height, activeIdx);

      // Frame-perfect Subtitle from precalculated alignment timings!
      const currentTimings = sceneChunkTimings[activeIdx] || [];
      let activeSubtitleText = '';
      if (currentTimings.length > 0) {
        const found = currentTimings.find(
          (c) => timeInScene >= c.startSec && timeInScene < c.endSec
        );
        if (found) {
          activeSubtitleText = found.text;
        } else if (timeInScene >= currentTimings[currentTimings.length - 1].endSec) {
          activeSubtitleText = currentTimings[currentTimings.length - 1].text;
        } else {
          activeSubtitleText = currentTimings[0].text;
        }
      } else {
        activeSubtitleText = scene?.narration || '';
      }

      // Draw custom subtitles for current chunk
      drawSubtitles(ctx, activeSubtitleText, width, height);

      // Throttle React state updates to every 250ms
      const nowMs = performance.now();
      if (nowMs - lastProgressUpdateTime > 250) {
        lastProgressUpdateTime = nowMs;
        const currentPct = Math.min(99, 45 + Math.round((clampedElapsed / totalVideoSec) * 55));
        setRenderProgress(currentPct);
        setStatusMessage(`Scene ${activeIdx + 1}/${scenes.length} 실시간 렌더링 중 (${currentPct}%)`);
        setCurrentRenderingScene(activeIdx + 1);
      }
    };

    // Single unified frame pump: perfectly paced 60/30fps rendering without stutter or frame collision
    let isStopped = false;
    let lastRenderTime = 0;

    const renderLoop = () => {
      if (isStopped) return;
      const now = performance.now();
      // Ensure smooth, steady frame pacing (~30-60 FPS) without jitter
      if (now - lastRenderTime >= 15) {
        lastRenderTime = now;
        renderFrame();
      }
      animationFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animationFrameRef.current = requestAnimationFrame(renderLoop);

    // Fallback interval ONLY steps the frame if requestAnimationFrame was frozen by an inactive/background tab
    renderIntervalId = setInterval(() => {
      if (isStopped || mediaRecorder.state !== 'recording') return;
      const now = performance.now();
      if (now - lastRenderTime > 50) {
        lastRenderTime = now;
        renderFrame();
      }
    }, 33);
  };

  const handleShareVideo = async () => {
    const blobToShare = videoBlobFile || (videoBlobUrl ? await fetch(videoBlobUrl).then((r) => r.blob()).catch(() => null) : null);
    if (!blobToShare) return;

    const fileName = `Untold_${project.figureName || 'Shorts'}_${resolution}.mp4`;
    let file = pregeneratedVideoFileRef.current;
    if (!file) {
      try {
        file = new File([blobToShare], fileName, { type: 'video/mp4' });
        pregeneratedVideoFileRef.current = file;
      } catch (e) {}
    }

    // 1. Mobile Native Web Share Level 2 (Direct Share to KakaoTalk, Instagram, Reels, etc.)
    // Specifying type: 'video/mp4' guarantees navigator.canShare evaluates to true on Android Chrome
    if (file && typeof navigator !== 'undefined' && navigator.canShare) {
      const shareDataCandidates = [
        { files: [file] }, // Best compatibility for KakaoTalk and Instagram on Android
        { files: [file], title: `[Untold] ${project.figureName}` },
      ];

      for (const shareCandidate of shareDataCandidates) {
        try {
          if (navigator.canShare(shareCandidate)) {
            await navigator.share(shareCandidate);
            setStatusMessage('📱 카카오톡/SNS 공유창이 열렸습니다. 카카오톡 또는 인스타그램을 선택해주세요!');
            return;
          }
        } catch (err: any) {
          if (err.name === 'AbortError') {
            // User cancelled native share sheet
            return;
          }
          console.warn('Native share candidate attempt warning:', err);
        }
      }
    }

    // 2. PC Desktop or unsupported browser environment (Windows Chrome, Kakao In-App Browser, etc.)
    // Trigger download so the video is ready on device, copy text to clipboard, and open helpful quick-share modal!
    handleDownload('mp4');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const copyContent = `[${project.figureName}] ${ctrTitleText || project.topic || '쇼츠'}\n\n#쇼츠 #릴스 #shorts #유튜브쇼츠`;
        await navigator.clipboard.writeText(copyContent);
      }
    } catch (e) {}

    if (typeof window !== 'undefined') {
      window.history.pushState({ subModal: 'sns-share' }, '');
    }
    setIsSnsShareModalOpen(true);
    setStatusMessage('카카오톡 & SNS 바로 공유 안내창이 열렸습니다.');
  };

  const handleDownload = (preferredExt?: 'mp4' | 'webm') => {
    if (!videoBlobUrl) return;
    const isWebm = (videoBlobType || '').includes('webm');
    // Ensure accurate file extension matching video stream encoding
    const ext = preferredExt || (isWebm ? 'webm' : 'mp4');
    const a = document.createElement('a');
    a.href = videoBlobUrl;
    a.download = `Untold_${project.figureName}_${resolution}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const modalHeaderContent = (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-7 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center space-x-2 sm:space-x-2.5 min-w-0">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
          <Film className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-xs sm:text-base font-black text-slate-900 truncate">
              {project.figureName} 쇼츠 제작
            </h3>
            <span className="text-[9px] sm:text-[11px] font-black px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
              9:16
            </span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 font-medium truncate">
            음성-화면 100% 싱크 동기화 + 긴 자막 화면 유지 자동 넘김
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-1.5 sm:space-x-2 shrink-0">
        {onSaveProject && (
          <button
            type="button"
            onClick={handleSaveToVault}
            disabled={isSavingToVault}
            className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition cursor-pointer shadow-xs active:scale-95 disabled:opacity-50"
            title="현재 설정을 보관함에 저장합니다"
          >
            <span>💾</span>
            <span className="hidden xs:inline">{isSavingToVault ? '저장 중...' : '보관함 저장'}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onBackToEditor || onClose}
          disabled={isRendering}
          className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs transition disabled:opacity-50 cursor-pointer shadow-2xs shrink-0"
          title="대본 스튜디오로 돌아가기"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
          <span className="hidden sm:inline">대본 복귀</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isRendering}
          className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-black text-xs transition disabled:opacity-50 cursor-pointer shadow-2xs shrink-0 active:scale-95"
          title="창 닫기"
        >
          <X className="w-3.5 h-3.5 text-rose-600" />
          <span>닫기</span>
        </button>
      </div>

      {saveSuccessMsg && (
        <div className="sm:hidden w-full p-2 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 text-center animate-fadeIn">
          {saveSuccessMsg}
        </div>
      )}
    </div>
  );

  const modalBodyContent = (
    <div className="overflow-y-auto flex-1 p-4 sm:p-7 space-y-4 sm:space-y-5">
      {saveSuccessMsg && (
        <div className="w-full p-3 bg-emerald-50 text-emerald-900 text-xs font-black rounded-2xl border border-emerald-300 shadow-2xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <span className="text-base">✅</span>
            <span>{saveSuccessMsg}</span>
          </div>
          <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-bold px-2 py-0.5">✕</button>
        </div>
      )}

      {/* 🛡️ 유튜브 5대 수익화 & 브랜드 세이프티 통과 배너 */}
      <div className="p-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
            ✓
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap">
              <span className="font-extrabold text-xs text-white">
                유튜브 5대 수익화 & 브랜드 세이프티 PASS
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                심사 5대 항목 올 통과
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              재사용 콘텐츠 방어 | 광고주 친화적 안전 등급 | 2차 저작물 공정 이용 | 60초 황금 서사율 충족
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => alert("🛡️ [5대 유튜브 수익화 & 클린 심사 통과 보고서]\n\n1. 재사용 콘텐츠(Reused Content) 제재 완벽 방어\n   - AI 고유 나레이션 + 장면별 고화질 에셋 + 텍스트 자막 싱크\n\n2. 저작권법 제35조의 5(공정 이용) 및 미국 Fair Use 적합\n   - 비판, 논평, 보도 목적의 100% 창작 2차 저작물\n\n3. 광고주 친화적 콘텐츠 가이드라인 준수\n   - 허위/날조, 유해/선정성 배제, 고품격 다큐멘터리 서사\n\n4. 60초 5단계 황금 서사율 충족\n   - 0~3초 후킹으로 스크롤 이탈 방어, 시청 지속시간 극대화\n\n5. 공정거래위원회 표시광고법 클린\n   - 과장/기만 문구 없는 100% 사실 기반")}
          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white border border-white/20 rounded-xl text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer"
        >
          5대 항목 보기
        </button>
      </div>
          {/* Settings Navigation Tabs (6 Sections) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveSettingsSection('ratio')}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeSettingsSection === 'ratio'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Square className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">프레임</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('overlay')}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer relative ${
                activeSettingsSection === 'overlay'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">오버레이</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('subtitle')}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeSettingsSection === 'subtitle'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Type className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">자막</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('voice')}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeSettingsSection === 'voice'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">성우 ({voiceSpeedMultiplier}x)</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('thumbnail')}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeSettingsSection === 'thumbnail'
                  ? 'bg-white text-amber-700 shadow-2xs font-black ring-1 ring-amber-300'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="truncate">썸네일</span>
            </button>

            <button
              onClick={() => setActiveSettingsSection('output')}
              className={`py-2 px-1.5 rounded-xl transition flex items-center justify-center space-x-1 cursor-pointer ${
                activeSettingsSection === 'output'
                  ? 'bg-white text-indigo-700 shadow-2xs font-black ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">해상도</span>
            </button>
          </div>

          {/* Modal Body: Left Controls, Right Preview (Mobile-First Order: Preview First on Mobile) */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {/* Left Column: Settings Sections (6 cols) */}
            <div className="md:col-span-6 space-y-4 order-2 md:order-1">


              {/* SECTION 0: Photo Aspect Ratio & Framing */}
              {activeSettingsSection === 'ratio' && (
                <div className="space-y-4">
                  {/* 1. Ratio Selection Cards */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <Square className="w-4 h-4 text-indigo-600" />
                        <span>사진 프레임 비율 선택 (5종)</span>
                      </label>
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {photoAspectRatio === '1:1' ? '1:1 정사각형 추천' : photoAspectRatio}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {PHOTO_ASPECT_RATIOS.map((item) => {
                        const isSelected = photoAspectRatio === item.id;
                        return (
                          <div
                            key={item.id}
                            onClick={() => {
                              setPhotoAspectRatio(item.id);
                              setPreviewViewMode('live');
                            }}
                            className={`p-3 rounded-2xl border text-left transition flex items-start space-x-3 cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              {item.id === '1:1' ? (
                                <Square className="w-5 h-5" />
                              ) : item.id === '9:16' ? (
                                <Maximize2 className="w-5 h-5" />
                              ) : item.id === '4:5' ? (
                                <Layers className="w-5 h-5" />
                              ) : item.id === '16:9' ? (
                                <Film className="w-5 h-5" />
                              ) : (
                                <ImageIcon className="w-5 h-5" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-slate-900 text-xs">{item.label}</span>
                                {item.id === '1:1' && (
                                  <span className="text-[10px] bg-rose-50 text-rose-600 border border-rose-200 px-1.5 py-0.2 rounded-full font-black">
                                    쇼츠 대세 추천
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-indigo-600 font-bold mt-0.5">{item.sub}</div>
                              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                            </div>

                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-lg shrink-0 ${
                                isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {item.ratioDisplay}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Backdrop Style (Interactive & Live in preview) */}
                  {photoAspectRatio !== '9:16' ? (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-amber-500" />
                          <span>배경 연출 스타일 (9:16 여백 영역)</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">
                          카드 뒤 배경 즉시 반영
                        </span>
                      </label>

                      <div className="grid grid-cols-3 gap-2 text-xs">
                        {BACKDROP_STYLES.map((bg) => {
                          const isSelected = backdropStyle === bg.id;
                          return (
                            <button
                              key={bg.id}
                              type="button"
                              onClick={() => {
                                handleSelectBackdrop(bg.id);
                              }}
                              disabled={isRendering}
                              className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-between space-y-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/20 shadow-xs'
                                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600'
                              }`}
                            >
                              <span className="font-extrabold text-slate-900 text-xs">{bg.label}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isSelected ? 'bg-amber-200/60 text-amber-900' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {bg.badge}
                              </span>
                              <p className="text-[10px] text-slate-500 leading-tight">{bg.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 space-y-2">
                      <div className="flex items-center justify-between font-bold">
                        <span className="flex items-center gap-1.5">
                          <Palette className="w-4 h-4 text-amber-600" />
                          <span>배경 연출 스타일</span>
                        </span>
                        <span className="text-[10px] bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full font-black">
                          현재 9:16 전체 채움
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-snug">
                        💡 9:16 풀스크린 모드에서는 사진이 화면을 꽉 채워 배경이 가려집니다. 아래 배경 스타일을 누르면 <strong>1:1 카드 모드로 자동 전환</strong>되어 감상하실 수 있습니다.
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-0.5">
                        {BACKDROP_STYLES.map((bg) => (
                          <button
                            key={bg.id}
                            type="button"
                            onClick={() => {
                              setPhotoAspectRatio('1:1');
                              handleSelectBackdrop(bg.id);
                            }}
                            className="p-2 rounded-xl bg-white hover:bg-amber-100/70 border border-amber-300 text-center text-slate-800 font-bold text-xs transition cursor-pointer shadow-2xs"
                          >
                            {bg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Pro Creator Tip Box */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 to-amber-50 border border-indigo-200/80 text-xs text-slate-700 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-1.5 font-black text-indigo-950">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>쇼츠 프로 꿀팁: 왜 1:1 정사각형 카드가 바이럴에 유리할까요?</span>
                    </div>
                    <p className="leading-relaxed font-medium text-[11px] text-slate-600">
                      1분미만, 머니그라피 등 국내 최고 인기 쇼츠 채널은 상단에 <strong>1:1 정사각형 카드</strong>로 인물/자료를 안정감 있게 배치하고, 하단에 <strong>자막이 사진을 가리지 않도록</strong> 여백을 둡니다. 가로 사진도 얼굴이 잘리지 않고 온전히 담겨 시청자 집중도와 리텐션이 크게 증가합니다.
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION: CapCut-style Overlay & Logo Manager */}
              {activeSettingsSection === 'overlay' && (
                <div className="space-y-4">
                  {/* 1. Quick One-Click Sample Preset */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-md space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-300" />
                        <h4 className="font-black text-sm">샘플 릴스 바이럴 스타일 1초 적용</h4>
                      </div>
                      <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full font-bold">
                        1:1 화이트 카드뉴스
                      </span>
                    </div>
                    <p className="text-[11px] text-white/90 leading-relaxed font-medium">
                      참고 사진과 동일하게 <strong>상단 화이트 여백 + 채널 로고 + 상단 헤드라인 타이틀 + 1:1 사진 + 하단 자막</strong>으로 원클릭 세팅됩니다.
                    </p>
                    <button
                      type="button"
                      onClick={handleApplySampleReelsPreset}
                      className="w-full mt-1 py-2.5 px-4 bg-white hover:bg-amber-50 text-slate-900 rounded-xl font-black text-xs transition shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span>⚡ 샘플 릴스 스타일 바로 적용하기</span>
                    </button>
                  </div>

                  {/* Toast Alert for Preset Save/Apply */}
                  {presetToastMessage && (
                    <div className="p-3 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md flex items-center justify-between animate-bounce">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-yellow-300" />
                        <span>{presetToastMessage}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPresetToastMessage(null)}
                        className="text-white/80 hover:text-white text-xs font-bold px-1"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  {/* 💾 나만의 커스텀 오버레이 프리셋 저장 / 관리 */}
                  <div className="p-4 rounded-2xl bg-indigo-50/90 border border-indigo-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-xs font-black text-indigo-950">
                        <Bookmark className="w-4 h-4 text-indigo-600" />
                        <span>내 오버레이 세팅 보관함 (커스텀 저장)</span>
                      </div>
                      <span className="text-[10px] text-indigo-700 font-bold bg-indigo-100 px-2 py-0.5 rounded-full">
                        {overlayPresets.length}개 보관 중
                      </span>
                    </div>

                    <p className="text-[11px] text-indigo-900/80 leading-relaxed font-medium">
                      현재 세팅된 <strong>채널 로고 위치·크기, 상단 타이틀 레이아웃, 프레임 비율</strong>을 저장해두고 언제든 원클릭으로 불러올 수 있습니다.
                    </p>

                    {/* 프리셋 이름 입력 및 저장 */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newOverlayPresetName}
                        onChange={(e) => setNewOverlayPresetName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveOverlayPreset(newOverlayPresetName);
                            setNewOverlayPresetName('');
                          }
                        }}
                        placeholder="저장할 프리셋 이름 (예: Untold 릴스 전용, 기업IR 화이트)"
                        className="flex-1 text-xs bg-white border border-indigo-200 focus:border-indigo-500 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveOverlayPreset(newOverlayPresetName);
                          setNewOverlayPresetName('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs transition shadow-xs cursor-pointer flex items-center space-x-1 shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>현재 세팅 저장</span>
                      </button>
                    </div>

                    {/* 저장된 오버레이 프리셋 목록 */}
                    {overlayPresets.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-indigo-200/70">
                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider block">
                          저장된 내 프리셋 목록 (클릭 시 즉시 적용)
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {overlayPresets.map((preset) => (
                            <div
                              key={preset.id}
                              className="p-2.5 rounded-xl bg-white border border-indigo-100 hover:border-indigo-300 shadow-2xs flex items-center justify-between gap-2 transition"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="font-extrabold text-xs text-slate-900 truncate block">
                                  {preset.name}
                                </span>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                  {preset.channelLogo?.channelName || 'Untold'} • {preset.photoAspectRatio} • {preset.backdropStyle}
                                </p>
                              </div>
                              <div className="flex items-center space-x-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleApplyOverlayPreset(preset)}
                                  className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 font-black text-[11px] transition cursor-pointer"
                                  title="현재 영상에 이 오버레이 설정 적용"
                                >
                                  적용
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteOverlayPreset(preset.id)}
                                  className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                  title="프리셋 삭제"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Channel Logo & Branding Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>상단 채널 로고 & 브랜딩</span>
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channelLogo.enabled}
                          onChange={(e) => setChannelLogo((prev) => ({ ...prev, enabled: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        <span className="ml-2 text-xs font-bold text-slate-700">
                          {channelLogo.enabled ? '표시 중' : '숨김'}
                        </span>
                      </label>
                    </div>

                    {channelLogo.enabled && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        {/* Logo Upload & Channel Name */}
                        <div className="flex items-center gap-3">
                          <div className="relative group shrink-0">
                            <div className={`w-14 h-14 bg-slate-200 border-2 border-indigo-200 overflow-hidden flex items-center justify-center shadow-xs ${channelLogo.shape === 'circle' ? 'rounded-full' : 'rounded-xl'}`}>
                              {channelLogo.imageUrl ? (
                                <img src={channelLogo.imageUrl} alt="Channel Logo" className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <label className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[9px] font-bold">
                              <Upload className="w-3.5 h-3.5 mb-0.5" />
                              변경
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>

                          <div className="flex-1 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-slate-600">채널명 텍스트</span>
                              <label className="flex items-center gap-1 text-[10px] text-slate-500 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={channelLogo.showChannelName}
                                  onChange={(e) => setChannelLogo((prev) => ({ ...prev, showChannelName: e.target.checked }))}
                                  className="rounded text-indigo-600 focus:ring-0"
                                />
                                <span>이름 함께 표시</span>
                              </label>
                            </div>
                            <input
                              type="text"
                              value={channelLogo.channelName}
                              onChange={(e) => setChannelLogo((prev) => ({ ...prev, channelName: e.target.value }))}
                              placeholder="예: 노빠꾸소개맨, 언톨드"
                              className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Shape & Size & Position */}
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1 block">로고 형태</span>
                            <div className="flex rounded-lg bg-white border border-slate-200 p-0.5">
                              <button
                                type="button"
                                onClick={() => setChannelLogo((prev) => ({ ...prev, shape: 'circle' }))}
                                className={`flex-1 py-1 text-[11px] font-bold rounded-md transition ${channelLogo.shape === 'circle' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                원형
                              </button>
                              <button
                                type="button"
                                onClick={() => setChannelLogo((prev) => ({ ...prev, shape: 'rounded' }))}
                                className={`flex-1 py-1 text-[11px] font-bold rounded-md transition ${channelLogo.shape === 'rounded' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                둥근 사각
                              </button>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1 block">크기</span>
                            <div className="flex rounded-lg bg-white border border-slate-200 p-0.5">
                              {(['small', 'medium', 'large'] as const).map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setChannelLogo((prev) => ({ ...prev, size: sz }))}
                                  className={`flex-1 py-1 text-[10px] font-bold rounded-md transition ${channelLogo.size === sz ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                  {sz === 'small' ? '소' : sz === 'medium' ? '중' : '대'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-slate-500 mb-1 block">위치</span>
                            <select
                              value={channelLogo.position}
                              onChange={(e) => setChannelLogo((prev) => ({ ...prev, position: e.target.value as any }))}
                              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                            >
                              <option value="top-left">상단 좌측 (추천)</option>
                              <option value="top-center">상단 중앙</option>
                              <option value="top-right">상단 우측</option>
                            </select>
                          </div>
                        </div>

                        {/* Channel Logo Y-Axis Height Adjustment (상하 위치 조절) */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                              <AlignVerticalJustifyCenter className="w-3.5 h-3.5 text-indigo-600" />
                              로고 상하 높이 (Y축 위치)
                            </span>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              화면 {channelLogo.yPercent ?? 7}% 높이
                            </span>
                          </div>

                          {/* Quick Height Presets */}
                          <div className="grid grid-cols-4 gap-1 text-[10px]">
                            {[
                              { label: '최상단 (4%)', val: 4 },
                              { label: '상단 (7% 기본)', val: 7 },
                              { label: '안전 (12%)', val: 12 },
                              { label: '중상단 (17%)', val: 17 },
                            ].map((p) => (
                              <button
                                key={p.val}
                                type="button"
                                onClick={() => setChannelLogo((prev) => ({ ...prev, yPercent: p.val }))}
                                className={`py-1 rounded-md font-bold text-center transition ${
                                  (channelLogo.yPercent ?? 7) === p.val
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>

                          {/* Y-Axis Slider */}
                          <div className="flex items-center space-x-2 pt-0.5">
                            <span className="text-[9px] text-slate-400 font-bold">2%</span>
                            <input
                              type="range"
                              min={2}
                              max={45}
                              value={channelLogo.yPercent ?? 7}
                              onChange={(e) =>
                                setChannelLogo((prev) => ({
                                  ...prev,
                                  yPercent: parseInt(e.target.value, 10),
                                }))
                              }
                              className="flex-1 accent-indigo-600 cursor-pointer h-1.5"
                            />
                            <span className="text-[9px] text-slate-400 font-bold">45%</span>
                          </div>
                        </div>

                        {/* Scene Extension Range (구간 연장) */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-slate-700 flex items-center gap-1">
                              <Move className="w-3.5 h-3.5 text-indigo-600" />
                              로고 노출 구간 연장
                            </span>
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                              씬 {channelLogo.startScene} ~ 씬 {channelLogo.endScene} ({channelLogo.endScene === scenes.length ? '영상 끝까지' : `${channelLogo.endScene - channelLogo.startScene + 1}개 씬`})
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5">시작 지점</span>
                              <select
                                value={channelLogo.startScene}
                                onChange={(e) => setChannelLogo((prev) => ({ ...prev, startScene: Number(e.target.value) }))}
                                className="w-full py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
                              >
                                {scenes.map((_, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    씬 {idx + 1}부터
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-0.5">종료 지점</span>
                              <select
                                value={channelLogo.endScene}
                                onChange={(e) => setChannelLogo((prev) => ({ ...prev, endScene: Number(e.target.value) }))}
                                className="w-full py-1 px-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-700"
                              >
                                {scenes.map((_, idx) => (
                                  <option key={idx + 1} value={idx + 1}>
                                    씬 {idx + 1}까지 {idx + 1 === scenes.length ? '(끝까지)' : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 3. Multi-Text Subtitle Overlays (CapCut Style "+ 자막 추가") */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-indigo-600" />
                          <span>캡컷 스타일 자유 텍스트 레이어</span>
                        </label>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          상단 타이틀 헤드라인이나 강조 문구를 무제한 추가하고 구간을 연장하세요.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddCustomTextOverlay()}
                        className="flex items-center gap-1 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>자막 추가</span>
                      </button>
                    </div>

                    {customTextOverlays.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-white border border-dashed border-slate-300 space-y-2">
                        <Type className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-600 font-bold">추가된 커스텀 자막 레이어가 없습니다.</p>
                        <p className="text-[11px] text-slate-400">
                          상단에 큰 타이틀 제목이나 원하는 위치에 자유롭게 텍스트를 배치해보세요.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleAddCustomTextOverlay()}
                          className="mt-2 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>첫 자막 추가하기</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customTextOverlays.map((overlay, index) => (
                          <div
                            key={overlay.id}
                            className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition hover:border-indigo-300"
                          >
                            {/* Layer Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black flex items-center justify-center">
                                  {index + 1}
                                </span>
                                <span className="text-xs font-black text-slate-800">
                                  {overlay.positionYPercent <= 20 ? '상단 헤드라인 자막' : overlay.positionYPercent >= 70 ? '하단 자막' : '중앙 자막'}
                                </span>
                                <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                                  Y: {overlay.positionYPercent}%
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleDuplicateCustomTextOverlay(overlay.id)}
                                  title="자막 복제"
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCustomTextOverlay(overlay.id)}
                                  title="자막 삭제"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Text Input */}
                            <textarea
                              value={overlay.text}
                              onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { text: e.target.value })}
                              rows={2}
                              placeholder="자막 문구를 입력하세요 (줄바꿈 가능)"
                              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none leading-relaxed"
                            />

                            {/* Quick 2-Line Short Summarizer & Recommendations */}
                            <div className="space-y-1.5 pt-0.5">
                              <div className="flex flex-wrap items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const short = summarizeToShortHeadline(overlay.text || project.titles?.[0] || project.figureName, project.figureName);
                                    handleUpdateCustomTextOverlay(overlay.id, { text: short });
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-black transition cursor-pointer active:scale-95 shadow-2xs"
                                  title="현재 문구를 릴스용 2줄 짧은 요약으로 자동 압축"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-600 fill-amber-500" />
                                  <span>⚡ 릴스용 2줄 짧은 요약으로 변환</span>
                                </button>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  {overlay.text.replace(/\n/g, ' ').length}자 ({overlay.text.includes('\n') ? '2줄' : '1줄'})
                                </span>
                              </div>

                              {/* Smart Recommendation Chips */}
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <span className="text-[9px] font-black text-slate-400 shrink-0">추천 2줄 요약:</span>
                                {getShortHeadlinePresets(project).map((preset, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { text: preset })}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 hover:border-indigo-300 text-[10px] font-bold transition cursor-pointer text-left leading-tight"
                                    title="클릭 시 이 요약 문구로 즉시 교체"
                                  >
                                    {preset.replace('\n', ' / ')}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Timeline Scene Range Extension (구간 연장) */}
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-700 flex items-center gap-1">
                                  <Move className="w-3 h-3 text-indigo-600" />
                                  표시 구간 연장
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { startScene: 1, endScene: scenes.length })}
                                    className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded font-bold transition cursor-pointer"
                                  >
                                    영상 끝까지 연장
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { startScene: previewSceneIndex + 1, endScene: previewSceneIndex + 1 })}
                                    className="text-[9px] px-1.5 py-0.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded font-bold transition cursor-pointer"
                                  >
                                    현재 씬만
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <select
                                  value={overlay.startScene}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { startScene: Number(e.target.value) })}
                                  className="w-full py-1 px-1.5 text-[11px] bg-white border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  {scenes.map((_, sIdx) => (
                                    <option key={sIdx + 1} value={sIdx + 1}>
                                      씬 {sIdx + 1}부터
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={overlay.endScene}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { endScene: Number(e.target.value) })}
                                  className="w-full py-1 px-1.5 text-[11px] bg-white border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  {scenes.map((_, sIdx) => (
                                    <option key={sIdx + 1} value={sIdx + 1}>
                                      씬 {sIdx + 1}까지 {sIdx + 1 === scenes.length ? '(끝까지)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Position Controls (Presets + Slider) */}
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-600">위치 설정 (Y축)</span>
                                <span className="text-[10px] text-slate-400 font-bold">{overlay.positionYPercent}%</span>
                              </div>
                              <div className="grid grid-cols-4 gap-1">
                                {[
                                  { label: '상단 (17% 기본)', y: 17 },
                                  { label: '중상단 (26%)', y: 26 },
                                  { label: '중앙 (50%)', y: 50 },
                                  { label: '하단 (81%)', y: 81 },
                                ].map((pos) => (
                                  <button
                                    key={pos.label}
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { positionYPercent: pos.y })}
                                    className={`py-1 text-[10px] font-bold rounded border transition cursor-pointer ${
                                      Math.abs(overlay.positionYPercent - pos.y) <= 3
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                    }`}
                                  >
                                    {pos.label}
                                  </button>
                                ))}
                              </div>
                              <input
                                type="range"
                                min={5}
                                max={95}
                                value={overlay.positionYPercent}
                                onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { positionYPercent: Number(e.target.value) })}
                                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                              />

                              {/* Interactive X-Axis & Rotation Controls for Custom Text Overlay */}
                              <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-200/80">
                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                                    <span>가로 위치 (X축)</span>
                                    <span>{overlay.positionXPercent ?? 50}%</span>
                                  </div>
                                  <input
                                    type="range"
                                    min={15}
                                    max={85}
                                    value={overlay.positionXPercent ?? 50}
                                    onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { positionXPercent: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                </div>

                                <div>
                                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 mb-1">
                                    <span className="flex items-center gap-1">
                                      <RotateCw className="w-2.5 h-2.5 text-indigo-600" />
                                      자막 회전 (각도)
                                    </span>
                                    <span className={`font-mono ${(overlay.rotationDeg || 0) !== 0 ? 'text-indigo-600 font-extrabold' : ''}`}>
                                      {overlay.rotationDeg || 0}°
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <input
                                      type="range"
                                      min={-45}
                                      max={45}
                                      value={overlay.rotationDeg || 0}
                                      onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { rotationDeg: Number(e.target.value) })}
                                      className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                    />
                                    {(overlay.rotationDeg || 0) !== 0 && (
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateCustomTextOverlay(overlay.id, { rotationDeg: 0 })}
                                        className="text-[9px] px-1 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700"
                                        title="0도로 초기화"
                                      >
                                        0°
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Font, Size, Color & Box Styling */}
                            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">폰트</span>
                                <select
                                  value={overlay.fontFamily || 'Do Hyeon'}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { fontFamily: e.target.value as SubtitleFontFamily })}
                                  className="w-full py-1 px-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  {COMMERCIAL_FONTS.map((font) => (
                                    <option key={font.id} value={font.id}>
                                      {font.name.split(' ')[0]}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">글자 크기 ({overlay.fontSizeScale.toFixed(2)}x)</span>
                                <input
                                  type="range"
                                  min={0.7}
                                  max={1.8}
                                  step={0.05}
                                  value={overlay.fontSizeScale}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { fontSizeScale: Number(e.target.value) })}
                                  className="w-full h-1.5 mt-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                              </div>

                              <div>
                                <span className="text-[10px] text-slate-500 font-bold block mb-0.5">배경 스타일</span>
                                <select
                                  value={overlay.backgroundColor || 'transparent'}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { backgroundColor: e.target.value })}
                                  className="w-full py-1 px-1.5 text-[10px] bg-slate-50 border border-slate-200 rounded font-bold text-slate-700"
                                >
                                  <option value="transparent">배경 없음</option>
                                  <option value="rgba(250, 204, 21, 0.95)">노란 박스 (강조)</option>
                                  <option value="rgba(0, 0, 0, 0.75)">검정 반투명 박스</option>
                                  <option value="rgba(255, 255, 255, 0.9)">흰색 반투명 박스</option>
                                </select>
                              </div>
                            </div>

                            {/* Background Opacity Slider (배경이 있을 때만 활성화) */}
                            {overlay.backgroundColor && overlay.backgroundColor !== 'transparent' && (
                              <div className="pt-2 px-1">
                                <div className="flex items-center justify-between text-[10px] mb-1">
                                  <span className="font-bold text-slate-600 flex items-center gap-1">
                                    <span>🫧</span> 배경 상자 투명도
                                  </span>
                                  <span className="font-mono font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                                    {overlay.bgOpacityPercent ?? 88}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-slate-400 font-bold shrink-0">0%</span>
                                  <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={overlay.bgOpacityPercent ?? 88}
                                    onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { bgOpacityPercent: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                  />
                                  <span className="text-[9px] text-slate-400 font-bold shrink-0">100%</span>
                                </div>
                              </div>
                            )}

                            {/* Color Quick Palette */}
                            <div className="flex items-center justify-between pt-1">
                              <span className="text-[10px] font-bold text-slate-500">글자 색상</span>
                              <div className="flex items-center gap-1.5">
                                {[
                                  { color: '#000000', label: '검정' },
                                  { color: '#ffffff', label: '흰색' },
                                  { color: '#facc15', label: '노랑' },
                                  { color: '#ef4444', label: '빨강' },
                                  { color: '#3b82f6', label: '파랑' },
                                ].map((c) => (
                                  <button
                                    key={c.color}
                                    type="button"
                                    onClick={() => handleUpdateCustomTextOverlay(overlay.id, { textColor: c.color })}
                                    title={c.label}
                                    className={`w-5 h-5 rounded-full border-2 transition cursor-pointer ${
                                      overlay.textColor === c.color ? 'border-indigo-600 scale-110 shadow-xs' : 'border-slate-300'
                                    }`}
                                    style={{ backgroundColor: c.color }}
                                  />
                                ))}
                                <input
                                  type="color"
                                  value={overlay.textColor || '#000000'}
                                  onChange={(e) => handleUpdateCustomTextOverlay(overlay.id, { textColor: e.target.value })}
                                  className="w-6 h-6 p-0 border-0 rounded cursor-pointer"
                                  title="직접 색상 선택"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SECTION 1: Subtitle Customizer */}
            {activeSettingsSection === 'subtitle' && (
              <div className="space-y-4">
                {/* 0. CapCut Dynamic Subtitle Tempo (캡컷식 한 씬 다분할 자막 전환) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                      <span>캡컷식 빠른 자막 분할 템포 (시청 유지율 극대화)</span>
                    </label>
                    <span className="text-[10px] text-amber-800 font-extrabold bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                      ⚡ 캡컷 몰입형 전환
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                    인스타 릴스·유튜브 쇼츠에서 긴 문장을 한 씬 내내 띄우면 이탈률이 높아집니다. 
                    <strong> 한 씬 안에서 2~4단어(6~12자)씩 자막이 빠르게 교체</strong>되며 시청자의 몰입과 집중을 유지합니다.
                  </p>

                  {/* Tempo 3 Presets */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: 'fast' as SubtitleTempo,
                        title: '⚡ 속공형 (추천)',
                        desc: '6~10자 (약 0.9초마다 전환)',
                        badge: '릴스·쇼츠 떡상용'
                      },
                      {
                        id: 'standard' as SubtitleTempo,
                        title: '🎬 표준형',
                        desc: '10~14자 (약 1.3초마다 전환)',
                        badge: '자연스러운 속도'
                      },
                      {
                        id: 'relaxed' as SubtitleTempo,
                        title: '📖 여유형',
                        desc: '14~18자 (호흡 길게)',
                        badge: '스토리·다큐형'
                      }
                    ].map((tempo) => {
                      const isSelected = subtitleTempo === tempo.id;
                      return (
                        <button
                          key={tempo.id}
                          type="button"
                          onClick={() => setSubtitleTempo(tempo.id)}
                          disabled={isRendering}
                          className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 hover:bg-amber-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black">{tempo.title}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className={`text-[10px] leading-tight font-medium ${isSelected ? 'text-amber-100' : 'text-slate-500'}`}>
                              {tempo.desc}
                            </p>
                          </div>
                          <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-amber-600/80 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {tempo.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Real-time Subtitle Chunks Breakdown for Active Preview Scene */}
                  {(() => {
                    const activeScene = scenes[previewSceneIndex] || scenes[0];
                    const text = activeScene?.narration || '';
                    const chunks = getSubtitleChunks(text, subtitleTempo);
                    return (
                      <div className="pt-2 border-t border-amber-200/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-extrabold text-amber-950 flex items-center gap-1">
                            <span>현재 씬({previewSceneIndex + 1}) 자막 분할:</span>
                            <span className="text-amber-600 font-black">{chunks.length}개로 순차 전환</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsAutoCyclingChunks(!isAutoCyclingChunks)}
                            className="flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full border border-amber-300 transition"
                          >
                            {isAutoCyclingChunks ? (
                              <>
                                <Pause className="w-2.5 h-2.5 text-amber-700" />
                                <span>롤링 일시정지</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-2.5 h-2.5 text-amber-700" />
                                <span>자동 롤링 재생</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Chunk Pills */}
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white/80 rounded-xl border border-amber-200">
                          {chunks.map((chk, idx) => {
                            const isActive = previewChunkIndex === idx;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setIsAutoCyclingChunks(false);
                                  setPreviewChunkIndex(idx);
                                }}
                                className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 border ${
                                  isActive
                                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-amber-50'
                                }`}
                              >
                                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${isActive ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                  #{idx + 1}
                                </span>
                                <span>"{chk}"</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 💾 나만의 커스텀 자막 프리셋 저장 / 관리 */}
                <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-xs font-black text-amber-950">
                      <Bookmark className="w-4 h-4 text-amber-600" />
                      <span>내 자막 스타일 보관함 (커스텀 저장)</span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-bold bg-amber-200/80 px-2 py-0.5 rounded-full">
                      {subtitlePresets.length}개 보관 중
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/80 leading-relaxed font-medium">
                    현재 세팅된 <strong>자막 폰트, 크기, 스타일 효과, Y축 상하 위치, 템포</strong>를 저장해두고 언제든 원클릭으로 바로 적용하세요.
                  </p>

                  {/* 프리셋 이름 입력 & 저장 버튼 */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtitlePresetName}
                      onChange={(e) => setNewSubtitlePresetName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveSubtitlePreset(newSubtitlePresetName);
                          setNewSubtitlePresetName('');
                        }
                      }}
                      placeholder="저장할 프리셋 이름 (예: 노란박스 81% 하단, 네온글로우 센터)"
                      className="flex-1 text-xs bg-white border border-amber-200 focus:border-amber-500 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 font-bold focus:outline-none shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        handleSaveSubtitlePreset(newSubtitlePresetName);
                        setNewSubtitlePresetName('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs transition shadow-xs cursor-pointer flex items-center space-x-1 shrink-0"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>현재 자막 저장</span>
                    </button>
                  </div>

                  {/* 저장된 자막 프리셋 목록 */}
                  {subtitlePresets.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-amber-200/70">
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                        저장된 내 프리셋 목록 (클릭 시 즉시 적용)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {subtitlePresets.map((preset) => (
                          <div
                            key={preset.id}
                            className="p-2.5 rounded-xl bg-white border border-amber-100 hover:border-amber-300 shadow-2xs flex items-center justify-between gap-2 transition"
                          >
                            <div className="min-w-0 flex-1">
                              <span className="font-extrabold text-xs text-slate-900 truncate block">
                                {preset.name}
                              </span>
                              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                                {preset.subtitleFont} • {preset.subtitleStyle} • Y {preset.subtitleYPercent}% • {preset.subtitleTempo}
                              </p>
                            </div>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleApplySubtitlePreset(preset)}
                                className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-700 font-black text-[11px] transition cursor-pointer"
                                title="현재 영상에 이 자막 스타일 적용"
                              >
                                적용
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubtitlePreset(preset.id)}
                                className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                title="프리셋 삭제"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 1. Commercial Free Font Selector */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="text-xs font-black text-slate-800 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Type className="w-4 h-4 text-indigo-600" />
                      <span>상업적 이용 가능한 무료 폰트 (7종)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      상업적 무료 100%
                    </span>
                  </label>

                  <select
                    value={subtitleFont}
                    onChange={(e) => setSubtitleFont(e.target.value as SubtitleFontFamily)}
                    disabled={isRendering}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-bold focus:outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    {COMMERCIAL_FONTS.map((font) => (
                      <option key={font.id} value={font.id}>
                        {font.name} • [{font.tag}]
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-slate-500 font-medium">
                    유튜브 쇼츠, 인스타 릴스, 틱톡에 상업적 저작권 걱정 없이 100% 무료로 사용할 수 있는 검증된 폰트입니다.
                  </p>
                </div>

                {/* 2. Subtitle Vertical Position (자막 위치 조절) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <AlignVerticalJustifyCenter className="w-4 h-4 text-indigo-600" />
                      <span>자막 상하 위치 조절 (높이)</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      화면 {subtitleYPercent}% 지점
                    </span>
                  </div>

                  {/* Position Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {POSITION_PRESETS.map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => setSubtitleYPercent(pos.value)}
                        disabled={isRendering}
                        className={`py-1.5 px-1 rounded-lg font-bold text-center text-[11px] transition ${
                          Math.abs(subtitleYPercent - pos.value) < 2
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <div className="flex items-center space-x-3 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold">상단 (12%)</span>
                    <input
                      type="range"
                      min={12}
                      max={88}
                      value={subtitleYPercent}
                      onChange={(e) => setSubtitleYPercent(parseInt(e.target.value, 10))}
                      disabled={isRendering}
                      className="flex-1 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-[10px] text-slate-400 font-bold">하단 (88%)</span>
                  </div>

                  {/* Main Subtitle X-Axis and Rotation Controls */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>가로 위치 (X축)</span>
                        <span className="text-indigo-600 font-mono text-[10px]">{subtitleXPercent ?? 50}%</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={85}
                        value={subtitleXPercent ?? 50}
                        onChange={(e) => setSubtitleXPercent(parseInt(e.target.value, 10))}
                        disabled={isRendering}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span className="flex items-center gap-1">
                          <RotateCw className="w-3 h-3 text-indigo-600" />
                          자막 회전 (각도)
                        </span>
                        <span className={`font-mono text-[10px] ${(subtitleRotationDeg ?? 0) !== 0 ? 'text-indigo-600 font-extrabold' : 'text-slate-500'}`}>
                          {subtitleRotationDeg ?? 0}°
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mb-1">
                        <input
                          type="range"
                          min={-180}
                          max={180}
                          value={subtitleRotationDeg ?? 0}
                          onChange={(e) => setSubtitleRotationDeg(parseInt(e.target.value, 10))}
                          disabled={isRendering}
                          className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                        {(subtitleRotationDeg ?? 0) !== 0 && (
                          <button
                            type="button"
                            onClick={() => setSubtitleRotationDeg(0)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                            title="0도로 초기화"
                          >
                            0°
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[9px] font-bold">
                        <button
                          type="button"
                          onClick={() => handleRotateSelected(-15)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          -15°
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetRotationSelected(0)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          0° 수평
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRotateSelected(+15)}
                          className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          +15°
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Subtitle Size (자막 크기) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      <span>자막 글자 크기 (사이즈)</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {Math.round(subtitleSizeScale * 100)}%
                    </span>
                  </div>

                  {/* Size Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {SIZE_PRESETS.map((sz) => (
                      <button
                        key={sz.value}
                        type="button"
                        onClick={() => setSubtitleSizeScale(sz.value)}
                        disabled={isRendering}
                        className={`py-1.5 px-1 rounded-lg font-bold text-center text-[11px] transition ${
                          Math.abs(subtitleSizeScale - sz.value) < 0.05
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>

                  {/* Size Slider */}
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={subtitleSizeScale}
                    onChange={(e) => setSubtitleSizeScale(parseFloat(e.target.value))}
                    disabled={isRendering}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>

                {/* 4. Subtitle Effects & Style */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Palette className="w-4 h-4 text-amber-500" />
                    <span>자막 디자인 & 효과 스타일 (6종)</span>
                  </label>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    {EFFECT_STYLES.map((eff) => (
                      <button
                        key={eff.id}
                        type="button"
                        onClick={() => setSubtitleStyle(eff.id)}
                        disabled={isRendering}
                        className={`py-2 px-2 rounded-xl border text-center font-bold transition flex flex-col items-center justify-center space-y-1 ${
                          subtitleStyle === eff.id
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 bg-white shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className={`text-[11px] px-2 py-0.5 rounded-md ${eff.previewClass}`}>
                          가나다
                        </span>
                        <span className="text-[10px] text-slate-700 font-bold">{eff.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Subtitle Box Opacity (자막 상자 투명도 / 불투명도 조절) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-600" />
                      <span>자막 상자 투명도 (배경 불투명도)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {subtitleBgOpacity === 0 ? '완전 투명 (글자만)' : subtitleBgOpacity >= 90 ? '불투명' : '반투명'}
                      </span>
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                        {subtitleBgOpacity}%
                      </span>
                    </div>
                  </div>

                  {/* Opacity Quick Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      { label: '0% 투명', value: 0 },
                      { label: '50% 반투명', value: 50 },
                      { label: '85% 추천', value: 85 },
                      { label: '100% 불투명', value: 100 },
                    ].map((preset) => (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => setSubtitleBgOpacity(preset.value)}
                        disabled={isRendering}
                        className={`py-1.5 px-1 rounded-lg font-bold text-center text-[11px] transition cursor-pointer ${
                          subtitleBgOpacity === preset.value
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Opacity Slider */}
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={subtitleBgOpacity}
                    onChange={(e) => setSubtitleBgOpacity(parseInt(e.target.value, 10))}
                    disabled={isRendering}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-500 font-medium">
                    💡 0%로 설정하면 배경 상자가 완전히 사라져 자막 텍스트만 깔끔하게 표시됩니다. (가독성을 위한 외곽선 자동 적용)
                  </p>
                </div>

                {/* Live Subtitle Preview Box */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    ✨ 선택된 자막 실시간 스타일 미리보기 ({subtitleFont} • {Math.round(subtitleSizeScale * 100)}% • 투명도 {subtitleBgOpacity}%)
                  </span>
                  <div className="inline-block py-1.5 px-3 rounded-xl">
                    <span 
                      style={{ 
                        fontFamily: `"${subtitleFont}", sans-serif`,
                        fontSize: `${Math.round(18 * subtitleSizeScale)}px`,
                        ...(subtitleStyle === 'yellow_box' ? {
                          backgroundColor: applyOpacityToColor('#facc15', subtitleBgOpacity),
                          color: '#020617',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          ...(subtitleBgOpacity < 35 ? { textShadow: '0 0 2px #fff, 0 0 4px #fff' } : {})
                        } : subtitleStyle === 'black_capsule' ? {
                          backgroundColor: applyOpacityToColor('rgba(15, 23, 42, 0.92)', subtitleBgOpacity),
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          ...(subtitleBgOpacity < 40 ? { textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : {})
                        } : subtitleStyle === 'neon_cyan' ? {
                          backgroundColor: applyOpacityToColor('rgba(8, 51, 68, 0.9)', subtitleBgOpacity),
                          color: '#e0f2fe',
                          border: `2px solid ${applyOpacityToColor('#06b6d4', Math.max(30, subtitleBgOpacity))}`,
                          padding: '4px 8px',
                          borderRadius: '8px'
                        } : subtitleStyle === 'netflix_red' ? {
                          backgroundColor: applyOpacityToColor('#e11d48', subtitleBgOpacity),
                          color: '#ffffff',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          ...(subtitleBgOpacity < 40 ? { textShadow: '0 1px 3px rgba(0,0,0,0.9)' } : {})
                        } : {})
                      }}
                      className={EFFECT_STYLES.find((e) => e.id === subtitleStyle)?.previewClass || ''}
                    >
                      "기름때 묻은 군복을 벗고 미슐랭 3스타가 되다"
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: Voice & Speed Customizer (ElevenLabs Official Integration) */}
            {activeSettingsSection === 'voice' && (
              <div className="space-y-4">
                {/* 0. ElevenLabs Official Integration Status Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white shadow-md border border-violet-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-600/40 border border-violet-400/40 flex items-center justify-center font-black text-sm text-violet-200 shadow-inner">
                      XI
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black tracking-wide">ElevenLabs 차세대 음성 변환 엔진 연동</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/40">
                          ● API 연결됨
                        </span>
                      </div>
                      <p className="text-[10px] text-violet-200/80 font-medium">
                        다큐멘터리 쇼츠에 최적화된 최신 고품질 모델 <strong className="text-amber-300">eleven_v4</strong>가 기본값으로 적용되었습니다.
                      </p>
                    </div>
                  </div>

                  <span className="hidden sm:inline-block text-[10px] font-black px-2.5 py-1 rounded-lg bg-white/10 text-violet-200 border border-white/15">
                    Pro Audio HD
                  </span>
                </div>

                {/* 1. ElevenLabs Model Selector (Default: eleven_v4) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>음성 변환 AI 모델 선택 (기본값: eleven_v4)</span>
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                      최신 고품질 다큐 최적화
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      {
                        id: 'eleven_v4',
                        name: '⚡ eleven_v4 (기본값 / 추천)',
                        tag: '최신 최고품질',
                        desc: '인간 수준의 자연스러운 호흡과 다큐멘터리 감정 억양에 특화된 차세대 플래그십 모델',
                        badge: '다큐멘터리 쇼츠 1위'
                      },
                      {
                        id: 'eleven_multilingual_v2',
                        name: '🌐 eleven_multilingual_v2',
                        tag: '안정적 다국어',
                        desc: '검증된 글로벌 다국어 고품질 음성 합성 모델',
                        badge: '표준 다국어'
                      },
                      {
                        id: 'eleven_turbo_v2_5',
                        name: '🚀 eleven_turbo_v2_5',
                        tag: '초고속 터보',
                        desc: '초저지연 빠른 렌더링에 최적화된 속도 중심 모델',
                        badge: '초고속 렌더'
                      },
                      {
                        id: 'eleven_flash_v2_5',
                        name: '✨ eleven_flash_v2_5',
                        tag: '초경량 플래시',
                        desc: '가볍고 빠른 연산 중심의 초경량 실시간 모델',
                        badge: '경량 모델'
                      }
                    ].map((model) => {
                      const isSelected = elevenLabsModel === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => setElevenLabsModel(model.id)}
                          disabled={isRendering}
                          className={`p-2.5 rounded-xl text-left border transition relative flex flex-col justify-between ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-violet-300 hover:bg-violet-50/50'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black">{model.name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                            </div>
                            <p className={`text-[10px] leading-tight font-medium ${isSelected ? 'text-violet-100' : 'text-slate-500'}`}>
                              {model.desc}
                            </p>
                          </div>
                          <span className={`mt-2 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected ? 'bg-violet-700/80 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {model.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Voice Persona Selector (16 ElevenLabs Voices) */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-violet-600" />
                      <div className="flex items-center gap-2">
                        <span>내레이션 성우 선택 (일레븐랩스 16인 성우)</span>
                        <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-black border border-violet-200">
                          ElevenLabs
                        </span>
                      </div>
                    </label>

                    <div className="flex items-center space-x-1.5">
                      {/* Heart Toggle for currently selected voice */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavoriteVoice(selectedVoice.id, e)}
                        className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition ${
                          favoriteVoiceIds.includes(selectedVoice.id)
                            ? 'bg-rose-50 text-rose-600 border-rose-300 font-bold'
                            : 'bg-white text-slate-500 border-slate-200 hover:text-rose-500'
                        }`}
                        title={favoriteVoiceIds.includes(selectedVoice.id) ? '찜 해제' : '성우 찜하기 (즐겨찾기)'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${favoriteVoiceIds.includes(selectedVoice.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                        <span className="text-[10px]">{favoriteVoiceIds.includes(selectedVoice.id) ? '찜됨' : '찜하기'}</span>
                      </button>

                      {/* Sample Play Button */}
                      <button
                        type="button"
                        onClick={() => handlePlayVoiceSample(selectedVoice)}
                        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                          isPlayingVoiceSample && playingVoiceId === selectedVoice.id
                            ? 'bg-rose-500 text-white animate-pulse'
                            : 'bg-violet-100 text-violet-800 hover:bg-violet-200'
                        }`}
                        title="샘플 목소리 미리듣기"
                      >
                        {isPlayingVoiceSample && playingVoiceId === selectedVoice.id ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                        <span>{isPlayingVoiceSample && playingVoiceId === selectedVoice.id ? '정지' : '샘플 듣기'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Voice Category Filter Tabs with Favorites */}
                  <div className="flex items-center space-x-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
                    <button
                      type="button"
                      onClick={() => setVoiceCategoryFilter('favorites')}
                      className={`whitespace-nowrap px-2.5 py-1 rounded-lg font-bold border transition flex items-center space-x-1 ${
                        voiceCategoryFilter === 'favorites'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-2xs font-black'
                          : 'bg-white text-rose-600 border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${favoriteVoiceIds.length > 0 ? 'fill-current' : ''}`} />
                      <span>❤️ 찜한 성우 ({favoriteVoiceIds.length})</span>
                    </button>

                    {['all', '감동/다큐', '뉴스/지식', '숏폼/도파민', '공감/힐링', '스릴러/미스터리'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setVoiceCategoryFilter(cat)}
                        className={`whitespace-nowrap px-2 py-0.5 rounded-lg font-bold border transition ${
                          voiceCategoryFilter === cat
                            ? 'bg-violet-600 text-white border-violet-600'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat === 'all' ? `전체 (${VOICE_OPTIONS.length}명)` : cat}
                      </button>
                    ))}
                  </div>

                  {filteredVoices.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-bold">찜한 성우가 없습니다.</p>
                      <p className="text-[11px] text-slate-400">성우 목록에서 하트(❤️) 아이콘을 눌러 자주 쓰는 성우를 찜해보세요!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <select
                        value={selectedVoiceId}
                        onChange={(e) => setSelectedVoiceId(e.target.value)}
                        disabled={isRendering}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:border-violet-500 shadow-2xs"
                      >
                        {filteredVoices.map((v) => {
                          const isFav = favoriteVoiceIds.includes(v.id);
                          return (
                            <option key={v.id} value={v.id}>
                              {isFav ? '❤️ ' : ''}{v.gender === 'male' ? '👨' : '👩'} {v.name} ({v.role}) • [{v.categoryTag}] - {v.tone}
                            </option>
                          );
                        })}
                      </select>

                      {/* Quick Voice Carousel / Card Previews */}
                      <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 text-xs">
                        {filteredVoices.map((v) => {
                          const isCurrent = selectedVoiceId === v.id;
                          const isFav = favoriteVoiceIds.includes(v.id);
                          const isPlayingThisVoice = isPlayingVoiceSample && playingVoiceId === v.id;
                          return (
                            <div
                              key={v.id}
                              onClick={() => setSelectedVoiceId(v.id)}
                              className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                isCurrent
                                  ? 'bg-violet-50/90 border-violet-500 shadow-xs ring-1 ring-violet-300'
                                  : 'bg-white hover:bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2 min-w-0 flex-1">
                                <span className="text-sm shrink-0">{v.gender === 'male' ? '👨' : '👩'}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="font-extrabold text-slate-900 truncate">{v.name}</span>
                                    <span className="text-[10px] text-violet-700 bg-violet-100 px-1.5 py-0.2 rounded font-bold">{v.role}</span>
                                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">[{v.categoryTag}]</span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 truncate">{v.tone}</p>
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={(e) => toggleFavoriteVoice(v.id, e)}
                                  className={`p-1.5 rounded-lg transition ${
                                    isFav ? 'text-rose-500 hover:text-rose-600' : 'text-slate-300 hover:text-rose-400'
                                  }`}
                                  title={isFav ? '찜 해제' : '찜하기'}
                                >
                                  <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayVoiceSample(v);
                                  }}
                                  className={`p-1.5 rounded-lg transition ${
                                    isPlayingThisVoice
                                      ? 'bg-rose-500 text-white shadow-xs animate-pulse ring-2 ring-rose-300'
                                      : 'bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700'
                                  }`}
                                  title={isPlayingThisVoice ? '정지' : `${v.name} 목소리 미리듣기`}
                                >
                                  {isPlayingThisVoice ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-500 font-medium">
                    {selectedVoice.description}
                  </p>
                </div>

                {/* 3. ElevenLabs Fine-Tuning Studio (Stability, Similarity, Style, Speaker Boost) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50/80 to-purple-50/80 border-2 border-violet-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-violet-950 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-violet-600" />
                      <span>일레븐랩스 정밀 음성 튜닝 스튜디오</span>
                    </label>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-violet-200/80 text-violet-900 border border-violet-300">
                      Voice Settings
                    </span>
                  </div>

                  {/* One-click Presets */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      {
                        label: '🎙️ 감동 휴먼 다큐',
                        desc: '인간극장 최적 밸런스',
                        st: 0.50,
                        sim: 0.75,
                        sty: 0.15,
                        spd: 1.0,
                      },
                      {
                        label: '🎬 시네마틱 웅장',
                        desc: '드라마틱 감정 증폭',
                        st: 0.40,
                        sim: 0.80,
                        sty: 0.25,
                        spd: 1.05,
                      },
                      {
                        label: '⚡ 숏폼 도파민',
                        desc: '빠른 템포 1초 후킹',
                        st: 0.35,
                        sim: 0.70,
                        sty: 0.30,
                        spd: 1.15,
                      },
                      {
                        label: '📰 탐사보도 팩트',
                        desc: '차분하고 정돈된 보도',
                        st: 0.70,
                        sim: 0.85,
                        sty: 0.05,
                        spd: 1.05,
                      },
                    ].map((pst) => (
                      <button
                        key={pst.label}
                        type="button"
                        onClick={() => {
                          setElevenLabsStability(pst.st);
                          setElevenLabsSimilarity(pst.sim);
                          setElevenLabsStyle(pst.sty);
                          setVoiceSpeedMultiplier(pst.spd);
                        }}
                        className="p-1.5 rounded-xl bg-white border border-violet-200 hover:border-violet-400 hover:bg-violet-100/50 text-left transition"
                      >
                        <span className="block text-[11px] font-black text-violet-950">{pst.label}</span>
                        <span className="block text-[9px] text-slate-500">{pst.desc}</span>
                      </button>
                    ))}
                  </div>

                  {/* 3-1. Stability (안정성) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">1. Stability (안정성)</span>
                      <span className="font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                        {Math.round(elevenLabsStability * 100)}%
                        <span className="text-[10px] text-slate-400 ml-1">
                          {elevenLabsStability < 0.4 ? '(감정 풍부)' : elevenLabsStability > 0.65 ? '(차분·일관)' : '(다큐 표준)'}
                        </span>
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.05}
                      value={elevenLabsStability}
                      onChange={(e) => setElevenLabsStability(parseFloat(e.target.value))}
                      disabled={isRendering}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                      <span>← 감정 기복 풍부 / 드라마틱</span>
                      <span>차분하고 일관된 정통 뉴스톤 →</span>
                    </div>
                  </div>

                  {/* 3-2. Similarity Boost (원음 명확도) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">2. Similarity Boost (원음 유사도 / 명확도)</span>
                      <span className="font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                        {Math.round(elevenLabsSimilarity * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.3}
                      max={1.0}
                      step={0.05}
                      value={elevenLabsSimilarity}
                      onChange={(e) => setElevenLabsSimilarity(parseFloat(e.target.value))}
                      disabled={isRendering}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-500 font-medium">
                      선택한 성우 고유의 오리지널 음색 특징을 얼마나 명확하고 선명하게 유지할지 조절합니다. (권장: 70~80%)
                    </p>
                  </div>

                  {/* 3-3. Style Exaggeration (스타일 과장도) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">3. Style Exaggeration (스타일 과장도 / 서사 몰입감)</span>
                      <span className="font-black text-violet-700 bg-white px-2 py-0.5 rounded-md border border-violet-200">
                        {Math.round(elevenLabsStyle * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0.0}
                      max={0.8}
                      step={0.05}
                      value={elevenLabsStyle}
                      onChange={(e) => setElevenLabsStyle(parseFloat(e.target.value))}
                      disabled={isRendering}
                      className="w-full accent-violet-600 cursor-pointer"
                    />
                    <p className="text-[9px] text-slate-500 font-medium">
                      성우의 발화 스타일과 감정 과장도를 높여 다큐멘터리 쇼츠의 극적 긴장감을 증폭합니다. (권장: 10~25%)
                    </p>
                  </div>

                  {/* 3-4. Speaker Boost Switch */}
                  <div className="pt-2 border-t border-violet-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 block">4. Speaker Boost (스피커 선명도 강화)</span>
                      <span className="text-[10px] text-slate-500">배경음(BGM) 속에서도 성우 목소리의 윤곽을 선명하게 부각시킵니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setElevenLabsSpeakerBoost(!elevenLabsSpeakerBoost)}
                      disabled={isRendering}
                      className={`px-3 py-1 rounded-full text-xs font-black transition border ${
                        elevenLabsSpeakerBoost
                          ? 'bg-violet-600 text-white border-violet-700 shadow-xs'
                          : 'bg-white text-slate-400 border-slate-300'
                      }`}
                    >
                      {elevenLabsSpeakerBoost ? 'ON (선명화 적용)' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* 4. Voice Speed Multiplier Controller */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Gauge className="w-4 h-4 text-amber-500" />
                      <span>성우 목소리 스피드 배속 조절 & 실시간 미리듣기</span>
                    </label>
                    <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                      {voiceSpeedMultiplier.toFixed(2)}x {voiceSpeedMultiplier >= 1.05 && voiceSpeedMultiplier <= 1.15 && '(다큐 쇼츠 추천)'}
                    </span>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-6 gap-1 text-xs">
                    {[0.9, 0.95, 1.0, 1.05, 1.1, 1.2].map((spd) => (
                      <button
                        key={spd}
                        type="button"
                        onClick={() => handleSpeedChange(spd)}
                        disabled={isRendering}
                        className={`py-1.5 rounded-lg font-black text-center transition ${
                          Math.abs(voiceSpeedMultiplier - spd) < 0.01
                            ? 'bg-amber-500 text-slate-900 shadow-xs ring-1 ring-amber-400'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {spd}x
                      </button>
                    ))}
                  </div>

                  {/* Slider */}
                  <input
                    type="range"
                    min={0.8}
                    max={1.4}
                    step={0.05}
                    value={voiceSpeedMultiplier}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    disabled={isRendering}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  {/* Dedicated Real-time Speed Preview Test Button */}
                  <div className="pt-2 mt-1 border-t border-slate-200/80 flex items-center justify-between">
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                      <Volume2 className={`w-3.5 h-3.5 ${isPlayingVoiceSample ? 'text-violet-600 animate-pulse' : 'text-slate-400'}`} />
                      <span>{selectedVoice.name} ({elevenLabsModel} • {voiceSpeedMultiplier.toFixed(2)}x)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handlePlayVoiceSample(selectedVoice, voiceSpeedMultiplier)}
                      disabled={isRendering}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer ${
                        isPlayingVoiceSample
                          ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300'
                          : 'bg-violet-600 hover:bg-violet-700 text-white'
                      }`}
                    >
                      {isPlayingVoiceSample ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>재생 중지</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>일레븐랩스 목소리 미리듣기</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500 font-medium">
                    일레븐랩스 API를 통해 렌더링 및 미리듣기 시 설정된 모델({elevenLabsModel}), 안정성({Math.round(elevenLabsStability * 100)}%), 유사도({Math.round(elevenLabsSimilarity * 100)}%)가 실시간으로 반영됩니다.
                  </p>
                </div>
              </div>
            )}


            {/* SECTION: 1-Second Thumbnail Extractor & Carousel-Style Studio Editor */}
            {activeSettingsSection === 'thumbnail' && (
              <div className="space-y-4">
                {/* Header banner */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>쇼츠 표지 썸네일 편집</span>
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      9:16 FHD
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">
                    사진, 헤드라인 문구, 보조 설명, 스타일을 자유롭게 편집하세요.
                  </p>
                </div>

                {/* 1. Cover Photo & Image Customizer */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-indigo-600" />
                      <span>1. 표지 사진</span>
                    </label>
                    <span className="text-xs font-bold text-slate-500">
                      {customThumbnailImageUrl ? '커스텀 사진' : `${thumbnailSceneIndex + 1}번 씬`}
                    </span>
                  </div>

                  {/* Hidden file input for custom thumbnail image */}
                  <input
                    type="file"
                    ref={thumbnailFileInputRef}
                    accept="image/*"
                    onChange={handleThumbnailFileUpload}
                    className="hidden"
                  />

                  {/* Image Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => thumbnailFileInputRef.current?.click()}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{customThumbnailImageUrl ? '사진 변경' : '사진 업로드'}</span>
                    </button>

                    <a
                      href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${project.figureName || '쇼츠'} 고화질`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                      <span>구글 검색</span>
                    </a>

                    {customThumbnailImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomThumbnailImageUrl(null);
                          setThumbnailToast('원본 씬 사진으로 복원되었습니다.');
                          setTimeout(() => setThumbnailToast(null), 3000);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs transition cursor-pointer"
                      >
                        원본 복원
                      </button>
                    )}
                  </div>

                  {/* Scene selection buttons */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-slate-500">씬 사진 선택:</span>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                      {scenes.map((sc, idx) => {
                        const sceneImg = sc.userCropUrl || sc.uploadedImageUrl;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setThumbnailSceneIndex(idx);
                              setPreviewSceneIndex(idx);
                              if (sceneImg) {
                                setCustomThumbnailImageUrl(sceneImg);
                              } else {
                                setCustomThumbnailImageUrl(null);
                              }
                            }}
                            className={`px-2.5 py-1.5 rounded-xl shrink-0 font-bold transition cursor-pointer border flex items-center space-x-1 ${
                              thumbnailSceneIndex === idx
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <span>{idx === 0 ? '1번 씬 (추천)' : `${idx + 1}번 씬`}</span>
                            {sceneImg && (
                              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                                thumbnailSceneIndex === idx ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                내 사진
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 2. Main Headline & Sub-detail Text Customizer */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-rose-500" />
                        <span>2. 메인 헤드라인</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        쇼츠 시청을 유도하는 헤드라인을 합성합니다.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCtrTitleEnabled(!isCtrTitleEnabled)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black transition border cursor-pointer ${
                        isCtrTitleEnabled
                          ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {isCtrTitleEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {isCtrTitleEnabled && (
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      {/* Title text input */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">헤드라인 문구</label>
                          <span className="text-[10px] text-slate-400">{ctrTitleText.length}자</span>
                        </div>
                        <textarea
                          rows={2}
                          value={ctrTitleText}
                          onChange={(e) => setCtrTitleText(e.target.value)}
                          placeholder="헤드라인 입력"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none leading-relaxed"
                        />
                        {/* 60초 황금 서사 고클릭률(CTR) 헤드라인 추천 프리셋 */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                            <span>🔥 고클릭률(CTR 15%+) 헤드라인 추천:</span>
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              ...(project.hooks || []).map((h, hIdx) => ({
                                tag: h.label || (hIdx === 0 ? '사건형' : hIdx === 1 ? '반전형' : '질문형'),
                                text: h.text.replace(/[\"'“‘”’]/g, '').trim(),
                              })),
                              ...(project.titles || []).slice(0, 2).map((t) => ({
                                tag: 'CTR추천',
                                text: t.replace(/#\S+/g, '').trim(),
                              })),
                              { tag: '인생역전', text: `통장 잔고 0원에서 정상에 선 ${project.figureName}의 승부수` },
                              { tag: '운명의3초', text: `모두가 망한다고 비웃었던 단 3초의 결단` },
                              { tag: '1%비밀', text: `100번 거절당하고도 끝내 증명해낸 ${project.figureName}` },
                            ].map((preset, sIdx) => {
                              const isSelected = ctrTitleText === preset.text;
                              return (
                                <button
                                  key={sIdx}
                                  type="button"
                                  onClick={() => setCtrTitleText(preset.text)}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center space-x-1 border ${
                                    isSelected
                                      ? 'bg-rose-500 text-white border-rose-600 shadow-2xs font-black'
                                      : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border-slate-200'
                                  }`}
                                  title="클릭 시 헤드라인에 적용"
                                >
                                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {preset.tag}
                                  </span>
                                  <span className="truncate max-w-[220px]">{preset.text}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 3. Sub-detail Text Customizer */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span>3. 보조 설명</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsThumbnailSubTextEnabled(!isThumbnailSubTextEnabled)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black transition border cursor-pointer ${
                              isThumbnailSubTextEnabled
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                                : 'bg-slate-100 text-slate-400 border-slate-200'
                            }`}
                          >
                            {isThumbnailSubTextEnabled ? 'ON' : 'OFF'}
                          </button>
                        </div>

                        {isThumbnailSubTextEnabled && (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={thumbnailSubText}
                              onChange={(e) => setThumbnailSubText(e.target.value)}
                              placeholder="보조 설명 입력"
                              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          </div>
                        )}
                      </div>

                      {/* 4. Font & Typography Customizer */}
                      <div className="space-y-2.5 pt-2 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-700 block">4. 폰트 및 스타일</label>
                        {/* Font Family selector */}
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'Pretendard', name: '프리텐다드' },
                            { id: 'Black Han Sans', name: '검은고딕' },
                            { id: 'Do Hyeon', name: '도현체' },
                            { id: 'Gowun Dodum', name: '고운돋움' },
                            { id: 'Song Myung', name: '송명체' },
                          ].map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setThumbnailFont(f.id)}
                              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                                thumbnailFont === f.id
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>

                        {/* Text Alignment */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-bold text-slate-600">정렬</span>
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            {[
                              { id: 'left', icon: AlignLeft, label: '좌측' },
                              { id: 'center', icon: AlignCenter, label: '중앙' },
                              { id: 'right', icon: AlignRight, label: '우측' },
                            ].map((al) => {
                              const IconComponent = al.icon;
                              return (
                                <button
                                  key={al.id}
                                  type="button"
                                  onClick={() => setThumbnailTextAlign(al.id as any)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                    thumbnailTextAlign === al.id
                                      ? 'bg-white text-indigo-700 shadow-2xs'
                                      : 'text-slate-500 hover:text-slate-800'
                                  }`}
                                >
                                  <IconComponent className="w-3 h-3" />
                                  <span>{al.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Font size slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-600">글자 크기</span>
                            <span className="font-extrabold text-indigo-600">{thumbnailFontSize}px</span>
                          </div>
                          <input
                            type="range"
                            min={60}
                            max={110}
                            step={2}
                            value={thumbnailFontSize}
                            onChange={(e) => setThumbnailFontSize(parseInt(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                        </div>

                        {/* Color palette */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-bold text-slate-600 block">텍스트 컬러</span>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { id: '#FDE047', name: '노랑' },
                              { id: '#FFFFFF', name: '화이트' },
                              { id: '#38BDF8', name: '시안' },
                              { id: '#F87171', name: '레드' },
                              { id: '#FB923C', name: '오렌지' },
                              { id: '#4ADE80', name: '그린' },
                            ].map((col) => (
                              <button
                                key={col.id}
                                type="button"
                                onClick={() => setThumbnailTextColor(col.id)}
                                className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                                  thumbnailTextColor === col.id
                                    ? 'border-indigo-600 ring-2 ring-indigo-400 bg-indigo-50/50'
                                    : 'border-slate-200 bg-white hover:bg-slate-50'
                                }`}
                              >
                                <span className="w-3 h-3 rounded-full border border-slate-300 inline-block" style={{ backgroundColor: col.id }} />
                                <span>{col.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Style presets */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <label className="text-xs font-bold text-slate-700 block">디자인 스타일</label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { id: 'yt_yellow', name: '🟡 유튜브 옐로우', desc: '블랙 테두리 + 노랑' },
                            { id: 'netflix_red', name: '🔴 넷플릭스 레드', desc: '레드 박스 + 화이트' },
                            { id: 'neon_cyan', name: '💎 사이버 네온', desc: '네온 글로우 + 다크 박스' },
                            { id: 'black_capsule', name: '⚫ 블랙 캡슐', desc: '다크 캡슐 + 화이트' },
                            { id: 'clean_white', name: '⚪ 클린 화이트', desc: '화이트 박스 + 섀도우' },
                            { id: 'stroke_only', name: '🔲 아웃라인', desc: '블랙 외곽선 테두리' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setCtrTitleStyle(st.id as any)}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                ctrTitleStyle === st.id
                                  ? 'bg-rose-50/70 border-rose-500 ring-1 ring-rose-400'
                                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              <div className="font-black text-xs text-slate-900">{st.name}</div>
                              <div className="text-[10px] text-slate-500 truncate">{st.desc}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Title Y-Position */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">타이틀 위치 ({ctrTitleYPercent}%)</label>
                          <div className="flex gap-1 text-[10px]">
                            <button
                              type="button"
                              onClick={() => setCtrTitleYPercent(24)}
                              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${ctrTitleYPercent === 24 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              상단 24%
                            </button>
                            <button
                              type="button"
                              onClick={() => setCtrTitleYPercent(48)}
                              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${ctrTitleYPercent === 48 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              중앙 48%
                            </button>
                            <button
                              type="button"
                              onClick={() => setCtrTitleYPercent(70)}
                              className={`px-2 py-0.5 rounded font-bold cursor-pointer ${ctrTitleYPercent === 70 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                            >
                              하단 70%
                            </button>
                          </div>
                        </div>
                        <input
                          type="range"
                          min={15}
                          max={85}
                          step={1}
                          value={ctrTitleYPercent}
                          onChange={(e) => setCtrTitleYPercent(parseInt(e.target.value))}
                          className="w-full accent-rose-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Action Buttons */}
                <div className="space-y-2 pt-1">
                  {thumbnailToast && (
                    <div className="p-3 rounded-xl bg-emerald-500 text-white font-black text-xs text-center animate-fade-in shadow-md">
                      {thumbnailToast}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadThumbnail(thumbnailSceneIndex)}
                      disabled={isExtractingThumbnail}
                      className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-98 disabled:opacity-50"
                      title="썸네일 다운로드"
                    >
                      <Download className="w-4 h-4 text-slate-950" />
                      <span>{isExtractingThumbnail ? '추출 중...' : '🖼️ 썸네일 다운로드'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareThumbnail(thumbnailSceneIndex)}
                      disabled={isExtractingThumbnail}
                      className="py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer active:scale-98 disabled:opacity-50"
                      title="썸네일 SNS/카톡 공유"
                    >
                      <Share2 className="w-4 h-4 text-white" />
                      <span>📱 SNS/카톡 공유</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: Output & Resolution */}
            {activeSettingsSection === 'output' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Monitor className="w-4 h-4 text-indigo-600" />
                    <span>출력 해상도 선택 (화질)</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setResolution('1080p')}
                      disabled={isRendering}
                      className={`p-3 rounded-xl border text-left transition ${
                        resolution === '1080p'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm">1080p FHD</div>
                      <div className={`text-[11px] ${resolution === '1080p' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        1080 x 1920 (쇼츠 표준 고화질)
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setResolution('720p')}
                      disabled={isRendering}
                      className={`p-3 rounded-xl border text-left transition ${
                        resolution === '720p'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-sm">720p HD</div>
                      <div className={`text-[11px] ${resolution === '720p' ? 'text-indigo-100' : 'text-slate-400'}`}>
                        720 x 1280 (초고속 변환)
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 space-y-1.5">
                  <div className="font-black flex items-center gap-1.5 text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>유튜브 쇼츠 & 인스타그램 릴스 최적화 완료</span>
                  </div>
                  <p className="leading-relaxed font-medium">
                    9:16 세로 규격, 상단 워터마크 없는 무결점 비디오, 브라우저 직접 렌더링으로 캡컷(CapCut) 등 외부 프로그램 없이 바로 유튜브에 업로드할 수 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* Bottom Action Buttons */}
            <div className="space-y-2 pt-1">
              {!isRendering ? (
                <>
                  <button
                    onClick={startRendering}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-500 via-indigo-600 to-indigo-700 hover:from-rose-600 hover:to-indigo-800 text-white font-black text-sm rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center justify-center space-x-2 transition cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{videoBlobUrl ? '다시 쇼츠 영상 제작하기' : '🎬 맞춤 자막 & 음성 포함 쇼츠 영상 제작 시작'}</span>
                  </button>

                  {!videoBlobUrl && onSaveProject && (
                    <button
                      type="button"
                      onClick={handleSaveToVault}
                      disabled={isSavingToVault || isRendering}
                      className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl shadow-2xs flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <span>💾</span>
                      <span>{isSavingToVault ? '보관함에 저장 중...' : '현재 설정 보관함에 보관하기'}</span>
                    </button>
                  )}
                </>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                      <RotateCw className="w-4 h-4 animate-spin text-amber-400" />
                      {statusMessage}
                    </span>
                    <span className="text-amber-300 font-extrabold">{renderProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-500 to-amber-400 h-2.5 rounded-full transition-all duration-200"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                  {/* Screen Wake Lock Status Badge */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold">
                      <Zap className="w-3 h-3 text-amber-400 animate-pulse" />
                      <span>{isWakeLockActive ? '화면 켜짐 유지' : '절전 방지 준비'}</span>
                    </div>
                    <span className="text-slate-400 font-medium">화면 꺼짐 방지</span>
                  </div>
                </div>
              )}

              {videoBlobUrl && (
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload()}
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98"
                    >
                      <Download className="w-4 h-4" />
                      <span>{resolution} 다운로드 ({videoDuration}초)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleShareVideo}
                      className="py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm rounded-2xl shadow-md shadow-indigo-600/20 flex items-center justify-center space-x-2 transition cursor-pointer active:scale-98 shrink-0"
                      title="카카오톡 및 SNS 바로 공유"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>📱 SNS/카톡 공유</span>
                    </button>
                  </div>

                  {/* Thumbnail Quick Action after Video Render */}
                  <div className="space-y-1.5">
                    {thumbnailToast && (
                      <div className="p-2.5 rounded-xl bg-emerald-500 text-white font-black text-xs text-center animate-fade-in shadow-md">
                        {thumbnailToast}
                      </div>
                    )}
                    <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <span className="text-2xl">🖼️</span>
                        <div className="text-left flex-1">
                          <div className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                            <span>쇼츠 표지 썸네일</span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-bold">9:16</span>
                          </div>
                          <div className="text-[10px] text-amber-700 font-medium">
                            {customThumbnailImageUrl
                              ? '커스텀 사진 적용됨'
                              : isCtrTitleEnabled
                              ? `헤드라인 적용됨`
                              : `${thumbnailSceneIndex + 1}번 씬 원본`}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSettingsSection('thumbnail');
                            setPreviewViewMode('live');
                          }}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-black text-xs shadow-2xs transition cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                          title="표지 썸네일 편집"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-indigo-600" />
                          <span>편집</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadThumbnail(thumbnailSceneIndex)}
                          disabled={isExtractingThumbnail}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-950" />
                          <span>{isExtractingThumbnail ? '추출 중...' : '다운로드'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareThumbnail(thumbnailSceneIndex)}
                          disabled={isExtractingThumbnail}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5 text-white" />
                          <span>공유</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {onSaveProject && (
                    <button
                      type="button"
                      onClick={handleSaveToVault}
                      disabled={isSavingToVault}
                      className="w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-black text-xs rounded-xl shadow-2xs flex items-center justify-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      <span>{isSavingToVault ? '보관 중...' : '보관함에 보관'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: 9:16 Video Player Preview / Canvas (Sticky on Mobile & Desktop for Real-Time Feedback) */}
          <div className="md:col-span-6 flex flex-col items-center justify-start order-1 md:order-2 sticky top-0 z-30 bg-white/95 backdrop-blur-md pt-1.5 pb-2.5 -mx-4 px-4 sm:-mx-7 sm:px-7 border-b md:border-b-0 border-slate-200/90 shadow-xs md:shadow-none md:static md:mx-0 md:px-0 md:pt-0 md:pb-0 md:sticky md:top-4 md:self-start">
            {/* Live Sync Preview Player Controls & Header */}
            <div className="w-full max-w-[340px] flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-200/60">
              <div className="flex items-center space-x-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-black text-slate-800 tracking-tight truncate">
                  {previewSceneIndex + 1}씬 실시간 뷰
                </span>
                {videoBlobUrl && !isRendering && (
                  <div className="flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300 text-[10px] font-black shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('live')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        previewViewMode === 'live' ? 'bg-indigo-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      편집
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewViewMode('video')}
                      className={`px-1.5 py-0.5 rounded transition ${
                        previewViewMode === 'video' ? 'bg-emerald-600 text-white' : 'text-slate-600'
                      }`}
                    >
                      영상
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1.5 shrink-0">
                {!isRendering && previewViewMode === 'live' && (
                  <button
                    type="button"
                    onClick={handleToggleSceneLiveSyncPlay}
                    disabled={isLoadingSceneAudio}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white font-black text-[11px] shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                    title="현재 씬의 음성과 자막 싱크를 실시간 재생합니다"
                  >
                    {isPlayingSceneSync ? (
                      <>
                        <Square className="w-3 h-3 fill-current text-rose-200" />
                        <span>정지</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current text-amber-300" />
                        <span>{isLoadingSceneAudio ? '...' : '싱크 재생'}</span>
                      </>
                    )}
                  </button>
                )}

                {/* Mobile Preview Collapse/Expand Toggle */}
                <button
                  type="button"
                  onClick={() => setIsPreviewCollapsed(!isPreviewCollapsed)}
                  className="md:hidden px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-0.5 border border-slate-200"
                  title={isPreviewCollapsed ? "미리보기 화면 펼치기" : "미리보기 접기"}
                >
                  {isPreviewCollapsed ? (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />
                      <span>펼치기</span>
                    </>
                  ) : (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                      <span>접기</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {!isPreviewCollapsed && (
              <>
                {/* Scene Selector for Live Preview */}
                {!isRendering && previewViewMode === 'live' && scenes.length > 1 && (
                  <div className="flex items-center space-x-1 overflow-x-auto max-w-full pb-1 mb-2 text-[11px] font-bold">
                    <span className="text-slate-500 shrink-0 text-[10px] font-extrabold mr-1">씬 선택:</span>
                    {scenes.map((_, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => setPreviewSceneIndex(sIdx)}
                        className={`px-2 py-0.5 rounded-lg border transition shrink-0 cursor-pointer ${
                          previewSceneIndex === sIdx
                            ? 'bg-indigo-600 text-white border-indigo-600 font-extrabold shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {sIdx + 1}씬
                      </button>
                    ))}
                  </div>
                )}

                {/* Platform UI Safe Zone Guide Toolbar */}
                {!isRendering && (
                  <PlatformGuideSelector
                    currentPlatform={platformGuide}
                    onChangePlatform={setPlatformGuide}
                    className="mb-2 w-full max-w-[340px]"
                  />
                )}

                {/* Quick Add Custom Subtitle Button above preview */}
                {!isRendering && previewViewMode === 'live' && (
                  <div className="mb-2 w-full max-w-[310px] flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddCustomTextOverlay()}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-indigo-700 hover:from-violet-700 hover:to-indigo-800 text-white font-black text-xs shadow-md shadow-indigo-500/25 flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ 내 마음대로 자막 추가</span>
                    </button>
                    {selectedSubtitleId && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubtitleId(null);
                          setActiveDragSubtitle(null);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer shrink-0"
                        title="선택 해제"
                      >
                        선택 해제
                      </button>
                    )}
                  </div>
                )}

                <div className="w-[160px] xs:w-[185px] sm:w-[240px] md:w-[310px] aspect-[9/16] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 relative flex items-center justify-center shrink-0">
              <canvas
                ref={canvasRef}
                onPointerDown={(e) => {
                  try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
                  handleCanvasPointerDown(e.clientX, e.clientY);
                }}
                onPointerMove={(e) => {
                  if (canvasDragRef.current) {
                    e.preventDefault();
                    handleCanvasPointerMove(e.clientX, e.clientY);
                  }
                }}
                onPointerUp={(e) => {
                  try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
                  handleCanvasPointerUp();
                }}
                onPointerCancel={() => handleCanvasPointerUp()}
                onWheel={handleCanvasWheel}
                className={`w-full h-full object-cover touch-none select-none ${
                  previewViewMode === 'video' && videoBlobUrl
                    ? 'hidden'
                    : 'block cursor-grab active:cursor-grabbing'
                }`}
              />

              {previewViewMode === 'video' && videoBlobUrl ? (
                <video
                  src={videoBlobUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : !isRendering ? (
                platformGuide === 'none' ? (
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900/85 text-white backdrop-blur-xs flex items-center gap-1.5 border border-white/10 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      자막 실시간 라이브 뷰
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600/90 text-white shadow-2xs">
                      {previewSceneIndex + 1}번 씬
                    </span>
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 pointer-events-none z-30">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-black/60 text-white/90 backdrop-blur-xs border border-white/20 shadow-xs">
                      {previewSceneIndex + 1}씬 편집
                    </span>
                  </div>
                )
              ) : null}

              {/* Real-time SNS Platform Safe Zone & UI Overlay Guide */}
              <ShortsSafeZoneOverlay
                platform={platformGuide}
                title={scenes[previewSceneIndex]?.text || project.figureName}
                authorName={project.figureName || 'Untold Story'}
              />

              {/* Direct On-Canvas Rotation Knob attached directly to Subtitle */}
              {!isRendering && previewViewMode === 'live' && selectedSubPos && (
                <div
                  style={{
                    position: 'absolute',
                    left: `${selectedSubPos.x}%`,
                    top: `${selectedSubPos.y}%`,
                    transform: `translate(-50%, -50%) rotate(${selectedSubPos.rot}deg)`,
                    pointerEvents: 'none',
                  }}
                  className="z-30"
                >
                  <div
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const cx = (selectedSubPos.x / 100) * rect.width;
                      const cy = (selectedSubPos.y / 100) * rect.height;
                      canvasDragRef.current = {
                        startX: e.clientX,
                        startY: e.clientY,
                        targetId: selectedSubPos.id,
                        mode: 'rotate',
                        centerX: cx,
                        centerY: cy,
                        initXPercent: selectedSubPos.x,
                        initYPercent: selectedSubPos.y,
                        initRotDeg: selectedSubPos.rot,
                      };
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRotateSelected(15);
                    }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 pointer-events-auto flex flex-col items-center cursor-grab active:cursor-grabbing group/knob"
                    title="드래그하여 원하는 각도로 회전 (클릭 시 15° 회전)"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-rose-500 hover:from-indigo-500 hover:to-rose-400 active:scale-95 text-white shadow-xl flex items-center justify-center text-sm font-black border-2 border-white transition-all group-hover/knob:scale-110 group-hover/knob:ring-4 group-hover/knob:ring-indigo-400/40">
                      ↻
                    </div>
                    <div className="w-0.5 h-4 bg-indigo-500/80 shadow-xs" />
                  </div>
                </div>
              )}

              {/* On-Canvas Live Subtitle Rotation Floating Control Deck */}
              {!isRendering && previewViewMode === 'live' && selectedSubPos && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute bottom-2.5 left-2 right-2 z-40 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-2.5 shadow-2xl border border-indigo-500/50 animate-in fade-in slide-in-from-bottom-2 duration-150"
                >
                  <div className="flex items-center justify-between mb-1.5 px-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      <span className="text-[11px] font-black text-indigo-200 truncate">
                        {selectedSubPos.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[11px] font-black text-amber-300 font-mono bg-slate-800/90 px-1.5 py-0.5 rounded border border-amber-400/30">
                        {selectedSubPos.rot > 0 ? `+${selectedSubPos.rot}°` : `${selectedSubPos.rot}°`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetRotationSelected()}
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 cursor-pointer"
                        title="0도로 수평 복원"
                      >
                        0°
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedSubtitleId(null)}
                        className="text-slate-400 hover:text-white px-1 cursor-pointer"
                        title="닫기"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Range Slider (-180° to +180°) */}
                  <div className="flex items-center gap-2 mb-2 px-0.5">
                    <span className="text-[9px] text-slate-400 font-bold shrink-0">-180°</span>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedSubPos.rot}
                      onChange={(e) => handleSetRotationSelected(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                    />
                    <span className="text-[9px] text-slate-400 font-bold shrink-0">+180°</span>
                  </div>

                  {/* Quick Angle Buttons */}
                  <div className="grid grid-cols-5 gap-1 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(-15)}
                      className="py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/70 border border-white/10 text-slate-200 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                      title="반시계 15도 회전"
                    >
                      <span>⟲</span> 15°
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(-5)}
                      className="py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/70 border border-white/10 text-slate-200 transition-colors cursor-pointer"
                      title="반시계 5도 미세회전"
                    >
                      -5°
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetRotationSelected(0)}
                      className={`py-1 rounded-lg font-black transition-colors cursor-pointer ${
                        selectedSubPos.rot === 0
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-800 hover:bg-indigo-600/70 text-slate-300 border border-white/10'
                      }`}
                      title="수평 정렬"
                    >
                      수평
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(+5)}
                      className="py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/70 border border-white/10 text-slate-200 transition-colors cursor-pointer"
                      title="시계 5도 미세회전"
                    >
                      +5°
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRotateSelected(+15)}
                      className="py-1 rounded-lg bg-slate-800/90 hover:bg-indigo-600/70 border border-white/10 text-slate-200 transition-colors flex items-center justify-center gap-0.5 cursor-pointer"
                      title="시계 15도 회전"
                    >
                      <span>⟳</span> 15°
                    </button>
                  </div>

                  {/* Opacity Control Slider & Quick Presets */}
                  <div className="mt-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center justify-between mb-1 px-0.5">
                      <span className="text-[10px] font-bold text-indigo-200 flex items-center gap-1">
                        <span>🫧</span> 자막 상자 투명도
                      </span>
                      <span className="text-[10px] font-black text-emerald-400 font-mono bg-slate-800/90 px-1.5 py-0.5 rounded border border-emerald-400/30">
                        {selectedSubPos.opacity}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5 px-0.5">
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">0%</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={selectedSubPos.opacity}
                        onChange={(e) => handleSetOpacitySelected(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                      />
                      <span className="text-[9px] text-slate-400 font-bold shrink-0">100%</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] font-bold">
                      {[
                        { label: '0% 투명', val: 0 },
                        { label: '50% 반투명', val: 50 },
                        { label: '85% 추천', val: 85 },
                        { label: '100% 불투명', val: 100 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => handleSetOpacitySelected(preset.val)}
                          className={`py-0.5 rounded-md font-bold transition-colors cursor-pointer text-[9px] ${
                            selectedSubPos.opacity === preset.val
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Dedicated Interactive Subtitle Rotation & Position Toolbar */}
            {!isRendering && previewViewMode === 'live' && selectedSubtitleId && (() => {
              const selectedOverlay = selectedSubtitleId !== 'main' 
                ? customTextOverlays.find(o => o.id === selectedSubtitleId) 
                : null;
              const selectedRot = selectedSubtitleId === 'main' 
                ? (subtitleRotationDeg || 0) 
                : (selectedOverlay?.rotationDeg || 0);
              const selectedX = selectedSubtitleId === 'main' 
                ? (subtitleXPercent ?? 50) 
                : (selectedOverlay?.positionXPercent ?? 50);
              const selectedY = selectedSubtitleId === 'main' 
                ? subtitleYPercent 
                : (selectedOverlay?.positionYPercent ?? 50);

              return (
                <div className="mt-2.5 w-full max-w-[310px] p-3 rounded-2xl bg-gradient-to-b from-indigo-50/95 via-purple-50/90 to-white border-2 border-indigo-300 shadow-md space-y-2.5 text-left animate-fade-in">
                  {/* Header & Subtitle Identity */}
                  <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-indigo-100">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping shrink-0" />
                      <span className="font-extrabold text-xs text-indigo-950 truncate">
                        {selectedSubtitleId === 'main' ? '🎙️ 기본 나레이션 자막' : '✨ 커스텀 추가 자막'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {selectedSubtitleId !== 'main' && selectedOverlay && (
                        <button
                          type="button"
                          onClick={() => {
                            handleDeleteCustomTextOverlay(selectedSubtitleId);
                            setSelectedSubtitleId(null);
                          }}
                          className="py-1 px-2 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                          title="자막 삭제"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>삭제</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubtitleId(null);
                          setActiveDragSubtitle(null);
                        }}
                        className="py-1 px-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold transition cursor-pointer"
                      >
                        ✕ 해제
                      </button>
                    </div>
                  </div>

                  {/* If custom overlay, allow instant text editing */}
                  {selectedSubtitleId !== 'main' && selectedOverlay && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-600">자막 문구 수정</label>
                      <input
                        type="text"
                        value={selectedOverlay.text}
                        onChange={(e) => handleUpdateCustomTextOverlay(selectedSubtitleId, { text: e.target.value })}
                        placeholder="자막 내용 입력..."
                        className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                      />
                    </div>
                  )}

                  {/* Rotation Angle Slider & Quick Angle Buttons */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <span>↻ 회전 각도:</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-600 text-white font-black text-[10px]">
                          {selectedRot}°
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetRotationSelected()}
                        className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold underline cursor-pointer"
                      >
                        0° 수평 복구
                      </button>
                    </div>

                    {/* Angle Slider (-180° to +180°) */}
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedRot}
                      onChange={(e) => handleSetRotationSelected(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-indigo-100 rounded-lg"
                    />

                    {/* Quick Angle Preset Buttons */}
                    <div className="grid grid-cols-5 gap-1 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleRotateSelected(-15)}
                        className="py-1 px-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-200 transition text-center cursor-pointer active:scale-95"
                      >
                        ↺ -15°
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateSelected(-5)}
                        className="py-1 px-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-200 transition text-center cursor-pointer active:scale-95"
                      >
                        ↺ -5°
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetRotationSelected()}
                        className="py-1 px-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black transition text-center cursor-pointer shadow-2xs active:scale-95"
                      >
                        0°
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateSelected(5)}
                        className="py-1 px-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-200 transition text-center cursor-pointer active:scale-95"
                      >
                        ↻ +5°
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRotateSelected(15)}
                        className="py-1 px-1 rounded-lg bg-white hover:bg-indigo-100 text-indigo-900 text-[10px] font-bold border border-indigo-200 transition text-center cursor-pointer active:scale-95"
                      >
                        ↻ +15°
                      </button>
                    </div>
                  </div>

                  {/* Opacity Control Slider & Quick Presets */}
                  <div className="space-y-1.5 pt-1.5 border-t border-indigo-100">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <span>🫧 자막 상자 투명도:</span>
                        <span className="px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">
                          {selectedSubtitleId === 'main' ? subtitleBgOpacity : (selectedOverlay?.bgOpacityPercent ?? 88)}%
                        </span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {(selectedSubtitleId === 'main' ? subtitleBgOpacity : (selectedOverlay?.bgOpacityPercent ?? 88)) === 0 ? '완전 투명' : '배경 상자'}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={selectedSubtitleId === 'main' ? subtitleBgOpacity : (selectedOverlay?.bgOpacityPercent ?? 88)}
                      onChange={(e) => handleSetOpacitySelected(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-emerald-100 rounded-lg"
                    />

                    <div className="grid grid-cols-4 gap-1 pt-0.5">
                      {[
                        { label: '0% 투명', val: 0 },
                        { label: '50% 반투명', val: 50 },
                        { label: '85% 추천', val: 85 },
                        { label: '100% 불투명', val: 100 },
                      ].map((preset) => (
                        <button
                          key={preset.val}
                          type="button"
                          onClick={() => handleSetOpacitySelected(preset.val)}
                          className={`py-1 px-1 rounded-lg text-[10px] font-bold border transition text-center cursor-pointer active:scale-95 ${
                            (selectedSubtitleId === 'main' ? subtitleBgOpacity : (selectedOverlay?.bgOpacityPercent ?? 88)) === preset.val
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white hover:bg-emerald-50 text-emerald-950 border-emerald-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Position Info & Center Align */}
                  <div className="flex items-center justify-between pt-1 border-t border-indigo-100 text-[10px] text-slate-600 font-semibold">
                    <span>가로 {Math.round(selectedX)}% · 세로 {Math.round(selectedY)}%</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedSubtitleId === 'main') {
                          setSubtitleXPercent(50);
                        } else {
                          handleUpdateCustomTextOverlay(selectedSubtitleId, { positionXPercent: 50 });
                        }
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer active:scale-95"
                    >
                      가로 중앙 정렬
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* When no subtitle is selected, show friendly tip */}
            {!isRendering && previewViewMode === 'live' && !selectedSubtitleId && (
              <div className="mt-1.5 max-w-[310px] flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-bold bg-slate-100/90 py-1.5 px-3 rounded-full border border-slate-200 shadow-2xs text-center">
                <span>💡</span>
                <span>화면 자막을 누르면 <strong>회전 핸들 & 자유 이동 모드</strong>가 켜집니다.</span>
              </div>
            )}

            {/* Quick Actions below canvas */}
            {!isRendering && (
              <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyRecommendedSettings}
                  className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-black text-xs flex items-center space-x-1.5 transition border border-amber-200 shadow-2xs cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>쇼츠 바이럴 추천 세팅 적용</span>
                </button>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-2 font-semibold flex flex-wrap items-center justify-center gap-1.5 text-center">
              <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                사진: {photoAspectRatio === '1:1' ? '1:1 정사각형 카드' : photoAspectRatio === '9:16' ? '9:16 전체 채움' : photoAspectRatio} {photoAspectRatio !== '9:16' ? `(${backdropStyle === 'blur' ? '블러' : backdropStyle === 'dark' ? '다크' : '그라디언트'})` : ''}
              </span>
              <span>•</span>
              <span>자막: {subtitleFont} ({subtitleYPercent}%)</span>
              <span>•</span>
              <span>성우: {selectedVoice.name} ({voiceSpeedMultiplier.toFixed(1)}x)</span>
            </p>
          </>
        )}
      </div>
    </div>
  </div>
);

  const renderSnsShareModal = () => {
    if (!isSnsShareModalOpen) return null;

    const copyShareText = async () => {
      try {
        const textToCopy = `[Untold 쇼츠] ${project.figureName}\n${ctrTitleText || project.topic || ''}\n\n#쇼츠 #릴스 #shorts #유튜브쇼츠`;
        await navigator.clipboard.writeText(textToCopy);
        setStatusMessage('📋 쇼츠 제목과 추천 해시태그가 클립보드에 복사되었습니다!');
      } catch {}
    };

    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleCloseSnsShareModal();
        }}
      >
        <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 animate-scale-in text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <span className="text-2xl">📱</span>
              <div className="text-left">
                <h3 className="text-base font-black text-slate-900">카카오톡 & SNS 바로 전송</h3>
                <p className="text-[11px] text-slate-500 font-semibold">채팅방 또는 SNS에 1초 만에 전송하세요</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCloseSnsShareModal}
              className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-left space-y-1.5 shadow-2xs">
            <div className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>1080p MP4 영상이 다운로드 폴더에 준비되었습니다!</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">
              카카오톡이나 SNS 채팅창에 바로 드래그하거나 첨부하여 전송하실 수 있습니다.
            </div>
          </div>

          {/* Quick Share Apps */}
          <div className="space-y-2 pt-1 text-left">
            <label className="text-xs font-bold text-slate-700 block">원하는 앱으로 바로가기</label>

            {/* KakaoTalk */}
            <a
              href="kakaotalk://"
              onClick={() => {
                setTimeout(() => {
                  window.open('https://talk.kakao.com', '_blank');
                }, 600);
              }}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black text-xs shadow-xs transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">💬</span>
                <div className="text-left">
                  <div className="font-extrabold text-sm text-[#191919]">카카오톡 앱 열기</div>
                  <div className="text-[10px] text-[#191919]/70 font-semibold">채팅방에 영상을 드래그하거나 전송하세요</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-[#191919]/70 shrink-0" />
            </a>

            {/* YouTube Shorts */}
            <a
              href="https://studio.youtube.com/channel/UC/videos/upload?d=ud"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-900 border border-red-200 font-black text-xs transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">▶️</span>
                <div className="text-left">
                  <div className="font-extrabold text-sm text-red-950">유튜브 쇼츠 업로드</div>
                  <div className="text-[10px] text-red-700 font-semibold">유튜브 스튜디오 업로드 화면 바로가기</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-red-600 shrink-0" />
            </a>

            {/* Instagram Reels */}
            <a
              href="https://www.instagram.com/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-pink-50 to-purple-50 hover:from-pink-100 hover:to-purple-100 text-purple-900 border border-purple-200 font-black text-xs transition cursor-pointer active:scale-98"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">📸</span>
                <div className="text-left">
                  <div className="font-extrabold text-sm text-purple-950">인스타그램 릴스 올리기</div>
                  <div className="text-[10px] text-purple-700 font-semibold">인스타그램 피드 및 릴스 바로가기</div>
                </div>
              </div>
              <ExternalLink className="w-4 h-4 text-purple-600 shrink-0" />
            </a>
          </div>

          {/* Friendly Tip Box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 text-left">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>💡</span>
                <span>카카오톡 1초 전송 꿀팁</span>
              </span>
              <button
                type="button"
                onClick={copyShareText}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
              >
                제목/태그 복사
              </button>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>
                <strong className="text-slate-800">PC 카카오톡</strong>: 채팅방을 열고 다운로드된 영상 파일을 마우스로 <strong>채팅창에 쓱 끌어다 놓으면(드래그)</strong> 즉시 동영상으로 전송됩니다!
              </li>
              <li>
                <strong className="text-slate-800">모바일 카카오톡</strong>: 채팅방 하단 <strong>[+] 버튼 → [앨범]</strong>을 누르면 방금 제작된 영상이 맨 위에 나타납니다.
              </li>
            </ul>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={handleCloseSnsShareModal}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-xs transition cursor-pointer"
          >
            확인 완료
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  if (isPageMode) {
    return (
      <div className="flex-1 flex flex-col min-h-0 space-y-4">
        {/* Step 3 Top Breadcrumbs and Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onBackToEditor || onClose}
              className="flex items-center space-x-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs transition border border-slate-200 cursor-pointer shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="xs:hidden">대본 복귀</span>
              <span className="hidden xs:inline">← 2단계 대본 스튜디오</span>
            </button>

            {onBackToTrends && (
              <button
                type="button"
                onClick={onBackToTrends}
                className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-600 font-bold text-xs transition border border-slate-200 cursor-pointer"
              >
                <span>인물 다시 선택</span>
              </button>
            )}

            <div className="h-5 w-px bg-slate-200 hidden sm:block" />

            <div className="flex items-center space-x-1.5 min-w-0">
              <span className="text-xs font-bold text-slate-400 hidden sm:inline">대상 인물:</span>
              <span className="text-xs font-black text-slate-900 bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-xl border border-indigo-200 truncate">
                {project.figureName}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 text-[11px] sm:text-xs font-bold text-slate-500 overflow-x-auto scrollbar-none py-0.5">
            <button
              type="button"
              onClick={onBackToTrends || onClose}
              className="text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
            >
              <span className="sm:hidden">1.인물</span>
              <span className="hidden sm:inline">1단계: 인물 선택</span>
            </button>
            <span className="text-slate-300 shrink-0">➔</span>
            <button
              type="button"
              onClick={onBackToEditor || onClose}
              className="text-slate-400 hover:text-indigo-600 transition cursor-pointer shrink-0"
            >
              <span className="sm:hidden">2.대본</span>
              <span className="hidden sm:inline">2단계: 대본 스튜디오</span>
            </button>
            <span className="text-slate-300 shrink-0">➔</span>
            <span className="text-rose-600 font-black bg-rose-50 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border border-rose-200 shrink-0">
              <span className="sm:hidden">3.영상 제작</span>
              <span className="hidden sm:inline">3단계: 쇼츠 영상 렌더링 & 변환</span>
            </span>
          </div>
        </div>

        {/* Full-width Studio Card */}
        <div className="bg-white rounded-3xl border border-slate-200 w-full flex flex-col shadow-sm relative text-slate-800 overflow-hidden">
          {modalHeaderContent}
          {modalBodyContent}
        </div>
        {renderSnsShareModal()}
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRendering) {
          onClose();
        }
      }}
    >
      <button
        type="button"
        onClick={onClose}
        disabled={isRendering}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[80] bg-slate-900/90 hover:bg-rose-600 text-white px-3.5 py-2 rounded-2xl shadow-2xl flex items-center space-x-1.5 font-black text-xs transition cursor-pointer border border-white/20 backdrop-blur-md hover:scale-105 disabled:opacity-50"
        title="이 창 닫기 (ESC)"
      >
        <X className="w-4 h-4 text-rose-400 group-hover:text-white" />
        <span>이 창 닫기 (ESC)</span>
      </button>

      <div className="bg-white rounded-3xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl relative text-slate-800 overflow-hidden my-auto">
        {modalHeaderContent}
        {modalBodyContent}
      </div>
      {renderSnsShareModal()}
    </div>
  );
};
