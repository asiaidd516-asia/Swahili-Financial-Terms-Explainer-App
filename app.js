// ─── DATA loaded from data.js ────────────────────────────────────────────────
// TERMS and CATEGORIES come from data.js — loaded before this script in HTML

const TERM_OF_DAY = TERMS[new Date().getDate() % TERMS.length];

// ─── GROQ AI CONFIG ──────────────────────────────────────────────────────────
// 🔑 PASTE YOUR GROQ API KEY BELOW (replace the text inside the quotes)

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ─── GOOGLE SIGN-IN CONFIG ───────────────────────────────────────────────────
// Get a Client ID from https://console.cloud.google.com/apis/credentials
// (OAuth 2.0 Client ID → Web application → add your site to Authorized JavaScript origins).
// Paste it below — the "Continue with Google" button won't work until this is set.
const GOOGLE_CLIENT_ID = "837679707148-h3qg1ebaj6l1ue81pucifka0andrmtqh.apps.googleusercontent.com";
// groq/compound-mini: same API/key, but can automatically run a real web search
// during inference when it's unsure of a fact. Used for anything that needs to
// be factually grounded (unknown finance terms, branded products) instead of
// guessed from static training data. Slightly slower/costlier than plain
// llama-3.3-70b-versatile, so it's reserved for these lookups specifically.
const GROQ_COMPOUND_MODEL = "groq/compound-mini";

// Sentinel returned by lookupWithAI when the AI decides a query is not finance-related.
const NOT_FINANCE = "NOT_FINANCE";

// ─── CURATED FINANCE PRODUCTS GLOSSARY ───────────────────────────────────────
// Human-verified entries for well-known Tanzanian/East African fintech products.
// These are checked BEFORE the AI so common real products are always accurate —
// the AI can guess wrong on branded names (e.g. confusing an overdraft for a
// salary advance), so this list is the safety net. Add more entries here as
// mistakes are found or new well-known products come up.
const KNOWN_FINANCE_PRODUCTS = [
  {
    en: "Songesha", sw: "Songesha",
    definition: "Songesha is an M-Pesa overdraft facility from Vodacom Tanzania, offered in partnership with TPB Bank. It lets M-Pesa users complete a transaction — like sending money, paying a bill, or buying from a merchant — even when their M-Pesa balance is too low, by covering the shortfall as a short-term overdraft. The amount, plus a small daily fee, is automatically deducted the next time money is deposited into the user's M-Pesa wallet.",
    swDefinition: "Songesha ni huduma ya overdraft ya M-Pesa kutoka Vodacom Tanzania, inayotolewa kwa ushirikiano na Benki ya TPB. Inawaruhusu watumiaji wa M-Pesa kukamilisha muamala — kama kutuma pesa, kulipa bili, au kununua kwa mfanyabiashara — hata kama salio lao halitoshi, kwa kufidia pungufu hilo kama mkopo mfupi wa muda. Kiasi hicho, pamoja na ada ndogo ya kila siku, hukatwa moja kwa moja pesa inapowekwa tena kwenye akaunti ya M-Pesa.",
    example: "When Amina's M-Pesa balance was too low to pay her electricity bill, Songesha covered the shortfall so the payment went through.",
    swExample: "Wakati salio la M-Pesa la Amina lilikuwa halitoshi kulipa bili ya umeme, Songesha ilifidia pungufu hilo ili malipo yakamilike.",
    category: "digital_finance_and_payments"
  },
  {
    en: "Timiza", sw: "Timiza",
    definition: "Timiza is a mobile micro-loan service from Airtel Money Tanzania, offered in partnership with AFB. It lets Airtel Money customers borrow small short-term loans (roughly TZS 500 to TZS 500,000) directly from their phone, with repayment periods of 7, 14, or 28 days. A related product, Timiza Akiba, is a fee-free mobile savings account.",
    swDefinition: "Timiza ni huduma ya mikopo midogo ya simu kutoka Airtel Money Tanzania, inayotolewa kwa ushirikiano na AFB. Inawaruhusu wateja wa Airtel Money kukopa kiasi kidogo cha muda mfupi (kama TZS 500 hadi TZS 500,000) moja kwa moja kutoka kwenye simu yao, kwa muda wa kulipa wa siku 7, 14, au 28. Bidhaa nyingine inayohusiana, Timiza Akiba, ni akaunti ya akiba ya simu isiyo na ada.",
    example: "James used Timiza to borrow TZS 20,000 to restock his shop and repaid it within two weeks.",
    swExample: "James alitumia Timiza kukopa TZS 20,000 kuongeza bidhaa dukani kwake na akalipa ndani ya wiki mbili.",
    category: "digital_finance_and_payments"
  },
  {
    en: "M-Pawa", sw: "M-Pawa",
    definition: "M-Pawa is a mobile savings-and-loan product from Vodacom M-Pesa, offered in partnership with a bank. It lets M-Pesa users save money and earn interest, and unlocks small loans based on their savings and M-Pesa transaction history.",
    swDefinition: "M-Pawa ni bidhaa ya akiba na mikopo ya simu kutoka Vodacom M-Pesa, inayotolewa kwa ushirikiano na benki. Inawaruhusu watumiaji wa M-Pesa kuweka akiba na kupata riba, na kuwapa fursa ya mikopo midogo kulingana na akiba na historia yao ya miamala ya M-Pesa.",
    example: "Fatuma saved small amounts in M-Pawa every week and later qualified for a small loan to expand her business.",
    swExample: "Fatuma aliweka akiba kidogo kila wiki kwenye M-Pawa na baadaye akastahili mkopo mdogo wa kupanua biashara yake.",
    category: "digital_finance_and_payments"
  },
  {
    en: "M-Koba", sw: "M-Koba",
    definition: "M-Koba is a digital group-savings service from Vodacom M-Pesa. It lets a group of people (similar to a VICOBA savings circle) pool and manage regular contributions digitally through M-Pesa, instead of handling cash.",
    swDefinition: "M-Koba ni huduma ya akiba ya kikundi ya kidijitali kutoka Vodacom M-Pesa. Inaruhusu kikundi cha watu (kama mzunguko wa akiba wa VICOBA) kuweka na kusimamia michango ya mara kwa mara kidijitali kupitia M-Pesa, badala ya kutumia fedha taslimu.",
    example: "Our women's group switched from cash contributions to M-Koba so everyone could track savings from their phones.",
    swExample: "Kikundi chetu cha wanawake kilibadilika kutoka michango ya fedha taslimu kwenda M-Koba ili kila mtu aweze kufuatilia akiba kwa kutumia simu.",
    category: "digital_finance_and_payments"
  },
  {
    en: "Mgodi", sw: "Mgodi",
    definition: "Mgodi is a savings-and-loan service from Vodacom M-Pesa, offered in partnership with Diamond Trust Bank (DTB) and Letshego Faidika Bank. It lets M-Pesa customers save money and take medium-term loans (up to 30 days), based on their M-Pesa usage and savings history.",
    swDefinition: "Mgodi ni huduma ya akiba na mikopo kutoka Vodacom M-Pesa, inayotolewa kwa ushirikiano na Benki ya Diamond Trust (DTB) na Letshego Faidika Bank. Inawaruhusu wateja wa M-Pesa kuweka akiba na kuchukua mikopo ya muda wa kati (hadi siku 30), kulingana na matumizi yao ya M-Pesa na historia ya akiba.",
    example: "Before harvest season, Baraka used Mgodi to take a 30-day loan to buy seeds and fertilizer for his farm.",
    swExample: "Kabla ya msimu wa mavuno, Baraka alitumia Mgodi kuchukua mkopo wa siku 30 kununua mbegu na mbolea kwa shamba lake.",
    category: "digital_finance_and_payments"
  }
];

/** findKnownProduct — case-insensitive exact match against the curated glossary above. */
function findKnownProduct(query) {
  const q = query.toLowerCase().trim();
  return KNOWN_FINANCE_PRODUCTS.find(p => p.en.toLowerCase() === q || p.sw.toLowerCase() === q) || null;
}

/** findKnownProductsInText — finds curated products mentioned anywhere in free text (whole-word match). */
function findKnownProductsInText(text) {
  const q = text.toLowerCase();
  return KNOWN_FINANCE_PRODUCTS.filter(p => new RegExp(`\\b${p.en.toLowerCase()}\\b`, "i").test(q));
}

