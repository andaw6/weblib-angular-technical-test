  import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
  import { DataTableComponent } from './data-table.component';

  import { EventEmitter } from '@angular/core';
  import { TableStateStore } from '@app/store';
  import { MockDataService, StorageService, TableActionFacade } from '@app/services';

  describe('DataTableComponent', () => {
    let component: DataTableComponent;
    let fixture: ComponentFixture<DataTableComponent>;
    let store: TableStateStore;
    let actionFacade: TableActionFacade;

    beforeEach(async () => {
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

      await TestBed.configureTestingModule({
        // declarations: [DataTableComponent],
        imports:[DataTableComponent],
        providers: [
          TableStateStore,
          MockDataService,
          TableActionFacade,
          { provide: StorageService, useValue: storageSpy }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(DataTableComponent);
      component = fixture.componentInstance;
      store = TestBed.inject(TableStateStore);
      actionFacade = TestBed.inject(TableActionFacade);
      component.action = new EventEmitter();
      fixture.detectChanges();
    store.isTest = true;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    describe('Row Selection', () => {
      it('should toggle row selection on click', () => {
        const server = store.paginatedServers()[0];

        expect(store.selectedIds().has(server.id)).toBeFalse();

        component.onRowSelect(server.id, { shiftKey: false } as unknown as Event);

        expect(store.selectedIds().has(server.id)).toBeTrue();
      });

      it('should handle shift-click for range selection', () => {
        const servers = store.paginatedServers();
        const firstServer = servers[0];
        const thirdServer = servers[2];

        // Select first server
        component.onRowSelect(firstServer.id, { shiftKey: false } as unknown as Event);

        // Shift-click third server
        component.onRowSelect(thirdServer.id, { shiftKey: true } as unknown as Event);

        // All three servers should be selected
        expect(store.selectedIds().has(servers[0].id)).toBeTrue();
        expect(store.selectedIds().has(servers[1].id)).toBeTrue();
        expect(store.selectedIds().has(servers[2].id)).toBeTrue();
      });
    });

    describe('Inline Editing', () => {
      it('should start editing on double click', () => {
        const server = store.paginatedServers()[0];

        expect(store.uiState().editingCellId).toBeNull();

        component.startEditing(server.id);

        expect(store.uiState().editingCellId).toBe(server.id);
      });

      it('should save edit on Enter key', fakeAsync(() => {
        const server = store.paginatedServers()[0];
        const newName = 'Updated Server Name';

        component.startEditing(server.id);

        const event = {
          key: 'Enter',
          target: { value: newName }
        } as unknown as KeyboardEvent;

        component.onEditKeydown(event, server.id);
        tick(100);

        const updatedServer = store.getServerById(server.id);
        expect(updatedServer?.name).toBe(newName);
        expect(store.uiState().editingCellId).toBeNull();
      }));

      it('should cancel edit on Escape key', () => {
        const server = store.paginatedServers()[0];
        const originalName = server.name;

        component.startEditing(server.id);

        const event = {
          key: 'Escape',
          target: { value: 'Some other name' }
        } as unknown as KeyboardEvent;

        component.onEditKeydown(event, server.id);

        const currentServer = store.getServerById(server.id);
        expect(currentServer?.name).toBe(originalName);
        expect(store.uiState().editingCellId).toBeNull();
      });

      it('should move to next editable cell on Tab key', fakeAsync(() => {
        const servers = store.paginatedServers();
        const firstServer = servers[0];
        const secondServer = servers[1];

        component.startEditing(firstServer.id);

        const event = {
          key: 'Tab',
          target: { value: 'New Name' },
          preventDefault: jasmine.createSpy('preventDefault')
        } as unknown as KeyboardEvent;

        component.onEditKeydown(event, firstServer.id);
        tick(100);

        expect((event as any).preventDefault).toHaveBeenCalled();
        expect(store.uiState().editingCellId).toBe(secondServer.id);
      }));
    });

    describe('Context Menu', () => {
      it('should show context menu on button click', () => {
        const server = store.paginatedServers()[0];

        const event = {
          clientX: 100,
          clientY: 200,
          stopPropagation: jasmine.createSpy('stopPropagation'),
          preventDefault: jasmine.createSpy('preventDefault')
        } as unknown as MouseEvent;

        component.showContextMenu(event, server.id);

        const ui = store.uiState();
        expect(ui.contextMenuPosition).toEqual({ x: 100, y: 200 });
        expect(ui.contextMenuTargetIds).toContain(server.id);
      });

      it('should include all selected rows in context menu', () => {
        const servers = store.paginatedServers();

        // Select multiple servers
        store.toggleSelection(servers[0].id);
        store.toggleSelection(servers[1].id);
        store.toggleSelection(servers[2].id);

        const event = {
          clientX: 100,
          clientY: 200,
          stopPropagation: jasmine.createSpy('stopPropagation')
        } as unknown as MouseEvent;

        component.showContextMenu(event, servers[0].id);

        const ui = store.uiState();
        expect(ui.contextMenuTargetIds.length).toBe(3);
        expect(ui.contextMenuTargetIds).toContain(servers[0].id);
        expect(ui.contextMenuTargetIds).toContain(servers[1].id);
        expect(ui.contextMenuTargetIds).toContain(servers[2].id);
      });

      it('should execute action and emit event', () => {
        const server = store.paginatedServers()[0];
        const emitSpy = spyOn(component.action, 'emit');
        store.showContextMenu(100, 200, [server.id]);
        component.executeAction('openAdmin');
        expect(emitSpy).toHaveBeenCalled();
        const emittedEvent = emitSpy.calls.mostRecent().args[0];
        if (!emittedEvent) {
          fail('Expected TableActionEvent to be emitted');
          return;
        }
        expect(emittedEvent.type).toBe('openAdmin');
        expect(emittedEvent.targetIds).toContain(server.id);
      });


      it('should hide context menu after action', () => {
        const server = store.paginatedServers()[0];
        store.showContextMenu(100, 200, [server.id]);

        expect(store.uiState().contextMenuPosition).not.toBeNull();

        component.executeAction('openAdmin');

        expect(store.uiState().contextMenuPosition).toBeNull();
      });
    });

    describe('Sorting', () => {
      it('should display sort icons for sortable columns', () => {
        const sortableColumn = store.columns().find(c => c.sortable);
        expect(sortableColumn).toBeTruthy();
      });

      it('should update sort state on column click', () => {
        const column = store.columns().find(c => c.sortable);
        if (!column) return;

        store.toggleSort(column.id.toString());

        expect(store.sort().column).toBe(column.id.toString());
        expect(store.sort().direction).toBe('asc');
      });
    });

    describe('Column Drag and Drop', () => {
      it('should set dragged column on drag start', () => {
        const column = store.columns()[0];
        const event = {
          dataTransfer: {
            effectAllowed: '',
            setData: jasmine.createSpy('setData')
          }
        } as unknown as DragEvent;

        component.onDragStart(event, column.id.toString());

        expect(component.draggedColumnId()).toBe(column.id.toString());
      });

      it('should reorder columns on drop', () => {
        const columns = store.columns();
        const firstColumnId = columns[0].id.toString();
        const secondColumnId = columns[1].id.toString();

        component.onDragStart({ dataTransfer: { effectAllowed: '', setData: () => { } } } as unknown as DragEvent, firstColumnId);
        component.onDrop({ preventDefault: () => { } } as unknown as DragEvent, secondColumnId);

        const newColumns = store.columns();
        // First column should now be at a different position
        expect(newColumns[0].id).not.toBe(firstColumnId);
      });

      it('should reset drag state on drag end', () => {
        component.onDragStart({ dataTransfer: { effectAllowed: '', setData: () => { } } } as unknown as DragEvent, 'name');

        expect(component.draggedColumnId()).toBe('name');

        component.onDragEnd({} as unknown as DragEvent);

        expect(component.draggedColumnId()).toBeNull();
        expect(component.dragOverColumnId()).toBeNull();
      });
    });

    describe('Pagination', () => {
      it('should compute page numbers correctly', () => {
        const pageNumbers = component.pageNumbers();

        expect(pageNumbers.length).toBeGreaterThan(0);
        expect(pageNumbers[0]).toBe(1);
      });

      it('should show ellipsis for many pages', () => {
        // With 150 servers and 10 per page, we have 15 pages
        const pageNumbers = component.pageNumbers();

        // Should include ellipsis
        expect(pageNumbers).toContain('...');
      });
    });

    describe('Status Colors', () => {
      it('should return correct status classes', () => {
        const runningClasses = component.getStatusClasses('Running');
        expect(runningClasses).toContain('bg-green-500/20');
        expect(runningClasses).toContain('text-green-400');

        const errorClasses = component.getStatusClasses('Error');
        expect(errorClasses).toContain('bg-red-500/20');
        expect(errorClasses).toContain('text-red-400');
      });

      it('should return default classes for unknown status', () => {
        const unknownClasses = component.getStatusClasses('Unknown');
        expect(unknownClasses).toContain('bg-gray-500/20');
      });
    });

    describe('Cell Value Display', () => {
      it('should format date values', () => {
        const server = store.paginatedServers()[0];
        const dateValue = component.getCellValue(server, 'lastCommDate');

        // Should be a formatted date string
        expect(dateValue).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/);
      });

      it('should return dash for null/undefined values', () => {
        const server = { ...store.paginatedServers()[0], customField: undefined };
        const value = component.getCellValue(server as any, 'customField');

        expect(value).toBe('-');
      });
    });
  });
