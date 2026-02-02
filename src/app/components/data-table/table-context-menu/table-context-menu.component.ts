import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { TableActionEvent, TableActionType } from '@app/models';
import { TableActionFacade } from '@app/services';
import { TableStateStore } from '@app/store';

@Component({
  selector: 'app-table-context-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './table-context-menu.component.html',
  styleUrl: './table-context-menu.component.css',
})
export class TableContextMenuComponent {
  readonly store = inject(TableStateStore);
  @Input() executeAction!: (actionType: TableActionType) => void;
}