async function lookupWithAI(query) {
  const prompt = `You are a finance expert. A user searched for: "${query}".

This term was NOT found in our dataset.

If the query is a finance term, financial service, banking product, insurance product, investment, tax, economics, fintech, mobile money service, digital payment, loan product, or any other finance-related concept (including financial products offered by Tanzanian or East African companies, e.g. mobile network operators like Vodacom, Airtel, Tigo), respond ONLY with a valid JSON object in this exact format, no extra text, no markdown:
{
  "en": "the term in English — if it is a brand/product name with no real English translation, just repeat the brand name here rather than leaving it blank",
  "sw": "the term in Swahili — if it is a brand/product name with no real Swahili translation, just repeat the brand name here rather than leaving it blank",
  "definition": "clear definition in English (2-3 sentences, simple language). Describe the general product category and purpose (e.g. salary advance, microloan, savings product, insurance). Do NOT invent specific numbers you are not sure about (interest rates, fees, exact eligibility rules) — describe generally instead. If you are inferring rather than certain about which product this is, end with ONE short separate sentence noting that, e.g. 'Exact details may vary — please confirm with the provider.' Keep this note brief and do not repeat it more than once.",
  "swDefinition": "same definition in Swahili (2-3 sentences, simple language), following the same rules above",
  "example": "a real-life example sentence in English showing the term used in a financial context in Tanzania or East Africa",
  "swExample": "the same example sentence translated into Swahili",
  "category": "one of: banking_and_money_management, business, digital_finance_and_payments, insurance, financial_markets_and_investment, macroeconomics, microeconomics, regulation_and_policy, global_finance_and_economic, financial_institutions_and_actors, financial_systems_and_stability"
}

Never leave "en" or "sw" as an empty string — every field must contain visible text.

If the query is NOT related to finance in any way, respond with EXACTLY this and nothing else:
NOT_FINANCE
Before returning NOT_FINANCE, investigate whether the query could be:

- a banking product
- a mobile money service
- a telecom financial product
- a fintech platform
- a savings product
- a microloan
- an overdraft service
- a digital payment platform
- a government payment service
- an insurance product
- an investment product

Many Tanzanian financial products use ordinary Swahili words or everyday phrases.

Do NOT reject a term simply because it looks like ordinary language.

Search using multiple combinations:

"${query}"
"${query} Tanzania"
"${query} Vodacom"
"${query} M-Pesa"
"${query} Airtel Money"
"${query} Yas Tanzania"
"${query} HaloPesa"
"${query} CRDB"
"${query} NMB"
"${query} NBC"
"${query} Bank of Tanzania"

Only return NOT_FINANCE after all searches fail.
Never guess.

Never use phrases like:

"It appears..."
"It is likely..."
"Possibly..."
"It may be..."

unless you immediately state that the information should be confirmed with the official provider.

If you are not confident, search again before answering.
Examples of providers include:

Vodacom Tanzania
M-Pesa
Airtel Money
Yas
HaloPesa
NMB
CRDB
NBC
Stanbic
Absa
Bank of Tanzania
TRA
eGovernment
TIPS
TISS

These are examples only.
Search beyond these if necessary.

IMPORTANT — branded products that look like ordinary words: Many real Tanzanian/East African financial products are named after everyday Swahili verbs or nouns, e.g. "Songesha" (from kusongesha, "to push/advance forward") is a real Vodacom M-Pesa overdraft facility, "Timiza" (from kutimiza, "to fulfill") is a real Airtel Money micro-loan product, and "M-Pawa" is a real Vodacom savings-and-loan product. Some financial services are even named after everyday slang PHRASES — a common casual request between friends or customers that a telecom operator or bank later turned into an official named service (dial codes, menu options, etc). These are examples of the PATTERN only — do not assume every such product works the same way; each has its own specific mechanics. Before concluding a query is just ordinary vocabulary or casual slang, actively search the web for the exact phrase together with terms like "Vodacom Tanzania", "Airtel Tanzania", "Yas Tanzania", "M-Pesa", or "loan service" to check whether it is ALSO the name of a mobile money, airtime, loan, savings, or insurance service — do not conclude NOT_FINANCE from general knowledge alone without searching first. Only return NOT_FINANCE when a real search turns up no plausible financial-service reading at all (e.g. a greeting, food, sports, weather, entertainment, or general chit-chat with no telecom/finance angle).

You have access to real-time web search. If the query is or could be the name of a specific branded financial product, service, or company, and you are not fully certain of its exact mechanics (who offers it, how it works, loan terms, etc.), SEARCH THE WEB to verify the real facts before writing the JSON — do not guess or assume it works like a similar-sounding product. Base the definition on what you actually find.`;

  const response = await fetch("/.netlify/functions/groq", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GROQ_COMPOUND_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a finance expert and financial education assistant with real-time web search access. Follow the user's instructions exactly: respond either with valid JSON only (no markdown, no extra text) or with the exact literal text NOT_FINANCE and nothing else. This term was not found in a curated dataset, so ALWAYS perform at least one real web search to check whether it is a real financial product or service before deciding — never rely on your own memory alone to conclude NOT_FINANCE."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 800,
      // Force the model to actually run its web_search tool on every call,
      // instead of leaving it to the model's own (sometimes wrong) judgment
      // about whether a search is needed.
    })
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    console.error("Groq error body:", errBody);
    throw new Error("Groq API error: " + response.status);
  }

  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  const clean = text.replace(/```json|```/g, "").trim();
  console.log("[lookupWithAI] raw response for", JSON.stringify(query), "→", clean);
  console.log("[lookupWithAI] executed_tools:", data.choices[0].message.executed_tools || "(none — no search ran)");

  // AI decided this is not finance-related — bubble the sentinel up to the caller.
  // Checked loosely (not exact-match) since compound-mini can sometimes append
  // a trailing note or citation even when told to respond with only this text.
  if (clean.toUpperCase().includes(NOT_FINANCE) && !clean.includes("{")) {
    return NOT_FINANCE;
  }

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    // Compound systems sometimes wrap the JSON with citations or commentary
    // despite instructions — try to pull out just the {...} block and retry.
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw e;
    parsed = JSON.parse(jsonMatch[0]);
  }
  parsed.id = "ai_" + Date.now();
  parsed.aiGenerated = true;
  parsed.phonetic = "";
  if (
    !parsed.en ||
    !parsed.sw ||
    !parsed.definition ||
    !parsed.swDefinition ||
    !parsed.example ||
    !parsed.swExample ||
    !parsed.category
) {
    console.warn("Incomplete AI response");

parsed.example ||= "";
parsed.swExample ||= "";
parsed.category ||= "digital_finance_and_payments";
}
  // Safety net: never let the term word go blank, even if the model slips up.
  if (!parsed.en || !parsed.en.trim()) parsed.en = parsed.sw && parsed.sw.trim() ? parsed.sw : query;
  if (!parsed.sw || !parsed.sw.trim()) parsed.sw = parsed.en && parsed.en.trim() ? parsed.en : query;
  rememberNewFinanceTerm(parsed);

return parsed;
}
function rememberNewFinanceTerm(term) {

    let discovered =
        JSON.parse(localStorage.getItem("lf_discovered_terms") || "[]");

    const exists = discovered.some(
        t => t.term.toLowerCase() === term.en.toLowerCase()
    );

    if (!exists) {

        discovered.push({

            term: term.en,

            sw: term.sw,

            definition: term.definition,

            swDefinition: term.swDefinition,

            example: term.example,

            swExample: term.swExample,

      

            category: term.category,

            discoveredAt: new Date().toISOString(),

            source: "AI"

        });

        localStorage.setItem(
            "lf_discovered_terms",
            JSON.stringify(discovered)
        );
    }
}

// ─── STATE ──────────────────────────────────────────────────────────────────

let currentLang = "en";
let savedTerms = JSON.parse(localStorage.getItem("lf_saved") || "[]");
let searchHistory = JSON.parse(localStorage.getItem("lf_history") || "[]");
let currentPage = "home";
let currentTerm = null;
let currentCategory = null;
let currentUser = null; // set after successful auth
let aiChatHistory = []; // in-memory conversation turns sent to API

// ─── AUTH ────────────────────────────────────────────────────────────────────

/**
 * initAuth — called on DOMContentLoaded.
 * Restores session from localStorage or shows the auth screen.
 */
function initAuth() {
  const raw = localStorage.getItem("lf_session");
  if (raw) {
    try {
      currentUser = JSON.parse(raw);
      _showApp();
      return;
    } catch (e) {
      localStorage.removeItem("lf_session");
    }
  }
  // Show account/auth screen — Create Account tab first (matches index.html default)
  _setAuthVisibility(true);
  switchAuthTab("signup");
}

/** checkSession — returns true if a valid session exists */
function checkSession() {
  return !!localStorage.getItem("lf_session");
}

/** showLogin — hides app shell, shows auth screen on the Sign In tab */
function showLogin() {
  _setAuthVisibility(true);
  switchAuthTab("signin");
}

/** showRegister — hides app shell, shows auth screen on the Create Account tab */
function showRegister() {
  _setAuthVisibility(true);
  switchAuthTab("signup");
}

/** logout — clears session and returns to login screen */
function logout() { handleLogout(); }
function handleLogout() {
  localStorage.removeItem("lf_session");
  currentUser = null;
  closeSidebar();
  showLogin();
}

/** createAccount — alias so HTML onclick="createAccount()" works */
function createAccount() { handleSignUp(); }

/** login — alias so HTML onclick="login()" works */
function login() { handleSignIn(); }

/** showForgotPassword — hides tabs + signup/signin forms, shows the reset-password panel */
function showForgotPassword() {
  const signup = document.getElementById("form-signup");
  const signin = document.getElementById("form-signin");
  const forgot = document.getElementById("form-forgot");
  const tabs   = document.querySelector(".auth-tabs");
  if (signup) signup.style.display = "none";
  if (signin) signin.style.display = "none";
  if (forgot) forgot.style.display = "block";
  if (tabs)   tabs.style.display   = "none";
  // Clear any previous messages/fields
  ["forgot-error", "forgot-success"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  ["forgot-email", "forgot-password", "forgot-confirm"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

/** backToSignIn — returns from the reset-password panel to the Sign In tab */
function backToSignIn() {
  const forgot = document.getElementById("form-forgot");
  const tabs   = document.querySelector(".auth-tabs");
  if (forgot) forgot.style.display = "none";
  if (tabs)   tabs.style.display   = "flex";
  switchAuthTab("signin");
}

/** handleForgotPassword — validates email exists, then overwrites the stored password */
function handleForgotPassword() {
  const email    = (document.getElementById("forgot-email")?.value    || "").trim().toLowerCase();
  const password = (document.getElementById("forgot-password")?.value || "");
  const confirm  = (document.getElementById("forgot-confirm")?.value  || "");
  const errEl    = document.getElementById("forgot-error");
  const okEl     = document.getElementById("forgot-success");
  const setErr   = msg => { if (errEl) errEl.textContent = msg; if (okEl) okEl.textContent = ""; };

  if (!email || !email.includes("@")) { setErr("Please enter a valid email address."); return; }

  const accounts = JSON.parse(localStorage.getItem("lf_accounts") || "{}");
  if (!accounts[email]) { setErr("No account found with this email."); return; }

  if (password.length < 6)  { setErr("Password must be at least 6 characters."); return; }
  if (password !== confirm) { setErr("Passwords do not match."); return; }

  // Overwrite the stored password
  accounts[email].password = password;
  localStorage.setItem("lf_accounts", JSON.stringify(accounts));

  if (errEl) errEl.textContent = "";
  if (okEl)  okEl.textContent  = "Password reset! You can now sign in.";

  // Return to Sign In shortly after so the success message is visible
  setTimeout(() => {
    backToSignIn();
    const signinEmail = document.getElementById("signin-email");
    if (signinEmail) signinEmail.value = email;
  }, 1400);
}

/** handleGoogleContinue — fallback if Google's real button hasn't rendered on top yet
 *  (e.g. GOOGLE_CLIENT_ID not configured, or the script is still loading). */
function handleGoogleContinue() {
  if (!GOOGLE_CLIENT_ID) {
    showToast("⚙️ Google Sign-In isn't configured yet — add your Client ID to app.js.");
    return;
  }
  showToast("Google Sign-In is still loading — please try again in a moment.");
}

/** initGoogleButtons — initializes Google Identity Services and renders its real
 *  (reliable) button invisibly on top of our custom-styled buttons. We avoid the
 *  One Tap prompt() popup here since browsers frequently suppress it silently.
 *  Safe to call repeatedly (e.g. on tab switch) — already-rendered buttons are skipped,
 *  and hidden containers (0 width) are simply retried later. */
let _googleInitialized = false;
function initGoogleButtons() {
  if (!GOOGLE_CLIENT_ID || !window.google || !window.google.accounts) return;

  if (!_googleInitialized) {
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential
    });
    _googleInitialized = true;
  }

  ["gbtn-signup", "gbtn-signin"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.rendered) return;
    const width = el.offsetWidth;
    if (!width) return; // still hidden (0 width) — switchAuthTab() will retry this
    google.accounts.id.renderButton(el, {
      type: "standard", theme: "outline", size: "large", width: Math.min(400, width)
    });
    el.dataset.rendered = "1";
  });
}

// Poll for the Google script to finish loading, then render the real buttons.
// (The script tag uses async/defer, so we can't rely on load order vs. app.js.)
(function _waitForGoogleSDK() {
  if (!GOOGLE_CLIENT_ID) return;
  const iv = setInterval(() => {
    if (window.google && window.google.accounts) {
      clearInterval(iv);
      initGoogleButtons();
    }
  }, 200);
  setTimeout(() => clearInterval(iv), 15000);
})();

