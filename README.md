# Document Upload Setup

PDF files are auto-listed on the website after Vite/Netlify build.

## Upload folders

- `src/documents/judges-order`
- `src/documents/evidence` (shown as Videos)
- `src/documents/defense-filings`
- `src/documents/nelson-filings` (shown as Plaintiff Filings)
- `src/documents/misc` (shown as Miscellaneous, supports nested folders)

## Example

```text
src/documents/
  judges-order/
    order-2026-05-01.pdf
  evidence/
    CV.pdf
  defense-filings/
    motion-to-dismiss.pdf
  nelson-filings/
    plaintiff-objection.pdf
  misc/
    timeline/
      supporting-doc.pdf
```

## Important

- Only `.pdf` files are listed.
- This must run through Vite (`npm run build`) so `import.meta.glob` works.
- Netlify should use:
  - Build command: `npm run build`
  - Publish directory: `dist`
