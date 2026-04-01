import React from 'react'
import { render } from 'ink'
import { App } from './ui/App.js'

// Wait briefly for the tmux pane to fully initialize its TTY before
// Ink tries to set raw mode on stdin. Without this, split-window
// followed by immediate select-pane can yank focus away too fast.
setTimeout(() => {
  render(<App />)
}, 200)
