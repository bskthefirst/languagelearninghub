const STORAGE_KEY = "japaneseHubDataV1";
const ACTIVE_USER_KEY = "japaneseHubActiveUserId";
const UI_LANG_KEY = "japaneseHubUiLang";
const LAST_LIST_KEY = "japaneseHubLastUsedListId";
const ALLOWED_RUBY_TAGS = new Set(["ruby", "rb", "rt", "rp", "br"]);
const RE_JAPANESE_CHARS = /[\u3040-\u30ff\u3400-\u9fff]/;
const RE_LATIN_CHARS = /[A-Za-z]/;
const ARTILLERY_CAMPAIGN_KEY = "japaneseHubArtilleryCampaignV1";
const FORTRESS_STATS_KEY = "japaneseHubFortressStatsV1";
const FORTRESS_GRAVITY = 19;
const FORTRESS_WIND_ACCEL = 0.14;
const FORTRESS_SPEED_MULT = 1.28;
const API_BASE_RAW = String(
  (typeof window !== "undefined" && window.LANGUAGE_HUB_API_BASE) || ""
).trim();
const API_BASE = API_BASE_RAW.replace(/\/+$/, "");

function apiUrl(path) {
  const route = String(path || "");
  if (!route) return API_BASE || "";
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}

const FORTRESS_CAMPAIGN_STAGES = [
  {
    key: "village-crossroads",
    name: "Village Crossroads",
    terrainProfile: "crossroads",
    enemyHp: 100,
    playerHp: 100,
    weatherPool: ["clear", "gusts", "dawn"],
    briefing: "Secure the roads and break the forward battery.",
  },
  {
    key: "ridge-assault",
    name: "Ridge Assault",
    terrainProfile: "ridge",
    enemyHp: 108,
    playerHp: 100,
    weatherPool: ["gusts", "dawn", "clear"],
    briefing: "Enemy guns hold a high rise behind stone barriers.",
  },
  {
    key: "muddy-riverline",
    name: "Muddy Riverline",
    terrainProfile: "mudflats",
    enemyHp: 110,
    playerHp: 102,
    weatherPool: ["mud", "gusts", "clear"],
    briefing: "Wheel drag is severe. Manage powder and timing.",
  },
  {
    key: "fortress-heights",
    name: "Fortress Heights",
    terrainProfile: "fortress",
    enemyHp: 118,
    playerHp: 105,
    weatherPool: ["dawn", "gusts", "mud"],
    briefing: "Final battery line. Survive and silence all guns.",
  },
];
const FORTRESS_WEATHER_TYPES = {
  clear: {
    key: "clear",
    name: "Clear Sky",
    gustChance: 0.08,
    windShift: 1,
    misfireChance: 0,
    aimSpeedMult: 1,
    powerMult: 1,
    previewRatio: 1,
    aiJitter: 1,
    vignette: 0,
    description: "Stable wind and full visibility.",
  },
  gusts: {
    key: "gusts",
    name: "Crosswind Gusts",
    gustChance: 0.55,
    windShift: 3,
    misfireChance: 0.01,
    aimSpeedMult: 0.95,
    powerMult: 0.98,
    previewRatio: 0.95,
    aiJitter: 1.2,
    vignette: 0.06,
    description: "Wind can jump each turn.",
  },
  mud: {
    key: "mud",
    name: "Wet Powder & Mud",
    gustChance: 0.22,
    windShift: 2,
    misfireChance: 0.13,
    aimSpeedMult: 0.78,
    powerMult: 0.92,
    previewRatio: 0.9,
    aiJitter: 1.15,
    vignette: 0.1,
    description: "Slow handling and occasional misfires.",
  },
  dawn: {
    key: "dawn",
    name: "Low-Visibility Dawn",
    gustChance: 0.2,
    windShift: 2,
    misfireChance: 0.02,
    aimSpeedMult: 0.88,
    powerMult: 0.98,
    previewRatio: 0.78,
    aiJitter: 1.4,
    vignette: 0.18,
    description: "Fog limits trajectory reading.",
  },
};
const ARTILLERY_CONDITIONS = [
  {
    key: "clear",
    name: "Clear Sky",
    description: "Stable aim and normal reload rhythm.",
    attackMult: 1.0,
    enemyFireMult: 1.0,
    misfireBonus: 0,
  },
  {
    key: "fog",
    name: "Morning Fog",
    description: "Visibility drops. Long-range accuracy suffers.",
    attackMult: 0.94,
    enemyFireMult: 0.94,
    misfireBonus: 0.02,
  },
  {
    key: "mud",
    name: "Muddy Ground",
    description: "Gun crews move slower and misfire risk rises.",
    attackMult: 0.9,
    enemyFireMult: 0.9,
    misfireBonus: 0.04,
  },
  {
    key: "highground",
    name: "High Ground",
    description: "Battery has better line of fire.",
    attackMult: 1.08,
    enemyFireMult: 0.96,
    misfireBonus: -0.01,
  },
];
const ARTILLERY_PHASES = [
  {
    key: "deployment",
    name: "Deployment",
    description: "Crews settle guns and verify line of fire.",
    playerFireMult: 0.92,
    enemyFireMult: 0.88,
  },
  {
    key: "bombardment",
    name: "Bombardment",
    description: "Sustained exchange with heavy smoke and pressure.",
    playerFireMult: 1.0,
    enemyFireMult: 1.0,
  },
  {
    key: "decisive",
    name: "Decisive Clash",
    description: "Close pressure. One clean volley can break morale.",
    playerFireMult: 1.08,
    enemyFireMult: 1.1,
  },
];
const I18N = {
  en: {
    "app.title": "Bill's Language Learning Hub",
    "app.subtitle": "Retro desk for your English and Japanese words",
    "lang.enAria": "Switch to English",
    "lang.koAria": "Switch to Korean",
    "users.label": "Users",
    "users.placeholder": "new username",
    "users.add": "Add",
    "users.noUsersYet": "No users yet.",
    "users.deleteConfirm": "Are you sure you want to delete {name}'s profile?",
    "users.deleteAria": "Delete {name}",
    "users.networkError": "Cannot reach the local server. Please refresh or restart app.py.",
    "users.createFailedHttp": "Could not create user (HTTP {code}).",
    "users.deleteFailedHttp": "Could not delete user (HTTP {code}).",
    "nav.search": "🔎 Search",
    "nav.searchSub": "Lookup",
    "nav.lists": "📚 Lists",
    "nav.listsSub": "Folders",
    "nav.history": "🕘 History",
    "nav.historySub": "Searched",
    "nav.flashcards": "🃏 Flashcards",
    "nav.flashcardsSub": "Flip",
    "nav.quiz": "🧠 Quiz",
    "nav.quizSub": "Score",
    "nav.eggAria": "Hidden fortress game",
    "search.title": "Dictionary Search",
    "search.placeholder": "Search word...",
    "search.btn": "Search",
    "search.sourceDefault": "Source: Naver dictionary (auto Japanese/English)",
    "search.enterWord": "Enter a word to search.",
    "search.searching": "Searching Naver dictionary...",
    "search.failed": "Search failed.",
    "search.noResults": "No results were parsed for this word.",
    "search.showingResults": "Showing {count} result(s) for “{query}” in {mode} mode.",
    "search.foundResults": "Found {count} result(s) in {mode} mode.",
    "search.sourceHint": "Source: {source} (via local proxy endpoint)",
    "search.networkProxy": "Network error while contacting the local proxy.",
    "search.modeEnglish": "English",
    "search.modeJapanese": "Japanese",
    "api.statusChecking": "API checking...",
    "api.statusConnected": "API connected",
    "api.statusDisconnected": "API disconnected",
    "word.noExample": "No example sentence",
    "common.list": "List",
    "common.start": "Start",
    "common.reset": "Reset",
    "common.fire": "Fire",
    "common.add": "Add",
    "common.added": "Added",
    "common.chooseList": "Choose list",
    "common.createListFirst": "Create list first",
    "common.noFurigana": "No furigana",
    "common.noMeaning": "No meaning",
    "common.savedSearch": "Saved search",
    "common.listenWord": "Listen to word",
    "lists.title": "Word Lists",
    "lists.placeholder": "Create a new list name...",
    "lists.create": "Create List",
    "lists.exportJson": "Export JSON",
    "lists.exportCsv": "Export CSV",
    "lists.import": "Import",
    "lists.importConfirmReplace":
      "Import and replace current lists/history for this profile?\nPress Cancel to keep current data.",
    "lists.importDone": "Import complete.",
    "lists.importFailed": "Import failed. Check file format.",
    "lists.importCsvDefaultList": "Imported CSV",
    "lists.nameExists": "List name already exists.",
    "lists.noListYet": "No list yet. Create one first.",
    "lists.noWordsYet": "No words in this list yet.",
    "lists.deleteListTitle": "Delete list",
    "lists.deleteListConfirm": "Delete list \"{name}\"?",
    "lists.renameListTitle": "Rename list",
    "lists.renameListPrompt": "Enter a new name for \"{name}\"",
    "lists.wordExists": "This word is already in that list.",
    "lists.createListBeforeAdd": "Create a list first, then add the word.",
    "lists.mergeConfirm":
      "\"{word}\" already exists in this list with a different sense.\n\nPress OK to merge as another sense.\nPress Cancel for more options.",
    "lists.keepSeparateConfirm": "Keep as a separate entry?\nPress Cancel to skip adding.",
    "lists.pinRefreshWarn": "This example is pinned. Unpin it first to refresh.",
    "lists.noBetterExample": "No better example found right now.",
    "lists.badgePinned": "Pinned",
    "lists.badgeAdaptive": "Adaptive",
    "lists.newExample": "New example",
    "lists.pin": "Pin",
    "lists.unpin": "Unpin",
    "lists.removeWordTitle": "Remove word",
    "history.title": "Searched Words",
    "history.hint": "Only exact terms you typed are saved here.",
    "history.noHistory": "No search history yet.",
    "history.searchAgain": "Search Again",
    "history.deleteTitle": "Delete from history",
    "flash.title": "Flashcards",
    "flash.noCard": "No card",
    "flash.flipHint": "Click or press space to flip",
    "flash.addWordsLine1": "Add words to a list",
    "flash.addWordsLine2": "Then you can flip cards here.",
    "flash.metaEmpty": "0 / 0 cards",
    "flash.randomOff": "Random: Off",
    "flash.randomOn": "Random: On",
    "quiz.title": "Quiz",
    "quiz.mode": "Mode",
    "quiz.modeStandard": "Standard Quiz",
    "quiz.modeGame": "Game Quiz (Speed Match)",
    "quiz.modeBattery": "Game Quiz (Battery Command)",
    "quiz.hintDefault": "Select a list with at least 4 words, then click Start Quiz.",
    "quiz.needAtLeast4": "Quiz needs at least 4 words in the selected list.",
    "quiz.needGame4": "Game quiz needs at least 4 words with meanings in the selected list.",
    "quiz.needBattery4": "Battery Command needs at least 4 words with meanings in the selected list.",
    "quiz.setupAddWords": "Add words to a list, then start the quiz.",
    "quiz.setupGameMode":
      "Game mode: match word tiles to meaning tiles. Selected list has {count} word(s). Click Start.",
    "quiz.setupBatteryMode":
      "Battery Command: answer correctly to load cannons, then fire at enemy morale. Selected list has {count} word(s). Click Start.",
    "quiz.setupStandardMode": "Standard mode: selected list has {count} word(s). Click Start.",
    "quiz.correct": "Correct.",
    "quiz.wrong": "Wrong. Correct answer: {answer}",
    "fortress.title": "Fortress (Easter Egg)",
    "fortress.hint": "Press Start, then press Space or tap to fire.",
    "fortress.startGame": "Start Game",
    "fortress.pressStart": "Press Start to begin.",
    "fortress.lockedAngle": "Angle locked.",
    "fortress.yourTurn": "Your turn: press Space or tap to fire.",
  },
  ko: {
    "app.title": "Bill의 언어 학습 허브",
    "app.subtitle": "영어와 일본어 단어를 위한 레트로 데스크",
    "lang.enAria": "영어로 전환",
    "lang.koAria": "한국어로 전환",
    "users.label": "사용자",
    "users.placeholder": "새 사용자 이름",
    "users.add": "추가",
    "users.noUsersYet": "사용자가 아직 없습니다.",
    "users.deleteConfirm": "{name} 프로필을 삭제할까요?",
    "users.deleteAria": "{name} 삭제",
    "users.networkError": "로컬 서버에 연결할 수 없습니다. 새로고침하거나 app.py를 다시 실행해주세요.",
    "users.createFailedHttp": "사용자를 생성하지 못했습니다 (HTTP {code}).",
    "users.deleteFailedHttp": "사용자를 삭제하지 못했습니다 (HTTP {code}).",
    "nav.search": "🔎 검색",
    "nav.searchSub": "사전 조회",
    "nav.lists": "📚 리스트",
    "nav.listsSub": "폴더",
    "nav.history": "🕘 기록",
    "nav.historySub": "검색어",
    "nav.flashcards": "🃏 플래시카드",
    "nav.flashcardsSub": "뒤집기",
    "nav.quiz": "🧠 퀴즈",
    "nav.quizSub": "점수",
    "nav.eggAria": "숨겨진 포트리스 게임",
    "search.title": "사전 검색",
    "search.placeholder": "단어 검색...",
    "search.btn": "검색",
    "search.sourceDefault": "출처: 네이버 사전 (일본어/영어 자동)",
    "search.enterWord": "검색할 단어를 입력해주세요.",
    "search.searching": "네이버 사전을 검색 중...",
    "search.failed": "검색에 실패했습니다.",
    "search.noResults": "이 단어의 결과를 찾지 못했습니다.",
    "search.showingResults": "{mode} 모드에서 “{query}” 결과 {count}개를 표시합니다.",
    "search.foundResults": "{mode} 모드에서 결과 {count}개를 찾았습니다.",
    "search.sourceHint": "출처: {source} (로컬 프록시 사용)",
    "search.networkProxy": "로컬 프록시 서버 연결 중 네트워크 오류가 발생했습니다.",
    "search.modeEnglish": "영어",
    "search.modeJapanese": "일본어",
    "api.statusChecking": "API 연결 확인 중...",
    "api.statusConnected": "API 연결됨",
    "api.statusDisconnected": "API 연결 끊김",
    "word.noExample": "예문 없음",
    "common.list": "리스트",
    "common.start": "시작",
    "common.reset": "초기화",
    "common.fire": "발사",
    "common.add": "추가",
    "common.added": "추가됨",
    "common.chooseList": "리스트 선택",
    "common.createListFirst": "먼저 리스트를 만드세요",
    "common.noFurigana": "후리가나 없음",
    "common.noMeaning": "뜻 없음",
    "common.savedSearch": "저장된 검색",
    "common.listenWord": "단어 듣기",
    "lists.title": "단어 리스트",
    "lists.placeholder": "새 리스트 이름 만들기...",
    "lists.create": "리스트 생성",
    "lists.exportJson": "JSON 내보내기",
    "lists.exportCsv": "CSV 내보내기",
    "lists.import": "가져오기",
    "lists.importConfirmReplace":
      "이 프로필의 현재 리스트/기록을 가져온 파일로 교체할까요?\n취소를 누르면 현재 데이터가 유지됩니다.",
    "lists.importDone": "가져오기가 완료되었습니다.",
    "lists.importFailed": "가져오기에 실패했습니다. 파일 형식을 확인하세요.",
    "lists.importCsvDefaultList": "CSV 가져오기",
    "lists.nameExists": "이미 존재하는 리스트 이름입니다.",
    "lists.noListYet": "리스트가 없습니다. 먼저 생성해 주세요.",
    "lists.noWordsYet": "이 리스트에는 단어가 아직 없습니다.",
    "lists.deleteListTitle": "리스트 삭제",
    "lists.deleteListConfirm": "\"{name}\" 리스트를 삭제할까요?",
    "lists.renameListTitle": "리스트 이름 변경",
    "lists.renameListPrompt": "\"{name}\"의 새 이름을 입력하세요",
    "lists.wordExists": "이 단어는 이미 해당 리스트에 있습니다.",
    "lists.createListBeforeAdd": "먼저 리스트를 만든 뒤 단어를 추가하세요.",
    "lists.mergeConfirm":
      "\"{word}\"가 이미 리스트에 다른 뜻으로 존재합니다.\n\n확인을 누르면 뜻을 병합합니다.\n취소를 누르면 다른 옵션이 표시됩니다.",
    "lists.keepSeparateConfirm": "별도 항목으로 유지할까요?\n취소를 누르면 추가하지 않습니다.",
    "lists.pinRefreshWarn": "이 예문은 고정되어 있습니다. 새로 가져오려면 고정을 해제하세요.",
    "lists.noBetterExample": "지금은 더 좋은 예문을 찾지 못했습니다.",
    "lists.badgePinned": "고정됨",
    "lists.badgeAdaptive": "자동",
    "lists.newExample": "새 예문",
    "lists.pin": "고정",
    "lists.unpin": "해제",
    "lists.removeWordTitle": "단어 삭제",
    "history.title": "검색한 단어",
    "history.hint": "직접 입력해 검색한 단어만 여기에 저장됩니다.",
    "history.noHistory": "검색 기록이 아직 없습니다.",
    "history.searchAgain": "다시 검색",
    "history.deleteTitle": "기록에서 삭제",
    "flash.title": "플래시카드",
    "flash.noCard": "카드 없음",
    "flash.flipHint": "클릭하거나 스페이스로 뒤집기",
    "flash.addWordsLine1": "리스트에 단어를 추가하세요",
    "flash.addWordsLine2": "그 다음 여기서 카드를 뒤집을 수 있어요.",
    "flash.metaEmpty": "0 / 0 카드",
    "flash.randomOff": "랜덤: 끔",
    "flash.randomOn": "랜덤: 켬",
    "quiz.title": "퀴즈",
    "quiz.mode": "모드",
    "quiz.modeStandard": "기본 퀴즈",
    "quiz.modeGame": "게임 퀴즈 (스피드 매치)",
    "quiz.modeBattery": "게임 퀴즈 (포대 지휘)",
    "quiz.hintDefault": "단어 4개 이상 있는 리스트를 선택한 뒤 시작을 누르세요.",
    "quiz.needAtLeast4": "선택한 리스트에 단어가 최소 4개 필요합니다.",
    "quiz.needGame4": "게임 퀴즈는 뜻이 있는 단어 4개 이상이 필요합니다.",
    "quiz.needBattery4": "포대 지휘 모드는 뜻이 있는 단어 4개 이상이 필요합니다.",
    "quiz.setupAddWords": "리스트에 단어를 추가한 뒤 퀴즈를 시작하세요.",
    "quiz.setupGameMode":
      "게임 모드: 단어 타일과 뜻 타일을 맞추세요. 선택한 리스트 단어 {count}개. 시작을 누르세요.",
    "quiz.setupBatteryMode":
      "포대 지휘: 정답으로 포를 장전하고 적 사기를 무너뜨리세요. 선택한 리스트 단어 {count}개. 시작을 누르세요.",
    "quiz.setupStandardMode": "기본 모드: 선택한 리스트 단어 {count}개. 시작을 누르세요.",
    "quiz.correct": "정답입니다.",
    "quiz.wrong": "오답입니다. 정답: {answer}",
    "fortress.title": "포트리스 (이스터에그)",
    "fortress.hint": "시작을 누른 뒤 스페이스 또는 터치로 발사하세요.",
    "fortress.startGame": "게임 시작",
    "fortress.pressStart": "시작 버튼을 눌러 전투를 시작하세요.",
    "fortress.lockedAngle": "각도 고정.",
    "fortress.yourTurn": "내 턴: 스페이스 또는 터치로 발사하세요.",
  },
};
let remoteSaveTimer = null;
let remoteHydrated = false;
let apiProbeTimer = null;
const flashSwipe = {
  pointerId: null,
  active: false,
  moved: false,
  startX: 0,
  startY: 0,
  dx: 0,
  dy: 0,
  ignoreClickUntil: 0,
};
const rubyBackfillCache = new Map();
const wordAudioResolveCache = new Map();
const wordAudioResolveInFlight = new Map();
const nativeAudioCache = new Map();
let rubyBackfillRunning = false;
const artilleryCampaign = loadArtilleryCampaign();
const fortressStats = loadFortressStats();

function createInitialFortressState() {
  const worldWidth = 360;
  const playerX = 24;
  const enemyX = 336;
  const viewWidth = 168;
  const stage = FORTRESS_CAMPAIGN_STAGES[0];
  return {
    worldWidth,
    viewWidth,
    cameraX: Math.min(worldWidth - viewWidth / 2, playerX + viewWidth * 0.35),
    playerX,
    enemyX,
    playerHp: 100,
    enemyHp: 100,
    turn: "player",
    phase: "idle",
    battleStarted: false,
    startTime: 0,
    aimNorm: 0.5,
    aimDir: 1,
    aimSpeed: 0.32,
    powerNorm: 0.5,
    powerDir: 1,
    currentAngle: 50,
    enemyAngle: 42,
    currentPower: 72,
    aimStep: "angle",
    touchAimActive: false,
    touchAimMoved: false,
    wind: 0,
    windPhase: 0,
    viewHeight: 60,
    weather: FORTRESS_WEATHER_TYPES.clear,
    stage,
    stageIndex: 0,
    turnCount: 1,
    terrainHeights: [],
    walls: [],
    craters: [],
    projectile: null,
    projectileTrail: [],
    explosionParticles: [],
    impactRings: [],
    debrisParticles: [],
    floatingTexts: [],
    hitBanner: {
      text: "",
      life: 0,
      color: "#ffe372",
    },
    crew: {
      player: { phase: "idle", timer: 0, knockback: 0 },
      enemy: { phase: "idle", timer: 0, knockback: 0 },
    },
    parallax: {
      far: [],
      mid: [],
      clouds: [],
    },
    shakeTime: 0,
    shakePower: 0,
    hitPause: 0,
    timeScale: 1,
    slowMoTime: 0,
    screenGrime: 0,
    nowMs: 0,
    replayVisible: false,
    replayHint: "",
    shotHistory: [],
    impactHistory: [],
    activeShot: null,
    message: "Press Start to begin.",
    winner: "",
    lastImpact: null,
    lastTickMs: 0,
    rafId: 0,
    uiMounted: false,
  };
}

const state = { lists: [], history: [] };
const ui = {
  users: [],
  activeUserId: localStorage.getItem(ACTIVE_USER_KEY) || "",
  lang: localStorage.getItem(UI_LANG_KEY) === "ko" ? "ko" : "en",
  lastUsedListId: "",
  activeView: "search",
  searchResults: [],
  flashcard: {
    listId: "",
    index: 0,
    flipped: false,
    animating: false,
    pendingDelta: 0,
    randomized: false,
    order: [],
  },
  quiz: {
    listId: "",
    mode: "standard",
    deck: [],
    currentIndex: 0,
    score: 0,
    currentCorrect: "",
    currentOptions: [],
    answered: false,
    game: {
      tiles: [],
      firstIndex: -1,
      secondIndex: -1,
      matchedPairs: 0,
      attempts: 0,
      locked: false,
      pairTotal: 0,
      startTime: 0,
      endTime: 0,
    },
    artillery: {
      words: [],
      questionIndex: 0,
      enemyMorale: 100,
      playerMorale: 100,
      streak: 0,
      attempts: 0,
      correctAnswers: 0,
      distance: "far",
      ammo: {
        round: 0,
        shell: 0,
        canister: 0,
      },
      currentQuestion: null,
      awaitingShot: false,
      log: [],
      battleEnded: false,
      startTime: 0,
      endTime: 0,
    },
  },
  fortress: createInitialFortressState(),
  apiStatus: "checking",
};

const refs = {
  langToggle: document.getElementById("lang-toggle"),
  langButtons: document.querySelectorAll(".lang-pill[data-lang]"),
  navButtons: document.querySelectorAll(".icon-btn"),
  views: document.querySelectorAll(".view"),
  userList: document.getElementById("user-list"),
  apiIndicator: document.getElementById("api-indicator"),
  apiIndicatorText: document.getElementById("api-indicator-text"),
  userCreateForm: document.getElementById("user-create-form"),
  userNameInput: document.getElementById("user-name-input"),
  searchForm: document.getElementById("search-form"),
  searchInput: document.getElementById("search-input"),
  searchSourceHint: document.getElementById("search-source-hint"),
  searchStatus: document.getElementById("search-status"),
  searchResults: document.getElementById("search-results"),
  resultTemplate: document.getElementById("result-card-template"),
  createListForm: document.getElementById("create-list-form"),
  listNameInput: document.getElementById("list-name-input"),
  listsExportJsonBtn: document.getElementById("lists-export-json-btn"),
  listsExportCsvBtn: document.getElementById("lists-export-csv-btn"),
  listsImportBtn: document.getElementById("lists-import-btn"),
  listsImportInput: document.getElementById("lists-import-input"),
  listsArea: document.getElementById("lists-area"),
  listTemplate: document.getElementById("list-template"),
  historyArea: document.getElementById("history-area"),
  flashListSelect: document.getElementById("flashcard-list-select"),
  flashRandomBtn: document.getElementById("flash-random-btn"),
  flashMeta: document.getElementById("flashcard-meta"),
  flashCard: document.getElementById("flashcard"),
  flashScene: document.getElementById("flashcard-scene"),
  flashWord: document.getElementById("flash-word"),
  flashWordAudioBtn: document.getElementById("flash-word-audio-btn"),
  flashFuri: document.getElementById("flash-furi"),
  flashMeaning: document.getElementById("flash-meaning"),
  flashExampleJp: document.getElementById("flash-example-jp"),
  flashExampleKo: document.getElementById("flash-example-ko"),
  flashPrev: document.getElementById("flash-prev"),
  flashNext: document.getElementById("flash-next"),
  flashProgress: document.getElementById("flash-progress"),
  quizListSelect: document.getElementById("quiz-list-select"),
  quizModeSelect: document.getElementById("quiz-mode-select"),
  quizStartBtn: document.getElementById("quiz-start-btn"),
  quizArea: document.getElementById("quiz-area"),
  fortressRoot: document.getElementById("fortress-root"),
  fortressTopStartBtn: document.getElementById("fortress-top-start-btn"),
};

function t(key, vars = {}) {
  const pack = I18N[ui.lang] || I18N.en;
  const fallback = I18N.en || {};
  let text = pack[key] ?? fallback[key] ?? key;
  Object.entries(vars).forEach(([k, v]) => {
    text = text.replaceAll(`{${k}}`, String(v));
  });
  return text;
}

function applyStaticI18n() {
  document.documentElement.lang = ui.lang === "ko" ? "ko" : "en";
  if (document.body) {
    document.body.classList.toggle("lang-ko", ui.lang === "ko");
  }
  document.title = t("app.title");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (!key) return;
    el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (!key || !("placeholder" in el)) return;
    el.placeholder = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (!key) return;
    el.title = t(key);
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (!key) return;
    el.setAttribute("aria-label", t(key));
  });

  refs.langButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === ui.lang);
  });

  const fortressStart = document.querySelector('[data-fortress-action="start"]');
  if (fortressStart) fortressStart.textContent = t("common.start");
  const fortressReset = document.querySelector('[data-fortress-action="reset"]');
  if (fortressReset) fortressReset.textContent = t("common.reset");
  const fortressFire = document.querySelector('[data-fortress-action="fire"]');
  if (fortressFire) fortressFire.textContent = t("common.fire");
  updateApiIndicator();
}

function updateApiIndicator() {
  if (!refs.apiIndicator || !refs.apiIndicatorText) return;
  const status = ui.apiStatus === "connected" ? "connected" : ui.apiStatus === "disconnected" ? "disconnected" : "checking";
  refs.apiIndicator.classList.toggle("api-checking", status === "checking");
  refs.apiIndicator.classList.toggle("api-connected", status === "connected");
  refs.apiIndicator.classList.toggle("api-disconnected", status === "disconnected");
  const key = status === "connected" ? "api.statusConnected" : status === "disconnected" ? "api.statusDisconnected" : "api.statusChecking";
  refs.apiIndicatorText.textContent = t(key);
}

async function probeApiStatus() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2200);
  if (ui.apiStatus !== "connected") {
    ui.apiStatus = "checking";
    updateApiIndicator();
  }
  try {
    const response = await fetch(apiUrl("/api/users"), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
    ui.apiStatus = response.ok ? "connected" : "disconnected";
  } catch (_err) {
    ui.apiStatus = "disconnected";
  } finally {
    clearTimeout(timeout);
    updateApiIndicator();
  }
}

function scheduleApiProbe(delayMs = 0) {
  if (apiProbeTimer) {
    clearTimeout(apiProbeTimer);
  }
  apiProbeTimer = setTimeout(async () => {
    await probeApiStatus();
    scheduleApiProbe(ui.apiStatus === "connected" ? 18000 : 3500);
  }, Math.max(0, Number(delayMs) || 0));
}

function bindLanguageToggle() {
  const setLanguage = (next) => {
    const lang = next === "ko" ? "ko" : "en";
    if (lang === ui.lang) return;
    ui.lang = lang;
    localStorage.setItem(UI_LANG_KEY, ui.lang);
    applyStaticI18n();
    refreshAll();
  };

  refs.langButtons.forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const next = btn.dataset.lang === "ko" ? "ko" : "en";
      setLanguage(next);
    });
  });

  if (refs.langToggle) {
    refs.langToggle.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const pill = event.target.closest(".lang-pill[data-lang]");
      if (pill) {
        setLanguage(pill.dataset.lang === "ko" ? "ko" : "en");
        return;
      }
      setLanguage(ui.lang === "ko" ? "en" : "ko");
    });
  }
}

