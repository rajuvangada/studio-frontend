# GK Digital Studios — Client Portal & Admin Management System

A state-of-the-art, responsive web application for **GK Digital Studios**, built with **React 19**, **TypeScript**, **TanStack Router**, **TanStack Query**, and **Tailwind CSS v4**. 

This repository contains the **Frontend Single-Page Application (SPA)**, providing a public studio showcase, a private client selection portal with passcode authorization, and a comprehensive Admin Studio Management Dashboard.

---

## 🌟 Key Highlights & Features

### 🏛️ 1. Public Studio Website
- **Cinematic Portfolio Showcase**: High-resolution gallery organized by categories (*Wedding, Pre-Wedding, Portrait, Event, Commercial*) with full lightbox modal previews.
- **Service Offering & Pricing Cards**: Comprehensive breakdown of studio packages and booking options.
- **About Studio & Owner Profile**: Dynamic studio biography, owner profile photo integration, and business values.
- **Interactive Contact Hub**: One-click direct actions for Phone (`tel:`), Email (`mailto:`), Instagram, and Google Maps venue navigation.
- **Instant WhatsApp Booking**: Floating and contextual CTA buttons pre-filled with inquiry messages.

### 🔐 2. Private Client Gallery Portal (`/gallery/$token`)
- **Passcode Authentication**: Secured client access with tokenized URL paths and encrypted passcode validation.
- **Photo & Video Selection**: High-speed photo and HTML5 video grid allowing clients to select their favorite shots for album retouching.
- **Notes & Instructions**: Clients can append custom notes/instructions to their selections before final submission.
- **Full-Screen Lightbox Viewer**: Keyboard-navigable (`ArrowLeft`, `ArrowRight`, `Escape`) media player and lightbox.

### 📊 3. Admin Studio Management Dashboard (`/admin/*`)
- **Secure Admin Authentication**: JWT session handling with protected route guards (`_authenticated`).
- **Studio Overview Snapshot**: Real-time counters for active projects, new inquiries, total clients, and published showcase items.
- **Human-Friendly Activity Feed**: Business-oriented event logging system detailing client submissions, project creation, and gallery publications without technical noise.
- **Client Workspace**:
  - **Project & Credentials**: Manage client profiles, generate/rotate gallery passcodes, and generate instant WhatsApp share links.
  - **Gallery Publishing**: Toggle live/draft publication status for client portals.
  - **Resilient S3 Media Uploads**: Integrated direct S3 presigned PUT for images and S3 Presigned Multipart Uploads for large 4K/8K video files (**up to 1TB**) with real-time transfer speed (`MB/s`), remaining time estimation, concurrent worker pools, and Pause / Resume / Cancel controls.
  - **Submissions Manager**: View client-selected photo and video packages with submitted notes and Large Media Preview modals (`object-contain`).
  - **Activity Timeline**: Scoped activity audit trail per client project.
- **Content Management**:
  - **Portfolio Manager**: Add, edit, publish, or reorder showcase portfolio items.
  - **Services Manager**: Manage studio service packages and pricing tiers.
  - **Inquiries Inbox**: Review and manage client booking requests.
  - **Studio Profile Settings**: Update logo, owner photo, business hours, and contact details.

---

## 🛠️ Technology Stack

