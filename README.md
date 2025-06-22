# Budget Me - Personal Finance Management App

A modern, responsive web application for personal finance management built with React, TypeScript, and Supabase.

## 🚀 Features

- **User Authentication**: Secure signup, login, and password reset functionality
- **Real-time Validation**: Live form validation with availability checking
- **Modern UI**: Beautiful, responsive design with dark theme
- **Type Safety**: Full TypeScript implementation
- **Testing**: Comprehensive unit tests with Vitest and React Testing Library

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Testing**: Vitest, React Testing Library, Jest DOM
- **Routing**: React Router DOM

## 📁 Project Structure

```
Budget App/
├── client/
│   └── budget-app/          # React frontend application
│       ├── src/
│       │   ├── components/  # Reusable UI components
│       │   ├── context/     # React context providers
│       │   ├── hooks/       # Custom React hooks
│       │   ├── pages/       # Page components
│       │   ├── services/    # API service layer
│       │   ├── test/        # Test fixtures and setup
│       │   └── types/       # TypeScript type definitions
│       └── package.json
├── database/                # Database schema and migrations
└── service/                 # Backend services (future)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd "Budget App"
   ```

2. **Install dependencies**
   ```bash
   cd client/budget-app
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in `client/budget-app/`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql` in your Supabase SQL editor

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Run tests**
   ```bash
   npm test
   ```

## 🧪 Testing

The project includes comprehensive unit tests:

- **AuthContext**: Tests for authentication state management
- **Login Page**: Form validation, error handling, and submission
- **SignUp Page**: Real-time validation, form submission, and error scenarios

Run tests with:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Copy your project URL and anon key
3. Add them to your `.env` file
4. Run the database schema from `database/schema.sql`

### Environment Variables

Required environment variables:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