/** handleGoogleCredential — Google's callback with a signed ID token (JWT) */
function handleGoogleCredential(response) {
  try {
    const payload = JSON.parse(atob(response.credential.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    const email = (payload.email || "").trim().toLowerCase();
    const name  = payload.name || payload.given_name || "Google User";
    if (!email) throw new Error("No email returned by Google");

    // Create the local account on first sign-in, reuse it after that
    const accounts = JSON.parse(localStorage.getItem("lf_accounts") || "{}");
    if (!accounts[email]) {
      accounts[email] = { fullName: name, email, password: null, provider: "google" };
      localStorage.setItem("lf_accounts", JSON.stringify(accounts));
    }
    _loginUser({ fullName: accounts[email].fullName, email });
  } catch (e) {
    console.error("Google Sign-In error:", e);
    showToast("Google Sign-In failed. Please try again.");
  }
}

/** switchAuthTab — toggles between the two form panels */
function switchAuthTab(tab) {
  const signup  = document.getElementById("form-signup");
  const signin  = document.getElementById("form-signin");
  const forgot  = document.getElementById("form-forgot");
  const tabs    = document.querySelector(".auth-tabs");
  const tSignup = document.getElementById("tab-signup");
  const tSignin = document.getElementById("tab-signin");
  if (!signup || !signin) return;
  if (forgot) forgot.style.display = "none";
  if (tabs)   tabs.style.display   = "flex";
  signup.style.display = tab === "signup" ? "block" : "none";
  signin.style.display = tab === "signin" ? "block" : "none";
  if (tSignup) tSignup.classList.toggle("active", tab === "signup");
  if (tSignin) tSignin.classList.toggle("active", tab === "signin");
  // Clear any previous error messages
  ["signup-error", "signin-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
  // Now-visible tab may contain an unrendered Google button (was 0-width while hidden)
  if (typeof initGoogleButtons === "function") initGoogleButtons();
}

/** handleSignUp — validates fields and creates a new localStorage account */
function handleSignUp() {
  const name     = (document.getElementById("signup-name")?.value     || "").trim();
  const email    = (document.getElementById("signup-email")?.value    || "").trim().toLowerCase();
  const password = (document.getElementById("signup-password")?.value || "");
  const confirm  = (document.getElementById("signup-confirm")?.value  || "");
  const errEl    = document.getElementById("signup-error");
  const setErr   = msg => { if (errEl) errEl.textContent = msg; };

  // Validation
  if (!name)                          { setErr("Please enter your full name."); return; }
  if (!email || !email.includes("@")) { setErr("Please enter a valid email address."); return; }
  if (password.length < 6)            { setErr("Password must be at least 6 characters."); return; }
  if (password !== confirm)           { setErr("Passwords do not match."); return; }

  // Check for existing account
  const accounts = JSON.parse(localStorage.getItem("lf_accounts") || "{}");
  if (accounts[email]) {
    setErr("An account with this email already exists. Please sign in.");
    return;
  }

  // Save new account (localStorage only — not cryptographically secure)
  accounts[email] = { fullName: name, email, password };
  localStorage.setItem("lf_accounts", JSON.stringify(accounts));

  // Auto-login after registration
  _loginUser({ fullName: name, email });
}

/** handleSignIn — validates credentials against localStorage accounts */
function handleSignIn() {
  const email    = (document.getElementById("signin-email")?.value    || "").trim().toLowerCase();
  const password = (document.getElementById("signin-password")?.value || "");
  const errEl    = document.getElementById("signin-error");
  const setErr   = msg => { if (errEl) errEl.textContent = msg; };

  if (!email)    { setErr("Please enter your email address."); return; }
  if (!password) { setErr("Please enter your password."); return; }

  const accounts = JSON.parse(localStorage.getItem("lf_accounts") || "{}");
  const account  = accounts[email];

  if (!account)                        { setErr("No account found with this email."); return; }
  if (account.password !== password)   { setErr("Incorrect password. Please try again."); return; }

  _loginUser({ fullName: account.fullName, email: account.email });
}

/** _loginUser — internal: saves session and reveals the main app */
function _loginUser(user) {
  currentUser = user;
  localStorage.setItem("lf_session", JSON.stringify(user));
  // Clear input fields for security
  ["signup-name","signup-email","signup-password","signup-confirm",
   "signin-email","signin-password"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
  _showApp();
}

/** _showApp — internal: reveals app shell, hides auth screen, navigates home */
function _showApp() {
  _setAuthVisibility(false);
  navigate("home");
}

/** _setAuthVisibility — toggles auth screen vs app shell */
function _setAuthVisibility(showAuth) {
  const authEl = document.getElementById("auth-screen");
  const appEl  = document.getElementById("app-shell");
  if (authEl) authEl.style.display = showAuth ? "flex" : "none";
  if (appEl)  appEl.style.display  = showAuth ? "none" : "block";
}
// ─── LANGUAGE ───────────────────────────────────────────────────────────────

function toggleLanguage() {
  currentLang = currentLang === "en" ? "sw" : "en";
  document.querySelector(".flip-card").classList.toggle("flipped");
  renderCurrentPage();
}

function t(en, sw) { return currentLang === "en" ? en : sw; }

// ─── PAGES ──────────────────────────────────────────────────────────────────

function navigate(page, data = null) {
  currentPage = page;

  switch(page) {
    case "translation":
      if (data !== null) currentTerm = data;
      break;

    case "category":
      if (data !== null) currentCategory = data;
      break;
  }

  renderCurrentPage();
  window.scrollTo(0, 0);
}

function renderCurrentPage() {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById("page-" + currentPage);
  if (el) el.classList.add("active");

  switch (currentPage) {
    case "home":           renderHome();           break;
    case "translation":    renderTranslation();    break;
    case "saved":          renderSaved();          break;
    case "explore":        renderExplore();        break;
    case "help":           renderHelp();           break;
    case "account":        renderAccount();        break;
    case "category":       renderCategory();       break;
    case "explore-detail": renderExploreDetail();  break;
    case "ai-assistant":   renderAIAssistant();    break;
  }
  updateSidebarActive();
}

// ─── HOME ────────────────────────────────────────────────────────────────────

function renderHome() {
  const el = document.getElementById("page-home");
  el.innerHTML = `
    <div class="home-hero fade-in">
      <p class="welcome-text">${t("Hello! 👋", "Habari! 👋")}</p>
      <h2 class="welcome-headline">${t(
        "Learn finance terms easily with <em>LingoFinance</em>",
        "Jifunze maneno ya fedha kwa urahisi na <em>LingoFinance</em>"
      )}</h2>
    </div>

    <div class="search-section fade-in-2">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="home-search" placeholder="${t("Search a financial term...", "Tafuta neno la fedha...")}" autocomplete="off" />
        <button class="mic-btn" id="home-mic-btn"
          onclick="startVoiceInput('home-search', () => doSearch(), document.getElementById('home-mic-btn'))"
          title="${t('Voice search','Tafuta kwa sauti')}">🎤</button>
        <button class="search-btn" onclick="doSearch()">${t("Search", "Tafuta")}</button>
      </div>
      <div id="search-suggestions" style="display:none; background:white; border-radius:12px; box-shadow:0 8px 24px rgba(11,31,58,0.14); margin-top:8px; overflow:hidden; position:relative; z-index:50;"></div>
    </div>

    <div class="section-gap fade-in-3">
      <p class="section-label">⭐ ${t("Term of the Day", "Neno la Siku")}</p>
      <div class="tod-card">
        <div class="tod-badge">✨ ${t("Term of the Day", "Neno la Siku")}</div>
        <div class="tod-term-row">
          <h3 class="tod-term">${t(TERM_OF_DAY.en, TERM_OF_DAY.sw)}</h3>
          <button class="sound-btn" onclick="speakTerm(this, '${t(TERM_OF_DAY.en, TERM_OF_DAY.sw)}')" title="${t("Listen", "Sikiliza")}">🔊</button>
        </div>
        <p class="tod-translation">${t(TERM_OF_DAY.sw, TERM_OF_DAY.en)}</p>
        <p class="tod-definition">${t(TERM_OF_DAY.definition, TERM_OF_DAY.swDefinition)}</p>
        <button class="tod-explore-btn" onclick="exploreDetailData='tod'; currentTerm=TERM_OF_DAY; navigate('explore-detail')">
          <span>📖 ${t("Explore this term →", "Chunguza neno hili →")}</span>
          <span>›</span>
        </button>
      </div>
    </div>

    <div class="section-gap">
      <p class="section-label">📂 ${t("Popular Categories", "Makundi Maarufu")}</p>
      <div class="categories-grid">
        ${CATEGORIES.map(cat => `
          <div class="cat-card cat-${cat.id}" onclick="navigate('category', '${cat.id}')">
            <div class="cat-icon">${cat.icon}</div>
            <div class="cat-name">${t(cat.name, cat.swName)}</div>
            <div class="cat-count">${cat.count} ${t("terms", "maneno")}</div>
            <div class="cat-arrow">→</div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // Live search suggestions
  const input = document.getElementById("home-search");
  if (input) {
    input.addEventListener("input", () => showSuggestions(input.value));
    input.addEventListener("keydown", e => { if (e.key === "Enter") doSearch(); });
  }
}

function showSuggestions(query) {
  const box = document.getElementById("search-suggestions");
  if (!query.trim()) { box.style.display = "none"; return; }
  const matches = TERMS.filter(t =>
    t.en.toLowerCase().includes(query.toLowerCase()) ||
    t.sw.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
  if (!matches.length) { box.style.display = "none"; return; }
  box.style.display = "block";
  box.innerHTML = matches.map(m => `
    <div class="history-item" onclick="goToTerm(${m.id})">
      <span class="hi-icon">📘</span>
      <span>${m.en} — <em style="color:var(--gold)">${m.sw}</em></span>
    </div>
  `).join("");
}

function goToTerm(id) {
  const term = TERMS.find(t => t.id === id);
  if (term) {
    addToHistory(term.en);
    navigate("translation", term);
  }
}

// ─── FINANCE TERM VALIDATOR ───────────────────────────────────────────────────
/**
 * isFinanceTerm — returns true if query appears to be finance-related.
 * Supports both English and Swahili keywords.
 * Used to guard search before dataset lookup or AI call.
 */
function isFinanceTerm(query) {
  const q = query.toLowerCase().trim();
  return FINANCE_KEYWORDS.some(kw => q.includes(kw));
}
async function doSearch() {
  const input = document.getElementById("home-search");
  const q = input ? input.value.trim() : "";
  if (!q) return;

  // ── Step 1: Check dataset first — always allow known terms ───────────────
 const match = TERMS.find(t =>
  t.en.toLowerCase() === q.toLowerCase() ||
  t.sw.toLowerCase() === q.toLowerCase()
);

  if (match) {
    addToHistory(q);
    navigate("translation", match);
    return;
  }

  // ── Step 1.5: Curated, human-verified glossary — checked before the AI ────
  const known = findKnownProduct(q);
  if (known) {
    addToHistory(q);
    navigate("translation", { ...known, id: "kb_" + known.en.toLowerCase(), aiGenerated: false, curated: true, phonetic: "" });
    return;
  }

  // ── Step 2: Not in dataset or glossary → let the AI decide ────────────────
  addToHistory(q);
  showAILoading(q);

  try {
    const aiTerm = await lookupWithAI(q);
    const box = document.getElementById("search-suggestions");
    if (box) box.style.display = "none";

    if (aiTerm === NOT_FINANCE) {
      showNonFinanceWarning(q);
      return;
    }

    navigate("translation", aiTerm);
  } catch (err) {
    console.error(err);
    showNoResult(q);
  }
}

function showAILoading(q) {
  const box = document.getElementById("search-suggestions");
  if (box) {
    box.style.display = "block";
    box.innerHTML = `
      <div style="padding:18px 16px; display:flex; align-items:center; gap:12px;">
        <div class="ai-spinner"></div>
        <div>
          <div style="font-size:13px; font-weight:600; color:var(--text-dark);">
            ${t("Asking AI about", "Kuuliza AI kuhusu")} "<strong>${q}</strong>"...
          </div>
          <div style="font-size:11px; color:var(--slate); margin-top:2px;">
            ${t("Not in our dataset — looking it up for you", "Haipo kwenye data yetu — tunaitafutia")}
          </div>
        </div>
      </div>`;
  }
}

function showNoResult(q) {
  const box = document.getElementById("search-suggestions");
  if (box) {
    box.style.display = "block";
    box.innerHTML = `
      <div class="no-results">
        <div class="nr-icon">🔍</div>
        ${t("No results for", "Hakuna matokeo kwa")} "<strong>${q}</strong>"<br>
        <span style="font-size:12px; color:var(--slate);">${t("Check your spelling or try another term", "Angalia tahajia au jaribu neno jingine")}</span>
      </div>`;
  }
}
function showNonFinanceWarning(q) {
  const box = document.getElementById("search-suggestions");
  if (!box) return;
  box.style.display = "block";
  box.innerHTML = `
    <div style="padding:16px 14px; display:flex; align-items:flex-start; gap:12px;">
      <span style="font-size:22px; flex-shrink:0;">⚠️</span>
      <div>
        <div style="font-size:13px; font-weight:600; color:var(--text-dark); margin-bottom:4px;">
          ${t("Not a finance term", "Si neno la fedha")}
        </div>
        <div style="font-size:12px; color:var(--slate); line-height:1.5;">
          ${t(MSG_NON_FINANCE_SEARCH.en, MSG_NON_FINANCE_SEARCH.sw)}
        </div>
      </div>
    </div>`;
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────

function addToHistory(q) {
  searchHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 10);
  localStorage.setItem("lf_history", JSON.stringify(searchHistory));
}

function toggleHistory() {
  const dd = document.getElementById("history-dropdown");
  if (!dd) return;
  dd.classList.toggle("open");
  if (dd.classList.contains("open")) renderHistory();
}

function renderHistory() {
  const dd = document.getElementById("history-dropdown");
  if (!dd) return;
  dd.innerHTML = `
    <div class="history-header">
      ${t("Recent Searches", "Utafutaji wa Hivi Karibuni")}
      <button class="history-clear" onclick="clearHistory()">${t("Clear", "Futa")}</button>
    </div>
    ${searchHistory.length ? searchHistory.map(h => `
      <div class="history-item" onclick="searchFromHistory('${h}')">
        <span class="hi-icon">🕐</span> ${h}
      </div>
    `).join("") : `<div class="history-empty">${t("No search history yet", "Bado hakuna historia ya utafutaji")}</div>`}
  `;
}

function searchFromHistory(q) {
  document.getElementById("history-dropdown")?.classList.remove("open");
  if (currentPage !== "home") {
    navigate("home");
    setTimeout(() => runSearchQuery(q), 50);
  } else {
    runSearchQuery(q);
  }
}

function runSearchQuery(q) {
  const input = document.getElementById("home-search");
  if (input) input.value = q;
  doSearch();
}

function openSavedTerm(termId) {
  const term = savedTerms.find(s => String(s.id) === String(termId));
  if (term) navigate("translation", term);
}

function clearHistory() {
  searchHistory = [];
  localStorage.removeItem("lf_history");
  renderHistory();
}

// ─── TRANSLATION PAGE ────────────────────────────────────────────────────────

function renderTranslation() {
  const term = currentTerm;
  if (!term) return;
  const isSaved = savedTerms.some(s => s.id === term.id);
  const cat = CATEGORIES.find(c => c.id === term.category);
  const el = document.getElementById("page-translation");
  el.innerHTML = `
    <div style="padding:16px 20px 0;">
      <button class="back-btn" onclick="navigate('home')" style="color:var(--gold);background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;padding:0;margin-bottom:12px;">
        ← ${t("Back", "Rudi")}
      </button>
    </div>
    <div class="translation-page">

      ${term.aiGenerated ? `
        <div class="ai-badge-banner fade-in">
          <span>🤖</span>
          <span>${t("AI Generated — This term was not in our dataset. Explained by Groq AI.", "Imetengenezwa na AI — Neno hili halikuwepo kwenye data yetu. Limeelezwa na Groq AI.")}</span>
        </div>` : term.curated ? `
        <div class="ai-badge-banner fade-in" style="background:rgba(76,29,149,0.12);border-color:rgba(76,29,149,0.3);">
          <span>✅</span>
          <span>${t("Verified — Not in our main dataset, but this product is confirmed accurate.", "Imethibitishwa — Haipo kwenye data yetu kuu, lakini bidhaa hii imethibitishwa kuwa sahihi.")}</span>
        </div>` : ""}

      <div class="trans-header fade-in">
        <div class="trans-word">
          ${t(term.en, term.sw)}
          <span class="trans-lang-badge">${t("EN", "SW")}</span>
          <button class="sound-btn" onclick="speakTerm(this, '${t(term.en, term.sw).replace(/'/g,"&#39;")}')" title="${t("Listen","Sikiliza")}">🔊</button>
        </div>
        ${term.phonetic ? `<p class="trans-phonetic">${term.phonetic}</p>` : ""}
        <p class="trans-swahili">${t(term.sw, term.en)}</p>
      </div>

      ${(term.aiGenerated || term.curated) ? `
      <div class="trans-card fade-in-2">
        <div class="trans-card-title">📖 ${t("Definition", "Maana")} (EN)</div>
        <p class="trans-definition">${term.definition}</p>
      </div>
      <div class="trans-card fade-in-2">
        <div class="trans-card-title">📖 ${t("Definition", "Maana")} (SW)</div>
        <p class="trans-definition">${term.swDefinition}</p>
      </div>` : `
      <div class="trans-card fade-in-2">
        <div class="trans-card-title">📖 ${t("Definition", "Maana")}</div>
        <p class="trans-definition">${t(term.definition, term.swDefinition)}</p>
      </div>`}

      <div class="trans-card fade-in-2">
        <div class="trans-card-title">💡 ${t("Real-Life Example", "Mfano wa Maisha Halisi")}</div>
        <div class="trans-example">${t(term.example, term.swExample)}</div>
      </div>

      <div class="trans-card fade-in-3" style="background:var(--cream);">
        <div class="trans-card-title">🗂️ ${t("Category", "Kikundi")}</div>
        <span class="tag">${cat ? t(cat.name, cat.swName) : term.category}</span>
      </div>

      <button class="save-btn ${isSaved ? 'saved' : ''} fade-in-3" id="save-term-btn" onclick="toggleSaveAI('${term.id}')">
        ${isSaved ? `✅ ${t("Saved!", "Imehifadhiwa!")}` : `🔖 ${t("Save this Term", "Hifadhi Neno Hili")}`}
      </button>
    </div>
  `;
}

// ─── SAVED TERMS ─────────────────────────────────────────────────────────────

function toggleSaveAI(termId) {
  // Works for both normal integer IDs and AI string IDs like "ai_1234"
  const term = currentTerm && String(currentTerm.id) === String(termId)
    ? currentTerm
    : TERMS.find(t => String(t.id) === String(termId));
  if (!term) return;
  const idx = savedTerms.findIndex(s => String(s.id) === String(termId));
  if (idx === -1) {
    savedTerms.push(term);
    showToast(`🔖 ${t("Term saved!", "Neno limehifadhiwa!")}`);
  } else {
    savedTerms.splice(idx, 1);
    showToast(`🗑️ ${t("Term removed", "Neno limeondolewa")}`);
  }
  localStorage.setItem("lf_saved", JSON.stringify(savedTerms));
  if (currentPage === "translation") renderTranslation();
  if (currentPage === "saved") renderSaved();
}

function toggleSave(termId) { toggleSaveAI(termId); }

function renderSaved() {
  const el = document.getElementById("page-saved");
  el.innerHTML = `
    <div class="page-header">
      <h1>🔖 ${t("Saved Terms", "Maneno Yaliyohifadhiwa")}</h1>
      <p>${t("Your personal term collection", "Mkusanyiko wako wa maneno")}</p>
    </div>
    <div class="saved-page">
      ${savedTerms.length ? `
        <div class="saved-stats fade-in">
          <div class="stat-box">
            <div class="stat-num">${savedTerms.length}</div>
            <div class="stat-label">${t("Terms Saved", "Maneno Yaliyohifadhiwa")}</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${new Set(savedTerms.map(s=>s.category)).size}</div>
            <div class="stat-label">${t("Categories", "Makundi")}</div>
          </div>
        </div>
        ${savedTerms.map(term => `
          <div class="saved-item fade-in" onclick="openSavedTerm('${String(term.id).replace(/'/g, "\\'")}')">
            <div class="saved-item-info">
              <div class="saved-item-word">${t(term.en, term.sw)}</div>
              <div class="saved-item-trans">${t(term.sw, term.en)}</div>
              <div class="saved-item-cat">${CATEGORIES.find(c=>c.id===term.category)?.name || term.category}</div>
            </div>
            <button class="saved-delete" onclick="event.stopPropagation(); toggleSave('${String(term.id).replace(/'/g, "\\'")}')" title="${t("Remove","Ondoa")}">🗑️</button>
          </div>
        `).join("")}
      ` : `
        <div class="saved-empty">
          <div class="empty-icon">🔖</div>
          <p>${t("No saved terms yet. Search and save terms you want to remember!", "Bado hakuna maneno yaliyohifadhiwa. Tafuta na uhifadhi maneno unayotaka kukumbuka!")}</p>
        </div>
      `}
    </div>
  `;
}

// ─── CATEGORY PAGE ───────────────────────────────────────────────────────────

function renderCategory() {
  const cat = CATEGORIES.find(c => c.id === currentCategory);
  const terms = TERMS.filter(t => t.category === currentCategory);
  const el = document.getElementById("page-category");
  el.innerHTML = `
    <div class="cat-page-header">
      <button class="back-btn" onclick="navigate('home')">← ${t("Back", "Rudi")}</button>
      <h1 class="cat-page-title">${cat.icon} ${t(cat.name, cat.swName)}</h1>
      <p class="cat-page-subtitle">${terms.length} ${t("terms available", "maneno yanapatikana")}</p>
    </div>
    <div class="word-list">
      ${terms.map(term => `
        <div class="word-item fade-in" onclick="navigate('translation', TERMS.find(t=>t.id===${term.id}))">
          <div class="word-item-body">
            <div class="word-en">${t(term.en, term.sw)}</div>
            <div class="word-sw">${t(term.sw, term.en)}</div>
          </div>
          <span class="word-arrow">›</span>
        </div>
      `).join("")}
    </div>
  `;
}

// ─── EXPLORE (AI POWERED) ────────────────────────────────────────────────────

let exploreDetailData = null;
let aiExploreCache = null; // kept for compatibility but no longer used

async function fetchAIExploreContent() {

  // Pick 3 distinct confusion pairs from a large pool — randomly each time
  const confusionPool = [
    ["Revenue", "Profit"], ["Gross Profit", "Net Profit"], ["Loan", "Credit"],
    ["Savings", "Investment"], ["Insurance Premium", "Insurance Claim"],
    ["Inflation", "Deflation"], ["Recession", "Depression"],
    ["Stock", "Bond"], ["Asset", "Liability"], ["Budget", "Forecast"],
    ["Debit", "Credit"], ["Liquidity", "Solvency"], ["Tax Avoidance", "Tax Evasion"],
    ["Overdraft", "Loan"], ["Microfinance", "Commercial Banking"],
    ["Fixed Deposit", "Savings Account"], ["Interest Rate", "Exchange Rate"],
    ["Monopoly", "Oligopoly"], ["Supply", "Demand"], ["GDP", "GNP"],
    ["Fiscal Policy", "Monetary Policy"], ["Dividend", "Capital Gain"],
    ["Venture Capital", "Angel Investor"], ["Mortgage", "Rent"],
    ["Devaluation", "Depreciation"], ["Bull Market", "Bear Market"],
    ["Wholesale", "Retail"], ["Cash Flow", "Profit"], ["Balance Sheet", "Income Statement"],
    ["Collateral", "Guarantor"], ["Equity", "Debt"], ["Amortization", "Depreciation"],
  ];

  // Pick 3 random unique pairs
  const shuffled = confusionPool.sort(() => Math.random() - 0.5);
  const selectedPairs = shuffled.slice(0, 3);

  // Pick 5 random tip themes from a large pool
  const tipPool = [
    { icon: "💰", theme: "the 50/30/20 budgeting rule for Tanzanian households" },
    { icon: "📱", theme: "using M-Pesa and mobile banking wisely to avoid charges" },
    { icon: "🏦", theme: "benefits of opening a fixed deposit account in Tanzania" },
    { icon: "🤝", theme: "joining a VICOBA or SACCOS group for community saving" },
    { icon: "📈", theme: "starting small investments with as little as 10,000 Tsh" },
    { icon: "🛡️", theme: "why microinsurance is important for low-income families" },
    { icon: "🧾", theme: "tracking daily expenses using a simple notebook or phone app" },
    { icon: "🚫", theme: "avoiding loan sharks and predatory lenders in Tanzania" },
    { icon: "🎯", theme: "setting specific savings goals instead of saving vaguely" },
    { icon: "💳", theme: "understanding transaction fees on mobile money to save money" },
    { icon: "🏠", theme: "saving for a home or land purchase as a long term goal" },
    { icon: "📊", theme: "understanding your credit score and why it matters" },
    { icon: "🔄", theme: "automating savings by setting up a standing order at the bank" },
    { icon: "🌾", theme: "financial planning tips for farmers and seasonal income earners" },
    { icon: "👩‍💼", theme: "financial tips for women entrepreneurs in Tanzania" },
    { icon: "🎓", theme: "saving for education and school fees in advance" },
    { icon: "⚠️", theme: "identifying and avoiding online financial fraud and phishing" },
    { icon: "💡", theme: "difference between needs and wants when making purchase decisions" },
    { icon: "🌍", theme: "sending and receiving remittances cheaply using digital platforms" },
    { icon: "📉", theme: "what to do financially when you lose your job or income drops" },
  ];
  const shuffledTips = tipPool.sort(() => Math.random() - 0.5).slice(0, 5);

  // Pick a random did-you-know theme
  const dykThemes = [
    "mobile money adoption in Tanzania compared to the rest of Africa",
    "the history of the Tanzanian shilling",
    "how many Tanzanians are unbanked and why",
    "the role of SACCOS in rural Tanzania",
    "Tanzania's GDP growth rate and what drives it",
    "the impact of inflation on everyday Tanzanian families",
    "how microfinance changed lives in East Africa",
    "the growth of fintech startups in Tanzania",
    "Tanzania's largest trading partners and what is exported",
    "the Bank of Tanzania and how it controls money supply",
  ];
  const randomDyk = dykThemes[Math.floor(Math.random() * dykThemes.length)];

  const now = new Date().toISOString();

  const prompt = `You are a bilingual financial education assistant for Tanzania. Current timestamp: ${now}.

Generate content about these EXACT topics — do not change them:

CONFUSION PAIRS to explain (use exactly these terms):
1. "${selectedPairs[0][0]}" vs "${selectedPairs[0][1]}"
2. "${selectedPairs[1][0]}" vs "${selectedPairs[1][1]}"
3. "${selectedPairs[2][0]}" vs "${selectedPairs[2][1]}"

FINANCE TIPS to write (write about each of these exact themes):
1. ${shuffledTips[0].theme} (icon: ${shuffledTips[0].icon})
2. ${shuffledTips[1].theme} (icon: ${shuffledTips[1].icon})
3. ${shuffledTips[2].theme} (icon: ${shuffledTips[2].icon})
4. ${shuffledTips[3].theme} (icon: ${shuffledTips[3].icon})
5. ${shuffledTips[4].theme} (icon: ${shuffledTips[4].icon})

DID YOU KNOW: Write a surprising fact about "${randomDyk}" relevant to Tanzania.

Respond ONLY with valid JSON, no markdown, no extra text. Keep each text field under 100 words:
{
  "confusionPairs": [
    {
      "title": "${selectedPairs[0][0]} vs ${selectedPairs[0][1]}",
      "term1": { "word": "${selectedPairs[0][0]}", "def": "one sentence definition" },
      "term2": { "word": "${selectedPairs[0][1]}", "def": "one sentence definition" },
      "detail": "two sentences max explaining the difference with a Tanzania example"
    },
    {
      "title": "${selectedPairs[1][0]} vs ${selectedPairs[1][1]}",
      "term1": { "word": "${selectedPairs[1][0]}", "def": "one sentence definition" },
      "term2": { "word": "${selectedPairs[1][1]}", "def": "one sentence definition" },
      "detail": "two sentences max explaining the difference with a Tanzania example"
    },
    {
      "title": "${selectedPairs[2][0]} vs ${selectedPairs[2][1]}",
      "term1": { "word": "${selectedPairs[2][0]}", "def": "one sentence definition" },
      "term2": { "word": "${selectedPairs[2][1]}", "def": "one sentence definition" },
      "detail": "two sentences max explaining the difference with a Tanzania example"
    }
  ],
  "financeTips": [
    { "icon": "${shuffledTips[0].icon}", "title": "5 words max", "titleSw": "5 words max in Swahili", "tip": "two sentences in English", "tipSw": "two sentences in Swahili" },
    { "icon": "${shuffledTips[1].icon}", "title": "5 words max", "titleSw": "5 words max in Swahili", "tip": "two sentences in English", "tipSw": "two sentences in Swahili" },
    { "icon": "${shuffledTips[2].icon}", "title": "5 words max", "titleSw": "5 words max in Swahili", "tip": "two sentences in English", "tipSw": "two sentences in Swahili" },
    { "icon": "${shuffledTips[3].icon}", "title": "5 words max", "titleSw": "5 words max in Swahili", "tip": "two sentences in English", "tipSw": "two sentences in Swahili" },
    { "icon": "${shuffledTips[4].icon}", "title": "5 words max", "titleSw": "5 words max in Swahili", "tip": "two sentences in English", "tipSw": "two sentences in Swahili" }
  ],
  "didYouKnow": { "fact": "two sentences in English about ${randomDyk}", "factSw": "two sentences in Swahili" }
}`;

  const response = await fetch("/.netlify/functions/groq", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: "You are a financial education assistant. Always respond with valid JSON only, no markdown, no extra text." },
        { role: "user", content: prompt }
      ],
      temperature: 0.95,
      max_tokens: 2500,
    })
  });

  if (!response.ok) throw new Error("Groq error: " + response.status);
  const data = await response.json();
  const text = data.choices[0].message.content.trim();
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

async function renderExplore() {
  const el = document.getElementById("page-explore");

  // Show loading skeleton immediately
  el.innerHTML = `
    <div class="page-header">
      <h1>🔎 ${t("Explore More", "Chunguza Zaidi")}</h1>
      <p>${t("AI-powered financial insights", "Maarifa ya fedha yanayotolewa na AI")}</p>
    </div>
    <div class="explore-page">
      <div class="explore-loading">
        <div class="ai-spinner" style="margin:0 auto 16px;width:36px;height:36px;border-width:4px;"></div>
        <p style="color:var(--slate);font-size:14px;text-align:center;">
          ${t("🤖 AI is generating fresh content for you...", "🤖 AI inatengeneza maudhui mapya kwako...")}
        </p>
      </div>
    </div>`;

  try {
    // ALWAYS fetch fresh — never use cache
    const content = await fetchAIExploreContent();
    renderExploreContent(el, content);
  } catch (err) {
    console.error("Explore AI error:", err);
    renderExploreContent(el, { confusionPairs: CONFUSION_PAIRS_FALLBACK, financeTips: TIPS_FALLBACK, didYouKnow: DYK_FALLBACK });
  }
}

function renderExploreContent(el, content) {
  el.innerHTML = `
    <div class="page-header">
      <h1>🔎 ${t("Explore More", "Chunguza Zaidi")}</h1>
      <p>${t("AI-powered financial insights", "Maarifa ya fedha yanayotolewa na AI")}</p>
    </div>
    <div class="explore-page">

      <!-- DID YOU KNOW -->
      <div class="explore-dyk fade-in">
        <div class="dyk-label">💡 ${t("Did You Know?", "Je, Ulijua?")}</div>
        <p>${t(content.didYouKnow.fact, content.didYouKnow.factSw)}</p>
      </div>

      <!-- FINANCE TIPS -->
      <div class="section-label" style="padding:0 0 12px;">🏆 ${t("Smart Money Tips", "Vidokezo vya Pesa Smart")}</div>
      ${content.financeTips.map((tip, i) => `
        <div class="tip-card fade-in" style="animation-delay:${i * 0.07}s">
          <div class="tip-icon-box">${tip.icon}</div>
          <div class="tip-body">
            <div class="tip-title">${t(tip.title, tip.titleSw)}</div>
            <div class="tip-text">${t(tip.tip, tip.tipSw)}</div>
          </div>
        </div>
      `).join("")}

      <!-- CONFUSION PAIRS -->
      <div class="section-label" style="padding:20px 0 12px;">⚖️ ${t("Easily Confused Terms", "Maneno Yanayotatanisha")}</div>
      ${content.confusionPairs.map((pair, i) => `
        <div class="confusion-card fade-in" onclick="exploreDetailData=${i}; aiExploreDetailPair=${JSON.stringify(pair).replace(/'/g,"&#39;").replace(/"/g,"&quot;")}; navigate('explore-detail')">
          <div class="confusion-title">⚖️ ${pair.title}</div>
          <div class="confusion-vs">
            <div class="vs-term">
              <div class="vs-word">${pair.term1.word}</div>
              <div class="vs-def">${pair.term1.def}</div>
            </div>
            <div class="vs-divider">VS</div>
            <div class="vs-term">
              <div class="vs-word">${pair.term2.word}</div>
              <div class="vs-def">${pair.term2.def}</div>
            </div>
          </div>
          <div style="color:var(--gold);font-size:13px;font-weight:600;text-align:right;">
            ${t("Read more →", "Soma zaidi →")}
          </div>
        </div>
      `).join("")}

      <!-- REFRESH BUTTON -->
      <button class="save-btn" style="margin-top:8px;" onclick="renderExplore()">
        🔄 ${t("Generate New Content", "Tengeneza Maudhui Mapya")}
      </button>
    </div>
  `;

  // Store pairs for detail page
  window._aiExplorePairs = content.confusionPairs;
}

// Fallback content if AI is unavailable
const CONFUSION_PAIRS_FALLBACK = [
  { title: "Business Partnership vs Partnership Business", term1: { word: "Business Partnership", def: "Two or more people join to run a business together." }, term2: { word: "Partnership Business", def: "A legally registered business structure." }, detail: "A business partnership is the relationship between people working together. A partnership business is the legal entity they register. Two friends selling clothes together have a business partnership; when they register it officially, it becomes a partnership business." },
  { title: "Savings vs Investment", term1: { word: "Savings", def: "Money kept safely with low risk." }, term2: { word: "Investment", def: "Money put to work for growth, with some risk." }, detail: "Savings is money you set aside securely — like in your bank account or VICOBA. Investment is money you put into something expecting a return, like starting a business or buying shares. Savings protects your money; investment grows it." },
  { title: "Loan vs Credit", term1: { word: "Loan", def: "A fixed amount borrowed and repaid over time." }, term2: { word: "Credit", def: "A flexible borrowing limit used as needed." }, detail: "A loan gives you one lump sum you repay in installments. Credit is a limit you can dip into anytime. Taking 500,000 Tsh from CRDB for school fees is a loan; your credit card limit is credit." },
];
const TIPS_FALLBACK = [
  { icon: "💰", title: "Save First, Spend Later", titleSw: "Okoa Kwanza, Tumia Baadaye", tip: "Set aside at least 10% of your income before spending on anything else.", tipSw: "Weka akiba angalau 10% ya mapato yako kabla ya kutumia chochote." },
  { icon: "📈", title: "Let Your Money Grow", titleSw: "Acha Pesa Yako Ikue", tip: "Put savings into a fixed deposit account to earn interest over time.", tipSw: "Weka akiba kwenye akaunti ya amana ili kupata riba baada ya muda." },
  { icon: "🏦", title: "Use Mobile Banking", titleSw: "Tumia Benki ya Simu", tip: "Track all your transactions with mobile banking to avoid overspending.", tipSw: "Fuatilia miamala yako yote kwa benki ya simu ili kuepuka kutumia kupita kiasi." },
  { icon: "🤝", title: "Join a VICOBA", titleSw: "Jiunge na VICOBA", tip: "Village community banks help you save and access small loans without high interest.", tipSw: "Benki za jamii za vijiji zinakusaidia kuokoa na kupata mikopo midogo bila riba kubwa." },
  { icon: "📱", title: "Avoid Impulse Buying", titleSw: "Epuka Ununuzi wa Msukumo", tip: "Wait 24 hours before making any unplanned purchase to decide if you really need it.", tipSw: "Subiri masaa 24 kabla ya kufanya ununuzi wowote usiopangwa kuamua kama unahitaji kweli." },
];
const DYK_FALLBACK = { fact: "Tanzania has over 40 million mobile money users, making it one of the most financially connected countries in Africa.", factSw: "Tanzania ina watumiaji zaidi ya milioni 40 wa pesa za simu, na kuifanya kuwa moja ya nchi zilizounganishwa zaidi kifedha barani Afrika." };

let aiExploreDetailPair = null;

function renderExploreDetail() {
  const el = document.getElementById("page-explore-detail");
  let data, backPage;

  if (typeof exploreDetailData === "number") {
    // Use AI generated pairs if available, else fallback
    const pairs = window._aiExplorePairs || CONFUSION_PAIRS_FALLBACK;
    data = pairs[exploreDetailData];
    backPage = "explore";
  } else {
    // Term of the day detail
    const term = currentTerm || TERM_OF_DAY;
    el.innerHTML = `
      <div style="padding:16px 20px 0;">
        <button class="back-btn" onclick="navigate('home')" style="color:var(--gold);background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;padding:0;margin-bottom:12px;">
          ← ${t("Back", "Rudi")}
        </button>
      </div>
      <div class="explore-detail">
        <div class="detail-header fade-in">
          <div class="tod-term-row">
            <div class="detail-title">${t(term.en, term.sw)}</div>
            <button class="sound-btn" onclick="speakTerm(this,'${t(term.en,term.sw)}')" style="margin-left:8px">🔊</button>
          </div>
          <p class="detail-subtitle">${t(term.sw, term.en)}</p>
        </div>
        <div class="trans-card fade-in-2">
          <div class="trans-card-title">📖 ${t("Full Definition","Maana Kamili")}</div>
          <p class="trans-definition">${t(term.definition, term.swDefinition)}</p>
        </div>
        <div class="trans-card fade-in-2">
          <div class="trans-card-title">💡 ${t("Real-Life Example","Mfano wa Maisha Halisi")}</div>
          <div class="trans-example">${t(term.example, term.swExample)}</div>
        </div>
        <div class="trans-card fade-in-3">
          <div class="trans-card-title">🇹🇿 ${t("Swahili Example","Mfano wa Kiswahili")}</div>
          <div class="trans-example">${currentLang === "en" ? term.swExample : term.example}</div>
        </div>
        <button class="save-btn fade-in-3" onclick="openFullTranslation()">
          🔍 ${t("See Full Translation", "Ona Tafsiri Kamili")}
        </button>
      </div>
    `;
    return;
  }

  el.innerHTML = `
    <div style="padding:16px 20px 0;">
      <button class="back-btn" onclick="navigate('explore')" style="color:var(--gold);background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif;padding:0;margin-bottom:12px;">
        ← ${t("Back to Explore", "Rudi Chunguza")}
      </button>
    </div>
    <div class="explore-detail">
      <div class="detail-header fade-in">
        <div class="detail-title">⚖️ ${data.title}</div>
        <p class="detail-subtitle">${t("Understanding the difference", "Kuelewa tofauti")}</p>
      </div>
      <div class="confusion-card fade-in-2" style="cursor:default;">
        <div class="confusion-vs">
          <div class="vs-term">
            <div class="vs-word">${data.term1.word}</div>
            <div class="vs-def">${data.term1.def}</div>
          </div>
          <div class="vs-divider">VS</div>
          <div class="vs-term">
            <div class="vs-word">${data.term2.word}</div>
            <div class="vs-def">${data.term2.def}</div>
          </div>
        </div>
      </div>
      <div class="trans-card fade-in-3">
        <div class="trans-card-title">📖 ${t("Detailed Explanation","Maelezo ya Kina")}</div>
        <p class="trans-definition" style="line-height:1.8;">${data.detail}</p>
      </div>
    </div>
  `;
}

// ─── HELP PAGE ───────────────────────────────────────────────────────────────

function renderHelp() {
  const steps = [
    { icon: "🔍", title: t("Search a Term", "Tafuta Neno"), desc: t("Type any financial word in English or Swahili in the search bar on the home page.", "Andika neno lolote la fedha kwa Kiingereza au Kiswahili katika kisanduku cha utafutaji ukurasa wa nyumbani.") },
    { icon: "📖", title: t("Read the Translation", "Soma Tafsiri"), desc: t("The translation page shows the term, its Swahili equivalent, definition, and a real-life example.", "Ukurasa wa tafsiri unaonyesha neno, sawa yake ya Kiswahili, maana, na mfano wa maisha halisi.") },
    { icon: "🔊", title: t("Listen to Pronunciation", "Sikiliza Matamshi"), desc: t("Tap the speaker icon 🔊 next to any term to hear how it is pronounced.", "Gonga ikoni ya spika 🔊 karibu na neno lolote kusikia jinsi linavyotamkwa.") },
    { icon: "🔖", title: t("Save Terms", "Hifadhi Maneno"), desc: t("Tap 'Save this Term' on the translation page. Access all saved terms from the menu.", "Gonga 'Hifadhi Neno Hili' kwenye ukurasa wa tafsiri. Fikia maneno yote yaliyohifadhiwa kutoka kwenye menyu.") },
    { icon: "☰", title: t("Use the Menu", "Tumia Menyu"), desc: t("Tap the three bars (☰) at the top left to navigate to Home, Saved Terms, Help, Explore, and Account.", "Gonga mistari mitatu (☰) juu kushoto kupita Nyumbani, Maneno Yaliyohifadhiwa, Msaada, Chunguza, na Akaunti.") },
    { icon: "🌐", title: t("Switch Language", "Badilisha Lugha"), desc: t("Tap the EN/SW card at the top right to switch between English and Swahili at any time.", "Gonga kadi ya EN/SW juu kulia kubadilisha kati ya Kiingereza na Kiswahili wakati wowote.") },
  ];

  const el = document.getElementById("page-help");
  el.innerHTML = `
    <div class="page-header">
      <h1>❓ ${t("How to Use LingoFinance", "Jinsi ya Kutumia LingoFinance")}</h1>
      <p>${t("Your guide to getting started", "Mwongozo wako wa kuanza")}</p>
    </div>
    <div class="help-page">
      ${steps.map((s, i) => `
        <div class="help-step fade-in" style="animation-delay:${i * 0.06}s">
          <div class="step-num">${i + 1}</div>
          <div class="step-content">
            <h3>${s.icon} ${s.title}</h3>
            <p>${s.desc}</p>
          </div>
        </div>
      `).join("")}
      <div class="help-tip fade-in">
        <span class="tip-icon">💡</span>
        <p><strong>${t("Pro Tip:", "Kidokezo cha Mtaalamu:")}</strong> ${t(
          "Use the Explore More section to understand tricky terms that are often confused.",
          "Tumia sehemu ya Chunguza Zaidi kuelewa maneno magumu ambayo mara nyingi yanatatanishwa."
        )}</p>
      </div>
    </div>
  `;
}

// ─── ACCOUNT PAGE ────────────────────────────────────────────────────────────

function renderAccount() {
  const el = document.getElementById("page-account");
  const name = currentUser?.fullName || t("User", "Mtumiaji");
  const email = currentUser?.email || "";
  const initial = name.charAt(0).toUpperCase();
  el.innerHTML = `
    <div class="account-hero">
      <div class="account-avatar">${initial}</div>
      <div class="account-name">${name}</div>
      <div class="account-email">${email}</div>
    </div>
    <div class="account-body">
      <div class="account-card fade-in">
        <div class="account-section-title">${t("My Progress", "Maendeleo Yangu")}</div>
        <div class="account-row">
          <span class="account-row-icon">🔖</span>
          <span class="account-row-text">${t("Saved Terms", "Maneno Yaliyohifadhiwa")}</span>
          <span class="account-row-val">${savedTerms.length}</span>
        </div>
        <div class="account-row">
          <span class="account-row-icon">🔍</span>
          <span class="account-row-text">${t("Terms Searched", "Maneno Yaliyotafutwa")}</span>
          <span class="account-row-val">${searchHistory.length}</span>
        </div>
        <div class="account-row">
          <span class="account-row-icon">🌐</span>
          <span class="account-row-text">${t("Current Language", "Lugha ya Sasa")}</span>
          <span class="account-row-val">${currentLang === "en" ? "English" : "Kiswahili"}</span>
        </div>
      </div>
      <div class="account-card fade-in-2">
        <div class="account-section-title">${t("Settings", "Mipangilio")}</div>
        <div class="account-row" onclick="toggleLanguage()">
          <span class="account-row-icon">🌐</span>
          <span class="account-row-text">${t("Switch Language", "Badilisha Lugha")}</span>
          <span class="account-row-val">${currentLang === "en" ? "EN → SW" : "SW → EN"}</span>
        </div>
        <div class="account-row" onclick="showToast('${t("Notifications coming soon!","Arifa zinakuja hivi karibuni!")}')">
          <span class="account-row-icon">🔔</span>
          <span class="account-row-text">${t("Notifications", "Arifa")}</span>
          <span class="account-row-val">${t("On", "Imewashwa")}</span>
        </div>
      </div>
      <div class="account-card fade-in-3">
        <div class="account-section-title">${t("About", "Kuhusu")}</div>
        <div class="account-row" onclick="showAboutApp()">
          <span class="account-row-icon">ℹ️</span>
          <span class="account-row-text">LingoFinance</span>
          <span class="account-row-val">v1.0 ›</span>
        </div>
        <div class="account-row" onclick="navigate('help')">
          <span class="account-row-icon">❓</span>
          <span class="account-row-text">${t("Help & Support", "Msaada na Usaidizi")}</span>
          <span class="account-row-val">›</span>
        </div>
      </div>
      <div class="account-card fade-in-3">
        <div class="account-section-title">${t("Session", "Kikao")}</div>
        <div class="account-row" onclick="handleLogout()">
          <span class="account-row-icon">🚪</span>
          <span class="account-row-text">${t("Sign Out", "Toka")}</span>
          <span class="account-row-val">›</span>
        </div>
      </div>
    </div>
  `;
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebar-overlay").classList.add("open");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebar-overlay").classList.remove("open");
}

