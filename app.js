const text = {
  loginNeeded: "\ub85c\uadf8\uc778 \ud544\uc694",
  configured: "\uacf5\uc720 DB \uc5f0\uacb0\ub428",
  setupNeeded: "Supabase URL\uacfc anon key\ub97c config.js\uc5d0 \uba3c\uc800 \ub123\uc5b4\uc8fc\uc138\uc694.",
  signInFailed: "\ub85c\uadf8\uc778\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  signUpDone: "\ud68c\uc6d0\uac00\uc785\uc774 \uc644\ub8cc\ub410\uc2b5\ub2c8\ub2e4. \uc774\uba54\uc77c \ud655\uc778\uc774 \ud544\uc694\ud558\uba74 \uba54\uc77c\ud568\uc744 \ud655\uc778\ud574\uc8fc\uc138\uc694.",
  signUpFailed: "\ud68c\uc6d0\uac00\uc785\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  savingFailed: "\uc800\uc7a5\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  schemaUpdateNeeded: "Supabase DB \uc5c5\ub370\uc774\ud2b8\uac00 \ud544\uc694\ud569\ub2c8\ub2e4. supabase-fix-payer-columns.sql\uc744 SQL Editor\uc5d0\uc11c \uc2e4\ud589\ud55c \ub4a4 1\ubd84 \ud6c4 \ub2e4\uc2dc \uc800\uc7a5\ud574\uc8fc\uc138\uc694.",
  saved: "\uc800\uc7a5\ud588\uc2b5\ub2c8\ub2e4.",
  loadingFailed: "\uae30\ub85d\uc744 \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  signedOut: "\ub85c\uadf8\uc544\uc6c3\ub410\uc2b5\ub2c8\ub2e4.",
  entries: "\uac74",
  none: "\uc544\uc9c1 \uae30\ub85d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
  rowNeeded: "\uc800\uc7a5\ud560 \ud56d\ubaa9\uc744 1\uac1c \uc774\uc0c1 \uc785\ub825\ud574\uc8fc\uc138\uc694.",
  householdMissing: "\uacc4\uc815\uc5d0 \uacf5\uc720 \ucf54\ub4dc\uac00 \uc5c6\uc2b5\ub2c8\ub2e4. \ud68c\uc6d0\uac00\uc785 \ud31d\uc5c5\uc5d0\uc11c \uacf5\uc720 \ucf54\ub4dc\ub97c \uc0dd\uc131\ud55c \uacc4\uc815\uc73c\ub85c \ub85c\uadf8\uc778\ud574\uc8fc\uc138\uc694.",
};

const labels = {
  income: "\uc218\uc785",
  expense: "\uc9c0\ucd9c",
  husband: "\ub0a8\ud3b8",
  wife: "\uc544\ub0b4",
  cash: "\ud604\uae08",
  card: "\uce74\ub4dc",
};

const categories = [
  "\uc2dd\ube44",
  "\uad50\ud1b5",
  "\uc0dd\ud65c",
  "\uc1fc\ud551",
  "\uace0\uc815\ube44",
  "\uae09\uc5ec",
  "\uae30\ud0c0",
];

const config = window.BUDGET_APP_CONFIG ?? {};
const isConfigured =
  config.supabaseUrl &&
  config.supabaseAnonKey &&
  !config.supabaseUrl.includes("YOUR_SUPABASE_URL") &&
  !config.supabaseAnonKey.includes("YOUR_SUPABASE_ANON_KEY");

const supabaseClient = isConfigured
  ? window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

