@echo off
echo Installing dependencies...
npm install

echo Building with vite...
npx vite build

echo Build completed successfully!