function updateSidebarActive() {
  document.querySelectorAll(".sidebar-nav a").forEach(a => {
    a.classList.toggle("active", a.dataset.page === currentPage);
  });
}

// ─── SPEECH ──────────────────────────────────────────────────────────────────

function speakTerm(btn, text) {
  if (!window.speechSynthesis) { showToast("🔇 Speech not supported"); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = currentLang === "sw" ? "sw-TZ" : "en-US";
  utter.rate = 0.9;
  btn.classList.add("playing");
  utter.onend = () => btn.classList.remove("playing");
  window.speechSynthesis.speak(utter);
}

/**
 * startVoiceInput — shared mic handler used by home search and AI input.
 * targetInputId: the id of the <input> or <textarea> to fill.
 * onDone: optional callback fired after speech is captured.
 * btnEl: the mic button element (gets active class while listening).
 */
function startVoiceInput(targetInputId, onDone, btnEl) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    showToast(
      currentLang === "sw"
        ? "🎤 Kivinjari chako hakisaidii sauti"
        : "🎤 Your browser does not support voice input"
    );
    return;
  }

  const rec = new SR();
  rec.lang = currentLang === "sw" ? "sw-TZ" : "en-US";
  rec.interimResults = false;
  rec.maxAlternatives = 1;

  if (btnEl) btnEl.classList.add("mic-active");

  rec.onresult = e => {
    const transcript = e.results[0][0].transcript;
    const input = document.getElementById(targetInputId);
    if (input) {
      input.value = transcript;
      // Trigger input event so live suggestions fire on search box
      input.dispatchEvent(new Event("input"));
    }
    if (btnEl) btnEl.classList.remove("mic-active");
    if (typeof onDone === "function") onDone(transcript);
  };

  rec.onerror = err => {
    if (btnEl) btnEl.classList.remove("mic-active");
    if (err.error !== "no-speech") {
      showToast(
        currentLang === "sw"
          ? "🎤 Hitilafu ya sauti: " + err.error
          : "🎤 Voice error: " + err.error
      );
    }
  };

  rec.onend = () => {
    if (btnEl) btnEl.classList.remove("mic-active");
  };

  rec.start();
}

