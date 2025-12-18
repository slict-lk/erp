# SLICT ERP

A modern, modular, multi-tenant SaaS ERP system built with Next.js, TypeScript, Prisma, and Tailwind CSS. This platform serves as a comprehensive business management solution with specialized applications for various industries and business functions.

## 🚀 Business Overview

SLICT ERP is a complete suite of fully integrated business applications designed to help organizations manage their entire operations. With over 50+ business apps and 20+ AI agents, it provides enterprise-grade functionality with 99.9% uptime SLA and infinite multi-tenancy support.

**Key Business Capabilities:**
- **Sales & CRM**: Lead management, sales pipeline, customer database, quotations
- **Finance & Inventory**: Accounting, stock management, purchasing
- **HR & People**: Employee management, payroll, talent management
- **Industry Solutions**: Healthcare, Education, Restaurant, Hotel, Real Estate
- **Productivity Tools**: Projects, Website, POS, Helpdesk, Live Chat, Automation

**Commercial Model:** User-based pricing starting at $12/user/month with annual discounts available. Start with a 14-day free trial without credit card requirements.

## 📋 Table of Contents

- [Business Overview](#-business-overview)
- [Technical Overview](#-technical-overview)
- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Development Workflow](#development-workflow)
- [Database (Prisma)](#database-prisma)
- [AI / Ollama Integration](#ai--ollama-integration)
- [Testing](#testing)
- [Build & Production](#build--production)
- [Useful npm Scripts](#useful-npm-scripts)
- [Project Layout](#project-layout)
- [Environment Variables](#environment-variables)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## 🛠️ Technical Overview

This repository contains a large, modular ERP application built with modern web technologies:
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes, Prisma ORM, PostgreSQL
- **Architecture**: Multi-tenant SaaS design with modular apps
- **Integrations**: AI/ML (Ollama), payments, email, third-party services
- **Testing**: Jest (unit/integration), Playwright (E2E)

## Prerequisites

- **Node.js 22.x** (project uses `engines.node: 22.x`)
- **pnpm ≥ 8** (recommended) or npm
- **PostgreSQL** (or other Prisma-supported database)
- **Git** for version control
- **Optional**: Ollama for local AI model serving

**Windows (PowerShell) setup:**
```powershell
npm install -g pnpm
