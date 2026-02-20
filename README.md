# Expense Tracker

A Progressive Web Application (PWA) for tracking and managing expenses built with Next.js, TypeScript, and Material-UI.

## Features

- 📊 Track expenses by day, month, and year
- 💾 Local data persistence using browser LocalStorage
- 📱 Progressive Web App - installable on desktop and mobile
- 🎨 Material-UI design system
- ⚡ Built with Next.js 14 App Router
- 🔒 TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
expense_tracker/
├── app/                    # Next.js App Router pages
│   ├── expenses/          # Expenses page
│   ├── layout.tsx         # Root layout with MUI provider
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── expense/          # Expense-specific components
│   └── layout/           # Layout components
├── types/                # TypeScript type definitions
├── theme/                # MUI theme configuration
├── public/               # Static assets & PWA files
└── skills/               # Project documentation

```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI Library**: Material-UI (MUI)
- **Styling**: Emotion (CSS-in-JS)
- **PWA**: next-pwa

## Current Pages

1. **Home** - Welcome page with greeting
2. **Expenses** - View, filter, and manage expenses

## Features in Development

- Add/Edit expense functionality
- SMS parsing for automated entry
- Data export/import
- Budget tracking
- Analytics dashboard

## Contributing

This is a personal project. Refer to `skills/skill.md` for development guidelines and coding standards.

## License

Private - All rights reserved