// ─── TOAST ───────────────────────────────────────────────────────────────────

function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.innerHTML = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────

// Show auth or app shell immediately — both start hidden in HTML
(function _bootstrapAuthUI() {
  const hasSession = !!localStorage.getItem("lf_session");
  const authEl = document.getElementById("auth-screen");
  const appEl  = document.getElementById("app-shell");
  if (hasSession) {
    if (appEl)  appEl.style.display  = "block";
    if (authEl) authEl.style.display = "none";
  } else if (authEl) {
    authEl.style.display = "flex";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  // Auth check — show account screen or restore session
  initAuth();

  // Sidebar navigation links
  document.querySelectorAll(".sidebar-nav a[data-page]").forEach(a => {
    a.addEventListener("click", e => {
      e.preventDefault();
      closeSidebar();
      navigate(a.dataset.page);
    });
  });

  // Close history dropdown on outside click
  document.addEventListener("click", e => {
    const dd  = document.getElementById("history-dropdown");
    const btn = document.querySelector(".history-btn");
    if (dd && !dd.contains(e.target) && btn && !btn.contains(e.target)) {
      dd.classList.remove("open");
    }
  });

  // Allow Enter key to submit auth forms
  document.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    const authScreen = document.getElementById("auth-screen");
    if (!authScreen || authScreen.style.display === "none") return;
    const signupForm = document.getElementById("form-signup");
    const signinForm = document.getElementById("form-signin");
    if (signupForm && signupForm.style.display !== "none") handleSignUp();
    else if (signinForm && signinForm.style.display !== "none") handleSignIn();
  });
});
// ─── AI ASSISTANT PAGE ───────────────────────────────────────────────────────

