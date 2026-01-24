# Peptide Database

An open source peptide research wiki built with SvelteKit 5. Features 95+ peptides with detailed information on dosing protocols, molecular structures, clinical applications, and safety data.

**Live site**: [peptide-db.com](https://peptide-db.com)

## Features

- **Peptide Database**: 95+ peptides with molecular info, indications, protocols, interactions, and references
- **Dosing Calculators**: Reconstitution calculator, blend calculator, and accumulation plotter
- **Interactive Visualizations**: Amino acid sequence viewer, molecular structures (SMILES), pharmacokinetic charts
- **Guides**: Educational content on peptide research
- **Community Features**: User accounts, discussions, findings submissions (optional, requires Supabase)

## Tech Stack

- **Framework**: SvelteKit 5 (Svelte 5 runes mode)
- **Styling**: Tailwind CSS
- **Charts**: D3.js
- **Database**: Supabase (PostgreSQL + Auth) - optional for community features
- **Deployment**: Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/jabronistore/wiki.git
cd wiki

# Install dependencies
pnpm install

# Start dev server
pnpm dev
```

The core database and calculators work without any configuration. Community features (auth, discussions, user submissions) require Supabase.

### Environment Variables (Optional)

For community features, create `.env.local`:

```
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Then run the migrations in `/supabase/migrations/` against your Supabase project.

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

## Contributing

Contributions are welcome! The peptide data lives in `/data/peptides/` as JSON files. Each file contains:

- Molecular information (weight, sequence, half-life)
- Indications by body system
- Delivery methods and protocols
- Interactions with other peptides
- Side effects and contraindications
- Scientific references

## License

MIT
