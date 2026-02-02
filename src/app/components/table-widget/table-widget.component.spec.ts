import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TableWidgetComponent } from './table-widget.component';
import { TableStateStore } from '@app/store';
import { EventEmitter } from '@angular/core';

describe('TableWidgetComponent', () => {
  let component: TableWidgetComponent;
  let fixture: ComponentFixture<TableWidgetComponent>;
  let store: TableStateStore;

  // beforeEach(async () => {
  //   await TestBed.configureTestingModule({
  //     imports: [TableWidgetComponent],
  //     providers: [TableStateStore]
  //   }).compileComponents();

  //   fixture = TestBed.createComponent(TableWidgetComponent);
  //   component = fixture.componentInstance;
  //   store = TestBed.inject(TableStateStore);

  //   // Initialisation des EventEmitter
  //   component.action = new EventEmitter();
  //   component.edit = new EventEmitter();
  //   component.export = new EventEmitter();

  //   // --- MOCK DU STORE EN UTILISANT LES MÉTHODES EXISTANTES ---
  //   // // Selection vide
  //   // store._selectedIds.set(new Set());

  //   // // filteredServers avec un serveur fictif
  //   // store._servers.set([{ id: 1, name: 'Server1', serial: '123', assetName: 'Asset1', status: 'Running', serverType: 'TypeA', license: 'LicA', hardware: 'HW1', lastCommDate: '2026-02-02' }]);

  //   // // Columns mock
  //   // store._columns.set([{ id: 'name', label: 'Name' }]);

  //   // Mock des méthodes showContextMenu/hideContextMenu pour éviter le DOM
  //   spyOn(store, 'showContextMenu').and.callThrough();
  //   spyOn(store, 'hideContextMenu').and.callThrough();

  //   fixture.detectChanges();
  // });


  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableWidgetComponent],
      providers: [TableStateStore]
    }).compileComponents();

    fixture = TestBed.createComponent(TableWidgetComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(TableStateStore);
    store.isTest = true;


    // Initialisation des EventEmitter
    component.action = new EventEmitter();
    component.edit = new EventEmitter();
    component.export = new EventEmitter();

    // --- MOCK DU STORE AVEC LES MÉTHODES PUBLIQUES ---
    store.resetForTests(); // vide les signaux et remet les valeurs par défaut
    store.setServersForTests([
      {
        id: 1,
        serial: '123',
        name: 'Server1',
        assetName: 'Asset1',
        version: 'v1.0',
        serverType: 'Apache',
        license: 'Enterprise',
        hardware: 'Physical',
        status: 'Running',
        warningsCount: 0,
        lastCommDate: '2026-02-02'
      }
    ]);

    store.setColumnsForTests([
      { id: 'name', label: 'Name', sortable: true, editable: true }
    ]);

    // Spy sur les méthodes qui interagissent avec le DOM
    spyOn(store, 'showContextMenu').and.callThrough();
    spyOn(store, 'hideContextMenu').and.callThrough();

    fixture.detectChanges();
  });


  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Event emissions', () => {
    it('should emit action event', () => {
      spyOn(component.action, 'emit');
      const event = { type: 'delete', targetIds: [1] } as any;
      component.onAction(event);
      expect(component.action.emit).toHaveBeenCalledWith(event);
    });

    it('should emit edit event', () => {
      spyOn(component.edit, 'emit');
      const event = { rowId: 1, field: 'name', value: 'new' } as any;
      component.onEdit(event);
      expect(component.edit.emit).toHaveBeenCalledWith(event);
    });
  });

  describe('Export CSV', () => {
    it('should generate CSV and emit export', () => {
      spyOn(component.export, 'emit');

      // Spy sur URL.createObjectURL et création du <a>
      spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
      const clickSpy = jasmine.createSpy('click');
      spyOn(document, 'createElement').and.callFake(() => ({
        href: '',
        download: '',
        click: clickSpy
      } as any));
      spyOn(URL, 'revokeObjectURL');

      component.onExport();

      expect(clickSpy).toHaveBeenCalled();
      expect(component.export.emit).toHaveBeenCalled();
    });
  });

  describe('Child components interaction', () => {
    it('should call onAction when DataTable emits action', () => {
      spyOn(component, 'onAction');
      component.onAction({ type: 'test', targetIds: [1] } as any);
      expect(component.onAction).toHaveBeenCalled();
    });

    it('should call onEdit when DataTable emits edit', () => {
      spyOn(component, 'onEdit');
      component.onEdit({ rowId: 1, field: 'name', value: 'test' } as any);
      expect(component.onEdit).toHaveBeenCalled();
    });
  });
});