const authPanel = document.querySelector("#authPanel");
const appPanel = document.querySelector("#appPanel");
const setupNotice = document.querySelector("#setupNotice");
const authForm = document.querySelector("#authForm");
const openSignUpButton = document.querySelector("#openSignUpButton");
const signUpDialog = document.querySelector("#signUpDialog");
const signUpForm = document.querySelector("#signUpForm");
const signUpButton = document.querySelector("#signUpButton");
const closeSignUpButton = document.querySelector("#closeSignUpButton");
const signOutButton = document.querySelector("#signOutButton");
const sessionLabel = document.querySelector("#sessionLabel");
const monthSelect = document.querySelector("#monthSelect");
const calendarGrid = document.querySelector("#calendarGrid");
const openEntrySheetButton = document.querySelector("#openEntrySheetButton");
const entrySheet = document.querySelector("#entrySheet");
const closeEntrySheetButton = document.querySelector("#closeEntrySheetButton");
const batchEntryForm = document.querySelector("#batchEntryForm");
const entryRows = document.querySelector("#entryRows");
const addRowButton = document.querySelector("#addRowButton");
const entryList = document.querySelector("#entryList");
const emptyState = document.querySelector("#emptyState");
const entryCount = document.querySelector("#entryCount");
const incomeTotal = document.querySelector("#incomeTotal");
const expenseTotal = document.querySelector("#expenseTotal");
const balanceTotal = document.querySelector("#balanceTotal");
const verifiedDialog = document.querySelector("#verifiedDialog");
const closeVerifiedDialogButton = document.querySelector("#closeVerifiedDialogButton");
const toast = document.querySelector("#toast");

let entries = [];
let session = null;
let householdCode = "";
let selectedMonth = new Date().toISOString().slice(0, 7);
let realtimeChannel = null;

function normalizeHouseholdCode(value) {
  return String(value).trim().toUpperCase().replace(/\s+/g, "-");
}

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.hidden = true;
  }, 8000);
}