/** loadAIChat — restores persisted conversation from localStorage */
function loadAIChat() {
  try {
    const raw = localStorage.getItem("lf_ai_chat");
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/** saveAIChat — persists last 20 turns to localStorage */
function saveAIChat() {
  try {
    localStorage.setItem("lf_ai_chat", JSON.stringify(aiChatHistory.slice(-20)));
  } catch (e) {
    console.warn("Could not save AI chat:", e);
  }
}

/** resetAIChat — clears history and re-renders the assistant page */
function resetAIChat() {
  aiChatHistory = [];
  localStorage.removeItem("lf_ai_chat");
  renderAIAssistant();
}
// ─── AI ASSISTANT — FINANCE QUESTION GUARD ───────────────────────────────────
/**
 * isFinanceQuestion — broader than isFinanceTerm, built for conversational text.
 * Checks the full message for finance intent including question patterns.
 */
function isFinanceQuestion(text) {
  const q = text.toLowerCase().trim();
  if (FINANCE_QUESTION_PATTERNS.some(p => new RegExp(p, "i").test(q))) return true;
  return FINANCE_KEYWORDS.some(kw => q.includes(kw));
}
/** renderAIAssistant — builds the full chat UI and restores history */
function renderAIAssistant() {
  const el = document.getElementById("page-ai-assistant");
  if (!el) return;

  const suggestions = currentLang === "en" ? AI_SUGGESTIONS_EN : AI_SUGGESTIONS_SW;

  // Restore persisted history into memory
  if (aiChatHistory.length === 0) {
    aiChatHistory = loadAIChat();
  }

  el.innerHTML = `
    <div class="assistant-wrapper" style="display:flex;flex-direction:column;height:calc(100vh - 58px);">

      <!-- Header -->
      <div class="assistant-header" style="background:var(--grad-main,linear-gradient(135deg,#7C3AED,#4C1D95));
        padding:16px 20px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div>
          <h1 style="font-family:'Playfair Display',serif;color:#000;font-size:20px;margin:0;">
            🤖 ${t("AI Financial Assistant", "Msaidizi wa Fedha wa AI")}
          </h1>
          <p style="color:rgba(0,0,0,0.72);font-size:12px;margin:3px 0 0;">
            ${t("Finance questions only — English or Swahili", "Maswali ya fedha tu — Kiingereza au Kiswahili")}
          </p>
        </div>
        <button onclick="resetAIChat()"
          style="background:rgba(255,255,255,0.55);border:none;cursor:pointer;
          color:#000;font-size:12px;font-weight:600;padding:7px 14px;border-radius:50px;
          font-family:'DM Sans',sans-serif;white-space:nowrap;">
          🗑️ ${t("Clear Chat", "Futa Mazungumzo")}
        </button>
      </div>

      <!-- Message list -->
      <div id="ai-messages" style="flex:1;overflow-y:auto;padding:16px 16px 8px;
        display:flex;flex-direction:column;gap:12px;background:var(--cream,#F8F7FB);">

        <!-- Welcome message (always shown) -->
        <div class="msg-ai fade-in" style="display:flex;align-items:flex-end;gap:8px;">
          <div style="width:32px;height:32px;border-radius:50%;
            background:linear-gradient(135deg,#7C3AED,#4C1D95);
            display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🤖</div>
          <div class="msg-bubble-ai" style="background:#fff;border-radius:18px 18px 18px 4px;
            padding:11px 15px;font-size:14px;max-width:86%;line-height:1.6;
            box-shadow:0 2px 8px rgba(124,58,237,0.10);border:1px solid rgba(124,58,237,0.08);">
            ${t(
              "<strong>Hello! I'm your LingoFinance AI assistant.</strong><br>I can help you understand financial concepts, guide you on investments, savings, loans, mobile money, budgeting, and more — focused on Tanzania.<br><br>What would you like to know?",
              "<strong>Habari! Mimi ni msaidizi wako wa AI wa LingoFinance.</strong><br>Ninaweza kukusaidia kuelewa dhana za fedha, kukuongoza kuhusu uwekezaji, akiba, mikopo, pesa ya simu, bajeti, na zaidi — kwa kuzingatia Tanzania.<br><br>Ungependa kujua nini?"
            )}
          </div>
        </div>

        <!-- Render restored history turns -->
        ${aiChatHistory.map(turn => _buildBubbleHTML(turn.role, turn.content)).join("")}

      </div>

      <!-- Quick suggestion chips (hidden once user sends first message) -->
      <div id="ai-suggestions" style="display:${aiChatHistory.length > 0 ? "none" : "flex"};
        flex-wrap:wrap;gap:7px;padding:8px 16px 4px;flex-shrink:0;">
        ${suggestions.map(s => `
          <button onclick="_aiSendSuggestion('${s.replace(/'/g, "\\'")}')"
            style="background:#fff;border:1.5px solid rgba(124,58,237,0.20);border-radius:20px;
            padding:7px 13px;font-size:12px;color:#4C1D95;cursor:pointer;
            font-family:'DM Sans',sans-serif;transition:all 0.2s;">
            💬 ${s}
          </button>`).join("")}
      </div>

      <!-- Input row -->
      <div style="padding:10px 14px 14px;background:#fff;
        border-top:1px solid rgba(124,58,237,0.10);display:flex;gap:10px;align-items:flex-end;flex-shrink:0;">
        <textarea id="ai-input"
          placeholder="${t("Ask a finance question...", "Uliza swali la fedha...")}"
          rows="1"
          style="flex:1;border:1.5px solid rgba(124,58,237,0.18);border-radius:20px;
          padding:10px 16px;font-family:'DM Sans',sans-serif;font-size:14px;
          color:var(--text-dark,#1E1033);outline:none;resize:none;max-height:100px;
          background:var(--cream,#F8F7FB);transition:border-color 0.2s;"
          onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();sendAIMessage();}"
          oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,100)+'px';"
          onfocus="this.style.borderColor='#7C3AED';this.style.background='#fff';"
          onblur="this.style.borderColor='rgba(124,58,237,0.18)';this.style.background='var(--cream,#F8F7FB)';"
        ></textarea>
        <button id="ai-mic-btn"
          onclick="startVoiceInput('ai-input', null, document.getElementById('ai-mic-btn'))"
          title="${t('Voice input','Ingiza kwa sauti')}"
          style="background:rgba(124,58,237,0.08);border:1.5px solid rgba(124,58,237,0.22);
          cursor:pointer;width:40px;height:40px;border-radius:50%;font-size:16px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          transition:background 0.2s;">🎤</button>
        <button onclick="sendAIMessage()"
          style="background:linear-gradient(135deg,#7C3AED,#4C1D95);border:none;cursor:pointer;
          width:40px;height:40px;border-radius:50%;color:#fff;font-size:16px;
          display:flex;align-items:center;justify-content:center;flex-shrink:0;
          transition:opacity 0.2s,transform 0.2s;" title="${t("Send","Tuma")}">➤</button>
      </div>

    </div>
  `;

  _scrollAIChat();
}

/** sendAIMessage — validates, guards, calls API, renders response */
async function sendAIMessage() {
  const input = document.getElementById("ai-input");
  const msg   = input ? input.value.trim() : "";
  if (!msg) return;

  // Clear input immediately
  input.value = "";
  input.style.height = "auto";

  // Hide suggestion chips after first send
  const chips = document.getElementById("ai-suggestions");
  if (chips) chips.style.display = "none";

  // Render user bubble
  _appendAIBubble("user", msg);

  
  

  // Disable send while waiting
  const sendBtn = document.querySelector("#page-ai-assistant button[onclick=\"sendAIMessage()\"]");
  if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = "0.5"; }

  // Add to history and show typing indicator
  aiChatHistory.push({ role: "user", content: msg });
  const typingId = "ai-typing-" + Date.now();
  _appendTypingIndicator(typingId);

  try {
    const knownMatches = findKnownProductsInText(msg);
    const groundingBlock = knownMatches.length ? `

VERIFIED FACTS — use these exact facts for the products mentioned below instead of guessing. If the user's question goes beyond what's listed, you may add general, cautious context, but do not contradict these facts:
${knownMatches.map(p => `- ${p.en}: ${t(p.definition, p.swDefinition)}`).join("\n")}` : "";

    const systemPrompt = `You are a finance expert and friendly bilingual financial assistant for LingoFinance, a Swahili financial education app for Tanzania and East Africa.
STRICT RULES:
- You decide whether the user's message is a finance term, financial service, banking product, insurance product, investment, tax, economics, fintech, mobile money service, digital payment, loan product, or any other finance-related concept (including financial products offered by Tanzanian or East African companies, e.g. mobile network operators like Vodacom, Airtel, Tigo).
- If the message IS finance-related, answer it normally following the rules below.
- If the message is NOT related to finance in any way, respond with EXACTLY this and nothing else: NOT_FINANCE
- Branded products that look like ordinary words: many real Tanzanian/East African financial products are named after everyday Swahili verbs or nouns (e.g. "Songesha", "Timiza", "M-Pawa"), and some are named after everyday slang phrases that became official services. Before deciding a message is just ordinary vocabulary or chit-chat, actively search the web for the phrase together with "Vodacom Tanzania", "Airtel Tanzania", "Yas Tanzania", or "loan service" to check whether it could ALSO be the name of a mobile money, airtime, loan, savings, or insurance service — do not conclude NOT_FINANCE from general knowledge alone without searching first. Only return NOT_FINANCE when a real search turns up no plausible financial-service reading at all (e.g. a greeting, food, sports, weather, entertainment, or general chit-chat).${groundingBlock}
- Tanzania context: mention M-Pesa, VICOBA, SACCOS, NMB, CRDB, Bank of Tanzania, TZS, Airtel Money where relevant.
- Respond ONLY in ${currentLang === "sw" ? "Swahili" : "English"}.
- Ignore the user's message language and follow the selected app language.
- Use simple language. Format longer answers with bullet points or numbered steps.
- Be encouraging, concise, and practical.`;

    // If we already have verified facts from the curated glossary, the plain
    // model is fine (and cheaper/faster). Otherwise, use the search-grounded
    // model so it can look up unfamiliar branded products instead of guessing.
    const usingCompound = knownMatches.length === 0;
    const chatModel = usingCompound ? GROQ_COMPOUND_MODEL : GROQ_MODEL;

    const requestBody = {
      model: chatModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...aiChatHistory
      ],
      temperature: 0.65,
      max_tokens: 900,
    };
    // When falling back to the search-grounded model (no curated facts already
    // available), force it to actually run a web search instead of leaving it
    // to the model's own judgment about whether one is needed.
    if (usingCompound) {
      requestBody.compound_custom = { tools: { enabled_tools: ["web_search"] } };
      requestBody.tool_choice = "required";
    }

    const response = await fetch("/.netlify/functions/groq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) throw new Error("API error " + response.status);

    const data  = await response.json();
    const reply = data.choices[0].message.content.trim();

    _removeTypingIndicator(typingId);

    // AI decided this message is not finance-related — show the existing warning bubble
    if (reply.toUpperCase() === NOT_FINANCE) {
      aiChatHistory.pop(); // remove the unanswered user turn
      _appendAIBubble("warning", t(MSG_NON_FINANCE_ASSISTANT.en, MSG_NON_FINANCE_ASSISTANT.sw));
      return;
    }

    aiChatHistory.push({ role: "assistant", content: reply });
    saveAIChat();
    _appendAIBubble("ai", reply);

  } catch (err) {
    console.error("AI assistant error:", err);
    _removeTypingIndicator(typingId);
    aiChatHistory.pop(); // remove unanswered user turn
    _appendAIBubble("ai", t(
      "Sorry, I couldn't connect right now. Please check your internet connection and try again.",
      "Samahani, sikuweza kuunganika sasa hivi. Tafadhali angalia muunganiko wako wa intaneti na ujaribu tena."
    ));
  } finally {
    if (sendBtn) { sendBtn.disabled = false; sendBtn.style.opacity = "1"; }
  }
}

