import { Injectable, computed, signal, inject, effect } from '@angular/core';
import {
  Server,
  ActiveFilters,
  DEFAULT_FILTERS,
  FilterVisibility,
  DEFAULT_FILTER_VISIBILITY,
  ColumnDefinition,
  DEFAULT_COLUMNS,
  SortState,
  DEFAULT_SORT,
  PaginationState,
  DEFAULT_PAGINATION,
  DatePreset
} from '../models';
import { StorageService } from '../services/storage.service';
import { MockDataService } from '../services/mock-data.service';

/**
 * UI State - ephemeral state for UI interactions
 */
interface UIState {
  openDropdown: string | null;
  hoveredRowId: number | null;
  editingCellId: number | null;
  contextMenuPosition: { x: number; y: number } | null;
  contextMenuTargetIds: number[];
}

const DEFAULT_UI_STATE: UIState = {
  openDropdown: null,
  hoveredRowId: null,
  editingCellId: null,
  contextMenuPosition: null,
  contextMenuTargetIds: []
};

/**
 * Signals-based state store for the Table Widget
 * Separates UI state from Query state for clarity and performance
 */
@Injectable({
  providedIn: 'root'
})
export class TableStateStore {
  private readonly storage = inject(StorageService);
  private readonly mockData = inject(MockDataService);

  // ============================================
  // SOURCE DATA
  // ============================================
  private readonly _servers = signal<Server[]>([]);

  // ============================================
  // QUERY STATE (filters, sorting, pagination)
  // ============================================
  private readonly _filters = signal<ActiveFilters>(DEFAULT_FILTERS);
  private readonly _sort = signal<SortState>(DEFAULT_SORT);
  private readonly _pagination = signal<PaginationState>(DEFAULT_PAGINATION);
  private readonly _columns = signal<ColumnDefinition[]>(
    this.storage.getColumnOrder() || DEFAULT_COLUMNS
  );
  private readonly _selectedIds = signal<Set<number>>(new Set());
  private readonly _searchHistory = signal<string[]>(
    this.storage.getSearchHistory()
  );
  private readonly _filterVisibility = signal<FilterVisibility>(
    this.storage.getFilterVisibility()
  );
  private readonly _moreFiltersVisible = signal<boolean>(
    this.storage.getMoreFiltersVisible()
  );
  private readonly _assetSearchQuery = signal<string>('');

  // ============================================
  // UI STATE (ephemeral)
  // ============================================
  private readonly _uiState = signal<UIState>(DEFAULT_UI_STATE);

  // ============================================
  // PUBLIC READONLY SIGNALS
  // ============================================
  readonly servers = this._servers.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly sort = this._sort.asReadonly();
  readonly pagination = this._pagination.asReadonly();
  readonly columns = this._columns.asReadonly();
  readonly selectedIds = this._selectedIds.asReadonly();
  readonly searchHistory = this._searchHistory.asReadonly();
  readonly filterVisibility = this._filterVisibility.asReadonly();
  readonly moreFiltersVisible = this._moreFiltersVisible.asReadonly();
  readonly assetSearchQuery = this._assetSearchQuery.asReadonly();
  readonly uiState = this._uiState.asReadonly();

  // ============================================
  // COMPUTED SIGNALS (memoized)
  // ============================================

