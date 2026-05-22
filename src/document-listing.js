import {
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
const PETITION_SESSION_KEY = "petitionSignedSession";
const PETITION_URL = "https://c.org/pk9mYfxFL9";

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

function findMediaUrl(mediaMap, needle) {
  const trimmed = (needle || "").trim();
  if (!trimmed) return null;
  const n = trimmed.toLowerCase();
  for (const [path, url] of Object.entries(mediaMap)) {
    if (normalizePdfPath(path).toLowerCase().includes(n)) return url;
  }
  return null;
}

function attachPetitionGateToPdfLink(link) {
  link.addEventListener("click", (event) => {
    const petitionSigned =
      localStorage.getItem(PETITION_KEY) === "true" ||
      sessionStorage.getItem(PETITION_SESSION_KEY) === "true";
    if (petitionSigned) return;
    event.preventDefault();
    showPetitionPopup();
  });
}

function renderDocList(slot, docs) {
  slot.innerHTML = "";
  slot.className = "";

  if (!docs.length) {
    slot.textContent = "No documents yet";
    slot.className = "doc-slot-empty";
    return;
  }

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
  link.textContent = "Link to PDF — ECF 316";
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

function showPetitionPopup() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  let modal = document.getElementById("petitionModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "petitionModal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.background = "rgba(10,10,10,0.72)";
    modal.style.display = "flex";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.zIndex = "2000";
    modal.style.padding = isMobile ? "1rem" : "2rem";
    modal.style.overflowY = "auto";

    const card = document.createElement("div");
    card.className = "gate-inner";
    card.style.maxWidth = "560px";
    card.style.width = "100%";
    card.style.maxHeight = isMobile ? "90vh" : "none";
    card.style.overflowY = isMobile ? "auto" : "visible";
    card.style.background = "#171717";
    card.style.border = "1px solid rgba(184,149,42,0.45)";
    card.style.padding = isMobile ? "1.4rem" : "1.8rem";
    card.style.borderRadius = "6px";

    const seal = document.createElement("div");
    seal.className = "gate-seal";
    seal.textContent = "⚖";

    const title = document.createElement("h1");
    title.innerHTML = "Before You Access Files,<br><span>Sign the Petition</span>";
    title.style.color = "#ffffff";

    const text = document.createElement("p");
    text.textContent =
      "To access evidence documents, please sign the petition first. If you already signed, confirm below and continue.";
    text.style.color = "#d0d0d0";

    const actions = document.createElement("div");
    actions.className = "gate-form";
    actions.style.gap = isMobile ? "0.7rem" : "1rem";

    const signBtn = document.createElement("a");
    signBtn.href = PETITION_URL;
    signBtn.target = "_blank";
    signBtn.rel = "noopener noreferrer";
    signBtn.textContent = "Sign Petition on Change.org";
    signBtn.className = "sign-btn";
    signBtn.style.display = "block";
    signBtn.style.textDecoration = "none";
    signBtn.style.textAlign = "center";
    signBtn.style.padding = isMobile ? "0.85rem 1rem" : "1rem 2rem";
    signBtn.addEventListener("click", () => {
      localStorage.setItem(PETITION_KEY, "true");
      sessionStorage.setItem(PETITION_SESSION_KEY, "true");
      modal.style.display = "none";
    });

    const signedBtn = document.createElement("button");
    signedBtn.type = "button";
    signedBtn.textContent = "I Have Already Signed";
    signedBtn.className = "sign-btn";
    signedBtn.style.background = "#232323";
    signedBtn.style.border = "1px solid rgba(184,149,42,0.3)";
    signedBtn.style.color = "#aaa";
    signedBtn.style.padding = isMobile ? "0.85rem 1rem" : "1rem 2rem";
    signedBtn.addEventListener("click", () => {
      sessionStorage.setItem(PETITION_SESSION_KEY, "true");
      modal.style.display = "none";
    });

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Close";
    closeBtn.className = "sign-btn";
    closeBtn.style.background = "#2b2b2b";
    closeBtn.style.border = "1px solid rgba(184,149,42,0.3)";
    closeBtn.style.color = "#aaa";
    closeBtn.style.padding = isMobile ? "0.85rem 1rem" : "1rem 2rem";
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });

    actions.appendChild(signBtn);
    actions.appendChild(signedBtn);
    actions.appendChild(closeBtn);
    card.appendChild(seal);
    card.appendChild(title);
    card.appendChild(text);
    card.appendChild(actions);
    modal.appendChild(card);
    document.body.appendChild(modal);
  } else {
    modal.style.padding = isMobile ? "1rem" : "2rem";
    modal.style.display = "flex";
  }
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
    link.textContent = options.linkText || "Link to PDF";
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

    if (name.length > (prev.fileName || prev.title || "").length) {
      const index = result.indexOf(prev);
      result[index] = doc;
      seen.set(key, doc);
    }
  }

  return result;
}

function appendJudgeTextOrdersLink(container, mediaMap) {
  const url = findMediaUrl(mediaMap, "Judge Text Orders");
  if (!url) return;

  container.appendChild(
    createFilingEntry(null, "Judge Text Orders.pdf", null, url, {
      linkText: "Judge Text Orders.pdf",
    })
  );
}

function renderCourtFilingList(container, folderKey, grouped, mediaMap) {
  if (!container) return;

  const docs = dedupeDocsByEcf(
    sortDocsByEcf(grouped[folderKey] || []).filter(
      (doc) => !isJudgeTextOrdersFile(doc.fileName || doc.title || "")
    )
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
    const meta = lookupFilingMeta(baseName);
    container.appendChild(
      createFilingEntry(meta.ecf, meta.title, meta.summary, url)
    );
  }

  if (folderKey === "judges-order") {
    appendJudgeTextOrdersLink(container, mediaMap);
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
    container.appendChild(
      createFilingEntry(null, entry.title, entry.summary, url)
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
    attachPetitionGateToPdfLink(link);
  });
}

function renderDocuments() {
  const slots = {
    evidence: document.getElementById("doc-slot-evidence"),
    "congressman-clyburn": document.getElementById("doc-slot-congressman-clyburn"),
    misc: document.getElementById("doc-slot-misc"),
  };
  const filteredSlots = {
    "senator-graham": {
      el: document.getElementById("doc-slot-senator-graham"),
      folder: "sc-legislators",
      match: (name) =>
        (name.includes("graham") || name.includes("follow-up")) &&
        !name.includes("tim scott"),
    },
    "senator-scott": {
      el: document.getElementById("doc-slot-senator-scott"),
      folder: "sc-legislators",
      match: (name) => name.includes("tim scott"),
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

renderDocuments();
window.dispatchEvent(new Event("documents-rendered"));
