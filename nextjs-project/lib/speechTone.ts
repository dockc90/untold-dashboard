export type SpeechToneId = 'friendly_story' | 'trendy_shorts' | 'news_briefing';

interface ToneState {
  index: number;
  daeyoCount: number;
  lastFriendlyEnd: string;
  lastTrendyEnd: string;
}

const FRIENDLY_PAST_ENDINGS = ['거든요', '죠', '답니다', '어요'] as const;
const FRIENDLY_PRESENT_VOWEL_ENDINGS = ['거든요', '죠', '답니다', '예요'] as const;
const FRIENDLY_PRESENT_CONSONANT_ENDINGS = ['이거든요', '이죠', '이랍니다', '이에요'] as const;

export function getSpeechTonePromptDirective(speechTone: string): string {
  if (speechTone === 'trendy_shorts') {
    return '② [직설·다큐 쇼츠체] 짧게 끊어 치는 직설적인 숏폼 다큐체("~했다", "~였다", "~이다", "~됐다", "~한다", 명사 종결)로 군더더기 없이 몰입감을 끌어올리세요. ★절대 규칙: "~습니다/~입니다/~했대요/~했음/~세요" 같은 존댓말·음슴체·썰풀이 어미는 절대 금지하며, 짧은 단문 위주로 힘 있게 끝맺으세요.';
  }
  if (speechTone === 'news_briefing') {
    return '③ [속도감 있는 뉴스 브리핑체] 군더더기 없이 팩트와 숫자를 쾌속으로 전하는 뉴스 브리핑 경어체("~했습니다", "~밝혀졌습니다", "~주목받았습니다", "~평가됩니다", "~전망입니다")로 일관 작성하세요. "~했대요", "~했음" 같은 구어체·반말은 사용하지 마세요.';
  }
  return '① [친근한 썰풀이체] 친한 지인이나 인기 스토리텔러가 흥미진진한 뒷이야기를 들려주듯 자연스러운 구어체("~했거든요", "~였죠", "~했답니다", "~한 거예요", "~하더라고요", "~믿어지시나요?")를 다채롭게 교차해 쓰세요. ★절대 규칙: "~했대요/~였대요/~대요"는 대본 전체에서 최대 1~2회 이하 포인트로만 쓰고, 절대로 모든 문장이나 연속된 두 문장을 "~대요"로 끝내지 마세요. 딱딱한 "~습니다/~입니다"나 음슴체("~했음")도 피하세요.';
}

function getJongseong(ch: string): number {
  if (!ch) return -1;
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return -1;
  return (code - 0xac00) % 28;
}

function swapJongseong(ch: string, nextJong: number): string {
  const code = ch.charCodeAt(0);
  if (code < 0xac00 || code > 0xd7a3) return ch;
  const offset = code - 0xac00;
  const base = offset - (offset % 28);
  return String.fromCharCode(0xac00 + base + nextJong);
}

function pickNonRepeating(options: readonly string[], state: ToneState, lastKey: 'lastFriendlyEnd' | 'lastTrendyEnd'): string {
  const last = state[lastKey];
  const filtered = options.filter((opt) => opt !== last);
  const pool = filtered.length > 0 ? filtered : options;
  const chosen = pool[Math.floor(state.index * 1.7 + state.daeyoCount) % pool.length];
  state[lastKey] = chosen;
  return chosen;
}

