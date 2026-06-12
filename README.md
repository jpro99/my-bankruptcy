# ChapterAI

AI-native bankruptcy practice platform for California attorneys.

## Open in Cursor

```
File → Open Folder → c:\Projects\ChapterAI
```

## Push to GitHub (shows under "All repositories")

```powershell
cd c:\Projects\ChapterAI
git add -A
git commit -m "ChapterAI v0.3.0"

# Create repo at github.com/new named "ChapterAI", then:
git remote add origin https://github.com/YOUR_USERNAME/ChapterAI.git
git push -u origin main
```

## Dev

```powershell
npx pnpm@9.15.0 install
npx pnpm@9.15.0 dev
```

- Web: http://localhost:3000
- API: http://localhost:3002
- Cockpit: http://localhost:3000/matters/demo/cockpit
