function richTextToString(items) {
  if (!Array.isArray(items)) return "";

  return items
    .map((item) => {
      if (typeof item?.plain_text === "string") return item.plain_text;
      if (typeof item?.text?.content === "string") return item.text.content;
      return "";
    })
    .join("");
}

function dateToPlainValue(date) {
  if (!date || typeof date !== "object" || typeof date.start !== "string") return null;
  return {
    start: date.start,
    end: typeof date.end === "string" ? date.end : null,
    timeZone: typeof date.time_zone === "string" ? date.time_zone : null,
  };
}

function formulaToPlainValue(formula) {
  if (!formula || typeof formula !== "object") return null;
  if (formula.type === "string") return typeof formula.string === "string" ? formula.string : null;
  if (formula.type === "number") return typeof formula.number === "number" ? formula.number : null;
  if (formula.type === "boolean") return typeof formula.boolean === "boolean" ? formula.boolean : null;
  if (formula.type === "date") return dateToPlainValue(formula.date);
  return null;
}

function rollupItemToPlainValue(item) {
  if (!item || typeof item !== "object") return null;
  if (typeof item.type === "string" && Object.hasOwn(item, item.type)) {
    return parseNotionProperty({ type: item.type, [item.type]: item[item.type] });
  }
  return null;
}

function rollupToPlainValue(rollup) {
  if (!rollup || typeof rollup !== "object") return null;
  if (rollup.type === "number") return typeof rollup.number === "number" ? rollup.number : null;
  if (rollup.type === "date") return dateToPlainValue(rollup.date);
  if (rollup.type === "array") {
    return Array.isArray(rollup.array) ? rollup.array.map(rollupItemToPlainValue) : [];
  }
  return null;
}

/**
 * 将 Notion 属性值转为可序列化的通用值。
 * 未知类型返回 null，避免把原始数据结构暴露给前端。
 */
export function parseNotionProperty(property) {
  if (!property || typeof property !== "object") return null;

  switch (property.type) {
    case "title":
      return richTextToString(property.title);
    case "rich_text":
      return richTextToString(property.rich_text);
    case "number":
      return typeof property.number === "number" ? property.number : null;
    case "checkbox":
      return typeof property.checkbox === "boolean" ? property.checkbox : false;
    case "select":
      return typeof property.select?.name === "string" ? property.select.name : null;
    case "status":
      return typeof property.status?.name === "string" ? property.status.name : null;
    case "multi_select":
      return Array.isArray(property.multi_select)
        ? property.multi_select.flatMap((option) =>
            typeof option?.name === "string" ? [option.name] : [],
          )
        : [];
    case "date":
      return dateToPlainValue(property.date);
    case "people":
      return Array.isArray(property.people)
        ? property.people.flatMap((person) => {
            if (typeof person?.name === "string") return [person.name];
            if (typeof person?.id === "string") return [person.id];
            return [];
          })
        : [];
    case "url":
      return typeof property.url === "string" ? property.url : null;
    case "email":
      return typeof property.email === "string" ? property.email : null;
    case "phone_number":
      return typeof property.phone_number === "string" ? property.phone_number : null;
    case "relation":
      return Array.isArray(property.relation)
        ? property.relation.flatMap((relation) =>
            typeof relation?.id === "string" ? [relation.id] : [],
          )
        : [];
    case "created_time":
      return typeof property.created_time === "string" ? property.created_time : null;
    case "last_edited_time":
      return typeof property.last_edited_time === "string" ? property.last_edited_time : null;
    case "formula":
      return formulaToPlainValue(property.formula);
    case "rollup":
      return rollupToPlainValue(property.rollup);
    case "unique_id": {
      const number = property.unique_id?.number;
      if (typeof number !== "number") return null;
      const prefix = typeof property.unique_id?.prefix === "string" ? property.unique_id.prefix : "";
      return `${prefix}${number}`;
    }
    default:
      return null;
  }
}

export function readProperty(properties, propertyName) {
  if (!properties || typeof properties !== "object" || !propertyName) return null;
  return parseNotionProperty(properties[propertyName]);
}

export function toText(value) {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(" · ");
  if (value && typeof value === "object" && typeof value.start === "string") return value.start;
  return "";
}

export function toTags(value) {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean);
  const text = toText(value);
  return text ? [text] : [];
}

export function toDateString(value, fallbackDate) {
  if (value && typeof value === "object" && typeof value.start === "string") {
    return value.start.slice(0, 10);
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  return fallbackDate;
}

/**
 * 只向前端暴露 Notion 官方 HTTPS 页面地址。
 */
export function sanitizeNotionUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isNotionHost = hostname === "notion.so" || hostname === "www.notion.so";
    if (url.protocol !== "https:" || !isNotionHost || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