// ─── AI ASSISTANT HELPERS ─────────────────────────────────────────────────────

/** _aiSendSuggestion — fires a chip suggestion as a user message */
function _aiSendSuggestion(text) {
  const chips = document.getElementById("ai-suggestions");
  if (chips) chips.style.display = "none";
  const input = document.getElementById("ai-input");
  if (input) input.value = text;
  sendAIMessage();
}

/** _buildBubbleHTML — returns bubble HTML for a history turn (used on restore) */
function _buildBubbleHTML(role, text) {
  const formatted = _formatAIText(text);
  if (role === "user") {
    return `<div class="msg-user" style="display:flex;justify-content:flex-end;">
      <div style="background:linear-gradient(135deg,#F3E8FF,#E9D5FF);color:#000;
        border-radius:18px 18px 4px 18px;padding:11px 15px;font-size:14px;
        max-width:82%;line-height:1.5;">${formatted}</div>
    </div>`;
  }
  if (role === "assistant" || role === "ai") {
    return `<div class="msg-ai" style="display:flex;align-items:flex-end;gap:8px;">
    <div style="width:32px;height:32px;border-radius:50%;
      background:linear-gradient(135deg,#7C3AED,#4C1D95);
      display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🤖</div>
    <div style="background:#fff;border-radius:18px 18px 18px 4px;padding:11px 15px;
      font-size:14px;max-width:86%;line-height:1.6;
      box-shadow:0 2px 8px rgba(124,58,237,0.10);border:1px solid rgba(124,58,237,0.08);">
      ${formatted}
    </div>
  </div>`;
  }
  return "";
}