function formatWon(value) {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumberInput(value) {
  const digits = String(value).replace(/[^\d]/g, "");
  return digits ? new Intl.NumberFormat("ko-KR").format(Number(digits)) : "";
}

function parseMoney(value) {
  return Number(String(value).replace(/[^\d]/g, ""));
}

function formatSigned(value) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatWon(value)}`;
}

function monthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  return `${year}\ub144 ${Number(month)}\uc6d4`;
}

function addMonths(date, count) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + count);
  return next;
}

function setBusy(form, isBusy) {
  [...form.elements].forEach((element) => {
    element.disabled = isBusy;
  });
}

function parseAuthRedirect() {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const search = new URLSearchParams(window.location.search);
  const type = hash.get("type") || search.get("type");
  return type === "signup" || hash.has("access_token") || search.has("code");
}

function showVerifiedDialog() {
  verifiedDialog.hidden = false;
  window.history.replaceState({}, document.title, window.location.pathname);
}

function populateMonthSelect() {
  const now = new Date();
  monthSelect.innerHTML = "";

  for (let offset = -12; offset <= 12; offset += 1) {
    const date = addMonths(now, offset);
    const value = date.toISOString().slice(0, 7);
    const option = document.createElement("option");
    option.value = value;
    option.textContent = monthLabel(value);
    option.selected = value === selectedMonth;
    monthSelect.append(option);
  }
}

function monthRange(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    year,
    month,
  };
}

function getDayNet(dateKey) {
  return entries
    .filter((entry) => entry.entry_date === dateKey)
    .reduce((total, entry) => {
      return total + (entry.type === "income" ? Number(entry.amount) : -Number(entry.amount));
    }, 0);
}

function renderCalendar() {
  const { year, month } = monthRange(selectedMonth);
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const leading = firstDay.getDay();

  calendarGrid.innerHTML = "";

  for (let i = 0; i < leading; i += 1) {
    const blank = document.createElement("div");
    blank.className = "calendar-day blank";
    calendarGrid.append(blank);
  }

  for (let day = 1; day <= lastDay; day += 1) {
    const dateKey = `${selectedMonth}-${String(day).padStart(2, "0")}`;
    const net = getDayNet(dateKey);
    const cell = document.createElement("button");
    cell.className = "calendar-day";
    cell.type = "button";
    cell.dataset.date = dateKey;
    cell.innerHTML = `
      <span class="day-total ${net < 0 ? "expense" : net > 0 ? "income" : ""}"></span>
      <strong></strong>
    `;
    cell.querySelector(".day-total").textContent = net === 0 ? "" : formatSigned(net);
    cell.querySelector("strong").textContent = day;
    cell.addEventListener("click", () => openEntrySheet(dateKey));
    calendarGrid.append(cell);
  }
}

function renderHistory() {
  entryList.innerHTML = "";
  emptyState.hidden = entries.length > 0;
  emptyState.textContent = text.none;
  entryCount.textContent = `${entries.length}${text.entries}`;

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const signedAmount = entry.type === "income" ? Number(entry.amount) : -Number(entry.amount);
    const payer = labels[entry.payer] ?? entry.payer ?? "";
    const method = labels[entry.payment_method] ?? entry.payment_method ?? "";
    item.className = "entry";
    item.innerHTML = `
      <div>
        <span class="entry-title"></span>
        <span class="entry-meta"></span>
      </div>
      <span class="entry-amount ${entry.type}"></span>
    `;
    item.querySelector(".entry-title").textContent = `${entry.entry_date} · ${entry.title}`;
    item.querySelector(".entry-meta").textContent = `${entry.category} · ${payer} · ${method}`;
    item.querySelector(".entry-amount").textContent = formatSigned(signedAmount);
    entryList.append(item);
  });
}

function render() {
  const income = entries
    .filter((entry) => entry.type === "income")
    .reduce((total, entry) => total + Number(entry.amount), 0);
  const expense = entries
    .filter((entry) => entry.type === "expense")
    .reduce((total, entry) => total + Number(entry.amount), 0);

  incomeTotal.textContent = formatWon(income);
  expenseTotal.textContent = formatWon(expense);
  balanceTotal.textContent = formatWon(income - expense);
  renderCalendar();
  renderHistory();
}

function renderAuthState() {
  const loggedIn = Boolean(session);
  authPanel.hidden = loggedIn;
  appPanel.hidden = !loggedIn;
  signOutButton.hidden = !loggedIn;
  openEntrySheetButton.hidden = !loggedIn;
  sessionLabel.textContent = loggedIn ? `${householdCode} · ${text.configured}` : text.loginNeeded;
}

async function loadEntries() {
  if (!supabaseClient || !householdCode) {
    return;
  }

  const { start, end } = monthRange(selectedMonth);
  const { data, error } = await supabaseClient
    .from("budget_entries")
    .select("*")
    .eq("household_code", householdCode)
    .gte("entry_date", start)
    .lt("entry_date", end)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    showToast(`${text.loadingFailed} ${error.message}`);
    return;
  }

  entries = data ?? [];
  render();
}

function subscribeToEntries() {
  if (!supabaseClient || !householdCode) {
    return;
  }

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel(`budget_entries_${householdCode}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "budget_entries",
        filter: `household_code=eq.${householdCode}`,
      },
      loadEntries,
    )
    .subscribe();
}

async function applySession(nextSession) {
  session = nextSession;
  householdCode = normalizeHouseholdCode(session?.user?.user_metadata?.household_code ?? "");

  if (!session || !householdCode) {
    entries = [];
    renderAuthState();
    render();
    if (session && !householdCode) {
      showToast(text.householdMissing);
    }
    return;
  }

  renderAuthState();
  await loadEntries();
  subscribeToEntries();
}

async function updateHouseholdCode(code) {
  const normalizedCode = normalizeHouseholdCode(code);
  const { error } = await supabaseClient.auth.updateUser({
    data: { household_code: normalizedCode },
  });

  if (error) {
    throw error;
  }

  const { data: refreshed, error: refreshError } = await supabaseClient.auth.refreshSession();
  if (refreshError) {
    throw refreshError;
  }

  await applySession(refreshed.session);
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  await applySession(data.session);
}

async function signUp(email, password, code) {
  const normalizedCode = normalizeHouseholdCode(code);
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectTo,
      data: { household_code: normalizedCode },
    },
  });

  if (error) {
    throw error;
  }

  if (data.session) {
    await applySession(data.session);
  }
}

