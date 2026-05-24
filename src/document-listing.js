import {
  AMENTUM_KEY_ECF,
  SC_LEGISLATOR_SUMMARIES,
  extractEcfNumber,
  lookupFilingMeta,
} from "./filing-summaries.js";

const folderOrder = [
  "judges-order",
  "defense-filings",
  "nelson-filings",
  "sc-legislators",
  "evidence",
  "congressman-clyburn",
  "misc",
  "amentum-judges-order",
  "amentum-defense-filings",
  "amentum-plaintiff-filings",
];

const PETITION_KEY = "petitionSigned";
const PETITION_SESSION_UNTIL_KEY = "petitionSignedUntil";
const PETITION_LEGACY_SESSION_KEY = "petitionSignedSession";
const PETITION_BYPASS_MS = 30 * 60 * 1000;
const PETITION_URL = "https://c.org/pk9mYfxFL9";

let pendingDocumentUrl = null;
let petitionModalWired = false;

function isPetitionBypassActive() {
  if (localStorage.getItem(PETITION_KEY) === "true") return true;
  const until = Number(sessionStorage.getItem(PETITION_SESSION_UNTIL_KEY) || 0);
  return until > Date.now();
}

function grantPetitionBypass(durationMs = PETITION_BYPASS_MS) {
  sessionStorage.setItem(
    PETITION_SESSION_UNTIL_KEY,
    String(Date.now() + durationMs)
  );
}

function grantPetitionSignedPermanent() {
  localStorage.setItem(PETITION_KEY, "true");
  grantPetitionBypass();
}

function migrateLegacyPetitionSession() {
  if (sessionStorage.getItem(PETITION_LEGACY_SESSION_KEY) === "true") {
    grantPetitionBypass();
    sessionStorage.removeItem(PETITION_LEGACY_SESSION_KEY);
  }
}

function hidePetitionModal() {
  const modal = document.getElementById("petitionModal");
  if (modal) modal.style.display = "none";
}

function resumePendingDocument() {
  if (!pendingDocumentUrl) return;
  const url = pendingDocumentUrl;
  pendingDocumentUrl = null;
  window.open(url, "_blank", "noopener,noreferrer");
}

function initPetitionModal() {
  if (petitionModalWired) return;

  const modal = document.getElementById("petitionModal");
  if (!modal) return;

  const signLink = document.getElementById("petition-sign-link");
  const signedBtn = document.getElementById("petition-already-signed-btn");
  const closeBtn = document.getElementById("petition-close-btn");

  signLink?.addEventListener("click", () => {
    grantPetitionSignedPermanent();
    pendingDocumentUrl = null;
    hidePetitionModal();
  });

  signedBtn?.addEventListener("click", () => {
    grantPetitionBypass();
    hidePetitionModal();
    resumePendingDocument();
  });

  closeBtn?.addEventListener("click", () => {
    pendingDocumentUrl = null;
    hidePetitionModal();
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      pendingDocumentUrl = null;
      hidePetitionModal();
    }
  });

  petitionModalWired = true;
}

function showPetitionPopup() {
  initPetitionModal();
  const modal = document.getElementById("petitionModal");
  if (!modal) return;
  modal.style.display = "flex";
}

const folderLabels = {
  "judges-order": "Judge's Orders (Curtiss-Wright)",
  "defense-filings": "Defense Filings (Curtiss-Wright)",
  "nelson-filings": "Plaintiff Filings (Curtiss-Wright)",
  "sc-legislators": "SC Legislators",
  evidence: "Supporting Evidence",
  "congressman-clyburn": "Congressman Clyburn",
  misc: "Miscellaneous",
  "amentum-judges-order": "Judge's Orders (Amentum)",
  "amentum-defense-filings": "Defense Filings (Amentum)",
  "amentum-plaintiff-filings": "Plaintiff Filings (Amentum)",
};

function normalizePdfPath(path) {
  return path.replace(/\\/g, "/");
}

const TIMELINE_MEDIA_NEEDLES = {
  "Hacked Car iPhone_3823.mp4": ["hacked car iphone_3823"],
  "NCPD_911_call_strange_man.mp3": ["ncpd_911_call_strange_man"],
  "NCPD_911_call_cell_phone": ["ncpd_911_call_cell_phone"],
  "NCPD_202500522350_Officer_Winn_08142025_911_tb_": [
    "ncpd_202500522350_officer_winn",
    "officer_winn_08142025",
  ],
};

