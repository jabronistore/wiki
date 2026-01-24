# Peptide Database

A comprehensive peptide research database and wiki built with SvelteKit 5. Features 95+ peptides with detailed information on dosing protocols, molecular structures, clinical applications, and safety data.

## Features

- **Peptide Database**: 95+ peptides with molecular info, indications, protocols, interactions, and references
- **Dosing Calculators**: Reconstitution calculator, blend calculator, and accumulation plotter
- **Interactive Visualizations**: Amino acid sequence viewer, molecular structures (SMILES), pharmacokinetic charts
- **Guides**: Educational content on peptide research
- **Community Features**: User accounts, discussions, findings submissions (requires Supabase)

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes mode)
- **Styling**: Tailwind CSS
- **Charts**: D3.js
- **Database**: Supabase (PostgreSQL + Auth)
- **Deployment**: Cloudflare Workers

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/peptide-db.git
cd peptide-db

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Community features require a Supabase project. The core database and calculators work without it.

## Development

```bash
# Start dev server
pnpm dev

# Type checking (run after changes)
pnpm check

# Build for production
pnpm build

# Format code
pnpm format
```

## Project Structure

```
├── data/peptides/     # JSON files for each peptide
├── src/
│   ├── lib/           # Shared components and utilities
│   ├── routes/        # SvelteKit routes
│   └── guides/        # Markdown guide content
├── static/            # Static assets
└── supabase/          # Database migrations
```

## Data

Peptide data is stored as JSON files in `/data/peptides/`. Each file contains:

- Molecular information (weight, sequence, half-life)
- Indications by body system
- Delivery methods and protocols
- Interactions with other peptides
- Side effects and contraindications
- Scientific references

## License

MIT
