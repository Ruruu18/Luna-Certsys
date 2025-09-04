# Resare

A full-stack application with Vue.js web frontend and Expo React Native mobile app.

## Project Structure

```
resare/
├── web/          # Vue 3 + Vite web application
├── mobile/       # Expo React Native mobile application
├── package.json  # Root package.json with workspace scripts
└── README.md     # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- For mobile development: Expo CLI and either Android Studio/Xcode or Expo Go app

### Installation

```bash
# Install all dependencies for both projects
npm run install:all
```

### Development

#### Web Application (Vue + Vite)

```bash
# Start the web development server
npm run dev:web

# Build for production
npm run build:web

# Run linting
npm run lint:web

# Run tests
npm run test:web
```

#### Mobile Application (Expo React Native)

```bash
# Start the Expo development server
npm run dev:mobile

# Build for production
npm run build:mobile

# Run linting
npm run lint:mobile
```

## Tech Stack

### Web Application

- **Framework:** Vue 3
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** Vue Router
- **State Management:** Pinia
- **Testing:** Vitest
- **Linting:** ESLint

### Mobile Application

- **Framework:** Expo (React Native)
- **Language:** TypeScript
- **Platform:** iOS & Android

## Development Workflow

1. Both applications are set up with TypeScript for type safety
2. The web app uses Vue 3 with Composition API
3. The mobile app uses Expo for cross-platform development
4. Shared scripts are available at the root level for convenience

## Next Steps

- Implement screens and navigation for both platforms
- Set up backend API integration
- Add shared utilities and types between web and mobile
- Configure CI/CD pipelines
