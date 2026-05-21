# Documents Folder

**All site documents must live here** under `src/documents/`. Only `.pdf` files are listed on the website (via Vite build).

## Curtiss-Wright case (South Carolina)

| Folder | Shown on site as |
|--------|------------------|
| `judges-order/` | Judge's Orders |
| `defense-filings/` | Defense Filings |
| `nelson-filings/` | Plaintiff Filings |
| `evidence/` | Supporting Evidence |
| `congressman-clyburn/` | Congressman Clyburn |
| `misc/` | Miscellaneous (subfolders OK) |

## Amentum case (Florida)

| Folder | Shown on site as |
|--------|------------------|
| `amentum-judges-order/` | Judge's Orders (Amentum) |
| `amentum-defense-filings/` | Defense Filings (Amentum) |
| `amentum-plaintiff-filings/` | Plaintiff Filings (Amentum) |

## Example

```text
src/documents/
  judges-order/
    ECF 19 Judge Cherry Order to Relieve Counsel.pdf
  defense-filings/
    motion-to-dismiss.pdf
  nelson-filings/
    plaintiff-objection.pdf
  evidence/
    police-report.pdf
  amentum-plaintiff-filings/
    ECF 1 Complaint.pdf
```

Do **not** keep PDFs in the project root — move them into the matching folder above, then run `npm run build`.
