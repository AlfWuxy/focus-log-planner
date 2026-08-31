export interface NotionDailyEntry {
  id: string;
  title: string;
  date: string;
  url: string | null;
  bigThree: string;
  focusHours: number | null;
  result: string;
  unfinished: boolean | null;
  reason: string;
  nextAction: string;
  // 兼容旧版适配器，方便已有本地配置平滑升级。
  focus: string;
  plan: string;
  progress: string;
  reflection: string;
  status: string;
  tags: string[];
}

export interface NotionNoteEntry {
  id: string;
  title: string;
  date: string;
  content: string;
  status: string;
  tags: string[];
  url: string | null;
}

export interface NotionFocusLogResponse {
  date: string;
  source: "notion";
  daily: NotionDailyEntry[];
  notes: NotionNoteEntry[];
  meta: {
    dailyCount: number;
    notesCount: number;
  };
}

export const LOCAL_ACCESS_TOKEN_KEY = "focus-log:local-access-token:v1";
const MIN_LOCAL_TOKEN_LENGTH = 32;
const LOCAL_FRONTEND_ORIGIN = "http://127.0.0.1:5173";

interface SessionStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const getBrowserSessionStorage = (): SessionStorageLike | undefined => {
  try {
    return typeof window === "undefined" ? undefined : window.sessionStorage;
  } catch {
    return undefined;
  }
};

export const isLoopbackNotionOrigin = (
  locationValue: Pick<Location, "origin"> = window.location,
): boolean => locationValue.origin === LOCAL_FRONTEND_ORIGIN;

export const isValidLocalAccessToken = (value: string): boolean => (
  value.trim().length >= MIN_LOCAL_TOKEN_LENGTH
);

export const loadLocalAccessToken = (
  storage: Pick<SessionStorageLike, "getItem"> | undefined = getBrowserSessionStorage(),
): string => {
  if (!storage) return "";
  try {
    return storage.getItem(LOCAL_ACCESS_TOKEN_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
};

export const saveLocalAccessToken = (
  value: string,
  storage: Pick<SessionStorageLike, "setItem"> | undefined = getBrowserSessionStorage(),
): string => {
  const token = value.trim();
  if (!storage || !isValidLocalAccessToken(token)) return "";
  try {
    storage.setItem(LOCAL_ACCESS_TOKEN_KEY, token);
    return token;
  } catch {
    return "";
  }
};

export const clearLocalAccessToken = (
  storage: Pick<SessionStorageLike, "removeItem"> | undefined = getBrowserSessionStorage(),
): void => {
  try {
    storage?.removeItem(LOCAL_ACCESS_TOKEN_KEY);
  } catch {
    // 受限浏览器环境会自动在标签页结束时丢弃这类临时状态。
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asText = (value: unknown): string => typeof value === "string" ? value : "";

const asStringList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

const asNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (/^(?:true|yes|1)$/i.test(value.trim())) return true;
    if (/^(?:false|no|0)$/i.test(value.trim())) return false;
  }
  return null;
};

const normalizeDaily = (value: unknown): NotionDailyEntry | null => {
  if (!isRecord(value)) return null;

  return {
    id: asText(value.id),
    title: asText(value.title),
    date: asText(value.date),
    url: typeof value.url === "string" ? value.url : null,
    bigThree: asText(value.bigThree),
    focusHours: asNumber(value.focusHours),
    result: asText(value.result),
    unfinished: asBoolean(value.unfinished),
    reason: asText(value.reason),
    nextAction: asText(value.nextAction),
    focus: asText(value.focus),
    plan: asText(value.plan),
    progress: asText(value.progress),
    reflection: asText(value.reflection),
    status: asText(value.status),
    tags: asStringList(value.tags),
  };
};

const normalizeNote = (value: unknown): NotionNoteEntry | null => {
  if (!isRecord(value)) return null;

  return {
    id: asText(value.id),
    title: asText(value.title),
    date: asText(value.date),
    content: asText(value.content),
    status: asText(value.status),
    tags: asStringList(value.tags),
    url: typeof value.url === "string" ? value.url : null,
  };
};

export const parseNotionBigThree = (value: string): string[] => {
  const separated = value
    .replace(/\r/g, "")
    .replace(/\s*[①②③❶❷❸]\s*/g, "\n")
    .trim();

  if (!separated) return [];

  const lines = separated.includes("\n")
    ? separated.split("\n")
    : separated.split(/\s*[;；]\s*/);

  return lines
    .map((line) => line.replace(/^\s*(?:[-*•]|\d{1,2}[.)、:：])\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
};

export const parseNotionReasons = (value: string): string[] =>
  value
    .split(/[\n,，;；、]+/)
    .map((reason) => reason.replace(/^\s*(?:[-*•]|\d{1,2}[.)、:：])\s*/, "").trim())
    .filter(Boolean);

const readErrorMessage = (body: string, status: number): string => {
  if (!body) return `Notion request failed (${status})`;

  try {
    const parsed: unknown = JSON.parse(body);
    if (isRecord(parsed)) {
      const nestedError = isRecord(parsed.error) ? parsed.error : null;
      const message = asText(parsed.message) || asText(parsed.error) || asText(nestedError?.message);
      if (message) return message.slice(0, 240);
    }
  } catch {
    // 非 JSON 错误只显示有限长度，避免把意外的上游正文带入界面。
  }

  return body.slice(0, 240);
};

export const fetchNotionFocusLog = async (
  date: string,
  signal?: AbortSignal,
  localAccessToken = loadLocalAccessToken(),
): Promise<NotionFocusLogResponse> => {
  if (!isLoopbackNotionOrigin()) {
    throw new Error("Notion connection is available only from the local Focus Log setup.");
  }

  const token = localAccessToken.trim();
  if (!isValidLocalAccessToken(token)) {
    throw new Error("Enter the local access key from your .env.local file.");
  }

  const response = await fetch(
    `/api/notion/focus-log?date=${encodeURIComponent(date)}`,
    {
      signal,
      headers: {
        Accept: "application/json",
        "X-Focus-Log-Token": token,
      },
    },
  );

  if (!response.ok) {
    if (response.status === 401) clearLocalAccessToken();
    const detail = await response.text().catch(() => "");
    throw new Error(readErrorMessage(detail, response.status));
  }

  const payload: unknown = await response.json();
  if (
    !isRecord(payload) ||
    payload.source !== "notion" ||
    !Array.isArray(payload.daily) ||
    !Array.isArray(payload.notes)
  ) {
    throw new Error("The Notion response did not match the expected format.");
  }

  const daily = payload.daily
    .map(normalizeDaily)
    .filter((entry): entry is NotionDailyEntry => entry !== null);
  const notes = payload.notes
    .map(normalizeNote)
    .filter((entry): entry is NotionNoteEntry => entry !== null);
  const meta = isRecord(payload.meta) ? payload.meta : {};

  return {
    date: asText(payload.date),
    source: "notion",
    daily,
    notes,
    meta: {
      dailyCount: asNumber(meta.dailyCount) ?? daily.length,
      notesCount: asNumber(meta.notesCount) ?? notes.length,
    },
  };
};
