# System Architecture

This document provides a comprehensive overview of the Guttakrutt Guild Website system architecture, focusing on the major components and their interactions.

## Architecture Overview

The Guttakrutt Guild Website is built using a modern web application architecture with a clear separation of concerns:

```
┌─────────────────┐    ┌───────────────────┐    ┌─────────────────┐
│                 │    │                   │    │                 │
│  React Frontend │◄───┤  Express Backend  │◄───┤  Data Sources   │
│                 │    │                   │    │                 │
└─────────────────┘    └───────────────────┘    └─────────────────┘
        ▲                       ▲                        ▲
        │                       │                        │
  User Interface          API Endpoints            Data Storage &
    Components             & Business              External APIs
                             Logic
```

## 1. Frontend Architecture

The frontend is built with React and TypeScript, utilizing a component-based architecture for maximum reusability.

### Key Components

- **Page Components**: Top-level components representing full pages (Home, Roster, Raids, etc.)
- **Feature Components**: Specialized components for specific functionality (CharacterList, RaidProgress, etc.)
- **UI Components**: Reusable UI elements following shadcn/ui patterns
- **State Management**: TanStack Query for server state, React Context for global application state

### Internationalization

- Implemented using i18next with namespaces for different sections
- Language switching is session-preserved
- Supports English and Norwegian with automatic detection

### Styling

- TailwindCSS for utility-first styling
- Custom WoW-themed components with appropriate class colors
- Responsive design with mobile, tablet, and desktop breakpoints

## 2. Backend Architecture

The backend follows an API-based architecture with Express.js, providing both REST endpoints and specialized simulation endpoints for production compatibility.

### API Layer

- **REST API**: Standard JSON endpoints under `/api/` routes
- **PHP Simulation**: Special routing under root path that simulates PHP endpoints for production compatibility
- **Battle.net Integration**: OAuth 2.0 authentication and API access
- **Authentication**: Session-based authentication with support for direct, passport, and PHP-simulated auth

### Storage Layer

- **Database Abstraction**: IStorage interface with multiple implementations
- **Cross-Database Support**: Specialized implementations for PostgreSQL and MySQL
- **Data Access Patterns**: Repository pattern with data transformation

## 3. Authentication System

The application implements a comprehensive authentication system with multiple methods to ensure cross-platform compatibility.

### Authentication Methods

1. **Passport.js Authentication**: Standard session-based authentication with session store
2. **Direct Authentication**: PHP-compatible direct authentication for production
3. **Battle.net OAuth**: Integration with Battle.net for account linking
4. **Cross-Session Authentication**: Cookie-based authentication for PHP compatibility

### Authentication Flow

```
┌──────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│          │     │            │     │            │     │            │
│  Login   │────►│  Validate  │────►│  Create    │────►│  Redirect  │
│  Request │     │  Credentials│     │  Session   │     │  to App    │
│          │     │            │     │            │     │            │
└──────────┘     └────────────┘     └────────────┘     └────────────┘
```

### Security Features

- **Password Hashing**: Secure hashing using Node.js crypto scrypt
- **CSRF Protection**: Token-based Cross-Site Request Forgery protection
- **Session Management**: Secure session handling with proper timeout
- **Role-Based Access**: Admin, member, and user role distinctions

## 4. Battle.net Integration

The application integrates deeply with Battle.net's OAuth and API systems for character data and authentication.

### Authentication Flow

```
┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌────────────┐
│          │     │            │     │             │     │            │
│  Initiate│────►│  Redirect  │────►│  Battle.net │────►│  Callback  │
│  Auth    │     │  to Bnet   │     │  Auth Page  │     │  Processing│
│          │     │            │     │             │     │            │
└──────────┘     └────────────┘     └─────────────┘     └────────────┘
                                                               │
                                                               ▼
┌──────────┐     ┌────────────┐     ┌─────────────┐     ┌────────────┐
│          │     │            │     │             │     │            │
│  Success │◄────│  Store     │◄────│  Fetch      │◄────│  Exchange  │
│  Redirect│     │  User Data │     │  User Info  │     │  Code      │
│          │     │            │     │             │     │            │
└──────────┘     └────────────┘     └─────────────┘     └────────────┘
```

### Required OAuth Scopes

- `openid` - For OpenID Connect authentication
- `wow.profile` - For accessing World of Warcraft character data

### API Integration Points

- **Character Data**: Character details, equipment, talents
- **Account Verification**: Link characters to Battle.net accounts
- **Battle.net Profile**: BattleTag and account ID retrieval
- **Guild Data**: Member lists and character relationships

## 5. Cross-Environment Compatibility

The application is designed to run in both development (PostgreSQL) and production (MySQL) environments with minimal configuration changes.

### Data Access Strategy

```
┌─────────────┐
│             │
│  Application│
│    Logic    │
│             │
└──────┬──────┘
       │
       ▼
┌──────────────┐
│              │
│   IStorage   │
│   Interface  │
│              │
└───────┬──────┘
        │
        ├─────────────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│              │   │              │
│ PostgreSQL   │   │    MySQL     │
│Implementation│   │Implementation│
│              │   │              │
└──────────────┘   └──────────────┘
```

### Environment Detection

- Database type auto-detection via environment variables
- Graceful fallback to simpler queries when necessary
- Cross-platform data transformations

### PHP Simulation Layer

- Routing compatible with production endpoints
- Session compatibility with PHP-based systems
- Cookie handling consistent with PHP implementations

## 6. Data Synchronization

The application maintains data synchronization with external APIs through scheduled updates and on-demand refresh actions.

### Synchronization Flow

```
┌─────────────┐     ┌────────────┐     ┌────────────┐     ┌────────────┐
│             │     │            │     │            │     │            │
│  Scheduled  │────►│  Fetch     │────►│  Transform │────►│  Store     │
│  Trigger    │     │  API Data  │     │  Data      │     │  Data      │
│             │     │            │     │            │     │            │
└─────────────┘     └────────────┘     └────────────┘     └────────────┘
```

### Error Handling

- API rate limit detection and backoff
- Token expiration handling and refresh
- Graceful degradation on API failure

## 7. Troubleshooting and Diagnostics

The application includes comprehensive logging and diagnostic tools to help identify and resolve issues.

### Logging System

- Transaction-based logging with detailed context
- Structured logs with severity levels
- Performance metrics for slow operations

### Diagnostic Endpoints

- API status check endpoints
- Session validation tools
- Database connection tests
- External API connectivity verification

## 8. Production Deployment

The application is designed for deployment on a traditional web hosting environment with MySQL and PHP support.

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                                                 │
│               Shared Hosting Server             │
│                                                 │
│  ┌─────────────┐        ┌─────────────────┐    │
│  │             │        │                 │    │
│  │  MySQL      │◄──────►│  Node.js App    │    │
│  │  Database   │        │  (Express)      │    │
│  │             │        │                 │    │
│  └─────────────┘        └─────────────────┘    │
│                                 ▲               │
│                                 │               │
│                                 ▼               │
│                         ┌─────────────────┐    │
│                         │                 │    │
│                         │  Battle.net API │    │
│                         │  Integration    │    │
│                         │                 │    │
│                         └─────────────────┘    │
│                                                │
└─────────────────────────────────────────────────┘
```

### Server Requirements

- Node.js 18+ runtime environment
- MySQL 8.0+ database server
- HTTPS support for secure OAuth callbacks
- Sufficient memory for API data processing