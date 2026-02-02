import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { TableActionEvent, TableActionType, InlineEditEvent, Server } from '../models';

/**
 * Facade for table actions - handles all action events
 * Can be extended to connect to real backend services
 */
@Injectable({
  providedIn: 'root'
})
export class TableActionFacade {
  private readonly actionSubject = new Subject<TableActionEvent>();
  private readonly editSubject = new Subject<InlineEditEvent>();

  /** Observable stream of action events */
  readonly actions$ = this.actionSubject.asObservable();
  
  /** Observable stream of edit events */
  readonly edits$ = this.editSubject.asObservable();

  /**
   * Execute a context menu action
   */
  executeAction(type: TableActionType, servers: Server[]): void {
    const event: TableActionEvent = {
      type,
      targetIds: servers.map(s => s.id),
      servers,
      timestamp: new Date()
    };

    // Log the action for debugging/demonstration
    this.logAction(event);
    
    // Emit the event for subscribers
    this.actionSubject.next(event);
  }

  /**
   * Handle inline edit completion
   */
  handleEdit(event: InlineEditEvent): void {
    console.log('[TableActionFacade] Edit completed:', event);
    this.editSubject.next(event);
  }

  /**
   * Open Local Administration UI
   */
  openLocalAdmin(servers: Server[]): void {
    this.executeAction('openAdmin', servers);
  }

  /**
   * Move servers to another asset
   */
  moveServer(servers: Server[]): void {
    this.executeAction('moveServer', servers);
  }

  /**
   * Connect remote services (24h)
   */
  connectRemoteServices(servers: Server[]): void {
    this.executeAction('connectRemote', servers);
  }

  /**
   * Enable advanced debug mode
   */
  enableDebugMode(servers: Server[]): void {
    this.executeAction('debug', servers);
  }

  private logAction(event: TableActionEvent): void {
    const serverNames = event.servers.map(s => s.name).join(', ');
    
    switch (event.type) {
      case 'openAdmin':
        console.log(`[TableActionFacade] Opening Local Admin for: ${serverNames}`);
        break;
      case 'moveServer':
        console.log(`[TableActionFacade] Moving servers: ${serverNames}`);
        break;
      case 'connectRemote':
        console.log(`[TableActionFacade] Connecting remote services for: ${serverNames}`);
        break;
      case 'debug':
        console.log(`[TableActionFacade] Enabling Advanced Debug Mode for: ${serverNames}`);
        break;
    }
  }
}
