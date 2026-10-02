/* ==========================================================================
   Dashy by TNH — Main Application Script
   ==========================================================================
   SECTIONS (search for "// ---" to jump between sections):
     1. CONSTANTS & DATA          — staff defaults, BS calendar data, sales dummy data
     2. UTILITIES                 — escapeText, formatTime, formatTime12, ordinal, etc.
     3. THEME & UI                — applyTheme, showToast, updateNetworkStatus
     4. ATTENDANCE                — PIN handling, clock in/out, floor rendering
     5. NEPALI CALENDAR           — BS↔Gregorian conversion, calendar grid rendering
     6. SALES CHART               — renderSalesChart with dummy datasets
     7. ROSTER                    — grid rendering, editor, templates, drag-drop
     8. ADMIN & STAFF MANAGEMENT  — admin login, staff profiles CRUD
     9. NAVIGATION & ROUTING      — navigate(), hash routing
    10. EVENT LISTENERS            — click delegation, form submissions, drag events
    11. INITIALIZATION             — startup sequence
   ========================================================================== */

// --- 1. CONSTANTS & DATA ---
const pages = [...document.querySelectorAll("[data-view]")];
const links = [...document.querySelectorAll("[data-page]")];
const toast = document.querySelector("[data-toast]");
const staffKey = "dashy-staff-attendance-v3";
const attendanceLogKey = "dashy-attendance-log-v1";
const attendanceOverridesKey = "dashy-attendance-overrides-v1";
const attendanceQualificationKey = "dashy-attendance-qualification-v2";
const vendorColumnWidthsKey = "dashy-vendor-column-widths-v1";
const staffDefaults = [
  { id: 1, name: "Alex Johnson", role: "Front of house", pin: "1111", status: "Off Shift", lastPunch: "—", color: "orange-bg", icon: "☕", clockIn: "—" },
  { id: 2, name: "Sarah Chen", role: "Kitchen", pin: "2222", status: "Off Shift", lastPunch: "—", color: "gold-bg", icon: "♨", clockIn: "—" },
  { id: 3, name: "Marcus Vance", role: "Maintenance", pin: "3333", status: "Off Shift", lastPunch: "—", color: "purple-bg", icon: "⚒", clockIn: "—" },
  { id: 4, name: "Elena Rostova", role: "Manager", pin: "4444", status: "Off Shift", lastPunch: "—", color: "lime-bg", icon: "▣", clockIn: "—" }
];
const iconOptions = ["☕", "♨", "⚒", "▣", "★", "✿", "◆", "♟", "☀", "♫"];
const bsMonths = ["बैशाख (Baisakh)", "जेठ (Jestha)", "असार (Asadh)", "साउन (Shrawan)", "भदौ (Bhadra)", "असोज (Ashwin)", "कार्तिक (Kartik)", "मंसिर (Mangsir)", "पौष (Poush)", "माघ (Magh)", "फाल्गुण (Falgun)", "चैत्र (Chaitra)"];
const dateFromIso = (isoDate) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return date.getUTCFullYear() === Number(match[1]) && date.getUTCMonth() === Number(match[2]) - 1 && date.getUTCDate() === Number(match[3]) ? date : null;
};
const dateToIso = (date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
// BS month lengths are year-specific. These tables cover three years back
// and forward from 2083, with Baisakh 1 anchors verified against calendar data.
const bsMonthLengths = {
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2083: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2084: [31, 31, 32, 31, 31, 30, 30, 30, 29, 30, 30, 30],
  2085: [31, 32, 31, 32, 30, 31, 30, 30, 29, 30, 30, 30],
  2086: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
};
const bsYearStarts = {
  2080: "2023-04-14",
  2081: "2024-04-13",
  2082: "2025-04-14",
  2083: "2026-04-14",
  2084: "2027-04-14",
  2085: "2028-04-13",
  2086: "2029-04-13"
};
const bsYearData = Object.fromEntries(Object.entries(bsMonthLengths).map(([year, monthLengths]) => {
  const monthStarts = [bsYearStarts[year]];
  for (let month = 1; month < 12; month += 1) {
    const previous = dateFromIso(monthStarts[month - 1]);
    previous.setUTCDate(previous.getUTCDate() + monthLengths[month - 1]);
    monthStarts.push(dateToIso(previous));
  }

  return [year, { monthStarts, monthLengths }];
}));
function isValidBsYearData(data) {
  if (!data || data.monthStarts?.length !== 12 || data.monthLengths?.length !== 12) return false;
  return data.monthStarts.every((start, index) => {
    const startDate = dateFromIso(start);
    const nextDate = dateFromIso(data.monthStarts[index + 1]);
    const expectedDays = data.monthLengths[index];
    return startDate && Number.isInteger(expectedDays) && expectedDays > 0 &&
      (!nextDate || Math.round((nextDate - startDate) / 86400000) === expectedDays);
  });
}
const supportedBsYears = Object.keys(bsYearData).map(Number).filter((year) => isValidBsYearData(bsYearData[year]));
function getBsYearData(year) {
  return supportedBsYears.includes(year) ? bsYearData[year] : null;
}
const nepaliDigits = (value) => String(value).replace(/\d/g, (digit) => "०१२३४५६७८९"[digit]);
let staff = JSON.parse(localStorage.getItem(staffKey) || "null") || staffDefaults;
let attendanceLog = JSON.parse(localStorage.getItem(attendanceLogKey) || "[]");
let attendanceOverrides = JSON.parse(localStorage.getItem(attendanceOverridesKey) || "[]");
const legacyQualificationMinutes = Number(localStorage.getItem("dashy-attendance-qualification-minutes-v1"));
let attendanceQualification = JSON.parse(localStorage.getItem(attendanceQualificationKey) || "null");
if (!attendanceQualification || !["instant", "seconds", "minutes"].includes(attendanceQualification.unit) || !Number.isFinite(Number(attendanceQualification.value)) || Number(attendanceQualification.value) < 0) {
  attendanceQualification = {
    unit: Number.isFinite(legacyQualificationMinutes) && legacyQualificationMinutes >= 1 ? "minutes" : "minutes",
    value: Number.isFinite(legacyQualificationMinutes) && legacyQualificationMinutes >= 1 ? legacyQualificationMinutes : 1
  };
}
let vendorColumnWidths = JSON.parse(localStorage.getItem(vendorColumnWidthsKey) || "null") || [42, 120, 112, 1, 104, 104, 112, 100, 108];
let pinInput = "";
let activeStaffId = null;
let isAdmin = sessionStorage.getItem("dashy-admin") === "true";
let adminName = 'Admin';
const calendarAnchor = { year: 2083, month: 5, day: 8 };
const calendarTestDate = { year: 2083, month: 4, day: 7 };
const monthShortNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const kathmanduTimeZone = "Asia/Kathmandu";
function bsToGregorian(year, month, day) {
  const data = getBsYearData(year);
  if (!data || month < 0 || month > 11 || day < 1 || day > data.monthLengths[month]) return null;
  const offset = data.monthLengths.slice(0, month).reduce((sum, days) => sum + days, 0) + day - 1;
  const date = dateFromIso(data.monthStarts[0]);
  if (!date) return null;
  date.setUTCDate(date.getUTCDate() + offset);
  return date;
}
function gregorianToBs(isoDate) {
  for (const year of supportedBsYears) {
    const data = getBsYearData(year);
    for (let month = 0; month < data.monthStarts.length; month += 1) {
      const start = data.monthStarts[month];
      const nextStart = month === 11 ? bsYearStarts[year + 1] : data.monthStarts[month + 1];
      if (!nextStart) continue;
      if (isoDate >= start && isoDate < nextStart) {
        const date = dateFromIso(isoDate);
        const startDate = dateFromIso(start);
        if (!date || !startDate) continue;
        const offset = Math.round((date - startDate) / 86400000);
        return { year, month, day: offset + 1 };
      }
    }
  }
  return null;
}
function kathmanduIsoDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: kathmanduTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}
function getCalendarCurrentDate() {
 return gregorianToBs(kathmanduIsoDate()) || calendarAnchor;
}
const initialCalendarDate = getCalendarCurrentDate();
let calendarYear = initialCalendarDate.year;
let calendarMonth = initialCalendarDate.month;
// Leave blank to let WhatsApp choose the recipient; set an international number later if desired.
const managerWhatsAppNumber = "";

