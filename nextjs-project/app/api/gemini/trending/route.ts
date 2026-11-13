import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch (e) {
    body = {};
  }

  const { timeframe = '24h', refresh = false, category = 'all', channel = 'all' } = body;

  const fallbackList = [
    {
      id: `fig-fall-${Date.now()}-scarf`,
      name: '남대문 스카프 아저씨 (이종석)',
      title: '현란한 손기술과 최면급 말솜씨로 전 세계 관광객을 홀린 남대문 매직 스카프 장인',
      category: 'viral',
      viralityScore: 100,
      timeframe,
      buzzSummary: '30년 경력 노점상의 스카프 매기 영상이 유튜브·릴스 합산 6,500만 뷰, 글로벌 패러디 45만 건을 돌파하며 남대문시장 외국인 필수 코스로 등극했습니다.',
      controversyOrIssue: '스카프 한 장으로 10가지 스타일을 10초 만에 만들어내는 신의 손기술, "사모님 이거 하나면 파리 패션위크 갑니다"라는 중독성 강한 멘트',
      suggestedAngle: '단순한 노점상이 아니라 30년의 내공으로 완성된 길거리 쇼맨십의 정점, 진정한 세일즈의 마법사',
      hookLine: '10초 만에 스카프 10종을 묶는 남대문 아저씨, 6,500만 뷰 터진 진짜 이유',
      tags: ['남대문스카프', '스카프아저씨', '남대문시장', '쇼츠바이럴', '장사의신', '세일즈달인', '마성의손기술'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 실시간 급상승 1위 (+890%)',
        youtubeViews: '유튜브 쇼츠 통합 6,500만 뷰',
        instaReels: '글로벌 릴스 패러디 45만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-chungju`,
      name: '충주맨 (김선태 주무관)',
      title: 'B급 감성 쇼츠 하나로 대한민국 공공기관을 평정한 70만 유튜버 공무원',
      category: 'viral',
      viralityScore: 98,
      timeframe,
      buzzSummary: '예산 0원·B급 감성 숏폼으로 충주시 인구(약 21만 명)의 3배를 넘는 구독자와 누적 1.5억 뷰를 기록하며 9급에서 6급 초고속 특진 신화를 썼습니다.',
      controversyOrIssue: '보수적인 공직 사회의 편견과 반대를 뚫고 특진까지 이뤄낸 파격적인 홍보 성공 신화',
      suggestedAngle: '틀을 깨면 세상이 바뀐다, 9급 공무원에서 대한민국 최고의 기획자가 된 충주맨의 반란',
      hookLine: '예산 0원 영상 하나로 9급에서 6급 특진까지, 공무원 유튜브 판을 깬 남자',
      tags: ['충주맨', '김선태', '충주시', '공무원혁신', 'B급감성', '숏폼장인'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 인물 검색 3위',
        youtubeViews: '유튜브 쇼츠 누적 1.5억 뷰',
        instaReels: '릴스 20만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-1`,
      name: '젠슨 황 (Jensen Huang)',
      title: '연이은 불륜 스캔들 시인 후 창립 33년 만에 엔비디아 CEO 전격 사임',
      category: 'economy',
      viralityScore: 100,
      timeframe,
      buzzSummary: '2026년 11월 메가스피드 임원 앨리스 황·사내 임원 킴벌리 파월 등 복수의 혼외 관계 스캔들이 보도된 뒤 불충실함을 시인하고, 창립 33년 만에 엔비디아 CEO·이사회직에서 전격 사임했습니다.',
      controversyOrIssue: '국가안보·사내 윤리 논란과 함께 임시 CEO 콜레트 크레스 선임, 엔비디아 주가 급락 및 대규모 재산분할 가능성까지 전 세계 언론이 대서특필 중입니다.',
      suggestedAngle: '세계 1위 AI 제국을 세운 황제가 사생활 스캔들 단 한 번으로 33년 왕좌에서 내려온 충격적 몰락',
      hookLine: '엔비디아 창립 33년 만에 전격 사임한 젠슨 황, 전 세계가 뒤집힌 불륜 스캔들 전말',
      tags: ['젠슨황', '엔비디아', 'CEO사임', '실시간이슈', 'AI반도체'],
      primaryChannel: 'multi',
      channelMetrics: {
        naverRank: '네이버 글로벌 뉴스 1위',
        youtubeViews: '유튜브 쇼츠 이슈 급상승',
        instaReels: '글로벌 릴스 화제'
      }
    },
    {
      id: `fig-fall-${Date.now()}-2`,
      name: '일론 머스크 (Elon Musk)',
      title: '전 재산 털어 로켓 3번 폭발시키고 기적을 쏜 미치광이 천재',
      category: 'global',
      viralityScore: 99,
      timeframe,
      buzzSummary: '스페이스X 로켓 부스터 젓가락 포획 성공과 테슬라 자율주행 이슈로 쇼츠 9,500만 뷰를 기록하며, 2008년 파산 직전 3연속 발사 실패 비화가 재조명되고 있습니다.',
      controversyOrIssue: '2008년 크리스마스 이브 파산 직전까지 몰렸던 극한의 공포와 주변의 조롱을 극복한 집념',
      suggestedAngle: '모두가 미쳤다고 비웃었지만 결국 인류의 미래를 바꾼 불굴의 멘탈',
      hookLine: '로켓 3번 연속 폭발 후 파산 직전, 마지막 돈으로 기적을 쏜 밤',
      tags: ['일론머스크', '테슬라', '스페이스X', 'xAI', '로보택시', '도전정신'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 경제/해외 1위',
        youtubeViews: '유튜브 쇼츠 9,500만 뷰',
        instaReels: '인스타 릴스 90만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-3`,
      name: '로제 (BLACKPINK)',
      title: '한국 술자리 게임 ‘아파트’로 빌보드를 정복한 천재성',
      category: 'global',
      viralityScore: 99,
      timeframe,
      buzzSummary: '브루노 마스와 협업한 〈APT.〉가 릴스 음원 120만 건·유튜브 1.8억 뷰 이상을 돌파하며 한국 술자리 게임이 글로벌 챌린지 1위에 올랐습니다.',
      controversyOrIssue: '전통적인 K팝 공식을 깨고 가장 한국적인 놀이를 가장 힙한 팝 음악으로 재창조한 감각',
      suggestedAngle: '한국 술자리 게임 하나로 전 세계를 춤추게 만든 소녀의 번뜩이는 감각',
      hookLine: '한국 술자리 게임 단 두 글자로 빌보드와 전 세계 릴스 120만 개를 덮친 비결',
      tags: ['로제', '아파트', '브루노마스', '빌보드', 'K컬처'],
      primaryChannel: 'multi',
      channelMetrics: {
        naverRank: '네이버 뮤직 1위',
        youtubeViews: '유튜브 MV/쇼츠 1.8억 뷰',
        instaReels: '릴스 음원 사용 120만 건'
      }
    },
    {
      id: `fig-fall-${Date.now()}-4`,
      name: '페이커 (이상혁)',
      title: '손목 부상과 7년의 암흑기를 딛고 롤드컵 5회 우승 신화를 쓴 불멸의 대마왕',
      category: 'sports',
      viralityScore: 99,
      timeframe,
      buzzSummary: '7년의 우승 공백과 2023년 심각한 손목 부상을 딛고 롤드컵 통산 5회 우승·결승 MVP를 달성하며 유튜브 하이라이트 4,500만 뷰를 돌파했습니다.',
      controversyOrIssue: '손목 통증으로 키보드를 치지 못했던 순간에도 팀원들을 믿고 다시 정상에 선 헌신',
      suggestedAngle: '"모든 길은 저를 통합니다." 10년 넘게 정상에서 자신을 증명한 거인의 품격',
      hookLine: '연봉 수백억 제안을 거절하고 손목 통증 속에서 쓴 롤드컵 5회 우승 실화',
      tags: ['페이커', 'T1', '롤드컵우승', '대마왕', '불사대마왕', 'e스포츠'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 스포츠 1위 (+780%)',
        youtubeViews: '유튜브 하이라이트 4,500만 뷰',
        instaReels: '글로벌 릴스 50만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-5`,
      name: '손흥민',
      title: '아시아 최초 프리미어리그 득점왕 뒤에 숨겨진 아버지의 10년 맹훈련',
      category: 'sports',
      viralityScore: 98,
      timeframe,
      buzzSummary: '세계 최고 리그에서 증명한 월드클래스 실력과 겸손함, 손웅정 감독의 혹독한 기본기 훈련 일화',
      controversyOrIssue: '매일 볼 리프팅 4시간, 눈에 실핏줄이 터질 때까지 기본기만 반복했던 유년기',
      suggestedAngle: '천재가 아니라 피와 땀으로 완성된 영웅의 눈물겨운 여정',
      tags: ['손흥민', '토트넘', '손웅정', '기본기', '국위선양'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 해외축구 1위',
        youtubeViews: '유튜브 하이라이트 3,200만 뷰',
        instaReels: '릴스 챌린지 21만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-6`,
      name: '안성재 셰프',
      title: '이라크 파병 정비병에서 대한민국 유일 미슐랭 3스타가 된 기적',
      category: 'entertainment',
      viralityScore: 98,
      timeframe,
      buzzSummary: '흑백요리사 신드롬의 주인공, 미군 정비병 전역 후 자동차 정비공을 꿈꾸다 요리에 빠져든 반전 실화',
      controversyOrIssue: '어려웠던 이민 생활과 혹독한 주방 밑바닥에서 피눈물 흘리며 버텨낸 15년의 치열한 집념',
      suggestedAngle: '이라크 전장의 총 대신 주방 칼을 잡고 세계 최정상에 오른 기적의 인간 승리',
      tags: ['안성재', '흑백요리사', '미슐랭3스타', '모수', '감동실화'],
      primaryChannel: 'multi',
      channelMetrics: {
        naverRank: '네이버 인물 검색 1위',
        youtubeViews: '유튜브 하이라이트 2,800만 뷰',
        instaReels: '인스타 릴스 25만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-7`,
      name: '지드래곤 (G-DRAGON)',
      title: '7년의 침묵을 깨고 독보적 신곡 파워로 컴백한 K-POP의 제왕',
      category: 'entertainment',
      viralityScore: 99,
      timeframe,
      buzzSummary: '신곡 POWER로 음원 차트 올킬 및 유퀴즈 출연으로 폭발적인 대중적 환호와 패션 트렌드 독점',
      controversyOrIssue: '억울했던 루머와 공백기를 예술과 음악으로 완벽하게 제압한 진짜 아티스트의 품격',
      suggestedAngle: '세상이 나를 흔들어도 나는 음악으로 답한다, 지드래곤의 불멸의 영향력',
      tags: ['지드래곤', 'GD', 'POWER', '빅뱅', '패션아이콘'],
      primaryChannel: 'multi',
      channelMetrics: {
        naverRank: '네이버 연예 종합 1위',
        youtubeViews: '유튜브 MV 5,200만 뷰',
        instaReels: '릴스 챌린지 85만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-8`,
      name: '오타니 쇼헤이 (Shohei Ohtani)',
      title: '만화도 이렇게 쓰면 욕먹는다! MLB 최초 50홈런-50도루 신화',
      category: 'sports',
      viralityScore: 100,
      timeframe,
      buzzSummary: '메이저리그 148년 역사상 최초로 50-50을 달성하고 월드시리즈 우승 트로피를 들어올린 야구 천재',
      controversyOrIssue: '고교 시절 쓰레기 줍기까지 운의 영역으로 계획했던 만다라트 계획표와 철저한 자기관리',
      suggestedAngle: '불가능을 목표로 삼았기에 역사가 되었다, 오타니의 위대한 멘탈리티',
      tags: ['오타니', '50-50', 'LA다저스', 'MLB', '만다라트'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 해외스포츠 1위',
        youtubeViews: '유튜브 쇼츠 7,200만 뷰',
        instaReels: '글로벌 릴스 60만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-9`,
      name: '샘 알트만 (Sam Altman)',
      title: 'ChatGPT로 인류의 지능을 바꾼 OpenAI 창립자의 거침없는 승부수',
      category: 'economy',
      viralityScore: 97,
      timeframe,
      buzzSummary: '이사회의 기습 해임 쿠데타를 5일 만에 뒤집고 완벽하게 복귀한 실리콘밸리의 실세',
      controversyOrIssue: '인류를 위협할 수 있는 초지능(AGI) 개발과 기업 상업화 사이의 살얼음판 갈등',
      suggestedAngle: '모두가 안 된다고 할 때 전 재산과 미래를 베팅하는 빅테크 거물의 결단력',
      tags: ['샘알트만', 'OpenAI', 'ChatGPT', '인공지능', '실리콘밸리'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 IT/테크 1위',
        youtubeViews: '유튜브 인터뷰 3,400만 뷰',
        instaReels: '테크 릴스 20만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-10`,
      name: '카리나 (aespa)',
      title: '쇠맛 신드롬 ‘슈퍼노바’와 ‘아마겟돈’으로 가요계를 평정한 AI 비주얼 리더',
      category: 'entertainment',
      viralityScore: 98,
      timeframe,
      buzzSummary: '독보적인 콘셉트와 라이브 실력으로 걸그룹 음원 차트 장기 집권 및 챌린지 열풍 주도',
      controversyOrIssue: '비주얼뿐만 아니라 밤낮없는 연습으로 다져진 보컬과 댄스 실력의 재평가',
      suggestedAngle: '완벽한 외모 뒤에 숨겨진 치열한 노력과 그룹을 이끄는 단단한 리더십',
      tags: ['카리나', '에스파', '슈퍼노바', '아마겟돈', 'KPOP리더'],
      primaryChannel: 'instagram',
      channelMetrics: {
        naverRank: '네이버 엔터 2위',
        youtubeViews: '유튜브 쇼츠 6,100만 뷰',
        instaReels: '릴스 챌린지 110만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-11`,
      name: '변우석',
      title: '오디션 100번 탈락을 딛고 10년 만에 맞이한 기적',
      category: 'actor',
      viralityScore: 96,
      timeframe,
      buzzSummary: '선재 신드롬 이전 10년의 긴 무명 생활과 폭언을 견뎌내며 버틴 눈물의 감동 실화',
      controversyOrIssue: '배우 하지 말라는 주변의 만류 속에서도 단역을 전전하며 끝까지 포기하지 않은 집념',
      suggestedAngle: '포기하고 싶을 때 거울을 보며 버틴 10년의 인내와 폭풍 눈물',
      tags: ['변우석', '선재업고튀어', '무명10년', '인생역전', '감동실화'],
      primaryChannel: 'naver',
      channelMetrics: {
        naverRank: '네이버 인물 검색 2위 (+380%)',
        youtubeViews: '유튜브 쇼츠 2,100만 뷰',
        instaReels: '인스타 릴스 14만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-12`,
      name: '미스터비스트 (MrBeast)',
      title: '하루 16시간 유튜브만 분석해 3억 구독자 제국을 세운 집념',
      category: 'global',
      viralityScore: 100,
      timeframe,
      buzzSummary: '전 세계 유튜브 구독자 1위! 벌어들인 수익의 100%를 다시 다음 영상에 재투자하는 미친 스케일',
      controversyOrIssue: '학창 시절 친구들과 작은 방에 모여 1,000개의 썸네일과 인트로를 초단위로 뜯어보며 연구한 일화',
      suggestedAngle: '천재 크리에이터는 없다, 오직 미치도록 집요한 분석과 실행만이 있을 뿐이다',
      tags: ['미스터비스트', '유튜브1위', '3억구독자', '챌린지', '성공방정식'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 해외이슈 2위',
        youtubeViews: '유튜브 본편 및 쇼츠 누적 500억 뷰',
        instaReels: '글로벌 릴스 200만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-13`,
      name: '백종원',
      title: '통영 어촌 살리기부터 축제 혁신까지, 위기의 자영업을 살리는 장사의 신',
      category: 'social',
      viralityScore: 97,
      timeframe,
      buzzSummary: '지역 축제 바가지 요금 근절과 전통시장 재생 프로젝트로 전 국민적 신뢰와 박수를 받는 외식업계 거물',
      controversyOrIssue: '과거 IMF 시절 17억 빚더미에 앉아 유서까지 썼던 극한의 위기를 극복한 인생 실화',
      suggestedAngle: '바닥을 쳐본 사람만이 진정한 장사의 본질을 안다, 백종원의 눈물겨운 빚더미 탈출기',
      tags: ['백종원', '더본코리아', '골목식당', '지역축제', '인생역전'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 경제/사회 1위',
        youtubeViews: '유튜브 채널 600만 구독자 & 쇼츠 4,000만 뷰',
        instaReels: '릴스 35만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-14`,
      name: '워런 버핏 (Warren Buffett)',
      title: '94세 오마하의 현인이 전하는 "가장 중요한 인생의 1가지 원칙"',
      category: 'economy',
      viralityScore: 96,
      timeframe,
      buzzSummary: '현금 보유액 사상 최대치 경신! 단 하루도 일희일비하지 않고 80년간 세계 부호 1위를 지킨 투자 황제',
      controversyOrIssue: '남들이 탐욕을 부릴 때 두려워하고, 남들이 두려워할 때 탐욕을 부리는 역발상 가치투자',
      suggestedAngle: '돈보다 중요한 것은 평생을 지킬 평판이다, 90대 거인이 청년들에게 전하는 뼈 때리는 조언',
      tags: ['워런버핏', '버크셔해서웨이', '가치투자', '오마하의현인', '인생교훈'],
      primaryChannel: 'naver',
      channelMetrics: {
        naverRank: '네이버 경제 인물 1위',
        youtubeViews: '유튜브 다큐/쇼츠 2,500만 뷰',
        instaReels: '릴스 18만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-15`,
      name: '이강인',
      title: '파리 생제르맹(PSG)의 핵심으로 거듭난 축구 천재의 승부욕',
      category: 'sports',
      viralityScore: 96,
      timeframe,
      buzzSummary: '날카로운 킬패스와 택배 크로스로 프랑스 리그앙과 챔피언스리그를 뒤흔드는 에이스 활약',
      controversyOrIssue: '날아라 슛돌이 시절부터 스페인 발렌시아 유학까지 언어 장벽과 인종차별을 뚫고 버틴 유년기',
      suggestedAngle: '어린 나이에 홀로 떠난 스페인 유학길, 눈물로 축구화를 묶었던 소년의 당찬 반란',
      tags: ['이강인', 'PSG', '슛돌이', '국가대표', '골든보이'],
      primaryChannel: 'youtube',
      channelMetrics: {
        naverRank: '네이버 축구 검색 2위',
        youtubeViews: '유튜브 하이라이트 2,900만 뷰',
        instaReels: '릴스 19만 개'
      }
    },
    {
      id: `fig-fall-${Date.now()}-16`,
      name: '마동석',
      title: '미국 헬스트레이너에서 한국 영화계 천만 관객 4회 돌파의 괴물 배우',
      category: 'actor',
      viralityScore: 97,
      timeframe,
      buzzSummary: '범죄도시 시리즈로 한국 영화 역사상 최다 관객 동원 기록! 마크 콜먼 개인 트레이너 출신의 묵직한 액션',
      controversyOrIssue: '계단에서 추락해 척추와 어깨가 부러지는 대수술을 겪고도 진통제를 맞으며 촬영한 투혼',
      suggestedAngle: '온몸이 쇠조각투성이지만 액션을 멈출 수 없다, 불사조 마동석의 진짜 액션 인생',
      tags: ['마동석', '범죄도시', '천만배우', '액션히어로', '마블영화'],
      primaryChannel: 'multi',
      channelMetrics: {
        naverRank: '네이버 영화 인물 1위',
        youtubeViews: '유튜브 액션 명장면 4,200만 뷰',
        instaReels: '릴스 28만 개'
      }
    }
  ];

  if (!apiKey) {
    return NextResponse.json(fallbackList);
  }

  const categoryInstruction = 
    category === 'viral'
      ? '현재 요청은 [🔥 SNS 바이럴·밈] 전용 실시간 발굴 모드입니다. 남대문 스카프 아저씨(이종석), 충주맨(김선태), 말왕(장충동 왕족발보쌈), 서이브(마라탕후루), 랄랄, 틱톡/릴스/쇼츠에서 알고리즘을 터뜨린 길거리 세일즈 달인, 화제의 챌린지 밈 주인공, 일반인 바이럴 스타들을 16~20명 대량 발굴하여 추천하세요. 모든 인물의 category 필드는 반드시 "viral"로 지정하세요.'
      : category === 'economy'
      ? '반드시 젠슨 황(엔비디아 CEO, 전 세계 시가총액 1위 신화), 일론 머스크, 샘 알트만, 워런 버핏 등 글로벌 테크/경제 거물과 국내외 혁신 기업인을 최우선 포함하세요.'
      : category === 'global'
      ? '반드시 젠슨 황(엔비디아), 일론 머스크(테슬라/xAI), 로제(아파트 신드롬), 페이커 등 글로벌 무대에서 압도적 조회수를 올리고 있는 세계적 인물을 포함하세요.'
      : category === 'entertainment'
      ? '안성재 셰프, 로제, GD(지드래곤), 카리나 등 현재 유튜브·릴스에서 폭발적 관심을 받는 연예·대중문화 핫 인물을 추천하세요.'
      : category === 'sports'
      ? '손흥민, 페이커, 오타니 쇼헤이, 이강인, 김민재 등 역경을 딛고 세계 정상에 오른 스포츠 영웅을 추천하세요.'
      : '현재 전 세계와 대한민국 숏폼(유튜브 쇼츠, 릴스, 틱톡)에서 가장 도파민과 조회수가 폭발적인 인물들을 추천하세요. 특히 전 세계 시총 1위 AI 황제 젠슨 황(엔비디아), 일론 머스크뿐만 아니라 남대문 스카프 아저씨, 충주맨 등 숏폼/릴스에서 엄청난 조회수를 폭발시키고 있는 SNS 핫 바이럴 인물도 적극 포함하고, 셰프·가수·배우·스포츠 영웅 등 다채로운 감동 실화 인물을 조합하세요.';

  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  const timeframeLabel =
    timeframe === '24h' ? '최근 24시간' : timeframe === '48h' ? '최근 48시간' : '최근 7일간';

  const prompt = `당신은 대한민국 최고 유튜브 쇼츠 & 인스타 릴스 실시간 트렌드 리서처입니다.
오늘 날짜는 ${todayStr}(한국 시간)입니다.
반드시 Google Search 도구로 오늘(${todayStr}) 및 ${timeframeLabel} 동안 네이버 실시간 검색, 유튜브 급상승 쇼츠, 인스타그램 릴스, 한국·글로벌 주요 뉴스에서 실제로 가장 크게 화제가 되고 있는 최신 인물 14~16명을 검색해 추천하세요.

[★ 실시간 사실 기반 브리핑 원칙]
1. ${categoryInstruction}
2. ${category !== 'all' ? `요청된 카테고리(${category})에 집중하고 category 필드는 반드시 '${category}'로 지정하세요.` : '전 카테고리 균형: SNS 바이럴·밈, 연예·가수, 배우·드라마, 스포츠, 경제·기업, 글로벌·셀럽, 사회·이슈 전 분야에서 오늘 가장 화제성 높은 인물을 골고루 선별하세요.'}
3. 옛날 과거 일화가 아니라 **지금(${todayStr} 기준 ${timeframeLabel}) 실제로 터진 최신 뉴스·논란·사건·스캔들·사임·경기·신곡·방송**을 반영하세요.
4. primaryChannel 필드는 반드시 'youtube', 'naver', 'instagram', 'multi' 중 하나의 소문자 영문 값으로 지정하세요.
5. buzzSummary에는 **"왜 지금 화제인지 + 확인된 날짜(또는 연도·기간)·구체적 숫자"** 팩트 1~2문장을 작성하세요(확인되지 않은 수치·날짜 날조 엄금).
6. hookLine에는 **첫 3초 만에 스크롤을 멈출 오프닝 훅 1줄(30~45자 내외)**을 작성하세요.
7. 반드시 아래와 같은 유효한 JSON 배열만 출력하세요(코드펜스 \`\`\` 나 설명 텍스트 절대 금지):
[
  {
    "name": "인물명",
    "title": "지금 왜 화제인지 한 줄 헤드라인",
    "category": "viral | entertainment | actor | sports | economy | social | global",
    "viralityScore": 91,
    "timeframe": "${timeframe}",
    "buzzSummary": "날짜·숫자 포함 실시간 화제 팩트 1~2문장",
    "controversyOrIssue": "핵심 논란/이슈/대중 반응",
    "suggestedAngle": "쇼츠/캐러셀 2차 창작 앵글",
    "hookLine": "첫 3초 오프닝 훅 1줄",
    "tags": ["태그1", "태그2", "태그3", "태그4"],
    "primaryChannel": "multi",
    "channelMetrics": {
      "naverRank": "네이버 동향",
      "youtubeViews": "유튜브 동향",
      "instaReels": "SNS/릴스 동향"
    }
  }
]`;

  const extractJsonArray = (raw: string) => {
    const cleaned = String(raw || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const s = cleaned.indexOf('[');
    const e = cleaned.lastIndexOf(']');
    if (s >= 0 && e > s) {
      return JSON.parse(cleaned.slice(s, e + 1));
    }
    const parsed = JSON.parse(cleaned);
    return Array.isArray(parsed) ? parsed : parsed?.figures || [];
  };

  const candidateModels = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-2.5-flash'];
  for (const mod of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: mod,
        contents: prompt,
        config: {
          temperature: 0.3,
          tools: [{ googleSearch: {} }],
        },
      });

      const parsed = extractJsonArray(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json(parsed.map((item: any) => ({ ...item, isLive: true })));
      }
    } catch (err: any) {
      console.warn(`Gemini trending fetch with googleSearch (${mod}) failed:`, err.message);
      try {
        const response = await ai.models.generateContent({
          model: mod,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.35,
          },
        });
        const parsed = extractJsonArray(response.text || '[]');
        if (Array.isArray(parsed) && parsed.length > 0) {
          return NextResponse.json(parsed.map((item: any) => ({ ...item, isLive: true })));
        }
      } catch (err2: any) {
        console.warn(`Gemini trending fallback (${mod}) failed:`, err2.message);
      }
    }
  }

  return NextResponse.json(fallbackList);
}
