# Angular Server Management Table Widget

A fully-featured, production-ready Angular 19+ table widget for server management with advanced filtering, sorting, inline editing, and full accessibility support.

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Testing](#testing)
- [Technical Requirements Compliance](#technical-requirements-compliance)

## Features

### Filter Bar

- **Search Filter**: Full-text search across multiple columns (name, serial, asset) with search history persistence (last 3 searches)
- **Status Filter**: Multi-select checkboxes (Running, Stopped, Maintenance, Error, Pending)
- **Asset Filter**: Multi-select with search functionality within dropdown
- **Hardware Filter**: Multi-select checkboxes
- **Type Filter**: Multi-select checkboxes
- **License Filter**: Multi-select checkboxes
- **Date Filter**: Radio presets (All time, Last 24h, Last 7 days, Last 30 days, Last year, Custom range)
- **More Filters Toggle**: Show/Hide additional filters
- **Clear Filters**: Appears only when filters are active
- **Active State Styling**: Buttons show visual active state (border + background) when filters are applied
- **Badge Counters**: Display count of selected options

### Data Table

- **Sortable Columns**: Click headers to sort (asc/desc), visual indicators
- **Drag & Drop Columns**: Reorder columns with persistence to localStorage
- **Row Selection**: Single, multi-select, and "Select all on page" with indeterminate state
- **Row Hover Effects**: Background change + "More" action button visibility
- **Warning Highlighting**: Rows with `warningsCount > 1` highlighted in orange
- **Horizontal Scrolling**: For responsive layouts
- **Context Menu**: Open Local Admin, Move Server, Connect Remote Services, Advanced Debug Mode

### Inline Editing

- **Double-click to edit**: Server name field
- **Enter to save**: Commits changes
- **Escape to cancel**: Reverts changes
- **Tab to next**: Moves to next editable cell

### Pagination

- **Rows per page selector**: 10, 25, 50, 100
- **Navigation buttons**: Previous/Next with disabled states
- **Total count display**: Shows current range and total

### Persistence

- Column order saved to localStorage
- Search history saved to localStorage (last 3 searches)

## Architecture

```
src/app/
├── components/  # Reusable UI components
│   ├── data-table/  # Data table component with related subcomponents
│   │   ├── table-context-menu/  # Context menu for table rows
│   │   │   └── table-context-menu.component.(ts, css, html)
│   │   ├── table-pagination/  # Pagination controls for the table
│   │   │   └── table-pagination.component.(ts, css, html)
│   │   └── data-table.component.(ts, css, html, spec.ts)  # Main data table component
│   ├── filter-bar/  # Filter bar component for table or lists
│   │   └── filter-bar.component.(ts, css, html, spec.ts)
│   └── table-widget/  # Widget that uses the data table
│       └── table-widget.component.(ts)
│       └── index.ts  # Barrel file to export component
├── features/  # Feature-specific components or pages
│   └── server-management/  # Server management page
│       └── server-management.component.(ts, css, html)
├── models/  # TypeScript models / interfaces
│   ├── action.model.ts  # Action model
│   ├── filter.model.ts  # Filter model
│   ├── server.model.ts  # Server model
│   ├── table.model.ts  # Table model
│   └── index.ts  # Barrel file to export models
├── services/  # Services for API calls, state management, utilities
│   ├── mock-data.service.ts  # Provides mock data for testing
│   ├── storage.service.ts  # Handles local storage or session storage
│   ├── table-action.facade.ts  # Facade for table-related actions
│   └── index.ts  # Barrel file to export services
├── store/  # State management files (e.g., using NgRx or custom store)
│   ├── table-state.store.(ts, spec.ts)  # Table state and tests
│   └── index.ts  # Barrel file to export stores
├── app.component.ts  # Root app component
└── app.config.ts  # App-level configuration

```

### Design Patterns Used

1. **Standalone Components**: All components are standalone for optimal tree-shaking and lazy loading
2. **Signal-based State Management**: Uses Angular 19+ signals for reactive state
3. **Facade Pattern**: `TableActionFacade` abstracts action handling
4. **Repository Pattern**: `StorageService` abstracts localStorage operations
5. **Computed Signals**: Derived state for filtered/sorted data
6. **OnPush Change Detection**: Optimal performance with signal-based updates

## Installation

### Prerequisites

- Node.js 18+
- Angular CLI 19+

### Setup

```bash
# Clone the repository
git clone https://github.com/andaw6/weblib-angular-technical-test.git
cd weblib-angular-technical-test

# Install dependencies
npm install

# Start development server
ng serve
```

### Dependencies

```json
{
  "@angular/core": "^19.1.0",
  "@angular/common": "^19.1.0",
  "@angular/forms": "^19.1.0",
  "@angular/cdk": "^19.1.0",
  "postcss": "^8.5.1",
  "tailwindcss": "^3.4.17",
  "tailwindcss-animate": "^1.0.7"
}
```

## Usage

### Basic Usage

```typescript
import { TableWidgetComponent } from '@lib/table-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TableWidgetComponent],
  template: `
   <app-table-widget 
      (action)="onAction($event)" 
      (edit)="onEdit($event)" 
      (export)="onExport()" 
    />
  `
})
export class AppComponent {

  onAction(event: TableActionEvent): void {}

  onEdit(event: InlineEditEvent): void {}

  onExport(): void {}
}
```

### Column Configuration

```typescript
const columns: ColumnConfig[] = [
  { key: "name", label: "Server Name", sortable: true, editable: true, width: "200px" },
  { key: "serial", label: "Serial Number", sortable: true },
  { key: "status", label: "Status", sortable: true },
  { key: "asset", label: "Asset", sortable: true },
  { key: "hardware", label: "Hardware", sortable: true },
  { key: "type", label: "Type", sortable: true },
  { key: "license", label: "License", sortable: true },
  { key: "warningsCount", label: "Warnings", sortable: true },
  { key: "lastUpdated", label: "Last Updated", sortable: true },
];
```

### Action Configuration

```typescript
const actions: ActionConfig[] = [
  { id: "openAdmin", label: "Open Local Admin", icon: "terminal" },
  { id: "moveServer", label: "Move Server", icon: "move" },
  { id: "connectRemote", label: "Connect Remote Services", icon: "link" },
  { id: "debugMode", label: "Advanced Debug Mode", icon: "bug" },
];
```

## API Reference

### TableStateStore

The central state management store using Angular signals.

#### Signals (Read-only)

- `servers`: All servers
- `filteredServers`: Filtered and sorted servers
- `paginatedServers`: Current page of servers
- `selectedIds`: Set of selected server IDs
- `filters`: Current filter state
- `sortConfig`: Current sort configuration
- `pagination`: Current pagination state
- `columnOrder`: Current column order
- `searchHistory`: Last 3 search queries
- `isFiltersActive`: Whether any filters are applied
- `isAllSelected`: Whether all visible rows are selected
- `isIndeterminate`: Whether selection is partial

#### Methods

- `setServers(servers: Server[])`: Set server data
- `setSearch(query: string)`: Set search query
- `toggleFilter(type: FilterType, value: string)`: Toggle a filter value
- `clearFilters()`: Clear all filters
- `setSort(column: string, direction: SortDirection)`: Set sort configuration
- `setPage(page: number)`: Navigate to page
- `setPageSize(size: number)`: Change page size
- `toggleSelection(id: string)`: Toggle row selection
- `toggleSelectAll()`: Toggle select all
- `updateServer(id: string, updates: Partial<Server>)`: Update server data
- `reorderColumns(from: number, to: number)`: Reorder columns

### FilterBarComponent

#### Inputs

- `@Input() store: TableStateStore` - The state store instance

#### Outputs

- `@Output() filtersChanged` - Emitted when filters change

### DataTableComponent

#### Inputs

- `@Input() store: TableStateStore` - The state store instance
- `@Input() columns: ColumnConfig[]` - Column configuration
- `@Input() actions: ActionConfig[]` - Row action configuration

#### Outputs

- `@Output() rowAction` - Emitted when a row action is triggered
- `@Output() rowUpdated` - Emitted when inline edit is saved

## Testing

### Unit Tests

```bash
# Run unit tests
ng test

# Run with coverage
ng test --code-coverage
```

**Test Coverage Requirements:**

- TableStateStore: State mutations, computed signals, persistence
- FilterBarComponent: Filter interactions, dropdown behavior
- DataTableComponent: Sorting, selection, inline editing



## Technical Requirements Compliance

### Angular Features Used

| Requirement           | Implementation                            |
| --------------------- | ----------------------------------------- |
| Angular 19+           | Latest Angular with standalone components |
| Signals               | All state management via signals          |
| Standalone Components | All components are standalone             |
| OnPush Strategy       | Used throughout for performance           |
| Strong Typing         | Full TypeScript with strict mode          |

### Visual Requirements

| Requirement                       | Status                                     |
| --------------------------------- | ------------------------------------------ |
| Filter bar full width             | Implemented                                |
| Badge counters on filters         | Implemented                                |
| Active button styling             | Implemented (border-accent + bg-accent/10) |
| Multi-select with checkboxes      | Implemented                                |
| Search in Asset dropdown          | Implemented                                |
| Date presets with "Last 24h"      | Implemented                                |
| Custom date range picker          | Implemented                                |
| More Filters toggle               | Implemented                                |
| Clear Filters (conditional)       | Implemented                                |
| Filter disabled when 1 option     | Implemented                                |
| Sortable columns with icons       | Implemented                                |
| Drag & drop columns               | Implemented                                |
| Row selection (single/multi/all)  | Implemented                                |
| Indeterminate checkbox state      | Implemented                                |
| Row hover effects                 | Implemented                                |
| Warning rows in orange            | Implemented                                |
| Context menu with 4 actions       | Implemented                                |
| Inline editing (Enter/Escape/Tab) | Implemented                                |
| Pagination controls               | Implemented                                |
| Horizontal scrolling              | Implemented                                |

### Persistence

| Requirement                  | Status      |
| ---------------------------- | ----------- |
| Column order in localStorage | Implemented |
| Search history (last 3)      | Implemented |

### Architecture

| Requirement                  | Status                              |
| ---------------------------- | ----------------------------------- |
| Reusable library structure   | lib/table-widget/                   |
| Clean separation of concerns | Models, Services, Store, Components |
| Facade pattern for actions   | TableActionFacade                   |
| Testable design              | Dependency injection throughout     |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - see LICENSE file for details.
