# FretForge

FretForge is a Windows guitar-practice workstation built with Tauri, React, and Rust.

## Start the development app

Double-click `Start FretForge Dev.cmd` from the repository root. Keep its terminal window open while FretForge is running. Visual Studio is not required.

The first launch installs JavaScript dependencies when they are missing. Rust and the Tauri prerequisites must already be installed on the development computer.

## Branch workflow

- `main` contains the latest tested build.
- Use short-lived `feature/<name>` branches for incomplete or risky work.
- Merge tested features into `main`, then remove the feature branch.
