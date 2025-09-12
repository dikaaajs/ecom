# Technology Stack

## Framework & Runtime
- **Next.js 15.2.2** - React framework with App Router
- **React 18.3.1** - UI library
- **TypeScript 5** - Type-safe JavaScript
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Component library (New York style)
- **Radix UI** - Headless UI primitives
- **Lucide React** - Icon library
- **CSS Variables** - Design tokens for theming
- **Dark mode** support via class strategy

## Key Libraries
- **class-variance-authority** - Component variant management
- **clsx & tailwind-merge** - Conditional styling utilities
- **React Leaflet** - Interactive maps integration
- **Leaflet** - Map functionality

## Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **TypeScript strict mode** - Enhanced type checking

## Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Package Management
```bash
npm install          # Install dependencies
npm install <package> # Add new dependency
```

## Configuration Notes
- Path aliases configured with `@/*` pointing to root
- Image optimization enabled for all remote domains
- Tailwind configured for dark mode with CSS variables
- TypeScript with strict mode and Next.js plugin