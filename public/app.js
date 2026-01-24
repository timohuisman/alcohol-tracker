(() => {
  if (window.__alcoholTrackerInitialized) {
    console.warn('Alcohol Tracker is al geïnitialiseerd; dubbele scriptload genegeerd.');
    return;
  }
  window.__alcoholTrackerInitialized = true;

// Supabase initialisatie
let supabase;

// Controleer of Supabase is geconfigureerd
if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
    typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.error('Supabase is niet geconfigureerd. Vul supabase-config.local.js (lokaal) of supabase-config.js (productie) in met je credentials.');
}

// DOM elementen
const entryForm = document.getElementById("entryForm");
const entryDate = document.getElementById("entryDate");
const entryName = document.getElementById("entryName");
const entryUnits = document.getElementById("entryUnits");
const entryNote = document.getElementById("entryNote");
const dayList = document.getElementById("dayList");
const dayTemplate = document.getElementById("dayTemplate");
const entryTemplate = document.getElementById("entryTemplate");
const todayTotal = document.getElementById("todayTotal");
const averagePerDay = document.getElementById("averagePerDay");
const totalRecorded = document.getElementById("totalRecorded");
const topDay = document.getElementById("topDay");
const clearData = document.getElementById("clearData");
const calendarContainer = document.getElementById("calendarContainer");
const calendarTitle = document.getElementById("calendarTitle");
const calendarPrev = document.getElementById("calendarPrev");
const calendarNext = document.getElementById("calendarNext");
const yearSelect = document.getElementById("yearSelect");
const yearPrev = document.getElementById("yearPrev");
const yearNext = document.getElementById("yearNext");
const yearTotal = document.getElementById("yearTotal");
const yearAverage = document.getElementById("yearAverage");
const yearActiveDays = document.getElementById("yearActiveDays");
const yearActiveDaysTotal = document.getElementById("yearActiveDaysTotal");
const yearTopMonth = document.getElementById("yearTopMonth");
const yearTopDay = document.getElementById("yearTopDay");
const monthSelect = document.getElementById("monthSelect");
const monthYearSelect = document.getElementById("monthYearSelect");
const monthPrev = document.getElementById("monthPrev");
const monthNext = document.getElementById("monthNext");
const monthTotal = document.getElementById("monthTotal");
const monthAverage = document.getElementById("monthAverage");
const monthActiveDays = document.getElementById("monthActiveDays");
const monthActiveDaysTotal = document.getElementById("monthActiveDaysTotal");
const monthTopDay = document.getElementById("monthTopDay");
const monthTopWeekday = document.getElementById("monthTopWeekday");
const monthDelta = document.getElementById("monthDelta");
const monthDeltaSub = document.getElementById("monthDeltaSub");

// Authenticatie elementen
const authModal = document.getElementById("authModal");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const authSubmitBtn = document.getElementById("authSubmitBtn");
const authSwitchBtn = document.getElementById("authSwitchBtn");
const authError = document.getElementById("authError");
const userInfo = document.getElementById("userInfo");
const userEmail = document.getElementById("userEmail");
const logoutBtn = document.getElementById("logoutBtn");
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const quickAddBtn = document.getElementById("quickAddBtn");
const shareLinkBtn = document.getElementById("shareLinkBtn");
const shareLinkWrap = document.getElementById("shareLinkWrap");
const shareLinkInput = document.getElementById("shareLinkInput");
const shareLinkCopy = document.getElementById("shareLinkCopy");
const shareLinkRevoke = document.getElementById("shareLinkRevoke");
const shareBanner = document.getElementById("shareBanner");
const shareLinkStatus = document.getElementById("shareLinkStatus");

// State
let isSignUp = false;
let entries = [];
let realtimeSubscription = null;
const defaultDrinkName = "Bier";
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();
const shareToken = new URLSearchParams(window.location.search).get("share");
const isShareMode = Boolean(shareToken);
let selectedYear = new Date().getFullYear();
let selectedMonth = new Date().getMonth();
let selectedMonthYear = new Date().getFullYear();

// Utility functies
const formatNumber = (value) => value.toLocaleString("nl-NL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const groupByDay = (entries) => {
  return entries.reduce((acc, entry) => {
    if (!acc[entry.date]) {
      acc[entry.date] = [];
    }
    acc[entry.date].push(entry);
    return acc;
  }, {});
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const getLocalDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateTotal = (entries) =>
  entries.reduce((sum, entry) => sum + entry.units, 0);

const getColorClass = (drinkCount) => {
  if (drinkCount === 0) return "color-none";
  if (drinkCount >= 12) return "color-12";
  return `color-${drinkCount}`;
};

const getDaysInMonth = (year, month) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year, month) => {
  const day = new Date(year, month, 1).getDay();
  return (day + 6) % 7; // Converteer zondag=0 naar maandag=0
};

const formatMonthYear = (year, month) => {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString("nl-NL", {
    month: "long",
    year: "numeric",
  });
};

const formatDateString = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const formatMonthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString("nl-NL", { month: "long" });

const formatMonthOptionLabel = (monthIndex) =>
  new Date(2020, monthIndex, 1).toLocaleDateString("nl-NL", { month: "long" });

const getDaysInYear = (year) => {
  const isLeap = new Date(year, 1, 29).getDate() === 29;
  return isLeap ? 366 : 365;
};

const getElapsedDaysInYear = (year) => {
  const now = new Date();
  if (year !== now.getFullYear()) {
    return getDaysInYear(year);
  }
  const startOfYear = new Date(year, 0, 1);
  const diffMs = now.setHours(0, 0, 0, 0) - startOfYear.getTime();
  return Math.floor(diffMs / 86400000) + 1;
};

const getElapsedDaysInMonth = (year, month) => {
  const now = new Date();
  if (year === now.getFullYear() && month === now.getMonth()) {
    return now.getDate();
  }
  return getDaysInMonth(year, month);
};

const applyDrinkCountStyling = () => {
  [
    todayTotal,
    averagePerDay,
    totalRecorded,
    yearTotal,
    yearAverage,
    monthTotal,
    monthAverage,
  ].forEach((element) => {
    if (element) element.classList.add("drink-count");
  });
};

const updateCalendarTitle = (year, month) => {
  if (calendarTitle) {
    calendarTitle.textContent = formatMonthYear(year, month);
  }
};

const getAvailableYears = (entries) => {
  const years = new Set();
  entries.forEach((entry) => {
    if (entry?.date) {
      years.add(Number(entry.date.slice(0, 4)));
    }
  });
  if (!years.size) {
    years.add(new Date().getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
};

const updateYearOptions = (years) => {
  if (!yearSelect) return;
  yearSelect.innerHTML = "";
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    yearSelect.appendChild(option);
  });
};

const updateYearControls = (years) => {
  if (!yearSelect) return;
  if (!years.includes(selectedYear)) {
    selectedYear = years[0];
  }
  yearSelect.value = String(selectedYear);
  if (yearPrev) {
    yearPrev.disabled = selectedYear <= years[years.length - 1];
  }
  if (yearNext) {
    yearNext.disabled = selectedYear >= years[0];
  }
};

const updateMonthOptions = () => {
  if (!monthSelect) return;
  monthSelect.innerHTML = "";
  for (let i = 0; i < 12; i += 1) {
    const option = document.createElement("option");
    option.value = String(i);
    option.textContent = formatMonthOptionLabel(i);
    monthSelect.appendChild(option);
  }
};

const updateMonthYearOptions = (years) => {
  if (!monthYearSelect) return;
  monthYearSelect.innerHTML = "";
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = String(year);
    monthYearSelect.appendChild(option);
  });
};

