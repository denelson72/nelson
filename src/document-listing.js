const folderOrder = [
  "judges-order",
  "evidence",
  "defense-filings",
  "nelson-filings",
  "misc",
];

const PETITION_KEY = "petitionSigned";
const PETITION_SESSION_KEY = "petitionSignedSession";
const PETITION_URL = "https://c.org/pk9mYfxFL9";

const folderLabels = {
  "judges-order": "Judge's Orders",
  evidence: "Videos",
  "defense-filings": "Defense Filings",
  "nelson-filings": "Plaintiff Filings",
  misc: "Miscellaneous",
};

function showPetitionPopup() {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  let modal = document.getElementById("petitionModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "petitionModal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.background = "#0a0a0a";
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

    const seal = document.createElement("div");
    seal.className = "gate-seal";
    seal.textContent = "⚖";

    const title = document.createElement("h1");
    title.innerHTML = "Before You Access Files,<br><span>Sign the Petition</span>";

    const text = document.createElement("p");
    text.textContent =
      "To access evidence documents, please sign the petition first. If you already signed, confirm below and continue.";

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
    signedBtn.style.background = "#1a1a1a";
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
    closeBtn.style.background = "transparent";
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
    grouped[folderKey].push({
      title: toReadableTitle(extractFileName(path)),
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

function renderDocuments() {
  const slots = {
    "judges-order": document.getElementById("doc-slot-judges-order"),
    "defense-filings": document.getElementById("doc-slot-defense-filings"),
    "nelson-filings": document.getElementById("doc-slot-nelson-filings"),
    evidence: document.getElementById("doc-slot-evidence"),
    misc: document.getElementById("doc-slot-misc"),
  };
  if (!Object.values(slots).every(Boolean)) return;

  let allPdfs = {};
  try {
    // Vite resolves all matching PDFs at build time.
    allPdfs = import.meta.glob("/src/documents/**/*.pdf", {
      eager: true,
      import: "default",
    });
  } catch {
    for (const slot of Object.values(slots)) {
      slot.textContent = "Document listing is available after Vite/Netlify build.";
    }
    return;
  }

  const grouped = groupDocuments(allPdfs);
  for (const folderKey of folderOrder) {
    const slot = slots[folderKey];
    const docs = grouped[folderKey] || [];
    slot.innerHTML = "";

    if (!docs.length) {
      slot.textContent = "No documents yet";
      continue;
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
      link.addEventListener("click", (event) => {
        const petitionSigned =
          localStorage.getItem(PETITION_KEY) === "true" ||
          sessionStorage.getItem(PETITION_SESSION_KEY) === "true";
        if (petitionSigned) return;
        event.preventDefault();
        showPetitionPopup();
      });
      item.appendChild(link);
      list.appendChild(item);
    }
    slot.appendChild(list);
  }
}

renderDocuments();