// --- 2. UTILITIES ---
function saveStaff() { localStorage.setItem(staffKey, JSON.stringify(staff)); }
function saveAttendanceLog() { localStorage.setItem(attendanceLogKey, JSON.stringify(attendanceLog)); }
function saveAttendanceOverrides() { localStorage.setItem(attendanceOverridesKey, JSON.stringify(attendanceOverrides)); }
function saveAttendanceQualification() { localStorage.setItem(attendanceQualificationKey, JSON.stringify(attendanceQualification)); }
function attendanceQualificationSeconds() {
  if (attendanceQualification.unit === "instant") return 0;
  return Number(attendanceQualification.value) * (attendanceQualification.unit === "minutes" ? 60 : 1);
}
function saveVendorColumnWidths() { localStorage.setItem(vendorColumnWidthsKey, JSON.stringify(vendorColumnWidths)); }
function attendanceDate(date = new Date()) { return kathmanduIsoDate(date); }
function attendanceRecordFor(staffId, date = attendanceDate()) {
  return attendanceLog.find((record) => record.staffId === staffId && record.date === date);
}
function qualifyAttendanceRecords() {
  const now = Date.now();
  let changed = false;
  attendanceLog = attendanceLog.map((record) => {
    if (!record.qualified && now - record.clockInAt >= attendanceQualificationSeconds() * 1000) {
      changed = true;
      return { ...record, qualified: true };
    }
    return record;
  });
  if (changed) saveAttendanceLog();
  return changed;
}
function attendanceOverrideFor(staffId, date) {
  return attendanceOverrides.find((override) => override.staffId === staffId && override.date === date);
}
function calendarAttendanceIcons(date) {
  qualifyAttendanceRecords();
  const visibleStaff = staff.filter((person) => {
    const override = attendanceOverrideFor(person.id, date);
    if (override) return override.present;
    return attendanceLog.some((record) => record.staffId === person.id && record.date === date && record.qualified);
  });
  return visibleStaff
    .filter(Boolean)
    .map((person) => {
      const override = attendanceOverrideFor(person.id, date);
      const source = override ? "Admin attendance override" : "Clocked in for 5+ minutes";
      return `<span class="shift-avatar ${person.color}" title="${escapeText(person.name)} · ${source}">${escapeText(person.icon)}</span>`;
    })
    .join("");
}
function openAttendanceOverride(date) {
  if (!isAdmin) return;
  let modal = document.querySelector("[data-attendance-override-modal]");
  if (!modal) {
    modal = document.createElement("div");
    modal.className = "add-vendor-modal";
    modal.dataset.attendanceOverrideModal = "1";
    modal.innerHTML = `<div class="add-vendor-modal-card attendance-override-card">
      <button class="modal-close" data-action="close-attendance-override" aria-label="Close">×</button>
      <p class="eyebrow">Administrator control</p>
      <h2>Manage attendance</h2>
      <p class="muted" data-attendance-override-date></p>
      <p class="attendance-override-help">Select the staff icons that should appear on this date. These corrections take priority over automatic clock-in records.</p>
      <form data-attendance-override-form><div class="attendance-override-list" data-attendance-override-list></div><div class="modal-actions"><button class="button secondary" type="button" data-action="close-attendance-override">Cancel</button><button class="button primary" type="submit">Save attendance</button></div></form>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector("[data-attendance-override-form]")?.addEventListener("submit", (event) => {
      event.preventDefault();
      const selectedDate = modal.dataset.date;
      const selected = [...modal.querySelectorAll("[data-override-staff]:checked")].map((input) => Number(input.dataset.overrideStaff));
      attendanceOverrides = attendanceOverrides.filter((override) => override.date !== selectedDate);
      staff.forEach((person) => {
        attendanceOverrides.push({ date: selectedDate, staffId: person.id, present: selected.includes(person.id), updatedAt: Date.now() });
      });
      saveAttendanceOverrides();
      modal.remove();
      renderNepaliCalendar();
      showToast("Attendance overrides saved.");
    });
  }
  const bsDate = gregorianToBs(date);
  modal.dataset.date = date;
  modal.querySelector("[data-attendance-override-date]").textContent = bsDate
    ? `${bsMonths[bsDate.month]} ${nepaliDigits(bsDate.day)}, ${nepaliDigits(bsDate.year)} · ${date}`
    : date;
  modal.querySelector("[data-attendance-override-list]").innerHTML = staff.map((person) => {
    const override = attendanceOverrideFor(person.id, date);
    const automatic = attendanceLog.some((record) => record.staffId === person.id && record.date === date && record.qualified);
    const checked = override ? override.present : automatic;
    return `<label class="attendance-override-option"><input type="checkbox" data-override-staff="${person.id}" ${checked ? "checked" : ""}><span class="avatar ${person.color} icon-avatar">${escapeText(person.icon)}</span><span><strong>${escapeText(person.name)}</strong><small>${escapeText(person.role)}</small></span></label>`;
  }).join("");
  modal.classList.remove("hidden");
}
function closeAttendanceOverride() { document.querySelector("[data-attendance-override-modal]")?.remove(); }
function formatTime(date = new Date()) { return date.toLocaleTimeString([], { timeZone: kathmanduTimeZone, hour: "2-digit", minute: "2-digit" }); }
function renderKathmanduDate() {
  const label = new Intl.DateTimeFormat("en-GB", {
    timeZone: kathmanduTimeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());
  document.querySelector("[data-current-date]")?.replaceChildren(document.createTextNode(`${label} · Pokhara`));
}
function initials(name) { return name.split(" ").map((part) => part[0]).join(""); }
function statusClass(status) { return status === "Clocked In" ? "success" : status === "On Break" ? "warning-badge" : "muted-badge"; }
function activeStaff() { return staff.find((person) => person.id === activeStaffId); }
function showToast(message) { toast.textContent = message; toast.classList.add("show"); window.setTimeout(() => toast.classList.remove("show"), 3000); }
// --- 3. THEME & UI ---
function applyTheme(theme) {
  const isDark = theme === "dark";
  document.documentElement.dataset.theme = isDark ? "dark" : "light";
  localStorage.setItem("dashy-theme", isDark ? "dark" : "light");
  const toggle = document.querySelector("[data-action='toggle-theme']");
  toggle?.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
  document.querySelector("[data-theme-label]")?.replaceChildren(document.createTextNode(isDark ? "Light mode" : "Dark mode"));
  document.querySelector(".theme-toggle-icon")?.replaceChildren(document.createTextNode(isDark ? "☼" : "☾"));
}

// --- 4. ATTENDANCE ---

// --- DASHBOARD ATTENDANCE LIST ---
let isDashboardAttendanceExpanded = false;

function renderDashboardAttendance() {
  const container = document.querySelector("[data-dashboard-attendance-list]");
  const countEl = document.querySelector("[data-dashboard-attendance-count]");
  const btn = document.querySelector('[data-action="toggle-attendance-more"]');
  if (!container) return;

  const clockedIn = staff.filter((p) => p.status === "Clocked In").length;
  if (countEl) {
    countEl.textContent = `${clockedIn} ${clockedIn === 1 ? "person is" : "people are"} currently in`;
  }

  if (!staff.length) {
    container.innerHTML = '<p class="muted" style="padding:16px 0;text-align:center;">No staff members found.</p>';
    if (btn) btn.classList.add("hidden");
    return;
  }

  // Preview shows 4 staff initially; clicking Show More expands to show ALL
  const previewLimit = 4;
  const visibleStaff = isDashboardAttendanceExpanded ? staff : staff.slice(0, previewLimit);

  container.innerHTML = visibleStaff.map((person) => {
    const isClockedIn = person.status === "Clocked In";
    const statusText = isClockedIn
      ? `${escapeText(person.lastPunch || person.clockIn || "In")} · In`
      : escapeText(person.status);
    const pillClass = isClockedIn ? "in" : person.status === "On Break" ? "break" : "out";

    return `<div class="staff-row">
      <span class="avatar ${escapeText(person.color)} icon-avatar">${escapeText(person.icon)}</span>
      <div>
        <strong>${escapeText(person.name)}</strong>
        <small>${escapeText(person.role)}</small>
      </div>
      <span class="time-pill ${pillClass}">${statusText}</span>
    </div>`;
  }).join("");

  if (btn) {
    if (staff.length > previewLimit) {
      btn.classList.remove("hidden");
      btn.textContent = isDashboardAttendanceExpanded ? "Show Less" : "Show More";
    } else {
      btn.classList.add("hidden");
    }
  }
}

function renderFloor() {
  const floor = document.querySelector("[data-floor-list]");
  if (!floor) return;
  floor.innerHTML = staff.map((person) => {
    const isClockedIn = person.status === "Clocked In";
    const statusText = isClockedIn
      ? `${escapeText(person.lastPunch || person.clockIn || "In")} · In`
      : escapeText(person.status);
    const pillClass = isClockedIn ? "in" : person.status === "On Break" ? "break" : "out";

    return `<div class="floor-row">
      <span class="avatar ${person.color} icon-avatar">${escapeText(person.icon)}</span>
      <div>
        <strong>${escapeText(person.name)}</strong>
        <small>${escapeText(person.role)} · ${person.status === "Off Shift" ? "Not clocked in" : `Last punch: ${escapeText(person.lastPunch)}`}</small>
      </div>
      <span class="time-pill ${pillClass}">${statusText}</span>
    </div>`;
  }).join("");
}

function renderActiveStaff() {
  const panel = document.querySelector("[data-staff-action-panel]");
  const loginCard = document.querySelector(".attendance-login-card");
  const person = activeStaff();
  if (!panel) return;
  panel.classList.toggle("hidden", !person);
  loginCard?.classList.toggle("authenticated", Boolean(person));
  const pinActions = document.querySelector("[data-pin-actions]");
  pinActions?.classList.toggle("hidden", !person);
  document.querySelector("[data-action='finish-staff-session']")?.classList.toggle("hidden", !person);
  if (!person) return;
  const pinAvatar = document.querySelector("[data-pin-user-avatar]");
  if (pinAvatar) {
    pinAvatar.className = `avatar ${person.color} icon-avatar`;
    pinAvatar.textContent = person.icon;
  }
  const pinName = document.querySelector("[data-pin-user-name]");
  if (pinName) pinName.textContent = person.name;
  const pinRole = document.querySelector("[data-pin-user-role]");
  if (pinRole) pinRole.textContent = `${person.role} · ${person.status}`;

  const avatar = document.querySelector("[data-selected-avatar]");
  if (avatar) {
    avatar.className = `avatar ${person.color} icon-avatar`;
    avatar.textContent = person.icon;
  }
  const selName = document.querySelector("[data-selected-name]");
  if (selName) selName.textContent = person.name;
  const selRole = document.querySelector("[data-selected-role]");
  if (selRole) selRole.textContent = `${person.role} · ${person.status}`;
  const primaryAction = document.querySelector('[data-staff-action="primary"]');
  const primaryLabel = primaryAction?.querySelector("span:not(.action-icon)");
  if (primaryLabel) primaryLabel.textContent = person.status === "Off Shift" ? "Clock in" : "Resume shift";
  document.querySelector('[data-staff-action="break"]').disabled = person.status === "Off Shift";
}

function openProfileForm() {
  const person = activeStaff();
  if (!person) return;
  document.querySelector("#profile-name").value = person.name;
  document.querySelector("#profile-pin").value = person.pin;
  document.querySelector("[data-icon-picker]").innerHTML = iconOptions.map((icon) => `<button type="button" class="icon-option ${icon === person.icon ? "selected" : ""}" data-profile-icon="${icon}">${icon}</button>`).join("");
  document.querySelector("[data-profile-form]").classList.remove("hidden");
}

function renderAttendance() { renderFloor(); renderActiveStaff(); }

function resetPin() {
  pinInput = "";
  document.querySelectorAll("[data-pin-dots] i").forEach((dot) => dot.classList.remove("filled"));
}

function returnToPin() {
  activeStaffId = null;
  resetPin();
  document.querySelector("[data-pin-error]")?.classList.add("hidden");
  const leaveForm = document.querySelector("[data-leave-form]");
  leaveForm?.classList.add("hidden");
  leaveForm?.reset();
  const profileForm = document.querySelector("[data-profile-form]");
  profileForm?.classList.add("hidden");
  profileForm?.reset();
  profileForm?.removeAttribute("data-icon");
  renderActiveStaff();
}

function clearTransientUi() {
  returnToPin();
  document.querySelector("[data-roster-editor]")?.classList.add("hidden");
  hideDeleteZones();
}

function handlePinDigit(digit) {
  if (pinInput.length >= 4) return;
  pinInput += digit;
  document.querySelectorAll("[data-pin-dots] i").forEach((dot, index) => dot.classList.toggle("filled", index < pinInput.length));
  if (pinInput.length !== 4) return;
  const person = staff.find((entry) => entry.pin === pinInput);
  if (!person) {
    document.querySelector("[data-pin-error]")?.classList.remove("hidden");
    window.setTimeout(() => { document.querySelector("[data-pin-error]")?.classList.add("hidden"); resetPin(); }, 900);
    return;
  }
  activeStaffId = person.id;
  resetPin();
  renderActiveStaff();
  showToast(`Welcome, ${person.name}. Choose an attendance action.`);
}

function updateAttendance(status) {
  const person = activeStaff();
  if (!person) return;
  const now = formatTime();
  const nowMs = Date.now();
  const date = attendanceDate();
  if (status === "Clocked In" && person.status !== "Clocked In") {
    attendanceLog = attendanceLog.filter((record) => !(record.staffId === person.id && record.date === date && !record.qualified));
    attendanceLog.push({ id: `attendance-${person.id}-${nowMs}`, staffId: person.id, date, clockInAt: nowMs, qualified: false });
    saveAttendanceLog();
  }
  staff = staff.map((entry) => entry.id === person.id ? {
    ...entry,
    status,
    lastPunch: now,
    clockIn: status === "Clocked In" && entry.clockIn === "—" ? now : entry.clockIn,
    clockInAt: status === "Clocked In" && entry.status !== "Clocked In" ? nowMs : entry.clockInAt
  } : entry);
  saveStaff();
  renderAttendance();
  renderDashboardAttendance();
  renderNepaliCalendar();
  if (typeof renderDashboardMetrics === "function") renderDashboardMetrics();
  showToast(`${person.name}: ${status}.`);
}

// --- 5. NEPALI CALENDAR ---
function renderNepaliCalendar() {
  const grids = document.querySelectorAll("[data-nepali-calendar]");
  if (!grids.length) return;
  const yearData = getBsYearData(calendarYear);
  if (!yearData) return;
  const monthStart = dateFromIso(yearData.monthStarts[calendarMonth]);
  const monthEnd = bsToGregorian(calendarYear, calendarMonth, yearData.monthLengths[calendarMonth]);
  if (!monthStart || !monthEnd) return;
  const startDay = monthStart.getUTCDay();
  const days = yearData.monthLengths[calendarMonth];
  const titleText = `${bsMonths[calendarMonth]} ${nepaliDigits(calendarYear)}`;
  const startLabel = `${monthShortNames[monthStart.getUTCMonth()]}`;
  const endLabel = `${monthShortNames[monthEnd.getUTCMonth()]}`;
  const yearLabel = monthStart.getUTCFullYear() === monthEnd.getUTCFullYear() ? monthStart.getUTCFullYear() : `${monthStart.getUTCFullYear()}/${String(monthEnd.getUTCFullYear()).slice(-2)}`;
  const equivText = `${startLabel}/${endLabel} ${yearLabel}`;

  document.querySelectorAll("[data-bs-title]").forEach((el) => { el.textContent = titleText; });
  document.querySelectorAll("[data-bs-equivalent]").forEach((el) => { el.textContent = equivText; });

  const currentDate = getCalendarCurrentDate();
  const cells = [];
  for (let i = 0; i < startDay; i += 1) cells.push('<div class="bs-day empty"></div>');
  for (let day = 1; day <= days; day += 1) {
      const gregorianDate = bsToGregorian(calendarYear, calendarMonth, day);
      if (!gregorianDate) continue;
      const gregorianDay = gregorianDate.getUTCDate();
      const saturday = gregorianDate.getUTCDay() === 6;
      const today = calendarYear === currentDate.year && calendarMonth === currentDate.month && day === currentDate.day;
      const testHighlight = calendarYear === calendarTestDate.year && calendarMonth === calendarTestDate.month && day === calendarTestDate.day;
      const date = dateToIso(gregorianDate);
      const shifts = calendarAttendanceIcons(date);
      cells.push(`<div class="bs-day ${saturday ? "saturday" : ""} ${today ? "today" : ""} ${testHighlight ? "test-highlight" : ""}" data-calendar-date="${date}" title="${bsMonths[calendarMonth]} ${nepaliDigits(day)}, ${calendarYear} · ${monthShortNames[gregorianDate.getUTCMonth()]} ${gregorianDay}, ${gregorianDate.getUTCFullYear()}"><div class="bs-number"><span>${gregorianDay}</span><strong>${nepaliDigits(day)}</strong></div><div class="day-shifts">${shifts || '<span class="calendar-no-attendance">—</span>'}</div></div>`);
  }
  const cellsHtml = cells.join("");
  grids.forEach((grid) => { grid.innerHTML = cellsHtml; });
  renderCalendarPicker();
}

function renderCalendarPicker() {
  const monthSelects = document.querySelectorAll("[data-picker-month]");
  const yearSelects = document.querySelectorAll("[data-picker-year]");
  const dayContainers = document.querySelectorAll("[data-picker-days]");
  if (!monthSelects.length || !yearSelects.length || !dayContainers.length) return;
  const monthOptions = bsMonths.map((month, index) => `<option value="${index}" ${index === calendarMonth ? "selected" : ""}>${month}</option>`).join("");
  const yearOptions = supportedBsYears.map((year) => `<option value="${year}" ${year === calendarYear ? "selected" : ""}>${nepaliDigits(year)}</option>`).join("");
  const yearData = getBsYearData(calendarYear);
  if (!yearData) return;
  const count = yearData.monthLengths[calendarMonth];
  const daysHtml = Array.from({ length: count }, (_, index) => `<button type="button" data-picker-day="${index + 1}" class="${index + 1 === calendarTestDate.day && calendarMonth === calendarTestDate.month && calendarYear === calendarTestDate.year ? "selected" : ""}">${nepaliDigits(index + 1)}</button>`).join("");

  monthSelects.forEach((sel) => { sel.innerHTML = monthOptions; });
  yearSelects.forEach((sel) => { sel.innerHTML = yearOptions; });
  dayContainers.forEach((el) => { el.innerHTML = daysHtml; });
}

// --- 6. SALES CHART ---
const salesSeries = {
  today: { caption: "Sales today · dummy data", labels: ["8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"], values: [100, 350, 450, 300, 800, 950, 1200] },
  week: { caption: "Last 7 days · dummy data", labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], values: [4500, 4800, 3200, 5100, 6200, 7500, 6800] },
  month: { caption: "This month · dummy data", labels: ["Week 1", "Week 2", "Week 3", "Week 4"], values: [28000, 32000, 29500, 35000] },
  year: { caption: "This year · dummy data", labels: ["Q1", "Q2", "Q3", "Q4"], values: [82000, 104000, 97000, 128000] }
};

function renderSalesChart(period = "today") {
  const series = salesSeries[period];
  if (!series) return;
  const max = Math.max(...series.values);
  const points = series.values.map((value, index) => {
    const x = series.values.length === 1 ? 320 : (index * 640) / (series.values.length - 1);
    const y = 190 - (value / max) * 165;
    return `${x} ${y}`;
  });
  const line = `M${points.join(" L")}`;
  document.querySelector("[data-chart-line]")?.setAttribute("d", line);
  document.querySelector("[data-chart-area]")?.setAttribute("d", `${line} V220 H0Z`);
  document.querySelector("[data-sales-caption]").textContent = series.caption;
  document.querySelector("[data-chart-max]").textContent = `Rs ${Math.round(max / 1000)}k`;
  document.querySelector("[data-chart-labels]").innerHTML = series.labels.map((label) => `<span>${label}</span>`).join("");
}


// --- 7. ROSTER ---
const rosterDraftKey = "dashy-roster-drafts-v2";
const rosterPublishedKey = "dashy-roster-published-v2";
const rosterPublishedAtKey = "dashy-roster-published-at-v1";
let rosterWeek = new Date(); rosterWeek.setHours(0, 0, 0, 0); rosterWeek.setDate(rosterWeek.getDate() - rosterWeek.getDay());
const rosterDate = (offset) => {
  const d = new Date(rosterWeek);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const weekKey = () => rosterDate(0);
let rosterDrafts = JSON.parse(localStorage.getItem(rosterDraftKey) || "{}");
let rosterPublished = JSON.parse(localStorage.getItem(rosterPublishedKey) || "{}");
let rosterPublishedAt = JSON.parse(localStorage.getItem(rosterPublishedAtKey) || "{}");
const templateKey = "dashy-roster-templates-v1";
let rosterTemplates = JSON.parse(localStorage.getItem(templateKey) || "null") || [
  { id: "standard", name: "Standard", start: "09:00", end: "17:00" },
  { id: "early", name: "Early", start: "07:00", end: "15:00" },
  { id: "late", name: "Late", start: "14:00", end: "22:00" }
];
function demoPublishedRoster() {
  const shifts = [["09:00", "17:00"], ["10:00", "18:00"], ["12:00", "20:00"], ["14:00", "22:00"]];
  return staff.flatMap((person, staffIndex) => Array.from({ length: 7 }, (_, day) => {
    const holiday = (day + staffIndex) % 6 === 0;
    const [start, end] = shifts[(day + staffIndex) % shifts.length];
    return { staffId: person.id, date: rosterDate(day), type: holiday ? "holiday" : "shift", start: holiday ? "" : start, end: holiday ? "" : end, note: holiday ? "Day off" : "Demo roster" };
  }));
}
function ensurePublishedRoster() {
  const key = weekKey();
  if (!rosterPublished[key]) {
    rosterPublished[key] = demoPublishedRoster();
    localStorage.setItem(rosterPublishedKey, JSON.stringify(rosterPublished));
  }
  if (!rosterPublishedAt[key]) {
    rosterPublishedAt[key] = new Date().toISOString();
    localStorage.setItem(rosterPublishedAtKey, JSON.stringify(rosterPublishedAt));
  }
  return rosterPublished[key];
}
function rosterItems() {
  const key = weekKey();
  if (!rosterDrafts[key]) rosterDrafts[key] = demoPublishedRoster();
  return isAdmin ? rosterDrafts[key] : ensurePublishedRoster();
}
function rosterHours(item) {
  if (!item?.start || !item?.end) return 0;
  const [sh, sm] = item.start.split(":").map(Number); const [eh, em] = item.end.split(":").map(Number);
  let minutes = (eh * 60 + em) - (sh * 60 + sm); if (minutes < 0) minutes += 1440;
  return minutes / 60;
}
function ordinal(day) {
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? "th" : ({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th");
  return `${day}${suffix}`;
}
function formatRosterWeekLabel() {
  const start = new Date(rosterWeek);
  const end = new Date(rosterWeek);
  end.setDate(end.getDate() + 6);
  const startMonth = start.toLocaleDateString("en-GB", { month: "short" });
  const endMonth = end.toLocaleDateString("en-GB", { month: "short" });
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  return startYear === endYear && startMonth === endMonth
    ? `${ordinal(start.getDate())} – ${ordinal(end.getDate())} ${endMonth}, ${endYear}`
    : `${ordinal(start.getDate())} ${startMonth} ${startYear} – ${ordinal(end.getDate())} ${endMonth}, ${endYear}`;
}
function formatTime12(timeStr) {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) return timeStr || "";
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] ? parts[1].padStart(2, "0") : "00";
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}
function formatShiftRange12(start, end) {
  if (!start || !end) return "";
  return `${formatTime12(start)} – ${formatTime12(end)}`;
}
function escapeText(str) {
  return String(str || "").replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}
let selectedRosterCell = null;
function updateNetworkStatus() {
  const badge = document.querySelector("[data-network-badge]");
  const text = document.querySelector("[data-network-text]");
  if (!badge) return;
  const isOnline = navigator.onLine;
  badge.classList.toggle("is-online", isOnline);
  badge.classList.toggle("is-offline", !isOnline);
  badge.setAttribute("title", isOnline ? "Network: Online (Connected)" : "Network: Offline (Changes saved locally)");
  if (text) text.textContent = isOnline ? "Online" : "Offline";
}
function renderTemplates() {
  const list = document.querySelector("[data-template-list]"); if (!list) return;
  list.innerHTML = rosterTemplates.map((template) => {
    const isSelected = selectedTemplateId === template.id;
    const hours = rosterHours(template);
    return `<div class="roster-template-card ${isSelected ? "selected" : ""}" draggable="true" data-template-id="${template.id}">
      <span class="template-drag-handle" title="Drag to roster cell">⠿</span>
      <div class="template-info">
        <strong class="template-name">${escapeText(template.name)}</strong>
        <span class="template-time-12h">${formatShiftRange12(template.start, template.end)} <small>(${hours}h)</small></span>
      </div>
      <button type="button" class="template-stamp-btn" data-stamp-template="${template.id}" title="Click to stamp into cell">Apply</button>
      ${template.id.startsWith("template-") ? `<button type="button" class="template-remove-btn" data-delete-template="${template.id}" title="Delete template">×</button>` : ""}
    </div>`;
  }).join("");
}
function renderRosterGrid(grid, items, adminView = false) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const showWeeklyTotal = adminView;
  grid.classList.toggle("roster-hide-weekly-total", !showWeeklyTotal);
  const headerHtml = `<div class="roster-header"><strong>Staff Member</strong>${names.map((n, i) => `<strong>${n}<small>${new Date(rosterWeek.getFullYear(), rosterWeek.getMonth(), rosterWeek.getDate() + i).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</small></strong>`).join("")}${showWeeklyTotal ? "<strong>Weekly Total</strong>" : ""}</div>`;

  const rowsHtml = staff.map((person) => {
    const cells = names.map((_, day) => {
      const dateIso = rosterDate(day);
      const item = items.find((x) => x.staffId === person.id && x.date === dateIso);
      const isSelected = selectedRosterCell && selectedRosterCell.staffId === person.id && selectedRosterCell.date === dateIso;

      let boxHtml = "";
      if (item && item.type === "shift" && item.start && item.end) {
        boxHtml = `<div class="roster-box roster-box-shift">
          <span class="roster-box-time">${formatShiftRange12(item.start, item.end)}</span>
          ${item.note && item.note !== "Demo roster" && item.note !== "Standard" ? `<span class="roster-box-note">${escapeText(item.note)}</span>` : ""}
        </div>`;
      } else if (item && item.type === "holiday") {
        boxHtml = `<div class="roster-box roster-box-holiday">
          <span class="roster-box-tag">Day Off</span>
          ${item.note && item.note !== "Day off" && item.note !== "Holiday" ? `<span class="roster-box-note">${escapeText(item.note)}</span>` : ""}
        </div>`;
      } else {
        boxHtml = adminView
          ? `<div class="roster-box roster-box-empty admin-addable">
              <span class="roster-add-icon">+</span>
              <span class="roster-add-text">Add Shift</span>
            </div>`
          : `<div class="roster-box roster-box-empty"><span class="roster-dash">—</span></div>`;
      }

      const ariaLabel = `${person.name}, ${names[day]}: ${item && item.type === "shift" ? formatShiftRange12(item.start, item.end) : item?.type === "holiday" ? "Day Off" : "Empty"}`;
      const draggable = adminView && item && item.type !== "clear" && item.type ? `draggable="true"` : "";

      return `<button type="button" class="roster-cell ${item?.type || "clear"} ${isSelected ? "is-selected" : ""}" ${draggable} data-roster-staff="${person.id}" data-roster-date="${dateIso}" aria-label="${ariaLabel}">
        ${boxHtml}
      </button>`;
    }).join("");

    const shifts = items.filter((x) => x.staffId === person.id && x.type === "shift");
    const hours = shifts.reduce((sum, x) => sum + rosterHours(x), 0);
    const daysOff = 7 - shifts.length;

    const staffCellHtml = `<div class="roster-staff-cell">
      <span class="staff-symbol ${person.color}">${person.icon || initials(person.name).slice(0, 1)}</span>
      <div class="staff-details">
        <span class="staff-fullname">${escapeText(person.name)}</span>
        <span class="staff-job-title">${escapeText(person.role)}</span>
      </div>
    </div>`;

    return `<div class="roster-row">${staffCellHtml}${cells}${showWeeklyTotal ? `<span class="roster-summary"><strong class="summary-hours">${hours}h</strong><span class="summary-shifts">${shifts.length} shift${shifts.length === 1 ? "" : "s"}</span><small>${daysOff} day${daysOff === 1 ? "" : "s"} off</small></span>` : ""}</div>`;
  }).join("");

  grid.innerHTML = headerHtml + rowsHtml;
}
function openRosterCellEditor(staffId, dateIso) {
  selectedRosterCell = { staffId: Number(staffId), date: dateIso };
  const person = staff.find((s) => s.id === Number(staffId));
  if (!person) return;

  const item = (rosterDrafts[weekKey()] || []).find((x) => x.staffId === Number(staffId) && x.date === dateIso);
  const editor = document.querySelector("[data-roster-editor]");
  const placeholder = document.querySelector("[data-editor-placeholder]");
  if (!editor || !placeholder) return;

  placeholder.classList.add("hidden");
  editor.classList.remove("hidden");

  const avatarEl = editor.querySelector("[data-editor-avatar]");
  if (avatarEl) {
    avatarEl.className = `staff-symbol ${person.color}`;
    avatarEl.textContent = person.icon || initials(person.name).slice(0, 1);
  }
  const nameEl = editor.querySelector("[data-editor-staff-name]");
  const roleEl = editor.querySelector("[data-editor-staff-role]");
  if (nameEl) nameEl.textContent = person.name;
  if (roleEl) roleEl.textContent = person.role;

  const dateObj = new Date(dateIso + "T00:00:00");
  const dayName = dateObj.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const dayBadge = editor.querySelector("[data-editor-day-badge]");
  if (dayBadge) dayBadge.textContent = dayName;

  document.querySelector("#roster-editor-staff").value = staffId;
  document.querySelector("#roster-editor-date").value = dateIso;

  const type = item?.type || (item?.start ? "shift" : "shift");
  const start = item?.start || "09:00";
  const end = item?.end || "17:00";
  const note = item?.note || "";

  document.querySelector("#roster-editor-start").value = start;
  document.querySelector("#roster-editor-end").value = end;
  document.querySelector("#roster-editor-note").value = note;
  setEditorShiftType(type);
  updateEditorLiveSummary();

  document.querySelectorAll(".roster-cell").forEach((c) => {
    const matches = Number(c.dataset.rosterStaff) === Number(staffId) && c.dataset.rosterDate === dateIso;
    c.classList.toggle("is-selected", matches);
  });
}
function closeRosterCellEditor() {
  selectedRosterCell = null;
  document.querySelector("[data-roster-editor]")?.classList.add("hidden");
  document.querySelector("[data-editor-placeholder]")?.classList.remove("hidden");
  document.querySelectorAll(".roster-cell.is-selected").forEach((c) => c.classList.remove("is-selected"));
}
function setEditorShiftType(type) {
  document.querySelector("#roster-editor-type").value = type;
  document.querySelectorAll("[data-type-segmented] .segment-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === type);
  });
  const timeFields = document.querySelector("[data-editor-time-fields]");
  const presets = document.querySelector(".editor-presets");
  const summary = document.querySelector("[data-shift-summary]");

  if (type === "shift") {
    timeFields?.classList.remove("hidden");
    presets?.classList.remove("hidden");
    if (summary) {
      summary.classList.remove("hidden");
      updateEditorLiveSummary();
    }
  } else {
    timeFields?.classList.add("hidden");
    presets?.classList.add("hidden");
    if (summary) {
      summary.classList.remove("hidden");
      document.querySelector("[data-summary-hours]").textContent = type === "holiday" ? "🌴 Day Off" : "✕ Clear Slot";
      document.querySelector("[data-summary-range]").textContent = type === "holiday" ? "No shift scheduled" : "Assignment removed";
    }
  }
}
function updateEditorLiveSummary() {
  const type = document.querySelector("#roster-editor-type")?.value || "shift";
  if (type !== "shift") return;
  const start = document.querySelector("#roster-editor-start")?.value || "09:00";
  const end = document.querySelector("#roster-editor-end")?.value || "17:00";

  const startPrev = document.querySelector("[data-start-12h-preview]");
  const endPrev = document.querySelector("[data-end-12h-preview]");
  if (startPrev) startPrev.textContent = formatTime12(start);
  if (endPrev) endPrev.textContent = formatTime12(end);

  const hours = rosterHours({ start, end });
  const hoursEl = document.querySelector("[data-summary-hours]");
  const rangeEl = document.querySelector("[data-summary-range]");
  if (hoursEl) hoursEl.textContent = `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} hrs`;
  if (rangeEl) rangeEl.textContent = `${formatTime12(start)} – ${formatTime12(end)}`;
}
function copyPublishedToDraft() {
  const key = weekKey();
  const published = ensurePublishedRoster();
  rosterDrafts[key] = JSON.parse(JSON.stringify(published));
  localStorage.setItem(rosterDraftKey, JSON.stringify(rosterDrafts));
  renderRoster();
  showToast("Published roster copied into this week's draft.");
}
function resetWeekDraft() {
  const key = weekKey();
  rosterDrafts[key] = [];
  localStorage.setItem(rosterDraftKey, JSON.stringify(rosterDrafts));
  renderRoster();
  closeRosterCellEditor();
  showToast("Draft cleared for this week.");
}
function renderRoster() {
  const grid = document.querySelector("[data-roster-grid]");
  const dashboardGrid = document.querySelector("[data-dashboard-roster-grid]");
  const items = rosterItems(); const publishedItems = ensurePublishedRoster();
  const label = formatRosterWeekLabel();
  document.querySelector("[data-roster-week-label]")?.replaceChildren(document.createTextNode(label));
  document.querySelector("[data-dashboard-roster-week-label]")?.replaceChildren(document.createTextNode(label));
  const publishedAt = rosterPublishedAt[weekKey()];
  const publishedLabel = publishedAt
    ? `Published on ${new Date(publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : "Published roster";
  document.querySelector("[data-roster-state]")?.replaceChildren(document.createTextNode(isAdmin ? "Draft – local to this device" : (items.length ? publishedLabel : "No published roster yet")));
  if (grid) renderRosterGrid(grid, items, isAdmin);
  if (dashboardGrid) renderRosterGrid(dashboardGrid, publishedItems, false);
  renderCleaningSchedule();
  if (!grid) return;
  renderTemplates();
  if (!draggedRosterCell) {
    const deleteZone = document.querySelector("[data-roster-delete-zone]");
    if (deleteZone) {
      deleteZone.classList.add("hidden");
      deleteZone.classList.remove("active", "drop-target");
    }
  }
}
function observeRosterSizes() {
  const rosters = [
    { container: document.querySelector(".published-roster-panel"), grid: document.querySelector(".dashboard-roster-grid"), minimumWidth: 640 },
    { container: document.querySelector(".roster-table-wrap"), grid: document.querySelector("[data-roster-grid]"), minimumWidth: 700 }
  ];
  if (!("ResizeObserver" in window)) return;
  rosters.forEach(({ container, grid, minimumWidth }) => {
    if (!container || !grid) return;
  const updateScrollMode = () => {
      container.dataset.rosterScroll = grid.clientWidth < minimumWidth ? "true" : "false";
  };
    new ResizeObserver(updateScrollMode).observe(grid);
    updateScrollMode();
  });
}
function renderStaffManager() {
  const list = document.querySelector("[data-staff-manager-list]"); if (!list) return;
  list.innerHTML = staff.map((person) => `<div class="manager-row"><span class="avatar ${person.color} icon-avatar">${escapeText(person.icon)}</span><span><strong>${escapeText(person.name)}</strong><small>${escapeText(person.role)} · PIN ••••</small></span><button class="button secondary" data-manager-edit="${person.id}">Edit</button></div>`).join("");
}
function renderAttendanceSettings() {
  const value = document.querySelector("[data-attendance-qualification-value]");
  const unit = document.querySelector("[data-attendance-qualification-unit]");
  if (value) value.value = attendanceQualification.unit === "instant" ? 0 : attendanceQualification.value;
  if (unit) {
    unit.value = attendanceQualification.unit;
    if (value) {
      value.disabled = attendanceQualification.unit === "instant";
      value.required = attendanceQualification.unit !== "instant";
    }
  }
}
function saveAttendanceSettings(event) {
  event.preventDefault();
  const value = Number(document.querySelector("[data-attendance-qualification-value]")?.value);
  const unit = document.querySelector("[data-attendance-qualification-unit]")?.value;
  const max = unit === "seconds" ? 86400 : 1440;
  if (unit === "instant") {
    attendanceQualification = { unit, value: 0 };
  } else if (!Number.isInteger(value) || value < 1 || value > max) {
    showToast(`Enter a whole number from 1 to ${max} ${unit}.`);
    return;
  } else {
    attendanceQualification = { unit, value };
  }
  saveAttendanceQualification();
  qualifyAttendanceRecords();
  renderNepaliCalendar();
  showToast(`Attendance icons will appear ${unit === "instant" ? "instantly" : `after ${value} ${unit}.`}`);
}
function openStaffManager() { document.querySelector("[data-staff-manager]")?.classList.remove("hidden"); renderStaffManager(); }
function saveRosterDraft() { localStorage.setItem(rosterDraftKey, JSON.stringify(rosterDrafts)); showToast("Roster draft saved on this device."); renderRoster(); }
// --- 8. ADMIN & STAFF MANAGEMENT ---
function renderGreeting() {
  const h1 = document.querySelector('[data-greeting-h1]');
  if (!h1) return;
  const name = isAdmin ? adminName : 'TNH';
  h1.innerHTML = `Good morning, ${escapeText(name)} <span class="wave">😀</span>`;
}
function setAdminUi() {
  document.querySelectorAll(".admin-only").forEach((element) => element.classList.toggle("hidden", !isAdmin));
  document.querySelector(".roster-studio")?.classList.toggle("admin-mode", isAdmin);
  document.querySelector("[data-workspace-label]").textContent = isAdmin ? "Admin workspace" : "Staff workspace";
  document.querySelector("[data-role-label]").textContent = isAdmin ? "Administrator signed in" : "Staff access";
  document.querySelector("[data-mode-badge]").textContent = isAdmin ? "Admin view" : "Staff view";
  const button = document.querySelector(".admin-login-button");
  button.innerHTML = isAdmin ? "<span>×</span> Log out" : "<span>⚿</span> Admin Login";
  button.setAttribute("aria-label", isAdmin ? "Log out admin" : "Admin login");
  if (!isAdmin) {
    if (window.location.hash === '#user-management') navigate('dashboard');
    closeRosterCellEditor();
    document.querySelector("[data-roster-delete-zone]")?.classList.remove("active");
    document.querySelector("[data-staff-manager]")?.classList.add("hidden");
  }
  renderGreeting();
  renderRoster();
  renderCleaningSchedule();
  renderVendors();
  renderAttendanceSettings();
}

// --- 9. NAVIGATION & ROUTING ---
function navigate(pageName) {
  const target = pages.some((page) => page.dataset.view === pageName) ? pageName : "dashboard";
  pages.forEach((page) => page.classList.toggle("hidden", page.dataset.view !== target));
  links.forEach((link) => link.classList.toggle("active", link.dataset.page === target));
  history.replaceState(null, "", `#${target}`);
  document.querySelector("[data-sidebar]")?.classList.remove("open");
  if (target !== "attendance") returnToPin();
  if (target !== "roster") {
    document.querySelector("[data-roster-editor]")?.classList.add("hidden");
    hideDeleteZones();
  }
  if (target === "attendance") { renderAttendance(); renderNepaliCalendar(); }
  if (target === "dashboard") renderNepaliCalendar();
  if (target === "roster") { renderRoster(); renderCleaningSchedule(); }
  if (target === "vendors") renderVendors();
}

function openAdminLogin() {
  if (isAdmin) {
    isAdmin = false; sessionStorage.removeItem("dashy-admin"); clearTransientUi(); setAdminUi(); navigate("dashboard"); showToast("Admin tools locked."); return;
  }
  document.querySelector("[data-admin-modal]")?.classList.remove("hidden");
  document.querySelector("#admin-password")?.focus();
}

function resetPasswordToggles() {
  document.querySelectorAll("[data-password-toggle]").forEach((btn) => {
    const inputId = btn.dataset.passwordToggle;
    const input = document.getElementById(inputId);
    if (input) input.type = "password";
    btn.querySelector(".eye-show")?.classList.remove("hidden");
    btn.querySelector(".eye-hide")?.classList.add("hidden");
  });
}

function closeAdminLogin() {
  document.querySelector("[data-admin-modal]")?.classList.add("hidden");
  document.querySelector("[data-admin-form]")?.reset();
  document.querySelector("[data-admin-error]")?.classList.add("hidden");
  document.querySelector("[data-forgot-link]")?.remove();
  resetPasswordToggles();
  closeAdminRecovery();
}

function copyText(text, successMessage) { navigator.clipboard?.writeText(text).then(() => showToast(successMessage), () => showToast("Copy was blocked by the browser.")); }

// --- 10. EVENT LISTENERS ---
document.addEventListener("click", (event) => {
  const pwToggleBtn = event.target.closest("[data-password-toggle]");
  if (pwToggleBtn) {
    const inputId = pwToggleBtn.dataset.passwordToggle;
    const input = document.getElementById(inputId);
    if (input) {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      pwToggleBtn.querySelector(".eye-show")?.classList.toggle("hidden", isPassword);
      pwToggleBtn.querySelector(".eye-hide")?.classList.toggle("hidden", !isPassword);
      input.focus();
    }
    return;
  }
  if (!event.target.closest("[data-calendar-picker]") && !event.target.closest("[data-calendar-action='picker']")) {
    document.querySelectorAll("[data-calendar-picker]").forEach((p) => p.classList.add("hidden"));
  }
  const pageLink = event.target.closest("[data-page]");
  if (pageLink) { event.preventDefault(); navigate(pageLink.dataset.page); }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "toggle-sidebar") {
    if (window.innerWidth <= 960) {
      document.querySelector("[data-sidebar]")?.classList.toggle("open");
    } else {
      document.querySelector(".app-shell")?.classList.toggle("sidebar-collapsed");
    }
  }
  if (action === "open-admin-login") openAdminLogin();
  if (action === "toggle-theme") applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
  if (action === "close-admin-login") closeAdminLogin();
  if (action === "close-recovery") closeAdminRecovery();
  if (action === "clear-pin") resetPin();
  if (action === "back-to-pin") returnToPin();
  if (action === "finish-staff-session") { returnToPin(); showToast("Session finished. Next employee can enter their PIN."); }
  if (action === "close-leave") document.querySelector("[data-leave-form]")?.classList.add("hidden");
  if (action === "open-profile") openProfileForm();
  if (action === "close-profile") document.querySelector("[data-profile-form]")?.classList.add("hidden");
  if (action === "copy-guide") copyText(document.querySelector('[data-view="help"]').innerText, "Help Guide copied.");
  if (action === "copy-system-log") copyText(document.querySelector("#technical-log").innerText, "Technical log copied.");
  if (action === "open-staff-manager") openStaffManager();
  if (action === "open-attendance-override") openAttendanceOverride(attendanceDate());
  if (action === "close-staff-manager") document.querySelector("[data-staff-manager]")?.classList.add("hidden");
  if (action === "close-attendance-override") closeAttendanceOverride();
  if (action === "save-roster-draft") saveRosterDraft();
  if (action === "publish-roster") {
    const key = weekKey();
    rosterPublished[key] = JSON.parse(JSON.stringify(rosterDrafts[key] || []));
    rosterPublishedAt[key] = new Date().toISOString();
    localStorage.setItem(rosterPublishedKey, JSON.stringify(rosterPublished));
    localStorage.setItem(rosterPublishedAtKey, JSON.stringify(rosterPublishedAt));
    showToast("Roster published for this week.");
    renderRoster();
  }
  if (action === "copy-published-to-draft") copyPublishedToDraft();
  if (action === "reset-week-draft") resetWeekDraft();
  if (action === "close-roster-editor") closeRosterCellEditor();
  if (action === "toggle-attendance-more") {
    isDashboardAttendanceExpanded = !isDashboardAttendanceExpanded;
    renderDashboardAttendance();
  }
  const calendarDay = event.target.closest("[data-calendar-date]");
  if (calendarDay && isAdmin) openAttendanceOverride(calendarDay.dataset.calendarDate);

  const pin = event.target.closest("[data-pin]")?.dataset.pin;
  if (pin) handlePinDigit(pin);
  const staffAction = event.target.closest("[data-staff-action]")?.dataset.staffAction;
  if (staffAction === "primary") updateAttendance("Clocked In");
  if (staffAction === "break") updateAttendance(activeStaff()?.status === "On Break" ? "Clocked In" : "On Break");
  if (staffAction === "clockout") updateAttendance("Off Shift");
  if (staffAction === "leave") document.querySelector("[data-leave-form]")?.classList.remove("hidden");
  const profileIcon = event.target.closest("[data-profile-icon]")?.dataset.profileIcon;
  if (profileIcon) {
    document.querySelectorAll("[data-profile-icon]").forEach((button) => button.classList.toggle("selected", button.dataset.profileIcon === profileIcon));
    document.querySelector("[data-profile-form]").dataset.icon = profileIcon;
  }
  const calendarAction = event.target.closest("[data-calendar-action]")?.dataset.calendarAction;
  if (calendarAction === "today") {
    const currentDate = getCalendarCurrentDate();
    calendarYear = currentDate.year;
    calendarMonth = currentDate.month;
    renderNepaliCalendar();
  }
  if (calendarAction === "picker") {
    const parentPanel = event.target.closest(".nepali-calendar-panel");
    const targetPicker = parentPanel ? parentPanel.querySelector("[data-calendar-picker]") : document.querySelector("[data-calendar-picker]");
    targetPicker?.classList.toggle("hidden");
  }
  const pickerDay = event.target.closest("[data-picker-day]")?.dataset.pickerDay;
  if (pickerDay) {
    document.querySelectorAll("[data-calendar-picker]").forEach((p) => p.classList.add("hidden"));
    showToast(`Selected ${bsMonths[calendarMonth]} ${pickerDay}, ${calendarYear}.`);
  }
  if (calendarAction === "prev" || calendarAction === "next") {
    const direction = calendarAction === "next" ? 1 : -1;
    const candidateMonth = calendarMonth + direction;
    const candidateYear = calendarYear + (candidateMonth < 0 || candidateMonth > 11 ? direction : 0);
    const normalizedMonth = (candidateMonth + 12) % 12;
    if (!getBsYearData(candidateYear)) {
      showToast("Only verified calendar data is available for 2083 BS so far.");
    } else {
      calendarYear = candidateYear;
      calendarMonth = normalizedMonth;
      renderNepaliCalendar();
    }
  }
});


document.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  const cell = event.target.closest("[data-roster-staff]");
  if (cell && isAdmin && !cell.closest(".published-roster-panel")) {
    const staffId = Number(cell.dataset.rosterStaff);
    const dateIso = cell.dataset.rosterDate;

    if (selectedTemplateId) {
      const template = rosterTemplates.find((entry) => entry.id === selectedTemplateId);
      if (template) {
        setRosterItem(staffId, dateIso, { staffId, date: dateIso, type: "shift", start: template.start, end: template.end, note: template.name });
        renderRoster();
        openRosterCellEditor(staffId, dateIso);
        showToast(`Assigned ${template.name} (${formatShiftRange12(template.start, template.end)})`);
        return;
      }
    }
    openRosterCellEditor(staffId, dateIso);
  }

  const stampBtn = event.target.closest("[data-stamp-template]");
  if (stampBtn && isAdmin) {
    const tmplId = stampBtn.dataset.stampTemplate;
    const template = rosterTemplates.find((x) => x.id === tmplId);
    if (template) {
      selectedTemplateId = selectedTemplateId === tmplId ? null : tmplId;
      document.querySelectorAll(".roster-template-card").forEach((c) => c.classList.toggle("selected", c.dataset.templateId === selectedTemplateId));
      if (selectedTemplateId) {
        showToast(`Template active: ${template.name}. Click any day in the table to assign.`);
      }
    }
    return;
  }

  const deleteBtn = event.target.closest("[data-delete-template]");
  if (deleteBtn && isAdmin) {
    const tmplId = deleteBtn.dataset.deleteTemplate;
    rosterTemplates = rosterTemplates.filter((x) => x.id !== tmplId);
    localStorage.setItem(templateKey, JSON.stringify(rosterTemplates));
    renderTemplates();
    showToast("Shift template removed.");
    return;
  }

  const presetBtn = event.target.closest("[data-preset-start]");
  if (presetBtn && isAdmin) {
    document.querySelector("#roster-editor-start").value = presetBtn.dataset.presetStart;
    document.querySelector("#roster-editor-end").value = presetBtn.dataset.presetEnd;
    setEditorShiftType("shift");
    updateEditorLiveSummary();
    presetBtn.classList.add("selected");
    setTimeout(() => presetBtn.classList.remove("selected"), 300);
    return;
  }

  const segmentBtn = event.target.closest("[data-type-segmented] .segment-btn");
  if (segmentBtn && isAdmin) {
    setEditorShiftType(segmentBtn.dataset.type);
    return;
  }

  const templateButton = event.target.closest("[data-template-id]");
  if (templateButton && isAdmin && !event.target.closest("[data-stamp-template]") && !event.target.closest("[data-delete-template]")) {
    const tmplId = templateButton.dataset.templateId;
    selectedTemplateId = selectedTemplateId === tmplId ? null : tmplId;
    document.querySelectorAll(".roster-template-card").forEach((button) => button.classList.toggle("selected", button.dataset.templateId === selectedTemplateId));
    if (selectedTemplateId) {
      showToast("Template selected. Click any cell to assign.");
    }
  }

  const edit = event.target.closest("[data-manager-edit]");
  if (edit) {
    const person = staff.find((x) => String(x.id) === edit.dataset.managerEdit);
    if (person) {
      document.querySelector("#manager-staff-id").value = person.id;
      document.querySelector("#manager-staff-name").value = person.name;
      document.querySelector("#manager-staff-role").value = person.role;
      document.querySelector("#manager-staff-pin").value = person.pin;
    }
  }

  const week = event.target.closest("[data-roster-week]")?.dataset.rosterWeek;
  if (week) {
    const direction = week === "next" ? "left" : "right";
    const grids = document.querySelectorAll("[data-roster-grid], [data-dashboard-roster-grid]");
    grids.forEach(g => g.classList.add(`slide-out-${direction}`));
    setTimeout(() => {
      rosterWeek.setDate(rosterWeek.getDate() + (week === "next" ? 7 : -7));
      closeRosterCellEditor();
      renderRoster();
      grids.forEach(g => {
        g.classList.remove(`slide-out-${direction}`);
        g.classList.add(`slide-in-${direction === "left" ? "right" : "left"}`);
        setTimeout(() => g.classList.remove(`slide-in-${direction === "left" ? "right" : "left"}`), 200);
      });
    }, 180);
  }
  const cleaningWeekAction = event.target.closest("[data-cleaning-week]")?.dataset.cleaningWeek;
  if (cleaningWeekAction) {
    const table = document.querySelector("[data-cleaning-grid] .cleaning-table-wrap");
    const direction = cleaningWeekAction === "next" ? "left" : "right";
    table?.classList.add(`slide-out-${direction}`);
    setTimeout(() => {
      cleaningWeek.setDate(cleaningWeek.getDate() + (cleaningWeekAction === "next" ? 7 : -7));
      renderCleaningSchedule();
      const nextTable = document.querySelector("[data-cleaning-grid] .cleaning-table-wrap");
      nextTable?.classList.remove(`slide-out-${direction}`);
      nextTable?.classList.add(`slide-in-${direction === "left" ? "right" : "left"}`);
      setTimeout(() => nextTable?.classList.remove(`slide-in-${direction === "left" ? "right" : "left"}`), 200);
    }, 180);
  }
  if (action === "save-cleaning-draft") {
    saveCleaningSchedule();
    showToast("Cleaning draft saved on this device.");
    renderCleaningSchedule();
  }
  if (action === "publish-cleaning") {
    const key = cleaningWeekKey();
    cleaningPublished[key] = JSON.parse(JSON.stringify(cleaningSchedule[key] || {}));
    saveCleaningPublished();
    showToast("Cleaning schedule published.");
    renderCleaningSchedule();
  }
});

