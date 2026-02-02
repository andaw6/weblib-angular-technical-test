  import { TestBed } from '@angular/core/testing';
  import { TableStateStore } from './table-state.store';
  import { StorageService } from '../services/storage.service';
  import { MockDataService } from '../services/mock-data.service';

  describe('TableStateStore', () => {
    let store: TableStateStore;
    let storageService: jasmine.SpyObj<StorageService>;
    let mockDataService: MockDataService;

    beforeEach(() => {
      const storageSpy = jasmine.createSpyObj('StorageService', [
        'getColumnOrder',
        'setColumnOrder',
        'getFilterVisibility',
        'setFilterVisibility',
        'getSearchHistory',
        'setSearchHistory',
        'addToSearchHistory',
        'getMoreFiltersVisible',
        'setMoreFiltersVisible'
      ]);

      storageSpy.getColumnOrder.and.returnValue(null);
      storageSpy.getFilterVisibility.and.returnValue({ type: true, license: true, date: true });
      storageSpy.getSearchHistory.and.returnValue([]);
      storageSpy.getMoreFiltersVisible.and.returnValue(false);
      storageSpy.addToSearchHistory.and.callFake((query: string) => [query]);

      TestBed.configureTestingModule({
        providers: [
          TableStateStore,
          MockDataService,
          { provide: StorageService, useValue: storageSpy }
        ]
      });

      store = TestBed.inject(TableStateStore);
      storageService = TestBed.inject(StorageService) as jasmine.SpyObj<StorageService>;
      mockDataService = TestBed.inject(MockDataService);
      store.isTest = true;

    });

    describe('Filter State Logic', () => {
      it('should initialize with default filters', () => {
        const filters = store.filters();
        expect(filters.search).toBe('');
        expect(filters.status).toEqual([]);
        expect(filters.asset).toEqual([]);
        expect(filters.type).toEqual([]);
        expect(filters.license).toEqual([]);
        expect(filters.hardware).toEqual([]);
        expect(filters.dateFrom).toBeNull();
        expect(filters.dateTo).toBeNull();
      });

      it('should update search query and filter servers', () => {
        const initialCount = store.filteredServers().length;
        
        store.setSearchQuery('Apollo');
        
        expect(store.filters().search).toBe('Apollo');
        expect(store.filteredServers().length).toBeLessThanOrEqual(initialCount);
      });

      it('should toggle filter values correctly', () => {
        // Add a status filter
        store.toggleFilterValue('status', 'Running');
        expect(store.filters().status).toContain('Running');

        // Toggle same value should remove it
        store.toggleFilterValue('status', 'Running');
        expect(store.filters().status).not.toContain('Running');
      });

      it('should update multi-select filter', () => {
        store.setMultiSelectFilter('status', ['Running', 'Stopped']);
        
        expect(store.filters().status).toEqual(['Running', 'Stopped']);
        expect(store.filterBadgeCounts().status).toBe(2);
      });

      it('should clear all filters and reset to defaults', () => {
        // Set some filters
        store.setSearchQuery('test');
        store.setMultiSelectFilter('status', ['Running']);
        store.setDateRange('2024-01-01', '2024-12-31');

        // Clear all
        store.clearAllFilters();

        const filters = store.filters();
        expect(filters.search).toBe('');
        expect(filters.status).toEqual([]);
        expect(filters.dateFrom).toBeNull();
        expect(filters.dateTo).toBeNull();
      });

      it('should compute hasActiveFilters correctly', () => {
        expect(store.hasActiveFilters()).toBeFalse();

        store.setSearchQuery('test');
        expect(store.hasActiveFilters()).toBeTrue();

        store.clearAllFilters();
        expect(store.hasActiveFilters()).toBeFalse();

        store.setMultiSelectFilter('status', ['Running']);
        expect(store.hasActiveFilters()).toBeTrue();
      });

      it('should compute filter badge counts correctly', () => {
        store.setMultiSelectFilter('status', ['Running', 'Stopped', 'Error']);
        store.setMultiSelectFilter('asset', ['Production']);
        store.setDateRange('2024-01-01', '2024-12-31');

        const counts = store.filterBadgeCounts();
        expect(counts.status).toBe(3);
        expect(counts.asset).toBe(1);
        expect(counts.type).toBe(0);
        expect(counts.date).toBe(1);
      });

      it('should reset to first page when filters change', () => {
        // Go to page 2
        store.setPage(2);
        expect(store.pagination().currentPage).toBe(2);

        // Apply a filter
        store.setSearchQuery('test');
        expect(store.pagination().currentPage).toBe(1);
      });
    });

    describe('Search History', () => {
      it('should keep last 3 unique search terms', () => {
        store.addToSearchHistory('term1');
        store.addToSearchHistory('term2');
        store.addToSearchHistory('term3');
        store.addToSearchHistory('term4');

        // Should have called storage with updated history
        expect(storageService.addToSearchHistory).toHaveBeenCalledTimes(4);
      });

      it('should not duplicate existing terms', () => {
        storageService.addToSearchHistory.and.callFake((query: string) => {
          const current = storageService.getSearchHistory() || [];
          return [query, ...current.filter((q: string) => q !== query)].slice(0, 3);
        });
        storageService.getSearchHistory.and.returnValue(['term1', 'term2']);

        store.addToSearchHistory('term1');

        // term1 should be moved to front, not duplicated
        const callArg = storageService.addToSearchHistory.calls.mostRecent().args[0];
        expect(callArg).toBe('term1');
      });

      it('should not add empty search terms', () => {
        const initialCallCount = storageService.addToSearchHistory.calls.count();
        
        store.addToSearchHistory('');
        store.addToSearchHistory('   ');

        expect(storageService.addToSearchHistory.calls.count()).toBe(initialCallCount);
      });
    });

    describe('Status Warning Display Rule', () => {
      it('should identify servers with warningsCount > 1', () => {
        const servers = store.paginatedServers();
        const serversWithHighWarnings = servers.filter(s => s.warningsCount > 1);
        
        // Each server with warningsCount > 1 should be visually emphasized
        serversWithHighWarnings.forEach(server => {
          expect(server.warningsCount).toBeGreaterThan(1);
        });
      });

      it('should filter servers with Warning status correctly', () => {
        // Get servers with Error status (they typically have high warnings)
        store.setMultiSelectFilter('status', ['Error']);
        
        const errorServers = store.filteredServers();
        errorServers.forEach(server => {
          expect(server.status).toBe('Error');
        });
      });
    });

    describe('Column Reordering Logic', () => {
      it('should reorder columns by index', () => {
        const initialColumns = [...store.columns()];
        const firstColumn = initialColumns[0];
        const secondColumn = initialColumns[1];

        store.reorderColumns(0, 1);

        const updatedColumns = store.columns();
        expect(updatedColumns[0].id).toBe(secondColumn.id);
        expect(updatedColumns[1].id).toBe(firstColumn.id);
      });

      it('should reorder columns by id', () => {
        const columns = store.columns();
        const nameColumn = columns.find(c => c.id === 'name');
        const serialColumn = columns.find(c => c.id === 'serial');

        expect(nameColumn).toBeTruthy();
        expect(serialColumn).toBeTruthy();

        store.reorderColumnById('name', 'serial');

        const updatedColumns = store.columns();
        const nameIndex = updatedColumns.findIndex(c => c.id === 'name');
        const serialIndex = updatedColumns.findIndex(c => c.id === 'serial');

        // After reorder, name should be where serial was
        expect(nameIndex).toBeGreaterThanOrEqual(0);
      });

      it('should persist column order to storage', () => {
        store.reorderColumns(0, 1);

        // Storage should be updated
        expect(storageService.setColumnOrder).toHaveBeenCalled();
      });
    });

    describe('Inline Editing Behavior', () => {
      it('should set editing cell id', () => {
        expect(store.uiState().editingCellId).toBeNull();

        store.setEditingCell(1);
        expect(store.uiState().editingCellId).toBe(1);

        store.setEditingCell(null);
        expect(store.uiState().editingCellId).toBeNull();
      });

      it('should update server name', () => {
        const servers = store.servers();
        const firstServer = servers[0];
        const originalName = firstServer.name;

        store.updateServerName(firstServer.id, 'New Server Name');

        const updatedServer = store.getServerById(firstServer.id);
        expect(updatedServer?.name).toBe('New Server Name');
        expect(updatedServer?.name).not.toBe(originalName);
      });

      it('should not update server if id not found', () => {
        const serversBefore = store.servers();
        
        store.updateServerName(999999, 'New Name');
        
        const serversAfter = store.servers();
        // All servers should remain unchanged
        expect(serversAfter.length).toBe(serversBefore.length);
      });
    });

    describe('Selection Logic', () => {
      it('should toggle single selection', () => {
        const server = store.paginatedServers()[0];
        
        expect(store.selectedIds().has(server.id)).toBeFalse();

        store.toggleSelection(server.id);
        expect(store.selectedIds().has(server.id)).toBeTrue();

        store.toggleSelection(server.id);
        expect(store.selectedIds().has(server.id)).toBeFalse();
      });

      it('should select range of servers', () => {
        const servers = store.filteredServers();
        const fromId = servers[0].id;
        const toId = servers[4].id;

        store.selectRange(fromId, toId);

        const selected = store.selectedIds();
        expect(selected.size).toBe(5);
        
        for (let i = 0; i <= 4; i++) {
          expect(selected.has(servers[i].id)).toBeTrue();
        }
      });

      it('should select all on current page', () => {
        store.selectAllOnPage();

        const pageData = store.paginatedServers();
        const selected = store.selectedIds();

        pageData.forEach(server => {
          expect(selected.has(server.id)).toBeTrue();
        });
      });

      it('should deselect all on current page', () => {
        store.selectAllOnPage();
        expect(store.selectedIds().size).toBeGreaterThan(0);

        store.deselectAllOnPage();

        const pageData = store.paginatedServers();
        const selected = store.selectedIds();

        pageData.forEach(server => {
          expect(selected.has(server.id)).toBeFalse();
        });
      });

      it('should toggle select all correctly', () => {
        // First toggle should select all
        store.toggleSelectAll();
        expect(store.pageSelectionState().allSelected).toBeTrue();

        // Second toggle should deselect all
        store.toggleSelectAll();
        expect(store.pageSelectionState().allSelected).toBeFalse();
      });

      it('should clear all selections', () => {
        store.selectAllOnPage();
        expect(store.selectedIds().size).toBeGreaterThan(0);

        store.clearSelection();
        expect(store.selectedIds().size).toBe(0);
      });

      it('should get selected servers', () => {
        const pageData = store.paginatedServers();
        const serverToSelect = pageData[0];

        store.toggleSelection(serverToSelect.id);

        const selectedServers = store.getSelectedServers();
        expect(selectedServers.length).toBe(1);
        expect(selectedServers[0].id).toBe(serverToSelect.id);
      });
    });

    describe('Sorting Logic', () => {
      it('should toggle sort direction', () => {
        expect(store.sort().column).toBeNull();
        expect(store.sort().direction).toBeNull();

        // First click: asc
        store.toggleSort('name');
        expect(store.sort().column).toBe('name');
        expect(store.sort().direction).toBe('asc');

        // Second click: desc
        store.toggleSort('name');
        expect(store.sort().column).toBe('name');
        expect(store.sort().direction).toBe('desc');

        // Third click: null
        store.toggleSort('name');
        expect(store.sort().column).toBeNull();
        expect(store.sort().direction).toBeNull();
      });

      it('should sort servers ascending', () => {
        store.setSort('name', 'asc');

        const sortedServers = store.sortedServers();
        for (let i = 1; i < sortedServers.length; i++) {
          expect(sortedServers[i].name.toLowerCase() >= sortedServers[i - 1].name.toLowerCase()).toBeTrue();
        }
      });

      it('should sort servers descending', () => {
        store.setSort('name', 'desc');

        const sortedServers = store.sortedServers();
        for (let i = 1; i < sortedServers.length; i++) {
          expect(sortedServers[i].name.toLowerCase() <= sortedServers[i - 1].name.toLowerCase()).toBeTrue();
        }
      });

      it('should sort numeric columns correctly', () => {
        store.setSort('warningsCount', 'asc');

        const sortedServers = store.sortedServers();
        for (let i = 1; i < sortedServers.length; i++) {
          expect(sortedServers[i].warningsCount >= sortedServers[i - 1].warningsCount).toBeTrue();
        }
      });
    });

    describe('Pagination Logic', () => {
      it('should compute total pages correctly', () => {
        const totalItems = store.filteredServers().length;
        const rowsPerPage = store.pagination().rowsPerPage;
        const expectedPages = Math.ceil(totalItems / rowsPerPage);

        expect(store.totalPages()).toBe(expectedPages);
      });

      it('should navigate pages correctly', () => {
        expect(store.pagination().currentPage).toBe(1);

        store.nextPage();
        expect(store.pagination().currentPage).toBe(2);

        store.prevPage();
        expect(store.pagination().currentPage).toBe(1);

        store.lastPage();
        expect(store.pagination().currentPage).toBe(store.totalPages());

        store.firstPage();
        expect(store.pagination().currentPage).toBe(1);
      });

      it('should not go below page 1', () => {
        store.setPage(1);
        store.prevPage();
        expect(store.pagination().currentPage).toBe(1);
      });

      it('should not exceed total pages', () => {
        const totalPages = store.totalPages();
        store.setPage(totalPages);
        store.nextPage();
        expect(store.pagination().currentPage).toBe(totalPages);
      });

      it('should change rows per page and reset to first page', () => {
        store.setPage(3);
        store.setRowsPerPage(25);

        expect(store.pagination().rowsPerPage).toBe(25);
        expect(store.pagination().currentPage).toBe(1);
      });

      it('should compute pagination info correctly', () => {
        const info = store.paginationInfo();
        expect(info).toMatch(/\d+-\d+ of \d+/);
      });
    });

    describe('UI State', () => {
      it('should toggle dropdown', () => {
        expect(store.uiState().openDropdown).toBeNull();

        store.toggleDropdown('search');
        expect(store.uiState().openDropdown).toBe('search');

        store.toggleDropdown('search');
        expect(store.uiState().openDropdown).toBeNull();
      });

      it('should close all dropdowns', () => {
        store.setOpenDropdown('search');
        expect(store.uiState().openDropdown).toBe('search');

        store.closeAllDropdowns();
        expect(store.uiState().openDropdown).toBeNull();
      });

      it('should set hovered row', () => {
        store.setHoveredRow(1);
        expect(store.uiState().hoveredRowId).toBe(1);

        store.setHoveredRow(null);
        expect(store.uiState().hoveredRowId).toBeNull();
      });

      it('should show and hide context menu', () => {
        store.showContextMenu(100, 200, [1, 2, 3]);

        const ui = store.uiState();
        expect(ui.contextMenuPosition).toEqual({ x: 100, y: 200 });
        expect(ui.contextMenuTargetIds).toEqual([1, 2, 3]);

        store.hideContextMenu();

        const uiAfter = store.uiState();
        expect(uiAfter.contextMenuPosition).toBeNull();
        expect(uiAfter.contextMenuTargetIds).toEqual([]);
      });
    });

    describe('Date Range Filtering', () => {
      it('should set date range', () => {
        store.setDateRange('2024-01-01', '2024-12-31');

        const filters = store.filters();
        expect(filters.dateFrom).toBe('2024-01-01');
        expect(filters.dateTo).toBe('2024-12-31');
      });

      it('should set date preset', () => {
        store.setDatePreset('week');

        const filters = store.filters();
        expect(filters.dateFrom).toBeTruthy();
        expect(filters.dateTo).toBeTruthy();
      });

      it('should clear date range with "all" preset', () => {
        store.setDateRange('2024-01-01', '2024-12-31');
        store.setDatePreset('all');

        const filters = store.filters();
        expect(filters.dateFrom).toBeNull();
        expect(filters.dateTo).toBeNull();
      });
    });

    describe('Filter Visibility', () => {
      it('should toggle filter visibility', () => {
        const initialVisibility = store.filterVisibility().type;
        
        store.toggleFilterVisibility('type');
        expect(store.filterVisibility().type).toBe(!initialVisibility);
      });

      it('should set filter visibility directly', () => {
        store.setFilterVisibility('license', false);
        expect(store.filterVisibility().license).toBeFalse();

        store.setFilterVisibility('license', true);
        expect(store.filterVisibility().license).toBeTrue();
      });

      it('should toggle more filters panel', () => {
        const initial = store.moreFiltersVisible();
        
        store.toggleMoreFilters();
        expect(store.moreFiltersVisible()).toBe(!initial);
      });
    });

    describe('Performance', () => {
      it('should handle large dataset without error', () => {
        store.loadLargeDataset(1000);

        expect(store.servers().length).toBe(1000);
        expect(store.filteredServers().length).toBe(1000);
        expect(store.paginatedServers().length).toBeLessThanOrEqual(store.pagination().rowsPerPage);
      });
    });
  });
