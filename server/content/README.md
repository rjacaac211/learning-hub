Learning Hub Content

This directory is versioned and served by the backend under `/files`.

Expected structure:

- `english/`
- `math/`
- `science/`

You can create nested subfolders. Place PDFs, videos (mp4), images, audio, etc.

Example:

```
english/reading/grade7/poem.pdf
math/algebra/worksheet1.pdf
science/biology/cell-division.mp4
```

In development, the server will read from this directory by default.
In production on Raspberry Pi, you may set `CONTENT_DIR` in `.env` to an absolute location instead (optional).