document.addEventListener("touchstart", (event) => {
  const cleaningGrid = event.target.closest("[data-cleaning-grid]");
  if (!cleaningGrid || event.touches.length !== 1) return;
  cleaningTouchStartX = event.touches[0].clientX;
}, { passive: true });

document.addEventListener("touchend", (event) => {
  const cleaningGrid = event.target.closest("[data-cleaning-grid]");
  if (!cleaningGrid || cleaningTouchStartX === null || event.changedTouches.length !== 1) return;
  const distance = event.changedTouches[0].clientX - cleaningTouchStartX;
  cleaningTouchStartX = null;
  if (Math.abs(distance) < 50) return;
  const action = distance < 0 ? "next" : "prev";
  cleaningGrid.querySelector(`[data-cleaning-week="${action}"]`)?.click();
}, { passive: true });

document.querySelector("[data-roster-editor-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const staffId = Number(document.querySelector("#roster-editor-staff").value);
  const date = document.querySelector("#roster-editor-date").value;
  const type = document.querySelector("#roster-editor-type").value;
  const start = document.querySelector("#roster-editor-start").value;
  const end = document.querySelector("#roster-editor-end").value;
  const note = document.querySelector("#roster-editor-note").value.trim();

  const person = staff.find((x) => x.id === staffId);
  const value = {
    staffId,
    date,
    type,
    start: type === "shift" ? start : "",
    end: type === "shift" ? end : "",
    note: type === "holiday" ? (note || "Day off") : note
  };

  setRosterItem(staffId, date, value);
  renderRoster();
  openRosterCellEditor(staffId, date);
  const feedback = type === "shift" ? formatShiftRange12(start, end) : type === "holiday" ? "Day Off" : "Slot cleared";
  showToast(`${person ? person.name : "Staff"}: ${feedback}`);
});

