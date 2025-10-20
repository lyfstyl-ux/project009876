# Every1.fun / Creatorland Platform

## Overview

Every1.fun (branded as "creatorland*") is a Web3 platform that enables content creators and public goods builders to tokenize their digital content and projects as tradeable coins on the Base blockchain. The platform bridges traditional web content with Web3 innovation by allowing users to mint creator coins, trade them on an open marketplace, and earn sustainable passive income through trading fees. The application serves two primary user groups: content creators (writers, musicians, artists, influencers) and public goods builders (RPGF recipients, Gitcoin grantees, open source developers).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React with TypeScript using Vite as the build tool and development server. The UI is built with shadcn/ui component library (Radix UI primitives) and styled with Tailwind CSS.

**Design System**: Modern, crypto-native aesthetic inspired by Web3 platforms (Friend.tech, Lens Protocol) and Gen Z social apps (BeReal, Dispo). Uses a vibrant color palette featuring lime green primary (`89 95% 79%`), vivid magenta secondary (`314 83% 57%`), deep purple dark backgrounds (`270 30% 15%`), with custom Forma DJR Micro typography (currently using Inter as fallback).

**State Management**: TanStack React Query (v5) handles all server state management, API requests, and caching. Local UI state managed with React hooks.

**Routing**: Wouter for client-side routing with pages for home feed, search, profile, content creation, inbox messaging, connections, groups, and daily streaks.

**Component Architecture**: Modular component structure with reusable UI components (`CreatorCard`, `ProjectCard`, `ThemeToggle`) and page-level components. Layout system uses a responsive grid (mobile-first) with bottom navigation on mobile and top header navigation on desktop.

### Backend Architecture

**Server Framework**: Express.js with TypeScript running on Node.js. API follows RESTful conventions with routes organized by resource type (users, projects, coins, messages, connections, groups).

**Authentication Strategy**: Currently using mock authentication with a seeded user for development. Designed to integrate with Privy for Web3 wallet-based authentication (configuration present but not yet implemented). Session management infrastructure prepared with `SESSION_SECRET` environment variable.

**API Design**: Resource-based endpoints following REST patterns:
- `/api/users` - User profile management
- `/api/creators` - Creator discovery and search
- `/api/projects` - Content/project CRUD operations
- `/api/coins` - Token minting and trading
- `/api/messages` - Messaging system
- `/api/connections` - Social connections
- `/api/groups` - Community groups
- `/api/streaks` - Gamification system

**Data Access Layer**: Storage abstraction layer (`server/storage.ts`) provides a clean interface for database operations, separating business logic from data persistence.

### Data Storage

**Database**: PostgreSQL (currently configured with Supabase as the managed provider) accessed via Neon serverless driver with WebSocket support for optimal serverless performance.

**ORM**: Drizzle ORM provides type-safe database queries and schema management. Schema defined in `shared/schema.ts` with full TypeScript type inference.

**Database Schema Design**:
- **users**: Core user profiles with Privy authentication integration fields, wallet addresses, social accounts, creator types, categories, and engagement metrics
- **projects**: Content/campaigns that can be minted as coins, includes IPFS hash storage and view/interaction tracking
- **coins**: Tokenized assets with status tracking (pending/minted), blockchain metadata (address, chain_id, registry_tx_hash)
- **messages**: Direct messaging system with conversation threading
- **connections**: Social graph for creator networking
- **groups**: Community/collaboration groups with membership tracking
- **loginStreaks**: Gamification system tracking daily engagement
- **bookmarks**: User content bookmarking
- **scrapedContent**: Imported content metadata from URLs or file uploads

**Migration Strategy**: Drizzle Kit manages schema migrations with PostgreSQL dialect configuration.

### External Dependencies

**Blockchain Infrastructure**:
- **Base Blockchain**: Primary network for coin minting and trading (Ethereum L2)
- **Zora Protocol**: Token minting and creator coin functionality via Zora API
- **Alchemy**: RPC provider for Base blockchain interaction
- **WalletConnect**: Web3 wallet connection protocol (v2)
- **OnchainKit**: Coinbase's toolkit for onchain features

**Authentication & Identity**:
- **Privy**: Web3 authentication provider for wallet-based login (configured but not yet fully integrated)
- Design allows for email/social login alongside wallet authentication

**File Storage & IPFS**:
- **Pinata**: IPFS pinning service for decentralized content storage
- Stores token metadata, project thumbnails, and user uploads
- Custom gateway configured for content delivery

**Database Hosting**:
- **Supabase**: Managed PostgreSQL database with connection pooling
- Provides both standard connection string and service role key for admin operations

**Communication**:
- **Telegram Bot API**: Notifications and community engagement channel integration

**Development Tools**:
- **Replit Vite Plugins**: Runtime error overlay, cartographer for code navigation, dev banner
- **React Developer Tools**: Component inspection and debugging

**Design & UI**:
- **Tailwind CSS**: Utility-first styling with custom configuration
- **Radix UI**: Accessible component primitives for all interactive elements
- **Recharts**: Data visualization for analytics and metrics
- **Embla Carousel**: Touch-friendly content carousels
- **React Icons**: Icon library (using react-icons/si for social media icons)

**Form Handling**:
- **React Hook Form**: Form state management with performance optimization
- **Zod**: Runtime type validation and schema definition
- **@hookform/resolvers**: Integration layer between React Hook Form and Zod

**API & Network**:
- **TanStack React Query**: Server state management, caching, and synchronization
- Native Fetch API for HTTP requests with credential inclusion for session management

**Type Safety**:
- **TypeScript**: End-to-end type safety across client, server, and shared code
- **Drizzle Zod**: Automatic Zod schema generation from database schema
- Shared types directory for common interfaces used across application boundaries