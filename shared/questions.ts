export type Topic =
  | "I/O 與中斷"
  | "記憶體階層"
  | "RAM / ROM"
  | "Cache 與虛擬記憶體"
  | "平行處理"
  | "電腦分類與網路"
  | "CPU-Z 判讀"
  | "綜合真題";

interface QuestionBase {
  id: string;
  level: number;
  topic: Topic;
  prompt: string;
  correctAnswer: string;
  acceptedAnswers?: string[];
  explanation: string;
  mnemonic: string;
  source: string;
  technicalNote?: string;
}

export interface ChoiceQuestion extends QuestionBase {
  kind: "choice";
  options: string[];
  shuffle?: boolean;
}

export interface ClassifyQuestion extends QuestionBase {
  kind: "classify";
  item: string;
  categories: string[];
}

export interface MatchQuestion extends QuestionBase {
  kind: "match";
  item: string;
  options: string[];
}

export interface OrderQuestion extends QuestionBase {
  kind: "order";
  items: string[];
}

export interface NumericQuestion extends QuestionBase {
  kind: "numeric";
  unit?: string;
  placeholder?: string;
}

export interface HotspotQuestion extends QuestionBase {
  kind: "hotspot";
  fieldLabel: string;
  unit?: string;
}

export type ScoredQuestion =
  | ChoiceQuestion
  | ClassifyQuestion
  | MatchQuestion
  | OrderQuestion
  | NumericQuestion
  | HotspotQuestion;

export interface GuidedResponse {
  id: string;
  level: 8;
  kind: "guided-response";
  prompt: string;
  placeholder: string;
  checklist: string[];
  example: string;
  source: string;
}

export const LEVEL_TITLES = [
  "I/O 緊急中心",
  "記憶體極速塔",
  "ROM 改造實驗室",
  "Cache 尋路戰",
  "Pipeline 危機",
  "系統派遣站",
  "CPU-Z 鑑識室",
  "最終魔王考",
] as const;

export const LEVEL_CODES = [
  "IRQ-01",
  "MEM-02",
  "ROM-03",
  "HIT-04",
  "PIPE-05",
  "SYS-06",
  "DIE-07",
  "BOSS-08",
] as const;

const q = <T extends ScoredQuestion>(question: T): T => question;