document.querySelector("[data-template-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.querySelector("#template-name").value.trim();
  const start = document.querySelector("#template-start").value;
  const end = document.querySelector("#template-end").value;
  if (!name || !start || !end) return;
  rosterTemplates.push({ id: `template-${Date.now()}`, name, start, end });
  localStorage.setItem(templateKey, JSON.stringify(rosterTemplates));
  event.target.reset();
  document.querySelector("#template-start").value = "09:00";
  document.querySelector("#template-end").value = "17:00";
  renderTemplates();
  showToast(`Created "${name}" template.`);
});
let draggedRosterCell = null;
let draggedTemplate = null;
let selectedTemplateId = null;
let lastDeletedRoster = null;

function hideDeleteZones() {
  draggedRosterCell = null;
  draggedTemplate = null;
  selectedTemplateId = null;

  document.querySelectorAll(".dragging").forEach((el) => el.classList.remove("dragging"));
  document.querySelectorAll(".drop-target").forEach((el) => el.classList.remove("drop-target"));

  const deleteZone = document.querySelector("[data-roster-delete-zone]");
  if (deleteZone) {
    deleteZone.classList.add("hidden");
    deleteZone.classList.remove("active", "drop-target");
  }

  const cleaningDeleteZone = document.querySelector("[data-cleaning-delete-zone]");
  if (cleaningDeleteZone) {
    cleaningDeleteZone.classList.add("hidden");
    cleaningDeleteZone.classList.remove("active", "drop-target");
  }
}

