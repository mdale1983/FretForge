# FretForge

FretForge is a Windows guitar-practice workstation built with Tauri, React, and Rust.

## Start the development app

Double-click `Start FretForge.vbs` from the repository root to launch FretForge with its development terminal hidden. Visual Studio is not required. Startup output is written to `.fretforge-dev.log` for troubleshooting.

Use `Start FretForge Dev.cmd` when you want to see live build output or diagnose a startup failure.

The first launch installs JavaScript dependencies when they are missing. Rust and the Tauri prerequisites must already be installed on the development computer.

## Branch workflow

- `main` contains the latest tested build.
- Use short-lived `feature/<name>` branches for incomplete or risky work.
- Merge tested features into `main`, then remove the feature branch.
