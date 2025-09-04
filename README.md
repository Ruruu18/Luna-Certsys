# Luna CertSys (Resare)

A comprehensive certificate management system with Vue.js web admin interface and Expo React Native mobile app for residents. This system enables efficient management of barangay certificate requests and approvals.

## 🏗️ Project Structure

```
luna-certsys/
├── web/                    # Vue 3 + Vite admin web application
│   ├── src/
│   │   ├── views/         # Admin pages (Dashboard, Users, Certificates)
│   │   ├── stores/        # Pinia state management
│   │   ├── components/    # Reusable Vue components
│   │   └── lib/          # Supabase client configuration
│   └── package.json
├── mobile/                # Expo React Native resident mobile app
│   ├── src/
│   │   ├── screens/      # Mobile screens (Login, Request, Track)
│   │   ├── components/   # React Native components
│   │   ├── contexts/     # React contexts for state
│   │   └── navigation/   # React Navigation setup
│   └── package.json
├── supabase-schema.sql    # Database schema and setup
├── package.json          # Root workspace configuration
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)

#### For Mobile Development:
- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio** (for Android development) or **Xcode** (for iOS development)
- **Expo Go app** on your phone for testing (optional)

### 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:Ruruu18/Luna-Certsys.git
   cd Luna-Certsys
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```
   This will install dependencies for the root workspace, web app, and mobile app.

### 🗄️ Database Setup (Supabase)

1. **Create a Supabase project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run the database schema**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase-schema.sql`
   - Run the script to create tables and policies

3. **Configure environment variables**
   
   **For Web App** (`web/.env.local`):
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **For Mobile App** (`mobile/.env`):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 🌐 Web Application Setup

```bash
# Navigate to web directory
cd web

# Start development server
npm run dev

# The web app will be available at http://localhost:5173
```

**Default Admin Login:**
- Email: `admin@resare.com`
- Password: (Set up through Supabase Auth)

### 📱 Mobile Application Setup

```bash
# Navigate to mobile directory
cd mobile

# Start Expo development server
npm start
```

**Development Options:**
- **Expo Go**: Scan QR code with Expo Go app
- **iOS Simulator**: Press `i` in terminal
- **Android Emulator**: Press `a` in terminal
- **Web**: Press `w` in terminal

## 🔧 Available Scripts

### Root Level Commands
```bash
npm run dev:web          # Start web development server
npm run dev:mobile       # Start mobile development server
npm run build:web        # Build web app for production
npm run build:mobile     # Build mobile app for production
npm run lint:web         # Run ESLint on web app
npm run lint:mobile      # Run ESLint on mobile app (if configured)
npm run test:web         # Run tests for web app
npm run install:all      # Install dependencies for all workspaces
```

### Web App Commands (run in `/web` directory)
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run test             # Run Vitest tests
npm run type-check       # Run TypeScript type checking
```

### Mobile App Commands (run in `/mobile` directory)
```bash
npm start                # Start Expo development server
npx expo start           # Alternative start command
npx expo run:ios         # Run on iOS simulator
npx expo run:android     # Run on Android emulator
npx expo build           # Build for app stores
```

## 🏛️ Tech Stack

### Web Application (Admin Interface)
- **Framework**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Language**: TypeScript
- **Routing**: Vue Router 4
- **State Management**: Pinia
- **UI Styling**: CSS3 with modern features
- **Testing**: Vitest + Vue Test Utils
- **Linting**: ESLint + TypeScript ESLint
- **Database**: Supabase (PostgreSQL)

### Mobile Application (Resident App)
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation 6
- **State Management**: React Context + useState/useReducer
- **UI Components**: React Native + Expo Vector Icons
- **Platform**: iOS & Android
- **Database**: Supabase (PostgreSQL)

### Shared Technologies
- **Backend**: Supabase (Auth, Database, Real-time)
- **Authentication**: Supabase Auth with Row Level Security
- **Database**: PostgreSQL with RLS policies
- **Version Control**: Git with GitHub

## 🎯 Features

### Web Admin Interface
- **Dashboard**: Overview of certificate requests and system stats
- **User Management**: Add, edit, and manage residents and purok chairmen
- **Certificate Management**: Review, approve, and track certificate requests
- **Authentication**: Secure admin login with role-based access

### Mobile Resident App
- **User Registration/Login**: Secure authentication for residents
- **Certificate Requests**: Submit requests for various certificates
- **Request Tracking**: Track status of submitted requests
- **Profile Management**: Update personal information
- **Notifications**: Receive updates on request status

## 🔐 Authentication & Roles

The system supports three user roles:

1. **Admin**: Full system access, user management, certificate approval
2. **Purok Chairman**: Manage residents in their purok, view local requests
3. **Resident**: Submit certificate requests, track status

## 🗃️ Database Schema

The database includes the following main tables:
- **users**: User profiles with role-based access
- **certificates**: Certificate records (legacy)
- **certificate_requests**: New certificate request system

See `supabase-schema.sql` for complete schema with RLS policies.

## 🚀 Deployment

### Web Application
```bash
cd web
npm run build
# Deploy the `dist` folder to your hosting service (Vercel, Netlify, etc.)
```

### Mobile Application
```bash
cd mobile
npx expo build
# Follow Expo's guide for app store deployment
```

## 🔧 Development Tips

### Hot Reloading
- **Web**: Vite provides instant hot module replacement
- **Mobile**: Expo provides fast refresh for React Native

### Debugging
- **Web**: Use browser DevTools + Vue DevTools extension
- **Mobile**: Use React Native Debugger or Expo DevTools

### Code Quality
- Both projects use ESLint and TypeScript for code quality
- Pre-commit hooks can be added for automated linting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 Environment Variables

### Required Environment Variables

**Web App** (`.env.local`):
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Mobile App** (`.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🐛 Troubleshooting

### Common Issues

**Node Modules Issues:**
```bash
# Clear all node_modules and reinstall
rm -rf node_modules web/node_modules mobile/node_modules
npm run install:all
```

**Expo Issues:**
```bash
# Clear Expo cache
cd mobile
npx expo start --clear
```

**Build Issues:**
```bash
# Clear build caches
cd web && rm -rf dist node_modules/.vite
cd ../mobile && rm -rf .expo dist
```

**Database Connection Issues:**
- Verify your Supabase URL and keys in environment files
- Check if RLS policies are properly set up
- Ensure your Supabase project is active

## 📧 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the Supabase documentation
3. Check Expo documentation for mobile-specific issues
4. Create an issue in this repository

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Happy coding! 🚀**
