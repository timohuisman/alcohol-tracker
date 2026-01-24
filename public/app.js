
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

const formatNumber = (value) => value.toLocaleString("nl-NL", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const parseStorage = () => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("Kan opgeslagen data niet lezen", error);
    return [];
  }
};

const saveStorage = (entries) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

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

const calculateTotal = (entries) =>
  entries.reduce((sum, entry) => sum + entry.units, 0);

const getColorClass = (drinkCount) => {
  if (drinkCount === 0) return "color-none";
  if (drinkCount <= 2) return "color-low";
  if (drinkCount <= 5) return "color-medium";
  if (drinkCount <= 9) return "color-high";
  return "color-very-high";
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

// Render functies
const renderCalendar = (entries) => {
  const grouped = groupByDay(entries);
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  calendarContainer.innerHTML = "";

  const monthContainer = document.createElement("div");
  monthContainer.className = "calendar-month";

  const monthTitle = document.createElement("h3");
  monthTitle.className = "calendar-month-title";
  monthTitle.textContent = formatMonthYear(currentYear, currentMonth);
  monthContainer.appendChild(monthTitle);

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
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();
  const isCurrentMonth = currentYear === todayYear && currentMonth === todayMonth;

  const allDays = [];

  for (let i = 0; i < firstDay; i++) {
    allDays.push(null);
  }

  const lastDayToShow = isCurrentMonth ? todayDate : daysInMonth;
  for (let day = 1; day <= lastDayToShow; day++) {
    allDays.push(day);
  }

  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    const week = allDays.slice(i, i + 7);
    if (week.some((day) => day !== null)) {
      weeks.push(week);
    }
  }

  weeks.reverse().forEach((week) => {
    week.forEach((day) => {
      if (day === null) {
        const emptyDay = document.createElement("div");
        emptyDay.className = "calendar-day empty";
        grid.appendChild(emptyDay);
      } else {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const dayEntries = grouped[dateStr] || [];
        const drinkCount = calculateTotal(dayEntries);
        const colorClass = getColorClass(drinkCount);

        const dayElement = document.createElement("div");
        dayElement.className = `calendar-day ${colorClass}`;
        dayElement.setAttribute("data-date", dateStr);
        dayElement.setAttribute("title", `${dateStr}: ${formatNumber(drinkCount)} standaardglazen`);

        const dayNumber = document.createElement("div");
        dayNumber.className = "calendar-day-number";
        dayNumber.textContent = day;
        dayElement.appendChild(dayNumber);

        if (drinkCount > 0) {
          const dayCount = document.createElement("div");
          dayCount.className = "calendar-day-count";
          dayCount.textContent = `${formatNumber(drinkCount)}`;
          dayElement.appendChild(dayCount);
        }

        grid.appendChild(dayElement);
      }
    });
  });

  monthContainer.appendChild(grid);
  calendarContainer.appendChild(monthContainer);
};

const render = () => {
  const entries = parseStorage();
  const grouped = groupByDay(entries);
  const days = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

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
      const filtered = entries.filter((entry) => entry.date !== day);
      saveStorage(filtered);
      render();
    });

    dayEntries.forEach((entry) => {
      const entryNode = entryTemplate.content.cloneNode(true);
      entryNode.querySelector(".entry-name").textContent = entry.name;
      entryNode.querySelector(".entry-note").textContent = entry.note
        ? entry.note
        : "Geen opmerking";
      entryNode.querySelector(
        ".entry-units",
      ).textContent = `${formatNumber(entry.units)} glazen`;
      entryNode.querySelector(".remove-entry").addEventListener("click", () => {
        const filtered = entries.filter((item) => item.id !== entry.id);
        saveStorage(filtered);
        render();
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

entryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const entries = parseStorage();
  const newEntry = {
    id: crypto.randomUUID(),
    date: entryDate.value,
    name: entryName.value.trim(),
    units: Number.parseInt(entryUnits.value, 10),
    note: entryNote.value.trim(),
  };

  entries.push(newEntry);
  saveStorage(entries);
  entryForm.reset();
  entryUnits.value = "1";
  entryDate.value = new Date().toISOString().slice(0, 10);
  render();
});

clearData.addEventListener("click", () => {
  const shouldClear = window.confirm(
    "Weet je zeker dat je alle gegevens wilt verwijderen?",
  );
  if (shouldClear) {
    saveStorage([]);
    render();
  }
});

entryDate.value = new Date().toISOString().slice(0, 10);
render();
