#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Building with vite..."
npx vite build

echo "Build completed successfully!"
