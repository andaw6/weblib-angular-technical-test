import { Server } from './server.model';

/**
 * Table action types
 */
export type TableActionType = 
  | 'openAdmin' 
  | 'moveServer' 
  | 'connectRemote' 
  | 'debug';

/**
 * Table action event model
 */
export interface TableActionEvent {
  type: TableActionType;
  targetIds: number[];
  servers: Server[];
  timestamp: Date;
}

/**
 * Action definition for context menu
 */
export interface ActionDefinition {
  id: TableActionType;
  label: string;
  icon: string;
  dangerous?: boolean;
  separator?: boolean;
}

/**
 * Default context menu actions
 */
export const CONTEXT_MENU_ACTIONS: ActionDefinition[] = [
  { 
    id: 'openAdmin', 
    label: 'Open Local Admin', 
    icon: 'external-link' 
  },
  { 
    id: 'moveServer', 
    label: 'Move Server', 
    icon: 'move' 
  },
  { 
    id: 'connectRemote', 
    label: 'Connect Remote Services', 
    icon: 'link',
    separator: true 
  },
  { 
    id: 'debug', 
    label: 'Advanced Debug Mode', 
    icon: 'alert-triangle',
    dangerous: true 
  }
];

/**
 * Inline edit event
 */
export interface InlineEditEvent {
  serverId: number;
  field: string;
  oldValue: string;
  newValue: string;
}

/**
 * Selection change event
 */
export interface SelectionChangeEvent {
  selectedIds: number[];
  action: 'select' | 'deselect' | 'toggle' | 'selectAll' | 'deselectAll';
}
