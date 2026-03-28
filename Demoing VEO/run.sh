#!/bin/bash

# Demoing VEO - Launcher
# This script handles environment setup and starts the Creative Director Lab.

echo "🎬 Starting Demoing VEO | Cinematic Director Lab..."

# 1. Check for .env
if [ ! -f ".env" ]; then
    if [ -f "../.env" ]; then
        echo "📍 Found .env in parent directory, linking it..."
        ln -s ../.env .env
    else
        echo "⚠️ Error: .env file NOT found. Please create it with your GOOGLE_API_KEY."
        exit 1
    fi
fi

# 2. Setup Environment & Dependencies
if command -v uv &> /dev/null; then
    echo "⚡ Using 'uv' for high-speed execution..."
    uv pip install -r requirements.txt
    uv run server.py
else
    echo "🐍 Using standard 'python3'..."
    if [ ! -d ".venv" ]; then
        echo "📦 Creating virtual environment..."
        python3 -m venv .venv
    fi
    source .venv/bin/activate
    pip install -r requirements.txt
    python3 server.py
fi
