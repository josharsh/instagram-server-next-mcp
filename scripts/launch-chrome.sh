#!/bin/bash

# Kill any existing Chrome instances
pkill -f "Google Chrome"

# Launch Chrome with remote debugging enabled
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --remote-debugging-port=9222 \
  --user-data-dir="/Users/ryan/Library/Application Support/Google/Chrome" \
  --no-first-run \
  --no-default-browser-check \
  --disable-features=TranslateUI \
  about:blank
