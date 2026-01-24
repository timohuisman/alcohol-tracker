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

// State
let isSignUp = false;
let entries = [];
let realtimeSubscription = null;
const defaultDrinkName = "Bier";
let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth();

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

const updateCalendarTitle = (year, month) => {
  if (calendarTitle) {
    calendarTitle.textContent = formatMonthYear(year, month);
  }
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

const addEntry = async (entry) => {
  if (!supabase) return;

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
    dayTotal.textContent = `${formatNumber(totalForDay)} standaardglazen`;

    removeDayButton.addEventListener("click", () => {
      const shouldDelete = window.confirm(
        `Weet je zeker dat je alle entries van ${formatDate(day)} wilt verwijderen?`
      );
      if (shouldDelete) {
        deleteDayEntries(day);
      }
    });

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
      entryNode.querySelector(
        ".entry-units",
      ).textContent = `${formatNumber(entry.units)} glazen`;
      entryNode.querySelector(".remove-entry").addEventListener("click", () => {
        deleteEntry(entry.id);
      });
      entriesList.appendChild(entryNode);
    });

    dayList.appendChild(node);
  });

  updateInsights(entries);
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

  topDay.textContent = `${formatDate(topEntry.day)} (${formatNumber(
    topEntry.total,
  )})`;
};

// Event listeners
entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  
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
if (supabase) {
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

if (supabase) {
  checkAuth();
} else {
  showAuthModal();
}
})();
