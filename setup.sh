#!/bin/bash

echo "===================================="
echo "Setup TEC Information Board"
echo "===================================="
echo ""

## Credits
echo "Credits:"
echo "  - Developed by: Alexander Holm"
echo "  - GitHub: alex404hm"
echo "  - License: MIT"
echo ""

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for pnpm
if command_exists pnpm; then
    echo "✅ pnpm is already installed."
else
    echo "⚠️ pnpm not found. Installing pnpm..."
    if command_exists npm; then
        npm install -g pnpm
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install pnpm. Please install it manually."
            exit 1
        fi
    else
        echo "❌ npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
fi

# Install project dependencies
echo "📦 Installing project dependencies..."
pnpm install
if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies. Exiting."
    exit 1
fi

# Generate database
echo "🛠 Generating database schema..."
pnpm run db:generate
if [ $? -ne 0 ]; then
    echo "❌ Failed to generate database schema."
    exit 1
fi

# Push database
echo "🚀 Pushing database..."
pnpm run db:push
if [ $? -ne 0 ]; then
    echo "❌ Failed to push database."
    exit 1
fi

# Run seed script
echo "🌱 Running seed script..."
pnpm run seed
if [ $? -ne 0 ]; then
    echo "❌ Failed to seed database."
    exit 1
fi

# Start development server
echo "🎉 Starting development server..."
pnpm run dev