function setRosterItem(staffId, date, value) {
  const key = weekKey(); const list = rosterDrafts[key] || [];
  const index = list.findIndex((x) => x.staffId === staffId && x.date === date);
  if (index >= 0) list[index] = value; else list.push(value);
  rosterDrafts[key] = list;
}
function showUndoDelete(item) {
  lastDeletedRoster = item;
  showToast("Assignment removed. Click Undo in the next toast to restore it.");
  const toastButton = document.createElement("button"); toastButton.className = "toast-undo"; toastButton.textContent = "Undo";
  toastButton.addEventListener("click", () => { if (lastDeletedRoster) { setRosterItem(lastDeletedRoster.staffId, lastDeletedRoster.date, lastDeletedRoster); renderRoster(); lastDeletedRoster = null; toastButton.remove(); showToast("Assignment restored."); } });
  toast.appendChild(toastButton);
}
document.addEventListener("dragstart", (event) => {
  const cleaningStaff = event.target.closest("[data-cleaning-staff-id]");
  if (cleaningStaff && isAdmin) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", `cleaning-staff:${cleaningStaff.dataset.cleaningStaffId}`);
    cleaningStaff.classList.add("dragging");
    return;
  }
  const cleaningAssignment = event.target.closest("[data-cleaning-drop]");
  if (cleaningAssignment && isAdmin) {
    const value = cleaningAssignment.value?.trim();
    if (!value) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `cleaning-assignment:${cleaningAssignment.dataset.cleaningShift}:${cleaningAssignment.dataset.cleaningDay}`);
    cleaningAssignment.classList.add("dragging");
    const deleteZone = document.querySelector("[data-cleaning-delete-zone]");
    deleteZone?.classList.remove("hidden");
    deleteZone?.classList.add("active");
    return;
  }
  if (!isAdmin) return;
  const template = event.target.closest("[data-template-id]");
  const cell = event.target.closest("[data-roster-staff][draggable='true']");
  if (template) {
    draggedTemplate = rosterTemplates.find((x) => x.id === template.dataset.templateId);
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("text/plain", "template");
    return;
  }
  if (!cell) return;
  draggedRosterCell = { staffId: Number(cell.dataset.rosterStaff), date: cell.dataset.rosterDate };
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", "assignment");
  cell.classList.add("dragging");
  const deleteZone = document.querySelector("[data-roster-delete-zone]");
  deleteZone?.classList.remove("hidden");
  deleteZone?.classList.add("active");
});
document.addEventListener("dragend", () => {
  hideDeleteZones();
});
document.addEventListener("dragover", (event) => {
  const cleaningTarget = event.target.closest("[data-cleaning-drop]");
  const cleaningDeleteZone = event.target.closest("[data-cleaning-delete-zone]");
  const transfer = event.dataTransfer?.getData("text/plain") || "";
  if (cleaningDeleteZone && isAdmin && transfer.startsWith("cleaning-assignment:")) {
    event.preventDefault();
    cleaningDeleteZone.classList.add("drop-target");
    return;
  }
  if (cleaningTarget && isAdmin) {
    event.preventDefault();
    cleaningTarget.closest(".cleaning-cell-wrap")?.classList.add("drop-target");
    return;
  }
  const target = event.target.closest("[data-roster-staff]");
  if (target && isAdmin && (draggedRosterCell || draggedTemplate)) {
    event.preventDefault();
    target.classList.add("drop-target");
  }
  const deleteZone = event.target.closest("[data-roster-delete-zone]");
  if (deleteZone && isAdmin && draggedRosterCell) {
    event.preventDefault();
    deleteZone.classList.add("drop-target");
  }
});
document.addEventListener("dragleave", (event) => {
  event.target.closest(".cleaning-cell-wrap")?.classList.remove("drop-target");
  const target = event.target.closest("[data-roster-staff], [data-roster-delete-zone]");
  if (target && (!event.relatedTarget || !target.contains(event.relatedTarget))) {
    target.classList.remove("drop-target");
  }
  event.target.closest("[data-cleaning-delete-zone]")?.classList.remove("drop-target");
});
document.addEventListener("drop", (event) => {
  const cleaningTarget = event.target.closest("[data-cleaning-drop]");
  const transfer = event.dataTransfer?.getData("text/plain") || "";
  const cleaningDeleteZone = event.target.closest("[data-cleaning-delete-zone]");
  if (cleaningDeleteZone && isAdmin && transfer.startsWith("cleaning-assignment:")) {
    event.preventDefault();
    const [, sourceShift, sourceDay] = transfer.split(":");
    hideDeleteZones();
    const wk = cleaningWeekKey();
    const sourceIndex = Number(sourceDay);
    const removed = cleaningSchedule[wk]?.[sourceShift]?.[sourceIndex] || "";
    if (removed) {
      cleaningSchedule[wk][sourceShift][sourceIndex] = "";
      saveCleaningSchedule();
      renderCleaningSchedule();
      showToast(`${removed} removed from the cleaning schedule.`);
    }
    return;
  }
  if (cleaningTarget && isAdmin && transfer.startsWith("cleaning-staff:")) {
    event.preventDefault();
    const staffId = Number(transfer.split(":")[1]);
    hideDeleteZones();
    const person = staff.find((entry) => entry.id === staffId);
    if (!person) return;
    const wk = cleaningWeekKey();
    cleaningSchedule[wk][cleaningTarget.dataset.cleaningShift][Number(cleaningTarget.dataset.cleaningDay)] = person.name.split(" ")[0];
    saveCleaningSchedule();
    renderCleaningSchedule();
    showToast(`${person.name} assigned to cleaning.`);
    return;
  }
  if (cleaningTarget && isAdmin && transfer.startsWith("cleaning-assignment:")) {
    event.preventDefault();
    const [, sourceShift, sourceDay] = transfer.split(":");
    const targetShift = cleaningTarget.dataset.cleaningShift;
    const targetDay = Number(cleaningTarget.dataset.cleaningDay);
    const sourceIndex = Number(sourceDay);
    hideDeleteZones();
    const wk = cleaningWeekKey();
    const sourceValue = cleaningSchedule[wk]?.[sourceShift]?.[sourceIndex] || "";
    if (sourceShift === targetShift && sourceIndex === targetDay) return;
    if (!sourceValue) return;
    cleaningSchedule[wk][targetShift][targetDay] = sourceValue;
    cleaningSchedule[wk][sourceShift][sourceIndex] = "";
    saveCleaningSchedule();
    renderCleaningSchedule();
    showToast(`${sourceValue} moved to the selected cleaning cell.`);
    return;
  }
  const deleteZone = event.target.closest("[data-roster-delete-zone]");
  if (deleteZone && isAdmin && draggedRosterCell) {
    event.preventDefault();
    const itemToDelete = draggedRosterCell;
    hideDeleteZones();
    const item = (rosterDrafts[weekKey()] || []).find((x) => x.staffId === itemToDelete.staffId && x.date === itemToDelete.date);
    if (item) {
      setRosterItem(item.staffId, item.date, { staffId: item.staffId, date: item.date, type: "clear", start: "", end: "", note: "" });
      renderRoster();
      showUndoDelete(item);
    }
    return;
  }
  const target = event.target.closest("[data-roster-staff]");
  if (!target || !isAdmin) {
    hideDeleteZones();
    return;
  }
  if (draggedTemplate) {
    event.preventDefault();
    const template = draggedTemplate;
    hideDeleteZones();
    setRosterItem(Number(target.dataset.rosterStaff), target.dataset.rosterDate, { staffId: Number(target.dataset.rosterStaff), date: target.dataset.rosterDate, type: "shift", start: template.start, end: template.end, note: template.name });
    renderRoster();
    return;
  }
  if (draggedRosterCell) {
    event.preventDefault();
    const sourceCell = draggedRosterCell;
    const targetStaff = Number(target.dataset.rosterStaff);
    const targetDate = target.dataset.rosterDate;
    hideDeleteZones();
    if (sourceCell.staffId === targetStaff && sourceCell.date === targetDate) {
      return; // Dropped back into the same cell, do nothing
    }
    const list = rosterDrafts[weekKey()] || [];
    const source = list.find((x) => x.staffId === sourceCell.staffId && x.date === sourceCell.date);
    if (source) {
      setRosterItem(targetStaff, targetDate, { ...source, staffId: targetStaff, date: targetDate });
      setRosterItem(sourceCell.staffId, sourceCell.date, { staffId: sourceCell.staffId, date: sourceCell.date, type: "clear", start: "", end: "", note: "" });
      renderRoster();
      showToast("Roster assignment moved.");
    }
    return;
  }
  hideDeleteZones();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideDeleteZones();
  }
});
document.querySelector("[data-staff-manager-form]")?.addEventListener("submit", (event) => { event.preventDefault(); const id = Number(document.querySelector("#manager-staff-id").value); const name = document.querySelector("#manager-staff-name").value.trim(); const role = document.querySelector("#manager-staff-role").value.trim(); const pin = document.querySelector("#manager-staff-pin").value.trim(); if (!/^\d{4}$/.test(pin)) { showToast("PIN must be exactly four digits."); return; } if (staff.some((x) => x.id !== id && x.pin === pin)) { showToast("PINs must be unique. Choose another four-digit PIN."); return; } staff = staff.map((x) => x.id === id ? { ...x, name, role, pin } : x); saveStaff(); renderStaffManager(); renderAttendance(); showToast("Staff profile saved."); });
document.querySelector("[data-attendance-settings-form]")?.addEventListener("submit", saveAttendanceSettings);
document.querySelector("[data-attendance-qualification-unit]")?.addEventListener("change", (event) => {
  const input = document.querySelector("[data-attendance-qualification-value]");
  const instant = event.target.value === "instant";
  if (input) {
    input.disabled = instant;
    input.required = !instant;
    if (instant) input.value = 0;
  }
});
document.querySelector("[data-sales-filter]")?.addEventListener("change", (event) => renderSalesChart(event.target.value));
document.addEventListener("change", (event) => {
  if (event.target.matches("[data-picker-month]")) {
    calendarMonth = Number(event.target.value);
    renderNepaliCalendar();
  }
  if (event.target.matches("[data-picker-year]")) {
    const selectedYear = Number(event.target.value);
    if (getBsYearData(selectedYear)) {
      calendarYear = selectedYear;
      renderNepaliCalendar();
    }
  }
});

document.querySelector("[data-admin-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const pwVal = document.querySelector("#admin-password").value;
  if (pwVal !== adminPassword) {
    document.querySelector("[data-admin-error]")?.classList.remove("hidden");
    // Inject "Forgot password?" link only after a wrong attempt, if not already present
    if (!document.querySelector("[data-forgot-link]")) {
      const link = document.createElement("button");
      link.type = "button"; link.className = "forgot-link"; link.dataset.forgotLink = "1";
      link.textContent = "Forgot password?";
      link.addEventListener("click", () => openAdminRecovery());
      document.querySelector("[data-admin-error]")?.after(link);
    }
    return;
  }
  isAdmin = true; sessionStorage.setItem("dashy-admin", "true"); setAdminUi(); closeAdminLogin(); showToast("Admin tools unlocked.");
});


