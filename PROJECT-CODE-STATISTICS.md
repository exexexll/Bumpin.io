PROJECT CODE STATISTICS
========================

Counting all source code files...

## By Directory

### Frontend (app/)
- Pages: TypeScript React (.tsx)
- Total files in app/: $(find app -name "*.tsx" | wc -l)
- Total lines in app/: $(find app -name "*.tsx" | xargs wc -l | tail -1)

### Components
- React components (.tsx)
- Total files in components/: $(find components -name "*.tsx" | wc -l)
- Total lines in components/: $(find components -name "*.tsx" | xargs wc -l | tail -1)

### Backend (server/src/)
- API routes and logic (.ts)
- Total files in server/src/: $(find server/src -name "*.ts" | wc -l)
- Total lines in server/src/: $(find server/src -name "*.ts" | xargs wc -l | tail -1)

### Libraries (lib/)
- Utility functions (.ts)
- Total files in lib/: $(find lib -name "*.ts" | wc -l)
- Total lines in lib/: $(find lib -name "*.ts" | xargs wc -l | tail -1)

## Total Project
- All TypeScript/JavaScript source files
- Excluding: node_modules, .next, build files, config files
