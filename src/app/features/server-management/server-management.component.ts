import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineEditEvent, TableActionEvent } from '@app/models/action.model';
import { TableStateStore } from '@app/store/table-state.store';
import { TableWidgetComponent } from '@app/components';

@Component({
  selector: 'app-server-management',
  standalone: true,
  imports: [CommonModule, TableWidgetComponent],
  templateUrl: "./server-management.component.html",
  styleUrl:"./server-management.component.css",
})
export class ServerManagementComponent {

  onAction(event: TableActionEvent): void {
    console.log('[AppComponent] Action received:', event);
  }

  onEdit(event: InlineEditEvent): void {
    console.log('[AppComponent] Edit received:', event);
  }

  onExport(): void {
    console.log('[AppComponent] Export triggered');
  }
}