document.querySelector("[data-leave-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const date = document.querySelector("#leave-date").value;
  const reason = document.querySelector("#leave-reason").value.trim();
  const person = activeStaff();
  if (!person || !date) return;
  const message = `Leave request from ${person.name}\nDate: ${date}${reason ? `\nReason: ${reason}` : ""}`;
  window.open(`https://wa.me/${managerWhatsAppNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  event.target.reset();
  event.target.classList.add("hidden");
  showToast("WhatsApp leave request prepared.");
});
document.querySelector("[data-profile-form]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const person = activeStaff();
  const name = document.querySelector("#profile-name").value.trim();
  const pin = document.querySelector("#profile-pin").value.trim();
  if (!person || !name || !/^\d{4}$/.test(pin)) return;
  const icon = event.target.dataset.icon || person.icon;
  if (staff.some((entry) => entry.id !== person.id && entry.pin === pin)) {
    showToast("That PIN is already in use. Choose another four-digit PIN.");
    return;
  }
  staff = staff.map((entry) => entry.id === person.id ? { ...entry, name, pin, icon } : entry);
  saveStaff();
  event.target.classList.add("hidden");
  renderAttendance();
  showToast("Profile updated.");
});
window.addEventListener("hashchange", () => navigate(window.location.hash.slice(1)));
window.addEventListener("online", () => {
  updateNetworkStatus();
  showToast("Connection restored. You are back online.");
});
window.addEventListener("offline", () => {
  updateNetworkStatus();
  showToast("Offline mode: changes remain on this device until sync is connected.");
});
document.querySelector("#roster-editor-start")?.addEventListener("input", updateEditorLiveSummary);
document.querySelector("#roster-editor-end")?.addEventListener("input", updateEditorLiveSummary);
document.querySelector("#roster-editor-start")?.addEventListener("change", updateEditorLiveSummary);
document.querySelector("#roster-editor-end")?.addEventListener("change", updateEditorLiveSummary);
// Service worker removed — Netlify CDN handles caching for production.
// --- Dynamic Dashboard Metrics ---
function renderDashboardMetrics() {
  const cards = document.querySelectorAll(".metric-card");
  if (cards.length < 4) return;

  // Card 1: Present today (count clocked-in staff)
  const presentCount = staff.filter((p) => p.status === "Clocked In").length;
  const totalStaff = staff.length;
  const presentStrong = cards[0].querySelector("strong");
  if (presentStrong) presentStrong.innerHTML = `${presentCount} <small>/ ${totalStaff} staff</small>`;

  // Card 2: Sales today (keep dummy — will be real when sales tracking is built)
  // No change for now

  // Card 3: On the roster (count published shifts for current week)
  const publishedItems = ensurePublishedRoster();
  const shiftCount = publishedItems.filter((x) => x.type === "shift").length;
  const rosterStrong = cards[2].querySelector("strong");
  if (rosterStrong) rosterStrong.innerHTML = `${shiftCount} <small>shifts</small>`;

  // Card 4: Open vendor tasks (placeholder until vendors are built)
  // No change for now
}


// --- USER MANAGEMENT ---
const userTypeKey = 'dashy-user-types-v1';
let userTypes = JSON.parse(localStorage.getItem(userTypeKey) || 'null') || {};
// Default all existing staff as 'staff' type
function getUserType(id) { return userTypes[id] || 'staff'; }
function saveUserTypes() { localStorage.setItem(userTypeKey, JSON.stringify(userTypes)); }

function renderUserList() {
  const list = document.querySelector('[data-user-list]');
  if (!list) return;
  if (!staff.length) {
    list.innerHTML = '<p class="muted" style="padding:20px 0;text-align:center;">No users yet. Click + Add User to get started.</p>';
    return;
  }
  list.innerHTML = staff.map((person) => {
    const type = getUserType(person.id);
    return `<div class="user-row">
      <span class="avatar ${escapeText(person.color)} icon-avatar">${escapeText(person.icon)}</span>
      <div class="user-info">
        <strong>${escapeText(person.name)}</strong>
        <small>${escapeText(person.role)} &middot; PIN ••••</small>
      </div>
      <span class="user-type-badge ${type}">${type === 'admin' ? 'Admin' : 'Staff'}</span>
      <div class="user-row-actions">
        <button class="button secondary" data-user-edit="${person.id}">Edit</button>
        <button class="button secondary" data-user-delete="${person.id}" style="color:var(--danger,#e11d48)">Remove</button>
      </div>
    </div>`;
  }).join('');
}

function openUserModal(userId = null) {
  const modal = document.querySelector('[data-user-modal]');
  const title = document.querySelector('[data-user-modal-title]');
  const form = document.querySelector('[data-user-form]');
  const iconPicker = document.querySelector('[data-user-icon-picker]');
  if (!modal || !form) return;
  form.reset();
  document.querySelector('#user-form-id').value = '';
  document.querySelector('[data-user-form-error]')?.classList.add('hidden');
  // Populate icon picker
  if (iconPicker) {
    iconPicker.innerHTML = iconOptions.map((icon) =>
      `<button type="button" class="icon-option" data-user-icon="${escapeText(icon)}">${icon}</button>`
    ).join('');
    form.dataset.icon = iconOptions[0];
    iconPicker.querySelector('.icon-option')?.classList.add('selected');
  }
  if (userId) {
    const person = staff.find((x) => x.id === userId);
    if (!person) return;
    title.textContent = 'Edit User';
    document.querySelector('#user-form-id').value = person.id;
    document.querySelector('#user-form-name').value = person.name;
    document.querySelector('#user-form-role').value = person.role;
    document.querySelector('#user-form-pin').value = person.pin;
    document.querySelector('#user-form-type').value = getUserType(person.id);
    form.dataset.icon = person.icon;
    // Mark selected icon
    if (iconPicker) {
      iconPicker.querySelectorAll('.icon-option').forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.userIcon === person.icon);
      });
    }
  } else {
    title.textContent = 'Add New User';
  }
  modal.classList.remove('hidden');
}

function closeUserModal() {
  document.querySelector('[data-user-modal]')?.classList.add('hidden');
  document.querySelector('[data-user-form]')?.reset();
}

// Handle user form icon picker
document.addEventListener('click', (event) => {
  const iconBtn = event.target.closest('[data-user-icon]');
  if (iconBtn) {
    document.querySelectorAll('[data-user-icon]').forEach((b) => b.classList.toggle('selected', b === iconBtn));
    const form = document.querySelector('[data-user-form]');
    if (form) form.dataset.icon = iconBtn.dataset.userIcon;
    return;
  }
  if (event.target.closest('[data-action="open-add-user"]')) { openUserModal(); return; }
  if (event.target.closest('[data-action="close-user-modal"]')) { closeUserModal(); return; }
  const editBtn = event.target.closest('[data-user-edit]');
  if (editBtn) { openUserModal(Number(editBtn.dataset.userEdit)); return; }
  const deleteBtn = event.target.closest('[data-user-delete]');
  if (deleteBtn) {
    const id = Number(deleteBtn.dataset.userDelete);
    staff = staff.filter((x) => x.id !== id);
    delete userTypes[id];
    saveStaff(); saveUserTypes();
    renderUserList();
    renderRoster();
    renderDashboardAttendance();
    showToast('User removed.');
  }
});

document.querySelector('[data-user-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const id = Number(document.querySelector('#user-form-id').value);
  const name = document.querySelector('#user-form-name').value.trim();
  const role = document.querySelector('#user-form-role').value.trim();
  const pin  = document.querySelector('#user-form-pin').value.trim();
  const type = document.querySelector('#user-form-type').value;
  const icon = event.target.dataset.icon || iconOptions[0];
  const errEl = document.querySelector('[data-user-form-error]');
  if (!/^\d{4}$/.test(pin)) { showToast('PIN must be exactly 4 digits.'); return; }
  // Check PIN uniqueness (excluding current user)
  if (staff.some((x) => x.id !== id && x.pin === pin)) {
    errEl?.classList.remove('hidden'); return;
  }
  errEl?.classList.add('hidden');
  if (id) {
    // Edit existing
    staff = staff.map((x) => x.id === id ? { ...x, name, role, pin, icon } : x);
    userTypes[id] = type;
  } else {
    // Add new
    const newId = Math.max(0, ...staff.map((x) => x.id)) + 1;
    const colors = ['orange-bg', 'gold-bg', 'purple-bg', 'lime-bg', 'blue-bg', 'green-bg'];
    const color = colors[newId % colors.length];
    staff.push({ id: newId, name, role, pin, status: 'Off Shift', lastPunch: '—', color, icon, clockIn: '—' });
    userTypes[newId] = type;
  }
  saveStaff(); saveUserTypes();
  closeUserModal();
  renderUserList();
  renderRoster();
  renderAttendance();
  renderDashboardAttendance();
  showToast(id ? 'User updated.' : `${name} added.`);
});

// ==========================================================================
// --- 12. ADMIN SECURITY (Feature E) ---
// ==========================================================================
let adminPassword = localStorage.getItem('dashy-admin-pw-v1') || 'admin';
let recoveryPhrase = localStorage.getItem('dashy-recovery-phrase-v1') || null;
let recoveryAttempts = 0; // session-only, reset on reload

function openAdminRecovery() {
  const loginForm = document.querySelector('[data-admin-form]');
  const recoverySection = document.querySelector('[data-admin-recovery-section]');
  if (loginForm) loginForm.classList.add('hidden');
  if (recoverySection) recoverySection.classList.remove('hidden');
}

function closeAdminRecovery() {
  const loginForm = document.querySelector('[data-admin-form]');
  const recoverySection = document.querySelector('[data-admin-recovery-section]');
  if (loginForm) loginForm.classList.remove('hidden');
  if (recoverySection) recoverySection.classList.add('hidden');
  const errEl = document.querySelector('[data-recovery-error]');
  if (errEl) { errEl.textContent = ''; errEl.classList.add('hidden'); }
}

document.querySelector('[data-recovery-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const errEl = document.querySelector('[data-recovery-error]');
  if (!recoveryPhrase) {
    errEl.textContent = 'No recovery passphrase has been set. Log in as admin first and set one in User Management.';
    errEl.classList.remove('hidden'); return;
  }
  if (recoveryAttempts >= 3) {
    errEl.textContent = 'Too many failed attempts. Reload the page to try again.';
    errEl.classList.remove('hidden');
    document.querySelector('[data-recovery-form]')?.querySelectorAll('input, button[type="submit"]')
      .forEach((el) => { el.disabled = true; });
    return;
  }
  const phrase = document.querySelector('#recovery-phrase-input')?.value || '';
  const newPw  = document.querySelector('#recovery-new-pw')?.value || '';
  const confPw = document.querySelector('#recovery-confirm-pw')?.value || '';
  if (phrase !== recoveryPhrase) {
    recoveryAttempts++;
    const remaining = 3 - recoveryAttempts;
    errEl.textContent = `Incorrect passphrase. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`;
    errEl.classList.remove('hidden'); return;
  }
  if (!newPw || newPw.length < 4) {
    errEl.textContent = 'New password must be at least 4 characters.';
    errEl.classList.remove('hidden'); return;
  }
  if (newPw !== confPw) {
    errEl.textContent = 'Passwords do not match.';
    errEl.classList.remove('hidden'); return;
  }
  adminPassword = newPw;
  localStorage.setItem('dashy-admin-pw-v1', adminPassword);
  recoveryAttempts = 0;
  event.target.reset();
  closeAdminRecovery();
  closeAdminLogin();
  showToast('Admin password reset. Log in with your new password.');
});

document.querySelector('[data-admin-security-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const errEl = document.querySelector('[data-security-error]');
  const currentPw = document.querySelector('#sec-current-pw')?.value || '';
  const newPw     = document.querySelector('#sec-new-pw')?.value?.trim() || '';
  const phrase    = document.querySelector('#sec-recovery-phrase')?.value?.trim() || '';
  if (currentPw !== adminPassword) {
    errEl.textContent = 'Current password is incorrect.';
    errEl.classList.remove('hidden'); return;
  }
  if (newPw && newPw.length < 4) {
    errEl.textContent = 'New password must be at least 4 characters.';
    errEl.classList.remove('hidden'); return;
  }
  if (newPw) { adminPassword = newPw; localStorage.setItem('dashy-admin-pw-v1', adminPassword); }
  if (phrase) { recoveryPhrase = phrase; localStorage.setItem('dashy-recovery-phrase-v1', phrase); }
  errEl.classList.add('hidden');
  event.target.reset();
  const msg = (newPw && phrase) ? 'Password and recovery passphrase saved.' :
              newPw ? 'Admin password updated.' :
              phrase ? 'Recovery passphrase saved.' : 'No changes made.';
  showToast(msg);
});

// ==========================================================================
// --- 13. BATHROOM CLEANING SCHEDULE (Feature F) ---
// ==========================================================================
const cleaningKey = 'dashy-cleaning-v1';
let cleaningSchedule = JSON.parse(localStorage.getItem(cleaningKey) || '{}');
const cleaningPublishedKey = 'dashy-cleaning-published-v1';
let cleaningPublished = JSON.parse(localStorage.getItem(cleaningPublishedKey) || '{}');
let cleaningWeek = new Date(rosterWeek);
let cleaningTouchStartX = null;
const cleaningWeekDate = (offset) => {
  const d = new Date(cleaningWeek);
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const cleaningWeekKey = () => cleaningWeekDate(0);
function formatCleaningWeekLabel() {
  const start = new Date(cleaningWeek);
  const end = new Date(cleaningWeek);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

function saveCleaningSchedule() {
  localStorage.setItem(cleaningKey, JSON.stringify(cleaningSchedule));
}
function saveCleaningPublished() {
  localStorage.setItem(cleaningPublishedKey, JSON.stringify(cleaningPublished));
}

function cleaningDateKeyFrom(baseDate, offset = 0) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function createCleaningDemoWeek(seed) {
  const names = staff.length
    ? staff.map((person) => person.name.split(" ")[0])
    : ["Prem", "Samjhana", "Sandesh", "Saniya", "Namit", "Alex", "Sarah"];
  const offset = Math.abs([...seed].reduce((total, char) => total + char.charCodeAt(0), 0)) % names.length;
  const pick = (index) => names[(index + offset) % names.length];
  return {
    morning: Array.from({ length: 7 }, (_, index) => pick(index)),
    evening: Array.from({ length: 7 }, (_, index) => pick(index + 3))
  };
}

function ensureCleaningDemoWeeks() {
  let changed = false;
  [-7, 0, 7].forEach((offset) => {
    const key = cleaningDateKeyFrom(cleaningWeek, offset);
    if (!cleaningSchedule[key]) {
      cleaningSchedule[key] = createCleaningDemoWeek(key);
      changed = true;
    }
    if (!cleaningPublished[key]) {
      cleaningPublished[key] = JSON.parse(JSON.stringify(cleaningSchedule[key]));
      changed = true;
    }
  });
  if (changed) {
    saveCleaningSchedule();
    saveCleaningPublished();
  }
}

function getCleaningConflict(name, dayIndex) {
  if (!name || !name.trim()) return false;
  const nameClean = name.trim().toLowerCase();
  const dateIso = cleaningWeekDate(dayIndex);
  const publishedItems = ensurePublishedRoster();
  const draftItems = rosterDrafts[weekKey()] || [];
  const items = isAdmin ? draftItems : publishedItems;
  const person = staff.find((s) => {
    const sName = s.name.toLowerCase();
    const firstName = sName.split(' ')[0];
    return sName === nameClean || firstName === nameClean || sName.startsWith(nameClean) || nameClean.startsWith(firstName);
  });
  if (!person) return false;
  const item = items.find((x) => x.staffId === person.id && x.date === dateIso);
  return Boolean(item && item.type === 'holiday');
}
function renderCleaningEditor() {
  const editor = document.querySelector("[data-cleaning-editor]");
  if (!editor) return;
  editor.innerHTML = `<div class="cleaning-editor-heading"><span class="studio-badge">Cleaning editor</span><span class="studio-shortcut-hint">Drag to assign</span></div><p class="muted cleaning-editor-description">Drag a staff name into a Morning or Evening cell. Drop a name back onto a cell to replace it.</p><div class="cleaning-staff-palette">${staff.map((person) => `<div class="cleaning-staff-chip" draggable="true" data-cleaning-staff-id="${person.id}"><span class="staff-symbol ${person.color}">${escapeText(person.icon || initials(person.name).slice(0, 1))}</span><span><strong>${escapeText(person.name)}</strong><small>${escapeText(person.role)}</small></span></div>`).join("")}</div>`;
}

function renderCleaningSchedule() {
  const container = document.querySelector('[data-cleaning-grid]');
  if (!container) return;
  ensureCleaningDemoWeeks();
  const wk = cleaningWeekKey();
  if (!cleaningSchedule[wk]) {
    cleaningSchedule[wk] = {
      morning: ['Prem', 'Samjhana', 'Prem', 'Samjhana', 'Sandesh', 'Prem', 'Samjhana'],
      evening: ['Sandesh', 'Saniya', 'Sandesh', 'Namit', 'Saniya', 'Sandesh', 'Saniya']
    };
  }
  if (!cleaningPublished[wk]) {
    cleaningPublished[wk] = JSON.parse(JSON.stringify(cleaningSchedule[wk]));
    saveCleaningPublished();
  }
  const data = isAdmin ? cleaningSchedule[wk] : cleaningPublished[wk];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayHeaders = days.map((d, i) => {
    const dt = new Date(cleaningWeek);
    dt.setDate(dt.getDate() + i);
    return `<th>${d}<br><small style="font-weight:600;font-size:8.5px;color:var(--muted)">${dt.toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</small></th>`;
  }).join('');

  const staffDatalist = `<datalist id="cleaning-staff-datalist">${staff.map((s) => `<option value="${escapeText(s.name.split(' ')[0])}">${escapeText(s.name)}</option>`).join('')}</datalist>`;

  function buildRow(shiftLabel, taskLabel, dataKey) {
    const cells = data[dataKey].map((val, i) => {
      const conflict = getCleaningConflict(val, i);
      const conflictTip = conflict ? '<span class="cleaning-conflict-tip">⚠ Day off</span>' : '';
      const conflictClass = conflict ? ' conflict' : '';
      return `<td><div class="cleaning-cell-wrap"><input type="text" class="cleaning-cell-input${conflictClass}"
        data-cleaning-shift="${dataKey}" data-cleaning-day="${i}"
        data-cleaning-drop="true"
        draggable="${isAdmin && Boolean(val)}"
        value="${escapeText(val)}"
        ${isAdmin ? '' : 'readonly'}
        placeholder="${isAdmin ? 'Drop staff…' : '—'}"
        autocomplete="off" />${conflictTip}</div></td>`;
    }).join('');
    return `<tr><td>${shiftLabel}</td><td>${taskLabel}</td>${cells}</tr>`;
  }

  container.innerHTML = `
    ${staffDatalist}
    <div class="cleaning-section-header">
      <div><span class="cleaning-section-title">🚿 Bathroom Cleaning Schedule <span class="cleaning-badge">Weekly</span></span><small class="cleaning-week-status">${isAdmin ? 'Draft changes are saved on this device.' : 'Published schedule'}</small></div>
      <div class="cleaning-week-nav"><button class="icon-button" data-cleaning-week="prev" aria-label="Previous cleaning week">‹</button><strong data-cleaning-week-label>${formatCleaningWeekLabel()}</strong><button class="icon-button" data-cleaning-week="next" aria-label="Next cleaning week">›</button></div>
    </div>
    <div class="cleaning-table-wrap">
      <table class="cleaning-table">
        <thead>
          <tr>
            <th>Shift</th>
            <th>Task</th>
            ${dayHeaders}
          </tr>
        </thead>
        <tbody>
          ${buildRow('Morning', 'Opening Bathroom Clean', 'morning')}
          ${buildRow('Evening', 'Closing Bathroom Clean', 'evening')}
        </tbody>
      </table>
    </div>
    <div class="cleaning-drag-help">${isAdmin ? 'Drag a staff name from the editor into any assignment cell.' : 'Staff assignments are published by an administrator.'}</div>`;

  // Keep manual text editing for admins as a fallback.
  if (isAdmin) {
    container.querySelectorAll('.cleaning-cell-input').forEach((input) => {
      input.addEventListener('input', () => {
        const shift = input.dataset.cleaningShift;
        const day = Number(input.dataset.cleaningDay);
        cleaningSchedule[wk][shift][day] = input.value;
        saveCleaningSchedule();
        // Update conflict state live
        const hasConflict = getCleaningConflict(input.value, day);
        input.classList.toggle('conflict', hasConflict);
        let tip = input.closest('.cleaning-cell-wrap')?.querySelector('.cleaning-conflict-tip');
        if (hasConflict && !tip) {
          tip = document.createElement('span');
          tip.className = 'cleaning-conflict-tip';
          tip.textContent = '⚠ Day off';
          input.after(tip);
        } else if (!hasConflict && tip) {
          tip.remove();
        }
      });
    });
  }
  if (isAdmin) renderCleaningEditor();
}

// ==========================================================================
// --- 14. VENDOR LEDGER (Feature G) ---
// ==========================================================================
const vendorKey = 'dashy-vendors-v2';
const defaultVendors = [
  {
    id: "v1",
    name: "Himalayan Coffee Co.",
    category: "Beverage",
    contact: "+977-9801234567",
    color: "#f97316",
    bills: [
      { id: "b101", billNo: "INV-2083-01", date: "2026-09-08", particular: "Espresso Blend Beans (25kg)", amount: 32000, payments: [{ id: "p1", date: "2026-09-12", amount: 32000, note: "Full online transfer" }] },
      { id: "b102", billNo: "INV-2083-08", date: "2026-09-15", particular: "French Roast & Syrups", amount: 18500, payments: [{ id: "p2", date: "2026-09-20", amount: 18500, note: "Cheque 44102" }] },
      { id: "b103", billNo: "INV-2083-14", date: "2026-09-22", particular: "Oat Milk & Paper Takeaway Cups", amount: 24000, payments: [{ id: "p3", date: "2026-09-26", amount: 14000, note: "Partial advance" }] },
      { id: "b104", billNo: "INV-2083-21", date: "2026-09-28", particular: "Arabica Reserve (15kg)", amount: 21000, payments: [] }
    ]
  },
  {
    id: "v2",
    name: "Pokhara Fresh Dairy",
    category: "Dairy",
    contact: "+977-9812345678",
    color: "#eab308",
    bills: [
      { id: "b201", billNo: "DAIRY-881", date: "2026-09-10", particular: "Whole Milk 60L & Butter 10kg", amount: 12500, payments: [{ id: "p201", date: "2026-09-14", amount: 12500, note: "Cash" }] },
      { id: "b202", billNo: "DAIRY-895", date: "2026-09-24", particular: "Heavy Cream & Mozzarella Cheese", amount: 16800, payments: [{ id: "p202", date: "2026-09-28", amount: 8000, note: "Partial bank transfer" }] }
    ]
  },
  {
    id: "v3",
    name: "Valley Green Produce",
    category: "Produce",
    contact: "+977-9823456789",
    color: "#22c55e",
    bills: [
      { id: "b301", billNo: "VG-410", date: "2026-09-12", particular: "Weekly organic vegetables batch", amount: 9800, payments: [{ id: "p301", date: "2026-09-15", amount: 9800, note: "Paid in full" }] },
      { id: "b302", billNo: "VG-433", date: "2026-09-27", particular: "Avocados, Berries & Microgreens", amount: 14200, payments: [] }
    ]
  },
  {
    id: "v4",
    name: "CleanPro Hygiene Supplies",
    category: "Hygiene",
    contact: "+977-9845678901",
    color: "#84cc16",
    bills: [
      { id: "b401", billNo: "CP-102", date: "2026-09-05", particular: "Floor sanitizers, sponges & handwash", amount: 8500, payments: [{ id: "p401", date: "2026-09-10", amount: 8500, note: "FonePay" }] }
    ]
  },
  {
    id: "v5",
    name: "Everest Bakery & Pastry",
    category: "Bakery",
    contact: "+977-9856789012",
    color: "#78716c",
    bills: [
      { id: "b501", billNo: "EB-77", date: "2026-09-20", particular: "Croissants, sourdough & pastries (batch 1)", amount: 11000, payments: [{ id: "p501", date: "2026-09-25", amount: 5000, note: "Partial" }] }
    ]
  }
];

let vendors = JSON.parse(localStorage.getItem(vendorKey) || 'null') || defaultVendors;
let activeVendorId = null;
let expandedBillId = null;
let vendorChartVisible = false;
let vendorFiltersVisible = false;
let vendorLedgerQuery = { billNo: '', date: '', text: '', sort: 'date-desc' };
const vendorFilterIcon = window.location.pathname.includes('/static/dashy/')
  ? '/static/dashy/icon-filter.svg'
  : 'assets/icon-filter.svg';
const vendorTabColors = ["#f97316", "#eab308", "#22c55e", "#84cc16", "#06b6d4", "#a855f7", "#ec4899"];
function validVendorColor(color, fallback = vendorTabColors[0]) {
  return /^#[0-9a-f]{6}$/i.test(color || '') ? color : fallback;
}

function normalizeVendorData() {
  vendors.forEach((vendor) => {
    vendor.color = validVendorColor(vendor.color, vendorTabColors[vendors.indexOf(vendor) % vendorTabColors.length]);
    vendor.bills = (vendor.bills || []).map((bill) => {
      const items = Array.isArray(bill.items) && bill.items.length
        ? bill.items
        : [{ id: genId('i'), description: bill.particular || 'Item', quantity: 1, rate: Number(bill.amount) || 0, discount: 0 }];
      return {
        ...bill,
        note: bill.note || '',
        items: items.map((item) => ({
          id: item.id || genId('i'),
          description: item.description || item.name || 'Item',
          quantity: Math.max(0, Number(item.quantity) || 0),
          rate: Math.max(0, Number(item.rate) || 0),
          discount: Math.max(0, Number(item.discount) || 0)
        }))
      };
    });
  });
}

function applyVendorRetention() {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const cutoffIso = cutoff.toISOString().slice(0, 10);
  vendors.forEach((vendor) => {
    vendor.bills = (vendor.bills || []).filter((bill) => !bill.date || bill.date >= cutoffIso);
  });
}

function saveVendors() {
  applyVendorRetention();
  localStorage.setItem(vendorKey, JSON.stringify(vendors));
}

normalizeVendorData();
saveVendors();

function genId(prefix) { return prefix + Math.random().toString(36).slice(2, 9); }

function itemTotal(item) {
  return Math.max(0, (Number(item.quantity) || 0) * (Number(item.rate) || 0) - (Number(item.discount) || 0));
}
function billTotal(bill) {
  if (Array.isArray(bill.items) && bill.items.length) {
    return bill.items.reduce((sum, item) => sum + itemTotal(item), 0);
  }
  return Number(bill.amount) || 0;
}
function billPaid(bill) { return (bill.payments || []).reduce((s, p) => s + (p.amount || 0), 0); }
function billBalance(bill) { return billTotal(bill) - billPaid(bill); }
function billStatus(bill) {
  const paid = billPaid(bill);
  if (paid <= 0) return 'unpaid';
  if (paid >= billTotal(bill)) return 'paid';
  return 'partial';
}
function vendorSummary(vendor) {
  const bills = vendor.bills || [];
  const totalDebit = bills.reduce((s, b) => s + billTotal(b), 0);
  const totalPaid  = bills.reduce((s, b) => s + billPaid(b), 0);
  return { count: bills.length, totalDebit, totalPaid, outstanding: totalDebit - totalPaid };
}
function formatMoney(n) {
  if (!n) return '0';
  if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  if (n >= 1000)   return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return Math.round(n).toLocaleString();
}

function vendorColumnTemplate() {
  return vendorColumnWidths.map((width, index) => index === 3 ? "minmax(180px, 1fr)" : `${width}px`).join(" ");
}

function attachVendorColumnResizers(container) {
  const header = container.querySelector(".vbt-header");
  if (!header) return;
  header.querySelectorAll("[data-column-resize]").forEach((handle) => {
    handle.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const column = Number(handle.dataset.columnResize);
      const startX = event.clientX;
      const startWidth = vendorColumnWidths[column];
      handle.setPointerCapture?.(event.pointerId);
      const onMove = (moveEvent) => {
        const nextWidth = Math.max(42, Math.min(420, startWidth + moveEvent.clientX - startX));
        vendorColumnWidths[column] = nextWidth;
        container.querySelectorAll(".vbt-header, .vbt-cells").forEach((row) => {
          row.style.gridTemplateColumns = vendorColumnTemplate();
        });
      };
      const onUp = () => {
        saveVendorColumnWidths();
        handle.removeEventListener("pointermove", onMove);
        handle.removeEventListener("pointerup", onUp);
      };
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp);
    });
  });
}

function renderBillRow(bill, sn, vendorId) {
  const paid    = billPaid(bill);
  const total   = billTotal(bill);
  const balance = billBalance(bill);
  const status  = billStatus(bill);
  const isExp   = expandedBillId === bill.id;
  const statusClass = status === 'paid' ? 'status-paid' : status === 'partial' ? 'status-partial' : 'status-unpaid';
  const statusLabel = status === 'paid' ? '✓ Paid' : status === 'partial' ? '◑ Partial' : '○ Unpaid';
  const payments = bill.payments || [];
  const payHtml = payments.length
    ? payments.map((p, pi) => `<div class="payment-row">
        <span>${pi + 1}</span>
        <span>${escapeText(p.date)}</span>
        <span style="color:var(--teal);font-weight:700">Rs ${formatMoney(p.amount)}</span>
        <span>${escapeText(p.note || '—')}</span>
        ${isAdmin ? `<button data-action="vendor-del-payment" data-vendor-id="${vendorId}" data-bill-id="${bill.id}" data-payment-id="${escapeText(p.id)}" style="border:0;background:transparent;color:var(--red);cursor:pointer;font-size:14px;padding:0 4px;">×</button>` : ''}
      </div>`).join('')
    : '<p class="muted" style="font-size:11.5px;padding:4px 0;">No payments recorded yet.</p>';

  const addPayForm = (isAdmin && status !== 'paid') ? `
    <form class="add-payment-form" data-payment-form data-vendor-id="${vendorId}" data-bill-id="${bill.id}">
      <input type="date" id="pay-date-${bill.id}" value="${new Date().toISOString().slice(0,10)}" required />
      <input type="number" id="pay-amount-${bill.id}" placeholder="Amount (Rs)" min="0.01" step="0.01" required />
      <input type="text"   id="pay-note-${bill.id}"   placeholder="Note (optional)" />
      <button class="button primary" type="submit" style="font-size:11px;padding:6px 12px;">+ Add Payment</button>
    </form>` : '';

  const itemRows = (bill.items || []).map((item, itemIndex) => `<tr data-item-id="${item.id}">
    <td>${itemIndex + 1}</td>
    <td><input data-inline-item="description" value="${escapeText(item.description)}" ${isAdmin ? '' : 'readonly'} /></td>
    <td><input data-inline-item="quantity" type="number" min="0" step="0.01" value="${item.quantity}" ${isAdmin ? '' : 'readonly'} /></td>
    <td><input data-inline-item="rate" type="number" min="0" step="0.01" value="${item.rate}" ${isAdmin ? '' : 'readonly'} /></td>
    <td><input data-inline-item="discount" type="number" min="0" step="0.01" value="${item.discount}" ${isAdmin ? '' : 'readonly'} /></td>
    <td data-item-total>Rs ${formatMoney(itemTotal(item))}</td>
    ${isAdmin ? `<td><button type="button" class="icon-button danger" data-action="vendor-del-item" data-vendor-id="${vendorId}" data-bill-id="${bill.id}" data-item-id="${item.id}" aria-label="Remove item">×</button></td>` : ''}
  </tr>`).join('');

  return `<div class="vbt-row${isExp ? ' expanded' : ''}" data-bill-id="${bill.id}">
    <div class="vbt-cells" data-bill-toggle="${bill.id}" data-vendor-id="${vendorId}">
      <span class="vbt-sn">${sn}</span>
      <span class="vbt-billno"><input data-inline-bill="billNo" value="${escapeText(bill.billNo || '')}" ${isAdmin ? '' : 'readonly'} /></span>
      <span class="vbt-date"><input data-inline-bill="date" type="date" value="${escapeText(bill.date || '')}" ${isAdmin ? '' : 'readonly'} /></span>
      <span class="vbt-particular">${escapeText(bill.particular || bill.items?.[0]?.description || '—')}</span>
      <span class="vbt-amount debit-amt">Rs ${formatMoney(total)}</span>
      <span class="vbt-paid">Rs ${formatMoney(paid)}</span>
      <span class="vbt-balance ${balance > 0 ? 'outstanding-amt' : 'cleared-amt'}">Rs ${formatMoney(Math.max(0, balance))}</span>
      <span class="vbt-status ${statusClass}">${statusLabel}</span>
      ${isAdmin ? `<span class="vbt-actions">
        ${status !== 'paid' ? `<button class="button secondary" style="font-size:10px;padding:3px 8px;" data-action="vendor-add-payment" data-vendor-id="${vendorId}" data-bill-id="${bill.id}">+ Pay</button>` : ''}
        <button class="button secondary" style="font-size:10px;padding:3px 8px;color:var(--red);" data-action="vendor-del-bill" data-vendor-id="${vendorId}" data-bill-id="${bill.id}">×</button>
      </span>` : '<span></span>'}
    </div>
    ${isExp ? `<div class="vbt-details">
      <div class="bill-items-heading"><strong>Bill items</strong><span>Quantity × Rate − Discount</span></div>
      <div class="bill-items-scroll"><table class="bill-items-table"><thead><tr><th>S.N</th><th>Item</th><th>Qty</th><th>Rate</th><th>Discount</th><th>Total</th>${isAdmin ? '<th></th>' : ''}</tr></thead><tbody>${itemRows}</tbody>
      <tfoot><tr><td colspan="5">Bill total</td><td data-bill-total>Rs ${formatMoney(total)}</td>${isAdmin ? '<td></td>' : ''}</tr></tfoot></table></div>
      ${isAdmin ? `<button type="button" class="button secondary add-item-button" data-action="vendor-add-item" data-vendor-id="${vendorId}" data-bill-id="${bill.id}">+ Add item</button>` : ''}
      <label class="bill-note-label">Notes<textarea data-inline-bill="note" rows="2" ${isAdmin ? '' : 'readonly'}>${escapeText(bill.note || '')}</textarea></label>
      <div class="vbt-payments"><div class="payments-header">Payment History</div>${payHtml}${addPayForm}</div>
    </div>` : ''}
  </div>`;
}

function renderVendorChart(vendor) {
  const bills = (vendor.bills || []).slice(-8);
  if (!bills.length) return '';
  const maxAmt = Math.max(...bills.map((b) => b.amount || 0), 1);
  const W = 640; const H = 160; const BAR_GAP = W / bills.length;
  const bars = bills.map((b, i) => {
    const paid = billPaid(b);
    const dh = Math.round(((b.amount || 0) / maxAmt) * H);
    const ph = Math.round((paid / maxAmt) * H);
    const x  = Math.round(i * BAR_GAP + BAR_GAP * 0.12);
    const w  = Math.round(BAR_GAP * 0.76);
    const label = (b.billNo || `B${i+1}`).substring(0, 7);
    return `<rect x="${x}" y="${H - dh}" width="${w}" height="${dh}" fill="rgba(239,68,68,0.35)" rx="3"/>
            <rect x="${x}" y="${H - ph}" width="${w}" height="${ph}" fill="rgba(33,184,135,0.7)" rx="3"/>
            <text x="${x + w/2}" y="${H + 16}" text-anchor="middle" font-size="9" fill="currentColor" opacity="0.65">${escapeText(label)}</text>`;
  }).join('');
  return `<div class="vendor-chart-section">
    <div class="vendor-chart-header">
      <h4>Bills Overview (last ${bills.length})</h4>
      <div class="vendor-chart-legend">
        <span><i style="background:#ef4444;opacity:0.6"></i> Debit</span>
        <span><i style="background:#21b887;opacity:0.8"></i> Paid</span>
      </div>
    </div>
    <div class="vendor-chart-wrap">
      <div class="chart-y-axis">
        <span>Rs ${formatMoney(maxAmt)}</span>
        <span>Rs ${formatMoney(maxAmt / 2)}</span>
        <span>Rs 0</span>
      </div>
      <svg viewBox="0 0 ${W} ${H + 24}" preserveAspectRatio="xMidYMid meet" class="vendor-chart-svg" aria-label="Bills chart">
        ${bars}
        <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="currentColor" stroke-width="1" opacity="0.15"/>
      </svg>
    </div>
  </div>`;
}

function renderVendorPanel(vendor, container) {
  if (!vendor) { container.innerHTML = ''; return; }
  const sum  = vendorSummary(vendor);
  const allBills = vendor.bills || [];
  const adminCols = isAdmin ? '<span>Actions</span>' : '<span></span>';
  const filteredBills = allBills
    .filter((bill) => !vendorLedgerQuery.billNo || (bill.billNo || '').toLowerCase().includes(vendorLedgerQuery.billNo.toLowerCase()))
    .filter((bill) => !vendorLedgerQuery.date || bill.date === vendorLedgerQuery.date)
    .filter((bill) => !vendorLedgerQuery.text || `${bill.particular || ''} ${bill.note || ''}`.toLowerCase().includes(vendorLedgerQuery.text.toLowerCase()))
    .sort((a, b) => vendorLedgerQuery.sort === 'date-asc'
      ? (a.date || '').localeCompare(b.date || '')
      : (b.date || '').localeCompare(a.date || ''))
    .slice(0, 20);
  const billsBody = filteredBills.length
    ? filteredBills.map((b, i) => renderBillRow(b, i + 1, vendor.id)).join('')
    : `<div style="padding:20px;text-align:center;color:var(--muted);font-size:13px;">No bills recorded yet. ${isAdmin ? 'Click <strong>+ Add Bill</strong> to start.' : ''}</div>`;

  container.innerHTML = `
    <div class="vendor-header">
      <div>
        <div class="vendor-name-row">
          <h2 class="vendor-title">${escapeText(vendor.name)}${vendor.category ? `<span class="vendor-category-badge">${escapeText(vendor.category)}</span>` : ''}</h2>
          ${isAdmin ? `<button class="icon-button" data-action="vendor-inline-edit" data-vendor-id="${vendor.id}" aria-label="Edit vendor details" title="Edit vendor details">✎</button>` : ''}
        </div>
        ${vendor.contact ? `<p class="vendor-contact">📞 ${escapeText(vendor.contact)}</p>` : ''}
      </div>
      ${isAdmin ? `<div class="vendor-header-actions">
        <button class="button secondary" style="color:var(--red)" data-action="vendor-delete" data-vendor-id="${vendor.id}">Delete</button>
      </div>` : ''}
    </div>
    ${isAdmin ? `<form class="vendor-inline-form hidden" data-vendor-inline-form data-vendor-id="${vendor.id}">
      <label>Name<input name="name" value="${escapeText(vendor.name)}" required /></label>
      <label>Number<input name="contact" value="${escapeText(vendor.contact || '')}" placeholder="+977-…" /></label>
      <label>Type<input name="category" value="${escapeText(vendor.category || '')}" placeholder="Produce, Dairy…" /></label>
      <label>Color<input name="color" type="color" value="${validVendorColor(vendor.color)}" /></label>
      <div class="inline-form-actions"><button type="submit" class="button primary">Save</button><button type="button" class="button secondary" data-action="vendor-inline-cancel">Cancel</button></div>
    </form>` : ''}

    <div class="vendor-summary-cards">
      <div class="vendor-stat-card"><span class="vsc-label">Total Bills</span><strong class="vsc-value">${sum.count}</strong></div>
      <div class="vendor-stat-card debit"><span class="vsc-label">Total Debit</span><strong class="vsc-value">Rs ${formatMoney(sum.totalDebit)}</strong></div>
      <div class="vendor-stat-card paid"><span class="vsc-label">Total Paid</span><strong class="vsc-value">Rs ${formatMoney(sum.totalPaid)}</strong></div>
      <div class="vendor-stat-card ${sum.outstanding > 0 ? 'outstanding' : 'clear'}"><span class="vsc-label">Outstanding</span><strong class="vsc-value">Rs ${formatMoney(Math.max(0, sum.outstanding))}</strong></div>
    </div>

    <div class="vendor-bills-section">
      <div class="vendor-bills-header">
        <div><h3>Bills &amp; Payments</h3><span class="ledger-count">Showing ${filteredBills.length} of ${allBills.length} bills · max 20 visible</span></div>
        ${isAdmin ? `<button class="button primary" data-action="vendor-add-bill" data-vendor-id="${vendor.id}">+ Add Bill</button>` : ''}
      </div>
      <button type="button" class="vendor-filter-toggle ${vendorFiltersVisible ? 'is-active' : ''}" data-action="vendor-toggle-filters" aria-expanded="${vendorFiltersVisible}" title="Filter bills">
        <img class="filter-icon" src="${vendorFilterIcon}" alt="" aria-hidden="true" /><span>${vendorFiltersVisible ? 'Hide filters' : 'Filter bills'}</span>
      </button>
      <div class="vendor-ledger-filters ${vendorFiltersVisible ? '' : 'hidden'}" role="search">
        <label>Bill no.<input data-ledger-filter="billNo" value="${escapeText(vendorLedgerQuery.billNo)}" placeholder="Search bill no." /></label>
        <label>Date<input data-ledger-filter="date" type="date" value="${escapeText(vendorLedgerQuery.date)}" /></label>
        <label>Item / notes<input data-ledger-filter="text" value="${escapeText(vendorLedgerQuery.text)}" placeholder="Search ledger" /></label>
        <label>Sort<select data-ledger-filter="sort"><option value="date-desc" ${vendorLedgerQuery.sort === 'date-desc' ? 'selected' : ''}>Newest first</option><option value="date-asc" ${vendorLedgerQuery.sort === 'date-asc' ? 'selected' : ''}>Oldest first</option></select></label>
        <button type="button" class="button secondary clear-ledger-filter" data-action="vendor-clear-filters">Clear</button>
      </div>

      <div class="vendor-bills-table">
        <div class="vbt-header" style="grid-template-columns:${vendorColumnTemplate()}">
          ${["S.N", "Bill No.", "Date", "Particular", "Debit", "Paid", "Balance", "Status", isAdmin ? "Actions" : ""].map((label, index) => `<span>${label}<i class="column-resize-handle" data-column-resize="${index}" title="Resize column"></i></span>`).join("")}
        </div>
        ${billsBody}
        <div class="vbt-total-row"><span>Total balance</span><strong>Rs ${formatMoney(Math.max(0, sum.outstanding))}</strong></div>
      </div>

      ${isAdmin ? `
        <div class="vendor-add-bill-form hidden" data-bill-form-wrap>
          <h4>Add New Bill</h4>
          <form data-bill-form data-vendor-id="${vendor.id}">
            <div class="bill-form-grid">
              <label>Bill No. <input id="bill-form-no" placeholder="INV-001" required /></label>
              <label>Date <input id="bill-form-date" type="date" value="${new Date().toISOString().slice(0,10)}" required /></label>
              <label>Particular <input id="bill-form-particular" placeholder="e.g. Vegetable delivery" required /></label>
              <label>Quantity <input id="bill-form-quantity" type="number" min="0.01" step="0.01" value="1" required /></label>
              <label>Rate (Rs) <input id="bill-form-rate" type="number" min="0" step="0.01" required /></label>
              <label>Discount (Rs) <input id="bill-form-discount" type="number" min="0" step="0.01" value="0" /></label>
            </div>
            <div class="bill-form-actions">
              <button type="button" class="button secondary" data-action="vendor-cancel-bill">Cancel</button>
              <button type="submit" class="button primary">Save Bill</button>
            </div>
          </form>
        </div>

      ` : ''}
      ${allBills.length >= 2 ? `<button type="button" class="show-chart-button" data-action="vendor-toggle-chart">${vendorChartVisible ? 'Hide chart' : 'Show chart'}</button>${vendorChartVisible ? renderVendorChart(vendor) : ''}` : ''}
    </div>`;
  container.querySelectorAll(".vbt-cells").forEach((row) => { row.style.gridTemplateColumns = vendorColumnTemplate(); });
  attachVendorColumnResizers(container);

  // Attach payment & bill form submit handlers (dynamically added forms)
  container.querySelector('[data-bill-form]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const vId = ev.target.dataset.vendorId;
    const vendor = vendors.find((v) => v.id === vId);
    if (!vendor) return;
    const bill = {
      id: genId('b'),
      billNo: document.querySelector('#bill-form-no')?.value.trim() || '',
      date: document.querySelector('#bill-form-date')?.value || '',
      particular: document.querySelector('#bill-form-particular')?.value.trim() || '',
      amount: 0,
      note: '',
      items: [{
        id: genId('i'),
        description: document.querySelector('#bill-form-particular')?.value.trim() || '',
        quantity: parseFloat(document.querySelector('#bill-form-quantity')?.value || 0),
        rate: parseFloat(document.querySelector('#bill-form-rate')?.value || 0),
        discount: parseFloat(document.querySelector('#bill-form-discount')?.value || 0)
      }],
      payments: []
    };
    bill.amount = billTotal(bill);
    if (!bill.billNo || !bill.date || !bill.items[0].description || bill.amount <= 0) {
      showToast('Enter a bill number, date, item, and a positive total.'); return;
    }
    vendor.bills.push(bill);
    saveVendors();
    renderVendors();
    showToast('Bill saved.');
  });

  container.querySelector('[data-vendor-inline-form]')?.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const vId = ev.target.dataset.vendorId;
    const v = vendors.find((x) => x.id === vId);
    if (!v) return;
    const form = ev.target;
    v.name = form.elements.name.value.trim() || v.name;
    v.category = form.elements.category.value.trim();
    v.contact = form.elements.contact.value.trim();
    v.color = validVendorColor(form.elements.color.value, v.color);
    saveVendors();
    renderVendors();
    showToast('Vendor updated.');
  });

  container.querySelectorAll('[data-payment-form]').forEach((form) => {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const vId   = form.dataset.vendorId;
      const bId   = form.dataset.billId;
      const vendor = vendors.find((v) => v.id === vId);
      const bill   = vendor?.bills.find((b) => b.id === bId);
      if (!bill) return;
      const dateEl   = form.querySelector(`#pay-date-${bId}`);
      const amtEl    = form.querySelector(`#pay-amount-${bId}`);
      const noteEl   = form.querySelector(`#pay-note-${bId}`);
      const payment = {
        id: genId('p'),
        date: dateEl?.value || new Date().toISOString().slice(0,10),
        amount: parseFloat(amtEl?.value || 0),
        note: noteEl?.value.trim() || ''
      };
      if (!payment.amount || payment.amount <= 0) { showToast('Enter a valid payment amount.'); return; }
      bill.payments.push(payment);
      saveVendors();
      renderVendors();
      expandedBillId = bId; // keep expanded after re-render
      renderVendors();
      showToast('Payment recorded.');
    });
  });

  container.querySelectorAll('[data-ledger-filter]').forEach((control) => {
    control.addEventListener(control.tagName === 'SELECT' ? 'change' : 'input', () => {
      vendorLedgerQuery[control.dataset.ledgerFilter] = control.value;
      renderVendorPanel(vendor, container);
    });
  });

  container.querySelectorAll('[data-inline-bill]').forEach((control) => {
    control.addEventListener('change', () => {
      const row = control.closest('[data-bill-id]');
      const bill = vendor.bills.find((item) => item.id === row?.dataset.billId);
      if (!bill) return;
      bill[control.dataset.inlineBill] = control.value;
      if (control.dataset.inlineBill === 'date') bill.date = control.value;
      saveVendors();
      if (control.dataset.inlineBill === 'note') showToast('Bill note saved.');
    });
  });

  container.querySelectorAll('[data-inline-item]').forEach((control) => {
    control.addEventListener('change', () => {
      const row = control.closest('[data-item-id]');
      const billRow = control.closest('[data-bill-id]');
      const bill = vendor.bills.find((item) => item.id === billRow?.dataset.billId);
      const item = bill?.items.find((entry) => entry.id === row?.dataset.itemId);
      if (!item) return;
      item[control.dataset.inlineItem] = control.dataset.inlineItem === 'description' ? control.value : Math.max(0, Number(control.value) || 0);
      bill.amount = billTotal(bill);
      saveVendors();
      renderVendors();
    });
  });
}