const updateMonthControls = (years) => {
  if (!monthSelect || !monthYearSelect) return;
  if (!years.includes(selectedMonthYear)) {
    selectedMonthYear = years[0];
  }
  monthSelect.value = String(selectedMonth);
  monthYearSelect.value = String(selectedMonthYear);
  const minYear = years[years.length - 1];
  const maxYear = years[0];
  const isAtMin = selectedMonthYear === minYear && selectedMonth === 0;
  const isAtMax = selectedMonthYear === maxYear && selectedMonth === 11;
  if (monthPrev) monthPrev.disabled = isAtMin;
  if (monthNext) monthNext.disabled = isAtMax;
};

const renderYearOverview = (entries) => {
  if (
    !yearSelect
    || !yearTotal
    || !yearAverage
    || !yearActiveDays
    || !yearActiveDaysTotal
    || !yearTopMonth
    || !yearTopDay
  ) return;

  const grouped = groupByDay(entries);
  const daysInYear = Object.keys(grouped).filter((dateStr) => dateStr.startsWith(`${selectedYear}-`));
  const dayTotals = daysInYear.map((date) => ({
    date,
    total: calculateTotal((grouped[date] || []).filter((entry) => Number.isFinite(entry.units))),
  }));
  const yearEntries = dayTotals.flatMap((day) =>
    (grouped[day.date] || []).filter((entry) => Number.isFinite(entry.units)),
  );
  const total = calculateTotal(yearEntries);
  const activeDays = dayTotals.filter((day) => day.total > 0).length;
  const average = activeDays ? total / activeDays : 0;
  const daysInSelectedYear = getElapsedDaysInYear(selectedYear);
  const activePercentage = daysInSelectedYear
    ? Math.round((activeDays / daysInSelectedYear) * 100)
    : 0;

  const monthTotals = Array.from({ length: 12 }, () => 0);
  yearEntries.forEach((entry) => {
    const month = Number(entry.date.slice(5, 7)) - 1;
    if (month >= 0 && month < 12) {
      monthTotals[month] += entry.units;
    }
  });

  let topMonthIndex = -1;
  let topMonthTotal = 0;
  monthTotals.forEach((value, index) => {
    if (value > topMonthTotal) {
      topMonthTotal = value;
      topMonthIndex = index;
    }
  });

  yearTotal.textContent = formatNumber(total || 0);
  yearAverage.textContent = formatNumber(average || 0);
  yearActiveDays.innerHTML = `${formatNumber(activeDays || 0)} / <span class="insight-subtle">${formatNumber(daysInSelectedYear)}</span>`;
  yearActiveDaysTotal.textContent = `${activePercentage}% van het jaar`;
  if (topMonthIndex >= 0 && topMonthTotal > 0) {
    yearTopMonth.innerHTML = `${formatMonthLabel(selectedYear, topMonthIndex)} (<span class="drink-count">${formatNumber(topMonthTotal)}</span>)`;
  } else {
    yearTopMonth.textContent = "-";
  }

  if (activeDays) {
    const topDay = dayTotals
      .slice()
      .sort((a, b) => b.total - a.total)[0];
    yearTopDay.innerHTML = `${formatDate(topDay.date)} (<span class="drink-count">${formatNumber(topDay.total)}</span>)`;
  } else {
    yearTopDay.textContent = "-";
  }
};