init();

async function init() {
  bindLanguageToggle();
  applyStaticI18n();
  scheduleApiProbe(0);
  bindUsers();
  bindNav();
  bindSearch();
  bindLists();
  bindFlashcards();
  bindGlobalShortcuts();
  bindQuiz();
  bindFortress();
  await hydrateUsers();
  hydrateArtilleryCampaignForUser(ui.activeUserId);
  hydrateFortressStatsForUser(ui.activeUserId);
  await hydrateStateFromServer();
  renderUsers();
  refreshAll();
  backfillMissingRubyForSavedWords();
  window.addEventListener("online", () => scheduleApiProbe(0));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) scheduleApiProbe(0);
  });
}

function userStorageKey(userId) {
  return `${STORAGE_KEY}_${String(userId || "default")}`;
}

function lastUsedListStorageKey(userId) {
  return `${LAST_LIST_KEY}_${String(userId || "default")}`;
}

function artilleryCampaignStorageKey(userId) {
  return `${ARTILLERY_CAMPAIGN_KEY}_${String(userId || "default")}`;
}

function fortressStatsStorageKey(userId) {
  return `${FORTRESS_STATS_KEY}_${String(userId || "default")}`;
}

function defaultArtilleryCampaign() {
  return {
    level: 1,
    xp: 0,
    battlesPlayed: 0,
    battlesWon: 0,
    unlocks: {
      round: true,
      shell: true,
      canister: false,
    },
    selectedCondition: "clear",
  };
}

function defaultFortressStats() {
  return {
    games: 0,
    wins: 0,
    quickestWinSec: 0,
    bestHpRemaining: 0,
    totalDamageDealt: 0,
    campaignStage: 0,
    campaignClears: 0,
    totalDirectHits: 0,
    bestAccuracy: 0,
    lastReplay: null,
  };
}

function sanitizeArtilleryCampaign(raw) {
  const defaults = defaultArtilleryCampaign();
  const source = raw && typeof raw === "object" ? raw : {};
  const unlocks = source.unlocks && typeof source.unlocks === "object" ? source.unlocks : {};
  const selectedCondition = String(source.selectedCondition || defaults.selectedCondition);
  return {
    level: Math.max(1, Number(source.level) || defaults.level),
    xp: Math.max(0, Number(source.xp) || defaults.xp),
    battlesPlayed: Math.max(0, Number(source.battlesPlayed) || defaults.battlesPlayed),
    battlesWon: Math.max(0, Number(source.battlesWon) || defaults.battlesWon),
    unlocks: {
      round: unlocks.round !== false,
      shell: unlocks.shell !== false,
      canister: Boolean(unlocks.canister),
    },
    selectedCondition: ARTILLERY_CONDITIONS.some((item) => item.key === selectedCondition)
      ? selectedCondition
      : defaults.selectedCondition,
  };
}

function sanitizeFortressStats(raw) {
  const defaults = defaultFortressStats();
  const source = raw && typeof raw === "object" ? raw : {};
  const stageRaw = Math.max(0, Number(source.campaignStage) || defaults.campaignStage);
  const stageMax = Math.max(0, FORTRESS_CAMPAIGN_STAGES.length - 1);
  const lastReplay =
    source.lastReplay && typeof source.lastReplay === "object"
      ? {
          playerShots: Math.max(0, Number(source.lastReplay.playerShots) || 0),
          directHits: Math.max(0, Number(source.lastReplay.directHits) || 0),
          accuracy: Math.max(0, Number(source.lastReplay.accuracy) || 0),
          suggestion: String(source.lastReplay.suggestion || ""),
        }
      : null;
  return {
    games: Math.max(0, Number(source.games) || defaults.games),
    wins: Math.max(0, Number(source.wins) || defaults.wins),
    quickestWinSec: Math.max(0, Number(source.quickestWinSec) || defaults.quickestWinSec),
    bestHpRemaining: Math.max(0, Number(source.bestHpRemaining) || defaults.bestHpRemaining),
    totalDamageDealt: Math.max(0, Number(source.totalDamageDealt) || defaults.totalDamageDealt),
    campaignStage: Math.max(0, Math.min(stageMax, stageRaw)),
    campaignClears: Math.max(0, Number(source.campaignClears) || defaults.campaignClears),
    totalDirectHits: Math.max(0, Number(source.totalDirectHits) || defaults.totalDirectHits),
    bestAccuracy: Math.max(0, Number(source.bestAccuracy) || defaults.bestAccuracy),
    lastReplay,
  };
}

function loadArtilleryCampaign() {
  try {
    const userId = localStorage.getItem(ACTIVE_USER_KEY) || "default";
    const raw = localStorage.getItem(artilleryCampaignStorageKey(userId));
    if (!raw) return defaultArtilleryCampaign();
    return sanitizeArtilleryCampaign(JSON.parse(raw));
  } catch (error) {
    return defaultArtilleryCampaign();
  }
}

function loadFortressStats() {
  try {
    const userId = localStorage.getItem(ACTIVE_USER_KEY) || "default";
    const raw = localStorage.getItem(fortressStatsStorageKey(userId));
    if (!raw) return defaultFortressStats();
    return sanitizeFortressStats(JSON.parse(raw));
  } catch (error) {
    return defaultFortressStats();
  }
}

function saveArtilleryCampaign() {
  try {
    const userId = localStorage.getItem(ACTIVE_USER_KEY) || "default";
    localStorage.setItem(artilleryCampaignStorageKey(userId), JSON.stringify(artilleryCampaign));
  } catch (error) {
    return;
  }
}

function saveFortressStats() {
  try {
    const userId = localStorage.getItem(ACTIVE_USER_KEY) || "default";
    localStorage.setItem(fortressStatsStorageKey(userId), JSON.stringify(fortressStats));
  } catch (error) {
    return;
  }
}

function hydrateArtilleryCampaignForUser(userId) {
  try {
    const raw = localStorage.getItem(artilleryCampaignStorageKey(userId || "default"));
    const next = raw ? sanitizeArtilleryCampaign(JSON.parse(raw)) : defaultArtilleryCampaign();
    Object.assign(artilleryCampaign, next);
  } catch (error) {
    Object.assign(artilleryCampaign, defaultArtilleryCampaign());
  }
}

function hydrateFortressStatsForUser(userId) {
  try {
    const raw = localStorage.getItem(fortressStatsStorageKey(userId || "default"));
    const next = raw ? sanitizeFortressStats(JSON.parse(raw)) : defaultFortressStats();
    Object.assign(fortressStats, next);
  } catch (error) {
    Object.assign(fortressStats, defaultFortressStats());
  }
}

function loadStateFromLocal(userId) {
  try {
    if (!userId) return { lists: [], history: [] };
    const raw = localStorage.getItem(userStorageKey(userId));
    if (!raw) {
      return { lists: [], history: [] };
    }
    const parsed = JSON.parse(raw);
    return normalizeState(parsed);
  } catch (error) {
    return { lists: [], history: [] };
  }
}

function normalizeState(raw) {
  const source = raw && typeof raw === "object" ? raw : {};
  const lists = Array.isArray(source.lists)
    ? source.lists
        .map((list) => ({
          id: String(list.id || "").trim(),
          name: String(list.name || "").trim(),
          words: Array.isArray(list.words) ? list.words.map((word) => normalizeWord(word)) : [],
        }))
        .filter((list) => list.id && list.name)
    : [];

  const history = Array.isArray(source.history)
    ? source.history
        .map((entry) => normalizeHistoryEntry(entry))
        .filter((entry) => entry && entry.query)
    : [];

  return { lists, history };
}

function saveState() {
  if (ui.activeUserId) {
    localStorage.setItem(userStorageKey(ui.activeUserId), JSON.stringify(state));
  }
  queueRemoteSave();
}

async function hydrateStateFromServer() {
  if (!ui.activeUserId) {
    state.lists = [];
    state.history = [];
    return;
  }

  const localState = loadStateFromLocal(ui.activeUserId);
  try {
    const response = await fetch(apiUrl(`/api/state?user=${encodeURIComponent(ui.activeUserId)}`));
    if (!response.ok) {
      state.lists = localState.lists;
      state.history = localState.history;
      return;
    }
    const remote = await response.json();
    const normalizedRemote = normalizeState(remote);
    const remoteLists = normalizedRemote.lists;
    const remoteHistory = normalizedRemote.history;
    const hasRemote = remoteLists.length > 0 || remoteHistory.length > 0;
    const hasLocal = localState.lists.length > 0 || localState.history.length > 0;

    if (hasRemote) {
      state.lists = remoteLists;
      state.history = remoteHistory;
      localStorage.setItem(userStorageKey(ui.activeUserId), JSON.stringify(state));
    } else if (hasLocal) {
      state.lists = localState.lists;
      state.history = localState.history;
      queueRemoteSave(true);
    } else {
      state.lists = [];
      state.history = [];
    }
    remoteHydrated = true;
  } catch (error) {
    state.lists = localState.lists;
    state.history = localState.history;
    remoteHydrated = false;
  }
}

function queueRemoteSave(immediate = false) {
  if (!ui.activeUserId) return;
  if (remoteSaveTimer) {
    clearTimeout(remoteSaveTimer);
  }
  const targetUserId = String(ui.activeUserId);
  const snapshot = {
    lists: JSON.parse(JSON.stringify(state.lists)),
    history: JSON.parse(JSON.stringify(state.history)),
  };
  const delay = immediate ? 0 : 250;
  remoteSaveTimer = setTimeout(async () => {
    try {
      const response = await fetch(apiUrl(`/api/state?user=${encodeURIComponent(targetUserId)}`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) {
        throw new Error(`state save failed: ${response.status}`);
      }
      remoteHydrated = true;
    } catch (error) {
      if (!remoteHydrated) {
        return;
      }
    }
  }, delay);
}

function bindUsers() {
  refs.userCreateForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = refs.userNameInput.value.trim();
    if (!name) return;
    const created = await createUser(name);
    if (!created) return;
    refs.userNameInput.value = "";
    await hydrateUsers(created.id);
    await switchUser(created.id);
  });

  refs.userList.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) return;
    const deleteBtn = event.target.closest("[data-user-delete-id]");
    if (deleteBtn) {
      const userId = String(deleteBtn.dataset.userDeleteId || "");
      const userName = String(deleteBtn.dataset.userDeleteName || "").trim() || "this";
      if (!userId) return;
      const ok = confirm(t("users.deleteConfirm", { name: userName }));
      if (!ok) return;
      const deleted = await deleteUser(userId);
      if (!deleted) return;
      const wasActive = String(ui.activeUserId) === userId;
      await hydrateUsers();
      if (!ui.users.length) {
        ui.activeUserId = "";
        localStorage.removeItem(ACTIVE_USER_KEY);
        state.lists = [];
        state.history = [];
        refreshAll();
        return;
      }
      if (wasActive) {
        await switchUser(ui.activeUserId);
      } else {
        renderUsers();
      }
      return;
    }
    const button = event.target.closest("[data-user-id]");
    if (!button) return;
    const userId = String(button.dataset.userId || "");
    if (!userId || userId === ui.activeUserId) return;
    await switchUser(userId);
  });
}

async function hydrateUsers(preferredUserId = "") {
  try {
    const response = await fetch(apiUrl("/api/users"));
    if (!response.ok) {
      return;
    }
    const payload = await response.json();
    ui.users = Array.isArray(payload.users) ? payload.users : [];
    if (!ui.users.length) return;

    const candidate = preferredUserId || ui.activeUserId;
    const exists = ui.users.some((user) => String(user.id) === String(candidate));
    ui.activeUserId = exists ? String(candidate) : String(ui.users[0].id);
    localStorage.setItem(ACTIVE_USER_KEY, ui.activeUserId);
    ui.lastUsedListId = localStorage.getItem(lastUsedListStorageKey(ui.activeUserId)) || "";
    hydrateArtilleryCampaignForUser(ui.activeUserId);
    hydrateFortressStatsForUser(ui.activeUserId);
  } catch (error) {
    // Keep current local user state.
  }
}

async function switchUser(userId) {
  ui.activeUserId = String(userId || "");
  localStorage.setItem(ACTIVE_USER_KEY, ui.activeUserId);
  ui.lastUsedListId = localStorage.getItem(lastUsedListStorageKey(ui.activeUserId)) || "";
  hydrateArtilleryCampaignForUser(ui.activeUserId);
  hydrateFortressStatsForUser(ui.activeUserId);
  await hydrateStateFromServer();
  renderUsers();
  refreshAll();
  backfillMissingRubyForSavedWords();
}

async function createUser(name) {
  try {
    const response = await fetch(apiUrl("/api/users"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const payload = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : {};
    if (!response.ok) {
      alert(payload.error || t("users.createFailedHttp", { code: response.status }));
      return null;
    }
    return payload.user || null;
  } catch (error) {
    alert(t("users.networkError"));
    return null;
  }
}

async function deleteUser(userId) {
  try {
    let response = await fetch(apiUrl(`/api/users/${encodeURIComponent(String(userId || ""))}`), {
      method: "DELETE",
    });
    let payload = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json()
      : {};
    if (!response.ok && (response.status === 405 || response.status === 501)) {
      response = await fetch(apiUrl("/api/users/delete"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteUserId: String(userId || ""),
          userId: String(userId || ""),
          id: String(userId || ""),
        }),
      });
      payload = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? await response.json()
        : {};
    }
    if (!response.ok) {
      alert(payload.error || t("users.deleteFailedHttp", { code: response.status }));
      return null;
    }
    const deletedId = String(payload?.deleted?.id || userId || "");
    if (deletedId) {
      localStorage.removeItem(userStorageKey(deletedId));
      localStorage.removeItem(artilleryCampaignStorageKey(deletedId));
      localStorage.removeItem(fortressStatsStorageKey(deletedId));
    }
    return payload.deleted || { id: String(userId || "") };
  } catch (error) {
    alert(t("users.networkError"));
    return null;
  }
}

function renderUsers() {
  refs.userList.innerHTML = "";
  if (!ui.users.length) {
    refs.userList.innerHTML = `<span class='hint'>${escapeHtml(t("users.noUsersYet"))}</span>`;
    return;
  }

  ui.users.forEach((user) => {
    const wrap = document.createElement("div");
    wrap.className = "user-chip-wrap";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "user-chip";
    button.dataset.userId = String(user.id);
    button.textContent = user.name || `User ${user.id}`;
    if (String(user.id) === String(ui.activeUserId)) {
      button.classList.add("active");
    }

    const del = document.createElement("button");
    del.type = "button";
    del.className = "user-chip-delete";
    del.dataset.userDeleteId = String(user.id);
    del.dataset.userDeleteName = String(user.name || `User ${user.id}`);
    del.setAttribute(
      "aria-label",
      t("users.deleteAria", { name: user.name || `User ${user.id}` })
    );
    del.textContent = "x";

    wrap.appendChild(button);
    wrap.appendChild(del);
    refs.userList.appendChild(wrap);
  });
}

function bindNav() {
  refs.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.view;
      setActiveView(target);
    });
  });
}

function setActiveView(viewName) {
  ui.activeView = viewName;
  refs.navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.view === viewName);
  });
  refs.views.forEach((view) => {
    view.classList.toggle("active", view.id === `view-${viewName}`);
  });

  if (viewName === "flashcards") {
    renderFlashcards();
    backfillMissingRubyForSavedWords();
  }
  if (viewName === "quiz") {
    renderQuizSetupHint();
  }
  if (viewName === "fortress") {
    mountFortressUi();
    drawFortressScene();
    updateFortressHud();
  }
}

function bindSearch() {
  refs.searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const query = refs.searchInput.value.trim();
    if (!query) {
      setStatus(t("search.enterWord"), true);
      return;
    }

    setStatus(t("search.searching"));
    refs.searchResults.innerHTML = "";

    try {
      const finalPayload = await resolveSearchWithFallback(query);

      if (finalPayload.error) {
        setStatus(finalPayload.error || t("search.failed"), true);
        return;
      }

      ui.searchResults = Array.isArray(finalPayload.results) ? finalPayload.results : [];
      const finalCorrectedQuery = String(finalPayload.correctedQuery || "").trim();
      if (!ui.searchResults.length) {
        setStatus(t("search.noResults"), true);
      } else {
        const modeLabel =
          finalPayload.language === "en" ? t("search.modeEnglish") : t("search.modeJapanese");
        if (finalCorrectedQuery) {
          setStatus(
            t("search.showingResults", {
              count: ui.searchResults.length,
              query: finalCorrectedQuery,
              mode: modeLabel,
            })
          );
          refs.searchInput.value = finalCorrectedQuery;
        } else {
          setStatus(
            t("search.foundResults", {
              count: ui.searchResults.length,
              mode: modeLabel,
            })
          );
        }
      }
      if (refs.searchSourceHint) {
        const sourceHost = finalPayload.source || (ui.lang === "ko" ? "네이버 사전" : "Naver dictionary");
        refs.searchSourceHint.textContent = t("search.sourceHint", { source: sourceHost });
      }

      pushQueryToHistory(query);
      renderSearchResults();
      renderHistory();
      renderLists();
      refreshListSelectors();
    } catch (error) {
      setStatus(t("search.networkProxy"), true);
    }
  });
}

function buildSearchFallbackQueries(originalQuery, payload) {
  const original = String(originalQuery || "").trim();
  const normalized = original.toLowerCase();
  const candidates = [];
  const seen = new Set();

  const push = (value) => {
    const text = String(value || "").trim();
    if (!text) return;
    const key = text.toLowerCase();
    if (key === normalized || seen.has(key)) return;
    seen.add(key);
    candidates.push(text);
  };

  push(payload?.correctedQuery);
  const suggestions = Array.isArray(payload?.suggestions) ? payload.suggestions : [];
  suggestions.forEach(push);
  push(payload?.queryRevert);

  if (RE_LATIN_CHARS.test(original)) {
    push(original.replace(/[^A-Za-z]/g, ""));
  } else if (RE_JAPANESE_CHARS.test(original)) {
    push(original.replace(/\s+/g, ""));
  }

  return candidates.slice(0, 6);
}

function inferSearchLanguage(query) {
  return RE_LATIN_CHARS.test(query) ? "en" : "ja";
}

async function resolveSearchWithFallback(query) {
  const first = await fetchSearchPayload(query);
  if (first.error) return first;
  if (Array.isArray(first.results) && first.results.length) {
    return first;
  }

  const fallbackQueries = buildSearchFallbackQueries(query, first);
  const tried = new Set([String(query || "").trim().toLowerCase()]);
  for (const candidate of fallbackQueries) {
    const key = candidate.toLowerCase();
    if (tried.has(key)) continue;
    tried.add(key);
    const next = await fetchSearchPayload(candidate, first.language || inferSearchLanguage(candidate));
    if (next.error) continue;
    if (Array.isArray(next.results) && next.results.length) {
      if (!next.correctedQuery) {
        next.correctedQuery = candidate;
      }
      return next;
    }
  }
  return first;
}

async function fetchSearchPayload(query, lang = "") {
  const params = new URLSearchParams({ query: String(query || "").trim() });
  if (lang === "ja" || lang === "en") {
    params.set("lang", lang);
  }

  const response = await fetch(apiUrl(`/api/search?${params.toString()}`));
  const payload = await response.json();
  if (!response.ok) {
    return { error: payload.error || t("search.failed") };
  }
  return payload;
}

function setStatus(text, isError = false) {
  refs.searchStatus.textContent = text;
  refs.searchStatus.classList.toggle("error", Boolean(isError));
}

function renderSearchResults() {
  refs.searchResults.innerHTML = "";
  if (!ui.searchResults.length) {
    return;
  }

  ui.searchResults.forEach((entry) => {
    const card = buildWordCard(entry, { withAdd: true });
    refs.searchResults.appendChild(card);
  });
  warmAudioForRows(ui.searchResults.slice(0, 6));
}

function collectMeaningChoices(entry) {
  const baseWordKey = normalizeComparableText(entry?.word || "");
  const seen = new Set();
  const choices = [];

  const tryPush = (row) => {
    if (!row) return;
    const meaning = String(row.meaning || "").trim();
    if (!meaning) return;
    const key = normalizeComparableText(meaning);
    if (!key || seen.has(key)) return;
    seen.add(key);
    choices.push({
      meaning,
      row,
    });
  };

  tryPush(entry);
  const alternates = Array.isArray(entry?.meaningAlternates) ? entry.meaningAlternates : [];
  alternates.forEach((meaning) => {
    if (choices.length >= 2) return;
    const meaningText = String(meaning || "").trim();
    if (!meaningText) return;
    const key = normalizeComparableText(meaningText);
    if (!key || seen.has(key)) return;
    seen.add(key);
    choices.push({
      meaning: meaningText,
      row: entry,
    });
  });

  const rankedRows = ui.searchResults
    .map((row) => {
      const rowWord = String(row?.word || "").trim();
      const rowWordKey = normalizeComparableText(rowWord);
      if (!rowWordKey || !baseWordKey) return { row, score: -1 };
      let score = -1;
      if (rowWordKey === baseWordKey) {
        score = 100;
      } else if (rowWordKey.includes(baseWordKey)) {
        score = 80;
      } else {
        const compactWord = rowWord.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
        const tokenized = compactWord.split(/\s+/).filter(Boolean);
        if (tokenized.includes(String(entry?.word || "").toLowerCase())) {
          score = 70;
        }
      }
      return { row, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score);

  rankedRows.forEach(({ row }) => {
    if (choices.length >= 2) return;
    tryPush(row);
    const rowAlternates = Array.isArray(row?.meaningAlternates) ? row.meaningAlternates : [];
    rowAlternates.forEach((meaning) => {
      if (choices.length >= 2) return;
      const meaningText = String(meaning || "").trim();
      if (!meaningText) return;
      const key = normalizeComparableText(meaningText);
      if (!key || seen.has(key)) return;
      seen.add(key);
      choices.push({
        meaning: meaningText,
        row,
      });
    });
  });

  return choices.slice(0, 2);
}

function buildWordCard(entry, options = {}) {
  const fragment = refs.resultTemplate.content.cloneNode(true);
  const root = fragment.querySelector(".word-card");
  const meaningChoices = collectMeaningChoices(entry);
  let selected = meaningChoices[0] || { meaning: entry.meaning || "", row: entry };

  root.querySelector(".word").textContent = entry.word || "(no word)";
  const audioBtn = root.querySelector(".word-audio-btn");
  if (audioBtn) {
    audioBtn.title = t("common.listenWord");
  }
  audioBtn?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    speakWord(selected.row?.word || entry.word, selected.row?.audioUrl || entry.audioUrl);
  });
  root.querySelector(".furigana").textContent = entry.furigana || t("common.noFurigana");
  const meaningEl = root.querySelector(".meaning");
  meaningEl.textContent = selected.meaning || t("common.noMeaning");
  setExampleContent(
    root.querySelector(".example-jp"),
    root.querySelector(".example-ko"),
    selected.row || entry
  );

  if (meaningChoices.length > 1) {
    const choiceRow = document.createElement("div");
    choiceRow.className = "meaning-choice-row";
    meaningChoices.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `meaning-choice-btn${index === 0 ? " active" : ""}`;
      btn.textContent = choice.meaning;
      btn.addEventListener("click", () => {
        selected = choice;
        meaningEl.textContent = selected.meaning || t("common.noMeaning");
        setExampleContent(
          root.querySelector(".example-jp"),
          root.querySelector(".example-ko"),
          selected.row || entry
        );
        choiceRow.querySelectorAll(".meaning-choice-btn").forEach((node) => {
          node.classList.remove("active");
        });
        btn.classList.add("active");
      });
      choiceRow.appendChild(btn);
    });
    meaningEl.insertAdjacentElement("afterend", choiceRow);
  }

  const actionRow = root.querySelector(".action-row");
  if (options.withAdd) {
    const select = root.querySelector(".list-select");
    populateListSelect(select, true);
    if (ui.lastUsedListId && [...select.options].some((o) => o.value === ui.lastUsedListId)) {
      select.value = ui.lastUsedListId;
    } else if (state.lists.length && [...select.options].some((o) => o.value === state.lists[0].id)) {
      select.value = state.lists[0].id;
    }
    const addButton = root.querySelector(".add-btn");
    addButton.textContent = t("common.add");
    addButton.addEventListener("click", () => {
      const listId = select.value;
      if (!listId) {
        alert(t("lists.createListBeforeAdd"));
        return;
      }
      const payload = normalizeWord({
        ...entry,
        ...selected.row,
        meaning: selected.meaning || entry.meaning,
      });
      const ok = addWordToList(listId, payload);
      if (ok) {
        addButton.textContent = t("common.added");
        setTimeout(() => {
          addButton.textContent = t("common.add");
        }, 700);
      }
    });
  } else {
    actionRow.remove();
  }
  return root;
}

function normalizeWord(word) {
  const rubyRaw = (word.exampleRuby || "").trim();
  const ruby = hasRubyReadings(rubyRaw) ? rubyRaw : "";
  const audioUrl = String(word.audioUrl || "").trim();
  return {
    word: (word.word || "").trim(),
    furigana: (word.furigana || "").trim(),
    meaning: (word.meaning || "").trim(),
    example: (word.example || "").trim(),
    exampleRuby: ruby,
    exampleTranslation: (word.exampleTranslation || "").trim(),
    sourceUrl: (word.sourceUrl || "").trim(),
    audioUrl,
    examplePinned: Boolean(word.examplePinned),
  };
}

function getWordKey(word) {
  return [word.word, word.furigana, word.meaning].join("::").toLowerCase();
}

function normalizeHistoryEntry(entry) {
  if (typeof entry === "string") {
    const query = entry.trim();
    if (!query) return null;
    return {
      id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      query,
      createdAt: "",
    };
  }
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const query = String(entry.query || entry.word || "").trim();
  if (!query) return null;
  const id =
    String(entry.id || "").trim() ||
    `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = String(entry.createdAt || "").trim();
  return { id, query, createdAt };
}

function setExampleContent(jpElement, koElement, word) {
  const ruby = (word.exampleRuby || "").trim();
  const plain = (word.example || "").trim();
  const translation = (word.exampleTranslation || "").trim();
  const hasValidRuby = hasRubyReadings(ruby);

  if (hasValidRuby) {
    jpElement.classList.add("has-ruby");
    jpElement.innerHTML = rubyMarkupToTokenHtml(sanitizeRubyMarkup(ruby));
  } else {
    jpElement.classList.remove("has-ruby");
    jpElement.textContent = plain || t("word.noExample");
  }

  if (translation) {
    koElement.textContent = translation;
    koElement.style.display = "block";
  } else {
    koElement.textContent = "";
    koElement.style.display = "none";
  }
}

function hasRubyReadings(markup) {
  const value = String(markup || "").trim();
  if (!value) return false;
  return /<\s*rt\s*>/i.test(value);
}

function sanitizeRubyMarkup(markup) {
  return String(markup || "").replace(
    /<\s*(\/?)\s*([a-zA-Z0-9]+)(?:\s+[^>]*)?>/g,
    (_, slash, tagName) => {
      const tag = String(tagName || "").toLowerCase();
      if (!ALLOWED_RUBY_TAGS.has(tag)) {
        return "";
      }
      if (tag === "br") {
        return "<br>";
      }
      return `<${slash ? "/" : ""}${tag}>`;
    }
  );
}

function rubyMarkupToTokenHtml(markup) {
  const template = document.createElement("template");
  template.innerHTML = String(markup || "");

  const renderNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return escapeHtml(node.textContent || "");
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const tag = node.tagName.toLowerCase();
    if (tag === "br") {
      return "<br>";
    }
    if (tag === "ruby") {
      const rb = [...node.querySelectorAll(":scope > rb")]
        .map((x) => x.textContent || "")
        .join("");
      const rt = [...node.querySelectorAll(":scope > rt")]
        .map((x) => x.textContent || "")
        .join("");
      const baseText = (rb || node.textContent || "").trim();
      const rubyText = (rt || "").trim();
      if (!rubyText) {
        return escapeHtml(baseText);
      }
      return `<span class="ruby-token"><span class="ruby-top">${escapeHtml(
        rubyText
      )}</span><span class="ruby-base">${escapeHtml(baseText)}</span></span>`;
    }
    return [...node.childNodes].map(renderNode).join("");
  };

  return [...template.content.childNodes].map(renderNode).join("");
}

function normalizeComparableText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[・·･\u30fb]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function shouldBackfillRuby(word) {
  const target = `${word?.word || ""} ${word?.example || ""}`;
  return RE_JAPANESE_CHARS.test(target);
}

function normalizeWordQueryForBackfill(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, "")
    .replace(/[・·･\u30fb]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")[0];
}

function capMapSize(map, maxSize) {
  if (!(map instanceof Map)) return;
  const limit = Math.max(1, Number(maxSize) || 1);
  while (map.size > limit) {
    const firstKey = map.keys().next().value;
    if (typeof firstKey === "undefined") break;
    map.delete(firstKey);
  }
}

async function fetchSearchCached(query) {
  const queryText = String(query || "").trim();
  if (!queryText) return null;
  const cacheKey = queryText.toLowerCase();
  if (rubyBackfillCache.has(cacheKey)) {
    return rubyBackfillCache.get(cacheKey);
  }
  try {
    const response = await fetch(apiUrl(`/api/search?query=${encodeURIComponent(queryText)}`));
    if (!response.ok) return null;
    const payload = await response.json();
    rubyBackfillCache.set(cacheKey, payload);
    capMapSize(rubyBackfillCache, 240);
    return payload;
  } catch (error) {
    return null;
  }
}

function pickRubyMatchFromResults(results, targetWord) {
  if (!Array.isArray(results) || !targetWord) return null;
  const targetExample = normalizeComparableText(targetWord.example);
  const targetWordText = normalizeComparableText(targetWord.word);

  const exactExample = results.find((row) => {
    return (
      row &&
      hasRubyReadings(row.exampleRuby) &&
      normalizeComparableText(row.example) &&
      normalizeComparableText(row.example) === targetExample
    );
  });
  if (exactExample) return exactExample;

  const sameWord = results.find((row) => {
    const rowWord = normalizeComparableText(row?.word);
    return row && hasRubyReadings(row.exampleRuby) && rowWord && rowWord.includes(targetWordText);
  });
  if (sameWord) return sameWord;

  return results.find((row) => row && hasRubyReadings(row.exampleRuby)) || null;
}

async function backfillMissingRubyForSavedWords() {
  if (rubyBackfillRunning) return;
  rubyBackfillRunning = true;

  try {
    const candidates = [];
    state.lists.forEach((list) => {
      list.words.forEach((word) => {
        if (shouldBackfillRuby(word) && word.example && !hasRubyReadings(word.exampleRuby)) {
          candidates.push(word);
        }
      });
    });

    if (!candidates.length) return;

    const limited = candidates.slice(0, 60);
    let changed = false;

    for (const word of limited) {
      const candidateQueries = [
        normalizeWordQueryForBackfill(word.word || ""),
        normalizeWordQueryForBackfill(word.example || ""),
      ].filter(Boolean);
      const queries = [...new Set(candidateQueries)];
      if (!queries.length) continue;

      let bestMatch = null;
      for (const query of queries) {
        const payload = await fetchSearchCached(query);
        const match = pickRubyMatchFromResults(payload?.results || [], word);
        if (match && hasRubyReadings(match.exampleRuby)) {
          bestMatch = match;
          break;
        }
      }
      if (!bestMatch) continue;

      word.exampleRuby = String(bestMatch.exampleRuby || "").trim();
      if (!word.exampleTranslation) {
        word.exampleTranslation = String(bestMatch.exampleTranslation || "").trim();
      }
      changed = true;
    }

    if (changed) {
      saveState();
      renderLists();
      renderFlashcards();
      if (ui.activeView === "search") {
        renderSearchResults();
      }
    }
  } finally {
    rubyBackfillRunning = false;
  }
}

function pushQueryToHistory(query) {
  const cleanQuery = String(query || "").trim();
  if (!cleanQuery) return;

  state.history = state.history.filter(
    (item) => item.query.toLowerCase() !== cleanQuery.toLowerCase()
  );
  state.history.unshift({
    id: `h_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    query: cleanQuery,
    createdAt: new Date().toISOString(),
  });
  state.history = state.history.slice(0, 400);
  saveState();
}