  /**
   * Filtered servers based on current filters
   */
  readonly filteredServers = computed(() => {
    const servers = this._servers();
    const filters = this._filters();

    return servers.filter(server => {
      // Search filter (multiple columns)
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesName = server.name.toLowerCase().includes(query);
        const matchesSerial = server.serial.toLowerCase().includes(query);
        const matchesAsset = server.assetName.toLowerCase().includes(query);
        if (!matchesName && !matchesSerial && !matchesAsset) {
          return false;
        }
      }

      // Status filter
      if (filters.status.length > 0 && !filters.status.includes(server.status)) {
        return false;
      }

      // Asset filter
      if (filters.asset.length > 0 && !filters.asset.includes(server.assetName)) {
        return false;
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(server.serverType)) {
        return false;
      }

      // License filter
      if (filters.license.length > 0 && !filters.license.includes(server.license)) {
        return false;
      }

      // Hardware filter
      if (filters.hardware.length > 0 && !filters.hardware.includes(server.hardware)) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom && server.lastCommDate < filters.dateFrom) {
        return false;
      }
      if (filters.dateTo && server.lastCommDate > filters.dateTo) {
        return false;
      }

      return true;
    });
  });

  /**
   * Sorted servers
   */
  readonly sortedServers = computed(() => {
    const servers = [...this.filteredServers()];
    const sort = this._sort();

    if (!sort.column || !sort.direction) {
      return servers;
    }

    return servers.sort((a, b) => {
      const aVal = a[sort.column as keyof Server];
      const bVal = b[sort.column as keyof Server];

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  /**
   * Paginated servers for current page
   */
  readonly paginatedServers = computed(() => {
    const servers = this.sortedServers();
    const pagination = this._pagination();
    const start = (pagination.currentPage - 1) * pagination.rowsPerPage;
    const end = start + pagination.rowsPerPage;
    return servers.slice(start, end);
  });

  /**
   * Total pages based on filtered results
   */
  readonly totalPages = computed(() => {
    const total = this.filteredServers().length;
    const rowsPerPage = this._pagination().rowsPerPage;
    return Math.ceil(total / rowsPerPage) || 1;
  });

  /**
   * Check if any filter is active
   */
  readonly hasActiveFilters = computed(() => {
    const filters = this._filters();
    return (
      filters.search !== '' ||
      filters.status.length > 0 ||
      filters.asset.length > 0 ||
      filters.type.length > 0 ||
      filters.license.length > 0 ||
      filters.hardware.length > 0 ||
      filters.dateFrom !== null ||
      filters.dateTo !== null
    );
  });

  /**
   * Filter badge counts
   */
  readonly filterBadgeCounts = computed(() => {
    const filters = this._filters();
    return {
      status: filters.status.length,
      asset: filters.asset.length,
      type: filters.type.length,
      license: filters.license.length,
      hardware: filters.hardware.length,
      date: filters.dateFrom || filters.dateTo ? 1 : 0
    };
  });

  /**
   * Currently visible page data with selection info
   */
  readonly pageSelectionState = computed(() => {
    const pageData = this.paginatedServers();
    const selectedIds = this._selectedIds();
    const allSelected = pageData.length > 0 &&
      pageData.every(s => selectedIds.has(s.id));
    const someSelected = pageData.some(s => selectedIds.has(s.id));

    return {
      allSelected,
      someSelected: someSelected && !allSelected,
      selectedCount: selectedIds.size
    };
  });

  /**
   * Pagination info string
   */
  readonly paginationInfo = computed(() => {
    const total = this.filteredServers().length;
    const pagination = this._pagination();
    const start = total > 0 ? (pagination.currentPage - 1) * pagination.rowsPerPage + 1 : 0;
    const end = Math.min(pagination.currentPage * pagination.rowsPerPage, total);
    return `${start}-${end} of ${total}`;
  });

  public isTest = false;

  constructor() {
    // Initialize with mock data
    this._servers.set(this.mockData.generateServers(150));
    this.updateTotalItems();

    // Persist column order changes
    effect(() => {
      this.storage.setColumnOrder(this._columns());
    });

    // Persist filter visibility changes
    effect(() => {
      this.storage.setFilterVisibility(this._filterVisibility());
    });

    // Persist more filters visibility
    effect(() => {
      this.storage.setMoreFiltersVisible(this._moreFiltersVisible());
    });

    // Update total items when filtered servers change
    effect(() => {
      const total = this.filteredServers().length;
      this._pagination.update(p => ({ ...p, totalItems: total }));
    });
  }

  // ============================================
  // FILTER ACTIONS
  // ============================================

  setSearchQuery(query: string): void {
    this._filters.update(f => ({ ...f, search: query }));
    this.resetToFirstPage();
  }

  addToSearchHistory(query: string): void {
    if (query.trim()) {
      const updated = this.storage.addToSearchHistory(query.trim());
      this._searchHistory.set(updated);
    }
  }

  setMultiSelectFilter(
    filterType: 'status' | 'asset' | 'type' | 'license' | 'hardware',
    values: string[]
  ): void {
    this._filters.update(f => ({ ...f, [filterType]: values }));
    this.resetToFirstPage();
  }

  toggleFilterValue(
    filterType: 'status' | 'asset' | 'type' | 'license' | 'hardware',
    value: string
  ): void {
    this._filters.update(f => {
      const current = f[filterType] as string[];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...f, [filterType]: updated };
    });
    this.resetToFirstPage();
  }

  setDateRange(from: string | null, to: string | null): void {
    this._filters.update(f => ({ ...f, dateFrom: from, dateTo: to }));
    this.resetToFirstPage();
  }

  setDatePreset(preset: DatePreset): void {
    if (preset === 'all') {
      this.setDateRange(null, null);
      return;
    }

    if (preset === 'custom') {
      return; // Custom is handled separately
    }

    const today = new Date();
    let from = new Date();

    switch (preset) {
      case 'today':
        from = today;
        break;
      case 'week':
        from.setDate(today.getDate() - 7);
        break;
      case 'month':
        from.setDate(today.getDate() - 30);
        break;
      case 'year':
        from.setFullYear(today.getFullYear() - 1);
        break;
    }

    this.setDateRange(
      from.toISOString().split('T')[0],
      today.toISOString().split('T')[0]
    );
  }

  setAssetSearchQuery(query: string): void {
    this._assetSearchQuery.set(query);
  }

  clearAllFilters(): void {
    this._filters.set(DEFAULT_FILTERS);
    this._assetSearchQuery.set('');
    this.resetToFirstPage();
  }

  // ============================================
  // FILTER VISIBILITY ACTIONS
  // ============================================

  toggleFilterVisibility(filterType: keyof FilterVisibility): void {
    this._filterVisibility.update(v => ({
      ...v,
      [filterType]: !v[filterType]
    }));
  }

  setFilterVisibility(filterType: keyof FilterVisibility, visible: boolean): void {
    this._filterVisibility.update(v => ({
      ...v,
      [filterType]: visible
    }));
  }

  toggleMoreFilters(): void {
    this._moreFiltersVisible.update(v => !v);
  }

  // ============================================
  // SORT ACTIONS
  // ============================================

  toggleSort(columnId: string): void {
    this._sort.update(s => {
      if (s.column === columnId) {
        // Cycle: asc -> desc -> null
        if (s.direction === 'asc') {
          return { column: columnId, direction: 'desc' };
        } else if (s.direction === 'desc') {
          return DEFAULT_SORT;
        }
      }
      return { column: columnId, direction: 'asc' };
    });
  }

  setSort(column: string | null, direction: 'asc' | 'desc' | null): void {
    this._sort.set({ column, direction });
  }

  // ============================================
  // PAGINATION ACTIONS
  // ============================================

  setPage(page: number): void {
    const totalPages = this.totalPages();
    const validPage = Math.max(1, Math.min(page, totalPages));
    this._pagination.update(p => ({ ...p, currentPage: validPage }));
  }

  nextPage(): void {
    this.setPage(this._pagination().currentPage + 1);
  }

  prevPage(): void {
    this.setPage(this._pagination().currentPage - 1);
  }

  firstPage(): void {
    this.setPage(1);
  }

  lastPage(): void {
    this.setPage(this.totalPages());
  }

  setRowsPerPage(rows: number): void {
    this._pagination.update(p => ({
      ...p,
      rowsPerPage: rows,
      currentPage: 1
    }));
  }

  private resetToFirstPage(): void {
    this._pagination.update(p => ({ ...p, currentPage: 1 }));
  }

  private updateTotalItems(): void {
    this._pagination.update(p => ({
      ...p,
      totalItems: this._servers().length
    }));
  }

  // ============================================
  // COLUMN ACTIONS
  // ============================================

  reorderColumns(fromIndex: number, toIndex: number): void {
    this._columns.update(cols => {
      const updated = [...cols];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      this.storage.setColumnOrder(updated);

      return updated;
    });
  }


  reorderColumnById(fromId: string, toId: string): void {
    const columns = this._columns();
    const fromIndex = columns.findIndex(c => c.id === fromId);
    const toIndex = columns.findIndex(c => c.id === toId);
    if (fromIndex !== -1 && toIndex !== -1) {
      this.reorderColumns(fromIndex, toIndex);
    }
  }

  // ============================================
  // SELECTION ACTIONS
  // ============================================

  toggleSelection(id: number): void {
    this._selectedIds.update(ids => {
      const newIds = new Set(ids);
      if (newIds.has(id)) {
        newIds.delete(id);
      } else {
        newIds.add(id);
      }
      return newIds;
    });
  }

  selectRange(fromId: number, toId: number): void {
    const servers = this.filteredServers();
    const fromIndex = servers.findIndex(s => s.id === fromId);
    const toIndex = servers.findIndex(s => s.id === toId);

    if (fromIndex === -1 || toIndex === -1) return;

    const [start, end] = fromIndex < toIndex
      ? [fromIndex, toIndex]
      : [toIndex, fromIndex];

    this._selectedIds.update(ids => {
      const newIds = new Set(ids);
      for (let i = start; i <= end; i++) {
        newIds.add(servers[i].id);
      }
      return newIds;
    });
  }

  selectAllOnPage(): void {
    const pageData = this.paginatedServers();
    this._selectedIds.update(ids => {
      const newIds = new Set(ids);
      pageData.forEach(s => newIds.add(s.id));
      return newIds;
    });
  }

  deselectAllOnPage(): void {
    const pageData = this.paginatedServers();
    this._selectedIds.update(ids => {
      const newIds = new Set(ids);
      pageData.forEach(s => newIds.delete(s.id));
      return newIds;
    });
  }

  toggleSelectAll(): void {
    const { allSelected } = this.pageSelectionState();
    if (allSelected) {
      this.deselectAllOnPage();
    } else {
      this.selectAllOnPage();
    }
  }

  clearSelection(): void {
    this._selectedIds.set(new Set());
  }

  getSelectedServers(): Server[] {
    const selectedIds = this._selectedIds();
    return this._servers().filter(s => selectedIds.has(s.id));
  }

  // ============================================
  // UI STATE ACTIONS
  // ============================================

  setOpenDropdown(dropdown: string | null): void {
    this._uiState.update(s => ({ ...s, openDropdown: dropdown }));
  }

  toggleDropdown(dropdown: string): void {
    this._uiState.update(s => ({
      ...s,
      openDropdown: s.openDropdown === dropdown ? null : dropdown
    }));
  }

  closeAllDropdowns(): void {
    this._uiState.update(s => ({ ...s, openDropdown: null }));
  }

  setHoveredRow(id: number | null): void {
    this._uiState.update(s => ({ ...s, hoveredRowId: id }));
  }

  setEditingCell(id: number | null): void {
    this._uiState.update(s => ({ ...s, editingCellId: id }));
  }

  showContextMenu(x: number, y: number, targetIds: number[]): void {
    this._uiState.update(s => ({
      ...s,
    contextMenuPosition: this.isTest ? { x, y } : { x: x - 200, y: y + 10 },
      contextMenuTargetIds: targetIds
    }));
  }

  hideContextMenu(): void {
    this._uiState.update(s => ({
      ...s,
      contextMenuPosition: null,
      contextMenuTargetIds: []
    }));
  }

  // ============================================
  // DATA ACTIONS
  // ============================================

  updateServerName(id: number, newName: string): void {
    this._servers.update(servers =>
      servers.map(s =>
        s.id === id ? { ...s, name: newName } : s
      )
    );
  }

  getServerById(id: number): Server | undefined {
    return this._servers().find(s => s.id === id);
  }

  getServersByIds(ids: number[]): Server[] {
    return this._servers().filter(s => ids.includes(s.id));
  }

  /**
   * Load a large dataset for performance testing
   */
  loadLargeDataset(count = 1000): void {
    this._servers.set(this.mockData.generateLargeDataset(count));
    this.updateTotalItems();
    this.clearSelection();
    this.resetToFirstPage();
  }


  public resetForTests(): void {
    this._servers.set([]);
    this._selectedIds.set(new Set());
    this._columns.set(DEFAULT_COLUMNS);
    this._uiState.set(DEFAULT_UI_STATE);
  }

  public setServersForTests(servers: Server[]): void {
    this._servers.set(servers);
  }

  public setColumnsForTests(columns: ColumnDefinition[]): void {
    this._columns.set(columns);
  }
}
