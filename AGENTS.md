# AI Agent Instructions

## Knowledge Base

This project uses an **in-app documentation system** (F46). All project knowledge is organized in `/public/docs/` with metadata in `/docs/index.json`.

### Quick Reference for AI Agents

**To understand the project:**
1. Read `/docs/index.json` to see all available documentation
2. Start with `/docs/developer/architecture.md` for system overview
3. Check `/docs/changelog/v2.0.0.md` for latest features
4. Review `CLAUDE.md` for detailed development guidelines

**To answer user questions:**
- User guides: `/docs/user-guide/`
- Reference material: `/docs/reference/`
- Examples: `/docs/changelog/` for feature demonstrations

**To work on development tasks:**
- Architecture: `/docs/developer/architecture.md`
- Testing: `/docs/developer/testing.md`
- Contributing: `/docs/developer/contributing.md`
- API: `/docs/developer/api-reference.md`

## Documentation Structure

```
/public/docs/
├── index.json                 # Master catalog with metadata
├── user-guide/
│   ├── getting-started.md     # Quick start guide
│   ├── parameters.md          # Parameter system
│   ├── functions.md           # Function plotting
│   ├── timeline.md            # Animation & keyframes
│   └── export.md              # Export options
├── reference/
│   ├── expression-syntax.md   # Math expression syntax
│   ├── keyboard-shortcuts.md  # Shortcuts reference
│   ├── config-system.md       # Configuration architecture
│   └── file-formats.md        # File format specs
├── developer/
│   ├── architecture.md        # System architecture
│   ├── testing.md             # Testing guide
│   ├── contributing.md        # Contribution guidelines
│   └── api-reference.md       # TypeScript APIs
└── changelog/
    ├── v1.0.0.md             # MVP release notes
    ├── v2.0.0.md             # Latest release (P1+F20)
    └── roadmap.md            # Future features
```

## Document Metadata

Each document in `index.json` includes:
- **id**: Unique identifier
- **title**: Human-readable title
- **file**: Path to markdown file
- **description**: Brief summary
- **tags**: Keywords for searchability
- **order**: Display order within category

### Example Entry

```json
{
  "id": "getting-started",
  "title": "Getting Started",
  "file": "user-guide/getting-started.md",
  "description": "Quick start guide and basic concepts",
  "tags": ["basics", "tutorial", "intro"],
  "order": 1
}
```

## AI Agent Workflow

### For Understanding Features

1. Check `docs/index.json` to find relevant documents by **tags**
2. Read the document(s) from `/docs/{category}/{file}`
3. Cross-reference with `CLAUDE.md` for implementation details

### For Answering Questions

1. Search `docs/index.json` by title/tags/description
2. Load the markdown content
3. Provide answer with reference to the doc

### For Development Tasks

1. Review `docs/developer/architecture.md` first
2. Check `docs/developer/testing.md` for test requirements
3. Follow guidelines in `CLAUDE.md`
4. Update relevant docs after making changes

## Core Principles (from architecture.md)

1. **Zero hard-coded values** - All constants in JSON config
2. **DRY always** - Extract shared logic immediately
3. **Type-safe** - Use TypeScript interfaces
4. **60 FPS target** - Performance is non-negotiable
5. **Configuration-driven** - Everything must be configurable

## Current Status (v2.0.0)

**Completed Features:**
- ✅ MVP (Phases 1-8): Parameters, functions, keyframes, import/export
- ✅ P1: Coordinate Point/List Plotting
- ✅ F20: Implicit Function Plotting
- ✅ F46: In-app documentation system

**In Progress:**
- Phase 1 remaining: F4 (Complex Numbers), P7 (Multi-Value), Q2 (Coloring), P12 (Gradients)

See `/docs/changelog/roadmap.md` for full roadmap.

## Testing

- **140 tests** currently passing
- Unit tests for core logic
- Integration tests for workflows
- Run: `npm run test:run`

See `/docs/developer/testing.md` for details.

## Common Tasks for AI Agents

### Task: Find Documentation on Feature X

```bash
# 1. Check index
cat public/docs/index.json | grep -i "feature_keyword"

# 2. Read the document
cat public/docs/{category}/{file}.md
```

### Task: Update Documentation

```bash
# 1. Edit the markdown file
# 2. Update docs/index.json if metadata changed
# 3. Test in app: visit http://localhost:3000/docs
```

### Task: Add New Feature

```bash
# 1. Review architecture.md for patterns
# 2. Check contributing.md for workflow
# 3. Follow CLAUDE.md guidelines
# 4. Write tests (testing.md)
# 5. Update relevant docs
# 6. Update changelog
```

## Access in App

Users and AI agents can access docs at:
- URL: `http://localhost:3000/docs`
- Button: "📖 Docs" in app header
- Navigation: Sidebar with categories and search

## Maintenance

When adding new features:
1. ✅ Create/update markdown docs in appropriate category
2. ✅ Add entry to `docs/index.json` with metadata
3. ✅ Update changelog
4. ✅ Reference in CLAUDE.md if architectural
5. ✅ Update AGENTS.md if affects AI workflow

---

**For AI Agents**: This knowledge base is your primary source of truth. Always check `/docs/` before asking the user or making assumptions about the project.
