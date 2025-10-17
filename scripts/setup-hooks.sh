#!/bin/bash

# Setup Git hooks for the project
# Run this script to install pre-push hooks

echo "Setting up Git hooks..."

# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/sh

# Pre-push hook to run linting before pushing
# This ensures code quality standards are met before pushing to remote

echo "Running pre-push checks..."
echo ""

# Run lint
echo "→ Running pnpm lint..."
pnpm run lint

# Check if lint passed
if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Lint failed! Please fix the linting errors before pushing."
    echo "   Run 'pnpm run lint' to see the errors."
    exit 1
fi

echo ""
echo "✅ All pre-push checks passed!"
echo ""

exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-push

echo "✅ Git hooks installed successfully!"
echo ""
echo "The following hooks are now active:"
echo "  • pre-push: Runs 'pnpm lint' before every push"
echo ""
