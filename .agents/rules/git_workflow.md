# Automated Git Commit Workflow

Whenever any code or project files are modified, created, or deleted during a task:
- Automatically run `git add .`
- Automatically run `git commit -m "..."` with a clear message describing what was done
- Automatically run `git push origin main` (or the active branch) to ensure changes are synced to GitHub
- Report the commit status to the user upon completion.
