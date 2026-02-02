import {
  Component,
  inject,
  signal,
  computed,
  HostListener,
  Output,
  EventEmitter
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableStateStore } from '@app/store';
import { TableActionFacade } from '@app/services';
import { InlineEditEvent, ROWS_PER_PAGE_OPTIONS, Server, STATUS_COLORS, TableActionEvent, TableActionType } from '@app/models';
import { TablePaginationComponent } from './table-pagination/table-pagination.component';
import { TableContextMenuComponent } from './table-context-menu/table-context-menu.component';


@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    TablePaginationComponent, 
    TableContextMenuComponent,
  ],
  templateUrl: "./data-table.component.html",
  styleUrl:"./data-table.component.css",
})
export class DataTableComponent {
  readonly store = inject(TableStateStore);
  private readonly actionFacade = inject(TableActionFacade);

  @Output() action = new EventEmitter<TableActionEvent>();
  @Output() edit = new EventEmitter<InlineEditEvent>();

  readonly rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS;

  // Drag and drop state
  readonly draggedColumnId = signal<string | null>(null);
  readonly dragOverColumnId = signal<string | null>(null);

  // Last selected ID for shift-click range selection
  private lastSelectedId: number | null = null;

  // Computed: page numbers for pagination
  readonly pageNumbers = computed(() => {
    const totalPages = this.store.totalPages();
    const currentPage = this.store.pagination().currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('[role="menu"]') && !target.closest('button')) {
      this.store.hideContextMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.store.hideContextMenu();
    if (this.store.uiState().editingCellId !== null) {
      this.store.setEditingCell(null);
    }
  }

  // Cell value getter
  getCellValue(server: Server, columnId: string): string {
    const value = server[columnId as keyof Server];
    if (value === null || value === undefined) return '-';
    if (columnId === 'lastCommDate') {
      return new Date(value as string).toLocaleDateString();
    }
    return String(value);
  }

  // Status color classes
  getStatusClasses(status: string): string {
    const colors = STATUS_COLORS[status as keyof typeof STATUS_COLORS];
    if (colors) {
      return `${colors.bg} ${colors.text}`;
    }
    return 'bg-gray-500/20 text-gray-400';
  }

  // Selection handling
  onRowSelect(id: number, event: Event): void {
    const mouseEvent = event as unknown as MouseEvent;

    if (mouseEvent.shiftKey && this.lastSelectedId !== null) {
      this.store.selectRange(this.lastSelectedId, id);
    } else {
      this.store.toggleSelection(id);
    }

    this.lastSelectedId = id;
  }

  // Drag and drop for columns
  onDragStart(event: DragEvent, columnId: string): void {
    this.draggedColumnId.set(columnId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', columnId);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const th = (event.target as HTMLElement).closest('th');
    const columnId = th?.getAttribute('data-column-id');
    if (columnId && columnId !== this.draggedColumnId()) {
      this.dragOverColumnId.set(columnId);
    }
  }

  onDragLeave(event: DragEvent): void {
    const th = (event.target as HTMLElement).closest('th');
    const columnId = th?.getAttribute('data-column-id');
    if (columnId === this.dragOverColumnId()) {
      this.dragOverColumnId.set(null);
    }
  }

  onDrop(event: DragEvent, targetColumnId: string): void {
    event.preventDefault();
    const sourceColumnId = this.draggedColumnId();

    if (sourceColumnId && sourceColumnId !== targetColumnId) {
      this.store.reorderColumnById(sourceColumnId, targetColumnId);
    }

    this.draggedColumnId.set(null);
    this.dragOverColumnId.set(null);
  }

  onDragEnd(event: DragEvent): void {
    this.draggedColumnId.set(null);
    this.dragOverColumnId.set(null);
  }

  // Inline editing
  startEditing(id: number): void {
    this.store.setEditingCell(id);

    // Focus the input after Angular updates the DOM
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        `tr[data-id="${id}"] input[type="text"]`
      );
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  onEditKeydown(event: KeyboardEvent, serverId: number): void {
    const input = event.target as HTMLInputElement;

    if (event.key === 'Enter') {
      this.saveEdit(serverId, input.value);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    } else if (event.key === 'Tab') {
      event.preventDefault();
      this.saveEdit(serverId, input.value);

      // Move to next editable cell
      const servers = this.store.paginatedServers();
      const currentIndex = servers.findIndex(s => s.id === serverId);
      const nextServer = servers[currentIndex + 1];

      if (nextServer) {
        this.startEditing(nextServer.id);
      }
    }
  }

  onEditBlur(event: FocusEvent, serverId: number): void {
    // Cancel edit when clicking outside
    // Small timeout to allow for Tab key to work
    setTimeout(() => {
      if (this.store.uiState().editingCellId === serverId) {
        this.cancelEdit();
      }
    }, 100);
  }

  private saveEdit(serverId: number, newValue: string): void {
    const server = this.store.getServerById(serverId);
    if (server && newValue.trim()) {
      const oldValue = server.name;
      this.store.updateServerName(serverId, newValue.trim());

      const editEvent: InlineEditEvent = {
        serverId,
        field: 'name',
        oldValue,
        newValue: newValue.trim()
      };

      this.actionFacade.handleEdit(editEvent);
      this.edit.emit(editEvent);
    }

    this.store.setEditingCell(null);
  }

  private cancelEdit(): void {
    this.store.setEditingCell(null);
  }

  // Context menu
  showContextMenu(event: MouseEvent, serverId: number): void {
    event.stopPropagation();

    const selectedIds = this.store.selectedIds();
    const targetIds = selectedIds.size > 0
      ? Array.from(selectedIds)
      : [serverId];

    this.store.showContextMenu(event.clientX, event.clientY, targetIds);
  }

  executeAction(actionType: TableActionType): void {
    const targetIds = this.store.uiState().contextMenuTargetIds;
    const servers = this.store.getServersByIds(targetIds);

    const event: TableActionEvent = {
      type: actionType,
      targetIds,
      servers,
      timestamp: new Date()
    };

    // Execute via facade
    this.actionFacade.executeAction(actionType, servers);

    // Emit event
    this.action.emit(event);

    // Hide menu
    this.store.hideContextMenu();
  }
}



