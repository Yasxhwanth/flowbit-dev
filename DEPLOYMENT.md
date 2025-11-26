# Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Variables

Set these in your hosting platform (Vercel, Railway, etc.):

#### **Required for Core Functionality**
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Better Auth
BETTER_AUTH_URL=https://your-domain.com
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-domain.com

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Polar (Billing)
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_SUCCESS_URL=https://your-domain.com/success

# AI Providers (Optional - can use env vars or credentials)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...

# App URL (for webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

#### **Optional / Sentry**
```bash
# Sentry (already configured)
SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
```

### 2. Database Setup

1. **Create PostgreSQL database** (Vercel Postgres, Supabase, Railway, etc.)
2. **Run migrations:**
   ```bash
   npx prisma migrate deploy
   ```
   Or if using Vercel, add this to your build command:
   ```bash
   npx prisma generate && npx prisma migrate deploy && next build
   ```

### 3. OAuth Provider Configuration

#### **Google OAuth**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Add authorized redirect URI: `https://your-domain.com/api/auth/callback/google`
- Add authorized JavaScript origin: `https://your-domain.com`

#### **GitHub OAuth**
- Go to [GitHub OAuth Apps](https://github.com/settings/developers)
- Update Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

### 4. Build Configuration

Your `package.json` already has:
- ✅ `build` script: `next build --turbopack`
- ✅ `start` script: `next start`

**For Vercel:** No additional config needed, it auto-detects Next.js.

**For other platforms:** Ensure Node.js 18+ and run:
```bash
npm run build
npm start
```

### 5. Polar Configuration

⚠️ **Important:** The Polar client is currently set to `"sandbox"` mode. For production:

1. Update `src/lib/polar.ts` to use production:
   ```ts
   server: process.env.POLAR_SERVER || "sandbox",
   ```
2. Set `POLAR_SERVER=production` in production environment

### 6. Inngest Setup (if using workflows)

If you're using Inngest for workflow execution:
- Set up Inngest account
- Configure webhook endpoints
- Add `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` if required

## 🚀 Deployment Steps

### Vercel (Recommended)

1. **Connect your repository** to Vercel
2. **Add environment variables** (see above)
3. **Configure build settings:**
   - Build Command: `npx prisma generate && npx prisma migrate deploy && next build`
   - Output Directory: `.next` (auto-detected)
4. **Deploy!**

### Other Platforms

1. Set environment variables
2. Run database migrations: `npx prisma migrate deploy`
3. Build: `npm run build`
4. Start: `npm start`

## ⚠️ Known Issues to Fix

1. **Polar Sandbox Mode:** Update `src/lib/polar.ts` to support production
2. **Missing Prisma Postinstall:** Consider adding to `package.json`:
   ```json
   "postinstall": "prisma generate"
   ```

## ✅ Post-Deployment Verification

- [ ] Homepage loads
- [ ] Login/Signup works
- [ ] Google OAuth works
- [ ] GitHub OAuth works
- [ ] Database connections work
- [ ] Workflows can be created
- [ ] AI nodes execute (if API keys set)
- [ ] Webhooks receive requests
- [ ] Billing portal accessible (if Polar configured)

## 📝 Notes

- The app uses **Turbopack** for faster builds
- **Sentry** is configured for error tracking
- **Better Auth** handles authentication
- **Prisma** manages database schema
- All AI providers can use either env vars or saved credentials