const renderMonthOverview = (entries) => {
  if (
    !monthSelect
    || !monthYearSelect
    || !monthTotal
    || !monthAverage
    || !monthActiveDays
    || !monthActiveDaysTotal
    || !monthTopDay
    || !monthTopWeekday
    || !monthDelta
    || !monthDeltaSub
  ) return;

  const monthKey = `${selectedMonthYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  const grouped = groupByDay(entries);
  const daysInMonth = Object.keys(grouped).filter((dateStr) => dateStr.startsWith(`${monthKey}-`));
  const dayTotals = daysInMonth.map((date) => ({
    date,
    total: calculateTotal((grouped[date] || []).filter((entry) => Number.isFinite(entry.units))),
  }));
  const monthEntries = dayTotals.flatMap((day) =>
    (grouped[day.date] || []).filter((entry) => Number.isFinite(entry.units)),
  );
  const total = calculateTotal(monthEntries);
  const activeDays = dayTotals.filter((day) => day.total > 0).length;
  const average = activeDays ? total / activeDays : 0;
  const daysInSelectedMonth = getElapsedDaysInMonth(selectedMonthYear, selectedMonth);
  const activePercentage = daysInSelectedMonth
    ? Math.round((activeDays / daysInSelectedMonth) * 100)
    : 0;

  const weekdayTotals = Array.from({ length: 7 }, () => 0);
  dayTotals.forEach((day) => {
    if (day.total <= 0) return;
    const dateObj = new Date(day.date);
    if (Number.isNaN(dateObj.getTime())) return;
    const mondayIndex = (dateObj.getDay() + 6) % 7;
    weekdayTotals[mondayIndex] += day.total;
  });
  let topWeekdayIndex = -1;
  let topWeekdayTotal = 0;
  weekdayTotals.forEach((value, index) => {
    if (value > topWeekdayTotal) {
      topWeekdayTotal = value;
      topWeekdayIndex = index;
    }
  });

  const prevMonthDate = new Date(selectedMonthYear, selectedMonth - 1, 1);
  const prevKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const prevDays = Object.keys(grouped).filter((dateStr) => dateStr.startsWith(`${prevKey}-`));
  const prevTotal = calculateTotal(
    prevDays.flatMap((date) =>
      (grouped[date] || []).filter((entry) => Number.isFinite(entry.units)),
    ),
  );
  const delta = total - prevTotal;
  const deltaPercentage = prevTotal ? Math.round((delta / prevTotal) * 100) : null;

  monthTotal.textContent = formatNumber(total || 0);
  monthAverage.textContent = formatNumber(average || 0);
  monthActiveDays.innerHTML = `${formatNumber(activeDays || 0)} / <span class="insight-subtle">${formatNumber(daysInSelectedMonth)}</span>`;
  monthActiveDaysTotal.textContent = `${activePercentage}% van de maand`;
  if (activeDays) {
    const topDay = dayTotals
      .slice()
      .sort((a, b) => b.total - a.total)[0];
    monthTopDay.innerHTML = `${formatDate(topDay.date)} (<span class="drink-count">${formatNumber(topDay.total)}</span>)`;
  } else {
    monthTopDay.textContent = "-";
  }
  if (topWeekdayIndex >= 0 && topWeekdayTotal > 0) {
    const weekdayName = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"][topWeekdayIndex];
    monthTopWeekday.innerHTML = `${weekdayName} (<span class="drink-count">${formatNumber(topWeekdayTotal)}</span>)`;
  } else {
    monthTopWeekday.textContent = "-";
  }
  if (prevTotal || total) {
    const sign = delta > 0 ? "+" : "";
    monthDelta.innerHTML = `${sign}<span class="drink-count">${formatNumber(delta)}</span>`;
    if (deltaPercentage === null) {
      monthDeltaSub.textContent = "Geen data vorige maand";
    } else {
      const percentSign = deltaPercentage > 0 ? "+" : "";
      monthDeltaSub.textContent = `${percentSign}${deltaPercentage}% t.o.v. vorige maand`;
    }
  } else {
    monthDelta.textContent = "-";
    monthDeltaSub.textContent = "";
  }
};

const buildShareUrl = (token) => {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?share=${token}`;
};

