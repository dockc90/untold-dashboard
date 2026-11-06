import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Trophy, 
  Sparkles, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  RotateCcw, 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp, 
  Zap, 
  HeartHandshake,
  Check
} from 'lucide-react';

interface RoutineTask {
  id: string;
  timeEstimate: string; // e.g. "3분", "5분"
  phase: '기획·발굴' | '대본·카피' | '에셋·보이스' | '제작·렌더링' | '업로드·분석';
  title: string;
  description: string;
  proTip: string;
  completed: boolean;
  isCustom?: boolean;
}

const DEFAULT_TASKS: RoutineTask[] = [
  {
    id: 'task-1',
    timeEstimate: '3분',
    phase: '기획·발굴',
    title: '1. 트렌드 레이더에서 화제성 95+ 인물 1명 선정하기',
    description: '네이버 실시간 검색 급상승, 유튜브 쇼츠 조회수 100만 뷰 이상 바이럴 인물 중 서사가 매력적인 1명을 픽업합니다.',
    proTip: '💡 내가 좋아하는 사람이 아니라, 지금 알고리즘이 밀어주는 인물을 고르는 것이 조회수의 90%를 결정합니다.',
    completed: false
  },
  {
    id: 'task-2',
    timeEstimate: '5분',
    phase: '대본·카피',
    title: '2. Untold AI 대본 생성 & 시청자 이탈 방지 3초 후킹(Hook) 선택',
    description: '타겟 페르소나(4060 감동/1020 도파민)를 선택하고 대본을 생성한 뒤, 가장 도발적인 질문형 후킹을 클릭합니다.',
    proTip: '💡 첫 3초 안에 시청자를 멈추게 하지 못하면 스와이프됩니다. 1번 씬의 문장을 소리 내어 읽어보세요.',
    completed: false
  },
  {
    id: 'task-3',
    timeEstimate: '10분',
    phase: '에셋·보이스',
    title: '3. 씬별 에셋 사진 10~12장 수집 & 모션 효과 부여',
    description: '구글 이미지 검색 버튼을 눌러 인물의 과거 무명 시절, 눈물, 전성기 사진을 저장하고 각 씬에 업로드합니다.',
    proTip: '💡 방송사 영상 대신 사진 3초 전환 + 슬로우 줌인 모션을 사용해야 유튜브 채널 정지 없이 100% 안전합니다.',
    completed: false
  },
  {
    id: 'task-4',
    timeEstimate: '2분',
    phase: '에셋·보이스',
    title: '4. 성우 30명 중 최적 보이스 선택 & 1.1x 배속 설정',
    description: '인물의 분위기에 맞는 성우(감동 다큐: 김민준, 숏폼 도파민: 박진우)를 선택하고 1.1x~1.2x 배속을 맞춥니다.',
    proTip: '💡 1.1x 배속은 쇼츠 시청자가 지루함을 느끼지 않고 완독률을 80% 이상으로 끌어올리는 황금 배속입니다.',
    completed: false
  },
  {
    id: 'task-5',
    timeEstimate: '3분',
    phase: '제작·렌더링',
    title: '5. 1080p 고화질 쇼츠 영상 제작 & 다운로드 완료',
    description: '상단 텍스트 없이 깔끔한 9:16 세로 화면과 또렷한 자막, 합성 음성이 들어간 최종 영상 파일을 다운로드합니다.',
    proTip: '💡 1080p FHD 화질로 출력해야 유튜브 쇼츠 및 인스타 릴스 추천 피드에서 고화질 가산점을 받습니다.',
    completed: false
  },
  {
    id: 'task-6',
    timeEstimate: '5분',
    phase: '업로드·분석',
    title: '6. 유튜브 쇼츠 업로드 & 2026 알고리즘 치트키(CTR 15%+ 제목·검색 SEO·논쟁 고정댓글) 세팅',
    description: '유튜브 스튜디오에 영상을 올리고 후킹성 제목 1위, 검색 색인용 첫 2줄 SEO, 시청자 댓글 논쟁을 폭발시키는 고정 댓글과 클린 태그 3개를 원클릭 복사하여 세팅합니다.',
    proTip: '💡 과거 30개 해시태그 도배는 스팸 필터링 대상입니다! 검색 색인용 클린 태그 3개와 시청자가 참여할 수밖에 없는 A vs B 논쟁 고정 댓글이 추천 알고리즘의 핵심입니다.',
    completed: false
  },
  {
    id: 'task-7',
    timeEstimate: '2분',
    phase: '업로드·분석',
    title: '7. 퇴근 후 시청 지속 시간(AVD) 지표 체크 & 내일 소재 찜해두기',
    description: '업로드 3시간 후 유튜브 통계에서 평균 조회율 85% 이상인지 확인하고, 트렌드 레이더에서 내일 만들 인물을 찜합니다.',
    proTip: '💡 초반 10편은 조회수가 낮아도 정상입니다! 알고리즘이 채널 성격을 파악하는 30일 동안 매일 1편씩 쌓으세요.',
    completed: false
  }
];

