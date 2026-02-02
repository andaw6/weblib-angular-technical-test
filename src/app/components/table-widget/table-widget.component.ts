import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataTableComponent } from '../data-table/data-table.component';
import { FilterBarComponent } from '../filter-bar/filter-bar.component';
import { TableStateStore } from '@app/store';
import { InlineEditEvent, TableActionEvent } from '@app/models';


/**
 * TableWidgetComponent - Smart/Container component
 * 
 * Composes FilterBarComponent and DataTableComponent
 * Manages state through TableStateStore
 */
@Component({
  selector: 'app-table-widget',
  standalone: true,
  imports: [CommonModule, FilterBarComponent, DataTableComponent],
  templateUrl: "./table-widget.component.html",
  styleUrl:"./table-widget.component.css",
})
export class TableWidgetComponent {
   store = inject(TableStateStore);

  @Output() action = new EventEmitter<TableActionEvent>();
  @Output() edit = new EventEmitter<InlineEditEvent>();
  @Output() export = new EventEmitter<void>();

  onAction(event: TableActionEvent): void {
    this.action.emit(event);
  }

  onEdit(event: InlineEditEvent): void {
    this.edit.emit(event);
  }

  onExport(): void {
    const selectedIds = this.store.selectedIds();
    const servers = selectedIds.size > 0
      ? this.store.getSelectedServers()
      : this.store.filteredServers();

    // Generate CSV
    const columns = this.store.columns();
    const headers = columns.map(c => c.label).join(',');
    const rows = servers.map(server =>
      columns.map(c => {
        const value = server[c.id as keyof typeof server];
        return value ?? '';
      }).join(',')
    );

    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'servers-export.csv';
    a.click();
    
    URL.revokeObjectURL(url);
    this.export.emit();
  }
}