function findMediaUrl(mediaMap, needle) {
  const trimmed = (needle || "").trim();
  if (!trimmed) return null;

  const needles = [
    trimmed.toLowerCase(),
    ...(TIMELINE_MEDIA_NEEDLES[trimmed] || []),
  ];

  for (const n of needles) {
    for (const [path, url] of Object.entries(mediaMap)) {
      if (normalizePdfPath(path).toLowerCase().includes(n)) return url;
    }
  }

  return null;
}

function findMediaFileName(mediaMap, needle) {
  const trimmed = (needle || "").trim();
  if (!trimmed) return null;
  const n = trimmed.toLowerCase();
  for (const path of Object.keys(mediaMap)) {
    if (normalizePdfPath(path).toLowerCase().includes(n)) {
      return extractFileName(path);
    }
  }
  return null;
}

function attachPetitionGateToPdfLink(link) {
  if (link.classList.contains("timeline-media-link")) return;

  link.addEventListener("click", (event) => {
    if (isPetitionBypassActive()) return;
    event.preventDefault();
    pendingDocumentUrl = link.href || null;
    showPetitionPopup();
  });
}

function renderDocList(slot, docs) {
  const card = slot?.closest(".evidence-card");
  slot.innerHTML = "";
  slot.className = "";

  if (!docs.length) {
    slot.textContent = "No documents yet";
    slot.className = "doc-slot-empty";
    if (card) card.style.display = "none";
    return;
  }

  if (card) card.style.display = "";

  const list = document.createElement("ul");
  list.className = "doc-list";
  for (const doc of docs) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = doc.url;
    link.textContent = doc.title;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    attachPetitionGateToPdfLink(link);
    item.appendChild(link);
    list.appendChild(item);
  }
  slot.appendChild(list);
}

