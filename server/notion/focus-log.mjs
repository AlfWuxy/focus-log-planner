import { getNotionConfig } from "./config.mjs";
import { queryDataSource } from "./client.mjs";
import {
  readProperty,
  sanitizeNotionUrl,
  toDateString,
  toTags,
  toText,
} from "./properties.mjs";

function pageProperties(page) {
  return page?.properties && typeof page.properties === "object" ? page.properties : {};
}

function toNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value) {
  if (typeof value === "boolean") return value;
  return typeof value === "string" && /^(?:true|yes|checked|1)$/i.test(value.trim());
}

function baseEntry(page, type, fields, fallbackDate) {
  const properties = pageProperties(page);
  const configuredUrl = readProperty(properties, fields.url);

  return {
    id: typeof page?.id === "string" ? page.id : "",
    type,
    title: toText(readProperty(properties, fields.title)),
    date: toDateString(readProperty(properties, fields.date), fallbackDate),
    status: toText(readProperty(properties, fields.status)),
    tags: toTags(readProperty(properties, fields.tags)),
    url: sanitizeNotionUrl(configuredUrl) ?? sanitizeNotionUrl(page?.url),
    createdTime: typeof page?.created_time === "string" ? page.created_time : "",
    lastEditedTime: typeof page?.last_edited_time === "string" ? page.last_edited_time : "",
  };
}

export function mapDailyPage(page, fields, fallbackDate) {
  const properties = pageProperties(page);
  const bigThree = toText(readProperty(properties, fields.bigThree));
  const focusHours = toNumber(readProperty(properties, fields.focusHours));
  const result = toText(readProperty(properties, fields.result));
  const unfinished = toBoolean(readProperty(properties, fields.unfinished));
  const reason = toText(readProperty(properties, fields.reason));
  const nextAction = toText(readProperty(properties, fields.nextAction));
  const legacyFocus = toText(readProperty(properties, fields.focus));
  const legacyPlan = toText(readProperty(properties, fields.plan));
  const legacyProgress = toText(readProperty(properties, fields.progress));
  const legacyReflection = toText(readProperty(properties, fields.reflection));
  const legacyStatus = toText(readProperty(properties, fields.status));

  return {
    ...baseEntry(page, "daily", fields, fallbackDate),
    bigThree,
    focusHours,
    result,
    unfinished,
    reason,
    nextAction,
    focus: legacyFocus || nextAction,
    plan: legacyPlan || bigThree,
    progress: legacyProgress || (focusHours === null ? "" : String(focusHours)),
    reflection: legacyReflection || result,
    status: legacyStatus || result,
  };
}

export function mapNotePage(page, fields, fallbackDate) {
  const properties = pageProperties(page);
  return {
    ...baseEntry(page, "note", fields, fallbackDate),
    content: toText(readProperty(properties, fields.content)),
  };
}

function newestFirst(left, right) {
  return right.lastEditedTime.localeCompare(left.lastEditedTime);
}

function upcomingFirst(left, right) {
  return left.date.localeCompare(right.date) || newestFirst(left, right);
}

export async function loadFocusLog(date, { env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = getNotionConfig(env);

  const [dailyPages, notePages] = await Promise.all([
    queryDataSource({
      dataSourceId: config.daily.dataSourceId,
      token: config.token,
      date,
      dateField: config.daily.fields.date,
      dateOperator: "equals",
      sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      maxResults: 1,
      fetchImpl,
    }),
    queryDataSource({
      dataSourceId: config.notes.dataSourceId,
      token: config.token,
      date,
      dateField: config.notes.fields.date,
      dateOperator: "on_or_after",
      sorts: [{ property: config.notes.fields.date, direction: "ascending" }],
      maxResults: 5,
      fetchImpl,
    }),
  ]);

  const daily = dailyPages.map((page) => mapDailyPage(page, config.daily.fields, date)).sort(newestFirst);
  const notes = notePages.map((page) => mapNotePage(page, config.notes.fields, date)).sort(upcomingFirst);

  return {
    date,
    source: "notion",
    daily,
    notes,
    meta: {
      dailyCount: daily.length,
      notesCount: notes.length,
    },
  };
}
