# 🌿 Git Workflow Guide

Since we are a two-person team working on separate branches (`frontend` and `backend`), following a simple Git workflow will prevent code conflicts and keep the `main` branch stable.

Here is the step-by-step guide on how to pull, commit, and create Pull Requests.

---

## 1. Initial Setup (Done Once)

When you first join the project, clone the repository to your computer:
```bash
git clone https://github.com/Usefulmech/blindspot.git
cd blindspot
```

Switch to your assigned branch immediately:
```bash
# If you are the frontend developer:
git checkout frontend

# If you are the backend developer:
git checkout backend
```

---

## 2. Daily Workflow (Working on Features)

Before you start writing code for the day, make sure your branch is up to date with `main`. 

**Step 1: Pull the latest changes from main**
```bash
git pull origin main
```
*(This ensures you have any new documentation, API contracts, or features the other person merged yesterday).*

**Step 2: Write your code**
Build your features!

**Step 3: Save and commit your work**
Once your feature is working locally:
```bash
# Stage all your changes
git add .

# Commit with a clear message
git commit -m "feat: added 5-step input form UI"

# Push your changes to GitHub
# (Replace 'frontend' with 'backend' if you are on the backend branch)
git push origin frontend
```

---

## 3. Creating a Pull Request (Merging to Main)

When your feature is completely finished and tested, it's time to merge it into the `main` branch so the other person can use it.

1. Go to the GitHub repository page: `https://github.com/Usefulmech/blindspot`
2. You will see a yellow banner saying your branch had recent pushes. Click the green **"Compare & pull request"** button.
3. Give your Pull Request a title (e.g., "Add Region Router Service").
4. Click **"Create pull request"**.
5. *Optional but recommended*: Ask your teammate to review the code.
6. Once approved, click **"Merge pull request"** to officially blend your code into the `main` branch!

---

## 4. Fixing "Merge Conflicts"

Sometimes, you and your teammate might accidentally edit the exact same line in a file (like the `README.md`). If this happens when you run `git pull origin main`, Git will warn you about a "Merge Conflict".

1. Open the conflicting file in your code editor (like VS Code).
2. You will see markers `<<<<<<<` and `>>>>>>>`.
3. Choose which version of the code to keep (yours or your teammate's), and delete the markers.
4. Save the file, then run:
   ```bash
   git add .
   git commit -m "fix: resolve merge conflicts"
   git push origin <your-branch-name>
   ```
