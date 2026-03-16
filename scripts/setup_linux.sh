#!/bin/bash

echo "[INFO] Starting AsciiDoc Editor Setup for Linux..."
echo "Server started at: $(hostname -I | cut -d " " -f 1)"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js (v18+ recommended)."
    exit 1
fi

echo "[INFO] Node.js is installed: $(node -v)"

# Navigate to project root (assuming script is in /scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "[INFO] Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to install dependencies."
    exit 1
fi

echo "[INFO] Starting Dev Server..."

npm run dev -- --host