function renderSanctionsOrderLink(mediaMap) {
  const slot = document.getElementById("sanctions-order-link-slot");
  if (!slot) return;

  const url =
    findMediaUrl(mediaMap, "ECF 316 Judge Gergel Ruling") ||
    findMediaUrl(mediaMap, "ECF 316 Judge Gergel");

  if (!url) {
    slot.innerHTML =
      '<span class="filing-entry-pending">ECF 316 PDF — add to src/documents/judges-order/</span>';
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.className = "filing-entry-link";
  const ecf316Name =
    Object.keys(mediaMap).find((path) =>
      normalizePdfPath(path).toLowerCase().includes("ecf 316")
    ) || "";
  link.textContent = ecf316Name
    ? extractFileName(ecf316Name)
    : "ECF 316 Judge Gergel Ruling on Report and Recommendation.pdf";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  attachPetitionGateToPdfLink(link);
  slot.appendChild(link);
}

function renderDocketSheet(mediaMap) {
  const slot = document.getElementById("docket-sheet-slot");
  if (!slot) return;

  const url = findMediaUrl(mediaMap, "Docket Sheet");
  slot.innerHTML = "";
  slot.className = "";

  if (!url) {
    slot.textContent = "Docket Sheet.pdf not yet uploaded — add to src/documents/misc/";
    slot.className = "doc-slot-empty";
    return;
  }

  const link = document.createElement("a");
  link.href = url;
  link.className = "docket-link";
  link.textContent = "Docket Sheet.pdf";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  attachPetitionGateToPdfLink(link);
  slot.appendChild(link);
}

function excludeMiscFromArchive(fileName) {
  const name = fileName.toLowerCase();
  if (name.includes("docket sheet")) return true;
  if (name.includes("senator") || name.includes("tim scott")) return true;
  if (name.includes("graham response") || name.includes("follow-up")) return true;
  return false;
}

function isDeptOfWarPrivacyRelease(fileName) {
  const name = (fileName || "").toLowerCase();
  return (
    name.includes("privacy release") &&
    (name.includes("secretary of war") || name.includes("office of the secretary"))
  );
}

function toReadableTitle(fileName) {
  return fileName
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toFolderLabel(folderKey) {
  if (folderLabels[folderKey]) return folderLabels[folderKey];
  return folderKey.replace(/[-_]+/g, " ").trim();
}

function extractFolderKey(filePath) {
  const parts = filePath.split("/");
  const docsIndex = parts.indexOf("documents");
  if (docsIndex === -1) return "misc";
  return parts[docsIndex + 1] || "misc";
}

function extractFileName(filePath) {
  const parts = filePath.split("/");
  return parts[parts.length - 1] || "";
}

function groupDocuments(pdfModules) {
  const grouped = {};
  for (const folder of folderOrder) {
    grouped[folder] = [];
  }

  for (const [path, url] of Object.entries(pdfModules)) {
    const folderKey = extractFolderKey(path);
    if (!grouped[folderKey]) grouped[folderKey] = [];
    const fileName = extractFileName(path);
    grouped[folderKey].push({
      title: toReadableTitle(fileName),
      fileName,
      url,
    });
  }

  for (const docs of Object.values(grouped)) {
    docs.sort((a, b) => a.title.localeCompare(b.title));
  }

  return grouped;
}

function createFolderSection(folderKey, documents) {
  const section = document.createElement("section");
  section.className = "doc-section";

  const title = document.createElement("h3");
  title.textContent = toFolderLabel(folderKey);
  section.appendChild(title);

  if (!documents.length) {
    const empty = document.createElement("p");
    empty.className = "doc-empty";
    empty.textContent = "No documents yet";
    section.appendChild(empty);
    return section;
  }

  const list = document.createElement("ul");
  list.className = "doc-list";

  for (const doc of documents) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = doc.url;
    link.textContent = doc.title;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    item.appendChild(link);
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

function appendSummaryParagraphs(parent, summary) {
  const parts = Array.isArray(summary) ? summary : [summary];
  for (const text of parts) {
    const body = document.createElement("p");
    body.className = "filing-entry-summary";
    body.textContent = text;
    parent.appendChild(body);
  }
}

function isJudgeTextOrdersFile(fileName) {
  return (fileName || "").toLowerCase().includes("judge text orders");
}

function isAmentumKeyEcf(fileName) {
  const ecf = extractEcfNumber(fileName || "");
  return ecf && AMENTUM_KEY_ECF.includes(String(ecf).split("-")[0]);
}

function collectAmentumDocs(grouped, mediaMap) {
  const docs = [];
  for (const folderKey of [
    "amentum-plaintiff-filings",
    "amentum-defense-filings",
    "amentum-judges-order",
  ]) {
    for (const doc of grouped[folderKey] || []) {
      const baseName = doc.fileName || doc.title || "";
      docs.push({
        ...doc,
        url: doc.url || findMediaUrl(mediaMap, baseName),
        folderKey,
      });
    }
  }
  return docs;
}

function createFilingEntry(ecfLabel, title, summary, url, options = {}) {
  const card = document.createElement("article");
  card.className = "filing-entry";

  const heading = document.createElement("h4");
  heading.className = "filing-entry-title";
  heading.textContent = ecfLabel ? `ECF ${ecfLabel} – ${title}` : title;
  card.appendChild(heading);

  if (summary) {
    appendSummaryParagraphs(card, summary);
  }

  if (url) {
    const link = document.createElement("a");
    link.href = url;
    link.className = "filing-entry-link";
    link.textContent =
      options.linkText || options.fileName || title || "View PDF";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    attachPetitionGateToPdfLink(link);
    card.appendChild(link);
  } else {
    const pending = document.createElement("span");
    pending.className = "filing-entry-pending";
    pending.textContent = "PDF pending";
    card.appendChild(pending);
  }

  return card;
}

function sortDocsByEcf(docs) {
  return [...docs].sort((a, b) => {
    const aName = a.fileName || a.title || "";
    const bName = b.fileName || b.title || "";
    const aEcf = extractEcfNumber(aName) || "";
    const bEcf = extractEcfNumber(bName) || "";
    const aNum = Number(String(aEcf).split("-")[0] || 9999);
    const bNum = Number(String(bEcf).split("-")[0] || 9999);
    if (aNum !== bNum) return aNum - bNum;
    return aName.localeCompare(bName);
  });
}

function filingNameMatchScore(fileName, metaTitle) {
  const name = fileName.toLowerCase();
  const words = (metaTitle || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 4);
  if (!words.length) return 0;
  return words.filter((word) => name.includes(word)).length;
}

function pickPreferredEcfDoc(docA, docB) {
  const nameA = docA.fileName || docA.title || "";
  const nameB = docB.fileName || docB.title || "";
  const meta = lookupFilingMeta(nameA);
  const scoreA = filingNameMatchScore(nameA, meta.title);
  const scoreB = filingNameMatchScore(nameB, meta.title);
  if (scoreA !== scoreB) return scoreA > scoreB ? docA : docB;
  return nameA.length >= nameB.length ? docA : docB;
}

function dedupeDocsByEcf(docs) {
  const seen = new Map();
  const result = [];

  for (const doc of docs) {
    const name = doc.fileName || doc.title || "";
    const key = extractEcfNumber(name) || name.toLowerCase();
    const prev = seen.get(key);

    if (!prev) {
      seen.set(key, doc);
      result.push(doc);
      continue;
    }

    const preferred = pickPreferredEcfDoc(prev, doc);
    if (preferred !== prev) {
      const index = result.indexOf(prev);
      result[index] = preferred;
      seen.set(key, preferred);
    }
  }

  return result;
}

function appendJudgeTextOrdersLink(container, mediaMap) {
  const url = findMediaUrl(mediaMap, "Judge Text Orders");
  if (!url) return;

  const judgeTextName = extractFileName(
    Object.keys(mediaMap).find((path) =>
      normalizePdfPath(path).toLowerCase().includes("judge text orders")
    ) || "Judge Text Orders.pdf"
  );
  container.appendChild(
    createFilingEntry(null, "Judge Text Orders", null, url, {
      linkText: judgeTextName,
      fileName: judgeTextName,
    })
  );
}

function renderCourtFilingList(container, folderKey, grouped, mediaMap) {
  if (!container) return;

  const docs = dedupeDocsByEcf(
    sortDocsByEcf(grouped[folderKey] || []).filter((doc) => {
      const name = doc.fileName || doc.title || "";
      if (isJudgeTextOrdersFile(name)) return false;
      if (folderKey.startsWith("amentum-") && isAmentumKeyEcf(name)) return false;
      return true;
    })
  );

  container.innerHTML = "";

  if (!docs.length) {
    container.textContent = "No documents yet";
    container.className = "filing-list-empty";
    return;
  }

  container.className = "filing-list";

  for (const doc of docs) {
    const baseName = doc.fileName || doc.title;
    const url = doc.url || findMediaUrl(mediaMap, baseName);
    const meta = lookupFilingMeta(baseName, folderKey);
    container.appendChild(
      createFilingEntry(meta.ecf, meta.title, meta.summary, url, {
        linkText: baseName,
        fileName: baseName,
      })
    );
  }

  if (folderKey === "judges-order") {
    appendJudgeTextOrdersLink(container, mediaMap);
  }
}

function renderAmentumKeyFilings(container, grouped, mediaMap) {
  if (!container) return;

  const keyDocs = collectAmentumDocs(grouped, mediaMap).filter((doc) =>
    isAmentumKeyEcf(doc.fileName || doc.title || "")
  );

  const ordered = AMENTUM_KEY_ECF.flatMap((ecfNum) =>
    keyDocs.filter(
      (doc) => String(extractEcfNumber(doc.fileName || "") || "").split("-")[0] === ecfNum
    )
  );

  container.innerHTML = "";

  if (!ordered.length) {
    container.textContent =
      "ECF 53, 54, 55, and 57 PDFs — add to src/documents/amentum-plaintiff-filings/ and amentum-defense-filings/";
    container.className = "filing-list-empty";
    return;
  }

  container.className = "filing-list";

  for (const doc of ordered) {
    const baseName = doc.fileName || doc.title;
    const meta = lookupFilingMeta(baseName, doc.folderKey);
    container.appendChild(
      createFilingEntry(meta.ecf, meta.title, meta.summary, doc.url, {
        linkText: baseName,
        fileName: baseName,
      })
    );
  }
}

function renderScLegislatorsList(container, mediaMap) {
  if (!container) return;
  container.innerHTML = "";
  container.className = "filing-list";

  const entries = [
    SC_LEGISLATOR_SUMMARIES.graham,
    SC_LEGISLATOR_SUMMARIES.scott,
    SC_LEGISLATOR_SUMMARIES.grahamFollowUp,
  ];

  for (const entry of entries) {
    const url = findMediaUrl(mediaMap, entry.needle);
    const fileName = findMediaFileName(mediaMap, entry.needle);
    container.appendChild(
      createFilingEntry(null, entry.title, entry.summary, url, {
        linkText: fileName || entry.title,
        fileName,
      })
    );
  }
}

function renderTimelineMediaLinks(mediaMap) {
  document.querySelectorAll(".timeline-media-link").forEach((link) => {
    const needle = link.dataset.media || "";
    const url = findMediaUrl(mediaMap, needle);
    link.classList.remove("is-pending");

    if (!url) {
      link.classList.add("is-pending");
      link.removeAttribute("href");
      return;
    }

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

function renderDocuments() {
  const slots = {
    evidence: document.getElementById("doc-slot-evidence"),
  };
  const filteredSlots = {
    "dept-of-war": {
      el: document.getElementById("doc-slot-dept-of-war"),
      folder: "evidence",
      match: (name) => isDeptOfWarPrivacyRelease(name),
    },
  };
  const courtLists = {
    "nelson-filings": document.getElementById("filing-list-plaintiff"),
    "defense-filings": document.getElementById("filing-list-defense"),
    "judges-order": document.getElementById("filing-list-judges-order"),
    "sc-legislators": document.getElementById("filing-list-sc-legislators"),
    "amentum-plaintiff-filings": document.getElementById("filing-list-amentum-plaintiff"),
    "amentum-defense-filings": document.getElementById("filing-list-amentum-defense"),
    "amentum-judges-order": document.getElementById("filing-list-amentum-judges-order"),
    "amentum-key-filings": document.getElementById("amentum-key-filings-list"),
  };
  const activeSlots = Object.fromEntries(
    Object.entries(slots).filter(([, el]) => Boolean(el))
  );
  const activeFiltered = Object.fromEntries(
    Object.entries(filteredSlots).filter(([, cfg]) => Boolean(cfg.el))
  );
  const hasCourtLists = Object.values(courtLists).some(Boolean);
  const hasDocketSheet = Boolean(document.getElementById("docket-sheet-slot"));
  if (
    !Object.keys(activeSlots).length &&
    !Object.keys(activeFiltered).length &&
    !hasCourtLists &&
    !hasDocketSheet
  ) {
    return;
  }

  let allMedia = {};
  try {
    allMedia = {
      ...import.meta.glob("/src/documents/**/*.pdf", {
        eager: true,
        import: "default",
      }),
      ...import.meta.glob("/src/documents/**/*.{mp4,mp3}", {
        eager: true,
        import: "default",
      }),
    };
  } catch {
    for (const slot of Object.values(activeSlots)) {
      slot.textContent = "Document listing is available after Vite/Netlify build.";
    }
    return;
  }

  const allPdfs = Object.fromEntries(
    Object.entries(allMedia).filter(([path]) => /\.pdf$/i.test(path))
  );

  const grouped = groupDocuments(allPdfs);
  renderDocketSheet(allMedia);
  renderSanctionsOrderLink(allMedia);
  renderTimelineMediaLinks(allMedia);

  renderCourtFilingList(
    courtLists["nelson-filings"],
    "nelson-filings",
    grouped,
    allMedia
  );
  renderCourtFilingList(
    courtLists["defense-filings"],
    "defense-filings",
    grouped,
    allMedia
  );
  renderCourtFilingList(
    courtLists["judges-order"],
    "judges-order",
    grouped,
    allMedia
  );
  renderScLegislatorsList(courtLists["sc-legislators"], allMedia);
  renderAmentumKeyFilings(
    courtLists["amentum-key-filings"],
    grouped,
    allMedia
  );
  renderCourtFilingList(
    courtLists["amentum-plaintiff-filings"],
    "amentum-plaintiff-filings",
    grouped,
    allMedia
  );
  renderCourtFilingList(
    courtLists["amentum-defense-filings"],
    "amentum-defense-filings",
    grouped,
    allMedia
  );
  renderCourtFilingList(
    courtLists["amentum-judges-order"],
    "amentum-judges-order",
    grouped,
    allMedia
  );

  for (const folderKey of folderOrder) {
    const slot = activeSlots[folderKey];
    if (!slot) continue;

    let docs = grouped[folderKey] || [];
    if (folderKey === "misc") {
      docs = docs.filter((doc) => !excludeMiscFromArchive(doc.fileName || ""));
    }
    if (folderKey === "evidence") {
      docs = docs.filter(
        (doc) => !isDeptOfWarPrivacyRelease(doc.fileName || "")
      );
    }
    renderDocList(slot, docs);
  }

  for (const cfg of Object.values(activeFiltered)) {
    const folderDocs = grouped[cfg.folder] || [];
    const docs = folderDocs.filter((doc) =>
      cfg.match((doc.fileName || "").toLowerCase())
    );
    renderDocList(cfg.el, docs);
  }
}

migrateLegacyPetitionSession();
initPetitionModal();
renderDocuments();
window.dispatchEvent(new Event("documents-rendered"));