const setReadOnlyUI = () => {
  document.body.classList.add("read-only");
  if (shareBanner) shareBanner.style.display = "block";
  if (authModal) authModal.style.display = "none";
  if (entryForm) {
    const entryCard = entryForm.closest(".card");
    if (entryCard) entryCard.style.display = "none";
  }
  if (quickAddBtn) quickAddBtn.style.display = "none";
  if (clearData) clearData.style.display = "none";
};

const showShareLink = (token) => {
  if (!shareLinkWrap || !shareLinkInput) return;
  if (shareLinkStatus) shareLinkStatus.style.display = "none";
  shareLinkInput.value = buildShareUrl(token);
  shareLinkWrap.style.display = "grid";
};

const generateShareToken = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  if (window.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
};

// Authenticatie functies
const showAuthError = (message) => {
  authError.textContent = message;
  authError.style.display = 'block';
};

const hideAuthError = () => {
  authError.style.display = 'none';
};

const showAuthModal = () => {
  authModal.style.display = 'flex';
  authEmail.focus();
};

const hideAuthModal = () => {
  authModal.style.display = 'none';
  authForm.reset();
  hideAuthError();
};

const checkAuth = async () => {
  if (isShareMode) return;
  if (!supabase) {
    showAuthModal();
    return;
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (session) {
    // Gebruiker is ingelogd
    userEmail.textContent = session.user.email;
    userInfo.style.display = 'flex';
    hideAuthModal();
    await loadEntries();
    await setupRealtime();
  } else {
    // Gebruiker is niet ingelogd
    userInfo.style.display = 'none';
    showAuthModal();
  }
};

const handleAuth = async (e) => {
  e.preventDefault();
  hideAuthError();

  if (!supabase) {
    showAuthError('Supabase is niet geconfigureerd. Controleer supabase-config.local.js of supabase-config.js');
    return;
  }

  const email = authEmail.value.trim();
  const password = authPassword.value.trim();

  if (!email || !password) {
    showAuthError('Vul email en wachtwoord in');
    return;
  }

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = isSignUp ? 'Registreren...' : 'Inloggen...';

  try {
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user && !data.session) {
        showAuthError('Controleer je email voor de verificatielink');
      } else {
        hideAuthModal();
        await checkAuth();
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      hideAuthModal();
      await checkAuth();
    }
  } catch (error) {
    showAuthError(error.message || 'Er is een fout opgetreden');
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isSignUp ? 'Registreer' : 'Inloggen';
  }
};

const handleLogout = async () => {
  if (realtimeSubscription) {
    await supabase.removeChannel(realtimeSubscription);
    realtimeSubscription = null;
  }

  await supabase.auth.signOut();
  entries = [];
  render();
  checkAuth();
};

