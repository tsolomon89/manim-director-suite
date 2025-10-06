# GitHub Setup Instructions

## Step 1: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Fill in:
   - **Repository name**: `manim-director-suite`
   - **Description**: `Mathematical animation tool with keyframe timeline, Desmos import, and Manim export`
   - **Visibility**: Public (recommended) or Private
   - **DO NOT check any of these**:
     - ❌ Add a README file
     - ❌ Add .gitignore
     - ❌ Choose a license
3. Click **"Create repository"**

## Step 2: Connect Local Repo to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/tsolomon89/manim-director-suite.git

# Push your code to GitHub
git push -u origin main
```

## Step 3: Verify

Visit your repository at:
```
https://github.com/tsolomon89/manim-director-suite
```

You should see:
- ✅ All your code files
- ✅ README.md displayed on the homepage
- ✅ 123 files, ~29,000 lines of code
- ✅ Initial commit message

## Step 4: Set Up Branch Protection (Optional but Recommended)

1. Go to repo → Settings → Branches
2. Add rule for `main` branch:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date

## Step 5: Add Topics (Optional)

Add topics to help others discover your project:
- `react`
- `typescript`
- `manim`
- `desmos`
- `animation`
- `mathematics`
- `visualization`
- `keyframe-animation`

## Common Git Commands for Development

### Creating a New Feature
```bash
# Create feature branch
git checkout -b feature/camera-bookmarks

# Make your changes, then:
git add .
git commit -m "feat: Add camera bookmarks feature"

# Push to GitHub
git push -u origin feature/camera-bookmarks

# Create Pull Request on GitHub
```

### Daily Workflow
```bash
# Pull latest changes
git pull origin main

# Create branch for your work
git checkout -b feature/your-feature

# When done:
git add .
git commit -m "feat: description of changes"
git push -u origin feature/your-feature

# Merge via Pull Request on GitHub
```

### Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Add new feature
fix: Fix a bug
docs: Update documentation
style: Code formatting (no logic change)
refactor: Code restructure (no behavior change)
test: Add/update tests
chore: Build process, dependencies
perf: Performance improvement
```

Examples:
```bash
git commit -m "feat: Implement polar coordinate system"
git commit -m "fix: Correct parameter interpolation edge case"
git commit -m "docs: Add USER_GUIDE.md with screenshots"
git commit -m "test: Add unit tests for TweeningEngine"
```

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/tsolomon89/manim-director-suite.git
```

### "Permission denied (publickey)"
Set up SSH keys or use HTTPS with personal access token.
See: https://docs.github.com/en/authentication

### "Updates were rejected because the tip of your current branch is behind"
```bash
git pull --rebase origin main
git push origin main
```