export const SCORED_QUESTIONS: ScoredQuestion[] = [
  q({
    id: "l1-01",
    level: 1,
    topic: "I/O 與中斷",
    kind: "classify",
    item: "CPU 不斷詢問鍵盤：有資料了嗎？",
    prompt: "把事件送進正確的 I/O 通道。",
    categories: ["Polling", "Interrupt", "DMA"],
    correctAnswer: "Polling",
    explanation: "輪詢式 I/O 由 CPU 主動、反覆檢查裝置狀態，因此最耗 CPU 時間。",
    mnemonic: "CPU 問設備 = Polling",
    source: "懶人包 §1；考卷單選 3",
  }),
  q({
    id: "l1-02",
    level: 1,
    topic: "I/O 與中斷",
    kind: "classify",
    item: "網路卡有封包時主動通知 CPU。",
    prompt: "把事件送進正確的 I/O 通道。",
    categories: ["Polling", "Interrupt", "DMA"],
    correctAnswer: "Interrupt",
    explanation: "中斷式 I/O 是裝置通知 CPU，CPU 暫停主程式並執行中斷服務程式。",
    mnemonic: "設備叫 CPU = Interrupt",
    source: "懶人包 §1；考卷單選 1",
  }),
  q({
    id: "l1-03",
    level: 1,
    topic: "I/O 與中斷",
    kind: "classify",
    item: "大量磁碟資料直接搬進主記憶體。",
    prompt: "把事件送進正確的 I/O 通道。",
    categories: ["Polling", "Interrupt", "DMA"],
    correctAnswer: "DMA",
    explanation: "DMA 控制器負責 I/O 與記憶體間的大量傳輸，CPU 不必逐筆搬資料。",
    mnemonic: "設備直接搬 = DMA",
    source: "懶人包 §1；考卷單選 16",
    technicalNote: "DMA 的標準全名是 Direct Memory Access，不是考卷誤植的 Direct Access Memory。",
  }),
  q({
    id: "l1-04",
    level: 1,
    topic: "I/O 與中斷",
    kind: "choice",
    prompt: "中斷服務程式最後要用哪一個指令返回主程式？",
    options: ["EQU", "IRET", "ORG", "JUMP"],
    correctAnswer: "IRET",
    explanation: "IRET 會恢復中斷前保存的狀態並返回主程式。",
    mnemonic: "Interrupt RETurn = IRET",
    source: "懶人包 §1；考卷單選 13",
  }),
  q({
    id: "l1-05",
    level: 1,
    topic: "I/O 與中斷",
    kind: "choice",
    prompt: "嚴重到 CPU 不能選擇忽略的事件，最接近哪一類中斷？",
    options: ["可遮罩中斷", "不可遮罩中斷", "輪詢", "軟體迴圈"],
    correctAnswer: "不可遮罩中斷",
    explanation: "不可遮罩中斷通常對應不能延後或忽略的嚴重硬體事件。",
    mnemonic: "不能忽略 = 不可遮罩",
    source: "懶人包 §1；考卷單選 2、20",
  }),

  q({
    id: "l2-01",
    level: 2,
    topic: "記憶體階層",
    kind: "order",
    prompt: "由快到慢重排記憶體階層。",
    items: ["暫存器", "Cache", "RAM", "HDD", "光碟"],
    correctAnswer: "暫存器|Cache|RAM|HDD|光碟",
    explanation: "越靠近 CPU、容量越小的儲存層通常速度越快。",
    mnemonic: "暫、快、隨、硬、光",
    source: "懶人包 §2；考卷單選 5、6",
  }),
  q({
    id: "l2-02",
    level: 2,
    topic: "記憶體階層",
    kind: "choice",
    prompt: "ALU 要取資料時，下列哪個儲存單元最快？",
    options: ["暫存器", "Cache", "主記憶體", "硬碟"],
    correctAnswer: "暫存器",
    explanation: "暫存器位於 CPU 內部，速度比 Cache、RAM 與外部儲存裝置快。",
    mnemonic: "CPU 內部最快 = 暫存器",
    source: "懶人包 §2；考卷單選 5",
  }),
  q({
    id: "l2-03",
    level: 2,
    topic: "記憶體階層",
    kind: "numeric",
    prompt: "800 × 600 的畫面共有多少像素？",
    correctAnswer: "480000",
    acceptedAnswers: ["480000", "480,000"],
    explanation: "800 × 600 = 480,000 個像素。",
    mnemonic: "先算像素數，再乘每像素位元",
    source: "考卷單選 7",
    unit: "pixels",
    placeholder: "800 × 600",
  }),
  q({
    id: "l2-04",
    level: 2,
    topic: "記憶體階層",
    kind: "numeric",
    prompt: "真實色 24 bit 等於每像素多少 bytes？",
    correctAnswer: "3",
    acceptedAnswers: ["3", "3bytes", "3byte"],
    explanation: "8 bit = 1 byte，所以 24 bit ÷ 8 = 3 bytes。",
    mnemonic: "位元除以 8 = 位元組",
    source: "考卷單選 7",
    unit: "bytes",
    placeholder: "24 ÷ 8",
    technicalNote: "原題的「224 色」應為 2^24 色，也就是 24-bit true color。",
  }),
  q({
    id: "l2-05",
    level: 2,
    topic: "記憶體階層",
    kind: "choice",
    prompt: "800 × 600、24-bit 畫面至少要配置多少顯示記憶體？",
    options: ["1 MB", "2 MB", "3 MB", "4 MB"],
    correctAnswer: "2 MB",
    explanation: "480,000 × 3 = 1,440,000 bytes，超過 1 MB，因此選 2 MB。",
    mnemonic: "算出需求後向上選容量",
    source: "考卷單選 7",
  }),

  q({
    id: "l3-01",
    level: 3,
    topic: "RAM / ROM",
    kind: "match",
    item: "RAM / ROM",
    prompt: "配對正確的記憶體特性。",
    options: ["RAM 揮發、ROM 非揮發", "RAM 非揮發、ROM 揮發", "兩者都揮發", "兩者都非揮發"],
    correctAnswer: "RAM 揮發、ROM 非揮發",
    explanation: "RAM 斷電資料消失；ROM 可在斷電後保留韌體等資料。",
    mnemonic: "RAM 斷電忘，ROM 斷電記得",
    source: "懶人包 §3；考卷填空 4–7",
  }),
  q({
    id: "l3-02",
    level: 3,
    topic: "RAM / ROM",
    kind: "match",
    item: "PROM",
    prompt: "配對正確的記憶體特性。",
    options: ["只能燒錄一次", "紫外線清除", "電子方式清除", "常用於 SSD"],
    correctAnswer: "只能燒錄一次",
    explanation: "PROM 可由使用者寫入，但一般只能燒錄一次。",
    mnemonic: "PROM = Program Once",
    source: "懶人包 §4",
  }),
  q({
    id: "l3-03",
    level: 3,
    topic: "RAM / ROM",
    kind: "match",
    item: "EPROM",
    prompt: "配對正確的記憶體特性。",
    options: ["只能燒錄一次", "紫外線清除", "電子方式清除", "斷電消失"],
    correctAnswer: "紫外線清除",
    explanation: "EPROM 晶片透過紫外線照射清除資料後可以重新燒錄。",
    mnemonic: "E-PROM 的 E 想成 Exposure",
    source: "懶人包 §4；考卷填空 2",
  }),
  q({
    id: "l3-04",
    level: 3,
    topic: "RAM / ROM",
    kind: "match",
    item: "EEPROM",
    prompt: "配對正確的記憶體特性。",
    options: ["只能燒錄一次", "紫外線清除", "高電壓／電子方式清除", "磁性清除"],
    correctAnswer: "高電壓／電子方式清除",
    explanation: "教材答案為施加高電壓；標準名稱則強調它可用電氣方式清除。",
    mnemonic: "多一個 E = Electrically Erasable",
    source: "懶人包 §4；考卷填空 3",
    technicalNote: "EEPROM 的標準全名為 Electrically Erasable Programmable ROM。",
  }),
  q({
    id: "l3-05",
    level: 3,
    topic: "RAM / ROM",
    kind: "match",
    item: "Flash",
    prompt: "配對正確的記憶體應用。",
    options: ["SSD／隨身碟／記憶卡", "CPU 暫存器", "光碟片", "磁帶"],
    correctAnswer: "SSD／隨身碟／記憶卡",
    explanation: "Flash 適合大量、區塊式資料儲存，常見於 SSD、隨身碟與記憶卡。",
    mnemonic: "Flash = 現代固態儲存",
    source: "懶人包 §4",
  }),

  q({
    id: "l4-01",
    level: 4,
    topic: "Cache 與虛擬記憶體",
    kind: "choice",
    prompt: "Cache 的 Hit Ratio 應該如何才好？",
    options: ["愈高愈好", "愈低愈好", "固定最好", "完全不影響"],
    correctAnswer: "愈高愈好",
    explanation: "命中率越高，CPU 越常直接在 Cache 找到資料，等待 RAM 的時間越少。",
    mnemonic: "Hit 越多，等 RAM 越少",
    source: "懶人包 §5；考卷單選 15",
  }),
  q({
    id: "l4-02",
    level: 4,
    topic: "Cache 與虛擬記憶體",
    kind: "choice",
    prompt: "一般 Cache 階層中哪一層速度最快？",
    options: ["L1", "L2", "L3", "RAM"],
    correctAnswer: "L1",
    explanation: "L1 最靠近核心、容量通常最小，因此速度最快。",
    mnemonic: "數字越小越貼近核心",
    source: "懶人包 §5",
  }),
  q({
    id: "l4-03",
    level: 4,
    topic: "Cache 與虛擬記憶體",
    kind: "choice",
    prompt: "多核心處理器常由多個核心共同使用哪一層快取？",
    options: ["L1", "L2", "L3", "暫存器"],
    correctAnswer: "L3",
    explanation: "常見架構是各核心擁有 L1、L2，較大的 L3 由核心共享。",
    mnemonic: "L3 大，大家用",
    source: "懶人包 §5；考卷單選 10",
  }),
  q({
    id: "l4-04",
    level: 4,
    topic: "Cache 與虛擬記憶體",
    kind: "choice",
    prompt: "主記憶體只有 640 KB，卻能執行 2 MB 程式，最可能用了什麼？",
    options: ["Cache", "虛擬記憶體", "ROM", "關聯記憶體"],
    correctAnswer: "虛擬記憶體",
    explanation: "虛擬記憶體會利用硬碟空間暫時模擬 RAM，讓較大的程式得以執行。",
    mnemonic: "硬碟假裝 RAM",
    source: "懶人包 §6；考卷單選 14",
  }),
  q({
    id: "l4-05",
    level: 4,
    topic: "Cache 與虛擬記憶體",
    kind: "choice",
    prompt: "下列哪種多核心快取配置通常效能最好？",
    options: ["專用 L1、外部共用 L2", "專用 L1 與 L2", "專用 L1、內部共用 L2", "專用 L1/L2、內部共用 L3"],
    correctAnswer: "專用 L1/L2、內部共用 L3",
    explanation: "核心可快速使用自己的 L1/L2，同時透過共享 L3 交換較大量資料。",
    mnemonic: "小快取專用，大快取共享",
    source: "考卷單選 10",
  }),

  q({
    id: "l5-01",
    level: 5,
    topic: "平行處理",
    kind: "classify",
    item: "多核心",
    prompt: "判斷是否屬於平行處理。",
    categories: ["屬於平行處理", "不屬於平行處理"],
    correctAnswer: "屬於平行處理",
    explanation: "多個核心可同時執行不同工作，屬於平行處理。",
    mnemonic: "多核心 = 多工並行",
    source: "懶人包 §7；考卷單選 9",
  }),
  q({
    id: "l5-02",
    level: 5,
    topic: "平行處理",
    kind: "classify",
    item: "多處理機",
    prompt: "判斷是否屬於平行處理。",
    categories: ["屬於平行處理", "不屬於平行處理"],
    correctAnswer: "屬於平行處理",
    explanation: "多個處理器能同時分擔運算，因此屬於平行處理。",
    mnemonic: "多處理機 = 多顆一起算",
    source: "懶人包 §7；考卷單選 9",
  }),
  q({
    id: "l5-03",
    level: 5,
    topic: "平行處理",
    kind: "classify",
    item: "指令管線 Pipeline",
    prompt: "判斷是否屬於平行處理。",
    categories: ["屬於平行處理", "不屬於平行處理"],
    correctAnswer: "屬於平行處理",
    explanation: "管線把指令拆成階段，讓多條指令的不同階段重疊執行。",
    mnemonic: "像工廠輸送帶，階段同時忙",
    source: "懶人包 §7；考卷單選 9、11",
  }),
  q({
    id: "l5-04",
    level: 5,
    topic: "平行處理",
    kind: "classify",
    item: "權重處理",
    prompt: "判斷是否屬於平行處理。",
    categories: ["屬於平行處理", "不屬於平行處理"],
    correctAnswer: "不屬於平行處理",
    explanation: "教材列出的平行處理類型是多核心、多處理機與指令管線，不包含權重處理。",
    mnemonic: "看到權重，選不屬於",
    source: "懶人包 §7；考卷單選 9",
  }),
  q({
    id: "l5-05",
    level: 5,
    topic: "平行處理",
    kind: "choice",
    prompt: "跳躍指令對指令管線通常有什麼影響？",
    options: ["提高效率", "降低效率", "完全無影響", "只有多核心才有影響"],
    correctAnswer: "降低效率",
    explanation: "跳躍會讓 CPU 難以確定接下來要取哪條指令，可能需要清空或重填管線。",
    mnemonic: "一跳躍，輸送帶就要重排",
    source: "懶人包 §7；考卷單選 11",
  }),

  q({
    id: "l6-01",
    level: 6,
    topic: "電腦分類與網路",
    kind: "classify",
    item: "氣象預測與太空科學研發",
    prompt: "派遣到正確的系統類型。",
    categories: ["超級電腦", "微電腦", "嵌入式電腦", "Server", "Client", "Print Server"],
    correctAnswer: "超級電腦",
    explanation: "氣象與太空科學需要大量高速運算，適合使用超級電腦。",
    mnemonic: "氣象／太空 = 超級電腦",
    source: "懶人包 §8；考卷單選 17",
  }),
  q({
    id: "l6-02",
    level: 6,
    topic: "電腦分類與網路",
    kind: "classify",
    item: "PDA 個人數位助理",
    prompt: "派遣到正確的系統類型。",
    categories: ["超級電腦", "微電腦", "嵌入式電腦", "Server", "Client", "Print Server"],
    correctAnswer: "微電腦",
    explanation: "PDA 屬於供個人使用的小型運算裝置，因此分類為微電腦。",
    mnemonic: "PDA = 微電腦",
    source: "懶人包 §8；考卷單選 18",
  }),
  q({
    id: "l6-03",
    level: 6,
    topic: "電腦分類與網路",
    kind: "classify",
    item: "微波爐內的控制系統",
    prompt: "派遣到正確的系統類型。",
    categories: ["超級電腦", "微電腦", "嵌入式電腦", "Server", "Client", "Print Server"],
    correctAnswer: "嵌入式電腦",
    explanation: "專門嵌入家電並執行特定控制工作的電腦屬於嵌入式系統。",
    mnemonic: "手機／家電控制 = 嵌入式",
    source: "懶人包 §8；考卷單選 12",
  }),
  q({
    id: "l6-04",
    level: 6,
    topic: "電腦分類與網路",
    kind: "classify",
    item: "提供線上遊戲服務的主機",
    prompt: "派遣到正確的網路角色。",
    categories: ["Server", "Client", "Print Server", "P2P"],
    correctAnswer: "Server",
    explanation: "提供遊戲狀態與連線服務的主機是 Server，玩家電腦則是 Client。",
    mnemonic: "提供服務 = Server",
    source: "懶人包 §9；考卷單選 19",
  }),
  q({
    id: "l6-05",
    level: 6,
    topic: "電腦分類與網路",
    kind: "classify",
    item: "專門接受列印工作並控制印表機",
    prompt: "派遣到正確的網路角色。",
    categories: ["Server", "Client", "Print Server", "P2P"],
    correctAnswer: "Print Server",
    explanation: "Print Server 集中接受用戶端列印需求並提供列印服務。",
    mnemonic: "提供列印 = Print Server",
    source: "懶人包 §9；考卷單選 19",
  }),

  q({
    id: "l7-01",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "P-core 數量",
    prompt: "查看 CPU-Z 底部的核心欄位。",
    correctAnswer: "8",
    acceptedAnswers: ["8", "8p"],
    explanation: "畫面標示 8P + 4E，所以效能核心為 8 個。",
    mnemonic: "加號前面是 P-core",
    source: "Intel Core i7-12700K CPU-Z 圖",
    unit: "cores",
  }),
  q({
    id: "l7-02",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "E-core 數量",
    prompt: "查看 CPU-Z 底部的核心欄位。",
    correctAnswer: "4",
    acceptedAnswers: ["4", "4e"],
    explanation: "畫面標示 8P + 4E，所以效率核心為 4 個。",
    mnemonic: "加號後面是 E-core",
    source: "Intel Core i7-12700K CPU-Z 圖",
    unit: "cores",
  }),
  q({
    id: "l7-03",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "執行緒數",
    prompt: "查看 CPU-Z 右下角的執行緒欄位。",
    correctAnswer: "20",
    explanation: "CPU-Z 右下角直接標示執行緒為 20。",
    mnemonic: "核心數不等於執行緒數",
    source: "Intel Core i7-12700K CPU-Z 圖",
    unit: "threads",
  }),
  q({
    id: "l7-04",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "快取層數",
    prompt: "數出 L1、L2、L3 共幾層。",
    correctAnswer: "3",
    explanation: "快取欄位包含 L1、L2、L3 三層。",
    mnemonic: "看到 L1/L2/L3 = 三層",
    source: "Intel Core i7-12700K CPU-Z 圖",
    unit: "levels",
  }),
  q({
    id: "l7-05",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "P-core L1 指令快取總容量",
    prompt: "讀取 L1 指令列加號前的 8 × 32 KB 並算總量。",
    correctAnswer: "256",
    acceptedAnswers: ["256", "256kb"],
    explanation: "P-core 的 L1 指令快取是 8 × 32 KB，所以總容量為 256 KB。",
    mnemonic: "先看每核心，再乘核心數",
    source: "Intel Core i7-12700K CPU-Z 圖",
    technicalNote: "32 KB 是每顆 P-core 的 L1 指令快取；題目問總容量時要乘上 8 顆 P-core。",
    unit: "KB",
  }),
  q({
    id: "l7-06",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "P-core L2 總容量",
    prompt: "讀取 L2 快取列加號前的 8 × 1.25 MB 並算總量。",
    correctAnswer: "10",
    acceptedAnswers: ["10", "10mb"],
    explanation: "P-core 的 L2 快取是 8 × 1.25 MB，所以總容量為 10 MB。",
    mnemonic: "P-core 看加號前",
    source: "Intel Core i7-12700K CPU-Z 圖",
    technicalNote: "加號後的 2 MB 屬於 E-core 叢集；本題只問 P-core，因此不相加。",
    unit: "MB",
  }),
  q({
    id: "l7-07",
    level: 7,
    topic: "CPU-Z 判讀",
    kind: "hotspot",
    fieldLabel: "L3 快取總容量",
    prompt: "讀取快取區最下方的 L3 容量。",
    correctAnswer: "25",
    acceptedAnswers: ["25", "25mb"],
    explanation: "CPU-Z 的 L3 快取欄位直接標示 25 MBytes。",
    mnemonic: "L3 看最下列，直接讀總量",
    source: "Intel Core i7-12700K CPU-Z 圖",
    unit: "MB",
  }),

  q({
    id: "l8-01",
    level: 8,
    topic: "綜合真題",
    kind: "choice",
    prompt: "I/O 埠通知 CPU 暫停原工作、處理完再返回，稱為哪種方式？",
    options: ["程式控制式 I/O", "中斷式 I/O", "DMA", "並列資料傳輸"],
    correctAnswer: "中斷式 I/O",
    explanation: "由裝置通知 CPU 並暫停主程式，正是中斷式 I/O。",
    mnemonic: "設備通知 CPU = Interrupt",
    source: "考卷單選 1",
    shuffle: true,
  }),
  q({
    id: "l8-04",
    level: 8,
    topic: "綜合真題",
    kind: "choice",
    prompt: "關於指令管線，哪一個敘述錯誤？",
    options: ["分解指令成階段重疊執行", "RISC 適合指令管線", "跳躍會降低管線效能", "只有多核心才能使用指令管線"],
    correctAnswer: "只有多核心才能使用指令管線",
    explanation: "單核心處理器也能使用指令管線；管線與多核心是不同層次的平行技術。",
    mnemonic: "管線不等於多核心",
    source: "考卷單選 11",
    shuffle: true,
  }),
  q({
    id: "l8-05",
    level: 8,
    topic: "綜合真題",
    kind: "choice",
    prompt: "手機、錄放影機、微波爐中的電腦屬於哪一類？",
    options: ["嵌入式電腦", "微電腦", "超級電腦", "大型電腦"],
    correctAnswer: "嵌入式電腦",
    explanation: "它們被嵌入產品內執行特定控制任務。",
    mnemonic: "家電控制 = 嵌入式",
    source: "考卷單選 12",
    shuffle: true,
  }),
  q({
    id: "l8-07",
    level: 8,
    topic: "綜合真題",
    kind: "choice",
    prompt: "關於 Client/Server 網路，哪個敘述錯誤？",
    options: ["遊戲伺服器與玩家可構成主從式網路", "每台電腦都同時是 Server 與 Client", "Print Server 提供列印服務", "至少一台電腦提供服務"],
    correctAnswer: "每台電腦都同時是 Server 與 Client",
    explanation: "每台都兼任兩種角色較接近 P2P，不是典型 Client/Server。",
    mnemonic: "每台都雙重角色 = P2P",
    source: "考卷單選 19",
    shuffle: true,
  }),
  q({
    id: "l8-08",
    level: 8,
    topic: "綜合真題",
    kind: "choice",
    prompt: "樂手嚴重失誤而停奏，若類比成 CPU 不能忽略的中斷，哪個敘述錯誤？",
    options: ["正常演奏像主程式", "突發失誤像硬體中斷", "即興救場像 ISR", "嚴重到停奏代表可遮罩中斷"],
    correctAnswer: "嚴重到停奏代表可遮罩中斷",
    explanation: "嚴重且不能忽略的事件應類比不可遮罩中斷，不是可遮罩中斷。",
    mnemonic: "嚴重不能忽略 = 不可遮罩",
    source: "考卷單選 20",
    shuffle: true,
  }),
  q({
    id: "l8-09",
    level: 8,
    topic: "綜合真題",
    kind: "numeric",
    prompt: "CPU 內部速度最快的記憶體稱為什麼？",
    correctAnswer: "暫存器",
    acceptedAnswers: ["暫存器", "register", "registers"],
    explanation: "暫存器位於 CPU 內部，供運算單元快速存取。",
    mnemonic: "CPU 內部最快 = 暫存器",
    source: "考卷填空 1",
    placeholder: "輸入名詞",
  }),
  q({
    id: "l8-10",
    level: 8,
    topic: "綜合真題",
    kind: "numeric",
    prompt: "EPROM 清除資料時需要哪一種照射？",
    correctAnswer: "紫外線",
    acceptedAnswers: ["紫外線", "uv", "ultraviolet"],
    explanation: "EPROM 的透明石英窗用來接受紫外線照射並清除資料。",
    mnemonic: "EPROM = 紫外線",
    source: "考卷填空 2",
    placeholder: "輸入清除方式",
  }),
  q({
    id: "l8-12",
    level: 8,
    topic: "綜合真題",
    kind: "numeric",
    prompt: "DMA 技術可降低哪個元件的工作負擔？",
    correctAnswer: "CPU",
    acceptedAnswers: ["cpu", "中央處理器", "中央處理單元"],
    explanation: "DMA 不需 CPU 逐筆搬動資料，因此能降低 CPU 工作負擔。",
    mnemonic: "DMA 幫 CPU 搬資料",
    source: "考卷填空 10",
    placeholder: "輸入元件",
  }),
];

export const GUIDED_RESPONSES: GuidedResponse[] = [
  {
    id: "g-01",
    level: 8,
    kind: "guided-response",
    prompt: "列出常見光碟分類。",
    placeholder: "至少寫出 4 種，例如 CD-ROM...",
    checklist: ["至少 4 種", "包含 CD 或 DVD", "使用完整名稱"],
    example: "CD-ROM、CD-R、CD-RW、DVD-ROM、DVD-R、DVD-RW、Blu-ray（BD）。",
    source: "懶人包 §11；考卷問答 1",
  },
];

export const QUESTION_BY_ID = new Map(SCORED_QUESTIONS.map((question) => [question.id, question]));

export const questionsForLevel = (level: number) =>
  SCORED_QUESTIONS.filter((question) => question.level === level);
