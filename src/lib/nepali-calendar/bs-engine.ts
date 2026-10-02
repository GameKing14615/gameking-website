export const bsMonths = [
  "बैशाख (Baisakh)", "जेठ (Jestha)", "असार (Asadh)", "साउन (Shrawan)", 
  "भदौ (Bhadra)", "असोज (Ashwin)", "कार्तिक (Kartik)", "मंसिर (Mangsir)", 
  "पौष (Poush)", "माघ (Magh)", "फाल्गुण (Falgun)", "चैत्र (Chaitra)"
];

export const bsMonthLengths: Record<number, number[]> = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
};

export const bsYearStarts: Record<number, string> = {
  2080: "2023-04-14",
  2081: "2024-04-13",
  2082: "2025-04-14",
  2083: "2026-04-14",
  2084: "2027-04-14",
  2085: "2028-04-13",
  2086: "2029-04-13"
};

export const dateFromIso = (isoDate: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? date : null;
};

export const dateToIso = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const bsYearData = Object.fromEntries(Object.entries(bsMonthLengths).map(([yearStr, monthLengths]) => {
  const year = Number(yearStr);
  const monthStarts = [bsYearStarts[year]];
  for (let month = 1; month < 12; month += 1) {
    const previous = dateFromIso(monthStarts[month - 1]);
    if (previous) {
      previous.setUTCDate(previous.getUTCDate() + monthLengths[month - 1]);
      monthStarts.push(dateToIso(previous));
    }
  }
  return [year, { monthStarts, monthLengths }];
}));

export const nepaliDigits = (value: string | number) => String(value).replace(/\d/g, (digit) => "०१२३४५६७८९"[Number(digit)]);

export function getBsYearData(year: number) {
  return bsYearData[year] || null;
}

export function gregorianToBs(isoDate: string) {
  for (const yearStr of Object.keys(bsYearData)) {
    const year = Number(yearStr);
    const data = getBsYearData(year);
    if (!data) continue;
    
    for (let month = 0; month < data.monthStarts.length; month += 1) {
      const start = data.monthStarts[month];
      const nextStart = month === 11 ? bsYearStarts[year + 1] : data.monthStarts[month + 1];
      if (!nextStart) continue;
      
      if (isoDate >= start && isoDate < nextStart) {
        const date = dateFromIso(isoDate);
        const startDate = dateFromIso(start);
        if (!date || !startDate) continue;
        const offset = Math.round((date.getTime() - startDate.getTime()) / 86400000);
        return { year, month, day: offset + 1 };
      }
    }
  }
  return null;
}

export function bsToGregorian(year: number, month: number, day: number) {
  const data = getBsYearData(year);
  if (!data || month < 0 || month > 11 || day < 1 || day > data.monthLengths[month]) return null;
  const startDate = dateFromIso(data.monthStarts[month]);
  if (!startDate) return null;
  startDate.setUTCDate(startDate.getUTCDate() + day - 1);
  return startDate;
}

// Convert Date to Kathmandu ISO Date (YYYY-MM-DD)
export function kathmanduIsoDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).reduce((result: Record<string, string>, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
