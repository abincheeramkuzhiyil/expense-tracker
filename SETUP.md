# Setup Instructions

## First Time Setup

Follow these steps to get the Expense Tracker app running on your local machine:

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

This will install all required packages including:
- Next.js 14
- React 18
- Material-UI (MUI)
- TypeScript
- PWA dependencies

**Note**: Installation may take 2-5 minutes depending on your internet connection.

### 2. Start Development Server

After installation completes, start the development server:

```bash
npm run dev
```

You should see output similar to:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
- Ready in X.Xs
```

### 3. Open the App

Open your web browser and navigate to:
```
http://localhost:3000
```

You should see the Expense Tracker home page with "Hello User!" message.

### 4. Navigate to Expenses Page

Click the menu icon (☰) in the top-left corner and select "Expenses" to see the expense management page.

## Testing with Sample Data

The Expenses page will initially be empty. To add sample data for testing:

1. Open browser Developer Tools (F12 or Right-click → Inspect)
2. Go to the Console tab
3. Run the following command:
```javascript
window.expenseSeeder.seed()
```

This will populate the app with 5 sample expenses. Refresh the page to see them.

## Viewing Different Time Periods

- Use the **View** dropdown to switch between Day/Month/Year views
- Use the **arrow buttons** to navigate between time periods
- Click the **calendar icon** to return to today

## Project Structure

After setup, your project will have this structure:
```
expense_tracker/
├── node_modules/          # Installed dependencies (created by npm install)
├── .next/                 # Next.js build files (created by npm run dev)
├── app/                   # Application pages
├── components/            # React components
├── public/               # Static files
├── skills/               # Documentation
├── theme/                # MUI theme
├── types/                # TypeScript types
├── utils/                # Utility functions
└── package.json          # Project configuration
```

## Troubleshooting Setup

### Issue: "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/ (includes npm)

### Issue: "Port 3000 already in use"
**Solution**: 
- Option 1: Stop other applications using port 3000
- Option 2: Use a different port:
  ```bash
  npm run dev -- -p 3001
  ```

### Issue: Installation fails with permission errors
**Solution** (Windows): Run terminal as Administrator
**Solution** (Mac/Linux): Use `sudo npm install` or fix npm permissions

### Issue: TypeScript errors in VS Code
**Solution**: 
1. Wait for npm install to complete
2. Reload VS Code window (Ctrl+Shift+P → "Reload Window")
3. TypeScript will automatically detect installed packages

## Next Steps

Once the app is running:

1. ✅ Explore the Home and Expenses pages
2. ✅ Test the view mode switching (Day/Month/Year)
3. ✅ Navigate between dates
4. ✅ Load sample data using the console command
5. ⏳ Future: Add, edit, and delete expenses (coming soon)

## Development Mode Features

While running in development mode (`npm run dev`), you get:

- **Hot Reload**: Changes to code automatically refresh the page
- **Error Overlay**: Clear error messages displayed in the browser
- **Fast Refresh**: React components update without losing state
- **Source Maps**: Original code visible in DevTools for debugging

## Building for Production

When you're ready to create a production build:

```bash
npm run build
npm start
```

The production build:
- Optimizes code for performance
- Enables PWA features (service worker, caching)
- Minimizes file sizes
- Creates static assets

## Learning Resources

- **Project Documentation**: Check files in `/skills` folder
  - `skill.md` - Project overview and architecture
  - `development-guide.md` - Development workflows
  - `quick-reference.md` - Quick command reference

- **External Documentation**:
  - [Next.js Docs](https://nextjs.org/docs)
  - [MUI Components](https://mui.com/material-ui/)
  - [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## Getting Help

If you encounter issues during setup:

1. Check the **Troubleshooting** section above
2. Review `skills/development-guide.md` for common problems
3. Check the terminal output for specific error messages
4. Ensure Node.js version is 18.x or higher: `node --version`

---

**Setup Complete!** You're now ready to develop and extend the Expense Tracker app. Happy coding! 🚀
