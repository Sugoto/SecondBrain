const BUDGET_TYPE = {
  Groceries: "need",
  Health: "need",
  Bills: "need",
  Investments: "need",
  Food: "want",
  Shopping: "want",
  Entertainment: "want",
  Travel: "want",
};
const CATEGORIES = Object.keys(BUDGET_TYPE);

function syncAxisBankToSupabase() {
  const threads = GmailApp.search(
    `from:(alerts@axisbank.com OR "axis bank") newer_than:1h in:anywhere`,
    0,
    100
  );
  let saved = 0,
    skipped = 0;

  threads.forEach((t) =>
    t.getMessages().forEach((m) => {
      const parsed = parseAxisBankEmail(m.getPlainBody());
      if (parsed.amount && parsed.isExpense)
        saveToSupabase(parsed) ? saved++ : skipped++;
    })
  );

  Logger.log(`✅ Saved: ${saved} | ⏭️ Skipped: ${skipped}`);
}

function parseAxisBankEmail(body) {
  const r = {
    amount: null,
    merchant: null,
    date: null,
    time: null,
    isExpense: false,
  };
  const c = body.replace(/\r\n/g, "\n").replace(/\t/g, " ");

  r.isExpense = /Amount Debited|has been debited/i.test(c);
  if (!r.isExpense) return r;

  const amt = c.match(/INR\s*([\d,]+\.?\d*)/i);
  if (amt) r.amount = parseFloat(amt[1].replace(/,/g, ""));

  const dt =
    c.match(/(\d{2}-\d{2}-\d{4})\s+(\d{2}:\d{2}:\d{2})/) ||
    c.match(/(\d{2}-\d{2}-\d{2}),\s*(\d{2}:\d{2}:\d{2})/);
  if (dt) {
    r.date = dt[1];
    r.time = dt[2];
  }

  let txn = c.match(/Transaction Info[:\s]*(.+)/i);
  if (txn) {
    const p = txn[1].split("/");
    if (p.length >= 4) r.merchant = p[p.length - 1].trim();
  }

  if (!r.merchant) {
    const at = c.match(/\bat\s+([A-Z]{3,}\/[^\s.]+)/i);
    if (at) {
      const p = at[1].split("/");
      if (p.length >= 2) r.merchant = p[1].trim();
    }
  }

  return r;
}

function categorize(merchant, amount) {
  if (!merchant) return null;

  const prompt = `Categorize this expense: ${CATEGORIES.join(", ")}.
Merchant: ${merchant}, Amount: ₹${amount}
Rules: Food=restaurants/delivery, Groceries=supermarkets, Shopping=retail/electronics, Entertainment=movies/streaming, Travel=transport/flights, Bills=utilities/phone, Health=pharmacy/medical, Investments=stocks/MF.
Reply with ONLY the category name.`;

  try {
    const res = UrlFetchApp.fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        muteHttpExceptions: true,
      }
    );
    const cat = JSON.parse(
      res.getContentText()
    ).candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return CATEGORIES.includes(cat) ? cat : null;
  } catch (e) {
    Logger.log(`⚠️ Gemini: ${e.message}`);
    return null;
  }
}

function saveToSupabase(txn) {
  if (!txn.date || !txn.amount) return false;
  const p = txn.date.split("-");
  if (p.length !== 3) return false;

  const year = p[2].length === 2 ? "20" + p[2] : p[2];
  const cat = categorize(txn.merchant, txn.amount);

  try {
    const res = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/transactions`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      payload: JSON.stringify({
        amount: txn.amount,
        merchant: txn.merchant,
        date: `${year}-${p[1]}-${p[0]}`,
        time: txn.time,
        category: cat,
        budget_type: BUDGET_TYPE[cat] || null,
      }),
      muteHttpExceptions: true,
    });
    const code = res.getResponseCode();
    if (code === 201) {
      Logger.log(
        `✅ ₹${txn.amount} at ${txn.merchant} [${cat || "?"} ${
          BUDGET_TYPE[cat] === "need" ? "📦" : "🎁"
        }]`
      );
      return true;
    }
    if (code === 409) return false;
    Logger.log(`❌ Error ${code}`);
    return false;
  } catch (e) {
    Logger.log(`❌ ${e.message}`);
    return false;
  }
}
