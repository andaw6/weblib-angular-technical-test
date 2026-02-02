import { Server } from './server.model';

/**
 * Column definition for the data table
 */
export interface ColumnDefinition<T = Server> {
  id: keyof T | string;
  label: string;
  sortable: boolean;
  editable?: boolean;
  width?: string;
  visible?: boolean;
}

/**
 * Default column configuration
 */
export const DEFAULT_COLUMNS: ColumnDefinition<Server>[] = [
  { id: 'name', label: 'Name', sortable: true, editable: true },
  { id: 'serial', label: 'Serial', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'assetName', label: 'Asset', sortable: true },
  { id: 'serverType', label: 'Server Type', sortable: true },
  { id: 'hardware', label: 'Hardware', sortable: true },
  { id: 'license', label: 'License', sortable: true },
  { id: 'version', label: 'Version', sortable: true },
  { id: 'warningsCount', label: 'Warnings', sortable: true },
  { id: 'lastCommDate', label: 'Last Comm Date', sortable: true }
];

/**
 * Sort direction type
 */
export type SortDirection = 'asc' | 'desc' | null;

/**
 * Sort state
 */
export interface SortState {
  column: string | null;
  direction: SortDirection;
}

/**
 * Pagination state
 */
export interface PaginationState {
  currentPage: number;
  rowsPerPage: number;
  totalItems: number;
}

/**
 * Table query model combining all query parameters
 */
export interface TableQuery {
  filters: import('./filter.model').ActiveFilters;
  sort: SortState;
  pagination: PaginationState;
  columns: ColumnDefinition[];
  selectedIds: Set<number>;
}

/**
 * Pagination options
 */
export const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

/**
 * Default pagination state
 */
export const DEFAULT_PAGINATION: PaginationState = {
  currentPage: 1,
  rowsPerPage: 10,
  totalItems: 0
};

/**
 * Default sort state
 */
export const DEFAULT_SORT: SortState = {
  column: null,
  direction: null
};
