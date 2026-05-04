# Deployment Guide

## Vercel Deployment ✅

The project is configured for Vercel deployment with SSR support.

### Steps:
1. Connect your repository to Vercel
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy - Vercel will automatically detect the configuration

## Netlify Deployment ✅

The project is also configured for Netlify deployment with SSR support.

### Steps:
1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy - Netlify will use the `netlify.toml` configuration

### Configuration Files:
- `netlify.toml` - Build settings and redirects
- `.netlify/state.json` - Environment variables template

## Cloudflare Workers Deployment

The project can also be deployed to Cloudflare Pages by setting `CF_PAGES=1` environment variable.

## Environment Variables

All platforms require these environment variables:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
```

## Build Commands

- **Standard**: `npm run build`
- **Netlify**: `npm run build:netlify`
- **Development**: `npm run build:dev`

## Post-Deployment

After deployment:
1. Test all routes work correctly
2. Verify authentication flow
3. Test payment integration (if available)
4. Check certificate verification system
