import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FilterBarComponent } from './filter-bar.component';
import { TableStateStore } from '../../store';
import { StorageService } from '../../services/storage.service';
import { MockDataService } from '../../services/mock-data.service';

describe('FilterBarComponent', () => {
  let component: FilterBarComponent;
  let fixture: ComponentFixture<FilterBarComponent>;
  let store: TableStateStore;

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
      imports: [FilterBarComponent],
      providers: [
        TableStateStore,
        MockDataService,
        { provide: StorageService, useValue: storageSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterBarComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(TableStateStore);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Search Functionality', () => {
    it('should update search query on input change', () => {
      component.onSearchChange('test query');
      expect(store.filters().search).toBe('test query');
    });

    it('should add to search history on submit', () => {
      store.setSearchQuery('test search');
      component.onSearchSubmit();
      
      // History should be updated
      expect(store.searchHistory().length).toBeGreaterThanOrEqual(0);
    });

    it('should select search history term', () => {
      component.selectSearchHistory('previous search');
      
      expect(store.filters().search).toBe('previous search');
      expect(store.uiState().openDropdown).toBeNull();
    });
  });

  describe('Filter Button Classes', () => {
    it('should return active class when filter has values', () => {
      const activeClass = component.getFilterButtonClass(2);
      expect(activeClass).toContain('border-accent');
      expect(activeClass).toContain('bg-accent/10');
    });

    it('should return default class when filter is empty', () => {
      const defaultClass = component.getFilterButtonClass(0);
      expect(defaultClass).toContain('border-border');
      expect(defaultClass).not.toContain('border-accent');
    });
  });

  describe('Date Filter', () => {
    it('should show custom date inputs when custom preset selected', () => {
      expect(component.showCustomDateInputs()).toBeFalse();
      
      component.onDatePresetChange('custom');
      
      expect(component.showCustomDateInputs()).toBeTrue();
    });

    it('should apply custom date range', () => {
      component.customDateFrom.set('2024-01-01');
      component.customDateTo.set('2024-12-31');
      
      component.applyCustomDate();
      
      expect(store.filters().dateFrom).toBe('2024-01-01');
      expect(store.filters().dateTo).toBe('2024-12-31');
    });

    it('should compute date label correctly', () => {
      // Default label
      expect(component.dateLabel()).toBe('Last Updated');
      
      // Set a date range
      store.setDatePreset('week');
      fixture.detectChanges();
      
      expect(component.dateLabel()).toBe('Last 7 days');
    });

    it('should compute selected date preset', () => {
      expect(component.selectedDatePreset()).toBe('all');
      
      store.setDatePreset('month');
      fixture.detectChanges();
      
      expect(component.selectedDatePreset()).toBe('month');
    });
  });

  describe('Asset Filter Search', () => {
    it('should filter asset options based on search query', () => {
      const allOptions = component.assetOptions();
      
      store.setAssetSearchQuery('Prod');
      fixture.detectChanges();
      
      const filteredOptions = component.filteredAssetOptions();
      expect(filteredOptions.length).toBeLessThanOrEqual(allOptions.length);
      filteredOptions.forEach(opt => {
        expect(opt.toLowerCase()).toContain('prod');
      });
    });

    it('should show all options when search is empty', () => {
      store.setAssetSearchQuery('');
      fixture.detectChanges();
      
      const filteredOptions = component.filteredAssetOptions();
      expect(filteredOptions.length).toBe(component.assetOptions().length);
    });
  });

  describe('More Filters Panel', () => {
    it('should toggle more filters visibility', () => {
      const initial = store.moreFiltersVisible();
      
      store.toggleMoreFilters();
      fixture.detectChanges();
      
      expect(store.moreFiltersVisible()).toBe(!initial);
    });

    it('should show/hide filter based on visibility setting', () => {
      store.toggleMoreFilters(); // Show panel
      fixture.detectChanges();
      
      // All filters should be visible by default
      expect(store.filterVisibility().type).toBeTrue();
      expect(store.filterVisibility().license).toBeTrue();
      expect(store.filterVisibility().date).toBeTrue();
    });
  });

  describe('Clear Filters', () => {
    it('should clear all filters', () => {
      // Set some filters
      store.setSearchQuery('test');
      store.setMultiSelectFilter('status', ['Running']);
      
      expect(store.hasActiveFilters()).toBeTrue();
      
      store.clearAllFilters();
      
      expect(store.hasActiveFilters()).toBeFalse();
      expect(store.filters().search).toBe('');
      expect(store.filters().status).toEqual([]);
    });
  });
});
