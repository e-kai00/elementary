# Elementary

**Elementary** is a chemistry learning web app, currently under development. The goal is to make learning chemistry simple and interactive, starting with the periodic table and expanding to more advanced topics.

## Repository structure

- `frontend/` contains the Angular application, configuration, and tests.
- `.gitignore`, `.editorconfig`, `README.md`, and local `notes.md` remain at the repository root.
- The Python backend will be added in a separate task.

## Frontend development

Use Node.js 22.22.3 or another version supported by Angular 22, and npm. Run these commands from the repository root:

```sh
cd frontend
npm ci
npm start
```

Open http://localhost:4200/ and choose **Start learning**. To use the Angular VS Code configuration, open `frontend/` as the editor workspace.

From `frontend/`, run the unit tests once or build for production:

```sh
npm test -- --watch=false
npm run build
```

Production browser files are generated in `frontend/dist/elementary/browser/`. Dependencies, build output, and Angular caches are ignored by Git.
