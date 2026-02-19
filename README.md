# Matrixa - Study Smart, Stay Focused

<div align="center">

![Matrixa Logo](public/logo.svg)

**The ultimate study companion for Egyptian high school students**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

[Features](#features) • [Demo](#demo) • [Installation](#installation) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

---

## Overview

Matrixa is a production-ready SaaS platform designed specifically for Egyptian high school (Thanaweya Amma) students. It helps students overcome ADHD time blindness, plan their studies effectively, and achieve academic success through a calm, structured, and distraction-free environment.

### Key Highlights

- 🎯 **ADHD-Friendly Design** - Built for students who struggle with focus and time management
- 🌙 **Dark Mode First** - Calming dark theme designed to reduce visual overwhelm with light mode toggle
- 🔄 **RTL Support** - Full Arabic language support with right-to-left layout
- 📱 **Mobile-First** - Responsive design that works beautifully on all devices
- 🔐 **Enterprise Security** - JWT authentication with device fingerprinting, rate limiting
- 🛡️ **Comprehensive Admin** - Full system control with audit logs, impersonation, maintenance mode

---

## Features

### Core Features

| Feature | Description |
|---------|-------------|
| 🎯 **Focus Mode** | Pomodoro-style timer with brain dump, progress markers (video/questions/revision), and session history |
| 📚 **Subjects Hub** | Track progress across all subjects with hierarchical curriculum (Branch → Subject → Unit → Lesson) |
| 📅 **Weekly Planner** | Drag-and-drop task scheduling with day-by-day view and task management |
| 📝 **Notes System** | Organized notes linked to subjects and lessons with search, folders, tags, templates, and filtering |
| 📊 **Insights** | Progress analytics, study time tracking, and weak area identification |
| 🔥 **Streak System** | Daily motivation with streak tracking and visual indicators |
| 🏆 **Leaderboard** | Friendly competition with peers (opt-in) |
| 🎖️ **Badges** | Gamification with achievements, progress tracking, and XP rewards |
| 📖 **Private Lessons** | Schedule management for external lessons at centers (سناتر) |

### Admin Features

| Feature | Description |
|---------|-------------|
| 👥 **User Management** | View, edit, ban users; manage subscriptions; reset passwords; impersonate users |
| 📚 **Curriculum Management** | CRUD operations for branches, subjects, units, lessons; Import/Export (XLSX, CSV, JSON) |
| 🎫 **Invite System** | Create and manage invite codes with usage tracking |
| ⚙️ **System Settings** | Feature flags, subscription controls, trial configuration, subscription expiration, feature limits |
| 📈 **Analytics** | User lifecycle, revenue, engagement metrics with DAU/WAU/MAU |
| 📝 **Audit Logs** | Complete action tracking with IP addresses and changes |
| 📢 **Announcements** | Create and manage system announcements with scheduling |
| 🏆 **Leaderboard Mgmt** | Toggle student visibility, reset scores |
| 🎖️ **Badges Mgmt** | Create and manage achievement badges |
| 🔥 **Streak Management** | View, edit, reset user streaks |
| 🛠️ **Maintenance Mode** | Toggle maintenance mode; admins still have access |
| 🔐 **Test Mode** | Toggle payment test mode for development |
| 📧 **Email Tool** | Create templates, send emails, track delivery logs |
| ⏰ **Expiration Control** | Configure grace period, sign-in restrictions, feature limits |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| [Next.js 15](https://nextjs.org/) | React framework with App Router |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS 4](https://tailwindcss.com/) | Styling |
| [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Lucide Icons](https://lucide.dev/) | Icon library |
| [React Query](https://tanstack.com/query) | Server state management |
| [Zustand](https://zustand-demo.pmnd.rs/) | Client state management |
| [@dnd-kit](https://dndkit.com/) | Drag and drop |

### Backend

| Technology | Purpose |
|------------|---------|
| [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) | Server endpoints |
| [Prisma 6](https://www.prisma.io/) | ORM and database toolkit |
| [JWT (jose)](https://github.com/panva/jose) | Authentication tokens |
| [bcryptjs](https://github.com/dcodeIO/bcrypt.js) | Password hashing |
| [Zod](https://zod.dev/) | Input validation |

### Database

| Environment | Database |
|-------------|----------|
| Development | SQLite |
| Production | PostgreSQL (recommended) |

---

## Installation

### Prerequisites

- **Node.js** 18+ or **Bun** runtime
- **npm**, **yarn**, **pnpm**, or **bun** package manager

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd matrixa

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env

# Initialize database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="file:./dev.db"

# JWT Secrets (generate secure 32+ character strings)
JWT_ACCESS_SECRET="your-access-secret-key-min-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-key-min-32-characters"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="Matrixa"

# Payment (Paymob - optional for development)
PAYMOB_API_KEY=""
PAYMOB_INTEGRATION_ID=""
PAYMOB_IFRAME_ID=""
PAYMOB_HMAC_SECRET=""
```

### Default Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@matrixa.com | Admin123!@# |
| Test Invite Code | - | WELCOME2024 |

---

## Development Commands

```bash
# Development
bun run dev          # Start development server on port 3000

# Database
bun run db:push      # Push schema changes to database
bun run db:generate  # Generate Prisma client
bun run db:migrate   # Create and apply migrations
bun run db:reset     # Reset database and reseed
bun run db:seed      # Seed initial data

# Quality
bun run lint         # Run ESLint
bun run build        # Build for production
bun run start        # Start production server
```

---

## Project Structure

```
matrixa/
├── 📁 prisma/
│   ├── schema.prisma     # Database models and relations
│   └── seed.ts           # Initial data seeding script
├── 📁 public/
│   ├── manifest.json     # PWA manifest
│   ├── logo.svg          # Application logo
│   └── icons/            # App icons for PWA
├── 📁 src/
│   ├── 📁 app/           # Next.js App Router pages
│   │   ├── 📁 api/       # API route handlers
│   │   ├── 📁 admin/     # Admin panel pages
│   │   ├── 📁 auth/      # Authentication pages
│   │   ├── 📁 dashboard/ # Student dashboard
│   │   ├── 📁 focus/     # Focus mode pages
│   │   ├── 📁 insights/  # Analytics page
│   │   ├── 📁 notes/     # Notes management
│   │   ├── 📁 planner/   # Weekly planner
│   │   ├── 📁 subjects/  # Subjects hub
│   │   └── 📁 settings/  # User settings
│   ├── 📁 components/
│   │   ├── 📁 ui/        # shadcn/ui components
│   │   ├── 📁 tasks/     # Task-related components
│   │   ├── 📁 notes/     # Notes-related components
│   │   └── 📁 focus/     # Focus mode components
│   ├── 📁 hooks/         # Custom React hooks
│   ├── 📁 lib/           # Utility libraries
│   │   ├── auth.ts       # Authentication logic
│   │   ├── auth-edge.ts  # Edge-compatible auth
│   │   ├── db.ts         # Prisma client
│   │   └── subscription.ts # Subscription helpers
│   └── 📁 types/         # TypeScript definitions
├── 📄 PROJECT_BRAIN.md   # Product documentation
├── 📄 FEATURES_CHECKLIST.md # Feature tracking
└── 📄 worklog.md         # Development history
```

---

## User Roles

### Student

- Access dashboard and study tools
- Manage personal tasks and notes
- Track progress and streaks
- Participate in leaderboard (opt-in)
- Manage private lessons schedule

### Admin

- Full system access
- Manage users and subscriptions
- Control curriculum content
- Configure system settings
- Create and manage invite codes
- View analytics and reports

---

## Documentation

| Document | Description |
|----------|-------------|
| [PROJECT_BRAIN.md](PROJECT_BRAIN.md) | Product identity, rules, and architecture |
| [docs/SETUP.md](docs/SETUP.md) | Detailed setup and installation guide |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flow |
| [docs/API.md](docs/API.md) | API endpoint documentation |
| [docs/EXTENDING.md](docs/EXTENDING.md) | Development and extension guide |
| [FEATURES_CHECKLIST.md](FEATURES_CHECKLIST.md) | Feature implementation status |

---

## Deployment

### Production Checklist

- [ ] Set secure JWT secrets (32+ characters)
- [ ] Configure PostgreSQL database
- [ ] Set up Paymob payment integration
- [ ] Configure email notifications (future)
- [ ] Set up monitoring and logging
- [ ] Configure CDN for static assets
- [ ] Enable HTTPS

### Docker Deployment

```bash
# Build the application
bun run build

# Start production server
bun run start
```

### Environment Variables (Production)

```env
DATABASE_URL="postgresql://user:password@host:5432/matrixa"
JWT_ACCESS_SECRET="production-secret-32+chars"
JWT_REFRESH_SECRET="production-refresh-secret-32+chars"
NEXT_PUBLIC_APP_URL="https://matrixa.com"
NODE_ENV="production"
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add comments for complex logic
- Update documentation for new features
- Run `bun run lint` before committing

### Commit Convention

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

---

## Roadmap

### Phase 1: Core Features ✅
- [x] Authentication system with JWT and rate limiting
- [x] Student onboarding (8 steps)
- [x] Dashboard and subjects
- [x] Focus mode with Pomodoro timer
- [x] Notes system with Rich Text Editor (TipTap)
- [x] Weekly planner with drag-and-drop
- [x] Task CRUD with drag-and-drop
- [x] Private lessons management
- [x] Subscription system with trial
- [x] Leaderboard system

### Phase 2: Admin & Enterprise ✅
- [x] Comprehensive admin panel
- [x] User impersonation with audit trail
- [x] Curriculum import/export (XLSX, CSV, JSON)
- [x] Advanced analytics with charts
- [x] Audit logs for all admin actions
- [x] Announcement system
- [x] Maintenance mode
- [x] Test mode for payments
- [x] Error boundaries for all pages
- [x] Privacy Policy & Terms of Service pages
- [x] Forgot password flow
- [x] Subscription expiration system
- [x] Grace period and sign-in restriction
- [x] Feature limits for expired users
- [x] Admin email tool with templates

### Phase 3: Enhancements 🚧
- [ ] Email notifications integration
- [ ] Push notifications (PWA)
- [ ] Mobile app (React Native)

### Phase 4: PWA & Offline 📋
- [x] Full PWA support with manifest
- [x] Service worker for offline
- [ ] Full offline mode with sync

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: [docs/](docs/)
- **Issues**: Create an issue in the repository
- **Email**: support@matrixa.com

---

<div align="center">

**Built with ❤️ for Egyptian students**

</div>
