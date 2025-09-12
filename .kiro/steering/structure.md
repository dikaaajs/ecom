# Project Structure & Organization

## Directory Layout

```
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── product/           # Product-related pages
│   ├── layout.tsx         # Root layout component
│   ├── page.tsx           # Homepage
│   ├── globals.css        # Global styles
│   └── dummy.ts           # Mock data
├── components/            # Reusable React components
│   ├── stack/            # Custom application components
│   └── ui/               # shadcn/ui components
├── lib/                  # Utility functions and configurations
│   └── utils.ts          # Common utilities (cn function)
├── public/               # Static assets
│   ├── font/            # Font files
│   └── product/         # Product images
└── .kiro/               # Kiro AI assistant configuration
    └── steering/        # AI guidance documents
```

## Naming Conventions

### Files & Folders
- **kebab-case** for folders: `product-card`, `user-profile`
- **PascalCase** for React components: `ProductCard.tsx`, `UserProfile.tsx`
- **camelCase** for utilities: `utils.ts`, `apiHelpers.ts`

### Components
- Use descriptive, noun-based names: `ProductCard`, `NavigationMenu`
- Prefix UI components with their type: `Button`, `Dialog`, `Accordion`
- Group related components in folders: `components/stack/`, `components/ui/`

## Import Patterns

### Path Aliases
- Use `@/` for all internal imports
- `@/components` for component imports
- `@/lib` for utilities
- `@/app` for page-level imports

### Import Order
1. External libraries (React, Next.js, etc.)
2. Internal components (`@/components`)
3. Utilities (`@/lib`)
4. Types and interfaces
5. Relative imports

## Component Architecture

### UI Components (`components/ui/`)
- shadcn/ui components
- Reusable, unstyled primitives
- Follow Radix UI patterns

### Stack Components (`components/stack/`)
- Application-specific components
- Business logic components
- Composed UI elements

### Page Components (`app/`)
- Next.js App Router pages
- Client components marked with `"use client"`
- Server components by default

## Styling Guidelines

### Tailwind Classes
- Use `cn()` utility for conditional classes
- Prefer Tailwind utilities over custom CSS
- Use CSS variables for theme colors
- Follow mobile-first responsive design

### Component Variants
- Use `class-variance-authority` for component variants
- Define variants in component files
- Keep styling logic close to components