#!/bin/bash

# Post-Push Actions Check
# This script runs after Bash tool executions via PostToolUse hook
# It checks if the command was a git push and reminds Claude to check Actions

# Read JSON input from stdin
INPUT=$(cat)

# Extract the command that was executed
COMMAND=$(echo "$INPUT" | grep -o '"command":"[^"]*"' | sed 's/"command":"//;s/"$//')

# Check if this was a git push command
if echo "$COMMAND" | grep -q "git push"; then
    # Output reminder for Claude to check GitHub Actions
    cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "⚠️ WICHTIG: Ein 'git push' wurde gerade ausgeführt. Bitte nutze jetzt den GitHub Actions Monitor Skill, um die CI/CD-Pipeline zu überwachen. Führe 'gh run watch' aus, um sicherzustellen, dass alle Checks erfolgreich sind."
  }
}
EOF
    exit 0
fi

# For non-push commands, output nothing
echo "{}"
exit 0