function renderVendors() {
  const page = document.querySelector('[data-view="vendors"]');
  if (!page) return;
  const tabsWrap = page.querySelector('[data-vendor-tabs]');
  const panel    = page.querySelector('[data-vendor-panel]');
  if (!tabsWrap || !panel) return;

  if (!vendors.length) {
    tabsWrap.innerHTML = '';
    panel.innerHTML = `<section class="panel empty-state">
      <div class="empty-icon">◇</div>
      <h2>No vendors yet</h2>
      <p>Add your first vendor to start tracking bills and payments.</p>
      ${isAdmin ? '<button class="button primary" data-action="vendor-new">+ Add Vendor</button>' : ''}
    </section>`;
    return;
  }

  if (!activeVendorId || !vendors.find((v) => v.id === activeVendorId)) {
    activeVendorId = vendors[0].id;
  }
  const activeVendor = vendors.find((v) => v.id === activeVendorId);

  tabsWrap.innerHTML = vendors.map((v, i) => {
    const s = vendorSummary(v);
    const color = validVendorColor(v.color, vendorTabColors[i % vendorTabColors.length]);
    return `<button class="vendor-tab ${v.id === activeVendorId ? 'active' : ''} ${s.outstanding > 0 ? 'has-outstanding' : ''}" style="--vendor-color:${color};" data-vendor-tab="${v.id}">${escapeText(v.name)}</button>`;
  }).join('');

  renderVendorPanel(activeVendor, panel);
}

