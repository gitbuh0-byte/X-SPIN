#!/usr/bin/env pwsh
# Backend server startup script
cd "$PSScriptRoot"
node node_modules/tsx/dist/cli.js watch src/server.ts
