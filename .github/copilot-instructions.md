# FinSnap - Expense Tracking Mobile App

## Project Overview
FinSnap is a personal expense tracking/budgeting mobile app with AI-powered receipt and bank statement scanning capabilities.

## Tech Stack
- **Mobile App**: React Native with Expo (Android)
- **Backend API**: Next.js API Routes (Vercel)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI/ML**: OpenAI Vision API for receipt/statement parsing
- **Language**: TypeScript throughout

## Project Structure
```
FinSnap/
├── apps/
│   ├── mobile/          # Expo React Native app
│   └── api/             # Next.js API backend
├── packages/
│   └── shared/          # Shared types and utilities
└── supabase/
    └── migrations/      # Database migrations
```

## Development Guidelines
- Use TypeScript strict mode
- Follow React Native best practices
- Use Supabase client for all database operations
- Handle errors gracefully with user-friendly messages
- Implement proper loading states for async operations

## Key Features
1. Receipt/bank statement scanning via camera
2. AI-powered transaction extraction
3. Automatic categorization (expense/income)
4. Budget tracking and alerts
5. Transaction history and filtering
6. Monthly/weekly spending reports

## Environment Variables Required
### Mobile App (.env)
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_API_URL`

### API Backend (.env.local)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
