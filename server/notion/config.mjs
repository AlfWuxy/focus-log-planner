export const NOTION_API_VERSION = "2026-03-11";

export class NotionConfigurationError extends Error {
  constructor(missingVariables) {
    super("Notion read-only integration is not configured.");
    this.name = "NotionConfigurationError";
    this.code = "NOTION_NOT_CONFIGURED";
    this.status = 503;
    this.missingVariables = missingVariables;
  }
}

const DAILY_FIELD_DEFAULTS = Object.freeze({
  title: "Day",
  date: "Date",
  bigThree: "Big 3",
  focusHours: "Focus Hours",
  result: "Result",
  unfinished: "Unfinished?",
  reason: "Reason",
  nextAction: "Next Action",
  focus: "Focus",
  plan: "Plan",
  progress: "Progress",
  reflection: "Reflection",
  status: "Status",
  tags: "Tags",
  url: "URL",
});

const NOTES_FIELD_DEFAULTS = Object.freeze({
  title: "Name",
  date: "日期",
  content: "Content",
  status: "Status",
  tags: "Tags",
  url: "URL",
});

function envText(env, key, fallback = "") {
  const value = env[key];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function buildFieldMap(env, prefix, defaults) {
  return Object.fromEntries(
    Object.entries(defaults).map(([normalizedName, defaultPropertyName]) => {
      const environmentName = normalizedName
        .replace(/([a-z\d])([A-Z])/g, "$1_$2")
        .toUpperCase();
      const variableName = `${prefix}_${environmentName}_FIELD`;
      return [normalizedName, envText(env, variableName, defaultPropertyName)];
    }),
  );
}

export function getNotionConfig(env = process.env) {
  const token = envText(env, "NOTION_TOKEN");
  const dailyDataSourceId = envText(env, "NOTION_DAILY_DATA_SOURCE_ID");
  const notesDataSourceId = envText(env, "NOTION_NOTES_DATA_SOURCE_ID");

  const missingVariables = [];
  if (!token) missingVariables.push("NOTION_TOKEN");
  if (!dailyDataSourceId) missingVariables.push("NOTION_DAILY_DATA_SOURCE_ID");
  if (!notesDataSourceId) missingVariables.push("NOTION_NOTES_DATA_SOURCE_ID");

  if (missingVariables.length > 0) {
    throw new NotionConfigurationError(missingVariables);
  }

  return Object.freeze({
    token,
    daily: Object.freeze({
      dataSourceId: dailyDataSourceId,
      fields: Object.freeze(buildFieldMap(env, "NOTION_DAILY", DAILY_FIELD_DEFAULTS)),
    }),
    notes: Object.freeze({
      dataSourceId: notesDataSourceId,
      fields: Object.freeze(buildFieldMap(env, "NOTION_NOTES", NOTES_FIELD_DEFAULTS)),
    }),
  });
}