// Vendor click delegation
document.addEventListener('click', (event) => {
  // Vendor tab switch
  const tab = event.target.closest('[data-vendor-tab]');
  if (tab) { activeVendorId = tab.dataset.vendorTab; expandedBillId = null; renderVendors(); return; }

  // New vendor button
  if (event.target.closest('[data-action="vendor-new"]')) {
    openAddVendorModal(); return;
  }

  // Quick Pay button on bill row (expand bill and focus payment amount)
  const addPayBtn = event.target.closest('[data-action="vendor-add-payment"]');
  if (addPayBtn) {
    const bId = addPayBtn.dataset.billId;
    expandedBillId = bId;
    renderVendors();
    setTimeout(() => {
      document.querySelector(`#pay-amount-${bId}`)?.focus();
    }, 50);
    return;
  }

  // Bill toggle expand/collapse
  const billToggle = event.target.closest('[data-bill-toggle]');
  if (billToggle && !event.target.closest('button') && !event.target.closest('input')) {
    const bId = billToggle.dataset.billToggle;
    expandedBillId = expandedBillId === bId ? null : bId;
    renderVendors(); return;
  }

  // Add bill button
  if (event.target.closest('[data-action="vendor-add-bill"]')) {
    const wrap = document.querySelector('[data-bill-form-wrap]');
    if (wrap) wrap.classList.toggle('hidden'); return;
  }
  if (event.target.closest('[data-action="vendor-cancel-bill"]')) {
    const wrap = document.querySelector('[data-bill-form-wrap]');
    if (wrap) wrap.classList.add('hidden'); return;
  }

  // Inline vendor details editor
  if (event.target.closest('[data-action="vendor-inline-edit"]')) {
    document.querySelector('[data-vendor-inline-form]')?.classList.remove('hidden');
    return;
  }
  if (event.target.closest('[data-action="vendor-inline-cancel"]')) {
    document.querySelector('[data-vendor-inline-form]')?.classList.add('hidden');
    return;
  }

  if (event.target.closest('[data-action="vendor-toggle-filters"]')) {
    vendorFiltersVisible = !vendorFiltersVisible;
    renderVendors();
    return;
  }

  if (event.target.closest('[data-action="vendor-toggle-chart"]')) {
    vendorChartVisible = !vendorChartVisible;
    renderVendors();
    return;
  }

  if (event.target.closest('[data-action="vendor-clear-filters"]')) {
    vendorLedgerQuery = { billNo: '', date: '', text: '', sort: 'date-desc' };
    renderVendors();
    return;
  }

  const addItem = event.target.closest('[data-action="vendor-add-item"]');
  if (addItem) {
    const vendor = vendors.find((item) => item.id === addItem.dataset.vendorId);
    const bill = vendor?.bills.find((item) => item.id === addItem.dataset.billId);
    if (!bill) return;
    bill.items.push({ id: genId('i'), description: 'New item', quantity: 1, rate: 0, discount: 0 });
    bill.amount = billTotal(bill);
    saveVendors();
    expandedBillId = bill.id;
    renderVendors();
    return;
  }

  const delItem = event.target.closest('[data-action="vendor-del-item"]');
  if (delItem) {
    const vendor = vendors.find((item) => item.id === delItem.dataset.vendorId);
    const bill = vendor?.bills.find((item) => item.id === delItem.dataset.billId);
    if (!bill || bill.items.length <= 1) {
      showToast('A bill must keep at least one item.'); return;
    }
    bill.items = bill.items.filter((item) => item.id !== delItem.dataset.itemId);
    bill.amount = billTotal(bill);
    saveVendors();
    expandedBillId = bill.id;
    renderVendors();
    return;
  }

  // Delete vendor
  const delVendor = event.target.closest('[data-action="vendor-delete"]');
  if (delVendor) {
    const vId = delVendor.dataset.vendorId;
    if (!confirm('Delete this vendor and all its bills? This cannot be undone.')) return;
    vendors = vendors.filter((v) => v.id !== vId);
    if (activeVendorId === vId) activeVendorId = vendors[0]?.id || null;
    saveVendors(); renderVendors();
    showToast('Vendor deleted.'); return;
  }

  // Delete bill
  const delBill = event.target.closest('[data-action="vendor-del-bill"]');
  if (delBill) {
    const vId = delBill.dataset.vendorId; const bId = delBill.dataset.billId;
    const vendor = vendors.find((v) => v.id === vId);
    if (!vendor) return;
    if (!confirm('Delete this bill and all its payments?')) return;
    vendor.bills = vendor.bills.filter((b) => b.id !== bId);
    saveVendors(); renderVendors();
    showToast('Bill deleted.'); return;
  }

  // Delete payment
  const delPay = event.target.closest('[data-action="vendor-del-payment"]');
  if (delPay) {
    const vId = delPay.dataset.vendorId; const bId = delPay.dataset.billId; const pId = delPay.dataset.paymentId;
    const vendor = vendors.find((v) => v.id === vId);
    const bill   = vendor?.bills.find((b) => b.id === bId);
    if (!bill) return;
    bill.payments = bill.payments.filter((p) => p.id !== pId);
    saveVendors(); renderVendors();
    showToast('Payment removed.'); return;
  }

  // Add vendor modal (open)
  if (event.target.closest('[data-action="vendor-add"]')) { openAddVendorModal(); return; }
});

function openAddVendorModal() {
  let modal = document.querySelector('[data-add-vendor-modal]');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'add-vendor-modal';
    modal.dataset.addVendorModal = '1';
    modal.innerHTML = `<div class="add-vendor-modal-card">
      <button class="modal-close" data-action="close-add-vendor">×</button>
      <h3>Add Vendor</h3>
      <form data-new-vendor-form>
        <div class="vendor-form-grid">
          <label>Vendor Name <input id="new-vendor-name" required placeholder="e.g. Fresh Farms" /></label>
          <label>Category <input id="new-vendor-category" placeholder="e.g. Produce" /></label>
          <label>Contact <input id="new-vendor-contact" placeholder="+977-…" /></label>
          <label>Tab color <input id="new-vendor-color" type="color" value="${vendorTabColors[vendors.length % vendorTabColors.length]}" /></label>
        </div>
        <div class="bill-form-actions">
          <button type="button" class="button secondary" data-action="close-add-vendor">Cancel</button>
          <button type="submit" class="button primary">Add Vendor</button>
        </div>
      </form>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('[data-new-vendor-form]')?.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const name = document.querySelector('#new-vendor-name')?.value.trim() || '';
      if (!name) return;
      const vendor = {
        id: genId('v'),
        name,
        category: document.querySelector('#new-vendor-category')?.value.trim() || '',
        contact: document.querySelector('#new-vendor-contact')?.value.trim() || '',
        color: validVendorColor(document.querySelector('#new-vendor-color')?.value, vendorTabColors[vendors.length % vendorTabColors.length]),
        bills: []
      };
      vendors.push(vendor);
      activeVendorId = vendor.id;
      saveVendors();
      modal.remove();
      renderVendors();
      showToast(`${name} added as a vendor.`);
    });
  }
  modal.classList.remove('hidden');
}

document.addEventListener('click', (ev) => {
  if (ev.target.closest('[data-action="close-add-vendor"]') || (ev.target.dataset.addVendorModal !== undefined && !ev.target.closest('.add-vendor-modal-card'))) {
    document.querySelector('[data-add-vendor-modal]')?.remove();
  }
});

// ==========================================================================
// --- 11. INITIALIZATION ---
// ==========================================================================
setAdminUi();
renderStaffManager();
renderRoster();
renderCleaningSchedule();
observeRosterSizes();
applyTheme(localStorage.getItem("dashy-theme") || "dark");
renderKathmanduDate();
renderNepaliCalendar();
renderSalesChart("today");
renderDashboardMetrics();
renderDashboardAttendance();
renderUserList();
renderVendors();
updateNetworkStatus();
navigate(window.location.hash.slice(1) || "dashboard");
renderGreeting();
window.setInterval(() => {
  if (qualifyAttendanceRecords()) {
    renderNepaliCalendar();
  }
}, 15000);