function convertSentenceFriendly(sentence: string, state: ToneState): string {
  const trimmed = sentence.trim();
  if (!trimmed) return sentence;

  let body = trimmed;
  const punctMatch = body.match(/([.!?]+["'”’)]*)$/);
  const punct = punctMatch ? punctMatch[1] : '';
  if (punct) {
    body = body.slice(0, body.length - punct.length);
  }

  if (punct.includes('?')) {
    if (/아십니까$/.test(body) || /알고\s*계십니까$/.test(body)) {
      const qEnd = state.index % 2 === 0 ? '믿어지시나요' : '알고 계셨나요';
      state.lastFriendlyEnd = qEnd;
      return body.replace(/(?:알고\s*계십니까|아십니까)$/, qEnd) + punct;
    }
    if (/기억하십니까$/.test(body)) {
      state.lastFriendlyEnd = '기억나시나요';
      return body.replace(/기억하십니까$/, '기억나시나요') + punct;
    }
    if (/([가-힣])셨습니까$/.test(body)) {
      state.lastFriendlyEnd = '셨나요';
      return body.replace(/([가-힣])셨습니까$/, '$1셨나요') + punct;
    }
    if (/([가-힣])십니까$/.test(body)) {
      state.lastFriendlyEnd = '시나요';
      return body.replace(/([가-힣])십니까$/, '$1시나요') + punct;
    }
    state.lastFriendlyEnd = '?';
    return trimmed;
  }

  if (/바랍니다$/.test(body)) {
    state.lastFriendlyEnd = '바라요';
    return body.replace(/바랍니다$/, '바라요') + punct;
  }
  if (/([가-힣])세요$/.test(body)) {
    state.lastFriendlyEnd = '세요';
    return trimmed;
  }

  const daeyoMatch = body.match(/([가-힣])(대요|래요)$/);
  if (daeyoMatch) {
    const canKeepDaeyo =
      state.daeyoCount < 2 &&
      state.index > 0 &&
      state.lastFriendlyEnd !== '대요' &&
      (state.index === 1 || state.index % 5 === 1);

    if (canKeepDaeyo) {
      state.daeyoCount += 1;
      state.lastFriendlyEnd = '대요';
      return trimmed;
    }

    const stemChar = daeyoMatch[1];
    const kind = daeyoMatch[2];
    const jong = getJongseong(stemChar);

    if (kind === '대요' && jong === 20) {
      const chosen = pickNonRepeating(FRIENDLY_PAST_ENDINGS, state, 'lastFriendlyEnd');
      return body.slice(0, -2) + chosen + punct;
    }

    if (kind === '대요' && jong === 4) {
      const vowelStem = swapJongseong(stemChar, 0);
      if (['하', '되', '보', '가', '오'].includes(vowelStem)) {
        const idxChoice = pickNonRepeating(['답니다', '거든요', '죠'], state, 'lastFriendlyEnd');
        if (idxChoice === '답니다') {
          return body.slice(0, -2) + '답니다' + punct;
        }
        return body.slice(0, -3) + vowelStem + idxChoice + punct;
      }
      state.lastFriendlyEnd = '답니다';
      return body.slice(0, -2) + '답니다' + punct;
    }

    if (kind === '래요') {
      if (/아니래요$/.test(body)) {
        const end = pickNonRepeating(['아니거든요', '아니죠', '아니랍니다', '아니에요'], state, 'lastFriendlyEnd');
        return body.replace(/아니래요$/, end) + punct;
      }
      if (/이래요$/.test(body)) {
        const beforeI = body.slice(-4, -3);
        const hasBatchim = getJongseong(beforeI) > 0;
        const pool = hasBatchim ? FRIENDLY_PRESENT_CONSONANT_ENDINGS : FRIENDLY_PRESENT_VOWEL_ENDINGS;
        const end = pickNonRepeating(pool, state, 'lastFriendlyEnd');
        return body.slice(0, -3) + end + punct;
      }
    }

    state.lastFriendlyEnd = '고 해요';
    return body.slice(0, -2) + '다고 해요' + punct;
  }

  const eumMatch = body.match(/([가-힣])음$/);
  if (eumMatch && getJongseong(eumMatch[1]) === 20) {
    const end = pickNonRepeating(FRIENDLY_PAST_ENDINGS, state, 'lastFriendlyEnd');
    return body.slice(0, -1) + end + punct;
  }
  if (/([가-힣])임$/.test(body)) {
    const beforeIm = body.slice(-2, -1);
    const hasBatchim = getJongseong(beforeIm) > 0;
    const pool = hasBatchim ? FRIENDLY_PRESENT_CONSONANT_ENDINGS : FRIENDLY_PRESENT_VOWEL_ENDINGS;
    const end = pickNonRepeating(pool, state, 'lastFriendlyEnd');
    return body.slice(0, -1) + end + punct;
  }
  if (/됨$/.test(body)) {
    const end = pickNonRepeating(['되거든요', '되죠', '된답니다'], state, 'lastFriendlyEnd');
    return body.replace(/됨$/, end) + punct;
  }
  if (/함$/.test(body)) {
    const end = pickNonRepeating(['하거든요', '하죠', '한답니다'], state, 'lastFriendlyEnd');
    return body.replace(/함$/, end) + punct;
  }

  if (/아닙니다$/.test(body)) {
    const end = pickNonRepeating(['아니거든요', '아니죠', '아니랍니다', '아니에요'], state, 'lastFriendlyEnd');
    return body.replace(/아닙니다$/, end) + punct;
  }

  if (/입니다$/.test(body)) {
    const beforeIdx = body.length - 4;
    const prev = beforeIdx >= 0 ? body[beforeIdx] : '';
    const hasBatchim = getJongseong(prev) > 0;
    const pool = hasBatchim ? FRIENDLY_PRESENT_CONSONANT_ENDINGS : FRIENDLY_PRESENT_VOWEL_ENDINGS;
    const end = pickNonRepeating(pool, state, 'lastFriendlyEnd');
    return body.slice(0, -3) + end + punct;
  }

  if (/합니다$/.test(body)) {
    const end = pickNonRepeating(['하거든요', '하죠', '한답니다', '해요'], state, 'lastFriendlyEnd');
    return body.replace(/합니다$/, end) + punct;
  }

  if (/됩니다$/.test(body)) {
    const end = pickNonRepeating(['되거든요', '되죠', '된답니다', '돼요'], state, 'lastFriendlyEnd');
    return body.replace(/됩니다$/, end) + punct;
  }

  const seumnidaMatch = body.match(/([가-힣])습니다$/);
  if (seumnidaMatch) {
    const stemChar = seumnidaMatch[1];
    const jong = getJongseong(stemChar);
    if (jong === 20) {
      if (state.daeyoCount === 0 && state.index === 1) {
        state.daeyoCount += 1;
        state.lastFriendlyEnd = '대요';
        return body.slice(0, -3) + '대요' + punct;
      }
      const end = pickNonRepeating(FRIENDLY_PAST_ENDINGS, state, 'lastFriendlyEnd');
      return body.slice(0, -3) + end + punct;
    }
    const end = pickNonRepeating(['거든요', '죠'], state, 'lastFriendlyEnd');
    return body.slice(0, -3) + end + punct;
  }

  if (/만듭니다$/.test(body)) {
    const end = pickNonRepeating(['만들거든요', '만들죠', '만든답니다'], state, 'lastFriendlyEnd');
    return body.replace(/만듭니다$/, end) + punct;
  }
  if (/이끕니다$/.test(body)) {
    const end = pickNonRepeating(['이끌거든요', '이끌죠', '이끈답니다'], state, 'lastFriendlyEnd');
    return body.replace(/이끕니다$/, end) + punct;
  }
  if (/삽니다$/.test(body)) {
    const end = pickNonRepeating(['살거든요', '살죠', '산답니다'], state, 'lastFriendlyEnd');
    return body.replace(/삽니다$/, end) + punct;
  }
  if (/압니다$/.test(body)) {
    const end = pickNonRepeating(['알거든요', '알죠', '안답니다'], state, 'lastFriendlyEnd');
    return body.replace(/압니다$/, end) + punct;
  }

  const pnidaMatch = body.match(/([가-힣])니다$/);
  if (pnidaMatch && getJongseong(pnidaMatch[1]) === 17) {
    const prev = pnidaMatch[1];
    const cleanStem = swapJongseong(prev, 0);
    const end = pickNonRepeating(['거든요', '죠'], state, 'lastFriendlyEnd');
    return body.slice(0, -3) + cleanStem + end + punct;
  }

  const tail = body.slice(-3);
  if (/(?:거든요|죠|답니다|어요|아요|해요|예요|에요|네요|거예요)$/.test(tail)) {
    state.lastFriendlyEnd = tail;
  }
  return trimmed;
}

function convertSentenceTrendy(sentence: string, state: ToneState): string {
  const trimmed = sentence.trim();
  if (!trimmed) return sentence;

  let body = trimmed;
  const punctMatch = body.match(/([.!?]+["'”’)]*)$/);
  const punct = punctMatch ? punctMatch[1] : '';
  if (punct) {
    body = body.slice(0, body.length - punct.length);
  }

  if (punct.includes('?')) {
    body = body
      .replace(/믿어지시나요$/, '믿어지는가')
      .replace(/기억나시나요$/, '기억하는가')
      .replace(/기억하십니까$/, '기억하는가')
      .replace(/알고 계셨나요$/, '알고 있었을까')
      .replace(/알고 계십니까$/, '알고 있는가')
      .replace(/아십니까$/, '알고 있는가')
      .replace(/보셨나요$/, '봤을까')
      .replace(/멋졌나요$/, '어땠을까')
      .replace(/깊으셨나요$/, '깊었을까')
      .replace(/얻으셨습니까$/, '얻었을까')
      .replace(/([가-힣])셨나요$/, '$1셨을까')
      .replace(/([가-힣])시나요$/, '$1는가')
      .replace(/무엇이었을까요$/, '무엇이었을까')
      .replace(/무엇일까요$/, '무엇일까')
      .replace(/이유일까요$/, '이유일까')
      .replace(/했을까요$/, '했을까')
      .replace(/됐을까요$/, '됐을까')
      .replace(/있을까요$/, '있을까')
      .replace(/([가-힣])을까요$/, '$1을까')
      .replace(/([가-힣])일까요$/, '$1일까')
      .replace(/([가-힣])이에요$/, '$1일까')
      .replace(/([가-힣])예요$/, '$1일까')
      .replace(/([가-힣])나요$/, '$1는가')
      .replace(/([가-힣])어요$/, '$1을까')
      .replace(/([가-힣])아요$/, '$1을까');
    return body + punct;
  }

  body = body
    .replace(/응원합니다$/, '응원한다')
    .replace(/바랍니다$/, '바란다')
    .replace(/기억해 보시길 바랍니다$/, '기억해 두자')
    .replace(/해보세요$/, '해보자')
    .replace(/하세요$/, '하자')
    .replace(/보세요$/, '보자')
    .replace(/주세요$/, '주자')
    .replace(/([가-힣])으세요$/, '$1자')
    .replace(/([가-힣])세요$/, '$1자');

  body = body
    .replace(/아닙니다$/, '아니다')
    .replace(/아니거든요$/, '아니다')
    .replace(/아니죠$/, '아니다')
    .replace(/아니랍니다$/, '아니다')
    .replace(/아니래요$/, '아니다')
    .replace(/아니에요$/, '아니다')
    .replace(/아님$/, '아니다')
    .replace(/만듭니다$/, '만든다')
    .replace(/이끕니다$/, '이끈다')
    .replace(/삽니다$/, '산다')
    .replace(/압니다$/, '안다')
    .replace(/봅니다$/, '본다')
    .replace(/갑니다$/, '간다')
    .replace(/옵니다$/, '온다')
    .replace(/합니다$/, '한다')
    .replace(/하거든요$/, '한다')
    .replace(/하죠$/, '한다')
    .replace(/한답니다$/, '한다')
    .replace(/한대요$/, '한다')
    .replace(/해요$/, '한다')
    .replace(/함$/, '한다')
    .replace(/됩니다$/, '된다')
    .replace(/되거든요$/, '된다')
    .replace(/되죠$/, '된다')
    .replace(/된답니다$/, '된다')
    .replace(/된대요$/, '된다')
    .replace(/돼요$/, '된다')
    .replace(/됨$/, '된다')
    .replace(/거예요$/, '거다')
    .replace(/거거든요$/, '거다')
    .replace(/거죠$/, '거다')
    .replace(/거랍니다$/, '거다')
    .replace(/거래요$/, '거다')
    .replace(/거임$/, '거다')
    .replace(/셈이죠$/, '셈이다')
    .replace(/셈입니다$/, '셈이다')
    .replace(/셈이에요$/, '셈이다')
    .replace(/셈임$/, '셈이다')
    .replace(/([가-힣]+)이셨습니다$/, '$1이었다')
    .replace(/([가-힣]+)이셨음$/, '$1이었다')
    .replace(/더라고요$/, '더라')
    .replace(/예[요]$/, '다');

  const copulaMatch = body.match(/([가-힣])(입니다|이거든요|이죠|이랍니다|이래요|이에요)$/);
  if (copulaMatch) {
    const stemChar = copulaMatch[1];
    const jong = getJongseong(stemChar);
    body = body.slice(0, -copulaMatch[2].length) + (jong > 0 ? '이다' : '다');
  }

  const umseumPastMatch = body.match(/([가-힣])음$/);
  if (umseumPastMatch && getJongseong(umseumPastMatch[1]) === 20) {
    body = body.slice(0, -1) + '다';
  }
  body = body.replace(/(것|뿐|곳|수|줄|터|때문)임$/, '$1이다');

  const ssEndingMatch = body.match(/([가-힣])(습니다|거든요|랍니다|답니다|대요|죠|어요|아요)$/);
  if (ssEndingMatch) {
    const prev = ssEndingMatch[1];
    const suffix = ssEndingMatch[2];
    const jong = getJongseong(prev);
    if (jong === 20) {
      body = body.slice(0, -suffix.length) + '다';
    } else if (prev === '렇') {
      body = body.slice(0, -suffix.length) + '다';
    } else if (suffix === '습니다') {
      if (['많', '작', '같', '좋', '깊', '높', '넓', '적', '낮', '짧', '길', '멀'].includes(prev)) {
        body = body.slice(0, -suffix.length) + '다';
      } else {
        body = body.slice(0, -suffix.length) + '는다';
      }
    } else if (jong === 0) {
      body = body.slice(0, -suffix.length - 1) + swapJongseong(prev, 4) + '다';
    } else {
      body = body.slice(0, -suffix.length) + '다';
    }
  }

  const pnidaMatch = body.match(/([가-힣])니다$/);
  if (pnidaMatch && getJongseong(pnidaMatch[1]) === 17) {
    body = body.slice(0, -3) + swapJongseong(pnidaMatch[1], 4) + '다';
  }

  state.lastTrendyEnd = body.slice(-2);
  return body + punct;
}

function convertSentenceNews(sentence: string): string {
  const trimmed = sentence.trim();
  if (!trimmed) return sentence;

  let body = trimmed;
  const punctMatch = body.match(/([.!?]+["'”’)]*)$/);
  const punct = punctMatch ? punctMatch[1] : '';
  if (punct) {
    body = body.slice(0, body.length - punct.length);
  }

  if (punct.includes('?')) {
    body = body
      .replace(/믿어지시나요$/, '아십니까')
      .replace(/알고 계셨나요$/, '알고 계십니까')
      .replace(/기억나시나요$/, '기억하십니까')
      .replace(/([가-힣])셨나요$/, '$1셨습니까')
      .replace(/([가-힣])시나요$/, '$1십니까');
    return body + punct;
  }

  body = body
    .replace(/아니(?:래요|거든요|죠|랍니다|에요)$/, '아닙니다')
    .replace(/아님$/, '아닙니다')
    .replace(/하(?:거든요|죠|대요)$/, '합니다')
    .replace(/한(?:대요|답니다)$/, '합니다')
    .replace(/해요$/, '합니다')
    .replace(/함$/, '합니다')
    .replace(/되(?:거든요|죠|대요)$/, '됩니다')
    .replace(/된(?:대요|답니다)$/, '됩니다')
    .replace(/돼요$/, '됩니다')
    .replace(/됨$/, '됩니다')
    .replace(/이(?:래요|거든요|죠|랍니다|에요)$/, '입니다')
    .replace(/임$/, '입니다')
    .replace(/예요$/, '입니다')
    .replace(/거든요$/, '습니다')
    .replace(/답니다$/, '습니다')
    .replace(/대요$/, '습니다')
    .replace(/죠$/, '습니다')
    .replace(/이에요$/, '입니다');

  const eumMatch = body.match(/([가-힣])음$/);
  if (eumMatch && getJongseong(eumMatch[1]) === 20) {
    body = body.slice(0, -1) + '습니다';
  }

  const eoyoMatch = body.match(/([가-힣])(?:어요|아요)$/);
  if (eoyoMatch && getJongseong(eoyoMatch[1]) === 20) {
    body = body.slice(0, -2) + '습니다';
  }

  return body + punct;
}

function splitPreservingWhitespace(text: string): { leading: string; segments: { text: string; sep: string }[] } {
  const leadMatch = text.match(/^(\s*)/);
  const leading = leadMatch ? leadMatch[1] : '';
  const rest = text.slice(leading.length);
  if (!rest) return { leading, segments: [] };

  const segments: { text: string; sep: string }[] = [];
  const regex = /(?:[^\s.!?\n]|\d\.\d)(?:[^.!?\n]|\d\.\d)*[.!?]*["'”’)]*/g;
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rest)) !== null) {
    if (match.index > lastIdx) {
      const gap = rest.slice(lastIdx, match.index);
      if (segments.length > 0) {
        segments[segments.length - 1].sep += gap;
      }
    }
    segments.push({ text: match[0], sep: '' });
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < rest.length && segments.length > 0) {
    segments[segments.length - 1].sep += rest.slice(lastIdx);
  }
  return { leading, segments };
}

export function enforceSpeechTone(
  rawText: string,
  tone: string,
  sharedState?: ToneState
): string {
  const text = String(rawText || '');
  if (!text.trim()) return text;

  const state: ToneState = sharedState || {
    index: 0,
    daeyoCount: 0,
    lastFriendlyEnd: '',
    lastTrendyEnd: '',
  };

  const { leading, segments } = splitPreservingWhitespace(text);
  if (segments.length === 0) return text;

  const converted = segments.map((seg) => {
    let nextText = seg.text;
    if (tone === 'trendy_shorts') {
      nextText = convertSentenceTrendy(seg.text, state);
    } else if (tone === 'news_briefing') {
      nextText = convertSentenceNews(seg.text);
    } else {
      nextText = convertSentenceFriendly(seg.text, state);
    }
    state.index += 1;
    return nextText + seg.sep;
  });

  return leading + converted.join('');
}

export function applyToneToShortsPayload<T extends Record<string, any>>(payload: T, tone: string): T {
  const sharedState: ToneState = {
    index: 0,
    daeyoCount: 0,
    lastFriendlyEnd: '',
    lastTrendyEnd: '',
  };

  const tonedHooks = Array.isArray(payload.hooks)
    ? payload.hooks.map((h: any, i: number) => ({
        ...h,
        text: enforceSpeechTone(String(h?.text || ''), tone, {
          index: i,
          daeyoCount: 0,
          lastFriendlyEnd: '',
          lastTrendyEnd: '',
        }),
      }))
    : [];

  const tonedScenes = Array.isArray(payload.scenes)
    ? payload.scenes.map((s: any) => ({
        ...s,
        narration: enforceSpeechTone(String(s?.narration || ''), tone, sharedState),
      }))
    : [];

  const tonedFullScript =
    tonedScenes.length > 0
      ? tonedScenes.map((s: any) => s.narration).join('\n\n')
      : enforceSpeechTone(String(payload.fullScript || ''), tone);

  return {
    ...payload,
    hooks: tonedHooks,
    scenes: tonedScenes,
    fullScript: tonedFullScript,
  };
}
