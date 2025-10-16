import dayjs from "dayjs";

/** Returns ['2025-10-02', '2025-10-03', ..., '2025-10-16'] inclusive */
export function makeDayRange(fromIso, toIso) {
  const start = dayjs(fromIso).startOf("day");
  const end = dayjs(toIso).startOf("day");
  const days = [];
  for (let d = start; d.isBefore(end) || d.isSame(end); d = d.add(1, "day")) {
    days.push(d.format("YYYY-MM-DD"));
  }
  return days;
}

/** Safe getters for mixed-case fields coming from API */
export function getRating(x) {
  return Number(x?.rating ?? x?.Rating ?? 0) || 0;
}
export function getPromptId(x) {
  return String(x?.promptId ?? x?.PromptId ?? "");
}
export function getPromptName(x) {
  return String(x?.promptName ?? x?.PromptName ?? "");
}
export function getCreatedUtc(x) {
  return String(x?.createdUtc ?? x?.created ?? x?.CreatedUtc ?? "");
}

/**
 * Aggregate into:
 *  {
 *    [promptId]: {
 *       promptId,
 *       promptName,
 *       totals: { count, avg },
 *       days: [{ day, count, avg }]
 *    }
 *  }
 */
export function aggregateByPrompt(items, dayKeys) {
  // seed structure per prompt per day
  const byPrompt = new Map();

  // ensure every prompt/day has default record
  const ensurePrompt = (pid, pname) => {
    if (!byPrompt.has(pid)) {
      byPrompt.set(pid, {
        promptId: pid,
        promptName: pname || "(Unknown Prompt)",
        dayAgg: new Map(dayKeys.map((d) => [d, { sum: 0, cnt: 0 }])),
      });
    }
    return byPrompt.get(pid);
  };

  for (const it of items) {
    const pid = getPromptId(it) || "unknown";
    const pname = getPromptName(it) || (pid === "unknown" ? "(Unknown Prompt)" : "");
    const created = getCreatedUtc(it);
    if (!created) continue;

    const day = dayjs(created).format("YYYY-MM-DD");
    if (!dayKeys.includes(day)) continue;

    const rating = getRating(it);
    const p = ensurePrompt(pid, pname);
    const rec = p.dayAgg.get(day);
    rec.sum += rating;
    rec.cnt += 1;
  }

  // finalize to output format
  const result = [];
  for (const [, val] of byPrompt) {
    let totalCnt = 0;
    let totalSum = 0;
    const days = dayKeys.map((day) => {
      const { sum, cnt } = val.dayAgg.get(day) || { sum: 0, cnt: 0 };
      totalCnt += cnt;
      totalSum += sum;
      return {
        day,
        count: cnt,
        avg: cnt ? sum / cnt : 0,
      };
    });

    result.push({
      promptId: val.promptId,
      promptName: val.promptName,
      totals: {
        count: totalCnt,
        avg: totalCnt ? totalSum / totalCnt : 0,
      },
      days,
    });
  }

  // sort by most recent activity (or total count desc)
  result.sort((a, b) => (b.totals.count || 0) - (a.totals.count || 0));
  return result;
}
