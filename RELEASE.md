# Creating a Release

To create a new release of the desktop app:

1. **Update version** (optional):
   ```bash
   cd desktop
   npm version patch  # or minor, or major
   ```

2. **Create and push a git tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

3. The GitHub Actions workflow will automatically:
   - Build the desktop app for macOS
   - Create a GitHub release
   - Upload the DMG and ZIP files

4. Users can then download from: https://github.com/jishakambo-art/custom-podcast-generator/releases/latest

## Manual Build (for testing)

```bash
cd desktop
npm install
npm run make
```

Built files will be in `desktop/out/make/`
