# Document Upload Setup

PDF files are auto-listed on the website after Vite/Netlify build.

**Important:** Put all documents in `src/documents/` (not the project root). See `src/documents/README.md` for folder names.

## Upload folders

- `src/documents/judges-order`
- `src/documents/defense-filings`
- `src/documents/nelson-filings` (shown as Plaintiff Filings)
- `src/documents/evidence` (shown as Supporting Evidence)
- `src/documents/congressman-clyburn`
- `src/documents/misc` (shown as Miscellaneous, supports nested folders)
- `src/documents/amentum-judges-order`
- `src/documents/amentum-defense-filings`
- `src/documents/amentum-plaintiff-filings`

## Example

```text
src/documents/
  judges-order/
    order-2026-05-01.pdf
  defense-filings/
    motion-to-dismiss.pdf
  nelson-filings/
    plaintiff-objection.pdf
```

## Important

- Only `.pdf` files are listed on the site.
- This must run through Vite (`npm run build`) so `import.meta.glob` works.
- Netlify should use:
  - Build command: `npm run build`
  - Publish directory: `dist`