const MOTIVATION_QUOTES = [
  '“완벽하게 하려다 한 편도 못 올리는 사람보다, 약간 부족해도 매일 올리는 사람이 유튜브를 정복합니다.”',
  '“수익 창출된 유튜버들도 첫 달엔 조회수 100회였습니다. 30편이 쌓이는 순간 알고리즘이 폭발합니다.”',
  '“하루 30분, 출퇴근 시간이나 점심시간을 활용해 월 300~500만 원의 파이프라인을 만드는 중입니다.”',
  '“오늘 당신이 만든 1편의 쇼츠가 잠든 사이에도 당신을 위해 24시간 일해줄 것입니다.”',
  '“작심삼일도 10번 반복하면 한 달이 되고, 100번 반복하면 1년이 됩니다. 오늘만 해냅시다!”'
];

const STORAGE_KEY_ROUTINE = 'heypapa_routine_tasks_v2';
const STORAGE_KEY_STREAK = 'heypapa_routine_streak_v2';

export const DailyRoutineChecklist: React.FC = () => {
  const [tasks, setTasks] = useState<RoutineTask[]>(DEFAULT_TASKS);
  const [streakDays, setStreakDays] = useState<number>(3);
  const [newCustomTaskTitle, setNewCustomTaskTitle] = useState('');
  const [randomQuote, setRandomQuote] = useState(MOTIVATION_QUOTES[0]);
  const [copiedNote, setCopiedNote] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const savedTasks = localStorage.getItem(STORAGE_KEY_ROUTINE);
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
      const savedStreak = localStorage.getItem(STORAGE_KEY_STREAK);
      if (savedStreak) {
        setStreakDays(parseInt(savedStreak, 10));
      }
      const savedNote = localStorage.getItem('heypapa_quick_note');
      if (savedNote) {
        setQuickNote(savedNote);
      }
    } catch (e) {
      console.warn('Failed to load routine data:', e);
    }

    // Set daily quote
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    setRandomQuote(MOTIVATION_QUOTES[dayOfYear % MOTIVATION_QUOTES.length]);
  }, []);

  // Save to localStorage
  const saveTasks = (newTasks: RoutineTask[]) => {
    setTasks(newTasks);
    try {
      localStorage.setItem(STORAGE_KEY_ROUTINE, JSON.stringify(newTasks));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    saveTasks(updated);

    // If all tasks completed, auto boost streak
    const allDone = updated.every((t) => t.completed);
    if (allDone) {
      const nextStreak = streakDays + 1;
      setStreakDays(nextStreak);
      localStorage.setItem(STORAGE_KEY_STREAK, nextStreak.toString());
    }
  };

  const resetAllTasks = () => {
    if (confirm('오늘의 체크리스트를 초기화하고 내일의 새로운 도전을 시작하시겠습니까?')) {
      const reset = tasks.map((t) => ({ ...t, completed: false }));
      saveTasks(reset);
    }
  };

  const handleAddCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomTaskTitle.trim()) return;

    const newTask: RoutineTask = {
      id: `custom-task-${Date.now()}`,
      timeEstimate: '자유',
      phase: '기획·발굴',
      title: newCustomTaskTitle.trim(),
      description: '내가 직접 추가한 오늘의 목표 할 일',
      proTip: '💡 작은 실행이 모여 큰 성과를 만듭니다.',
      completed: false,
      isCustom: true
    };

    saveTasks([...tasks, newTask]);
    setNewCustomTaskTitle('');
  };

  const handleDeleteTask = (id: string) => {
    saveTasks(tasks.filter((t) => t.id !== id));
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = Math.round((completedCount / (tasks.length || 1)) * 100);

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 animate-fadeIn pb-12">
      {/* Top Banner: 작심삼일 타파 & 스트릭 카운터 */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-500 via-indigo-600 to-indigo-800 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black">
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>작심삼일 완치 솔루션 • 1일 1쇼츠 30분 루틴</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              끈기 걱정 끝! 하루 딱 7단계만 체크하세요.
            </h1>
            <p className="text-indigo-100 text-xs sm:text-sm leading-relaxed font-medium">
              영상 1편을 기획하고 업로드하는 데 필요한 전 과정을 30분 단위 체크리스트로 분해했습니다. 
              고민하지 말고 버튼을 누르며 하나씩 지워나가면 오늘도 1편 완성입니다!
            </p>
          </div>

          {/* Streak & Completion Card */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center min-w-[120px]">
              <div className="flex items-center justify-center space-x-1 text-amber-300 mb-1">
                <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black">연속 제작</span>
              </div>
              <div className="text-3xl font-black">{streakDays}일차</div>
              <div className="text-[10px] text-indigo-200 font-semibold mt-0.5">매일 파이프라인 누적 중</div>
            </div>

            <div className="flex-1 md:flex-initial p-4 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 text-center min-w-[120px]">
              <div className="flex items-center justify-center space-x-1 text-emerald-300 mb-1">
                <Trophy className="w-5 h-5 text-emerald-300" />
                <span className="text-xs font-black">오늘 달성률</span>
              </div>
              <div className="text-3xl font-black">{progressPercent}%</div>
              <div className="text-[10px] text-emerald-200 font-semibold mt-0.5">{completedCount}/{tasks.length}개 완료</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-5 border-t border-white/20">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span>오늘의 쇼츠 제작 진행 현황</span>
            <span>{completedCount === tasks.length ? '🎉 오늘의 쇼츠 업로드 미션 완료!' : `${tasks.length - completedCount}개 단계 남음`}</span>
          </div>
          <div className="w-full bg-black/30 rounded-full h-3 overflow-hidden p-0.5">
            <div 
              className="bg-gradient-to-r from-amber-300 via-rose-300 to-emerald-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Motivation Quote Box */}
      <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center space-x-3 text-amber-900 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-amber-400/30 flex items-center justify-center text-amber-700 shrink-0 font-bold">
          <Sparkles className="w-4 h-4 fill-amber-500 text-amber-600" />
        </div>
        <p className="text-xs font-bold leading-relaxed">
          {randomQuote}
        </p>
      </div>

      {/* Routine Grid: Left Tasks, Right Quick Sticky Note & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tasks List (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                1일 1쇼츠 30분 마스터 체크리스트
              </h3>
            </div>
            <button
              onClick={resetAllTasks}
              className="flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
              title="모든 체크박스 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>새로운 날 초기화</span>
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  task.completed
                    ? 'bg-slate-100/90 border-slate-300 opacity-80'
                    : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleTask(task.id);
                    }}
                    className={`mt-0.5 w-6 h-6 rounded-lg border flex items-center justify-center transition shrink-0 ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'bg-white border-slate-300 hover:border-indigo-500'
                    }`}
                  >
                    {task.completed ? <Check className="w-4 h-4 stroke-[3]" /> : null}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-extrabold ${task.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          {task.phase}
                        </span>
                      </div>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        ⏱️ {task.timeEstimate}
                      </span>
                    </div>

                    <p className={`text-xs ${task.completed ? 'text-slate-400 line-through' : 'text-slate-600 font-medium'}`}>
                      {task.description}
                    </p>

                    <div className="pt-1.5 text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-xl border border-amber-100 font-medium leading-relaxed">
                      {task.proTip}
                    </div>
                  </div>

                  {task.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTask(task.id);
                      }}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom To-Do Input */}
          <form onSubmit={handleAddCustomTask} className="flex items-center space-x-2 pt-2">
            <input
              type="text"
              value={newCustomTaskTitle}
              onChange={(e) => setNewCustomTaskTitle(e.target.value)}
              placeholder="나만의 맞춤 목표 추가 (예: 쇼츠 1편 릴스 및 틱톡에도 동시 업로드하기)"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 shadow-2xs"
            />
            <button
              type="submit"
              className="flex items-center space-x-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>할 일 추가</span>
            </button>
          </form>
        </div>

        {/* Right Column: Weekly Habit Chain & Creator Sticky Notes (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* 7-Day Habit Visualizer */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <span>이번 주 쇼츠 업로드 체인</span>
              </h4>
              <span className="text-[11px] font-bold text-slate-500">목표: 7편/주</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {['월', '화', '수', '목', '금', '토', '일'].map((day, idx) => {
                const isPassed = idx < streakDays;
                return (
                  <div key={day} className="space-y-1">
                    <div className="text-[10px] font-bold text-slate-500">{day}</div>
                    <div className={`w-8 h-8 mx-auto rounded-xl flex items-center justify-center font-extrabold text-xs transition ${
                      isPassed 
                        ? 'bg-rose-500 text-white shadow-xs ring-2 ring-rose-200' 
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}>
                      {isPassed ? '🔥' : idx + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center">
              하루도 빼놓지 않고 불꽃 체인을 연결하면 알고리즘의 간택을 받습니다!
            </p>
          </div>

          {/* Quick Creator Sticky Memo */}
          <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <span>📝 오늘 떠오른 쇼츠 아이디어 메모</span>
              </h4>
              <span className="text-[10px] text-amber-700 font-bold">자동 저장</span>
            </div>
            <textarea
              rows={5}
              value={quickNote}
              onChange={(e) => {
                setQuickNote(e.target.value);
                localStorage.setItem('heypapa_quick_note', e.target.value);
              }}
              placeholder="예: 곽튜브 최근 영상 복귀 반응 좋음, 성심당 대표 인터뷰 2차 영상 만들 것, 박진우 성우 1.2x 배속 반응 최고..."
              className="w-full bg-white/90 border border-amber-200 rounded-xl p-3 text-xs text-slate-900 leading-relaxed focus:outline-none focus:border-amber-500 font-medium"
            />
            <div className="flex items-center justify-between text-[11px] text-amber-800 font-medium">
              <span>브라우저를 닫아도 안전하게 보관됩니다.</span>
            </div>
          </div>

          {/* 3대 절대 실패 방지 수칙 */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-3 shadow-md">
            <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>포기 방지 3대 황금 수칙</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside leading-relaxed font-medium">
              <li>
                <strong className="text-white">기분에 휘둘리지 말 것:</strong> 영감이 안 떠올라도 Untold 트렌드 1위를 그냥 누르고 30분 안에 끝내세요.
              </li>
              <li>
                <strong className="text-white">초반 30편은 무조건 숫자 싸움:</strong> 1편에 목숨 걸지 말고, 30편을 올린 뒤 조회수 높은 상위 20%를 분석하세요.
              </li>
              <li>
                <strong className="text-white">완벽주의 버리기:</strong> 80점짜리 영상 10개가 100점짜리 영상 1개보다 10배 많은 수익을 가져다줍니다.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