| Domain | Technology / Library |
| :--- | :--- |
| **Core Framework** | [React 19](https://react.dev/) + [TypeScript 5](https://www.typescriptlang.org/) |
| **Routing** | [TanStack Router](https://tanstack.com/router) *(Type-safe file-based routing)* |
| **Build System** | [Vite 8](https://vitejs.dev/) + TSConfig Paths |
| **State & Data Fetching** | [TanStack React Query v5](https://tanstack.com/query) + [Zustand v5](https://zustand-demo.pmnd.rs/) |
| **Styling & Design** | [Tailwind CSS v4](https://tailwindcss.com/) + [Radix UI Primitives](https://www.radix-ui.com/) |
| **Animations & Icons** | [Framer Motion](https://www.framer.com/motion/) + [Lucide React](https://lucide.dev/) |
| **Form & Validation** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **UI Notifications** | [Sonner](https://sonner.emilkowal.ski/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 📁 Project Architecture

```
frontend/
├── public/                     # Static assets and icons
├── src/
│   ├── components/             # Reusable UI components & Radix wrappers
│   │   ├── ui/                 # Buttons, inputs, dialogs, badges, cards
│   │   ├── SiteLayout.tsx      # Public website layout (Navbar + Footer)
│   │   ├── ThemeToggle.tsx     # Light/Dark mode switcher
│   │   └── WhatsAppButton.tsx  # Floating WhatsApp action button
│   ├── lib/                    # Utilities and API clients
│   │   ├── api.ts              # Fetch wrapper, S3 upload logic, API interfaces
│   │   ├── studio.ts           # Business helpers, date formatters, activity formatters
│   │   └── utils.ts            # Class name merger (clsx + tailwind-merge)
│   ├── routes/                 # TanStack Router file-based routes
│   │   ├── __root.tsx          # Root app container & layout wrapper
│   │   ├── index.tsx           # Homepage route
│   │   ├── about.tsx           # About Studio route
│   │   ├── portfolio.tsx       # Portfolio Showcase route
│   │   ├── services.tsx        # Services & Pricing route
│   │   ├── contact.tsx         # Contact Us route
│   │   ├── gallery.$token.tsx  # Client Private Gallery Portal route
│   │   ├── auth.tsx            # Admin Login route
│   │   ├── client-login.tsx    # Client Portal Passcode Entry route
│   │   └── _authenticated/     # Protected Admin Routes
│   │       ├── route.tsx       # Authentication Guard Layout
│   │       ├── admin.index.tsx # Admin Dashboard Overview
│   │       ├── admin.clients.index.tsx  # Client Directory
│   │       ├── admin.clients.$id.tsx    # Client Workspace & Upload Manager
│   │       ├── admin.portfolio.tsx      # Portfolio Showcase CRUD
│   │       ├── admin.services.tsx       # Services & Packages CRUD
│   │       ├── admin.inquiries.tsx      # Inquiries Inbox
│   │       └── admin.profile.tsx        # Studio Settings & Profile
│   ├── main.tsx                # App entrypoint & React Query provider setup
│   └── styles.css              # Global styles & Tailwind CSS v4 setup
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **Backend API**: Running instance of the `studio-backend` REST API.

### 1. Installation
Clone the repository and navigate into the `frontend` directory:
```bash
git clone https://github.com/rajuvangada/studio-frontend.git
cd studio-frontend
```

Install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` or `.env.local` file in the root of the `frontend` folder:
```env
# URL of your Express API Server
VITE_API_URL=http://localhost:4000
```
*For production builds, set `VITE_API_URL=https://gkstudio.duckdns.org`.*

### 3. Development Server
Launch the Vite local development server:
```bash
npm run dev
```
Open your browser and navigate to `http://localhost:5173`.

---

## 📜 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite dev` | Starts the local development server with hot module replacement (HMR). |
| `npm run build` | `vite build` | Compiles production-ready static bundle into the `dist/` folder. |
| `npm run preview` | `vite preview` | Previews the compiled production bundle locally. |
| `npm run typecheck` | `tsc --noEmit` | Performs static TypeScript type checking across all components. |
| `npm run lint` | `eslint .` | Runs ESLint checks for code quality and style compliance. |
| `npm run format` | `prettier --write .` | Formats all source files using Prettier rules. |

---

## 🔐 Security & Best Practices

1. **Protected Route Guards**: All `/admin/*` routes are encapsulated within `_authenticated/route.tsx`, ensuring unauthenticated users are redirected to `/auth`.
2. **Type-Safe Navigation**: TanStack Router validates all route parameters, search queries, and dynamic paths at compile time.
3. **Optimistic Updates & Query Invalidation**: React Query manages cached state, automatically invalidating stale queries upon mutation completion.
4. **Resilient Direct S3 Uploads**: Files are uploaded directly from the browser to AWS S3 using presigned URLs and multipart presigned upload signatures, completely bypassing backend payload bottlenecks.

---

## 📄 License
This project is proprietary software developed exclusively for **GK Digital Studios**. All rights reserved.
