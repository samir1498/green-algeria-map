# Skill: pc-coderabbit-fix

Handle CodeRabbit AI review comments on GitHub PRs for green-algeria-map.

## Trigger
User says "check coderabbit", "fix coderabbit comments", "apply code review", or after creating a PR.

## Workflow

1. **Fetch PR comments**
   ```bash
   gh pr view <number> --json comments --jq '.comments[] | .body'
   gh api repos/samir1498/green-algeria-map/pulls/<number>/comments --jq '.[] | {path, line, body}'
   ```

2. **Parse actionable items**
   - Extract file paths, line numbers, and suggested changes
   - Ignore praise/summary comments, focus on code fix suggestions
   - Group by file for efficient editing

3. **Fix each issue**
   - Read the affected file
   - Apply the suggested fix
   - Verify the fix doesn't break anything

4. **Commit and push**
   ```bash
   git add -A
   git commit -m "fix: address CodeRabbit review comments on PR #<number>"
   git push
   ```

5. **Re-trigger review**
   ```bash
   gh pr comment <number> --body "@coderabbitai review"
   ```

## Rules
- Fix ALL actionable suggestions, not just easy ones
- If a suggestion conflicts with project conventions, note it and skip with explanation
- Always run quality gates (check, lint, test) after fixes
- Never force push
