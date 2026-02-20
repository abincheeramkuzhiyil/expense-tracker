# Development Guide - Expense Tracker

## Quick Start Commands

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```
App will be available at http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Development Workflow

### Adding a New Page

1. Create page file in `app/` directory:
```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page Content</div>;
}
```

2. Add navigation link in `components/layout/Navigation.tsx`:
```typescript
const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Expenses', icon: <ReceiptIcon />, path: '/expenses' },
  { text: 'New Page', icon: <YourIcon />, path: '/new-page' },
];
```

### Creating a New Component

1. Create component file in appropriate directory:
```typescript
// components/[category]/ComponentName.tsx
'use client'; // Add if component uses hooks or client-side features

import { /* MUI components */ } from '@mui/material';

interface ComponentNameProps {
  // Define props
}

export default function ComponentName({ /* props */ }: ComponentNameProps) {
  return (
    // Component JSX
  );
}
```

2. Follow naming conventions:
   - File: PascalCase (e.g., `DatePicker.tsx`)
   - Component: PascalCase (e.g., `DatePicker`)
   - Props interface: `ComponentNameProps`

### Working with LocalStorage

```typescript
// Save data
localStorage.setItem('expenses', JSON.stringify(expenses));

// Load data
const storedExpenses = localStorage.getItem('expenses');
if (storedExpenses) {
  const expenses = JSON.parse(storedExpenses);
}
```

### Using MUI Theme

Access theme values:
```typescript
import { useTheme } from '@mui/material/styles';

const theme = useTheme();
// Use theme.palette, theme.spacing, etc.
```

Custom styling with sx prop:
```typescript
<Box sx={{
  backgroundColor: 'primary.main',
  padding: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
  },
}}>
```

### TypeScript Best Practices

1. **Always define interfaces for props**
```typescript
interface MyComponentProps {
  title: string;
  count?: number; // Optional
  onSubmit: (data: FormData) => void;
}
```

2. **Use strict types, avoid `any`**
```typescript
// Bad
const data: any = fetchData();

// Good
interface DataType {
  id: string;
  value: number;
}
const data: DataType = fetchData();
```

3. **Export types for reuse**
```typescript
// types/expense.types.ts
export interface Expense { /* ... */ }
export type ViewMode = 'day' | 'month' | 'year';
```

## Common Tasks

### Adding a New Expense Category

1. Update category type in `types/expense.types.ts`
2. Add category to dropdown in add/edit form
3. Consider adding category-specific icons

### Implementing Date Filtering

Already implemented in `app/expenses/page.tsx`:
```typescript
const filteredExpenses = expenses.filter((expense) => {
  // Filter logic based on viewMode and currentDate
});
```

### Adding Form Validation

Use MUI's built-in form validation:
```typescript
<TextField
  required
  error={!!error}
  helperText={error}
  onChange={handleChange}
/>
```

## Debugging Tips

### React DevTools
- Install React Developer Tools browser extension
- Use Components tab to inspect component tree
- Use Profiler to identify performance issues

### Console Logging
```typescript
console.log('Current state:', { expenses, viewMode, currentDate });
```

### TypeScript Errors
- Run `npm run lint` to catch type errors
- Check VS Code problems panel
- Hover over red squiggles for error details

### LocalStorage Issues
- Open browser DevTools → Application → Local Storage
- Inspect stored data
- Clear storage if corrupted: `localStorage.clear()`

## Testing Strategy (Future)

### Unit Tests
- Test utility functions
- Test custom hooks
- Use Jest and React Testing Library

### Integration Tests
- Test user workflows
- Test component interactions
- Test LocalStorage operations

### E2E Tests
- Use Playwright or Cypress
- Test critical user journeys
- Test PWA installation

## Performance Optimization

### Current Implementations
- Client-side rendering for interactive components
- Lazy loading of heavy components (to be implemented)
- Efficient re-rendering with React.memo (to be implemented)

### Future Optimizations
- Implement virtualization for large expense lists
- Add loading states for better UX
- Optimize bundle size with code splitting

## PWA Development

### Testing PWA Locally
1. Build production version: `npm run build`
2. Start production server: `npm start`
3. Open Chrome DevTools → Application → Service Workers
4. Check manifest and installation

### PWA Checklist
- ✅ Manifest file configured
- ✅ Service worker registered (via next-pwa)
- ⏳ Offline functionality (to be implemented)
- ⏳ Install prompt (to be implemented)
- ⏳ Icons for all sizes (placeholders ready)

## Git Workflow

### Commit Messages
Follow conventional commits:
- `feat: add expense editing dialog`
- `fix: correct date navigation bug`
- `docs: update README with setup instructions`
- `style: format code with prettier`
- `refactor: extract expense list logic`

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches

## Deployment

### Build Preparation
1. Update environment variables
2. Test production build locally
3. Check PWA functionality
4. Verify all features work offline (when implemented)

### Deployment Platforms
- **Vercel**: Recommended for Next.js apps
- **Netlify**: Alternative with good PWA support
- **GitHub Pages**: Static export option

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [MUI Components](https://mui.com/material-ui/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [PWA Checklist](https://web.dev/pwa-checklist/)

### Tools
- VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Material Icon Theme

## Troubleshooting

### Issue: Module not found
**Solution**: Run `npm install` and restart dev server

### Issue: TypeScript errors after update
**Solution**: Delete `.next` folder and restart

### Issue: PWA not installing
**Solution**: Check manifest.json, ensure HTTPS (or localhost), and use production build

### Issue: Hot reload not working
**Solution**: Restart dev server, check file watchers limit on Linux

---

**Note**: This guide is a living document. Update it as new patterns and practices are established in the project.