const toggleNavMenu = () => {
  if (!navMenu || !navToggle) return;
  const isOpen = navMenu.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
};

const switchAuthMode = () => {
  isSignUp = !isSignUp;
  authSubmitBtn.textContent = isSignUp ? 'Registreer' : 'Inloggen';
  authSwitchBtn.textContent = isSignUp 
    ? 'Al een account? Log in' 
    : 'Nog geen account? Registreer';
  hideAuthError();
};

// Supabase data functies
const loadEntries = async () => {
  if (!supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    entries = data || [];
    render();
  } catch (error) {
    console.error('Fout bij laden entries:', error);
    showAuthError('Kon gegevens niet laden: ' + error.message);
  }
};

const loadSharedEntries = async () => {
  if (!supabase) return;

  try {
    const { data, error } = await supabase
      .rpc('get_shared_entries', { share_token: shareToken });

    if (error) throw error;

    entries = data || [];
    render();
  } catch (error) {
    console.error('Fout bij laden gedeelde entries:', error);
    if (shareBanner) {
      shareBanner.textContent = `Kon gedeelde data niet laden: ${error.message}`;
      shareBanner.style.display = "block";
    }
  }
};

const createShareLink = async () => {
  if (!supabase) return;

  try {
    if (shareLinkStatus) {
      shareLinkStatus.textContent = "";
      shareLinkStatus.style.display = "none";
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showAuthModal();
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('share_links')
      .select('token')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (existing && existing.token) {
      showShareLink(existing.token);
      return;
    }

    const token = generateShareToken();
    const { data, error } = await supabase
      .from('share_links')
      .insert([{ user_id: session.user.id, token }])
      .select('token')
      .single();

    if (error) throw error;

    showShareLink(data.token);
  } catch (error) {
    console.error('Fout bij maken share link:', error);
    if (shareLinkStatus) {
      shareLinkStatus.textContent = `Kon deel-link niet maken: ${error.message}`;
      shareLinkStatus.style.display = "block";
    } else {
      showAuthError('Kon deel-link niet maken: ' + error.message);
    }
  }
};

const revokeShareLink = async () => {
  if (!supabase) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showAuthModal();
      return;
    }

    const { data: existing, error: existingError } = await supabase
      .from('share_links')
      .select('id')
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    if (!existing) {
      if (shareLinkStatus) {
        shareLinkStatus.textContent = "Er is geen actieve deel-link om in te trekken.";
        shareLinkStatus.style.display = "block";
      }
      return;
    }

    const { error } = await supabase
      .from('share_links')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', existing.id);

    if (error) throw error;

    if (shareLinkWrap) shareLinkWrap.style.display = "none";
    if (shareLinkStatus) {
      shareLinkStatus.textContent = "Deel-link ingetrokken.";
      shareLinkStatus.style.display = "block";
    }
  } catch (error) {
    console.error('Fout bij intrekken share link:', error);
    if (shareLinkStatus) {
      shareLinkStatus.textContent = `Kon deel-link niet intrekken: ${error.message}`;
      shareLinkStatus.style.display = "block";
    }
  }
};

const addEntry = async (entry) => {
  if (!supabase) return;
  if (isShareMode) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      showAuthModal();
      return;
    }

    const { data, error } = await supabase
      .from('entries')
      .insert([{
        user_id: session.user.id,
        date: entry.date,
        name: entry.name,
        units: entry.units,
        note: entry.note || null,
      }])
      .select()
      .single();

    if (error) throw error;

    // Entry wordt automatisch toegevoegd via realtime subscription
    // Maar we kunnen het ook direct toevoegen voor snellere feedback
    entries.unshift(data);
    render();
  } catch (error) {
    console.error('Fout bij toevoegen entry:', error);
    showAuthError('Kon entry niet toevoegen: ' + error.message);
  }
};

const deleteEntry = async (entryId) => {
  if (!supabase) return;
  if (isShareMode) return;

  try {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;

    // Entry wordt automatisch verwijderd via realtime subscription
    entries = entries.filter(e => e.id !== entryId);
    render();
  } catch (error) {
    console.error('Fout bij verwijderen entry:', error);
    showAuthError('Kon entry niet verwijderen: ' + error.message);
  }
};

const deleteDayEntries = async (date) => {
  if (!supabase) return;
  if (isShareMode) return;

  try {
    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('date', date);

    if (error) throw error;

    // Entries worden automatisch verwijderd via realtime subscription
    entries = entries.filter(e => e.date !== date);
    render();
  } catch (error) {
    console.error('Fout bij verwijderen dag:', error);
    showAuthError('Kon dag niet verwijderen: ' + error.message);
  }
};