function bindLists() {
  refs.createListForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = refs.listNameInput.value.trim();
    if (!name) return;
    createList(name);
    refs.listNameInput.value = "";
  });

  if (refs.listsExportJsonBtn) {
    refs.listsExportJsonBtn.addEventListener("click", exportListsJson);
  }
  if (refs.listsExportCsvBtn) {
    refs.listsExportCsvBtn.addEventListener("click", exportListsCsv);
  }
  if (refs.listsImportBtn && refs.listsImportInput) {
    refs.listsImportBtn.addEventListener("click", () => {
      refs.listsImportInput.click();
    });
    refs.listsImportInput.addEventListener("change", importListsFromFile);
  }
}

function makeExportFilename(ext) {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `japanese-hub-${yyyy}${mm}${dd}-${hh}${mi}.${ext}`;
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
}

function exportListsJson() {
  const payload = {
    lists: state.lists,
    history: state.history,
    exportedAt: new Date().toISOString(),
  };
  downloadTextFile(
    makeExportFilename("json"),
    JSON.stringify(payload, null, 2),
    "application/json;charset=utf-8"
  );
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function toCsvRow(values) {
  return values.map(escapeCsvCell).join(",");
}

function exportListsCsv() {
  const lines = [
    toCsvRow([
      "list",
      "word",
      "furigana",
      "meaning",
      "example",
      "exampleRuby",
      "exampleTranslation",
      "sourceUrl",
      "examplePinned",
    ]),
  ];
  state.lists.forEach((list) => {
    list.words.forEach((word) => {
      lines.push(
        toCsvRow([
          list.name,
          word.word || "",
          word.furigana || "",
          word.meaning || "",
          word.example || "",
          word.exampleRuby || "",
          word.exampleTranslation || "",
          word.sourceUrl || "",
          word.examplePinned ? "1" : "0",
        ])
      );
    });
  });
  downloadTextFile(makeExportFilename("csv"), `${lines.join("\n")}\n`, "text/csv;charset=utf-8");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (ch === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes && ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      cell = "";
      if (row.length > 1 || row[0]) {
        rows.push(row);
      }
      row = [];
      continue;
    }
    cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function importStateFromCsvText(text) {
  const rows = parseCsv(String(text || ""));
  if (!rows.length) return { lists: [], history: [] };
  const header = rows[0].map((x) => String(x || "").trim().toLowerCase());
  const idx = (name) => header.indexOf(name);
  const listByName = new Map();
  const listNameIdx = idx("list");
  const wordIdx = idx("word");
  const furiIdx = idx("furigana");
  const meaningIdx = idx("meaning");
  const exIdx = idx("example");
  const rubyIdx = idx("exampleruby");
  const exTrIdx = idx("exampletranslation");
  const sourceIdx = idx("sourceurl");
  const pinnedIdx = idx("examplepinned");

  rows.slice(1).forEach((r) => {
    const listNameRaw =
      (listNameIdx >= 0 ? String(r[listNameIdx] || "").trim() : "") || t("lists.importCsvDefaultList");
    const wordRaw = wordIdx >= 0 ? String(r[wordIdx] || "").trim() : "";
    if (!wordRaw) return;
    if (!listByName.has(listNameRaw)) {
      listByName.set(listNameRaw, {
        id: `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name: listNameRaw,
        words: [],
      });
    }
    const list = listByName.get(listNameRaw);
    list.words.push(
      normalizeWord({
        word: wordRaw,
        furigana: furiIdx >= 0 ? String(r[furiIdx] || "").trim() : "",
        meaning: meaningIdx >= 0 ? String(r[meaningIdx] || "").trim() : "",
        example: exIdx >= 0 ? String(r[exIdx] || "").trim() : "",
        exampleRuby: rubyIdx >= 0 ? String(r[rubyIdx] || "").trim() : "",
        exampleTranslation: exTrIdx >= 0 ? String(r[exTrIdx] || "").trim() : "",
        sourceUrl: sourceIdx >= 0 ? String(r[sourceIdx] || "").trim() : "",
        examplePinned:
          pinnedIdx >= 0
            ? ["1", "true", "yes", "y"].includes(String(r[pinnedIdx] || "").trim().toLowerCase())
            : false,
      })
    );
  });

  return {
    lists: [...listByName.values()],
    history: [],
  };
}

async function importListsFromFile(event) {
  const input = event.target;
  const file = input?.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    let imported = null;
    const lowerName = String(file.name || "").toLowerCase();
    if (lowerName.endsWith(".csv") || String(file.type || "").includes("csv")) {
      imported = importStateFromCsvText(text);
    } else {
      const parsed = JSON.parse(text);
      imported = normalizeState(parsed);
    }
    if (!imported) throw new Error("No data");
    const ok = confirm(t("lists.importConfirmReplace"));
    if (!ok) return;
    state.lists = imported.lists || [];
    state.history = imported.history || [];
    saveState();
    refreshAll();
    alert(t("lists.importDone"));
  } catch (error) {
    alert(t("lists.importFailed"));
  } finally {
    if (input) {
      input.value = "";
    }
  }
}

function createList(name) {
  const normalized = name.trim();
  if (!normalized) return;
  const duplicate = state.lists.some(
    (list) => list.name.toLowerCase() === normalized.toLowerCase()
  );
  if (duplicate) {
    alert(t("lists.nameExists"));
    return;
  }
  const id = `list_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  state.lists.push({ id, name: normalized, words: [] });
  saveState();
  refreshAll();
}

function renameList(listId, nextNameRaw) {
  const list = state.lists.find((x) => x.id === listId);
  if (!list) return false;
  const nextName = String(nextNameRaw || "").trim();
  if (!nextName) return false;
  const duplicate = state.lists.some(
    (x) => x.id !== listId && String(x.name || "").toLowerCase() === nextName.toLowerCase()
  );
  if (duplicate) {
    alert(t("lists.nameExists"));
    return false;
  }
  list.name = nextName;
  saveState();
  refreshAll();
  return true;
}

function addWordToList(listId, rawWord) {
  const list = state.lists.find((x) => x.id === listId);
  if (!list) return false;
  const word = normalizeWord(rawWord);
  const key = getWordKey(word);
  const exists = list.words.some((x) => getWordKey(x) === key);
  if (exists) {
    alert(t("lists.wordExists"));
    return false;
  }
  const sameHeadword = list.words.find(
    (x) =>
      normalizeComparableText(x.word) &&
      normalizeComparableText(x.word) === normalizeComparableText(word.word)
  );
  if (sameHeadword) {
    const shouldMerge = confirm(t("lists.mergeConfirm", { word: word.word }));
    if (shouldMerge) {
      mergeWordSense(sameHeadword, word);
      ui.lastUsedListId = listId;
      if (ui.activeUserId) {
        localStorage.setItem(lastUsedListStorageKey(ui.activeUserId), listId);
      }
      saveState();
      renderLists();
      renderFlashcards();
      renderQuizSetupHint();
      return true;
    }
    const keepSeparate = confirm(t("lists.keepSeparateConfirm"));
    if (!keepSeparate) {
      return false;
    }
  }
  list.words.push(word);
  ui.lastUsedListId = listId;
  if (ui.activeUserId) {
    localStorage.setItem(lastUsedListStorageKey(ui.activeUserId), listId);
  }
  saveState();
  renderLists();
  renderFlashcards();
  renderQuizSetupHint();
  if (shouldBackfillRuby(word) && word.example && !hasRubyReadings(word.exampleRuby)) {
    backfillMissingRubyForSavedWords();
  }
  return true;
}

function deleteList(listId) {
  state.lists = state.lists.filter((x) => x.id !== listId);
  saveState();
  refreshAll();
}

function removeWordFromList(listId, wordKey) {
  const list = state.lists.find((x) => x.id === listId);
  if (!list) return;
  list.words = list.words.filter((word) => getWordKey(word) !== wordKey);
  saveState();
  renderLists();
  renderFlashcards();
  renderQuizSetupHint();
}

function mergeWordSense(targetWord, incomingWord) {
  const incomingMeaning = String(incomingWord.meaning || "").trim();
  const existingMeaning = String(targetWord.meaning || "").trim();
  if (incomingMeaning) {
    if (!existingMeaning) {
      targetWord.meaning = incomingMeaning;
    } else {
      const chunks = existingMeaning
        .split(/\s*\/\s*/)
        .map((x) => x.trim())
        .filter(Boolean);
      if (!chunks.some((x) => x.toLowerCase() === incomingMeaning.toLowerCase())) {
        chunks.push(incomingMeaning);
        targetWord.meaning = chunks.join(" / ");
      }
    }
  }
  if (!targetWord.furigana && incomingWord.furigana) {
    targetWord.furigana = incomingWord.furigana;
  }
  if (!targetWord.example && incomingWord.example) {
    targetWord.example = incomingWord.example;
    targetWord.exampleRuby = incomingWord.exampleRuby || "";
    targetWord.exampleTranslation = incomingWord.exampleTranslation || "";
  }
  if (incomingWord.sourceUrl && !targetWord.sourceUrl) {
    targetWord.sourceUrl = incomingWord.sourceUrl;
  }
}

function findListWord(listId, wordKey) {
  const list = state.lists.find((x) => x.id === listId);
  if (!list) return { list: null, word: null };
  const word = list.words.find((x) => getWordKey(x) === wordKey) || null;
  return { list, word };
}

function pickAlternativeExample(results, word) {
  if (!Array.isArray(results) || !results.length) return null;
  const currentExample = normalizeComparableText(word.example);
  const currentMeaning = normalizeComparableText(word.meaning);
  const candidates = results.filter((row) => {
    const ex = String(row?.example || "").trim();
    if (!ex) return false;
    if (normalizeComparableText(ex) === currentExample) return false;
    return true;
  });
  if (!candidates.length) return null;

  const sameMeaning = candidates.find(
    (row) =>
      currentMeaning &&
      normalizeComparableText(row.meaning || "").includes(currentMeaning.slice(0, 24))
  );
  if (sameMeaning) return sameMeaning;

  const withRuby = candidates.find((row) => hasRubyReadings(row.exampleRuby));
  return withRuby || candidates[0];
}

async function refreshExampleForWord(listId, wordKey) {
  const { word } = findListWord(listId, wordKey);
  if (!word) return;
  if (word.examplePinned) {
    alert(t("lists.pinRefreshWarn"));
    return;
  }

  const query = normalizeWordQueryForBackfill(word.word || word.example || "");
  if (!query) return;
  const payload = await fetchSearchCached(query);
  const alt = pickAlternativeExample(payload?.results || [], word);
  if (!alt) {
    alert(t("lists.noBetterExample"));
    return;
  }

  word.example = String(alt.example || word.example || "").trim();
  const ruby = String(alt.exampleRuby || "").trim();
  word.exampleRuby = hasRubyReadings(ruby) ? ruby : "";
  word.exampleTranslation = String(alt.exampleTranslation || word.exampleTranslation || "").trim();
  word.sourceUrl = String(alt.sourceUrl || word.sourceUrl || "").trim();
  saveState();
  renderLists();
  renderFlashcards();
}

function togglePinExample(listId, wordKey) {
  const { word } = findListWord(listId, wordKey);
  if (!word) return;
  word.examplePinned = !word.examplePinned;
  saveState();
  renderLists();
  renderFlashcards();
}

function renderLists() {
  refs.listsArea.innerHTML = "";
  if (!state.lists.length) {
    refs.listsArea.innerHTML = `<p class='hint'>${escapeHtml(t("lists.noListYet"))}</p>`;
    return;
  }

  state.lists.forEach((list) => {
    const fragment = refs.listTemplate.content.cloneNode(true);
    const root = fragment.querySelector(".list-box");
    root.querySelector(".list-name").textContent = `${list.name} (${list.words.length})`;

    const deleteBtn = root.querySelector(".delete-list-btn");
    const renameBtn = root.querySelector(".rename-list-btn");
    if (renameBtn) {
      renameBtn.title = t("lists.renameListTitle");
      renameBtn.addEventListener("click", () => {
        const current = String(list.name || "").trim();
        const next = window.prompt(t("lists.renameListPrompt", { name: current }), current);
        if (next == null) return;
        renameList(list.id, next);
      });
    }

    deleteBtn.textContent = "×";
    deleteBtn.title = t("lists.deleteListTitle");
    deleteBtn.addEventListener("click", () => {
      const ok = confirm(t("lists.deleteListConfirm", { name: list.name }));
      if (ok) {
        deleteList(list.id);
      }
    });

    const wordsWrap = root.querySelector(".list-words");
    if (!list.words.length) {
      wordsWrap.innerHTML = `<p class='hint'>${escapeHtml(t("lists.noWordsYet"))}</p>`;
    } else {
      list.words.forEach((word) => {
        const item = document.createElement("article");
        item.className = "mini-word";
        const wordKey = getWordKey(word);
        const pinnedTag = word.examplePinned
          ? `<span class="mini-badge pinned">${escapeHtml(t("lists.badgePinned"))}</span>`
          : `<span class="mini-badge">${escapeHtml(t("lists.badgeAdaptive"))}</span>`;
        item.innerHTML = `
          <button type="button" class="tiny-x-btn remove-word-btn" title="${escapeHtml(
            t("lists.removeWordTitle")
          )}">×</button>
          <div class="word-top">
            <p class="word">${escapeHtml(word.word)}</p>
            <button
              type="button"
              class="word-audio-btn"
              title="${escapeHtml(t("common.listenWord"))}"
            >🔊</button>
          </div>
          <p>${escapeHtml(word.furigana || t("common.noFurigana"))}</p>
          <p>${escapeHtml(word.meaning || t("common.noMeaning"))}</p>
          ${pinnedTag}
          <div class="example-stack mini-example-stack">
            <p class="example-jp mini-example-jp"></p>
            <p class="example-ko mini-example-ko"></p>
          </div>
          <div class="mini-actions">
            <button type="button" class="mini-action-btn new-example-btn">${escapeHtml(
              t("lists.newExample")
            )}</button>
            <button type="button" class="mini-action-btn pin-example-btn">${
              word.examplePinned ? escapeHtml(t("lists.unpin")) : escapeHtml(t("lists.pin"))
            }</button>
          </div>
        `;
        setExampleContent(
          item.querySelector(".mini-example-jp"),
          item.querySelector(".mini-example-ko"),
          word
        );
        item.querySelector(".remove-word-btn").addEventListener("click", () => {
          removeWordFromList(list.id, getWordKey(word));
        });
        item.querySelector(".new-example-btn").addEventListener("click", () => {
          refreshExampleForWord(list.id, wordKey);
        });
        item.querySelector(".pin-example-btn").addEventListener("click", () => {
          togglePinExample(list.id, wordKey);
        });
        item.querySelector(".word-audio-btn")?.addEventListener("click", () => {
          speakWord(word.word, word.audioUrl);
        });
        wordsWrap.appendChild(item);
      });
    }

    refs.listsArea.appendChild(root);
  });
}

function renderHistory() {
  refs.historyArea.innerHTML = "";
  if (!state.history.length) {
    refs.historyArea.innerHTML = `<p class='hint'>${escapeHtml(t("history.noHistory"))}</p>`;
    return;
  }
  state.history.forEach((entry) => {
    const card = document.createElement("article");
    card.className = "history-card";
    const when = entry.createdAt ? new Date(entry.createdAt) : null;
    const timeLabel =
      when && Number.isFinite(when.getTime())
        ? when.toLocaleString()
        : t("common.savedSearch");

    card.innerHTML = `
      <button type="button" class="tiny-x-btn history-delete-btn" title="${escapeHtml(
        t("history.deleteTitle")
      )}">×</button>
      <h3>${escapeHtml(entry.query)}</h3>
      <p>${escapeHtml(timeLabel)}</p>
      <button type="button" class="history-search-btn">${escapeHtml(t("history.searchAgain"))}</button>
    `;
    card.querySelector(".history-delete-btn").addEventListener("click", () => {
      deleteHistoryEntry(entry.id);
    });
    card.querySelector(".history-search-btn").addEventListener("click", () => {
      rerunSearch(entry.query);
    });
    refs.historyArea.appendChild(card);
  });
}

function deleteHistoryEntry(historyId) {
  state.history = state.history.filter((item) => item.id !== historyId);
  saveState();
  renderHistory();
}

function rerunSearch(query) {
  refs.searchInput.value = query;
  setActiveView("search");
  refs.searchForm.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
}

function populateListSelect(select, withPlaceholder = false) {
  const previous = select.value;
  select.innerHTML = "";
  if (withPlaceholder) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = state.lists.length ? t("common.chooseList") : t("common.createListFirst");
    select.appendChild(option);
  }
  state.lists.forEach((list) => {
    const option = document.createElement("option");
    option.value = list.id;
    option.textContent = `${list.name} (${list.words.length})`;
    select.appendChild(option);
  });

  if ([...select.options].some((o) => o.value === previous)) {
    select.value = previous;
  }
}

function refreshListSelectors() {
  populateListSelect(refs.flashListSelect, false);
  populateListSelect(refs.quizListSelect, false);

  if (!state.lists.some((x) => x.id === ui.lastUsedListId)) {
    ui.lastUsedListId = state.lists[0]?.id || "";
    if (ui.activeUserId) {
      localStorage.setItem(lastUsedListStorageKey(ui.activeUserId), ui.lastUsedListId);
    }
  }

  if (!ui.flashcard.listId || !state.lists.some((x) => x.id === ui.flashcard.listId)) {
    ui.flashcard.listId = state.lists[0]?.id || "";
  }
  if (!ui.quiz.listId || !state.lists.some((x) => x.id === ui.quiz.listId)) {
    ui.quiz.listId = state.lists[0]?.id || "";
  }

  refs.flashListSelect.value = ui.flashcard.listId;
  refs.quizListSelect.value = ui.quiz.listId;
  if (refs.quizModeSelect) {
    refs.quizModeSelect.value = ui.quiz.mode;
  }
}

function bindFlashcards() {
  refs.flashListSelect.addEventListener("change", () => {
    ui.flashcard.listId = refs.flashListSelect.value;
    ui.flashcard.index = 0;
    ui.flashcard.flipped = false;
    ui.flashcard.order = [];
    renderFlashcards();
  });

  if (refs.flashRandomBtn) {
    refs.flashRandomBtn.addEventListener("click", toggleFlashRandom);
  }
  if (refs.flashWordAudioBtn) {
    refs.flashWordAudioBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const words = getCurrentFlashWords();
      if (!words.length) return;
      const current = words[ui.flashcard.index];
      speakWord(current?.word || "", current?.audioUrl || "");
    });
  }

  refs.flashPrev.addEventListener("click", () => moveFlashcard(-1));
  refs.flashNext.addEventListener("click", () => moveFlashcard(1));
  refs.flashCard.addEventListener("click", () => {
    if (Date.now() < flashSwipe.ignoreClickUntil) return;
    flipFlashcard();
  });

  const swipeTarget = refs.flashScene || refs.flashCard;
  if (swipeTarget) {
    swipeTarget.addEventListener("pointerdown", (event) => {
      if (!(event.target instanceof Element)) return;
      flashSwipe.pointerId = event.pointerId;
      flashSwipe.active = true;
      flashSwipe.moved = false;
      flashSwipe.startX = event.clientX;
      flashSwipe.startY = event.clientY;
      flashSwipe.dx = 0;
      flashSwipe.dy = 0;
    });

    swipeTarget.addEventListener("pointermove", (event) => {
      if (!flashSwipe.active || flashSwipe.pointerId !== event.pointerId) return;
      flashSwipe.dx = event.clientX - flashSwipe.startX;
      flashSwipe.dy = event.clientY - flashSwipe.startY;
      const absX = Math.abs(flashSwipe.dx);
      const absY = Math.abs(flashSwipe.dy);
      if (absX > 10 && absX > absY * 1.15) {
        flashSwipe.moved = true;
        const scene = refs.flashScene;
        if (scene && !ui.flashcard.animating) {
          const offset = Math.max(-72, Math.min(72, flashSwipe.dx * 0.4));
          const tilt = Math.max(-6, Math.min(6, flashSwipe.dx * 0.03));
          scene.style.transition = "none";
          scene.style.transform = `translateX(${offset}px) rotate(${tilt}deg)`;
        }
      }
    });

    const finishSwipe = (event) => {
      if (!flashSwipe.active || flashSwipe.pointerId !== event.pointerId) return;
      flashSwipe.active = false;
      flashSwipe.pointerId = null;
      const dx = flashSwipe.dx;
      const absX = Math.abs(dx);
      const absY = Math.abs(flashSwipe.dy);
      const scene = refs.flashScene;
      if (scene) {
        scene.style.transition = "transform 140ms ease";
        scene.style.transform = "";
        setTimeout(() => {
          scene.style.transition = "";
        }, 180);
      }
      if (flashSwipe.moved && absX >= 46 && absX > absY * 1.1) {
        flashSwipe.ignoreClickUntil = Date.now() + 220;
        moveFlashcard(dx < 0 ? 1 : -1);
      }
    };

    swipeTarget.addEventListener("pointerup", finishSwipe);
    swipeTarget.addEventListener("pointercancel", () => {
      flashSwipe.active = false;
      flashSwipe.pointerId = null;
      const scene = refs.flashScene;
      if (scene) {
        scene.style.transition = "transform 120ms ease";
        scene.style.transform = "";
        setTimeout(() => {
          scene.style.transition = "";
        }, 160);
      }
    });
  }
}

function moveFlashcard(delta) {
  const words = getCurrentFlashWords();
  if (!words.length) return;
  const scene = refs.flashScene;
  if (!scene) {
    ui.flashcard.index = (ui.flashcard.index + delta + words.length) % words.length;
    ui.flashcard.flipped = false;
    renderFlashcards();
    return;
  }

  if (ui.flashcard.animating) {
    ui.flashcard.pendingDelta = delta;
    return;
  }

  ui.flashcard.animating = true;
  const outClass = delta > 0 ? "slide-out-left" : "slide-out-right";
  const inClass = delta > 0 ? "slide-in-right" : "slide-in-left";
  scene.classList.remove("slide-out-left", "slide-out-right", "slide-in-left", "slide-in-right");
  scene.classList.add(outClass);

  const handleOutEnd = (event) => {
    if (event.target !== scene) return;
    scene.removeEventListener("animationend", handleOutEnd);
    scene.classList.remove(outClass);

    ui.flashcard.index = (ui.flashcard.index + delta + words.length) % words.length;
    ui.flashcard.flipped = false;
    renderFlashcards();

    scene.classList.add(inClass);
    const handleInEnd = (inEvent) => {
      if (inEvent.target !== scene) return;
      scene.removeEventListener("animationend", handleInEnd);
      scene.classList.remove(inClass);
      ui.flashcard.animating = false;
      if (ui.flashcard.pendingDelta !== 0) {
        const nextDelta = ui.flashcard.pendingDelta;
        ui.flashcard.pendingDelta = 0;
        moveFlashcard(nextDelta);
      }
    };
    scene.addEventListener("animationend", handleInEnd);
  };
  scene.addEventListener("animationend", handleOutEnd);
}

function flipFlashcard() {
  const words = getCurrentFlashWords();
  if (!words.length || ui.flashcard.animating) return;
  ui.flashcard.flipped = !ui.flashcard.flipped;
  refs.flashCard.classList.toggle("is-flipped", ui.flashcard.flipped);
}

function toggleFlashRandom() {
  ui.flashcard.randomized = !ui.flashcard.randomized;
  ui.flashcard.order = [];
  ui.flashcard.index = 0;
  ui.flashcard.flipped = false;
  renderFlashcards();
}

function isTypingElement(target) {
  if (!(target instanceof Element)) return false;
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLSelectElement) return true;
  return target.isContentEditable;
}

function bindGlobalShortcuts() {
  window.addEventListener("keydown", (event) => {
    if (isTypingElement(event.target)) return;

    if (event.code === "Space") {
      if (ui.activeView === "flashcards") {
        event.preventDefault();
        flipFlashcard();
        return;
      }
      if (ui.activeView === "fortress") {
        const game = ui.fortress;
        if (!game.battleStarted || game.turn !== "player" || game.phase !== "aiming") return;
        event.preventDefault();
        fortressPlayerAct();
        return;
      }
    }

    if (ui.activeView === "flashcards" && event.code === "ArrowLeft") {
      event.preventDefault();
      moveFlashcard(-1);
      return;
    }
    if (ui.activeView === "flashcards" && event.code === "ArrowRight") {
      event.preventDefault();
      moveFlashcard(1);
      return;
    }

    if (event.key === "/") {
      event.preventDefault();
      setActiveView("search");
      refs.searchInput?.focus();
      refs.searchInput?.select();
      return;
    }

    const key = String(event.key || "").toLowerCase();
    if (key === "l" && ui.activeView === "search") {
      event.preventDefault();
      quickAddFirstSearchResult();
      return;
    }
    if (key === "f" && ui.activeView === "flashcards") {
      event.preventDefault();
      flipFlashcard();
      return;
    }
    if (key === "r" && ui.activeView === "flashcards") {
      event.preventDefault();
      toggleFlashRandom();
    }
  });
}

function quickAddFirstSearchResult() {
  if (!ui.searchResults.length) return;
  const entry = ui.searchResults[0];
  const listId =
    (ui.lastUsedListId && state.lists.some((x) => x.id === ui.lastUsedListId) && ui.lastUsedListId) ||
    state.lists[0]?.id ||
    "";
  if (!listId) {
    alert(t("lists.createListBeforeAdd"));
    return;
  }
  addWordToList(listId, entry);
}

function inferSpeechLang(text) {
  const value = String(text || "");
  if (!value.trim()) return "en-US";
  if (RE_JAPANESE_CHARS.test(value)) return "ja-JP";
  return "en-US";
}

let activeWordAudio = null;

function ensureNativeAudioCached(audioUrl, eager = false) {
  const url = String(audioUrl || "").trim();
  if (!url) return null;
  if (nativeAudioCache.has(url)) {
    return nativeAudioCache.get(url) || null;
  }
  try {
    const audio = new Audio(url);
    audio.preload = eager ? "auto" : "metadata";
    nativeAudioCache.set(url, audio);
    if (nativeAudioCache.size > 28) {
      const firstKey = nativeAudioCache.keys().next().value;
      if (firstKey) {
        const firstAudio = nativeAudioCache.get(firstKey);
        if (firstAudio) {
          firstAudio.pause();
          firstAudio.src = "";
        }
        nativeAudioCache.delete(firstKey);
      }
    }
    if (eager) {
      try {
        audio.load();
      } catch (error) {
        // ignore preload failures
      }
    }
    return audio;
  } catch (error) {
    return null;
  }
}

function playNativeWordAudio(audioUrl) {
  const url = String(audioUrl || "").trim();
  if (!url) return false;
  try {
    const audio = ensureNativeAudioCached(url, true);
    if (!audio) return false;
    if (activeWordAudio && activeWordAudio !== audio) {
      activeWordAudio.pause();
    }
    audio.currentTime = 0;
    activeWordAudio = audio;
    const playback = audio.play();
    if (playback && typeof playback.catch === "function") {
      playback.catch(() => {});
    }
    audio.addEventListener(
      "ended",
      () => {
        if (activeWordAudio === audio) activeWordAudio = null;
      },
      { once: true }
    );
    return true;
  } catch (error) {
    return false;
  }
}

function speakWord(word, audioUrl = "") {
  const text = String(word || "").trim();
  if (!text && !audioUrl) return;
  if (playNativeWordAudio(audioUrl)) return;
  if (text) {
    resolveWordAudioUrl(text)
      .then((resolvedUrl) => {
        if (playNativeWordAudio(resolvedUrl)) return;
        speakWordWithSynthesis(text);
      })
      .catch(() => {
        speakWordWithSynthesis(text);
      });
    return;
  }
  if (!text) return;
  speakWordWithSynthesis(text);
}

function pickBestAudioFromResults(results, word) {
  if (!Array.isArray(results) || !results.length) return "";
  const target = normalizeComparableText(word);
  const withAudio = results.filter((row) => row && String(row.audioUrl || "").trim());
  if (!withAudio.length) return "";

  let bestUrl = "";
  let bestScore = -1;
  withAudio.forEach((row) => {
    const rowWord = normalizeComparableText(row.word || "");
    let score = 0;
    if (target && rowWord) {
      if (rowWord === target) score = 100;
      else if (rowWord.includes(target) || target.includes(rowWord)) score = 80;
    }
    if (score > bestScore) {
      bestScore = score;
      bestUrl = String(row.audioUrl || "").trim();
    }
  });
  return bestUrl || String(withAudio[0].audioUrl || "").trim();
}

function warmAudioForRows(rows) {
  if (!Array.isArray(rows) || !rows.length) return;
  rows.forEach((row) => {
    const directUrl = String(row?.audioUrl || "").trim();
    if (directUrl) {
      ensureNativeAudioCached(directUrl, true);
      return;
    }
    const word = String(row?.word || "").trim();
    if (!word) return;
    resolveWordAudioUrl(word)
      .then((resolvedUrl) => {
        if (resolvedUrl) ensureNativeAudioCached(resolvedUrl, true);
      })
      .catch(() => {});
  });
}

async function resolveWordAudioUrl(word) {
  const queryText = String(word || "").trim();
  if (!queryText) return "";
  const cacheKey = queryText.toLowerCase();
  if (wordAudioResolveCache.has(cacheKey)) {
    return wordAudioResolveCache.get(cacheKey) || "";
  }
  if (wordAudioResolveInFlight.has(cacheKey)) {
    return wordAudioResolveInFlight.get(cacheKey);
  }
  const pending = (async () => {
    const payload = await fetchSearchCached(queryText);
    const url = pickBestAudioFromResults(payload?.results || [], queryText);
    wordAudioResolveCache.set(cacheKey, url || "");
    capMapSize(wordAudioResolveCache, 320);
    return url || "";
  })();
  wordAudioResolveInFlight.set(cacheKey, pending);
  try {
    return await pending;
  } finally {
    wordAudioResolveInFlight.delete(cacheKey);
  }
}

function speakWordWithSynthesis(text) {
  if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;

  const utterance = new SpeechSynthesisUtterance(text);
  const lang = inferSpeechLang(text);
  utterance.lang = lang;
  utterance.rate = lang.startsWith("ja") ? 0.92 : 0.96;
  const voices = window.speechSynthesis.getVoices?.() || [];
  const match = voices.find((voice) =>
    String(voice.lang || "").toLowerCase().startsWith(lang.slice(0, 2).toLowerCase())
  );
  if (match) utterance.voice = match;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function getCurrentFlashWords() {
  const list = state.lists.find((x) => x.id === ui.flashcard.listId);
  const words = list ? list.words : [];
  if (!ui.flashcard.randomized) {
    ui.flashcard.order = [];
    return words;
  }

  const validOrder =
    ui.flashcard.order.length === words.length &&
    new Set(ui.flashcard.order).size === words.length &&
    ui.flashcard.order.every((index) => index >= 0 && index < words.length);

  if (!validOrder) {
    ui.flashcard.order = Array.from({ length: words.length }, (_, i) => i);
    for (let i = ui.flashcard.order.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [ui.flashcard.order[i], ui.flashcard.order[j]] = [ui.flashcard.order[j], ui.flashcard.order[i]];
    }
  }
  return ui.flashcard.order.map((index) => words[index]).filter(Boolean);
}

function renderFlashcards() {
  refreshListSelectors();
  const words = getCurrentFlashWords();
  if (refs.flashRandomBtn) {
    refs.flashRandomBtn.textContent = ui.flashcard.randomized
      ? t("flash.randomOn")
      : t("flash.randomOff");
  }

  if (!words.length) {
    refs.flashWord.textContent = t("flash.noCard");
    refs.flashFuri.textContent = t("flash.addWordsLine1");
    refs.flashMeaning.textContent = t("flash.addWordsLine2");
    refs.flashExampleJp.textContent = "";
    refs.flashExampleKo.textContent = "";
    refs.flashExampleKo.style.display = "none";
    refs.flashMeta.textContent = t("flash.metaEmpty");
    refs.flashCard.classList.remove("is-flipped");
    if (refs.flashScene) {
      refs.flashScene.classList.remove(
        "slide-out-left",
        "slide-out-right",
        "slide-in-left",
        "slide-in-right"
      );
    }
    ui.flashcard.animating = false;
    ui.flashcard.pendingDelta = 0;
    ui.flashcard.order = [];
    if (refs.flashWordAudioBtn) {
      refs.flashWordAudioBtn.disabled = true;
    }
    refs.flashProgress.style.width = "0%";
    return;
  }

  if (ui.flashcard.index >= words.length) {
    ui.flashcard.index = 0;
  }
  const card = words[ui.flashcard.index];
  const prev = words[(ui.flashcard.index - 1 + words.length) % words.length];
  const next = words[(ui.flashcard.index + 1) % words.length];
  warmAudioForRows([card, prev, next]);
  if (refs.flashWordAudioBtn) {
    refs.flashWordAudioBtn.disabled = false;
  }
  refs.flashWord.textContent = card.word || "(no word)";
  refs.flashFuri.textContent = card.furigana || t("common.noFurigana");
  refs.flashMeaning.textContent = card.meaning || t("common.noMeaning");
  setExampleContent(refs.flashExampleJp, refs.flashExampleKo, card);
  if (shouldBackfillRuby(card) && card.example && !hasRubyReadings(card.exampleRuby)) {
    backfillMissingRubyForSavedWords();
  }
  refs.flashMeta.textContent = `${ui.flashcard.index + 1} / ${words.length} cards`;
  refs.flashCard.classList.toggle("is-flipped", ui.flashcard.flipped);
  refs.flashProgress.style.width = `${((ui.flashcard.index + 1) / words.length) * 100}%`;
}

function bindQuiz() {
  refs.quizListSelect.addEventListener("change", () => {
    ui.quiz.listId = refs.quizListSelect.value;
    resetQuiz();
    renderQuizSetupHint();
  });

  refs.quizModeSelect.addEventListener("change", () => {
    if (refs.quizModeSelect.value === "game") {
      ui.quiz.mode = "game";
    } else if (refs.quizModeSelect.value === "artillery") {
      ui.quiz.mode = "artillery";
    } else {
      ui.quiz.mode = "standard";
    }
    resetQuiz();
    renderQuizSetupHint();
  });

  refs.quizStartBtn.addEventListener("click", () => {
    if (ui.quiz.mode === "game") {
      startGameQuiz();
    } else if (ui.quiz.mode === "artillery") {
      startArtilleryQuiz();
    } else {
      startQuiz();
    }
  });
}

function bindFortress() {
  mountFortressUi();
  if (!ui.fortress.terrainHeights.length) {
    buildFortressTerrain();
  }
  if (!refs.fortressRoot) return;

  refs.fortressRoot.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest("[data-fortress-action]");
    if (!button) return;
    const action = String(button.dataset.fortressAction || "");
    if (action === "start") {
      startFortressGame();
    } else if (action === "fire") {
      const game = ui.fortress;
      if (!game.battleStarted || game.turn !== "player" || game.phase !== "aiming") return;
      fortressPlayerAct();
    } else if (action === "reset") {
      resetFortressState();
      drawFortressScene();
      updateFortressHud();
    }
  });

  refs.fortressRoot.addEventListener("pointerdown", (event) => {
    if (!(event.target instanceof Element)) return;
    const canvas = event.target.closest("#fortress-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const game = ui.fortress;
    if (!game.battleStarted || game.turn !== "player" || game.phase !== "aiming") return;
    game.touchAimActive = true;
    game.touchAimMoved = false;
    updateFortressAimFromPointer(canvas, event);
  });
  refs.fortressRoot.addEventListener("pointermove", (event) => {
    if (!(event.target instanceof Element)) return;
    const canvas = event.target.closest("#fortress-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const game = ui.fortress;
    if (!game.touchAimActive) return;
    game.touchAimMoved = true;
    updateFortressAimFromPointer(canvas, event);
  });
  refs.fortressRoot.addEventListener("pointerup", (event) => {
    if (!(event.target instanceof Element)) return;
    const canvas = event.target.closest("#fortress-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const game = ui.fortress;
    if (!game.battleStarted || game.turn !== "player" || game.phase !== "aiming") return;
    updateFortressAimFromPointer(canvas, event);
    game.touchAimActive = false;
    fortressPlayerAct();
  });
  refs.fortressRoot.addEventListener("pointercancel", () => {
    ui.fortress.touchAimActive = false;
  });

  refs.fortressTopStartBtn?.addEventListener("click", () => {
    startFortressGame();
  });

  drawFortressScene();
  updateFortressHud();
}

function updateFortressAimFromPointer(canvas, event) {
  const game = ui.fortress;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const cx = event.clientX - rect.left;
  const cy = event.clientY - rect.top;
  const cannon = worldToCanvas(canvas, game.playerX, terrainAtFortress(game.playerX) + 4.05);
  const dx = Math.max(2, cx - cannon.x);
  const dy = Math.max(0, cannon.y - cy);
  const deg = Math.max(10, Math.min(74, (Math.atan2(dy, dx) * 180) / Math.PI));
  game.currentAngle = deg;
  game.aimNorm = (deg - 10) / 64;
  game.currentPower = lerp(60, 108, game.aimNorm);
  drawFortressScene();
  updateFortressHud();
}

function fortressPlayerAct() {
  const game = ui.fortress;
  if (!game.battleStarted || game.turn !== "player" || game.phase !== "aiming") return;
  game.aimStep = "angle";
  fireFortressShot("player", game.currentAngle, game.currentPower);
}

function mountFortressUi() {
  if (!refs.fortressRoot) return;
  if (refs.fortressRoot.querySelector(".fortress-shell")) return;
  refs.fortressRoot.innerHTML = `
    <div class="fortress-shell">
      <div class="fortress-head" id="fortress-head"></div>
      <div class="fortress-bars">
        <div class="meter player"><span id="fortress-player-hp" style="width:100%;"></span></div>
        <div class="meter enemy"><span id="fortress-enemy-hp" style="width:100%;"></span></div>
      </div>
      <div class="fortress-canvas-wrap">
        <canvas id="fortress-canvas" class="fortress-canvas" width="1240" height="520"></canvas>
      </div>
      <div class="fortress-controls">
        <p id="fortress-angle-text" class="fortress-angle-text"></p>
        <div class="fortress-actions">
          <button type="button" data-fortress-action="start">${escapeHtml(t("common.start"))}</button>
          <button type="button" data-fortress-action="fire">${escapeHtml(t("common.fire"))}</button>
          <button type="button" data-fortress-action="reset">${escapeHtml(t("common.reset"))}</button>
        </div>
      </div>
      <div class="fortress-stats" id="fortress-stats"></div>
      <p class="fortress-msg" id="fortress-msg"></p>
    </div>
  `;
}

function fortressEls() {
  if (!refs.fortressRoot) return {};
  return {
    head: refs.fortressRoot.querySelector("#fortress-head"),
    playerHp: refs.fortressRoot.querySelector("#fortress-player-hp"),
    enemyHp: refs.fortressRoot.querySelector("#fortress-enemy-hp"),
    angleText: refs.fortressRoot.querySelector("#fortress-angle-text"),
    stats: refs.fortressRoot.querySelector("#fortress-stats"),
    msg: refs.fortressRoot.querySelector("#fortress-msg"),
    canvas: refs.fortressRoot.querySelector("#fortress-canvas"),
    startButton: refs.fortressRoot.querySelector('[data-fortress-action="start"]'),
    fireButton: refs.fortressRoot.querySelector('[data-fortress-action="fire"]'),
  };
}

function getFortressCampaignStage(index = fortressStats.campaignStage) {
  if (!FORTRESS_CAMPAIGN_STAGES.length) {
    return {
      key: "skirmish",
      name: "Skirmish",
      terrainProfile: "crossroads",
      enemyHp: 100,
      playerHp: 100,
      weatherPool: ["clear"],
      briefing: "Field engagement.",
    };
  }
  const clamped = Math.max(0, Math.min(FORTRESS_CAMPAIGN_STAGES.length - 1, Number(index) || 0));
  return FORTRESS_CAMPAIGN_STAGES[clamped];
}

function pickFortressWeather(stage) {
  const pool = Array.isArray(stage?.weatherPool) && stage.weatherPool.length
    ? stage.weatherPool
    : Object.keys(FORTRESS_WEATHER_TYPES);
  const key = pool[Math.floor(Math.random() * pool.length)] || "clear";
  return FORTRESS_WEATHER_TYPES[key] || FORTRESS_WEATHER_TYPES.clear;
}

function applyFortressTurnWeather(game) {
  const weather = game.weather || FORTRESS_WEATHER_TYPES.clear;
  if (Math.random() < weather.gustChance) {
    const shift = Math.round((Math.random() * 2 - 1) * weather.windShift);
    game.wind = Math.max(-9, Math.min(9, game.wind + shift));
    if (shift !== 0) {
      const dir = shift > 0 ? "increased" : "dropped";
      return `Weather shift: wind ${dir} to ${game.wind > 0 ? "+" : ""}${game.wind}.`;
    }
  }
  return "";
}

function resetFortressState(options = {}) {
  if (ui.fortress.rafId) {
    cancelAnimationFrame(ui.fortress.rafId);
  }
  ui.fortress = createInitialFortressState();
  if (options.stage) {
    ui.fortress.stage = options.stage;
    ui.fortress.stageIndex = Number(options.stageIndex) || 0;
  }
  if (options.weather) {
    ui.fortress.weather = options.weather;
  }
  buildFortressTerrain(options.terrainProfile || options.stage?.terrainProfile);
}

function startFortressGame() {
  if (!refs.fortressRoot) return;
  if (!refs.fortressRoot.querySelector(".fortress-shell")) {
    mountFortressUi();
  }
  const stageIndex = fortressStats.campaignStage || 0;
  const stage = getFortressCampaignStage(stageIndex);
  const weather = pickFortressWeather(stage);
  resetFortressState({
    stage,
    stageIndex,
    weather,
    terrainProfile: stage.terrainProfile,
  });
  const game = ui.fortress;
  game.playerHp = stage.playerHp || 100;
  game.enemyHp = stage.enemyHp || 100;
  game.battleStarted = true;
  game.phase = "aiming";
  game.aimStep = "angle";
  game.turn = "player";
  game.turnCount = 1;
  game.replayVisible = false;
  game.replayHint = "";
  game.shotHistory = [];
  game.impactHistory = [];
  game.activeShot = null;
  game.startTime = Date.now();
  game.wind = randomFortressWind();
  game.windPhase = Math.random() * Math.PI * 2;
  game.crew.player.phase = "aiming";
  game.crew.enemy.phase = "idle";
  const halfView = (game.viewWidth || game.worldWidth) / 2;
  game.cameraX = Math.max(
    halfView,
    Math.min(game.worldWidth - halfView, game.playerX + (game.viewWidth || game.worldWidth) * 0.32)
  );
  game.message = `${stage.name} | ${weather.name}: ${weather.description}`;
  const weatherMsg = applyFortressTurnWeather(game);
  if (weatherMsg) {
    game.message += ` ${weatherMsg}`;
  }
  game.message += ` ${t("fortress.yourTurn")}`;
  updateFortressHud();
  drawFortressScene();
  startFortressLoop();
}

function startFortressLoop() {
  if (ui.fortress.rafId) return;
  ui.fortress.lastTickMs = 0;
  ui.fortress.rafId = requestAnimationFrame(runFortressFrame);
}

function runFortressFrame(timestamp) {
  const game = ui.fortress;
  const dtRaw = game.lastTickMs ? (timestamp - game.lastTickMs) / 1000 : 1 / 60;
  const baseDt = Math.min(0.033, Math.max(0.001, dtRaw));
  game.lastTickMs = timestamp;
  game.nowMs = timestamp;
  if (game.slowMoTime > 0) {
    game.slowMoTime = Math.max(0, game.slowMoTime - baseDt);
    game.timeScale = 0.42;
  } else {
    game.timeScale += (1 - game.timeScale) * 0.18;
  }
  const dt = baseDt * game.timeScale;
  game.windPhase += dt * (0.9 + Math.abs(game.wind) * 0.1);

  if (game.hitPause > 0) {
    game.hitPause = Math.max(0, game.hitPause - dt);
  }

  if (game.hitPause <= 0 && game.battleStarted && game.turn === "player" && game.phase === "aiming") {
    const weatherAim = game.weather?.aimSpeedMult || 1;
    game.aimNorm += game.aimDir * game.aimSpeed * weatherAim * dt;
    if (game.aimNorm >= 1) {
      game.aimNorm = 1;
      game.aimDir = -1;
    }
    if (game.aimNorm <= 0) {
      game.aimNorm = 0;
      game.aimDir = 1;
    }
    game.currentAngle = lerp(10, 74, game.aimNorm);
    game.currentPower = lerp(60, 108, game.aimNorm);
  }

  if (game.hitPause <= 0 && game.projectile) {
    stepFortressProjectile(dt);
  }
  updateFortressCamera(dt);
  const viewTarget = game.projectile ? Math.max(60, game.projectile.y + 20) : 60;
  const clampedView = Math.min(180, viewTarget);
  game.viewHeight += (clampedView - game.viewHeight) * 0.18;
  if (game.explosionParticles.length) {
    stepFortressExplosions(dt);
  }
  if (game.debrisParticles.length) {
    stepFortressDebris(dt);
  }
  if (game.impactRings.length) {
    stepFortressRings(dt);
  }
  stepFortressCrew(dt);
  stepFortressFloatingTexts(dt);
  stepFortressHitBanner(dt);
  if (game.shakeTime > 0) {
    game.shakeTime = Math.max(0, game.shakeTime - dt);
  }
  game.screenGrime = Math.max(0, game.screenGrime - baseDt * 0.09);

  if (ui.activeView === "fortress") {
    drawFortressScene();
    updateFortressHud();
  }

  if (
    game.battleStarted ||
    game.projectile ||
    game.phase === "enemy-thinking" ||
    game.explosionParticles.length ||
    game.debrisParticles.length ||
    game.impactRings.length ||
    game.floatingTexts.length ||
    game.hitBanner.life > 0 ||
    game.shakeTime > 0
  ) {
    game.rafId = requestAnimationFrame(runFortressFrame);
  } else {
    game.rafId = 0;
  }
}

function updateFortressCamera(dt) {
  const game = ui.fortress;
  const worldWidth = game.worldWidth || 100;
  const viewWidth = Math.max(40, Math.min(worldWidth, game.viewWidth || worldWidth));
  const halfView = viewWidth / 2;
  let target = game.cameraX || halfView;
  if (game.projectile) {
    target = game.projectile.x;
  } else if (game.turn === "player") {
    target = game.playerX + viewWidth * 0.32;
  } else if (game.turn === "enemy") {
    target = game.enemyX - viewWidth * 0.32;
  }
  target = Math.max(halfView, Math.min(worldWidth - halfView, target));
  const follow = Math.min(1, Math.max(0.04, dt * 6.5));
  game.cameraX = (game.cameraX || target) + (target - (game.cameraX || target)) * follow;
}

function stepFortressProjectile(dt) {
  const game = ui.fortress;
  const p = game.projectile;
  if (!p) return;

  p.life += dt;
  p.wallCooldown = Math.max(0, p.wallCooldown - dt);
  p.vx += game.wind * FORTRESS_WIND_ACCEL * dt;
  p.vy -= FORTRESS_GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  if (p.life > 10 || p.x < -16 || p.x > game.worldWidth + 16 || p.y < -10 || p.y > 260) {
    resolveFortressImpact("miss", p.x, terrainAtFortress(p.x));
    return;
  }

  const targetSide = p.owner === "player" ? "enemy" : "player";
  if (p.life > 0.1 && checkFortressBatteryHit(p, targetSide)) {
    resolveFortressImpact("direct", p.x, p.y);
    return;
  }

  if (p.life > 0.04) {
    game.projectileTrail.push({ x: p.x, y: p.y });
    appendFortressShotPoint(p.x, p.y);
    if (game.projectileTrail.length > 75) {
      game.projectileTrail.shift();
    }
  }

  const wall = getTouchedFortressWall(p);
  const touchingWall = Boolean(wall);

  if (touchingWall && p.wallCooldown <= 0) {
    if (wall.hitsRemaining > 1 && !p.bounced) {
      wall.hitsRemaining -= 1;
      p.bounced = true;
      p.wallCooldown = 0.08;
      p.x += p.vx > 0 ? -0.6 : 0.6;
      p.vx *= -0.72;
      p.vy *= 0.9;
      spawnFortressExplosion(p.x, p.y, 0.7, "wall");
      game.message = `${capitalize(p.owner)} shot ricocheted. Wall damaged (${wall.hitsRemaining}/3 left).`;
      return;
    }
    if (wall.hitsRemaining > 0) {
      wall.hitsRemaining -= 1;
    }
    if (wall.hitsRemaining <= 0) {
      wall.destroyed = true;
      spawnFortressExplosion(p.x, p.y, 1.2, "wallbreak");
      game.message = "Wall destroyed after 3 hits!";
      p.wallCooldown = 0.15;
      p.vx *= 0.86;
      p.vy *= 0.92;
      return;
    }
    spawnFortressExplosion(p.x, p.y, 0.8, "wall");
    resolveFortressImpact("terrain", p.x, p.y);
    return;
  }

  const groundY = terrainAtFortress(p.x);
  if (p.y <= groundY) {
    resolveFortressImpact("ground", p.x, groundY);
  }
}

function getTouchedFortressWall(projectile) {
  const walls = ui.fortress.walls || [];
  for (const wall of walls) {
    if (wall.destroyed) continue;
    const wallBase = terrainAtFortress(wall.x);
    const wallTop = wallBase + wall.h;
    const wallLeft = wall.x - wall.w / 2;
    const wallRight = wall.x + wall.w / 2;
    if (
      projectile.x >= wallLeft &&
      projectile.x <= wallRight &&
      projectile.y >= wallBase &&
      projectile.y <= wallTop
    ) {
      return wall;
    }
  }
  return null;
}

function checkFortressBatteryHit(projectile, side) {
  const isEnemy = side === "enemy";
  const bx = isEnemy ? ui.fortress.enemyX : ui.fortress.playerX;
  const by = terrainAtFortress(bx);
  const dx = projectile.x - bx;
  const dy = projectile.y - (by + 4.3);
  if (Math.abs(dx) <= 5.4 && Math.abs(dy) <= 6.2) return true;
  const cannonDx = projectile.x - (isEnemy ? bx - 1.8 : bx + 1.8);
  const cannonDy = projectile.y - (by + 2.5);
  return Math.abs(cannonDx) <= 4.8 && Math.abs(cannonDy) <= 3.4;
}

function stepFortressExplosions(dt) {
  const particles = ui.fortress.explosionParticles;
  for (let i = particles.length - 1; i >= 0; i -= 1) {
    const p = particles[i];
    p.life -= dt;
    p.vy -= 26 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function stepFortressDebris(dt) {
  const game = ui.fortress;
  const debris = game.debrisParticles;
  for (let i = debris.length - 1; i >= 0; i -= 1) {
    const d = debris[i];
    d.life -= dt;
    d.vy -= 28 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    const ground = terrainAtFortress(d.x);
    if (d.y <= ground) {
      d.y = ground + 0.06;
      d.vy *= -0.26;
      d.vx *= 0.72;
    }
    if (d.life <= 0) {
      debris.splice(i, 1);
    }
  }
}

function stepFortressRings(dt) {
  const rings = ui.fortress.impactRings;
  for (let i = rings.length - 1; i >= 0; i -= 1) {
    const ring = rings[i];
    ring.life -= dt;
    ring.r += ring.speed * dt;
    if (ring.life <= 0) {
      rings.splice(i, 1);
    }
  }
}

function setFortressCrewPhase(side, phase, duration = 0) {
  const crew = ui.fortress.crew?.[side];
  if (!crew) return;
  crew.phase = phase;
  crew.timer = Math.max(0, duration);
}

function stepFortressCrew(dt) {
  const game = ui.fortress;
  ["player", "enemy"].forEach((side) => {
    const crew = game.crew?.[side];
    if (!crew) return;
    crew.knockback = Math.max(0, (crew.knockback || 0) - dt * 2.8);
    if (crew.timer > 0) {
      crew.timer = Math.max(0, crew.timer - dt);
      if (crew.timer > 0) return;
    }

    if (game.projectile && game.projectile.owner === side) {
      crew.phase = "fire";
      return;
    }
    if (side === "player" && game.turn === "player" && game.phase === "aiming") {
      crew.phase = "aiming";
      return;
    }
    if (side === "enemy" && game.turn === "enemy" && game.phase === "enemy-thinking") {
      if (crew.phase === "idle") crew.phase = "load";
      return;
    }
    if (game.projectile && game.projectile.owner !== side) {
      crew.phase = "brace";
      return;
    }
    crew.phase = "idle";
  });
}

function spawnFortressFloatingText(x, y, text, color = "#fff7d5", scale = 1) {
  const game = ui.fortress;
  game.floatingTexts.push({
    x,
    y,
    text,
    color,
    scale,
    life: 1.15,
    vy: 3.4 + Math.random() * 1.8,
    vx: Math.random() * 1.2 - 0.6,
  });
  if (game.floatingTexts.length > 18) {
    game.floatingTexts.shift();
  }
}

function stepFortressFloatingTexts(dt) {
  const texts = ui.fortress.floatingTexts;
  for (let i = texts.length - 1; i >= 0; i -= 1) {
    const t = texts[i];
    t.life -= dt;
    t.y += t.vy * dt;
    t.x += t.vx * dt;
    t.vy *= 0.985;
    if (t.life <= 0) {
      texts.splice(i, 1);
    }
  }
}

function showFortressHitBanner(text, color = "#ffe372", life = 1.15) {
  const banner = ui.fortress.hitBanner;
  banner.text = text;
  banner.color = color;
  banner.life = life;
}

function stepFortressHitBanner(dt) {
  const banner = ui.fortress.hitBanner;
  banner.life = Math.max(0, banner.life - dt);
  if (banner.life <= 0) {
    banner.text = "";
  }
}

function spawnFortressExplosion(x, y, intensity = 1, mode = "ground") {
  const game = ui.fortress;
  const count = mode === "wallbreak" ? 52 : mode === "wall" ? 30 : mode === "hit" ? 42 : 24;
  const colorA = mode === "wallbreak" ? "#d6def5" : "#ffd97d";
  const colorB = mode === "wallbreak" ? "#9fa8c8" : "#ff8f4a";
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = (10 + Math.random() * 26) * intensity;
    game.explosionParticles.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed + 8,
      r: (mode === "wallbreak" ? 1.4 : 1) * (0.5 + Math.random() * 1.6),
      life: 0.25 + Math.random() * 0.45,
      colorA,
      colorB,
    });
  }
  game.impactRings.push({
    x,
    y,
    r: 1.5 + Math.random() * 2,
    speed: 9 + Math.random() * 9,
    life: mode === "hit" ? 0.45 : 0.3,
    color: mode === "wallbreak" ? "rgba(225,235,255,0.9)" : "rgba(255,244,196,0.9)",
  });
  const debrisCount = mode === "wallbreak" ? 24 : mode === "hit" ? 14 : 8;
  for (let i = 0; i < debrisCount; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const speed = (8 + Math.random() * 18) * intensity;
    game.debrisParticles.push({
      x,
      y,
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed + 8,
      life: 0.45 + Math.random() * 0.7,
      size: 0.5 + Math.random() * 1.5,
      color: mode === "wallbreak" ? "#9c7653" : "#71593f",
    });
  }
  if (game.debrisParticles.length > 220) {
    game.debrisParticles.splice(0, game.debrisParticles.length - 220);
  }
}

function triggerFortressShake(power = 1) {
  const game = ui.fortress;
  game.shakePower = Math.max(game.shakePower, 3 * power);
  game.shakeTime = Math.max(game.shakeTime, 0.14 * power);
  game.hitPause = Math.max(game.hitPause, 0.02 + power * 0.015);
}

function beginFortressShotRecord(owner, angle, power, wind) {
  const game = ui.fortress;
  game.activeShot = {
    owner,
    angle: Math.round(angle),
    power: Math.round(power),
    wind,
    startedAt: Date.now(),
    path: [],
    stage: game.stage?.key || "",
    weather: game.weather?.key || "clear",
  };
}

function appendFortressShotPoint(x, y) {
  const shot = ui.fortress.activeShot;
  if (!shot) return;
  const last = shot.path[shot.path.length - 1];
  if (last && Math.hypot(last.x - x, last.y - y) < 1.2) return;
  shot.path.push({ x, y });
  if (shot.path.length > 130) {
    shot.path.shift();
  }
}

function finalizeFortressShotRecord(result, damage, impactX, impactY, distanceToTarget) {
  const game = ui.fortress;
  const shot = game.activeShot;
  if (!shot) return;
  const impact = {
    x: impactX,
    y: impactY,
    owner: shot.owner,
    damage: Math.max(0, Number(damage) || 0),
    result,
    distance: Number.isFinite(distanceToTarget) ? Math.round(distanceToTarget * 10) / 10 : null,
  };
  game.impactHistory.push(impact);
  if (game.impactHistory.length > 42) {
    game.impactHistory.shift();
  }
  game.shotHistory.push({
    ...shot,
    endedAt: Date.now(),
    result,
    damage: impact.damage,
    impactX,
    impactY,
    distanceToTarget: impact.distance,
  });
  if (game.shotHistory.length > 70) {
    game.shotHistory.shift();
  }
  game.activeShot = null;
}

function createFortressReplayHint() {
  const game = ui.fortress;
  const playerShots = game.shotHistory.filter((s) => s.owner === "player");
  if (!playerShots.length) return "No player shots recorded.";
  const misses = playerShots.filter((s) => s.result !== "direct");
  const targetX = game.enemyX;
  if (!misses.length) return "Direct hits were consistent. Keep current timing rhythm.";
  const avgDelta =
    misses.reduce((sum, s) => sum + ((s.impactX || targetX) - targetX), 0) / Math.max(1, misses.length);
  if (avgDelta > 2.4) {
    return "Most shots overshot. Fire slightly earlier or reduce elevation.";
  }
  if (avgDelta < -2.4) {
    return "Most shots landed short. Fire later or raise elevation.";
  }
  return "Misses cluster near target. Hold timing and watch gust shifts each turn.";
}

function resolveFortressImpact(kind, impactX, impactY) {
  const game = ui.fortress;
  const p = game.projectile;
  if (!p) return;

  const attacker = p.owner;
  const targetX = attacker === "player" ? game.enemyX : game.playerX;
  const targetY = terrainAtFortress(targetX) + 4.4;
  const distance = Math.hypot((impactX || p.x) - targetX, (impactY || p.y) - targetY);

  let damage = 0;
  if (kind === "direct" || distance <= 4) {
    damage = Math.max(18, Math.round(34 - distance * 1.1));
  } else if (distance <= 7) {
    damage = 28;
  } else if (distance <= 10) {
    damage = Math.max(8, Math.round(22 - distance * 1.4));
  }

  if (damage > 0) {
    if (attacker === "player") {
      game.enemyHp = Math.max(0, game.enemyHp - damage);
      fortressStats.totalDamageDealt += damage;
      game.message = `Direct hit! Enemy takes ${damage} HP.`;
      spawnFortressFloatingText(targetX, targetY + 6, `-${damage}`, "#ffed9b", 1.15);
      game.crew.enemy.knockback = Math.max(game.crew.enemy.knockback || 0, 1);
    } else {
      game.playerHp = Math.max(0, game.playerHp - damage);
      game.message = `Enemy hit your battery for ${damage} HP.`;
      spawnFortressFloatingText(targetX, targetY + 6, `-${damage}`, "#ffb9a3", 1.15);
      game.crew.player.knockback = Math.max(game.crew.player.knockback || 0, 1);
    }
    if (kind === "direct" || distance <= 2.8) {
      showFortressHitBanner("DIRECT HIT", "#ffe372", 1.1);
      if (attacker === "player") {
        fortressStats.totalDirectHits += 1;
      }
      game.slowMoTime = Math.max(game.slowMoTime, 0.22);
      game.timeScale = Math.min(game.timeScale, 0.42);
      game.screenGrime = Math.min(0.65, game.screenGrime + 0.2);
    } else {
      showFortressHitBanner("Battery Damaged", "#ffd9a1", 0.85);
      game.screenGrime = Math.min(0.65, game.screenGrime + 0.12);
    }
    triggerFortressShake(kind === "direct" ? 1.2 : 0.9);
  } else if (kind === "terrain") {
    game.message = `${capitalize(attacker)} shot shattered against terrain.`;
    spawnFortressFloatingText(impactX || p.x, (impactY || p.y) + 3.5, "BLOCKED", "#dce6ff", 0.88);
    triggerFortressShake(0.45);
  } else if (kind === "ground") {
    game.message = `${capitalize(attacker)} shot landed short.`;
    spawnFortressFloatingText(impactX || p.x, (impactY || p.y) + 2.2, "SHORT", "#dce6ff", 0.84);
    triggerFortressShake(0.35);
  } else {
    game.message = `${capitalize(attacker)} shot flew out of range.`;
    spawnFortressFloatingText(targetX, targetY + 3.4, "MISS", "#dce6ff", 0.84);
  }

  const ix = impactX || p.x;
  const iy = impactY || p.y;
  spawnFortressExplosion(ix, iy, damage > 0 ? 1.25 : 0.9, damage > 0 ? "hit" : kind);
  if (kind !== "wall") {
    const craterPower = kind === "direct" ? 0.9 : damage > 0 ? 1 : 0.7;
    addFortressCrater(ix, craterPower);
  }
  game.lastImpact = { x: ix, y: iy, t: Date.now() };
  finalizeFortressShotRecord(kind, damage, ix, iy, distance);
  game.projectile = null;
  game.projectileTrail = [];
  game.phase = "idle";
  finishFortressTurn();
}

function finishFortressTurn() {
  const game = ui.fortress;

  if (game.enemyHp <= 0 || game.playerHp <= 0) {
    game.battleStarted = false;
    game.phase = "ended";
    game.replayVisible = true;
    game.replayHint = createFortressReplayHint();
    const playerWon = game.enemyHp <= 0;
    game.winner = playerWon ? "You win the fortress duel." : "Enemy wins the fortress duel.";
    game.message = `${game.winner} Replay analysis ready below.`;
    registerFortressResult(playerWon);
    saveFortressStats();
    updateFortressHud();
    return;
  }

  if (game.turn === "player") {
    game.turnCount += 1;
    game.turn = "enemy";
    game.phase = "enemy-thinking";
    game.message = "Enemy battery: load cartridge...";
    const weatherMsg = applyFortressTurnWeather(game);
    if (weatherMsg) game.message += ` ${weatherMsg}`;
    setFortressCrewPhase("enemy", "load", 0.48);
    setFortressCrewPhase("player", "brace", 0.62);
    scheduleEnemyFortressShotCycle();
  } else {
    game.turnCount += 1;
    game.turn = "player";
    game.phase = "aiming";
    game.aimStep = "angle";
    game.aimDir = Math.random() > 0.5 ? 1 : -1;
    game.wind = Math.max(-8, Math.min(8, game.wind + Math.round((Math.random() * 2 - 1) * 2)));
    const weatherMsg = applyFortressTurnWeather(game);
    game.message = t("fortress.yourTurn");
    if (weatherMsg) game.message += ` ${weatherMsg}`;
    setFortressCrewPhase("enemy", "idle", 0);
    setFortressCrewPhase("player", "aiming", 0);
  }
}

function scheduleEnemyFortressShotCycle() {
  window.setTimeout(() => {
    const game = ui.fortress;
    if (!game.battleStarted || game.turn !== "enemy" || game.phase !== "enemy-thinking") return;
    game.message = "Enemy battery: ram and set fuse...";
    setFortressCrewPhase("enemy", "ram", 0.46);
  }, 360);

  window.setTimeout(() => {
    const game = ui.fortress;
    if (!game.battleStarted || game.turn !== "enemy" || game.phase !== "enemy-thinking") return;
    game.message = "Enemy battery: FIRE!";
    const shot = chooseEnemyFortressShot();
    fireFortressShot("enemy", shot.angle, shot.power);
  }, 880);
}

function chooseEnemyFortressShot() {
  const startX = ui.fortress.enemyX;
  const targetX = ui.fortress.playerX;
  const weather = ui.fortress.weather || FORTRESS_WEATHER_TYPES.clear;
  const dx = Math.abs(targetX - startX);
  let best = { angle: 38, power: 74, score: Infinity };

  for (let i = 0; i < 24; i += 1) {
    const angle = 12 + Math.random() * 58;
    const power = 62 + Math.random() * 46;
    const rad = (Math.PI / 180) * angle;
    const range =
      (((power * FORTRESS_SPEED_MULT) * (power * FORTRESS_SPEED_MULT)) * Math.sin(2 * rad)) /
      FORTRESS_GRAVITY;
    const score = Math.abs(dx - range);
    if (score < best.score) {
      best = { angle, power, score };
    }
  }

  const jitter = weather.aiJitter || 1;
  return {
    angle: best.angle + (Math.random() * 6 - 3) * jitter,
    power: best.power + (Math.random() * 4 - 2) * jitter,
  };
}

function fireFortressShot(side, angleDeg, power) {
  const game = ui.fortress;
  if (!game.battleStarted) return;
  if (game.projectile) return;

  const fromPlayer = side === "player";
  const angle = (Math.PI / 180) * Math.max(10, Math.min(74, Number(angleDeg) || 44));
  const weather = game.weather || FORTRESS_WEATHER_TYPES.clear;
  const shotPower = Math.max(58, Math.min(110, (Number(power) || 72) * (weather.powerMult || 1)));
  const velocity = shotPower * FORTRESS_SPEED_MULT;
  const vxAbs = velocity * Math.cos(angle);
  const vy = velocity * Math.sin(angle);
  const muzzle = getFortressMuzzlePosition(fromPlayer ? "player" : "enemy", (angle * 180) / Math.PI);

  game.phase = "firing";
  const resolvedAngle = Math.round((angle * 180) / Math.PI);
  if (fromPlayer) {
    game.currentAngle = resolvedAngle;
  } else {
    game.enemyAngle = resolvedAngle;
  }
  game.currentPower = Math.round(shotPower);
  beginFortressShotRecord(side, (angle * 180) / Math.PI, shotPower, game.wind);
  appendFortressShotPoint(muzzle.x, muzzle.y);

  if (Math.random() < (weather.misfireChance || 0)) {
    const selfX = fromPlayer ? game.playerX : game.enemyX;
    const selfY = terrainAtFortress(selfX) + 3.8;
    spawnFortressExplosion(selfX + (fromPlayer ? 2 : -2), selfY, 0.85, "ground");
    showFortressHitBanner("MISFIRE", "#ffd9a1", 0.95);
    game.screenGrime = Math.min(0.65, game.screenGrime + 0.1);
    game.message = `${fromPlayer ? "Your" : "Enemy"} powder misfired in ${weather.name}.`;
    spawnFortressFloatingText(selfX, selfY + 4, "MISFIRE", "#ffd9a1", 0.95);
    if (fromPlayer) {
      game.playerHp = Math.max(0, game.playerHp - 3);
    } else {
      game.enemyHp = Math.max(0, game.enemyHp - 3);
    }
    finalizeFortressShotRecord("misfire", 0, selfX, selfY, null);
    game.projectile = null;
    game.projectileTrail = [];
    game.phase = "idle";
    finishFortressTurn();
    return;
  }

  setFortressCrewPhase(side, "fire", 0.34);
  setFortressCrewPhase(fromPlayer ? "enemy" : "player", "brace", 0.28);
  game.projectile = {
    owner: side,
    x: muzzle.x,
    y: muzzle.y,
    vx: fromPlayer ? vxAbs : -vxAbs,
    vy,
    life: 0,
    bounced: false,
    wallCooldown: 0,
  };
  game.projectileTrail = [];
  game.message = `${fromPlayer ? "You" : "Enemy"} fired (${resolvedAngle} deg).`;
}

function buildFortressTerrain(terrainProfile = "crossroads") {
  const game = ui.fortress;
  const seed = Math.floor(Math.random() * 100000) + 1;
  const rng = seededRandom(seed);
  game.terrainProfile = terrainProfile;
  const terrainProfiles = {
    crossroads: {
      base: 6.2,
      waveA: 0.9,
      waveB: 0.6,
      landformCount: [3, 5],
      ampRange: [3.4, 8.8],
      ridgeAmp: [4.5, 8.5],
      ridgeCenters: [0.34, 0.49, 0.64],
      wallCenters: [0.39, 0.5, 0.61],
      wallHeights: [12, 16],
    },
    ridge: {
      base: 6.5,
      waveA: 1.05,
      waveB: 0.85,
      landformCount: [4, 6],
      ampRange: [4.2, 10.6],
      ridgeAmp: [5.5, 10],
      ridgeCenters: [0.31, 0.46, 0.58, 0.7],
      wallCenters: [0.42, 0.55, 0.66],
      wallHeights: [13, 18],
    },
    mudflats: {
      base: 5.5,
      waveA: 0.55,
      waveB: 0.4,
      landformCount: [2, 4],
      ampRange: [2.2, 6],
      ridgeAmp: [3.2, 6.5],
      ridgeCenters: [0.37, 0.52, 0.67],
      wallCenters: [0.41, 0.51, 0.62],
      wallHeights: [11, 15],
    },
    fortress: {
      base: 6.8,
      waveA: 0.75,
      waveB: 0.7,
      landformCount: [4, 7],
      ampRange: [3.8, 9.8],
      ridgeAmp: [4.8, 9.2],
      ridgeCenters: [0.29, 0.45, 0.57, 0.72],
      wallCenters: [0.37, 0.5, 0.64],
      wallHeights: [13, 19],
    },
  };
  const profile = terrainProfiles[terrainProfile] || terrainProfiles.crossroads;
  const heights = new Array(game.worldWidth + 1).fill(0);

  for (let x = 0; x <= game.worldWidth; x += 1) {
    heights[x] =
      profile.base + profile.waveA * Math.sin(x / 10.4) + profile.waveB * Math.sin(x / 4.2);
  }

  const landforms =
    profile.landformCount[0] +
    Math.floor(rng() * (profile.landformCount[1] - profile.landformCount[0] + 1));
  for (let i = 0; i < landforms; i += 1) {
    const center = Math.round(game.worldWidth * (0.16 + rng() * 0.68));
    const width = 9 + rng() * 26;
    const amp =
      (rng() < 0.22 ? -1 : 1) *
      (profile.ampRange[0] + rng() * (profile.ampRange[1] - profile.ampRange[0]));
    for (let x = 0; x <= game.worldWidth; x += 1) {
      heights[x] += gaussianHill(x, center, width, amp);
    }
  }

  const ridgeCenters = profile.ridgeCenters;
  ridgeCenters.forEach((ratio, idx) => {
    const center = Math.round(game.worldWidth * ratio + (rng() * 5 - 2));
    const width = 6 + idx * 1.3;
    const amp = profile.ridgeAmp[0] + rng() * (profile.ridgeAmp[1] - profile.ridgeAmp[0]);
    for (let x = 0; x <= game.worldWidth; x += 1) {
      heights[x] += gaussianHill(x, center, width, amp);
    }
  });

  smoothFortressTerrain(heights, 2);
  enforceFortressPlayableCorridor(heights, game, terrainProfile);
  flattenFortressSpawnZone(heights, game.playerX, 9);
  flattenFortressSpawnZone(heights, game.enemyX, 9);
  enforceFortressPlayableCorridor(heights, game, terrainProfile);

  for (let x = 0; x <= game.worldWidth; x += 1) {
    heights[x] = Math.max(2.5, heights[x]);
  }

  game.walls = profile.wallCenters.map((center, index) => ({
    id: `wall-${index + 1}`,
    x: pickFortressWallX(
      heights,
      Math.round(game.worldWidth * center + Math.floor(rng() * 5 - 2)),
      6,
      game.worldWidth
    ),
    w: 3.2 + rng() * 0.3,
    h: profile.wallHeights[0] + Math.floor(rng() * (profile.wallHeights[1] - profile.wallHeights[0])),
    maxHits: 3,
    hitsRemaining: 3,
    destroyed: false,
  }));

  game.parallax = generateFortressParallax(rng, terrainProfile);
  game.craters = [];
  game.explosionParticles = [];
  game.debrisParticles = [];
  game.impactRings = [];
  game.terrainHeights = heights;
}

function seededRandom(seedValue) {
  let seed = (Number(seedValue) || 1) % 2147483647;
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function gaussianHill(x, center, width, amp) {
  const d = (x - center) / width;
  return amp * Math.exp(-(d * d));
}

function smoothFortressTerrain(heights, passes = 1) {
  for (let pass = 0; pass < passes; pass += 1) {
    const copy = heights.slice();
    for (let i = 1; i < heights.length - 1; i += 1) {
      heights[i] = (copy[i - 1] + copy[i] * 2 + copy[i + 1]) / 4;
    }
  }
}

function flattenFortressSpawnZone(heights, center, radius) {
  const start = Math.max(0, Math.floor(center - radius));
  const end = Math.min(heights.length - 1, Math.ceil(center + radius));
  let avg = 0;
  for (let i = start; i <= end; i += 1) avg += heights[i];
  avg /= end - start + 1;
  for (let i = start; i <= end; i += 1) {
    const d = Math.abs(i - center) / Math.max(1, radius);
    const t = Math.max(0, Math.min(1, d));
    const ease = t * t * (3 - 2 * t);
    heights[i] = avg * (1 - (1 - ease) * 0.88) + heights[i] * ((1 - ease) * 0.88);
  }
}

function enforceFortressPlayableCorridor(heights, game, terrainProfile = "crossroads") {
  const configByProfile = {
    crossroads: { centerCap: 10.8, edgeCap: 14.2, globalCap: 16.4 },
    ridge: { centerCap: 12.2, edgeCap: 15.6, globalCap: 18.2 },
    mudflats: { centerCap: 9.8, edgeCap: 13.1, globalCap: 15.1 },
    fortress: { centerCap: 11.5, edgeCap: 15.3, globalCap: 17.4 },
  };
  const cfg = configByProfile[terrainProfile] || configByProfile.crossroads;
  const left = Math.max(0, Math.floor(game.playerX + 16));
  const right = Math.min(game.worldWidth, Math.ceil(game.enemyX - 16));
  const mid = (left + right) / 2;
  const span = Math.max(1, right - left);

  for (let x = 0; x <= game.worldWidth; x += 1) {
    heights[x] = Math.min(heights[x], cfg.globalCap);
  }

  for (let x = left; x <= right; x += 1) {
    const t = Math.abs((x - mid) / (span * 0.5));
    const eased = Math.max(0, Math.min(1, t));
    const laneCap = lerp(cfg.centerCap, cfg.edgeCap, eased);
    if (heights[x] > laneCap) {
      heights[x] = laneCap + (heights[x] - laneCap) * 0.18;
    }
  }

  smoothFortressTerrain(heights, 1);
}

function pickFortressWallX(heights, desiredX, radius, maxX) {
  const start = Math.max(0, Math.floor(desiredX - radius));
  const end = Math.min(maxX, Math.ceil(desiredX + radius));
  let bestX = Math.max(0, Math.min(maxX, Math.round(desiredX)));
  let bestScore = Infinity;
  for (let x = start; x <= end; x += 1) {
    const h = heights[x] ?? 999;
    const slope = Math.abs((heights[x + 1] ?? h) - (heights[x - 1] ?? h));
    const centerPenalty = Math.abs(x - desiredX) * 0.14;
    const score = h + slope * 1.25 + centerPenalty;
    if (score < bestScore) {
      bestScore = score;
      bestX = x;
    }
  }
  return bestX;
}

function generateFortressParallax(rng, terrainProfile = "crossroads") {
  const profileTweaks = {
    crossroads: { roadCount: 3, hedgeCount: 12, fieldCount: 10, hamletCount: 6, treeCount: 7 },
    ridge: { roadCount: 2, hedgeCount: 10, fieldCount: 8, hamletCount: 5, treeCount: 9 },
    mudflats: { roadCount: 4, hedgeCount: 7, fieldCount: 7, hamletCount: 4, treeCount: 5 },
    fortress: { roadCount: 2, hedgeCount: 14, fieldCount: 11, hamletCount: 7, treeCount: 10 },
  };
  const tweak = profileTweaks[terrainProfile] || profileTweaks.crossroads;
  const far = [];
  const mid = [];
  for (let i = 0; i < 6; i += 1) {
    far.push({
      x: 0.06 + i * 0.16 + (rng() * 0.05 - 0.025),
      w: 0.16 + rng() * 0.09,
      h: 0.12 + rng() * 0.11,
    });
  }
  for (let i = 0; i < 8; i += 1) {
    mid.push({
      x: 0.03 + i * 0.125 + (rng() * 0.05 - 0.025),
      w: 0.11 + rng() * 0.08,
      h: 0.08 + rng() * 0.09,
    });
  }
  const clouds = [];
  for (let i = 0; i < 5; i += 1) {
    clouds.push({
      x: 0.08 + i * 0.19 + (rng() * 0.04 - 0.02),
      y: 0.11 + rng() * 0.12,
      r: 0.05 + rng() * 0.05,
    });
  }
  const roads = [];
  for (let i = 0; i < tweak.roadCount; i += 1) {
    roads.push({
      y: 0.71 + i * 0.08 + rng() * 0.025,
      amp: 0.018 + rng() * 0.024,
      phase: rng() * Math.PI * 2,
      thick: 0.006 + rng() * 0.005,
    });
  }
  const hedges = [];
  for (let i = 0; i < tweak.hedgeCount; i += 1) {
    hedges.push({
      x: 0.06 + rng() * 0.88,
      y: 0.68 + rng() * 0.25,
      w: 0.03 + rng() * 0.08,
      h: 0.003 + rng() * 0.004,
      rot: rng() * 0.45 - 0.22,
    });
  }
  const fields = [];
  for (let i = 0; i < tweak.fieldCount; i += 1) {
    fields.push({
      x: 0.03 + rng() * 0.9,
      y: 0.66 + rng() * 0.26,
      w: 0.08 + rng() * 0.18,
      h: 0.04 + rng() * 0.085,
      hue: rng() < 0.5 ? "green" : "wheat",
      rot: rng() * 0.22 - 0.11,
    });
  }
  const hamlets = [];
  for (let i = 0; i < tweak.hamletCount; i += 1) {
    hamlets.push({
      x: 0.08 + rng() * 0.82,
      y: 0.65 + rng() * 0.18,
      scale: 0.6 + rng() * 0.75,
    });
  }
  const treeLines = [];
  for (let i = 0; i < tweak.treeCount; i += 1) {
    treeLines.push({
      x: 0.08 + rng() * 0.84,
      y: 0.63 + rng() * 0.24,
      n: 2 + Math.floor(rng() * 4),
      spread: 0.018 + rng() * 0.03,
      tall: rng() < 0.4,
    });
  }
  return { far, mid, clouds, roads, hedges, fields, hamlets, treeLines };
}

function addFortressCrater(x, power = 1) {
  const game = ui.fortress;
  const heights = game.terrainHeights;
  if (!heights || !heights.length) return;
  const cx = Math.max(0, Math.min(game.worldWidth, x));
  const radius = 2.4 + power * 2.8;
  const depth = 0.35 + power * 0.7;
  const start = Math.max(0, Math.floor(cx - radius * 2));
  const end = Math.min(game.worldWidth, Math.ceil(cx + radius * 2));
  for (let i = start; i <= end; i += 1) {
    const d = (i - cx) / radius;
    const carve = depth * Math.exp(-(d * d));
    heights[i] = Math.max(2, heights[i] - carve);
  }
  game.craters.push({
    x: cx,
    r: radius * 1.3,
    d: depth,
    t: Date.now(),
  });
  if (game.craters.length > 18) {
    game.craters.shift();
  }
}

function randomFortressWind() {
  return Math.round((Math.random() * 2 - 1) * 5);
}

function terrainAtFortress(x) {
  const heights = ui.fortress.terrainHeights || [];
  if (!heights.length) return 6;
  const maxX = ui.fortress.worldWidth || 100;
  const clamped = Math.max(0, Math.min(maxX, x));
  const i0 = Math.floor(clamped);
  const i1 = Math.min(maxX, i0 + 1);
  const t = clamped - i0;
  return lerp(heights[i0] ?? 6, heights[i1] ?? 6, t);
}

function worldToCanvas(canvas, x, y) {
  const w = canvas.width;
  const h = canvas.height;
  const viewport = getFortressViewport();
  const left = viewport.left;
  const viewWidth = viewport.viewWidth;
  const viewHeight = Math.max(60, ui.fortress.viewHeight || 60);
  return {
    x: ((x - left) / viewWidth) * w,
    y: h - (y / viewHeight) * h,
  };
}

function getFortressViewport() {
  const worldWidth = ui.fortress.worldWidth || 100;
  const viewWidth = Math.max(40, Math.min(worldWidth, ui.fortress.viewWidth || worldWidth));
  const halfView = viewWidth / 2;
  const cam = Math.max(halfView, Math.min(worldWidth - halfView, ui.fortress.cameraX || halfView));
  return {
    worldWidth,
    viewWidth,
    halfView,
    cam,
    left: cam - halfView,
    right: cam + halfView,
  };
}

function drawFortressScene() {
  const els = fortressEls();
  const canvas = els.canvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const game = ui.fortress;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const targetW = Math.max(600, Math.floor(rect.width * dpr));
  const targetH = Math.max(230, Math.floor((rect.width * 0.34) * dpr));
  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  if (game.shakeTime > 0) {
    const magnitude = game.shakePower * (game.shakeTime / Math.max(0.01, game.shakeTime + 0.08));
    const sx = (Math.random() * 2 - 1) * magnitude;
    const sy = (Math.random() * 2 - 1) * magnitude * 0.6;
    ctx.translate(sx, sy);
  }

  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#cfe7ff");
  sky.addColorStop(0.62, "#b7d6fb");
  sky.addColorStop(0.63, "#95bc88");
  sky.addColorStop(1, "#709b62");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  drawFortressAtmosphere(ctx, canvas);
  drawFortressWindHud(ctx, canvas, game);
  drawFortressCampaignTrack(ctx, canvas, game);
  drawFortressTacticalOverlay(ctx, canvas, game);
  drawTerrain(ctx, canvas);
  drawFortressWalls(ctx, canvas);
  drawBattery(ctx, canvas, game, "player", game.playerX, game.currentAngle);
  drawBattery(ctx, canvas, game, "enemy", game.enemyX, game.enemyAngle);

  if (game.turn === "player" && game.phase === "aiming") {
    drawAimGaugeOnCannon(ctx, canvas, game.playerX, game.currentAngle, game.currentPower);
    drawAimTrajectoryPreview(
      ctx,
      canvas,
      game.playerX,
      game.currentAngle,
      game.currentPower,
      game.wind
    );
  }

  if (game.projectileTrail.length) {
    ctx.save();
    ctx.strokeStyle = "rgba(20, 39, 73, 0.45)";
    ctx.setLineDash([5, 7]);
    ctx.lineWidth = Math.max(1, w * 0.0015);
    ctx.beginPath();
    game.projectileTrail.forEach((p, index) => {
      const c = worldToCanvas(canvas, p.x, p.y);
      if (index === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();
    ctx.restore();
  }

  if (game.projectile) {
    const p = worldToCanvas(canvas, game.projectile.x, game.projectile.y);
    const r = Math.max(6, w * 0.006);
    const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r * 1.8);
    glow.addColorStop(0, "#fff8d6");
    glow.addColorStop(0.5, "#ffd067");
    glow.addColorStop(1, "rgba(242,133,47,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#11274a";
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 0.65, 0, Math.PI * 2);
    ctx.fill();
  }

  if (game.lastImpact && Date.now() - game.lastImpact.t < 520) {
    const c = worldToCanvas(canvas, game.lastImpact.x, game.lastImpact.y);
    const age = (Date.now() - game.lastImpact.t) / 520;
    const radius = Math.max(8, w * 0.012) * age;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 238, 170, ${1 - age})`;
    ctx.lineWidth = Math.max(2, w * 0.0025);
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  if (game.explosionParticles.length) {
    drawFortressExplosions(ctx, canvas, game.explosionParticles);
  }
  if (game.debrisParticles.length) {
    drawFortressDebris(ctx, canvas, game.debrisParticles);
  }
  if (game.impactRings.length) {
    drawFortressImpactRings(ctx, canvas, game.impactRings);
  }
  if (game.replayVisible && game.phase === "ended") {
    drawFortressReplayAnalysis(ctx, canvas, game);
  }
  drawFortressFloatingTexts(ctx, canvas, game);
  drawFortressHitBanner(ctx, canvas, game);
  drawFortressScreenVignette(ctx, canvas, game);
  ctx.restore();
}

function drawFortressTacticalOverlay(ctx, canvas, game) {
  const viewport = getFortressViewport();
  const enemyInView = game.enemyX >= viewport.left && game.enemyX <= viewport.right;
  const playerInView = game.playerX >= viewport.left && game.playerX <= viewport.right;

  const panelW = canvas.width * 0.29;
  const panelH = canvas.height * 0.075;
  const panelX = canvas.width * 0.03;
  const panelY = canvas.height * 0.035;

  ctx.save();
  ctx.fillStyle = "rgba(239, 246, 255, 0.82)";
  ctx.strokeStyle = "#19335f";
  ctx.lineWidth = Math.max(1.8, canvas.width * 0.0015);
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  const laneY = panelY + panelH * 0.66;
  const laneX1 = panelX + panelW * 0.06;
  const laneX2 = panelX + panelW * 0.94;
  ctx.strokeStyle = "rgba(29, 58, 109, 0.6)";
  ctx.lineWidth = Math.max(1.2, canvas.width * 0.0012);
  ctx.beginPath();
  ctx.moveTo(laneX1, laneY);
  ctx.lineTo(laneX2, laneY);
  ctx.stroke();

  const mapX = (worldX) => laneX1 + (Math.max(0, Math.min(viewport.worldWidth, worldX)) / viewport.worldWidth) * (laneX2 - laneX1);
  const viewLeftX = mapX(viewport.left);
  const viewRightX = mapX(viewport.right);
  ctx.fillStyle = "rgba(84, 141, 230, 0.2)";
  ctx.fillRect(viewLeftX, panelY + panelH * 0.2, Math.max(4, viewRightX - viewLeftX), panelH * 0.55);
  ctx.strokeStyle = "rgba(38, 81, 150, 0.85)";
  ctx.strokeRect(viewLeftX, panelY + panelH * 0.2, Math.max(4, viewRightX - viewLeftX), panelH * 0.55);

  ctx.fillStyle = "#24457c";
  ctx.beginPath();
  ctx.arc(mapX(game.playerX), laneY, Math.max(3, canvas.width * 0.0034), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ba2d2d";
  ctx.beginPath();
  ctx.arc(mapX(game.enemyX), laneY, Math.max(3, canvas.width * 0.0034), 0, Math.PI * 2);
  ctx.fill();

  if (game.projectile) {
    ctx.fillStyle = "#f0b24d";
    ctx.beginPath();
    ctx.arc(mapX(game.projectile.x), laneY, Math.max(2, canvas.width * 0.0024), 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#142b53";
  ctx.font = `700 ${Math.max(9, canvas.width * 0.008)}px "Trebuchet MS", sans-serif`;
  ctx.fillText("Tactical Strip", panelX + panelW * 0.05, panelY + panelH * 0.38);
  ctx.restore();

  if (!enemyInView) {
    const goRight = game.enemyX > viewport.right;
    const x = goRight ? canvas.width - canvas.width * 0.025 : canvas.width * 0.025;
    const y = canvas.height * 0.53;
    const dist = Math.max(0, Math.round(Math.abs(game.enemyX - (goRight ? viewport.right : viewport.left))));
    drawFortressEdgeArrow(ctx, x, y, goRight ? 1 : -1, `Enemy ${dist}m`);
  }
  if (!playerInView) {
    const goRight = game.playerX > viewport.right;
    const x = goRight ? canvas.width - canvas.width * 0.025 : canvas.width * 0.025;
    const y = canvas.height * 0.59;
    const dist = Math.max(0, Math.round(Math.abs(game.playerX - (goRight ? viewport.right : viewport.left))));
    drawFortressEdgeArrow(ctx, x, y, goRight ? 1 : -1, `You ${dist}m`, "#1c4c93");
  }
}

function drawFortressEdgeArrow(ctx, x, y, dir, label, color = "#b72b2b") {
  const size = 18;
  ctx.save();
  ctx.translate(x, y);
  if (dir < 0) ctx.scale(-1, 1);
  ctx.fillStyle = color;
  ctx.strokeStyle = "rgba(18, 31, 57, 0.9)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.55, -size * 0.48);
  ctx.lineTo(size * 0.65, 0);
  ctx.lineTo(-size * 0.55, size * 0.48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "#142b53";
  ctx.font = `700 ${Math.max(10, ctx.canvas.width * 0.008)}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = dir > 0 ? "right" : "left";
  ctx.fillText(label, dir > 0 ? x - 14 : x + 14, y - 8);
  ctx.restore();
}

function drawFortressAtmosphere(ctx, canvas) {
  const sunX = canvas.width * 0.84;
  const sunY = canvas.height * 0.16;
  const sun = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, canvas.width * 0.13);
  sun.addColorStop(0, "rgba(255,245,198,0.95)");
  sun.addColorStop(0.45, "rgba(255,226,140,0.42)");
  sun.addColorStop(1, "rgba(255,226,140,0)");
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, canvas.width * 0.13, 0, Math.PI * 2);
  ctx.fill();

  const parallax = ui.fortress.parallax || {};
  const weather = ui.fortress.weather || FORTRESS_WEATHER_TYPES.clear;
  const farMountains = Array.isArray(parallax.far) ? parallax.far : [];
  const midMountains = Array.isArray(parallax.mid) ? parallax.mid : [];
  const clouds = Array.isArray(parallax.clouds) ? parallax.clouds : [];
  const hamlets = Array.isArray(parallax.hamlets) ? parallax.hamlets : [];

  ctx.save();
  farMountains.forEach((m) => {
    const x = canvas.width * m.x;
    const w = canvas.width * m.w;
    const h = canvas.height * m.h;
    ctx.fillStyle = "rgba(93, 132, 170, 0.42)";
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, canvas.height * 0.64);
    ctx.lineTo(x, canvas.height * 0.64 - h);
    ctx.lineTo(x + w * 0.5, canvas.height * 0.64);
    ctx.closePath();
    ctx.fill();
  });
  midMountains.forEach((m) => {
    const x = canvas.width * m.x;
    const w = canvas.width * m.w;
    const h = canvas.height * m.h;
    const grad = ctx.createLinearGradient(0, canvas.height * 0.66 - h, 0, canvas.height * 0.68);
    grad.addColorStop(0, "rgba(116, 159, 128, 0.62)");
    grad.addColorStop(1, "rgba(84, 130, 98, 0.45)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.55, canvas.height * 0.68);
    ctx.lineTo(x - w * 0.12, canvas.height * 0.68 - h * 0.62);
    ctx.lineTo(x, canvas.height * 0.68 - h);
    ctx.lineTo(x + w * 0.16, canvas.height * 0.68 - h * 0.58);
    ctx.lineTo(x + w * 0.52, canvas.height * 0.68);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();

  const haze = ctx.createLinearGradient(0, canvas.height * 0.52, 0, canvas.height * 0.84);
  haze.addColorStop(0, "rgba(236, 245, 255, 0)");
  haze.addColorStop(1, "rgba(222, 235, 213, 0.5)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, canvas.height * 0.52, canvas.width, canvas.height * 0.34);

  if (weather.key === "dawn") {
    const fog = ctx.createLinearGradient(0, canvas.height * 0.05, 0, canvas.height * 0.82);
    fog.addColorStop(0, "rgba(246, 236, 221, 0.16)");
    fog.addColorStop(0.5, "rgba(238, 233, 224, 0.2)");
    fog.addColorStop(1, "rgba(225, 230, 219, 0.34)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else if (weather.key === "mud") {
    ctx.fillStyle = "rgba(90, 70, 52, 0.08)";
    ctx.fillRect(0, canvas.height * 0.55, canvas.width, canvas.height * 0.45);
  } else if (weather.key === "gusts") {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
    ctx.lineWidth = Math.max(1, canvas.width * 0.001);
    const t = ui.fortress.windPhase * 2.8;
    for (let i = 0; i < 3; i += 1) {
      const y = canvas.height * (0.18 + i * 0.12);
      ctx.beginPath();
      for (let x = 0; x <= canvas.width; x += 12) {
        const yy = y + Math.sin((x / canvas.width) * 8 + t + i) * 4;
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
    }
  }

  clouds.forEach((cloud) => {
    const cx = canvas.width * cloud.x;
    const cy = canvas.height * cloud.y;
    const rr = canvas.width * cloud.r;
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(cx - rr * 0.45, cy, rr * 0.58, 0, Math.PI * 2);
    ctx.arc(cx + rr * 0.18, cy - rr * 0.08, rr * 0.8, 0, Math.PI * 2);
    ctx.arc(cx + rr * 0.95, cy + rr * 0.04, rr * 0.5, 0, Math.PI * 2);
    ctx.fill();
  });

  hamlets.forEach((h) => {
    if (h.y <= 0.73) {
      drawFortressHamlet(ctx, canvas, h, true);
    }
  });
}

function drawFortressWindHud(ctx, canvas, game) {
  const panelW = canvas.width * 0.24;
  const panelH = canvas.height * 0.12;
  const panelX = canvas.width * 0.5 - panelW * 0.5;
  const panelY = canvas.height * 0.028;
  ctx.save();
  ctx.fillStyle = "rgba(239, 246, 255, 0.82)";
  ctx.strokeStyle = "#19335f";
  ctx.lineWidth = Math.max(2, canvas.width * 0.0018);
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  const compassX = panelX + panelH * 0.56;
  const compassY = panelY + panelH * 0.52;
  const compassR = panelH * 0.32;
  ctx.strokeStyle = "#1d3666";
  ctx.lineWidth = Math.max(1.5, canvas.width * 0.0015);
  ctx.beginPath();
  ctx.arc(compassX, compassY, compassR, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(compassX - compassR, compassY);
  ctx.lineTo(compassX + compassR, compassY);
  ctx.moveTo(compassX, compassY - compassR);
  ctx.lineTo(compassX, compassY + compassR);
  ctx.stroke();

  const needleBase = (game.wind / 7) * 0.86;
  const needleAnim = Math.sin(game.windPhase * 2.1) * 0.06;
  const needleAngle = needleBase + needleAnim;
  const nx = compassX + Math.cos(needleAngle) * compassR * 0.92;
  const ny = compassY - Math.sin(needleAngle) * compassR * 0.92;
  ctx.strokeStyle = "#eb465f";
  ctx.lineWidth = Math.max(2, canvas.width * 0.0018);
  ctx.beginPath();
  ctx.moveTo(compassX, compassY);
  ctx.lineTo(nx, ny);
  ctx.stroke();
  ctx.fillStyle = "#102448";
  ctx.beginPath();
  ctx.arc(compassX, compassY, Math.max(2, canvas.width * 0.0024), 0, Math.PI * 2);
  ctx.fill();

  const flagPoleX = panelX + panelW - panelH * 0.42;
  const flagPoleTop = panelY + panelH * 0.24;
  const flagPoleBottom = panelY + panelH * 0.84;
  ctx.strokeStyle = "#1d335d";
  ctx.lineWidth = Math.max(2, canvas.width * 0.0018);
  ctx.beginPath();
  ctx.moveTo(flagPoleX, flagPoleTop);
  ctx.lineTo(flagPoleX, flagPoleBottom);
  ctx.stroke();
  const windDir = game.wind >= 0 ? 1 : -1;
  const wave = Math.sin(game.windPhase * 3.4) * 0.18;
  const flap = 7 + Math.abs(game.wind) * 2;
  const flagY = panelY + panelH * 0.36;
  ctx.fillStyle = "rgba(59, 116, 219, 0.92)";
  ctx.beginPath();
  ctx.moveTo(flagPoleX, flagY);
  ctx.quadraticCurveTo(
    flagPoleX + windDir * (flap * 0.52),
    flagY - 4 - wave * 3,
    flagPoleX + windDir * flap,
    flagY + wave * 2
  );
  ctx.quadraticCurveTo(
    flagPoleX + windDir * (flap * 0.54),
    flagY + 5 - wave * 2,
    flagPoleX,
    flagY + 8
  );
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#142b53";
  ctx.font = `700 ${Math.max(11, canvas.width * 0.011)}px "Trebuchet MS", sans-serif`;
  ctx.fillText("WIND", panelX + panelH * 0.95, panelY + panelH * 0.4);
  ctx.font = `700 ${Math.max(12, canvas.width * 0.012)}px "Trebuchet MS", sans-serif`;
  const windText = `${game.wind > 0 ? "+" : ""}${game.wind}`;
  ctx.fillText(windText, panelX + panelH * 0.95, panelY + panelH * 0.73);
  ctx.font = `700 ${Math.max(9, canvas.width * 0.0088)}px "Trebuchet MS", sans-serif`;
  ctx.fillText(game.weather?.name || "Clear Sky", panelX + panelW * 0.5, panelY + panelH * 0.9);
  ctx.restore();
}

function drawFortressCampaignTrack(ctx, canvas, game) {
  const total = FORTRESS_CAMPAIGN_STAGES.length;
  if (!total) return;
  const current = Math.max(0, Math.min(total - 1, Number(game.stageIndex) || 0));
  const x = canvas.width * 0.72;
  const y = canvas.height * 0.04;
  const w = canvas.width * 0.24;
  const h = canvas.height * 0.09;
  ctx.save();
  ctx.fillStyle = "rgba(238, 246, 255, 0.78)";
  ctx.strokeStyle = "#19335f";
  ctx.lineWidth = Math.max(1.8, canvas.width * 0.0015);
  ctx.fillRect(x, y, w, h);
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = "#18345f";
  ctx.font = `700 ${Math.max(10, canvas.width * 0.0086)}px "Trebuchet MS", sans-serif`;
  ctx.fillText("Campaign Route", x + 10, y + 14);
  const trackY = y + h * 0.66;
  const pad = 14;
  const usableW = w - pad * 2;
  for (let i = 0; i < total; i += 1) {
    const nx = x + pad + (usableW * i) / Math.max(1, total - 1);
    if (i < total - 1) {
      const nx2 = x + pad + (usableW * (i + 1)) / Math.max(1, total - 1);
      ctx.strokeStyle = "rgba(39, 71, 128, 0.45)";
      ctx.lineWidth = Math.max(1.4, canvas.width * 0.0012);
      ctx.beginPath();
      ctx.moveTo(nx, trackY);
      ctx.lineTo(nx2, trackY);
      ctx.stroke();
    }
    ctx.beginPath();
    if (i < current) {
      ctx.fillStyle = "#6fd16f";
    } else if (i === current) {
      ctx.fillStyle = "#ffde70";
    } else {
      ctx.fillStyle = "#cdd8ec";
    }
    ctx.arc(nx, trackY, Math.max(3.5, canvas.width * 0.0038), 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#1f3964";
    ctx.stroke();
  }
  ctx.restore();
}

function drawFortressFloatingTexts(ctx, canvas, game) {
  if (!game.floatingTexts.length) return;
  game.floatingTexts.forEach((textState) => {
    const c = worldToCanvas(canvas, textState.x, textState.y);
    const alpha = Math.max(0, Math.min(1, textState.life / 1.15));
    const fontSize = Math.max(13, canvas.width * 0.013 * (textState.scale || 1));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${fontSize}px "Trebuchet MS", sans-serif`;
    ctx.lineWidth = Math.max(2, canvas.width * 0.0022);
    ctx.strokeStyle = "rgba(19, 34, 64, 0.85)";
    ctx.strokeText(textState.text, c.x, c.y);
    ctx.fillStyle = textState.color || "#fff5cf";
    ctx.fillText(textState.text, c.x, c.y);
    ctx.restore();
  });
}

function drawFortressHitBanner(ctx, canvas, game) {
  if (!game.hitBanner.text || game.hitBanner.life <= 0) return;
  const alpha = Math.max(0, Math.min(1, game.hitBanner.life / 1.15));
  const pop = 1 + (1 - alpha) * 0.2;
  const x = canvas.width * 0.5;
  const y = canvas.height * 0.145;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${Math.max(20, canvas.width * 0.03) * pop}px "Trebuchet MS", sans-serif`;
  ctx.lineWidth = Math.max(3, canvas.width * 0.003);
  ctx.strokeStyle = "rgba(19, 33, 61, 0.95)";
  ctx.strokeText(game.hitBanner.text, x, y);
  ctx.fillStyle = game.hitBanner.color;
  ctx.fillText(game.hitBanner.text, x, y);
  ctx.restore();
}

function drawTerrain(ctx, canvas) {
  ctx.save();
  ctx.beginPath();
  const maxX = ui.fortress.worldWidth || 100;
  const start = worldToCanvas(canvas, 0, terrainAtFortress(0));
  ctx.moveTo(start.x, start.y);
  for (let x = 1; x <= maxX; x += 1) {
    const c = worldToCanvas(canvas, x, terrainAtFortress(x));
    ctx.lineTo(c.x, c.y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, canvas.height * 0.56, 0, canvas.height);
  fill.addColorStop(0, "#8fb37f");
  fill.addColorStop(1, "#5d824d");
  ctx.fillStyle = fill;
  ctx.fill();

  drawFortressFieldMosaic(ctx, canvas);
  drawFortressRoadNetwork(ctx, canvas);
  drawFortressHedges(ctx, canvas);
  drawFortressTreeLines(ctx, canvas);
  drawFortressHamletsForeground(ctx, canvas);

  ctx.strokeStyle = "#2a4e33";
  ctx.lineWidth = Math.max(2, canvas.width * 0.0022);
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  for (let x = 1; x <= maxX; x += 1) {
    const c = worldToCanvas(canvas, x, terrainAtFortress(x));
    ctx.lineTo(c.x, c.y);
  }
  ctx.stroke();
  const craters = ui.fortress.craters || [];
  craters.forEach((crater) => {
    const c = worldToCanvas(canvas, crater.x, terrainAtFortress(crater.x) + 0.12);
    const rx = Math.max(4, (crater.r / (ui.fortress.worldWidth || 100)) * canvas.width);
    const ry = Math.max(2, rx * 0.34);
    ctx.fillStyle = "rgba(43, 63, 37, 0.45)";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(165, 124, 86, 0.25)";
    ctx.lineWidth = Math.max(1, canvas.width * 0.0009);
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 0.5, rx * 0.9, ry * 0.75, 0, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function drawFortressFieldMosaic(ctx, canvas) {
  const fields = Array.isArray(ui.fortress.parallax?.fields) ? ui.fortress.parallax.fields : [];
  fields.forEach((field, idx) => {
    const cx = canvas.width * field.x;
    const cy = canvas.height * field.y;
    const w = canvas.width * field.w;
    const h = canvas.height * field.h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(field.rot);
    ctx.fillStyle =
      field.hue === "wheat"
        ? `rgba(196, 179, 137, ${0.18 + (idx % 3) * 0.04})`
        : `rgba(133, 167, 119, ${0.2 + (idx % 4) * 0.035})`;
    ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    ctx.strokeStyle = "rgba(90, 118, 83, 0.25)";
    ctx.lineWidth = Math.max(1, canvas.width * 0.0008);
    for (let i = 1; i < 6; i += 1) {
      const x = -w * 0.5 + (w / 6) * i;
      ctx.beginPath();
      ctx.moveTo(x, -h * 0.5);
      ctx.lineTo(x, h * 0.5);
      ctx.stroke();
    }
    ctx.restore();
  });
}

function drawFortressRoadNetwork(ctx, canvas) {
  const roads = Array.isArray(ui.fortress.parallax?.roads) ? ui.fortress.parallax.roads : [];
  roads.forEach((road) => {
    const y = canvas.height * road.y;
    const amp = canvas.height * road.amp;
    const thick = Math.max(2, canvas.width * road.thick);
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(180, 166, 132, 0.46)";
    ctx.lineWidth = thick + 3;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 8) {
      const wave = Math.sin((x / canvas.width) * Math.PI * 2 + road.phase) * amp;
      const yy = y + wave;
      if (x === 0) ctx.moveTo(x, yy);
      else ctx.lineTo(x, yy);
    }
    ctx.stroke();
    ctx.strokeStyle = "rgba(206, 194, 161, 0.78)";
    ctx.lineWidth = thick;
    ctx.stroke();
    ctx.restore();
  });
}

function drawFortressHedges(ctx, canvas) {
  const hedges = Array.isArray(ui.fortress.parallax?.hedges) ? ui.fortress.parallax.hedges : [];
  hedges.forEach((hedge) => {
    const cx = canvas.width * hedge.x;
    const cy = canvas.height * hedge.y;
    const w = canvas.width * hedge.w;
    const h = canvas.height * hedge.h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(hedge.rot);
    ctx.fillStyle = "rgba(56, 98, 58, 0.5)";
    ctx.fillRect(-w * 0.5, -h * 0.5, w, h);
    ctx.restore();
  });
}

function drawFortressTreeLines(ctx, canvas) {
  const treeLines = Array.isArray(ui.fortress.parallax?.treeLines) ? ui.fortress.parallax.treeLines : [];
  treeLines.forEach((line) => {
    for (let i = 0; i < line.n; i += 1) {
      const tx = canvas.width * (line.x + (i - line.n / 2) * line.spread);
      const ty = canvas.height * line.y;
      const trunkH = line.tall ? canvas.height * 0.04 : canvas.height * 0.028;
      const crownR = line.tall ? canvas.height * 0.018 : canvas.height * 0.014;
      ctx.save();
      ctx.strokeStyle = "rgba(58, 49, 34, 0.58)";
      ctx.lineWidth = Math.max(1, canvas.width * 0.001);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx, ty - trunkH);
      ctx.stroke();
      ctx.fillStyle = line.tall ? "rgba(38, 73, 50, 0.72)" : "rgba(52, 88, 58, 0.68)";
      ctx.beginPath();
      ctx.arc(tx, ty - trunkH - crownR * 0.35, crownR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
}

function drawFortressHamlet(ctx, canvas, hamlet, subtle = false) {
  const x = canvas.width * hamlet.x;
  const y = canvas.height * hamlet.y;
  const s = hamlet.scale * (subtle ? 0.68 : 0.92);
  const w = canvas.width * 0.028 * s;
  const h = canvas.height * 0.028 * s;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = subtle ? "rgba(181, 172, 151, 0.42)" : "rgba(188, 177, 151, 0.68)";
  ctx.fillRect(-w * 0.5, -h, w, h);
  ctx.fillStyle = subtle ? "rgba(154, 104, 87, 0.45)" : "rgba(158, 91, 79, 0.72)";
  ctx.beginPath();
  ctx.moveTo(-w * 0.58, -h);
  ctx.lineTo(0, -h * 1.45);
  ctx.lineTo(w * 0.58, -h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawFortressHamletsForeground(ctx, canvas) {
  const hamlets = Array.isArray(ui.fortress.parallax?.hamlets) ? ui.fortress.parallax.hamlets : [];
  hamlets.forEach((h) => {
    if (h.y > 0.73) {
      drawFortressHamlet(ctx, canvas, h, false);
    }
  });
}

function drawFortressWalls(ctx, canvas) {
  const walls = ui.fortress.walls || [];
  walls.forEach((wall) => {
    if (wall.destroyed) return;
    const base = terrainAtFortress(wall.x);
    const left = worldToCanvas(canvas, wall.x - wall.w / 2, base);
    const right = worldToCanvas(canvas, wall.x + wall.w / 2, base + wall.h);
    const width = Math.max(6, right.x - left.x);
    const height = Math.max(20, left.y - right.y);

    const grad = ctx.createLinearGradient(left.x, left.y - height, left.x, left.y);
    grad.addColorStop(0, "#a67849");
    grad.addColorStop(1, "#744d2b");
    ctx.fillStyle = grad;
    ctx.fillRect(left.x, left.y - height, width, height);
    ctx.strokeStyle = "#402812";
    ctx.lineWidth = Math.max(2, canvas.width * 0.0018);
    ctx.strokeRect(left.x, left.y - height, width, height);

    const cracks = Math.max(0, wall.maxHits - wall.hitsRemaining);
    if (cracks > 0) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = Math.max(1.3, canvas.width * 0.0013);
      for (let i = 0; i < cracks + 1; i += 1) {
        const sx = left.x + width * (0.18 + ((i * 0.27) % 0.62));
        const sy = left.y - height * (0.15 + i * 0.12);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - width * 0.17, sy + height * 0.24);
        ctx.lineTo(sx + width * 0.11, sy + height * 0.45);
        ctx.stroke();
      }
    }
  });
}

function drawFortressExplosions(ctx, canvas, particles) {
  particles.forEach((p) => {
    const c = worldToCanvas(canvas, p.x, p.y);
    const alpha = Math.max(0, Math.min(1, p.life / 0.65));
    const radius = Math.max(1, p.r * (0.8 + alpha * 1.15));
    ctx.globalAlpha = alpha * 0.7;
    const smoke = ctx.createRadialGradient(c.x, c.y, radius * 0.5, c.x, c.y, radius * 5.6);
    smoke.addColorStop(0, "rgba(52, 55, 58, 0.45)");
    smoke.addColorStop(1, "rgba(52, 55, 58, 0)");
    ctx.fillStyle = smoke;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * 5.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff4d0";
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.8;
    ctx.fillStyle = p.colorA;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * 2.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.6;
    ctx.fillStyle = p.colorB;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = alpha * 0.85;
    ctx.strokeStyle = "rgba(255, 164, 76, 0.72)";
    ctx.lineWidth = Math.max(1, canvas.width * 0.0016);
    ctx.beginPath();
    ctx.moveTo(c.x - radius * 2.4, c.y);
    ctx.lineTo(c.x + radius * 2.4, c.y);
    ctx.moveTo(c.x, c.y - radius * 2.4);
    ctx.lineTo(c.x, c.y + radius * 2.4);
    ctx.stroke();
    ctx.globalAlpha = 1;
  });
}

function drawFortressDebris(ctx, canvas, debris) {
  debris.forEach((d) => {
    const c = worldToCanvas(canvas, d.x, d.y);
    const r = Math.max(1, d.size * (canvas.width / 1200));
    ctx.fillStyle = d.color || "#71593f";
    ctx.fillRect(c.x - r * 0.5, c.y - r * 0.5, r, r);
  });
}

function drawFortressReplayAnalysis(ctx, canvas, game) {
  const shots = game.shotHistory || [];
  if (!shots.length) return;
  ctx.save();

  // Trajectory replay lines
  shots.forEach((shot) => {
    if (!Array.isArray(shot.path) || shot.path.length < 2) return;
    ctx.strokeStyle =
      shot.owner === "player"
        ? "rgba(98, 174, 255, 0.34)"
        : "rgba(255, 118, 118, 0.28)";
    ctx.lineWidth = Math.max(1, canvas.width * 0.0012);
    ctx.beginPath();
    shot.path.forEach((point, index) => {
      const c = worldToCanvas(canvas, point.x, point.y);
      if (index === 0) ctx.moveTo(c.x, c.y);
      else ctx.lineTo(c.x, c.y);
    });
    ctx.stroke();
  });

  // Impact heatmap
  (game.impactHistory || []).forEach((impact) => {
    const c = worldToCanvas(canvas, impact.x, impact.y);
    const radius = Math.max(5, canvas.width * 0.009);
    const grad = ctx.createRadialGradient(c.x, c.y, 1, c.x, c.y, radius);
    if (impact.owner === "player") {
      grad.addColorStop(0, "rgba(103, 196, 255, 0.58)");
      grad.addColorStop(1, "rgba(103, 196, 255, 0)");
    } else {
      grad.addColorStop(0, "rgba(255, 132, 113, 0.52)");
      grad.addColorStop(1, "rgba(255, 132, 113, 0)");
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.fill();
  });

  const boxW = canvas.width * 0.45;
  const boxH = canvas.height * 0.14;
  const boxX = canvas.width * 0.02;
  const boxY = canvas.height * 0.02;
  ctx.fillStyle = "rgba(15, 27, 50, 0.75)";
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = "rgba(225, 238, 255, 0.8)";
  ctx.lineWidth = Math.max(1.5, canvas.width * 0.0014);
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillStyle = "#f0f6ff";
  ctx.font = `700 ${Math.max(11, canvas.width * 0.0105)}px "Trebuchet MS", sans-serif`;
  const playerShots = shots.filter((s) => s.owner === "player");
  const direct = playerShots.filter((s) => s.result === "direct").length;
  const accuracy = playerShots.length ? Math.round((direct / playerShots.length) * 100) : 0;
  ctx.fillText(`Replay: ${playerShots.length} shots | Direct hits ${direct} | Accuracy ${accuracy}%`, boxX + 10, boxY + 20);
  ctx.fillText(`Hint: ${game.replayHint || "Adjust elevation based on impact clusters."}`, boxX + 10, boxY + 40);
  ctx.fillText("Blue lines = your shots, red = enemy. Glows mark impact clusters.", boxX + 10, boxY + 60);
  ctx.restore();
}

function drawFortressScreenVignette(ctx, canvas, game) {
  const weatherTint = game.weather?.vignette || 0;
  const hitTint = Math.max(0, game.screenGrime || 0);
  const opacity = Math.max(0.05, weatherTint + hitTint);
  if (opacity <= 0.02) return;
  ctx.save();
  const g = ctx.createRadialGradient(
    canvas.width * 0.5,
    canvas.height * 0.52,
    canvas.height * 0.2,
    canvas.width * 0.5,
    canvas.height * 0.52,
    canvas.height * 0.82
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, `rgba(12, 16, 24, ${Math.min(0.55, opacity)})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function drawFortressImpactRings(ctx, canvas, rings) {
  rings.forEach((ring) => {
    const c = worldToCanvas(canvas, ring.x, ring.y);
    const alpha = Math.max(0, Math.min(1, ring.life / 0.45));
    const radius = Math.max(2, ring.r * (canvas.width / (ui.fortress.worldWidth || 100)));
    ctx.save();
    ctx.strokeStyle = ring.color.replace("0.9", String(0.6 * alpha));
    ctx.lineWidth = Math.max(1.5, canvas.width * 0.0017);
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  });
}

function drawBattery(ctx, canvas, game, side, worldX, angleDeg) {
  const baseY = terrainAtFortress(worldX);
  const c = worldToCanvas(canvas, worldX, baseY);
  const scale = canvas.width / 1240;
  const isPlayer = side === "player";
  const dir = isPlayer ? 1 : -1;
  const screenAngle = projectFortressAngleForCanvas(canvas, angleDeg);
  const crewPhase = game.crew?.[side]?.phase || "idle";
  const impactKnock = game.crew?.[side]?.knockback || 0;
  const isFiring = crewPhase === "fire";
  const phaseTime = (game.nowMs || 0) / 1000;
  const cadence = Math.sin(phaseTime * 8 + (isPlayer ? 0 : 1.5));
  const recoil = isFiring ? -4.4 : 0;
  let batteryBob = 0;
  if (crewPhase === "load") batteryBob = cadence * 0.55;
  if (crewPhase === "ram") batteryBob = cadence * 0.35;
  if (crewPhase === "brace") batteryBob = Math.sin(phaseTime * 6.5) * 0.22;

  ctx.save();
  ctx.translate(c.x + recoil * dir - impactKnock * dir * 9, c.y + batteryBob);
  ctx.scale(scale * dir, scale);
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = "#1b2435";

  const loaderTravel = crewPhase === "load" ? (cadence * 0.5 + 0.5) * 20 : 0;
  const ramTravel = crewPhase === "ram" ? (cadence * 0.5 + 0.5) * 20 : 0;
  const crewPulse = crewPhase === "fire" ? Math.sin(phaseTime * 36) * 1.2 : 0;

  const drawWheel = (x, y, r) => {
    ctx.save();
    const rim = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
    rim.addColorStop(0, "#b48c62");
    rim.addColorStop(0.6, "#8a5d3d");
    rim.addColorStop(1, "#5d3a26");
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4a2b19";
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.strokeStyle = "rgba(63, 36, 21, 0.75)";
    ctx.lineWidth = 1.5;
    const spokeCount = 12;
    for (let i = 0; i < spokeCount; i += 1) {
      const a = (Math.PI * 2 * i) / spokeCount + (crewPhase === "fire" ? cadence * 0.02 : 0);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * (r - 2), y + Math.sin(a) * (r - 2));
      ctx.stroke();
    }
    ctx.fillStyle = "#69432b";
    ctx.beginPath();
    ctx.arc(x, y, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawCrew = (x, y, lean, active = false) => {
    ctx.save();
    ctx.translate(x, y);
    if (lean) ctx.rotate(lean);
    if (impactKnock > 0.02) {
      ctx.globalAlpha = 0.28 + impactKnock * 0.18;
      ctx.fillStyle = "#0b1220";
      ctx.fillRect(-9 - impactKnock * 5, -28, 18, 46);
      ctx.globalAlpha = 1;
    }
    ctx.fillStyle = "#f1d5b8";
    ctx.beginPath();
    ctx.arc(0, -34 + crewPulse, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = active ? "#2f5ea5" : "#2b4678";
    ctx.fillRect(-8, -28, 16, 28);
    ctx.strokeRect(-8, -28, 16, 28);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(2, -26, 4, 24);
    ctx.fillStyle = "#1d2f52";
    ctx.fillRect(-7, 0, 6, 18);
    ctx.fillRect(1, 0, 6, 18);
    ctx.fillStyle = "#eb3b57";
    ctx.fillRect(-2.5, -50, 5, 14);
    ctx.restore();
  };

  drawCrew(-84, 0, crewPhase === "brace" ? -0.22 : 0, crewPhase === "brace");
  drawCrew(-58 + loaderTravel, 1, crewPhase === "load" ? -0.28 : 0, crewPhase === "load");
  drawCrew(-33 + ramTravel, 1, crewPhase === "ram" ? 0.24 : 0, crewPhase === "ram");

  ctx.fillStyle = "#785131";
  ctx.beginPath();
  ctx.moveTo(-34, -16);
  ctx.lineTo(37, -18);
  ctx.lineTo(45, -12);
  ctx.lineTo(39, -6);
  ctx.lineTo(-35, -5);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#6a452b";
  ctx.fillRect(-33, -24, 40, 9);
  ctx.strokeRect(-33, -24, 40, 9);
  ctx.fillStyle = "#5f3f27";
  ctx.beginPath();
  ctx.moveTo(30, -10);
  ctx.lineTo(74, -7);
  ctx.lineTo(74, -1);
  ctx.lineTo(28, -3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  drawWheel(-10, 0, 14);
  drawWheel(22, 0, 14);

  const flagWave = Math.sin(game.windPhase * 3 + (isPlayer ? 0 : 1.4));
  const windDir = game.wind >= 0 ? 1 : -1;
  ctx.strokeStyle = "#1b2435";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(-74, -17);
  ctx.lineTo(-74, -58);
  ctx.stroke();
  ctx.fillStyle = "#2f4f9b";
  ctx.beginPath();
  ctx.moveTo(-74, -57);
  ctx.quadraticCurveTo(-74 + windDir * 8, -60 - flagWave * 2.4, -74 + windDir * 16, -56 + flagWave);
  ctx.quadraticCurveTo(-74 + windDir * 8, -50 - flagWave * 1.8, -74, -48);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(-16, -13);
  ctx.rotate((-Math.PI / 180) * screenAngle);
  const barrelGrad = ctx.createLinearGradient(0, -8, 0, 8);
  barrelGrad.addColorStop(0, "#94999d");
  barrelGrad.addColorStop(0.45, "#4a5158");
  barrelGrad.addColorStop(1, "#202831");
  ctx.fillStyle = barrelGrad;
  ctx.fillRect(0, -6.3, 82, 12.6);
  ctx.strokeRect(0, -6.3, 82, 12.6);
  ctx.fillStyle = "#151b23";
  ctx.fillRect(74, -3.6, 10, 7.2);
  ctx.fillStyle = "rgba(173, 183, 192, 0.45)";
  ctx.fillRect(6, -5.1, 68, 1.5);
  ctx.fillStyle = "#2a3138";
  for (let i = 0; i < 4; i += 1) {
    ctx.fillRect(12 + i * 15, -6.3, 2, 12.6);
  }
  ctx.restore();

  if (crewPhase === "ram") {
    ctx.save();
    ctx.translate(-16, -13);
    ctx.rotate((-Math.PI / 180) * screenAngle);
    ctx.strokeStyle = "#d5d0b8";
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-12, -1.4);
    ctx.lineTo(46 + ramTravel * 0.9, -1.4);
    ctx.stroke();
    ctx.restore();
  }

  if (isFiring) {
    ctx.save();
    ctx.translate(-16, -13);
    ctx.rotate((-Math.PI / 180) * screenAngle);
    const flashSize = 12 + Math.abs(cadence) * 3.2;
    ctx.fillStyle = "rgba(255, 244, 197, 0.95)";
    ctx.beginPath();
    ctx.ellipse(86, 0, flashSize * 1.25, 7.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 162, 74, 0.9)";
    ctx.beginPath();
    ctx.ellipse(91, 0, flashSize * 0.9, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 206, 143, 0.76)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(82, 0);
    ctx.lineTo(100, -7);
    ctx.moveTo(82, 0);
    ctx.lineTo(100, 7);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

function drawAimGaugeOnCannon(ctx, canvas, worldX, angleDeg, power) {
  const baseY = terrainAtFortress(worldX);
  const c = worldToCanvas(canvas, worldX, baseY);
  const radius = Math.max(20, canvas.width * 0.025);
  const start = (-80 * Math.PI) / 180;
  const end = (-15 * Math.PI) / 180;
  const t = (angleDeg - 10) / 64;
  const needle = start + Math.max(0, Math.min(1, t)) * (end - start);

  ctx.save();
  ctx.translate(c.x, c.y - 16);
  ctx.lineWidth = Math.max(2, canvas.width * 0.002);
  ctx.strokeStyle = "#17345f";
  ctx.beginPath();
  ctx.arc(0, 0, radius, start, end);
  ctx.stroke();

  ctx.strokeStyle = "#f7f7f7";
  ctx.lineWidth = Math.max(3, canvas.width * 0.003);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.cos(needle) * radius, Math.sin(needle) * radius);
  ctx.stroke();

  ctx.fillStyle = "#17345f";
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(4, canvas.width * 0.004), 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#13284b";
  ctx.font = `${Math.max(12, canvas.width * 0.012)}px Trebuchet MS`;
  ctx.fillStyle = "#0a4d96";
  ctx.fillText(`${Math.round(angleDeg)} deg`, radius + 8, -4);
  ctx.fillStyle = "#13284b";
  ctx.fillText(`P ${Math.round(power)}`, radius + 8, 13);
  ctx.restore();
}

function drawAimTrajectoryPreview(ctx, canvas, worldX, angleDeg, power, wind) {
  const rad = (Math.PI / 180) * angleDeg;
  const muzzle = getFortressMuzzlePosition("player", angleDeg);
  let x = muzzle.x;
  let y = muzzle.y;
  const velocity = power * FORTRESS_SPEED_MULT;
  let vx = velocity * Math.cos(rad);
  let vy = velocity * Math.sin(rad);
  const dt = 0.05;

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.setLineDash([4, 8]);
  ctx.lineWidth = Math.max(1, canvas.width * 0.0018);
  ctx.beginPath();

  const maxX = ui.fortress.worldWidth || 100;
  const previewRatio = ui.fortress.weather?.previewRatio || 1;
  const maxSteps = Math.max(75, Math.floor(260 * previewRatio));
  for (let i = 0; i < maxSteps; i += 1) {
    vx += wind * FORTRESS_WIND_ACCEL * dt;
    vy -= FORTRESS_GRAVITY * dt;
    x += vx * dt;
    y += vy * dt;
    const c = worldToCanvas(canvas, x, y);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
    if (x > maxX + 14 || x < -14 || y < terrainAtFortress(x) || y < -8 || y > 260) break;
  }

  ctx.stroke();
  ctx.restore();
}

function getFortressMuzzlePosition(side, angleDeg) {
  const isPlayer = side === "player";
  const baseX = isPlayer ? ui.fortress.playerX : ui.fortress.enemyX;
  const baseY = terrainAtFortress(baseX) + 4.05;
  const rad = (Math.PI / 180) * angleDeg;
  const barrelLen = 4.8;
  if (isPlayer) {
    return {
      x: baseX + Math.cos(rad) * barrelLen,
      y: baseY + Math.sin(rad) * barrelLen,
    };
  }
  return {
    x: baseX - Math.cos(rad) * barrelLen,
    y: baseY + Math.sin(rad) * barrelLen,
  };
}

function projectFortressAngleForCanvas(canvas, worldAngleDeg) {
  const worldWidth = ui.fortress.worldWidth || 100;
  const viewWidth = Math.max(40, Math.min(worldWidth, ui.fortress.viewWidth || worldWidth));
  const viewHeight = Math.max(60, ui.fortress.viewHeight || 60);
  const sx = canvas.width / viewWidth;
  const sy = canvas.height / viewHeight;
  const rad = (Math.PI / 180) * worldAngleDeg;
  const projected = Math.atan2(Math.sin(rad) * sy, Math.cos(rad) * sx);
  return (projected * 180) / Math.PI;
}

function updateFortressHud() {
  const els = fortressEls();
  if (!els.head) return;
  const game = ui.fortress;
  const stage = game.stage || getFortressCampaignStage(fortressStats.campaignStage || 0);
  const weather = game.weather || FORTRESS_WEATHER_TYPES.clear;
  const winRate = fortressStats.games
    ? Math.round((fortressStats.wins / fortressStats.games) * 100)
    : 0;
  const enemyCrew = game.crew?.enemy?.phase || "idle";
  const playerCrew = game.crew?.player?.phase || "idle";

  els.head.textContent = `${stage.name} | Weather: ${weather.name} | Turn ${game.turnCount} | Your HP: ${
    game.playerHp
  } Enemy HP: ${game.enemyHp} | Turn: ${capitalize(game.turn)} | Angle: ${Math.round(
    game.currentAngle
  )} deg | Wind: ${game.wind > 0 ? "+" : ""}${game.wind} | Crew P:${playerCrew} E:${enemyCrew}`;

  if (els.playerHp) els.playerHp.style.width = `${Math.max(0, Math.min(100, game.playerHp))}%`;
  if (els.enemyHp) els.enemyHp.style.width = `${Math.max(0, Math.min(100, game.enemyHp))}%`;

  const wallHp = (game.walls || []).reduce((sum, wall) => sum + Math.max(0, wall.hitsRemaining), 0);
  if (els.angleText) {
    els.angleText.textContent = `On-cannon gauge active | Angle ${Math.round(
      game.currentAngle
    )} deg | Power ${Math.round(game.currentPower)} | Walls HP ${wallHp}/${
      (game.walls || []).length * 3
    } | Enemy crew: ${enemyCrew} | Stage ${Math.min(
      FORTRESS_CAMPAIGN_STAGES.length,
      (game.stageIndex || 0) + 1
    )}/${FORTRESS_CAMPAIGN_STAGES.length}`;
  }

  if (els.stats) {
    const replay = fortressStats.lastReplay;
    els.stats.innerHTML = `
      <p><strong>Best Score (${escapeHtml(activeUserName())})</strong></p>
      <p>Wins ${fortressStats.wins} / ${fortressStats.games} (${winRate}%)</p>
      <p>Quickest Win ${fortressStats.quickestWinSec || "-"} sec</p>
      <p>Best Remaining HP ${fortressStats.bestHpRemaining}</p>
      <p>Campaign Clears ${fortressStats.campaignClears || 0}</p>
      <p>Best Accuracy ${fortressStats.bestAccuracy || 0}%</p>
      <p>Direct Hits Total ${fortressStats.totalDirectHits || 0}</p>
      <p>Last Replay ${replay ? `${replay.accuracy}% acc (${replay.directHits}/${replay.playerShots})` : "-"}</p>
      <p>${escapeHtml(
        game.replayVisible
          ? `Hint: ${game.replayHint || "-"}`
          : replay?.suggestion
          ? `Last Hint: ${replay.suggestion}`
          : stage.briefing || ""
      )}</p>
    `;
  }

  if (els.msg) {
    els.msg.textContent = game.message;
  }

  if (els.startButton) {
    els.startButton.disabled = game.battleStarted;
  }
  if (refs.fortressTopStartBtn) {
    refs.fortressTopStartBtn.disabled = game.battleStarted;
  }
  if (els.fireButton) {
    const canFire =
      game.battleStarted && game.turn === "player" && game.phase === "aiming" && !game.projectile;
    els.fireButton.disabled = !canFire;
  }
}

function registerFortressResult(playerWon) {
  const game = ui.fortress;
  fortressStats.games += 1;
  const playerShots = game.shotHistory.filter((s) => s.owner === "player");
  const directHits = playerShots.filter((s) => s.result === "direct").length;
  const accuracy = playerShots.length ? Math.round((directHits / playerShots.length) * 100) : 0;
  if (playerWon) {
    fortressStats.wins += 1;
    const elapsedSec = Math.max(1, Math.round((Date.now() - (game.startTime || Date.now())) / 1000));
    fortressStats.quickestWinSec =
      fortressStats.quickestWinSec === 0
        ? elapsedSec
        : Math.min(fortressStats.quickestWinSec, elapsedSec);
    fortressStats.bestHpRemaining = Math.max(fortressStats.bestHpRemaining, game.playerHp);
    const lastStage = Math.max(0, FORTRESS_CAMPAIGN_STAGES.length - 1);
    if ((fortressStats.campaignStage || 0) >= lastStage) {
      fortressStats.campaignStage = 0;
      fortressStats.campaignClears = (fortressStats.campaignClears || 0) + 1;
    } else {
      fortressStats.campaignStage = Math.min(lastStage, (fortressStats.campaignStage || 0) + 1);
    }
  }
  fortressStats.bestAccuracy = Math.max(fortressStats.bestAccuracy || 0, accuracy);
  fortressStats.lastReplay = {
    playerShots: playerShots.length,
    directHits,
    accuracy,
    suggestion: game.replayHint || "",
  };
}

function activeUserName() {
  const active = ui.users.find((user) => String(user.id) === String(ui.activeUserId));
  return active?.name || "User";
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function getQuizSourceWords() {
  const list = state.lists.find((x) => x.id === ui.quiz.listId);
  return list ? list.words : [];
}

function startQuiz() {
  refreshListSelectors();
  const words = getQuizSourceWords();
  if (words.length < 4) {
    alert(t("quiz.needAtLeast4"));
    return;
  }

  ui.quiz.deck = shuffle(words.map((x) => ({ ...x })));
  ui.quiz.currentIndex = 0;
  ui.quiz.score = 0;
  ui.quiz.currentCorrect = "";
  ui.quiz.answered = false;
  renderQuizQuestion();
}

function renderQuizSetupHint() {
  refreshListSelectors();
  const words = getQuizSourceWords();
  if (!words.length) {
    refs.quizArea.innerHTML = `<p class='hint'>${escapeHtml(t("quiz.setupAddWords"))}</p>`;
    return;
  }
  if (ui.quiz.mode === "game") {
    refs.quizArea.innerHTML = `<p class="hint">${escapeHtml(
      t("quiz.setupGameMode", { count: words.length })
    )}</p>`;
  } else if (ui.quiz.mode === "artillery") {
    refs.quizArea.innerHTML = `<p class="hint">${escapeHtml(
      t("quiz.setupBatteryMode", { count: words.length })
    )}</p>`;
  } else {
    refs.quizArea.innerHTML = `<p class="hint">${escapeHtml(
      t("quiz.setupStandardMode", { count: words.length })
    )}</p>`;
  }
}

function renderQuizQuestion() {
  const total = ui.quiz.deck.length;
  const current = ui.quiz.deck[ui.quiz.currentIndex];
  if (!current) {
    renderQuizResult();
    return;
  }

  const wrongPool = ui.quiz.deck.filter((x) => x !== current && x.meaning);
  const wrongChoices = shuffle(wrongPool).slice(0, 3).map((x) => x.meaning);
  const correct = current.meaning || t("common.noMeaning");
  ui.quiz.currentCorrect = correct;
  ui.quiz.answered = false;

  const options = shuffle([correct, ...wrongChoices]);
  ui.quiz.currentOptions = options;
  const optionButtons = options
    .map(
      (option, idx) =>
        `<button type="button" class="quiz-option" data-option-idx="${idx}">${String.fromCharCode(
          65 + idx
        )}. ${escapeHtml(option)}</button>`
    )
    .join("");

  refs.quizArea.innerHTML = `
    <p class="quiz-meta">Question ${ui.quiz.currentIndex + 1} / ${total} | Score: ${
    ui.quiz.score
  }</p>
    <h3 class="quiz-question">What is the meaning of 「${escapeHtml(
      current.word
    )}」${current.furigana ? ` (${escapeHtml(current.furigana)})` : ""}?</h3>
    <div class="quiz-options">${optionButtons}</div>
    <div id="quiz-feedback" class="hint"></div>
    <button id="quiz-next-btn" type="button" style="margin-top:12px; display:none;">Next</button>
  `;

  refs.quizArea.querySelectorAll(".quiz-option").forEach((button) => {
    button.addEventListener("click", () => handleQuizAnswer(button));
  });
  refs.quizArea.querySelector("#quiz-next-btn").addEventListener("click", () => {
    ui.quiz.currentIndex += 1;
    renderQuizQuestion();
  });
}

function handleQuizAnswer(button) {
  if (ui.quiz.answered) return;
  ui.quiz.answered = true;

  const selectedIndex = Number(button.dataset.optionIdx || "-1");
  const selected = ui.quiz.currentOptions[selectedIndex] || "";
  const allButtons = refs.quizArea.querySelectorAll(".quiz-option");
  allButtons.forEach((item) => {
    const idx = Number(item.dataset.optionIdx || "-1");
    const candidate = ui.quiz.currentOptions[idx] || "";
    const isCorrect = candidate === ui.quiz.currentCorrect;
    if (isCorrect) {
      item.classList.add("correct");
    }
    if (item === button && !isCorrect) {
      item.classList.add("wrong");
    }
    item.disabled = true;
  });

  const feedback = refs.quizArea.querySelector("#quiz-feedback");
  const nextBtn = refs.quizArea.querySelector("#quiz-next-btn");
  const isRight = selected === ui.quiz.currentCorrect;
  if (isRight) {
    ui.quiz.score += 1;
    feedback.textContent = t("quiz.correct");
  } else {
    feedback.textContent = t("quiz.wrong", { answer: ui.quiz.currentCorrect });
  }
  nextBtn.style.display = "inline-block";
}

function renderQuizResult() {
  const total = ui.quiz.deck.length;
  const percent = total ? Math.round((ui.quiz.score / total) * 100) : 0;
  refs.quizArea.innerHTML = `
    <h3 class="quiz-question">Quiz Complete</h3>
    <div class="score-box">
      <p><strong>Score:</strong> ${ui.quiz.score} / ${total}</p>
      <p><strong>Accuracy:</strong> ${percent}%</p>
    </div>
    <button id="quiz-restart-btn" type="button" style="margin-top:12px;">Restart</button>
  `;
  refs.quizArea.querySelector("#quiz-restart-btn").addEventListener("click", () => {
    startQuiz();
  });
}

function startGameQuiz() {
  refreshListSelectors();
  const words = getQuizSourceWords().filter((word) => word.word && word.meaning);
  if (words.length < 4) {
    alert(t("quiz.needGame4"));
    return;
  }

  const pairWords = shuffle(words).slice(0, Math.min(8, words.length));
  const tiles = [];

  pairWords.forEach((word, index) => {
    const pairId = `pair_${index}`;
    tiles.push({
      pairId,
      side: "word",
      label: word.word,
      detail: word.furigana || "",
      flipped: false,
      matched: false,
    });
    tiles.push({
      pairId,
      side: "meaning",
      label: word.meaning,
      detail: "",
      flipped: false,
      matched: false,
    });
  });

  ui.quiz.game = {
    tiles: shuffle(tiles),
    firstIndex: -1,
    secondIndex: -1,
    matchedPairs: 0,
    attempts: 0,
    locked: false,
    pairTotal: pairWords.length,
    startTime: Date.now(),
    endTime: 0,
  };

  renderGameQuiz();
}

function renderGameQuiz() {
  const game = ui.quiz.game;
  if (!game.tiles.length) {
    renderQuizSetupHint();
    return;
  }

  const elapsedMs = (game.endTime || Date.now()) - game.startTime;
  const elapsedSec = Math.max(0, Math.floor(elapsedMs / 1000));

  const tileHtml = game.tiles
    .map((tile, index) => {
      const cardClasses = [
        "game-tile",
        tile.flipped || tile.matched ? "is-flipped" : "",
        tile.matched ? "is-matched" : "",
      ]
        .filter(Boolean)
        .join(" ");

      return `
        <button type="button" class="${cardClasses}" data-game-idx="${index}">
          <span class="game-tile-inner">
            <span class="game-tile-face game-front">?</span>
            <span class="game-tile-face game-back">
              <span class="game-label">${escapeHtml(tile.label)}</span>
              ${tile.detail ? `<span class="game-detail">${escapeHtml(tile.detail)}</span>` : ""}
            </span>
          </span>
        </button>
      `;
    })
    .join("");

  refs.quizArea.innerHTML = `
    <p class="quiz-meta">Mode: Game Quiz | Matched ${game.matchedPairs}/${game.pairTotal} | Attempts ${
    game.attempts
  } | Time ${formatDuration(elapsedSec)}</p>
    <p class="hint">Flip cards and match Japanese words with their meanings as fast as possible.</p>
    <div class="game-grid">${tileHtml}</div>
  `;

  refs.quizArea.querySelectorAll("[data-game-idx]").forEach((button) => {
    button.addEventListener("click", () => {
      handleGameTileClick(Number(button.dataset.gameIdx || "-1"));
    });
  });
}

function handleGameTileClick(index) {
  const game = ui.quiz.game;
  if (!game.tiles.length || game.locked) return;
  if (index < 0 || index >= game.tiles.length) return;

  const tile = game.tiles[index];
  if (tile.matched || tile.flipped) return;
  tile.flipped = true;

  if (game.firstIndex === -1) {
    game.firstIndex = index;
    renderGameQuiz();
    return;
  }

  if (game.secondIndex === -1) {
    game.secondIndex = index;
    game.attempts += 1;
    game.locked = true;
    renderGameQuiz();

    window.setTimeout(() => {
      resolveGameTurn();
    }, 520);
  }
}

function resolveGameTurn() {
  const game = ui.quiz.game;
  const first = game.tiles[game.firstIndex];
  const second = game.tiles[game.secondIndex];
  if (!first || !second) {
    game.firstIndex = -1;
    game.secondIndex = -1;
    game.locked = false;
    renderGameQuiz();
    return;
  }

  const matched = first.pairId === second.pairId && first.side !== second.side;
  if (matched) {
    first.matched = true;
    second.matched = true;
    game.matchedPairs += 1;
  } else {
    first.flipped = false;
    second.flipped = false;
  }

  game.firstIndex = -1;
  game.secondIndex = -1;
  game.locked = false;

  if (game.matchedPairs >= game.pairTotal) {
    game.endTime = Date.now();
    renderGameQuizResult();
    return;
  }
  renderGameQuiz();
}

function renderGameQuizResult() {
  const game = ui.quiz.game;
  const elapsedSec = Math.max(1, Math.round((game.endTime - game.startTime) / 1000));
  const perfectAttempts = Math.max(1, game.pairTotal);
  const efficiency = Math.round((perfectAttempts / Math.max(game.attempts, perfectAttempts)) * 100);
  const score = Math.max(0, Math.round(game.pairTotal * 120 + efficiency * 4 - elapsedSec * 3));

  refs.quizArea.innerHTML = `
    <h3 class="quiz-question">Game Complete</h3>
    <div class="score-box">
      <p><strong>Pairs:</strong> ${game.pairTotal}</p>
      <p><strong>Attempts:</strong> ${game.attempts}</p>
      <p><strong>Time:</strong> ${formatDuration(elapsedSec)}</p>
      <p><strong>Efficiency:</strong> ${efficiency}%</p>
      <p><strong>Game Score:</strong> ${score}</p>
    </div>
    <button id="quiz-restart-btn" type="button" style="margin-top:12px;">Play Again</button>
  `;

  refs.quizArea.querySelector("#quiz-restart-btn").addEventListener("click", () => {
    startGameQuiz();
  });
}

function startArtilleryQuiz() {
  refreshListSelectors();
  const words = getQuizSourceWords().filter((word) => word.word && word.meaning);
  if (words.length < 4) {
    alert(t("quiz.needBattery4"));
    return;
  }

  const deck = shuffle(words).slice(0, Math.min(20, words.length));
  const condition = selectBattleCondition();
  const objective = pickBattleObjective(artilleryCampaign.level);
  const canUseCanister = Boolean(artilleryCampaign.unlocks?.canister);

  ui.quiz.artillery = {
    words: deck,
    questionIndex: 0,
    phaseKey: ARTILLERY_PHASES[0].key,
    conditionKey: condition.key,
    enemyMorale: 100,
    playerMorale: 100,
    enemyCohesion: 100,
    playerCohesion: 100,
    streak: 0,
    attempts: 0,
    correctAnswers: 0,
    distance: "far",
    objective,
    stats: {
      shellHits: 0,
      roundHits: 0,
      canisterHits: 0,
    },
    ammo: {
      round: 2,
      shell: 1,
      canister: canUseCanister ? 1 : 0,
    },
    strategy: {
      stance: "balanced",
    },
    currentQuestion: null,
    awaitingShot: false,
    resolving: false,
    fx: {
      playerPose: "idle",
      enemyPose: "idle",
      shotType: "",
      showProjectile: false,
      showImpact: false,
      enemyShotType: "",
      showEnemyProjectile: false,
      showEnemyImpact: false,
    },
    log: [
      `Battery deployed. Condition: ${condition.name}.`,
      `Objective: ${objective.label}`,
    ],
    battleEnded: false,
    victoryReason: "",
    defeatReason: "",
    progressApplied: false,
    startTime: Date.now(),
    endTime: 0,
  };

  setNextArtilleryQuestion();
  renderArtilleryQuiz();
}

function setNextArtilleryQuestion() {
  const game = ui.quiz.artillery;
  if (!game.words.length) {
    game.currentQuestion = null;
    return;
  }
  const word = game.words[game.questionIndex % game.words.length];
  const correct = word.meaning || "No meaning";
  const wrongPool = game.words.filter((x) => x !== word && x.meaning);
  const wrongChoices = shuffle(wrongPool).slice(0, 3).map((x) => x.meaning);
  game.currentQuestion = {
    word,
    correct,
    options: shuffle([correct, ...wrongChoices]),
  };
  game.distance = pickBattleDistance(game.questionIndex);
  game.phaseKey = getArtilleryPhase(game.questionIndex).key;
}

function pickBattleDistance(turnIndex) {
  const cycle = ["far", "mid", "close"];
  return cycle[turnIndex % cycle.length];
}

function selectBattleCondition() {
  const forced = getConditionByKey(artilleryCampaign.selectedCondition);
  if (forced) return forced;
  return ARTILLERY_CONDITIONS[Math.floor(Math.random() * ARTILLERY_CONDITIONS.length)];
}

function getConditionByKey(key) {
  return ARTILLERY_CONDITIONS.find((item) => item.key === key) || null;
}

function getArtilleryPhase(turnIndex) {
  if (turnIndex >= 7) return ARTILLERY_PHASES[2];
  if (turnIndex >= 3) return ARTILLERY_PHASES[1];
  return ARTILLERY_PHASES[0];
}

function pickBattleObjective(level) {
  const objectives = [
    {
      type: "break",
      label: "Break enemy morale before your battery collapses.",
      target: 1,
      turnLimit: 999,
      progress: 0,
      completed: false,
      failed: false,
    },
    {
      type: "hold",
      label: "Hold position for 8 turns with morale above 20.",
      target: 8,
      turnLimit: 8,
      progress: 0,
      completed: false,
      failed: false,
    },
    {
      type: "precision",
      label: "Land 2 shell hits within 9 turns.",
      target: 2,
      turnLimit: 9,
      progress: 0,
      completed: false,
      failed: false,
    },
  ];
  if (level <= 1) return objectives[0];
  return objectives[Math.floor(Math.random() * objectives.length)];
}

function renderArtilleryQuiz() {
  const game = ui.quiz.artillery;
  if (!game || !game.words.length) {
    renderQuizSetupHint();
    return;
  }

  const elapsedSec = Math.max(
    0,
    Math.floor(((game.endTime || Date.now()) - (game.startTime || Date.now())) / 1000)
  );
  const q = game.currentQuestion;

  if (!q) {
    renderArtilleryResult();
    return;
  }

  const optionsHtml = q.options
    .map(
      (option, idx) =>
        `<button type="button" class="quiz-option artillery-option" data-artillery-option="${idx}">${String.fromCharCode(
          65 + idx
        )}. ${escapeHtml(option)}</button>`
    )
    .join("");

  const ammo = game.ammo;
  const strategy = game.strategy || {};
  const condition = getConditionByKey(game.conditionKey) || ARTILLERY_CONDITIONS[0];
  const phase = getArtilleryPhase(game.questionIndex);
  const shotDisabled = game.awaitingShot && !game.resolving ? "" : "disabled";
  const optionsDisabled = game.awaitingShot || game.resolving ? "disabled" : "";
  const orderDisabled = game.resolving ? "disabled" : "";
  const activeStance = strategy.stance || "balanced";
  const rangeHint = getRangeHint(game.distance, activeStance, condition, phase);
  const objectiveStatus = checkArtilleryObjective(game, false);
  const stageClasses = [
    "battle-stage",
    `distance-${game.distance}`,
    game.fx.playerPose === "loading" ? "player-loading" : "",
    game.fx.enemyPose === "loading" ? "enemy-loading" : "",
    game.fx.playerPose === "firing" ? "player-firing" : "",
    game.fx.enemyPose === "firing" ? "enemy-firing" : "",
    game.fx.playerPose === "firing" ? `player-firing-${game.fx.shotType || "round"}` : "",
    game.fx.enemyPose === "firing" ? `enemy-firing-${game.fx.enemyShotType || "round"}` : "",
    game.fx.showProjectile ? `shot-${game.fx.shotType}` : "",
    game.fx.showImpact ? `impact-${game.fx.shotType}` : "",
    game.fx.showImpact ? "enemy-hit" : "",
    game.fx.showImpact ? `enemy-hit-${game.fx.shotType}` : "",
    game.fx.showEnemyProjectile ? `enemy-shot-${game.fx.enemyShotType}` : "",
    game.fx.showEnemyImpact ? `enemy-impact-${game.fx.enemyShotType}` : "",
    game.fx.showEnemyImpact ? "player-hit" : "",
    game.fx.showEnemyImpact ? `player-hit-${game.fx.enemyShotType}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  refs.quizArea.innerHTML = `
    <div class="artillery-wrap">
      <p class="quiz-meta">Battery Command | Turn ${game.questionIndex + 1} | Time ${formatDuration(
    elapsedSec
  )} | Streak ${game.streak} | Lv.${artilleryCampaign.level}</p>
      <div class="artillery-main">
        <div class="${stageClasses}">
          <div class="stage-hp stage-hp-enemy">
            <p>Enemy Morale ${Math.max(0, game.enemyMorale)}% | Cohesion ${Math.max(0, game.enemyCohesion)}%</p>
            <div class="meter enemy"><span style="width:${Math.max(0, Math.min(100, game.enemyMorale))}%;"></span></div>
            <div class="meter cohesion"><span style="width:${Math.max(0, Math.min(100, game.enemyCohesion))}%;"></span></div>
          </div>
          <div class="stage-hp stage-hp-player">
            <p>Your Morale ${Math.max(0, game.playerMorale)}% | Cohesion ${Math.max(0, game.playerCohesion)}%</p>
            <div class="meter player"><span style="width:${Math.max(0, Math.min(100, game.playerMorale))}%;"></span></div>
            <div class="meter cohesion"><span style="width:${Math.max(0, Math.min(100, game.playerCohesion))}%;"></span></div>
          </div>
          <div class="battle-ground">
            <div class="battery battery-player">
              <div class="reload-meter reload-player"><span></span><em>Reloading</em></div>
              <div class="crew crew-officer soldier">
                <span class="hat"></span>
                <span class="plume"></span>
                <span class="head"></span>
                <span class="torso"></span>
                <span class="strap"></span>
                <span class="leg leg-left"></span>
                <span class="leg leg-right"></span>
                <span class="tool sabre"></span>
              </div>
              <div class="crew crew-gunner soldier">
                <span class="hat"></span>
                <span class="plume"></span>
                <span class="head"></span>
                <span class="torso"></span>
                <span class="strap"></span>
                <span class="leg leg-left"></span>
                <span class="leg leg-right"></span>
                <span class="tool ramrod"></span>
              </div>
              <div class="crew crew-loader soldier">
                <span class="hat"></span>
                <span class="plume"></span>
                <span class="head"></span>
                <span class="torso"></span>
                <span class="strap"></span>
                <span class="leg leg-left"></span>
                <span class="leg leg-right"></span>
                <span class="tool sponge"></span>
              </div>
              <div class="cannon cannon-player">
                <span class="barrel"></span>
                <span class="muzzle"></span>
                <span class="carriage"></span>
                <span class="trail"></span>
                <span class="wheel wheel-a"></span>
                <span class="wheel wheel-b"></span>
              </div>
            </div>
            <div class="battery battery-enemy">
              <div class="reload-meter reload-enemy"><span></span><em>Reloading</em></div>
              <div class="cannon cannon-enemy">
                <span class="barrel"></span>
                <span class="muzzle"></span>
                <span class="carriage"></span>
                <span class="trail"></span>
                <span class="wheel wheel-a"></span>
                <span class="wheel wheel-b"></span>
              </div>
              <div class="crew crew-officer soldier">
                <span class="hat"></span>
                <span class="plume"></span>
                <span class="head"></span>
                <span class="torso"></span>
                <span class="strap"></span>
                <span class="leg leg-left"></span>
                <span class="leg leg-right"></span>
                <span class="tool sabre"></span>
              </div>
              <div class="crew crew-gunner soldier">
                <span class="hat"></span>
                <span class="plume"></span>
                <span class="head"></span>
                <span class="torso"></span>
                <span class="strap"></span>
                <span class="leg leg-left"></span>
                <span class="leg leg-right"></span>
                <span class="tool ramrod"></span>
              </div>
              <div class="crew crew-loader soldier">
                <span class="hat"></span>
                <span class="plume"></span>
                <span class="head"></span>
                <span class="torso"></span>
                <span class="strap"></span>
                <span class="leg leg-left"></span>
                <span class="leg leg-right"></span>
                <span class="tool sponge"></span>
              </div>
            </div>
          </div>
          <div class="shot-lane" aria-hidden="true">
            <span class="muzzle muzzle-player"></span>
            <span class="muzzle muzzle-enemy"></span>
            <span class="smoke smoke-player"></span>
            <span class="smoke smoke-enemy"></span>
            <span class="proj proj-round"></span>
            <span class="proj proj-shell"></span>
            <span class="proj proj-canister c1"></span>
            <span class="proj proj-canister c2"></span>
            <span class="proj proj-canister c3"></span>
            <span class="impact-blast"></span>
            <span class="enemy-proj enemy-proj-round"></span>
            <span class="enemy-proj enemy-proj-shell"></span>
            <span class="enemy-proj enemy-proj-canister c1"></span>
            <span class="enemy-proj enemy-proj-canister c2"></span>
            <span class="enemy-proj enemy-proj-canister c3"></span>
            <span class="enemy-impact-blast"></span>
          </div>
        </div>
      </div>
      <div class="artillery-control-panel">
        <div class="status-row">
          <p class="artillery-range">Range: ${escapeHtml(game.distance.toUpperCase())}</p>
          <p class="status-chip">Phase: ${escapeHtml(phase.name)}</p>
          <p class="status-chip">Condition: ${escapeHtml(condition.name)}</p>
          <div class="tactics-row">
            <button type="button" class="tactic-btn ${activeStance === "balanced" ? "active" : ""}" data-order="balanced" ${orderDisabled}>Balanced</button>
            <button type="button" class="tactic-btn ${activeStance === "offensive" ? "active" : ""}" data-order="offensive" ${orderDisabled}>Offensive</button>
            <button type="button" class="tactic-btn ${activeStance === "defensive" ? "active" : ""}" data-order="defensive" ${orderDisabled}>Defensive</button>
          </div>
        </div>
        <p class="objective-row ${objectiveStatus.failed ? "failed" : objectiveStatus.completed ? "ok" : ""}">
          Objective: ${escapeHtml(game.objective.label)} (${game.objective.progress}/${game.objective.target})
        </p>
        <p class="tactics-note">${escapeHtml(rangeHint)}</p>
        <div class="artillery-prompt">
          <h3 class="quiz-question">「${escapeHtml(q.word.word)}」${
    q.word.furigana ? ` (${escapeHtml(q.word.furigana)})` : ""
  } means?</h3>
        </div>
        <div class="artillery-options">${optionsHtml}</div>
        <div id="artillery-feedback" class="hint"></div>
        <div class="artillery-shot-row">
          <button type="button" class="shot-btn" data-shot="round" ${hasUnlockedShot("round") ? shotDisabled : "disabled"}>Round (${ammo.round})</button>
          <button type="button" class="shot-btn" data-shot="shell" ${hasUnlockedShot("shell") ? shotDisabled : "disabled"}>Shell (${ammo.shell})</button>
          <button type="button" class="shot-btn" data-shot="canister" ${hasUnlockedShot("canister") ? shotDisabled : "disabled"}>${hasUnlockedShot("canister") ? "Canister" : "Canister 🔒"} (${ammo.canister})</button>
        </div>
      </div>
      <div class="artillery-log">${renderArtilleryLog(game.log)}</div>
    </div>
  `;

  refs.quizArea.querySelectorAll("[data-artillery-option]").forEach((button) => {
    button.disabled = Boolean(optionsDisabled);
    button.addEventListener("click", () => {
      handleArtilleryAnswer(Number(button.dataset.artilleryOption || "-1"));
    });
  });
  refs.quizArea.querySelectorAll("[data-shot]").forEach((button) => {
    button.addEventListener("click", () => {
      handleArtilleryShot(String(button.dataset.shot || ""));
    });
  });
  refs.quizArea.querySelectorAll("[data-order]").forEach((button) => {
    button.addEventListener("click", () => {
      handleArtilleryOrder(String(button.dataset.order || ""));
    });
  });
}

function renderArtilleryLog(logLines) {
  const lines = Array.isArray(logLines) ? logLines.slice(-5) : [];
  return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function handleArtilleryAnswer(optionIndex) {
  const game = ui.quiz.artillery;
  if (game.battleEnded || !game.currentQuestion) return;
  if (game.awaitingShot || game.resolving) return;
  if (optionIndex < 0 || optionIndex >= game.currentQuestion.options.length) return;

  game.attempts += 1;
  const selected = game.currentQuestion.options[optionIndex];
  const correct = game.currentQuestion.correct;
  const feedback = refs.quizArea.querySelector("#artillery-feedback");
  if (selected === correct) {
    game.streak += 1;
    game.correctAnswers += 1;
    game.awaitingShot = true;
    game.fx.playerPose = "loading";
    game.ammo.round += 1;
    if (game.streak % 2 === 0) game.ammo.shell += 1;
    if (hasUnlockedShot("canister") && game.streak % 3 === 0) game.ammo.canister += 1;
    appendArtilleryLog(game, "Correct. Battery supplied. Choose your shot.");
    if (feedback) feedback.textContent = "Correct. Choose a cannon shot.";
  } else {
    game.resolving = true;
    game.streak = 0;
    game.playerMorale = Math.max(0, game.playerMorale - 6);
    game.playerCohesion = Math.max(0, game.playerCohesion - 8);
    game.fx.playerPose = "idle";
    appendArtilleryLog(game, "Wrong command. Enemy pressure rises.");
    if (feedback) feedback.textContent = `Wrong. Correct answer: ${correct}`;
    runEnemyCounterfireSequence(() => {
      advanceArtilleryTurn();
      game.resolving = false;
      resetArtilleryFx(game);
      renderArtilleryQuiz();
    });
  }
  renderArtilleryQuiz();
}

function handleArtilleryShot(shotType) {
  const game = ui.quiz.artillery;
  if (!game.awaitingShot || game.battleEnded || game.resolving) return;
  if (!["round", "shell", "canister"].includes(shotType)) return;
  if (!hasUnlockedShot(shotType)) {
    appendArtilleryLog(game, `${capitalize(shotType)} is still locked in campaign.`);
    renderArtilleryQuiz();
    return;
  }
  if (game.ammo[shotType] <= 0) {
    appendArtilleryLog(game, `No ${shotType} ammo available.`);
    renderArtilleryQuiz();
    return;
  }

  const condition = getConditionByKey(game.conditionKey) || ARTILLERY_CONDITIONS[0];
  const phase = getArtilleryPhase(game.questionIndex);
  const misfireChance = Math.max(
    0,
    0.03 +
      (condition.misfireBonus || 0) +
      (shotType === "shell" ? 0.01 : 0) +
      (game.distance === "far" ? 0.02 : 0)
  );

  game.resolving = true;
  game.ammo[shotType] -= 1;
  game.awaitingShot = false;
  game.fx.playerPose = "firing";
  game.fx.shotType = shotType;
  game.fx.showProjectile = true;
  game.fx.showImpact = false;
  appendArtilleryLog(game, `Fire ${capitalize(shotType)}!`);
  renderArtilleryQuiz();

  window.setTimeout(() => {
    const misfire = Math.random() < misfireChance;
    game.fx.showProjectile = false;
    game.fx.showImpact = true;
    if (misfire) {
      const backlash = 4 + Math.floor(Math.random() * 4);
      game.playerCohesion = Math.max(0, game.playerCohesion - backlash);
      appendArtilleryLog(game, `${capitalize(shotType)} misfire. Crew shaken (${backlash} cohesion).`);
    } else {
      const hit = computeArtilleryDamage(
        shotType,
        game.distance,
        game.streak,
        game.strategy?.stance,
        condition,
        phase,
        game.playerCohesion
      );
      applyArtilleryHit(game, "enemy", hit.morale, hit.cohesion);
      if (shotType === "shell") game.stats.shellHits += 1;
      if (shotType === "round") game.stats.roundHits += 1;
      if (shotType === "canister") game.stats.canisterHits += 1;
      appendArtilleryLog(
        game,
        `${capitalize(shotType)} hit for ${hit.morale} morale / ${hit.cohesion} cohesion.`
      );
    }
    renderArtilleryQuiz();

    window.setTimeout(() => {
      game.fx.showImpact = false;
      const objective = checkArtilleryObjective(game, true);
      if (
        game.enemyMorale <= 0 ||
        game.enemyCohesion <= 0 ||
        objective.completed ||
        objective.failed
      ) {
        game.battleEnded = true;
        game.endTime = Date.now();
        if (objective.completed) game.victoryReason = "Objective complete.";
        if (objective.failed) game.defeatReason = "Objective failed.";
        renderArtilleryResult();
        return;
      }

      runEnemyCounterfireSequence(() => {
        advanceArtilleryTurn();
        game.resolving = false;
        resetArtilleryFx(game);
        renderArtilleryQuiz();
      });
    }, 420);
  }, 520);
}

function runEnemyCounterfireSequence(onDone) {
  const game = ui.quiz.artillery;
  game.fx.enemyPose = "loading";
  game.fx.enemyShotType = pickEnemyShotType(game.distance);
  renderArtilleryQuiz();
  window.setTimeout(() => {
    game.fx.enemyPose = "firing";
    game.fx.showEnemyProjectile = true;
    renderArtilleryQuiz();
    window.setTimeout(() => {
      game.fx.showEnemyProjectile = false;
      game.fx.showEnemyImpact = true;
      enemyCounterfire();
      renderArtilleryQuiz();
      window.setTimeout(() => {
        game.fx.showEnemyImpact = false;
        game.fx.enemyPose = "idle";
        if (typeof onDone === "function") {
          onDone();
        }
      }, 320);
    }, 520);
  }, 700);
}

function pickEnemyShotType(distance) {
  if (distance === "far") {
    return Math.random() < 0.7 ? "round" : "shell";
  }
  if (distance === "mid") {
    return Math.random() < 0.6 ? "shell" : "round";
  }
  return Math.random() < 0.7 ? "canister" : "shell";
}

function resetArtilleryFx(game) {
  game.fx.playerPose = "idle";
  game.fx.enemyPose = "idle";
  game.fx.shotType = "";
  game.fx.showProjectile = false;
  game.fx.showImpact = false;
  game.fx.enemyShotType = "";
  game.fx.showEnemyProjectile = false;
  game.fx.showEnemyImpact = false;
}

function computeArtilleryDamage(
  shotType,
  distance,
  streak,
  stance = "balanced",
  condition,
  phase,
  attackerCohesion
) {
  const multipliers = {
    round: { far: 1.0, mid: 0.82, close: 0.65 },
    shell: { far: 0.9, mid: 1.0, close: 0.9 },
    canister: { far: 0.45, mid: 0.82, close: 1.18 },
  };
  const baseRange = {
    round: [10, 16],
    shell: [14, 22],
    canister: [20, 30],
  };
  const [lo, hi] = baseRange[shotType] || [8, 14];
  const base = lo + Math.floor(Math.random() * (hi - lo + 1));
  const streakBonus = Math.min(10, streak * 2);
  const mult = (multipliers[shotType] || multipliers.round)[distance] || 1;
  const stanceMult = stance === "offensive" ? 1.16 : stance === "defensive" ? 0.9 : 1;
  const conditionMult = condition?.attackMult ?? 1;
  const phaseMult = phase?.playerFireMult ?? 1;
  const cohesionMult = 0.84 + Math.max(0, Math.min(100, attackerCohesion)) / 180;
  const raw = (base + streakBonus) * mult * stanceMult * conditionMult * phaseMult * cohesionMult;
  const morale = Math.max(1, Math.round(raw));
  const cohesion = Math.max(1, Math.round(raw * (shotType === "canister" ? 0.72 : 0.56)));
  return { morale, cohesion };
}

function applyArtilleryHit(game, side, moraleDamage, cohesionDamage) {
  const morale = Math.max(1, Number(moraleDamage) || 0);
  const cohesion = Math.max(1, Number(cohesionDamage) || 0);
  if (side === "enemy") {
    game.enemyMorale = Math.max(0, game.enemyMorale - morale);
    game.enemyCohesion = Math.max(0, game.enemyCohesion - cohesion);
    return;
  }
  game.playerMorale = Math.max(0, game.playerMorale - morale);
  game.playerCohesion = Math.max(0, game.playerCohesion - cohesion);
}

function enemyCounterfire() {
  const game = ui.quiz.artillery;
  const condition = getConditionByKey(game.conditionKey) || ARTILLERY_CONDITIONS[0];
  const phase = getArtilleryPhase(game.questionIndex);
  const shotType = game.fx.enemyShotType || pickEnemyShotType(game.distance);
  const base = shotType === "canister" ? 7 : shotType === "shell" ? 6 : 5;
  const distanceBoost = game.distance === "close" ? 3 : game.distance === "mid" ? 1 : 0;
  const stance = game.strategy?.stance || "balanced";
  const stanceBoost = stance === "offensive" ? 3 : stance === "defensive" ? -2 : 0;
  const cohesionPenalty = Math.max(0.45, 1 - game.enemyCohesion / 180);
  const moraleDamage = Math.max(
    1,
    Math.round(
      (base + Math.floor(Math.random() * 6) + distanceBoost + stanceBoost) *
        (condition.enemyFireMult || 1) *
        (phase.enemyFireMult || 1) *
        cohesionPenalty
    )
  );
  const cohesionDamage = Math.max(1, Math.round(moraleDamage * 0.6));
  applyArtilleryHit(game, "player", moraleDamage, cohesionDamage);
  appendArtilleryLog(
    game,
    `Enemy ${shotType} counterfire deals ${moraleDamage} morale / ${cohesionDamage} cohesion.`
  );
}

function advanceArtilleryTurn() {
  const game = ui.quiz.artillery;
  const objective = checkArtilleryObjective(game, true);
  if (
    game.enemyMorale <= 0 ||
    game.enemyCohesion <= 0 ||
    game.playerMorale <= 0 ||
    game.playerCohesion <= 0 ||
    objective.completed ||
    objective.failed
  ) {
    game.battleEnded = true;
    game.endTime = Date.now();
    if (objective.completed) game.victoryReason = "Objective complete.";
    if (objective.failed) game.defeatReason = "Objective failed.";
    renderArtilleryResult();
    return;
  }
  game.questionIndex += 1;
  if (game.questionIndex > 0 && game.questionIndex % 4 === 0) {
    const rotated = ARTILLERY_CONDITIONS[Math.floor(Math.random() * ARTILLERY_CONDITIONS.length)];
    game.conditionKey = rotated.key;
    appendArtilleryLog(game, `Weather shift: ${rotated.name}. ${rotated.description}`);
  }
  setNextArtilleryQuestion();
}

function appendArtilleryLog(game, message) {
  game.log.push(message);
  if (game.log.length > 8) game.log = game.log.slice(-8);
}

function handleArtilleryOrder(order) {
  const game = ui.quiz.artillery;
  if (!game || game.resolving || game.battleEnded) return;
  if (!["balanced", "offensive", "defensive"].includes(order)) return;
  game.strategy.stance = order;
  appendArtilleryLog(game, `Order set: ${capitalize(order)} stance.`);
  renderArtilleryQuiz();
}

function getRangeHint(distance, stance, condition, phase) {
  const base =
    distance === "far"
      ? "FAR: round best, enemy fire lighter."
      : distance === "mid"
        ? "MID: shell best, balanced pressure."
        : "CLOSE: canister best, enemy fire heavy.";
  const stanceHint =
    stance === "offensive"
      ? " OFFENSE: +damage, +risk."
      : stance === "defensive"
        ? " DEFENSE: -risk, -damage."
        : " BALANCED: neutral.";
  const conditionHint = condition ? ` ${condition.name}: ${condition.description}` : "";
  const phaseHint = phase ? ` Phase ${phase.name}: ${phase.description}` : "";
  return `${base}${stanceHint}${conditionHint}${phaseHint}`;
}

function hasUnlockedShot(shotType) {
  if (shotType === "round") return true;
  if (shotType === "shell") return true;
  if (shotType === "canister") return Boolean(artilleryCampaign.unlocks?.canister);
  return false;
}

function checkArtilleryObjective(game, commit) {
  const objective = game.objective || {};
  if (!objective.type) {
    return { completed: false, failed: false, progress: 0 };
  }
  let completed = false;
  let failed = false;
  let progress = objective.progress || 0;
  const turnNumber = game.questionIndex + 1;

  if (objective.type === "break") {
    progress = game.enemyMorale <= 0 || game.enemyCohesion <= 0 ? 1 : 0;
    completed = progress >= objective.target;
  } else if (objective.type === "hold") {
    progress = Math.min(objective.target || 8, turnNumber);
    completed = progress >= (objective.target || 8) && game.playerMorale > 20 && game.playerCohesion > 20;
    failed = turnNumber >= (objective.turnLimit || 8) && !completed;
  } else if (objective.type === "precision") {
    progress = Math.max(progress, game.stats.shellHits || 0);
    completed = progress >= (objective.target || 2);
    failed = turnNumber >= (objective.turnLimit || 9) && !completed;
  }

  if (commit) {
    game.objective.progress = progress;
    game.objective.completed = completed;
    game.objective.failed = failed;
  }
  return { completed, failed, progress };
}

function applyArtilleryProgression(game, victory, objectiveCompleted, elapsedSec) {
  const accuracy = game.attempts ? game.correctAnswers / game.attempts : 0;
  const baseXp = 35 + Math.round(accuracy * 55) + Math.max(0, game.playerMorale - 20) / 2;
  const victoryXp = victory ? 50 : 10;
  const objectiveXp = objectiveCompleted ? 35 : 0;
  const tempoBonus = Math.max(0, 20 - Math.floor(elapsedSec / 20));
  const gained = Math.max(15, Math.round(baseXp + victoryXp + objectiveXp + tempoBonus));

  artilleryCampaign.battlesPlayed += 1;
  if (victory) artilleryCampaign.battlesWon += 1;
  artilleryCampaign.xp += gained;

  const previousLevel = artilleryCampaign.level;
  artilleryCampaign.level = Math.max(1, 1 + Math.floor(artilleryCampaign.xp / 140));
  if (artilleryCampaign.level >= 2) {
    artilleryCampaign.unlocks.canister = true;
  }
  if (artilleryCampaign.level > previousLevel) {
    appendArtilleryLog(game, `Promotion! Battery reached level ${artilleryCampaign.level}.`);
  }
  saveArtilleryCampaign();
  return gained;
}

function renderArtilleryResult() {
  const game = ui.quiz.artillery;
  const elapsedSec = Math.max(
    1,
    Math.round(((game.endTime || Date.now()) - (game.startTime || Date.now())) / 1000)
  );
  const objective = checkArtilleryObjective(game, true);
  const victory =
    (game.enemyMorale <= 0 || game.enemyCohesion <= 0 || objective.completed) &&
    game.playerMorale > 0 &&
    game.playerCohesion > 0 &&
    !objective.failed;

  if (!game.progressApplied) {
    game.xpGained = applyArtilleryProgression(game, victory, objective.completed, elapsedSec);
    game.progressApplied = true;
  }

  const score = Math.max(
    0,
    Math.round(
      140 +
        (100 - Math.max(0, game.enemyMorale)) * 3 +
        Math.max(0, game.playerMorale) * 2 +
        Math.max(0, game.playerCohesion) -
        elapsedSec +
        (objective.completed ? 120 : 0)
    )
  );

  refs.quizArea.innerHTML = `
    <h3 class="quiz-question">${victory ? "Victory at the Battery" : "Retreat and Regroup"}</h3>
    <div class="score-box">
      <p><strong>Enemy Morale:</strong> ${Math.max(0, game.enemyMorale)}%</p>
      <p><strong>Enemy Cohesion:</strong> ${Math.max(0, game.enemyCohesion)}%</p>
      <p><strong>Your Morale:</strong> ${Math.max(0, game.playerMorale)}%</p>
      <p><strong>Your Cohesion:</strong> ${Math.max(0, game.playerCohesion)}%</p>
      <p><strong>Turns:</strong> ${game.questionIndex + 1}</p>
      <p><strong>Accuracy:</strong> ${game.attempts ? Math.round((game.correctAnswers / game.attempts) * 100) : 0}%</p>
      <p><strong>Objective:</strong> ${escapeHtml(game.objective?.label || "None")}</p>
      <p><strong>Objective Result:</strong> ${
        objective.completed ? "Completed" : objective.failed ? "Failed" : "Inconclusive"
      }</p>
      <p><strong>Campaign:</strong> Lv.${artilleryCampaign.level} | XP ${artilleryCampaign.xp}</p>
      <p><strong>XP Gained:</strong> +${game.xpGained || 0}</p>
      <p><strong>Time:</strong> ${formatDuration(elapsedSec)}</p>
      <p><strong>Score:</strong> ${score}</p>
    </div>
    <button id="quiz-restart-btn" type="button" style="margin-top:12px;">Deploy Again</button>
  `;
  refs.quizArea.querySelector("#quiz-restart-btn").addEventListener("click", () => {
    startArtilleryQuiz();
  });
}
function capitalize(value) {
  const text = String(value || "");
  return text ? text[0].toUpperCase() + text.slice(1) : "";
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function resetQuiz() {
  ui.quiz.deck = [];
  ui.quiz.currentIndex = 0;
  ui.quiz.score = 0;
  ui.quiz.currentCorrect = "";
  ui.quiz.currentOptions = [];
  ui.quiz.answered = false;
  ui.quiz.game = {
    tiles: [],
    firstIndex: -1,
    secondIndex: -1,
    matchedPairs: 0,
    attempts: 0,
    locked: false,
    pairTotal: 0,
    startTime: 0,
    endTime: 0,
  };
  ui.quiz.artillery = {
    words: [],
    questionIndex: 0,
    phaseKey: "deployment",
    conditionKey: "clear",
    enemyMorale: 100,
    playerMorale: 100,
    enemyCohesion: 100,
    playerCohesion: 100,
    streak: 0,
    attempts: 0,
    correctAnswers: 0,
    distance: "far",
    objective: {
      type: "break",
      label: "Break enemy morale before your battery collapses.",
      target: 1,
      turnLimit: 999,
      progress: 0,
      completed: false,
      failed: false,
    },
    stats: {
      shellHits: 0,
      roundHits: 0,
      canisterHits: 0,
    },
    ammo: {
      round: 0,
      shell: 0,
      canister: 0,
    },
    strategy: {
      stance: "balanced",
    },
    currentQuestion: null,
    awaitingShot: false,
    resolving: false,
    fx: {
      playerPose: "idle",
      enemyPose: "idle",
      shotType: "",
      showProjectile: false,
      showImpact: false,
      enemyShotType: "",
      showEnemyProjectile: false,
      showEnemyImpact: false,
    },
    log: [],
    battleEnded: false,
    victoryReason: "",
    defeatReason: "",
    progressApplied: false,
    startTime: 0,
    endTime: 0,
  };
}

function refreshAll() {
  applyStaticI18n();
  renderLists();
  renderHistory();
  refreshListSelectors();
  renderFlashcards();
  renderQuizSetupHint();
  renderSearchResults();
  if (ui.activeView === "fortress") {
    mountFortressUi();
    drawFortressScene();
    updateFortressHud();
  }
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