function openSignUpDialog() {
  signUpDialog.hidden = false;
  signUpForm.reset();
  signUpForm.querySelector("input").focus();
}

function closeSignUpDialog() {
  signUpDialog.hidden = true;
}

function categoryOptions(selected = "\uc2dd\ube44") {
  return categories
    .map((category) => `<option ${category === selected ? "selected" : ""}>${category}</option>`)
    .join("");
}

function createEntryRow(dateValue = `${selectedMonth}-01`) {
  const row = document.createElement("div");
  row.className = "batch-row";
  row.innerHTML = `
    <div class="batch-row-header">
      <strong></strong>
      <button class="small-button remove-row" type="button"></button>
    </div>
    <div class="form-grid">
      <label class="field">
        <span>\ub0a0\uc9dc</span>
        <input name="entryDate" type="date" required />
      </label>
      <label class="field">
        <span>\ud56d\ubaa9</span>
        <input name="title" type="text" placeholder="\uc608: \uc810\uc2ec, \uc7a5\ubcf4\uae30" required />
      </label>
      <label class="field">
        <span>\ub204\uac00</span>
        <select name="payer">
          <option value="husband">\ub0a8\ud3b8</option>
          <option value="wife">\uc544\ub0b4</option>
        </select>
      </label>
      <label class="field">
        <span>\uae08\uc561</span>
        <input name="amount" type="text" inputmode="numeric" placeholder="0" required />
      </label>
      <label class="field">
        <span>\ubd84\ub958</span>
        <select name="category">${categoryOptions()}</select>
      </label>
      <label class="field">
        <span>\uacb0\uc81c</span>
        <select name="paymentMethod">
          <option value="card">\uce74\ub4dc</option>
          <option value="cash">\ud604\uae08</option>
        </select>
      </label>
    </div>
    <div class="segmented compact-segmented" role="group" aria-label="\uac70\ub798 \uc720\ud615">
      <label>
        <input type="radio" name="type-${Date.now()}-${Math.random()}" value="expense" checked />
        <span>\uc9c0\ucd9c</span>
      </label>
      <label>
        <input type="radio" name="type-${Date.now()}-${Math.random()}" value="income" />
        <span>\uc218\uc785</span>
      </label>
    </div>
  `;
  const radios = row.querySelectorAll('input[type="radio"]');
  const radioName = `type-${crypto.randomUUID()}`;
  radios.forEach((radio) => {
    radio.name = radioName;
  });
  row.querySelector(".batch-row-header strong").textContent = `#${entryRows.children.length + 1}`;
  row.querySelector(".remove-row").textContent = "\uc0ad\uc81c";
  row.querySelector('input[name="entryDate"]').value = dateValue;
  row.querySelector('input[name="amount"]').addEventListener("input", (event) => {
    event.target.value = formatNumberInput(event.target.value);
  });
  row.querySelector(".remove-row").addEventListener("click", () => {
    if (entryRows.children.length > 1) {
      row.remove();
      renumberRows();
    }
  });
  return row;
}

function renumberRows() {
  [...entryRows.children].forEach((row, index) => {
    row.querySelector(".batch-row-header strong").textContent = `#${index + 1}`;
  });
}

function resetEntryRows(dateValue = `${selectedMonth}-01`) {
  entryRows.innerHTML = "";
  entryRows.append(createEntryRow(dateValue));
}

function openEntrySheet(dateValue = `${selectedMonth}-${String(new Date().getDate()).padStart(2, "0")}`) {
  const monthPrefix = selectedMonth;
  const safeDate = dateValue.startsWith(monthPrefix) ? dateValue : `${selectedMonth}-01`;
  resetEntryRows(safeDate);
  entrySheet.hidden = false;
  entrySheet.querySelector("input").focus();
}

function closeEntrySheet() {
  entrySheet.hidden = true;
}

