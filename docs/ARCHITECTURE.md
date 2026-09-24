# AI-Powered Customer Support Refund System Architecture

## Overview
This system provides controlled, policy-compliant automated evaluation for e-commerce refund requests.

## Component Structure
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + Node.js + TypeScript + Prisma ORM
- **Database**: PostgreSQL
- **Policy Engine**: Deterministic rules evaluator (Hard constraints override LLM outputs)
- **AI Service**: Structured JSON extraction and natural language reasoning support
- **Decision Engine**: Combines hard policy checks with AI risk indicators
- **Audit Service**: Immutable audit logging for transparency and compliance