/** _appendAIBubble — creates and injects a message bubble into the chat */
function _appendAIBubble(role, text) {
  const box = document.getElementById("ai-messages");
  if (!box) return;
  const div = document.createElement("div");
  div.className = "fade-in";
  const formatted = _formatAIText(text);

  if (role === "user") {
    div.style.cssText = "display:flex;justify-content:flex-end;";
    div.innerHTML = `<div style="background:linear-gradient(135deg,#F3E8FF,#E9D5FF);color:#000;
      border-radius:18px 18px 4px 18px;padding:11px 15px;font-size:14px;
      max-width:82%;line-height:1.5;">${formatted}</div>`;
  } else if (role === "warning") {
    div.style.cssText = "display:flex;align-items:flex-end;gap:8px;";
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;
        background:linear-gradient(135deg,#F59E0B,#EF4444);
        display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">⚠️</div>
      <div style="background:#FFF8E1;border:1px solid #F59E0B;border-radius:18px 18px 18px 4px;
        padding:11px 15px;font-size:13px;color:#7A5A00;max-width:90%;line-height:1.5;">
        ${formatted}
      </div>`;
  } else {
    div.style.cssText = "display:flex;align-items:flex-end;gap:8px;";
    div.innerHTML = `
      <div style="width:32px;height:32px;border-radius:50%;
        background:linear-gradient(135deg,#7C3AED,#4C1D95);
        display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🤖</div>
      <div style="background:#fff;border-radius:18px 18px 18px 4px;padding:11px 15px;
        font-size:14px;max-width:86%;line-height:1.6;
        box-shadow:0 2px 8px rgba(124,58,237,0.10);border:1px solid rgba(124,58,237,0.08);">
        ${formatted}
      </div>`;
  }

  box.appendChild(div);
  _scrollAIChat();
}

/** _appendTypingIndicator — shows animated 3-dot loader while waiting for API */
function _appendTypingIndicator(id) {
  const box = document.getElementById("ai-messages");
  if (!box) return;
  const div = document.createElement("div");
  div.id = id;
  div.style.cssText = "display:flex;align-items:flex-end;gap:8px;";
  div.innerHTML = `
    <div style="width:32px;height:32px;border-radius:50%;
      background:linear-gradient(135deg,#7C3AED,#4C1D95);
      display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;">🤖</div>
    <div style="background:#fff;border-radius:18px 18px 18px 4px;padding:12px 16px;
      box-shadow:0 2px 8px rgba(124,58,237,0.10);border:1px solid rgba(124,58,237,0.08);">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>`;
  box.appendChild(div);
  _scrollAIChat();
}

function _removeTypingIndicator(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

/** _formatAIText — converts markdown-lite to safe HTML */
function _formatAIText(text) {
  return text
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n- /g, "<br>• ")
    .replace(/\n(\d+)\. /g, "<br>$1. ");
}

/** _scrollAIChat — scrolls message list to bottom */
function _scrollAIChat() {
  const box = document.getElementById("ai-messages");
  if (box) setTimeout(() => { box.scrollTop = box.scrollHeight; }, 60);
}
function openFullTranslation() {
  navigate("translation", currentTerm || TERM_OF_DAY);
}
function showAboutApp() {
  alert(
`${t("LingoFinance v1.0", "LingoFinance v1.0")}

${t(
"Finance Language Translation App\nEnglish ↔ Swahili\nCreated for academic demonstration",
"Programu ya Tafsiri ya Lugha ya Fedha\nKiingereza ↔ Kiswahili\nImetengenezwa kwa maonesho ya kitaaluma"
)}`
  );
}