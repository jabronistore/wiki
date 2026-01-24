# Peptide Database

## Development Commands

**IMPORTANT: Always run `pnpm check` after making changes to verify no TypeScript/Svelte errors exist.**

```bash
# Run type checking - DO THIS AFTER EVERY CHANGE
pnpm check

# Start dev server
pnpm dev

# Build for production
pnpm build
```

## Project Structure

- `/src/routes/` - SvelteKit routes
- `/src/lib/` - Shared components and utilities
- `/data/peptides/` - JSON files for each peptide

## Brand Colors

Use semantic Tailwind classes that map to CSS variables, NOT raw Tailwind colors.

### Primary Palette

| Name         | Hex     | CSS Variable                          | Tailwind Class           |
| ------------ | ------- | ------------------------------------- | ------------------------ |
| Slate Dark   | #191919 | `--background` (dark)                 | `bg-background`          |
| Slate Medium | #262625 | `--primary` (light), `--muted` (dark) | `bg-primary`, `bg-muted` |
| Slate Light  | #40403E | `--border` (dark)                     | `border-border`          |

### Cloud (Muted Text)

| Name         | Hex     | CSS Variable                 | Tailwind Class          |
| ------------ | ------- | ---------------------------- | ----------------------- |
| Cloud Dark   | #666663 | `--muted-foreground` (light) | `text-muted-foreground` |
| Cloud Medium | #91918D | `--muted-foreground` (dark)  | `text-muted-foreground` |
| Cloud Light  | #BFBFBA | -                            | -                       |

### Ivory (Light Backgrounds)

| Name         | Hex     | CSS Variable           | Tailwind Class  |
| ------------ | ------- | ---------------------- | --------------- |
| Ivory Dark   | #E5E4DF | `--border` (light)     | `border-border` |
| Ivory Medium | #F0F0EB | `--muted` (light)      | `bg-muted`      |
| Ivory Light  | #FAFAF7 | `--background` (light) | `bg-background` |

### Warm Neutrals (Accents)

| Name       | Hex     | CSS Variable | Tailwind Class             |
| ---------- | ------- | ------------ | -------------------------- |
| Book Cloth | #CC785C | `--accent`   | `bg-accent`, `text-accent` |
| Kraft      | #D4A27F | `--warning`  | `bg-warning`               |
| Manilla    | #EBDBBC | -            | -                          |

### Utility Colors

| Name  | Hex     | CSS Variable    | Tailwind Class                       |
| ----- | ------- | --------------- | ------------------------------------ |
| Black | #000000 | -               | `bg-black`                           |
| White | #FFFFFF | -               | `bg-white`                           |
| Focus | #61AAF2 | `--ring`        | `ring-ring`                          |
| Error | #BF4D43 | `--destructive` | `bg-destructive`, `text-destructive` |

### Usage Guidelines

- **DO**: Use `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `bg-accent`, `border-border`
- **DON'T**: Use raw Tailwind colors like `bg-blue-500`, `text-emerald-700`, `bg-rose-100`
- Category badges should use brand-derived colors, not default Tailwind palette

## Svelte 5 Notes

This project uses Svelte 5 with runes mode. Key differences from Svelte 4:

1. Use `$state()`, `$derived()`, `$props()` instead of reactive declarations
2. Use `{@render children()}` instead of `<slot />`
3. `{@const}` must be inside block elements like `{#each}`, `{#if}`, etc - NOT inside regular HTML elements
4. Components are dynamic by default - no need for `<svelte:component>`
5. Use `$props()` instead of `export let`

## Guide Content Guidelines

When writing guides (`/src/guides/*.md`), follow these brand guidelines:

1. **Always include a summary** - Start with a brief overview/summary of what the guide covers
2. **Internal linking** - Link to related peptide pages (`/peptides/[slug]`), other guides, and tools (calculator, etc.) where relevant
3. **Natural tone** - Be informative but conversational. Don't write like an AI - use a natural, human voice
4. **Custom interactive elements** - Don't be afraid to enhance guides with custom Svelte components:
   - `SequenceViewer` for amino acid sequences
   - Calculator embeds for dosing examples
   - Custom comparison tables
   - Interactive diagrams where they add value
5. **Comprehensive frontmatter** - Include all metadata fields (see `/src/lib/types.ts` Guide interface):
   - title, description, date, lastUpdated
   - author, authorBio, authorImage, authorUrl
   - category, difficulty, readingTime, tags
   - image, imageAlt, keywords, canonical
   - relatedPeptides, relatedGuides
