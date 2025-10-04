# GitHub Pages Deployment Guide

This guide explains how to deploy the Governance Data Mining Explorer to GitHub Pages.

## Prerequisites

- Repository pushed to GitHub: `dhanaabhirajk/kgl-submission-explorer`
- Node.js and npm installed locally for testing

## Automated Deployment

The repository is configured for **automatic deployment** using GitHub Actions. Every push to the `main` or `master` branch will trigger a deployment.

### Enable GitHub Pages

1. Go to your repository on GitHub: https://github.com/dhanaabhirajk/kgl-submission-explorer
2. Click on **Settings** → **Pages** (in the left sidebar)
3. Under **Source**, select:
   - Source: **GitHub Actions** (recommended)
4. Save the settings

### Workflow Configuration

The deployment workflow is located at `.github/workflows/deploy.yml` and will:
1. Checkout the code
2. Install dependencies with `npm ci`
3. Build the project with `npm run build`
4. Deploy the `dist/` folder to GitHub Pages

### Required Permissions

The workflow already has the correct permissions configured:
```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## Configuration Details

### Base Path

The `vite.config.ts` is configured with the correct base path:
```typescript
base: mode === 'production' ? '/kgl-submission-explorer/' : '/',
```

This ensures all assets load correctly on GitHub Pages at:
**https://dhanaabhirajk.github.io/kgl-submission-explorer/**

### Jekyll Bypass

A `.nojekyll` file is included in the `public/` directory to prevent GitHub Pages from processing the site with Jekyll, which can cause issues with files starting with underscores.

## Manual Deployment (if needed)

If you need to deploy manually:

```bash
# 1. Build the project
npm run build

# 2. The dist/ folder is ready for deployment
# You can use gh-pages or manually push to gh-pages branch
```

## Testing Locally

Before deploying, you can test the production build locally:

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview the production build
npm run preview
```

This will start a local server at http://localhost:4173 with the production build.

## Troubleshooting

### Site not loading

1. **Check GitHub Pages settings**: Ensure the source is set to "GitHub Actions"
2. **Check workflow runs**: Go to Actions tab and verify the workflow completed successfully
3. **Wait a few minutes**: Initial deployment can take 5-10 minutes to propagate

### Assets not loading (404 errors)

1. **Verify base path**: Ensure `vite.config.ts` has the correct repository name
2. **Check .nojekyll**: Ensure the file exists in the deployed site
3. **Clear browser cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Workflow fails

1. **Check Node version**: Workflow uses Node 20
2. **Check build locally**: Run `npm run build` locally to identify issues
3. **Review workflow logs**: Check the Actions tab for detailed error messages

## Live URL

Once deployed, your site will be available at:
**https://dhanaabhirajk.github.io/kgl-submission-explorer/**

## Update Deployment

To update the deployed site:
1. Make your changes
2. Commit and push to `main` or `master` branch
3. GitHub Actions will automatically rebuild and redeploy

## Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#github-pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
