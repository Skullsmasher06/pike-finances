# Chapter finance website: setup in about 30 minutes

The site is 5 small files (`index.html`, `styles.css`, `app.js`, `config.js`, `sample-data.csv`).
It reads one published CSV made from the workbook's **Website_Data** tab. When you edit the workbook, the site updates within about 5 minutes. No server, no database, $0.

---

## Which connection method? (decision: Google Sheets "Publish to web")

| Option | How the site gets data | Auto-updates? | Privacy | Effort |
|---|---|---|---|---|
| **Google Sheets → Publish to web (CSV)** ✅ | A public CSV link | Yes, about every 5 min | Publish only a separate 2-column sheet | Low |
| Excel on OneDrive/SharePoint | Embed or Graph API | Embed: yes. API: needs an Azure app login | Embedding exposes the whole workbook | High |
| Upload a CSV to GitHub by hand | You re-upload each week | No (manual) | Fine | Medium, every week |

**Pick Google Sheets.** It is the only free option that updates by itself without code or logins, and the workbook was built to run in it. Excel stays fine for offline work or printing: download a copy anytime with *File → Download → .xlsx*.

---

## Step 1: Move the workbook into Google Sheets (once)

1. Sign in to a **chapter-owned Google account** (for example treasurer@…). Don't use a personal one, so the file can be handed to the next treasurer.
2. Go to drive.google.com, click **New → File upload**, and choose `PIKE_Upsilon_Finance_Tracker_v2.xlsx`.
3. Right-click the file and choose **Open with → Google Sheets**, then **File → Save as Google Sheets**. You now have a live copy with every formula.
4. Check that **Dashboard** shows numbers and **Website_Data** column B is filled in.
5. Google does not import Excel's sheet protection. Re-add it under **Data → Protect sheets and ranges**: protect every tab except the blue input columns, and set editors to *Only you* (treasurer) + president.
6. **Share** the file only with the exec board. Never "Anyone with the link."

## Step 2: Make a separate public sheet (this is the privacy wall)

The private workbook has brothers' names on the Dues tab. Never publish it. Instead:

1. Create a **new blank Google Sheet** named `Pike Upsilon – Public Website Data`.
2. In cell **A1**, type (use your private workbook's URL):
   ```
   =IMPORTRANGE("PASTE-THE-PRIVATE-WORKBOOK-URL-HERE","Website_Data!A3:B80")
   ```
3. Click **Allow access** when it asks. Two columns (`key`, `value`) should appear. Nothing else from the workbook can come through.
4. **File → Share → Publish to web**. Choose **Sheet1** (not "Entire document") and **Comma-separated values (.csv)**, then click **Publish** and **OK**.
5. Copy the link. It looks like `https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?gid=0&single=true&output=csv`.
6. Test it in a private/incognito window: you should see only key,value rows, with no names.

## Step 3: Point the site at the CSV

Open `config.js` and paste the link between the quotes:

```js
dataUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-…/pub?gid=0&single=true&output=csv",
```

## Step 4: Put the site online free (GitHub Pages)

1. Create a free account at github.com with the chapter email.
2. Click **+ → New repository**. Name it `pike-finances`, set it to **Public** (needed for free Pages; the repo holds only code and demo numbers), and click **Create**.
3. Click **Add file → Upload files**, drag in all 5 website files, then click **Commit changes**.
4. Go to **Settings → Pages**. Under *Build and deployment*, set Source to **Deploy from a branch**, Branch to **main**, folder **/ (root)**, then click **Save**.
5. After about a minute your site is live at `https://YOUR-USERNAME.github.io/pike-finances/`. Share that link in the chapter GroupMe.

*Alternative:* Vercel Drop (vercel.com, sign in, then drag the website folder onto the page) also gives a free link. Use one host, not both.

## Day to day

- Do nothing extra. Update the workbook as usual; Google re-publishes the CSV every few minutes and an open page re-checks every 5 minutes.
- **To add a deadline** to the site, use *Settings → Public deadlines* in the workbook.
- **If the site says "Showing sample data"**, `config.js` has no link yet.
- **If it says "Couldn't reach the live sheet"**, the public sheet was un-published or IMPORTRANGE lost access. Open the public sheet, click *Allow access*, and re-publish.

## Privacy checklist (run every semester)

- [ ] The public CSV shows only `key,value` rows: no names, no member IDs, no individual balances.
- [ ] The private workbook is **not** published and is shared only with officers.
- [ ] Nobody added a Website_Data row that points at the Dues tab's Name column.
