# Expense Tracker - Project Skill File

## Project Overview

**Application Name:** Expense Tracker  
**Type:** Progressive Web Application (PWA)  
**Target Platform:** Modern web browsers with PWA installation capability

### Purpose
A comprehensive expense management application that enables users to track, categorize, and analyze their financial expenses with advanced filtering and automated data entry capabilities.

## Implementation Status

### Version 1.0 (Initial Release)
**Status**: ✅ Completed

#### Implemented Features
- **Project Setup**: Next.js 14 with App Router, TypeScript, and MUI
- **Navigation**: Responsive navigation drawer with Home and Expenses pages
- **Home Page**: Welcome screen with greeting message
- **Expenses Page**: 
  - View mode selection (Day/Month/Year)
  - Date navigation with previous/next/today buttons
  - Expense list with accordion layout
  - Total calculation display
  - Floating action button for adding expenses (UI only)
- **PWA Configuration**: Manifest file and next-pwa setup
- **Data Structure**: TypeScript interfaces for Expense model
- **Responsive Design**: Mobile-first design using MUI Grid system

#### Pending Features (Next Iterations)
- Add/Edit expense dialog and functionality
- Delete expense confirmation and implementation
- LocalStorage integration for data persistence
- SMS parsing integration
- Analytics dashboard
- Budget tracking
- Data export/import

#### File Structure Created
```
app/
  ├── layout.tsx              # Root layout with MUI theme
  ├── page.tsx                # Home page
  └── expenses/
      └── page.tsx            # Expenses page
components/
  ├── layout/
  │   └── Navigation.tsx      # App navigation drawer
  └── expense/
      ├── DateNavigation.tsx  # Date picker component
      ├── ExpenseList.tsx     # Expense accordion list
      └── AddExpenseFab.tsx   # Floating action button
types/
  └── expense.types.ts        # TypeScript type definitions
theme/
  └── theme.ts                # MUI theme configuration
```

## Core Functionality

### Primary Features
- **Expense Management**: Add, edit, delete, and categorize expenses
- **Multi-View Analytics**: View expenses filtered by Day, Month, and Year
- **Progressive Web App**: Installable on desktop and mobile devices
- **Automated Entry**: Extract and parse expense data from SMS messages

### User Workflow
1. Users can manually add expenses with details (amount, category, date, notes)
2. Users can import expenses automatically from SMS
3. Users can view expenses in various time-based aggregations
4. Data persists locally with plans for file system storage

## Technical Stack

### Framework & Libraries
- **Next.js**: Use latest stable version with App Router
- **React**: Latest compatible version with Next.js
- **MUI (Material-UI)**: Latest stable version for UI components
- **TypeScript**: Strongly preferred for type safety

### Data Storage Strategy
- **Phase 1 (Current)**: Browser LocalStorage for data persistence
- **Phase 2 (Future)**: File System Access API for local file storage on supported platforms

### Additional Technologies
- **PWA APIs**: Service Workers, Web App Manifest
- **SMS Parsing**: Native SMS reader APIs or Web Share Target API
- **State Management**: React Context API or Zustand (as needed)

## Coding Standards & Conventions

### Code Style
- Use functional React components with hooks
- Follow TypeScript strict mode conventions
- Implement ESLint and Prettier configurations
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Component Structure
```
components/
  ├── common/          # Reusable UI components
  ├── expense/         # Expense-specific components
  ├── analytics/       # Data visualization components
  └── layout/          # Layout and navigation components
```

### File Naming
- Components: PascalCase (e.g., `ExpenseList.tsx`)
- Utilities: camelCase (e.g., `dateFormatter.ts`)
- Hooks: camelCase with "use" prefix (e.g., `useExpenseData.ts`)
- Types/Interfaces: PascalCase (e.g., `Expense.types.ts`)

### State Management
- Use React hooks (useState, useEffect, useContext) for local state
- Implement custom hooks for shared logic
- Keep state as close to where it's used as possible

### Data Models
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

## Architecture Guidelines

### Component Patterns
- **Atomic Design**: Build from small, reusable components
- **Container/Presenter**: Separate logic from presentation
- **Custom Hooks**: Extract reusable business logic

### Performance Optimization
- Implement lazy loading for routes and heavy components
- Use React.memo() for expensive renders
- Optimize re-renders with useMemo and useCallback
- Implement virtualization for large expense lists

### Error Handling
- Implement error boundaries for component-level errors
- Add try-catch blocks for async operations
- Provide user-friendly error messages
- Log errors for debugging

### Accessibility
- Follow WCAG 2.1 AA standards
- Use semantic HTML elements
- Ensure keyboard navigation support
- Implement proper ARIA labels with MUI

## Development Preferences

### When Writing Code
- Prioritize code readability over cleverness
- Write self-documenting code with clear variable names
- Add comments for complex business logic
- Implement proper error handling and validation
- Use TypeScript for type safety

### Testing Strategy
- Write unit tests for utility functions
- Implement integration tests for critical user flows
- Test PWA installation and offline functionality
- Validate SMS parsing accuracy

### API & Data Handling
- Validate all user inputs
- Sanitize data before storage
- Implement data migration strategies for storage changes
- Handle edge cases (empty states, large datasets)

## Progressive Web App Requirements

### PWA Features
- Offline functionality with service workers
- App manifest for installation
- Responsive design for all screen sizes
- Fast load times (<3 seconds on 3G)

### Installation
- Provide clear install prompts
- Support both desktop and mobile installation
- Handle offline/online state transitions

## Future Roadmap

### Phase 2 Features
- File System Access API integration
- Data export/import functionality (CSV, JSON)
- Cloud sync capabilities (optional)
- Budget tracking and alerts
- Receipt image attachments
- Multi-currency support

### Technical Debt & Improvements
- Migration path from LocalStorage to File System
- Implement comprehensive test coverage
- Add end-to-end testing
- Performance monitoring and analytics

## Resources & References

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [MUI Components](https://mui.com/material-ui/getting-started/)
- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)

### Design System
- Follow MUI's Material Design guidelines
- Maintain consistent spacing and typography
- Use MUI theme customization for brand colors

---

## Instructions for AI Assistant

When working on this project:
1. **Follow the technical stack** specified above
2. **Write TypeScript** code with proper typing
3. **Use MUI components** instead of custom styling
4. **Implement responsive design** for mobile and desktop
5. **Consider PWA requirements** in all implementations
6. **Prioritize data integrity** in storage operations
7. **Add proper error handling** and user feedback
8. **Comment complex business logic** for maintainability
9. **Follow the component structure** and naming conventions
10. **Ensure accessibility** in all UI components

### When Creating New Features
- Start with TypeScript interfaces/types
- Create reusable components when possible
- Implement loading and error states
- Add input validation
- Consider offline functionality
- Test across different screen sizes

### When Debugging
- Check browser console for errors
- Verify LocalStorage data structure
- Test PWA service worker registration
- Validate date handling across timezones
- Review MUI component props and theme
    