function collectRows() {
  return [...entryRows.children].map((row) => {
    const type = row.querySelector('input[type="radio"]:checked').value;
    return {
      household_code: householdCode,
      user_id: session.user.id,
      author_email: session.user.email,
      type,
      entry_date: row.querySelector('input[name="entryDate"]').value,
      title: row.querySelector('input[name="title"]').value.trim(),
      payer: row.querySelector('select[name="payer"]').value,
      amount: parseMoney(row.querySelector('input[name="amount"]').value),
      category: row.querySelector('select[name="category"]').value,
      payment_method: row.querySelector('select[name="paymentMethod"]').value,
    };
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isConfigured) {
    showToast(text.setupNeeded);
    return;
  }

  const formData = new FormData(authForm);
  setBusy(authForm, true);

  try {
    await signIn(formData.get("email"), formData.get("password"));
  } catch (error) {
    showToast(`${text.signInFailed} ${error.message}`);
  } finally {
    setBusy(authForm, false);
  }
});

openSignUpButton.addEventListener("click", openSignUpDialog);
closeSignUpButton.addEventListener("click", closeSignUpDialog);
signUpDialog.addEventListener("click", (event) => {
  if (event.target === signUpDialog) {
    closeSignUpDialog();
  }
});

signUpForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isConfigured) {
    showToast(text.setupNeeded);
    return;
  }

  if (!signUpForm.reportValidity()) {
    return;
  }

  const formData = new FormData(signUpForm);
  setBusy(signUpForm, true);

  try {
    await signUp(formData.get("email"), formData.get("password"), formData.get("householdCode"));
    closeSignUpDialog();
    showToast(text.signUpDone);
  } catch (error) {
    showToast(`${text.signUpFailed} ${error.message}`);
  } finally {
    setBusy(signUpForm, false);
  }
});

monthSelect.addEventListener("change", async () => {
  selectedMonth = monthSelect.value;
  await loadEntries();
});

openEntrySheetButton.addEventListener("click", () => openEntrySheet());
closeEntrySheetButton.addEventListener("click", closeEntrySheet);
entrySheet.addEventListener("click", (event) => {
  if (event.target === entrySheet) {
    closeEntrySheet();
  }
});

addRowButton.addEventListener("click", () => {
  const lastDate =
    entryRows.lastElementChild?.querySelector('input[name="entryDate"]')?.value ?? `${selectedMonth}-01`;
  entryRows.append(createEntryRow(lastDate));
});

batchEntryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!batchEntryForm.reportValidity() || !session) {
    return;
  }

  const rows = collectRows().filter((row) => row.title && row.amount > 0 && row.entry_date);
  if (!rows.length) {
    showToast(text.rowNeeded);
    return;
  }

  setBusy(batchEntryForm, true);
  const { error } = await supabaseClient.from("budget_entries").insert(rows);
  setBusy(batchEntryForm, false);

  if (error) {
    if (
      error.code === "PGRST204" ||
      error.message?.includes("schema cache") ||
      error.message?.includes("'payer' column") ||
      error.message?.includes("'payment_method' column")
    ) {
      showToast(text.schemaUpdateNeeded);
      return;
    }

    showToast(`${text.savingFailed} ${error.message}`);
    return;
  }

  closeEntrySheet();
  showToast(text.saved);
  await loadEntries();
});

signOutButton.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  session = null;
  householdCode = "";
  entries = [];
  renderAuthState();
  render();
  showToast(text.signedOut);
});

closeVerifiedDialogButton.addEventListener("click", () => {
  verifiedDialog.hidden = true;
});

async function boot() {
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  populateMonthSelect();
  setupNotice.hidden = isConfigured;
  renderAuthState();
  render();

  if (!isConfigured) {
    return;
  }

  const cameFromVerification = parseAuthRedirect();
  const { data } = await supabaseClient.auth.getSession();
  await applySession(data.session);

  if (cameFromVerification) {
    showVerifiedDialog();
  }

  supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
    applySession(nextSession);
  });
}

boot();
