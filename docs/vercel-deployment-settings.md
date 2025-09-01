# Vercel Deployment Configuration

## Required Vercel Project Settings

### Build & Development Settings
- **Framework Preset**: Other (do not use auto-detect)
- **Install Command**: `pnpm install --frozen-lockfile`
- **Build Command**: `pnpm -w build:web` (the `-w` runs from workspace root)
- **Output Directory**: `apps/web/dist`
- **Root Directory**: **IMPORTANT: Leave this empty** (do not set any root directory)

### Environment
- **Node.js Version**: 22.x (v20 and below cause build failures)
- **Package Manager**: pnpm (should auto-detect from pnpm-lock.yaml)

### Domain & Git
- **Git Repository**: Your repository
- **Production Branch**: main
- **Install Command at Project Level**: Should auto-detect pnpm workspace

## ✅ Working Configuration (Updated)

**IMPORTANT**: Use Vercel Dashboard settings instead of vercel.json files for monorepo deployments.

The working configuration uses pnpm workspace commands that automatically handle monorepo context:
- `pnpm install --frozen-lockfile` - installs dependencies from workspace root
- `pnpm -w build:web` - builds web app using workspace root context
- No need for `cd` commands or path navigation

## Build Dependencies

Added to root `package.json`:
```json
{
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "msgpackr-extract"]
  }
}
```

This resolves the "build scripts that were ignored" warnings during deployment.

## Troubleshooting

If deployment still fails:
1. Verify Node.js version is 22.x in Vercel settings
2. Ensure Root Directory is empty in Vercel project settings
3. Check that pnpm workspace is detected properly
4. Clear build cache using `VERCEL_FORCE_NO_BUILD_CACHE=1` environment variable if needed

## Migration Notes

- **Final Solution**: Configure commands directly in Vercel Dashboard (not vercel.json files)
- Use pnpm workspace commands (`pnpm -w`) instead of directory navigation
- Root and app-level vercel.json files are not needed for this setup
- Updated package manager version to match lockfile version

## Deployment Success

✅ Working deployment achieved with:
- Install Command: `pnpm install --frozen-lockfile`
- Build Command: `pnpm -w build:web`
- Output Directory: `apps/web/dist`
- Node.js Version: 22.x
- Root Directory: (empty)