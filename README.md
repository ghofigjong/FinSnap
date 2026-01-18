# FinSnap 💸

A personal expense tracking and budgeting mobile app with AI-powered receipt and bank statement scanning.

![FinSnap](https://img.shields.io/badge/Platform-Android-green) ![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue) ![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- 📸 **Smart Receipt Scanning** - Scan receipts and bank statements with your camera
- 🤖 **AI-Powered Extraction** - Automatically extract transaction details using OpenAI Vision
- 📊 **Budget Tracking** - Set and monitor budgets by category
- 💰 **Income & Expense Tracking** - Track all your financial transactions
- 📈 **Monthly Reports** - View spending summaries and trends
- 🔐 **Secure Authentication** - User authentication with Supabase Auth

## Tech Stack

- **Mobile App**: React Native with Expo (Android)
- **Backend API**: Next.js API Routes (Vercel)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI GPT-4 Vision API
- **Language**: TypeScript throughout

## Project Structure

```
FinSnap/
├── apps/
│   ├── mobile/              # Expo React Native app
│   │   ├── app/             # Expo Router screens
│   │   └── src/             # Source code
│   │       ├── components/  # Reusable UI components
│   │       ├── contexts/    # React contexts (Auth)
│   │       ├── constants/   # Theme, colors
│   │       └── lib/         # Supabase, API clients
│   └── api/                 # Next.js API backend
│       └── src/
│           ├── app/api/     # API routes
│           └── lib/         # Utilities
├── packages/
│   └── shared/              # Shared types and utilities
└── supabase/
    └── migrations/          # Database migrations
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Android Studio (for Android development)
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- OpenAI API key
- Vercel account (for deployment)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/finsnap.git
cd finsnap
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor and run the migration script from `supabase/migrations/001_initial_schema.sql`
3. Note your project URL and API keys from Settings > API

### 4. Configure Environment Variables

**Mobile App** (`apps/mobile/.env`):
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**API Backend** (`apps/api/.env.local`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### 5. Run the Development Servers

Start the API backend:
```bash
npm run api
```

Start the mobile app:
```bash
npm run mobile
```

### 6. Run on Android

Using Expo Go:
```bash
npm run mobile
# Scan the QR code with Expo Go app
```

Build for Android:
```bash
cd apps/mobile
npx expo run:android
```

## Deployment

### Deploy API to Vercel

1. Connect your GitHub repository to Vercel
2. Set the root directory to `apps/api`
3. Add environment variables in Vercel dashboard
4. Deploy!

### Build Android APK

```bash
cd apps/mobile
npx eas build --platform android --profile preview
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/scan` | Scan receipt/statement image |
| GET | `/api/user` | Get authenticated user |

## Database Schema

### Tables

- **profiles** - User profiles (extends Supabase auth)
- **transactions** - Income and expense transactions
- **budgets** - Budget settings per category

### Categories

Expense: `food`, `transportation`, `utilities`, `entertainment`, `shopping`, `healthcare`, `education`, `other`

Income: `salary`, `freelance`, `investment`, `gift`, `other`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Expo](https://expo.dev/) for the excellent React Native tooling
- [Supabase](https://supabase.com/) for the backend infrastructure
- [OpenAI](https://openai.com/) for the Vision API
- [Vercel](https://vercel.com/) for hosting
