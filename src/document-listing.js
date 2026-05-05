const folderOrder = [
  "judges-order",
  "evidence",
  "defense-filings",
  "nelson-filings",
  "misc",
];

const folderLabels = {
  "judges-order": "Judge's Orders",
  evidence: "Videos",
  "defense-filings": "Defense Filings",
  "nelson-filings": "Plaintiff Filings",
  misc: "Miscellaneous",
};

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
  const root = document.getElementById("evidenceDocumentsRoot");
  if (!root) return;

  // Vite resolves all matching PDFs at build time.
  const allPdfs = import.meta.glob("/src/documents/**/*.pdf", {
    eager: true,
    import: "default",
  });

  const grouped = groupDocuments(allPdfs);
  const renderOrder = [
    ...folderOrder,
    ...Object.keys(grouped).filter((key) => !folderOrder.includes(key)),
  ];

  root.innerHTML = "";
  for (const folderKey of renderOrder) {
    root.appendChild(createFolderSection(folderKey, grouped[folderKey] || []));
  }
}

renderDocuments();
