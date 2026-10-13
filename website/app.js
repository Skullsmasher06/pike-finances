// Reads the published Website_Data CSV (key,value) and fills the page.
// All values go in with textContent, never innerHTML, so nothing in the sheet can inject code.
(function () {
  "use strict";
  var CFG = window.PIKE_CONFIG || {};
  var SAMPLE = "sample-data.csv";

  function parseCSV(text) {
    var rows = [], row = [], field = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') { q = false; }
        else { field += c; }
      } else if (c === '"') { q = true; }
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else { field += c; }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  function toMap(rows) {
    var m = {};
    rows.forEach(function (r) {
      var k = (r[0] || "").trim();
      if (k && k !== "key") m[k] = (r[1] || "").trim();
    });
    return m;
  }

  function num(v) {
    if (v === undefined || v === null || v === "") return NaN;
    var s = String(v).replace(/[$,\s]/g, "");
    var pct = s.endsWith("%");
    var n = parseFloat(pct ? s.slice(0, -1) : s);
    return pct ? n / 100 : n;
  }
  function frac(v) { var n = num(v); return n > 1.5 ? n / 100 : n; }
  function money(v) {
    var n = num(v);
    return isNaN(n) ? "—" : "$" + Math.round(n).toLocaleString("en-US");
  }
  function pct(v) {
    var n = frac(v);
    return isNaN(n) ? "—" : (n * 100).toFixed(n < 0.1 ? 1 : 0) + "%";
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function setText(id, t) { var e = document.getElementById(id); if (e) e.textContent = t; }
  function setBar(wrap, inner, f) {
    var p = Math.max(0, Math.min(1, isNaN(f) ? 0 : f));
    inner.style.width = (p * 100).toFixed(1) + "%";
    if (wrap) wrap.setAttribute("aria-valuenow", Math.round(p * 100));
  }
  function bar(f, over) {
    var b = el("div", "bar" + (over ? " over" : ""));
    b.setAttribute("role", "progressbar");
    b.setAttribute("aria-valuemin", "0");
    b.setAttribute("aria-valuemax", "100");
    var s = el("span");
    b.appendChild(s);
    setBar(b, s, f);
    return b;
  }

  function render(d) {
    document.querySelectorAll("[data-k]").forEach(function (n) {
      var k = n.getAttribute("data-k");
      if (d[k] !== undefined && d[k] !== "") n.textContent = d[k];
    });
    document.getElementById("health").setAttribute("data-level", d.health || "");

    var up = parseDate(d.updated_on);
    setText("updated", up ? up.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "—");

    // dues
    setText("dues-pct", pct(d.dues_collected_pct));
    setText("dues-out", money(d.dues_outstanding));
    setText("dues-collected", money(d.dues_collected));
    setText("dues-billed", money(d.dues_billed));
    setText("members-current", pct(d.members_current_pct));
    setBar(document.getElementById("dues-bar-wrap"), document.getElementById("dues-bar"), frac(d.dues_collected_pct));

    // social – fall & spring
    var soc = document.getElementById("social");
    soc.textContent = "";
    ["fall", "spring"].forEach(function (t) {
      var name = d["social_" + t + "_name"];
      if (!name) return;
      var budget = num(d["social_" + t + "_budget"]), spent = num(d["social_" + t + "_spent"]);
      var box = el("div", "term");
      var head = el("div", "term-head");
      head.appendChild(el("span", "term-name", name));
      var left = budget - spent;
      head.appendChild(el("span", "term-left", money(spent) + " spent · " + money(left) + (left < 0 ? " over" : " left")));
      box.appendChild(head);
      box.appendChild(bar(budget > 0 ? spent / budget : 0, spent > budget));
      box.appendChild(el("p", "fine", "Budget " + money(budget)));
      soc.appendChild(box);
    });

    // philanthropy & reserve
    setText("phil-sem", money(d.philanthropy_raised_semester));
    setText("phil-fy", money(d.philanthropy_raised_fy));
    setText("phil-don", money(d.philanthropy_donated_fy));
    setText("reserve", money(d.reserve_balance));

    // deadlines
    var ol = document.getElementById("deadlines");
    ol.textContent = "";
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var shown = 0;
    for (var i = 1; i <= 5; i++) {
      var lab = d["deadline_" + i + "_label"], dt = parseDate(d["deadline_" + i + "_date"]);
      if (!lab || !dt || dt < today) continue;
      var days = Math.round((dt - today) / 86400000);
      var li = el("li", days <= 14 ? "soon" : "");
      var chip = el("div", "date-chip");
      chip.appendChild(el("span", "", dt.toLocaleDateString("en-US", { month: "short" })));
      chip.appendChild(el("b", "", String(dt.getDate())));
      li.appendChild(chip);
      var tx = el("div", "dl-text");
      tx.appendChild(el("p", "", lab));
      tx.appendChild(el("p", "dl-when", days === 0 ? "Today" : days === 1 ? "Tomorrow" : "In " + days + " days"));
      li.appendChild(tx);
      ol.appendChild(li);
      shown++;
    }
    if (!shown) ol.appendChild(el("li", "", "No upcoming deadlines."));

    // where dues go
    var ul = document.getElementById("shares");
    ul.textContent = "";
    var used = 0, items = [];
    for (var k = 1; k <= 12; k++) {
      var l = d["share_" + k + "_label"], p = frac(d["share_" + k + "_pct"]);
      if (l && !isNaN(p) && p > 0) { items.push([l, p]); used += p; }
    }
    if (items.length && 1 - used > 0.005) items.push(["Everything else (PIKE, IFC & billing fees…)", 1 - used]);
    var max = items.reduce(function (a, b) { return Math.max(a, b[1]); }, 0) || 1;
    items.forEach(function (it) {
      var li = el("li");
      li.appendChild(el("span", "share-label", it[0]));
      li.appendChild(el("span", "share-pct", (it[1] * 100).toFixed(1) + "%"));
      li.appendChild(bar(it[1] / max));
      ul.appendChild(li);
    });
  }

  function load() {
    var url = (CFG.dataUrl || "").trim();
    var banner = document.getElementById("banner");
    var src = url ? url + (url.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now() : SAMPLE;
    fetch(src, { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); })
      .then(function (t) {
        render(toMap(parseCSV(t)));
        if (!url) {
          banner.hidden = false;
          banner.textContent = "Showing sample data – the treasurer hasn't connected the live sheet yet.";
        } else { banner.hidden = true; }
      })
      .catch(function () {
        banner.hidden = false;
        banner.textContent = "Couldn't reach the live sheet right now – try again in a minute.";
      });
  }

  if (CFG.contactEmail) {
    var a = document.getElementById("contact");
    a.href = "mailto:" + CFG.contactEmail;
  }
  load();
  setInterval(load, Math.max(1, CFG.refreshMinutes || 5) * 60000);
})();
