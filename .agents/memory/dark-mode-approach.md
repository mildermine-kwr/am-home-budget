---
name: Dark Mode implementation approach
description: How dark mode was implemented in AM Home Budget v2 (App.jsx + styles.css)
---

## Approach
Two-layer system: CSS variables for sub-components (outside App fn) + inline `C` color object for components inside App fn.

## C color object
Defined inside the App function just before `return (`, keyed by semantic name. `isDark` computed from `theme === "dark" || (theme === "system" && systemDark)`. Theme stored in localStorage key `"theme"`.

## CSS variables
All defined in `styles.css` under `:root` (light) and `[data-theme="dark"]`. Applied to `document.documentElement` via `data-theme` attribute in a `useEffect`.

## Sub-components (outside App fn)
SummaryCard, TabButton, FilterButton, TH, TD, Field, BahtInput (฿ span), CustomSelect dropdown, fieldStyle constant — all use `var(--xxx)` CSS vars since they can't access `C` or `isDark`.

## Key CSS vars used by sub-components
`--card-bg`, `--card-border`, `--card-amount-color`, `--field-label`, `--tab-active-bg`, `--tab-active-color`, `--tab-inactive-color`, `--filter-active-bg`, `--filter-active-color`, `--filter-inactive-bg`, `--filter-border`, `--input-bg`, `--input-color`, `--dropdown-bg`, `--dropdown-border`, `--dropdown-color`, `--td-bg`, `--td-border`, `--th-bg`

**Why:** Sub-components are module-level functions and can't access React state/context. CSS vars are the only way to theme them without refactoring them into the App function.
