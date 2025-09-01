# Vercel Deployment Configuration

## Required Vercel Project Settings

### Build & Development Settings
- **Framework Preset**: Other (do not use auto-detect)
- **Build Command**: Leave empty (configured in app-level vercel.json)
- **Install Command**: Leave empty (configured in app-level vercel.json)
- **Output Directory**: Leave empty (configured in app-level vercel.json)
- **Root Directory**: **IMPORTANT: Leave this empty** (do not set any root directory)

### Environment
- **Node.js Version**: 22.x (v20 and below cause build failures)
- **Package Manager**: pnpm (should auto-detect from pnpm-lock.yaml)

### Domain & Git
- **Git Repository**: Your repository
- **Production Branch**: main
- **Install Command at Project Level**: Should auto-detect pnpm workspace

## App-Level Configuration

The build configuration is now in `/apps/web/vercel.json`:
- Uses `cd ../.. &&` pattern to run commands from monorepo root
- Properly configures pnpm workspace context
- Sets correct output directory relative to app

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

- Removed root-level `vercel.json` (Vercel ignores it for pnpm monorepos)
- Moved configuration to app-level for proper monorepo context
- Updated package manager version to match lockfile version