# FretForge Link

FretForge Link is a transparent VST3 effect that connects a DAW audio path to FretForge. It reports connection, signal-level, sample-rate, and pitch telemetry without performing file or network work on the real-time audio thread.

## Build on Windows

Requirements: CMake, Visual Studio C++ build tools, and Git.

```powershell
cmake -S . -B build
cmake --build build --config Release --target FretForgeLink
```

The release bundle is written to `build/VST3/Release/FretForgeLink.vst3`. The CMake project fetches the pinned Steinberg VST3 SDK dependency during configuration and runs Steinberg's validator after the build.
