# Quick Reference Guide - Expense Tracker

## Project Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start development server (localhost:3000) |
| `npm run build` | Create production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint code checking |

## Project Structure

```
expense_tracker/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout (MUI + theme)
│   ├── page.tsx             # Home page
│   └── expenses/
│       └── page.tsx         # Expenses page
├── components/              # React components
│   ├── layout/
│   │   └── Navigation.tsx   # App navigation
│   └── expense/
│       ├── DateNavigation.tsx
│       ├── ExpenseList.tsx
│       └── AddExpenseFab.tsx
├── types/                   # TypeScript definitions
│   └── expense.types.ts
├── theme/                   # MUI theme
│   └── theme.ts
├── utils/                   # Utility functions
│   └── seedData.ts
├── public/                  # Static files
│   └── manifest.json        # PWA manifest
└── skills/                  # Documentation
    ├── skill.md
    └── development-guide.md
```

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.js` | Next.js + PWA config |
| `.eslintrc.json` | ESLint rules |
| `.gitignore` | Git ignore patterns |

## TypeScript Interfaces

### Expense
```typescript
interface Expense {
  id: string;
  amount: number;
  category: string;
  date: Date;
  description: string;
  source: 'manual' | 'sms';
  createdAt: Date;
  updatedAt: Date;
}
```

### ViewMode
```typescript
type ViewMode = 'day' | 'month' | 'year';
```

## Component Props Quick Reference

### DateNavigation
```typescript
{
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  total: number;
}
```

### ExpenseList
```typescript
{
  expenses: Expense[];
  total: number;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}
```

### AddExpenseFab
```typescript
{
  onClick: () => void;
}
```

## MUI Theme Colors

| Color | Value | Usage |
|-------|-------|-------|
| Primary | `#1976d2` | Buttons, links, highlights |
| Secondary | `#dc004e` | Error states, delete actions |
| Background | `#eaeeef` | Page background |
| Paper | `#ffffff` | Card backgrounds |

## localStorage Keys

| Key | Data Type | Description |
|-----|-----------|-------------|
| `expenses` | `Expense[]` | Array of all expenses |

## Browser Console Helpers

When running in development, access these in browser console:

```javascript
// Seed sample data
window.expenseSeeder.seed()

// Clear all data
window.expenseSeeder.clear()

// Get expense count
window.expenseSeeder.count()

// View sample data
window.expenseSeeder.samples
```

## Common MUI Components Used

| Component | Import | Usage |
|-----------|--------|-------|
| Box | `@mui/material` | Layout container |
| Container | `@mui/material` | Max-width wrapper |
| Grid | `@mui/material` | Responsive grid |
| Paper | `@mui/material` | Card/surface |
| Typography | `@mui/material` | Text elements |
| Button | `@mui/material` | Buttons |
| IconButton | `@mui/material` | Icon-only buttons |
| Accordion | `@mui/material` | Expandable panels |
| Fab | `@mui/material` | Floating action button |
| AppBar | `@mui/material` | Top header |
| Drawer | `@mui/material` | Side navigation |

## Routes

| Path | Page | Description |
|------|------|-------------|
| `/` | Home | Welcome page |
| `/expenses` | Expenses | Expense management |

## Development URLs

- **Dev Server**: http://localhost:3000
- **Production Build**: http://localhost:3000 (after build)

## VS Code Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+P` | Quick file open |
| `Ctrl+Shift+P` | Command palette |
| `Ctrl+` | Toggle terminal |
| `F2` | Rename symbol |
| `Ctrl+/` | Toggle comment |
| `Alt+Shift+F` | Format document |

## Git Commands

```bash
# Check status
git status

# Stage changes
git add .

# Commit
git commit -m "feat: your message"

# Push
git push origin main
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Module not found | `npm install` |
| TypeScript errors | Delete `.next/` folder |
| Port in use | Change port: `npm run dev -- -p 3001` |
| Hot reload broken | Restart dev server |
| localStorage issues | Clear in DevTools → Application |

## Next Steps / TODOs

- [ ] Implement Add Expense dialog
- [ ] Implement Edit Expense functionality
- [ ] Implement Delete with confirmation
- [ ] Add proper PWA icons
- [ ] Implement LocalStorage save/load
- [ ] Add expense categories dropdown
- [ ] Add SMS parsing feature
- [ ] Create analytics dashboard
- [ ] Add export/import functionality
- [ ] Implement budget tracking

## Support Files

- **Main Guide**: `skills/skill.md`
- **Development**: `skills/development-guide.md`
- **Setup**: `README.md`
- **Icons**: `public/ICONS_README.md`

---

*Last Updated: February 15, 2026 - Version 1.0 Initial Release*
