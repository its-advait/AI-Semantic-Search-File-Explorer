# BenchProject - AI Powered File Explorer

This repository is a monorepo containing the different components of the AI Powered File Explorer application.

## Packages

-   **`packages/electron-app`**: The main Electron application, which serves as the user-facing frontend.
-   **`testing_local_embedding`**: A set of Python scripts for prototyping and testing the local embedding and filesystem watching logic.

## Architecture

The project is designed with a decoupled architecture in mind. The Electron application is the client, and it will communicate with backend services (simulated in the `testing_local_embedding` package) for tasks like file indexing, embedding, and searching.
