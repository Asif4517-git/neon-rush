# Hosting NEON RUSH on GitHub Pages (asif4517-git)

The project is pre-configured to build and deploy itself with **GitHub Actions**. Once the repository is pushed, every update to `main` is built and published automatically.

> **I can't push to your account from here.** This workspace has no access to your GitHub credentials or repository, so the final step below must be run by you while signed in as **asif4517-git**.

---

## Important: pick the right repository name

Your portfolio already lives at **https://asif4517-git.github.io/**. There are two valid setups:

| Repository | Resulting URL | Notes |
| --- | --- | --- |
| **`neon-rush`** *(recommended)* | `https://asif4517-git.github.io/neon-rush/` | Keeps your existing portfolio at the root untouched. The game lives at its own path. |
| **`asif4517-git.github.io`** | `https://asif4517-git.github.io/` | Replaces the portfolio currently served at your root domain. Only choose this if you intend to replace it. |

The instructions below use `neon-rush`. The build is a single self-contained `index.html`, so it works at either path with no configuration changes.

---

## Option A — deploy from a new `neon-rush` repository (recommended)

### 1. Create the empty repository

1. Go to <https://github.com/new>
2. **Owner:** `asif4517-git`
3. **Repository name:** `neon-rush`
4. Visibility: **Public** (required for free GitHub Pages)
5. Do **not** add a README, .gitignore or licence — the project already has them
6. Click **Create repository**

### 2. Push this project

Run these commands in the project folder, replacing nothing except the path if needed:

```bash
git init
git add .
git commit -m "NEON RUSH — 3D arcade racing game"
git branch -M main
git remote add origin https://github.com/asif4517-git/neon-rush.git
git push -u origin main
```

If Git asks for credentials, use a **Personal Access Token** as the password (GitHub no longer accepts account passwords over HTTPS):

1. <https://github.com/settings/tokens> → **Generate new token (classic)**
2. Scope: **`repo`**
3. Copy the token and paste it when prompted for the password

Or push with GitHub CLI:

```bash
gh auth login
gh repo create neon-rush --public --source=. --remote=origin --push
```

### 3. Turn on Pages

The workflow includes `enablement: true`, so in most cases Pages turns on automatically on the first run. To be certain:

1. Open the repository → **Settings** → **Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Open the **Actions** tab → **Deploy NEON RUSH to GitHub Pages** → **Run workflow** (or just push another commit)

### 4. Open the game

After the workflow finishes (about 1–2 minutes):

**https://asif4517-git.github.io/neon-rush/**

You can also see it under **Settings → Pages → Visit site**, or in the **Deployments** section of the repository.

---

## Option B — deploy at the root of `asif4517-git.github.io`

Only do this if you want the game at the bare domain **https://asif4517-git.github.io/** and are happy to replace what is currently there.

1. Open your existing `asif4517-git.github.io` repository.
2. Back up or move the current portfolio files out of the repository first.
3. Add this project's files to the root of that repository, or push this project to it:

```bash
git remote add root https://github.com/asif4517-git/asif4517-git.github.io.git
git push root main
```

4. Set **Settings → Pages → Source** to **GitHub Actions**.
5. The workflow publishes to **https://asif4517-git.github.io/**.

If you would rather keep the portfolio and add the game, Option A is the safer choice.

---

## Option C — manual `gh-pages` branch (fallback)

Use this only if Actions are unavailable on your account. It publishes the already-built game to a `gh-pages` branch.

```bash
npm install
npm run build

git checkout --orphan gh-pages
git rm -rf .
cp -r dist/. .
touch .nojekyll
git add .
git commit -m "Deploy NEON RUSH"
git push -u origin gh-pages --force
git checkout main
```

Then set **Settings → Pages → Source** to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`.

For future updates, repeat the build-and-copy steps (or re-run the workflow in Option A, which is automatic).

---

## What the workflow does

`.github/workflows/deploy.yml`:

1. Checks out `main`
2. Installs Node 20 and runs `npm ci`
3. Runs `npm run build` — the build bundles everything into a single `dist/index.html`
4. Uploads `dist/` as the Pages artifact
5. Deploys it with GitHub's official Pages actions

No repository secrets are required. Every push to `main` (or manual **Run workflow**) redeploys the latest version.

## Verifying a deployment

After the first deploy, check:

- The page loads at the URL above
- The menu appears and **Start race** launches a race
- Reloading the page returns to the menu (the app uses internal screens, no URL routing, so this always works)
- On the home page and the **About** page, the portfolio, Instagram and email links open correctly

If something looks wrong after an update, clear the browser cache or open the URL in a private window — GitHub Pages caches `index.html` for a few minutes.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Actions` tab shows “workflow not found” | Confirm the file is at `.github/workflows/deploy.yml` in the repo root. Dot-folders are sometimes missed when copying files. |
| Deploy fails with `Get Pages site failed` | Set **Settings → Pages → Source** to **GitHub Actions**, then re-run the workflow. |
| Deploy fails with `Not Found` on upload | Ensure the Pages source is GitHub Actions and that the workflow has `pages: write` and `id-token: write` permissions (they are already in the file). |
| `npm ci` fails because the lockfile is missing | Commit `package-lock.json` (it is part of this project). |
| 404 when opening the project URL | The first deployment may still be running. Check the Actions tab for a green check mark. |
| Fonts look different | Fonts load from Google Fonts; offline/preview environments fall back to the local sans-serif stack. |
| Assets missing | Not possible with this build — JS, CSS and images are inlined in the single `dist/index.html`. |
| Build warns about Puppeteer | Harmless. CI skips the browser download; Puppeteer is only used by the local test harnesses in `scripts/`. |

## Custom domain (optional)

If you want something like `neonrush.asif.dev`:

1. **Settings → Pages → Custom domain**, enter the domain
2. At your DNS provider add a `CNAME` record pointing to `asif4517-git.github.io`
3. Enable **Enforce HTTPS** once the certificate is issued

---

## Updating the game later

```bash
# after making changes
npm run build          # optional local check
git add .
git commit -m "Update NEON RUSH"
git push
```

GitHub Actions rebuilds and republishes automatically.
