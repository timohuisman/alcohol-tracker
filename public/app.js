const STORAGE_KEY = "alcohol-tracker-entries";

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