const clearAllEntries = async () => {
  if (!supabase) return;
  if (isShareMode) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('entries')
      .delete()
      .eq('user_id', session.user.id);

    if (error) throw error;

    entries = [];
    render();
  } catch (error) {
    console.error('Fout bij wissen alle entries:', error);
    showAuthError('Kon gegevens niet wissen: ' + error.message);
  }
};

// Real-time synchronisatie
const setupRealtime = async () => {
  if (!supabase || realtimeSubscription) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  realtimeSubscription = supabase
    .channel('entries-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'entries',
        filter: `user_id=eq.${session.user.id}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          entries.unshift(payload.new);
          render();
        } else if (payload.eventType === 'UPDATE') {
          const index = entries.findIndex(e => e.id === payload.new.id);
          if (index !== -1) {
            entries[index] = payload.new;
            render();
          }
        } else if (payload.eventType === 'DELETE') {
          entries = entries.filter(e => e.id !== payload.old.id);
          render();
        }
      }
    )
    .subscribe();
};

// Render functies
const renderCalendar = (entries) => {
  const grouped = groupByDay(entries);
  const currentYear = calendarYear;
  const currentMonth = calendarMonth;

  calendarContainer.innerHTML = "";

  const monthContainer = document.createElement("div");
  monthContainer.className = "calendar-month";

  if (!calendarTitle) {
    const monthTitle = document.createElement("h3");
    monthTitle.className = "calendar-month-title";
    monthTitle.textContent = formatMonthYear(currentYear, currentMonth);
    monthContainer.appendChild(monthTitle);
  } else {
    updateCalendarTitle(currentYear, currentMonth);
  }

  const weekdayHeader = document.createElement("div");
  weekdayHeader.className = "calendar-header";
  const weekdays = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];
  weekdays.forEach((day) => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "calendar-weekday";
    dayHeader.textContent = day;
    weekdayHeader.appendChild(dayHeader);
  });
  monthContainer.appendChild(weekdayHeader);

  const grid = document.createElement("div");
  grid.className = "calendar-grid";

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
  const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
  const nextMonthDate = new Date(currentYear, currentMonth + 1, 1);
  const daysInPrevMonth = getDaysInMonth(prevMonthDate.getFullYear(), prevMonthDate.getMonth());

  const allDays = [];

  for (let i = 0; i < firstDay; i++) {
    const day = daysInPrevMonth - firstDay + 1 + i;
    allDays.push({
      year: prevMonthDate.getFullYear(),
      month: prevMonthDate.getMonth(),
      day,
      inCurrentMonth: false,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    allDays.push({
      year: currentYear,
      month: currentMonth,
      day,
      inCurrentMonth: true,
    });
  }

  const trailingDays = (7 - (allDays.length % 7)) % 7;
  for (let i = 1; i <= trailingDays; i++) {
    allDays.push({
      year: nextMonthDate.getFullYear(),
      month: nextMonthDate.getMonth(),
      day: i,
      inCurrentMonth: false,
    });
  }

  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const week = allDays.slice(i, i + 7);
    if (week.some((day) => day !== null)) {
      weeks.push(week);
    }
  }

  weeks.forEach((week) => {
    week.forEach((dayInfo) => {
      const dateStr = formatDateString(dayInfo.year, dayInfo.month, dayInfo.day);
      const dayEntries = grouped[dateStr] || [];
      const drinkCount = calculateTotal(dayEntries);
      const colorClass = getColorClass(drinkCount);

      const dayElement = document.createElement("div");
      dayElement.className = `calendar-day ${colorClass} ${dayInfo.inCurrentMonth ? "" : "out-month"}`.trim();
      dayElement.setAttribute("data-date", dateStr);
      dayElement.setAttribute("title", `${dateStr}: ${formatNumber(drinkCount)} standaardglazen`);

      const dayNumber = document.createElement("div");
      dayNumber.className = "calendar-day-number";
      dayNumber.textContent = dayInfo.day;
      dayElement.appendChild(dayNumber);

      if (drinkCount > 0) {
        const dayCount = document.createElement("div");
        dayCount.className = "calendar-day-count";
        dayCount.textContent = `${formatNumber(drinkCount)}`;
        dayElement.appendChild(dayCount);
      }

      grid.appendChild(dayElement);
    });
  });

  monthContainer.appendChild(grid);
  calendarContainer.appendChild(monthContainer);
};

const changeCalendarMonth = (offset) => {
  const nextDate = new Date(calendarYear, calendarMonth + offset, 1);
  calendarYear = nextDate.getFullYear();
  calendarMonth = nextDate.getMonth();
  renderCalendar(entries);
};

const render = () => {
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));
  const today = getLocalDateString();

  dayList.innerHTML = "";

  days.forEach((day) => {
    const dayEntries = grouped[day];
    const totalForDay = calculateTotal(dayEntries);
    const node = dayTemplate.content.cloneNode(true);
    const dayTitle = node.querySelector(".day-title");
    const dayTotal = node.querySelector(".day-total");
    const entriesList = node.querySelector(".day-entries");
    const removeDayButton = node.querySelector(".remove-day");

    dayTitle.textContent = formatDate(day);
    dayTotal.innerHTML = `<span class="drink-count">${formatNumber(totalForDay)}</span> standaardglazen`;

    if (isShareMode) {
      removeDayButton.style.display = "none";
    } else {
      removeDayButton.addEventListener("click", () => {
        const shouldDelete = window.confirm(
          `Weet je zeker dat je alle entries van ${formatDate(day)} wilt verwijderen?`
        );
        if (shouldDelete) {
          deleteDayEntries(day);
        }
      });
    }

    dayEntries.forEach((entry) => {
      const entryNode = entryTemplate.content.cloneNode(true);
      entryNode.querySelector(".entry-name").textContent = entry.name;
      entryNode.querySelector(".entry-note").textContent = entry.note
        ? entry.note
        : "Geen opmerking";
      const timeNode = entryNode.querySelector(".entry-time");
      if (day === today && entry.created_at) {
        timeNode.textContent = formatTime(entry.created_at);
      } else {
        timeNode.textContent = "";
        timeNode.style.display = "none";
      }
      const entryUnitsNode = entryNode.querySelector(".entry-units");
      entryUnitsNode.innerHTML = `<span class="drink-count">${formatNumber(entry.units)}</span> glazen`;
      const removeEntryButton = entryNode.querySelector(".remove-entry");
      if (isShareMode) {
        removeEntryButton.style.display = "none";
      } else {
        removeEntryButton.addEventListener("click", () => {
          deleteEntry(entry.id);
        });
      }
      entriesList.appendChild(entryNode);
    });

    dayList.appendChild(node);
  });

  updateInsights(entries);
  const availableYears = getAvailableYears(entries);
  updateYearOptions(availableYears);
  updateYearControls(availableYears);
  renderYearOverview(entries);
  updateMonthOptions();
  updateMonthYearOptions(availableYears);
  updateMonthControls(availableYears);
  renderMonthOverview(entries);
  renderCalendar(entries);
};

const updateInsights = (entries) => {
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped);
  const total = calculateTotal(entries);
  const average = days.length ? total / days.length : 0;
  const today = new Date().toISOString().slice(0, 10);
  const todayEntries = grouped[today] || [];
  const todayCount = calculateTotal(todayEntries);

  todayTotal.textContent = formatNumber(todayCount || 0);
  averagePerDay.textContent = formatNumber(average || 0);
  totalRecorded.textContent = formatNumber(total || 0);

  if (!days.length) {
    topDay.textContent = "-";
    return;
  }

  const topEntry = days
    .map((day) => ({ day, total: calculateTotal(grouped[day]) }))
    .sort((a, b) => b.total - a.total)[0];

  topDay.innerHTML = `${formatDate(topEntry.day)} (<span class="drink-count">${formatNumber(
    topEntry.total,
  )}</span>)`;
};

// Event listeners
entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (isShareMode) return;
  
  if (!supabase) {
    showAuthModal();
    return;
  }

  const newEntry = {
    date: entryDate.value,
    name: entryName.value.trim(),
    units: Number.parseInt(entryUnits.value, 10),
    note: entryNote.value.trim(),
  };

  await addEntry(newEntry);
  entryForm.reset();
  entryName.value = defaultDrinkName;
  entryUnits.value = "1";
  entryDate.value = getLocalDateString();
});

clearData.addEventListener("click", () => {
  if (isShareMode) return;
  const shouldClear = window.confirm(
    "Weet je zeker dat je alle gegevens wilt verwijderen?",
  );
  if (shouldClear) {
    clearAllEntries();
  }
});

authForm.addEventListener("submit", handleAuth);
authSwitchBtn.addEventListener("click", switchAuthMode);
logoutBtn.addEventListener("click", handleLogout);
if (shareLinkBtn) {
  shareLinkBtn.addEventListener("click", createShareLink);
}
if (shareLinkCopy) {
  shareLinkCopy.addEventListener("click", async () => {
    if (!shareLinkInput) return;
    try {
      await navigator.clipboard.writeText(shareLinkInput.value);
      shareLinkCopy.textContent = "Gekopieerd";
      setTimeout(() => {
        shareLinkCopy.textContent = "Kopieer";
      }, 1500);
    } catch (error) {
      shareLinkInput.select();
    }
  });
}
if (shareLinkRevoke) {
  shareLinkRevoke.addEventListener("click", revokeShareLink);
}
if (yearSelect) {
  yearSelect.addEventListener("change", () => {
    selectedYear = Number(yearSelect.value);
    renderYearOverview(entries);
    const availableYears = getAvailableYears(entries);
    updateYearControls(availableYears);
  });
}
if (yearPrev) {
  yearPrev.addEventListener("click", () => {
    const availableYears = getAvailableYears(entries);
    const minYear = availableYears[availableYears.length - 1];
    if (selectedYear > minYear) {
      selectedYear -= 1;
      updateYearControls(availableYears);
      renderYearOverview(entries);
    }
  });
}
if (yearNext) {
  yearNext.addEventListener("click", () => {
    const availableYears = getAvailableYears(entries);
    const maxYear = availableYears[0];
    if (selectedYear < maxYear) {
      selectedYear += 1;
      updateYearControls(availableYears);
      renderYearOverview(entries);
    }
  });
}
if (monthSelect) {
  monthSelect.addEventListener("change", () => {
    selectedMonth = Number(monthSelect.value);
    const availableYears = getAvailableYears(entries);
    updateMonthControls(availableYears);
    renderMonthOverview(entries);
  });
}
if (monthYearSelect) {
  monthYearSelect.addEventListener("change", () => {
    selectedMonthYear = Number(monthYearSelect.value);
    const availableYears = getAvailableYears(entries);
    updateMonthControls(availableYears);
    renderMonthOverview(entries);
  });
}
if (monthPrev) {
  monthPrev.addEventListener("click", () => {
    const availableYears = getAvailableYears(entries);
    const minYear = availableYears[availableYears.length - 1];
    if (selectedMonth === 0) {
      if (selectedMonthYear > minYear) {
        selectedMonthYear -= 1;
        selectedMonth = 11;
      }
    } else {
      selectedMonth -= 1;
    }
    updateMonthControls(availableYears);
    renderMonthOverview(entries);
  });
}
if (monthNext) {
  monthNext.addEventListener("click", () => {
    const availableYears = getAvailableYears(entries);
    const maxYear = availableYears[0];
    if (selectedMonth === 11) {
      if (selectedMonthYear < maxYear) {
        selectedMonthYear += 1;
        selectedMonth = 0;
      }
    } else {
      selectedMonth += 1;
    }
    updateMonthControls(availableYears);
    renderMonthOverview(entries);
  });
}
if (calendarPrev) {
  calendarPrev.addEventListener("click", () => changeCalendarMonth(-1));
}
if (calendarNext) {
  calendarNext.addEventListener("click", () => changeCalendarMonth(1));
}
if (navToggle) {
  navToggle.addEventListener("click", toggleNavMenu);
}
if (quickAddBtn) {
  quickAddBtn.addEventListener("click", async () => {
    if (isShareMode) return;
    const today = getLocalDateString();
    await addEntry({
      date: today,
      name: defaultDrinkName,
      units: 1,
      note: "",
    });
  });
}

// Auth state listener
if (supabase && !isShareMode) {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
      checkAuth();
    } else if (event === 'SIGNED_OUT') {
      if (realtimeSubscription) {
        supabase.removeChannel(realtimeSubscription);
        realtimeSubscription = null;
      }
      entries = [];
      render();
      checkAuth();
    }
  });
}

// Initialisatie
entryDate.value = getLocalDateString();
entryName.value = defaultDrinkName;
applyDrinkCountStyling();

if (isShareMode) {
  setReadOnlyUI();
  if (supabase) {
    loadSharedEntries();
  } else if (shareBanner) {
    shareBanner.textContent = "Supabase is niet geconfigureerd.";
    shareBanner.style.display = "block";
  }
} else if (supabase) {
  checkAuth();
} else {
  showAuthModal();
}
})();
