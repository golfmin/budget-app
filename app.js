const text = {
  loginNeeded: "\ub85c\uadf8\uc778 \ud544\uc694",
  configured: "\uacf5\uc720 DB \uc5f0\uacb0\ub428",
  setupNeeded: "Supabase URL\uacfc anon key\ub97c config.js\uc5d0 \uba3c\uc800 \ub123\uc5b4\uc8fc\uc138\uc694.",
  signInFailed: "\ub85c\uadf8\uc778\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  signUpDone: "\ud68c\uc6d0\uac00\uc785\uc774 \uc644\ub8cc\ub410\uc2b5\ub2c8\ub2e4. \uc774\uba54\uc77c \ud655\uc778\uc774 \ud544\uc694\ud558\uba74 \uba54\uc77c\ud568\uc744 \ud655\uc778\ud574\uc8fc\uc138\uc694.",
  signUpFailed: "\ud68c\uc6d0\uac00\uc785\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  savingFailed: "\uc800\uc7a5\uc5d0 \uc2e4\ud328\ud588\uc2b5\ub2c8\ub2e4.",
  loadingFailed: "\uae30\ub85d\uc744 \ubd88\ub7ec\uc624\uc9c0 \ubabb\ud588\uc2b5\ub2c8\ub2e4.",
  signedOut: "\ub85c\uadf8\uc544\uc6c3\ub410\uc2b5\ub2c8\ub2e4.",
  entries: "\uac74",
  none: "\uc544\uc9c1 \uae30\ub85d\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.",
};

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
const emailInput = document.querySelector("#emailInput");
const passwordInput = document.querySelector("#passwordInput");
const householdCodeInput = document.querySelector("#householdCodeInput");
const signUpButton = document.querySelector("#signUpButton");
const signOutButton = document.querySelector("#signOutButton");
const sessionLabel = document.querySelector("#sessionLabel");
const entryForm = document.querySelector("#entryForm");
const titleInput = document.querySelector("#titleInput");
const categoryInput = document.querySelector("#categoryInput");
const entryList = document.querySelector("#entryList");
const emptyState = document.querySelector("#emptyState");
const entryCount = document.querySelector("#entryCount");
const incomeTotal = document.querySelector("#incomeTotal");
const expenseTotal = document.querySelector("#expenseTotal");
const balanceTotal = document.querySelector("#balanceTotal");
const toast = document.querySelector("#toast");

let entries = [];
let session = null;
let householdCode = "";
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

function setBusy(form, isBusy) {
  [...form.elements].forEach((element) => {
    element.disabled = isBusy;
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
  entryCount.textContent = `${entries.length}${text.entries}`;

  entryList.innerHTML = "";
  emptyState.hidden = entries.length > 0;
  emptyState.textContent = text.none;

  entries.forEach((entry) => {
    const item = document.createElement("li");
    const signedAmount = entry.type === "income" ? Number(entry.amount) : -Number(entry.amount);
    const displayDate = new Intl.DateTimeFormat("ko-KR", {
      month: "long",
      day: "numeric",
    }).format(new Date(`${entry.entry_date}T00:00:00`));

    item.className = "entry";
    item.innerHTML = `
      <div>
        <span class="entry-title"></span>
        <span class="entry-meta"></span>
      </div>
      <span class="entry-amount ${entry.type}"></span>
    `;
    item.querySelector(".entry-title").textContent = entry.title;
    item.querySelector(".entry-meta").textContent = `${entry.category} · ${entry.author_email ?? ""} · ${displayDate}`;
    item.querySelector(".entry-amount").textContent = formatWon(signedAmount);
    entryList.append(item);
  });
}

function renderAuthState() {
  const loggedIn = Boolean(session);
  authPanel.hidden = loggedIn;
  appPanel.hidden = !loggedIn;
  signOutButton.hidden = !loggedIn;
  sessionLabel.textContent = loggedIn ? `${householdCode} · ${text.configured}` : text.loginNeeded;
}

async function loadEntries() {
  if (!supabaseClient || !householdCode) {
    return;
  }

  const { data, error } = await supabaseClient
    .from("budget_entries")
    .select("*")
    .eq("household_code", householdCode)
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

async function signIn(email, password, code) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  session = data.session;
  await updateHouseholdCode(code);
}

async function signUp(email, password, code) {
  const normalizedCode = normalizeHouseholdCode(code);
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
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

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!isConfigured) {
    showToast(text.setupNeeded);
    return;
  }

  const formData = new FormData(authForm);
  setBusy(authForm, true);

  try {
    await signIn(formData.get("email"), formData.get("password"), formData.get("householdCode"));
  } catch (error) {
    showToast(`${text.signInFailed} ${error.message}`);
  } finally {
    setBusy(authForm, false);
  }
});

signUpButton.addEventListener("click", async () => {
  if (!isConfigured) {
    showToast(text.setupNeeded);
    return;
  }

  if (!authForm.reportValidity()) {
    return;
  }

  const formData = new FormData(authForm);
  setBusy(authForm, true);

  try {
    await signUp(formData.get("email"), formData.get("password"), formData.get("householdCode"));
    showToast(text.signUpDone);
  } catch (error) {
    showToast(`${text.signUpFailed} ${error.message}`);
  } finally {
    setBusy(authForm, false);
  }
});

entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(entryForm);
  const amount = Number(formData.get("amount"));
  const title = String(formData.get("title")).trim();

  if (!title || !Number.isFinite(amount) || amount <= 0 || !session) {
    return;
  }

  setBusy(entryForm, true);

  const { error } = await supabaseClient.from("budget_entries").insert({
    household_code: householdCode,
    user_id: session.user.id,
    author_email: session.user.email,
    type: formData.get("type"),
    title,
    amount,
    category: categoryInput.value,
    entry_date: new Date().toISOString().slice(0, 10),
  });

  setBusy(entryForm, false);

  if (error) {
    showToast(`${text.savingFailed} ${error.message}`);
    return;
  }

  entryForm.reset();
  entryForm.elements.type.value = "expense";
  titleInput.focus();
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

async function boot() {
  setupNotice.hidden = isConfigured;
  renderAuthState();
  render();

  if (!isConfigured) {
    return;
  }

  const { data } = await supabaseClient.auth.getSession();
  await applySession(data.session);

  supabaseClient.auth.onAuthStateChange((_event, nextSession) => {
    applySession(nextSession);
  });
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

boot();
