import {
  Component,
  inject,
  computed,
  signal,
  HostListener,
  ElementRef,
  ViewChild,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableStateStore } from '@app/store';
import { ASSET_TYPES, DATE_PRESETS, DatePreset, HARDWARE_TYPES, LICENSE_TYPES, SERVER_STATUSES, SERVER_TYPES } from '@app/models';


@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./filter-bar.component.html",
  styleUrl:"./filter-bar.component.css",
})
export class FilterBarComponent implements AfterViewInit {
  readonly store = inject(TableStateStore);
  
  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  // Filter options
  readonly statusOptions = signal([...SERVER_STATUSES]);
  readonly assetOptions = signal([...ASSET_TYPES]);
  readonly typeOptions = signal([...SERVER_TYPES]);
  readonly licenseOptions = signal([...LICENSE_TYPES]);
  readonly hardwareOptions = signal([...HARDWARE_TYPES]);
  readonly datePresets = DATE_PRESETS;

  // Custom date state
  readonly customDateFrom = signal<string>('');
  readonly customDateTo = signal<string>('');
  readonly showCustomDateInputs = signal(false);

  // Computed: filtered asset options based on search
  readonly filteredAssetOptions = computed(() => {
    const query = this.store.assetSearchQuery().toLowerCase();
    if (!query) return this.assetOptions();
    return this.assetOptions().filter(opt => 
      opt.toLowerCase().includes(query)
    );
  });

  // Computed: current date label
  readonly dateLabel = computed(() => {
    const filters = this.store.filters();
    if (!filters.dateFrom && !filters.dateTo) {
      return 'Last Updated';
    }
    
    // Check if it matches a preset
    const today = new Date().toISOString().split('T')[0];
    if (filters.dateTo === today) {
      const fromDate = new Date(filters.dateFrom!);
      const toDate = new Date(today);
      const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Last 24h';
      if (diffDays === 7) return 'Last 7 days';
      if (diffDays === 30) return 'Last 30 days';
      if (diffDays >= 364 && diffDays <= 366) return 'Last year';
    }
    
    return 'Custom Range';
  });

  // Computed: selected date preset
  readonly selectedDatePreset = computed((): DatePreset => {
    const filters = this.store.filters();
    if (!filters.dateFrom && !filters.dateTo) return 'all';
    
    const today = new Date().toISOString().split('T')[0];
    if (filters.dateTo === today && filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(today);
      const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'today';
      if (diffDays === 7) return 'week';
      if (diffDays === 30) return 'month';
      if (diffDays >= 364 && diffDays <= 366) return 'year';
    }
    
    return 'custom';
  });

  ngAfterViewInit(): void {
    // Focus search input when dropdown opens
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown') && !target.closest('button')) {
      this.store.closeAllDropdowns();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.store.closeAllDropdowns();
  }

  getFilterButtonClass(count: number): string {
    const baseClass = 'border';
    if (count > 0) {
      return `${baseClass} border-accent bg-accent/10`;
    }
    return `${baseClass} border-border`;
  }

  onSearchChange(value: string): void {
    this.store.setSearchQuery(value);
  }

  onSearchSubmit(): void {
    const query = this.store.filters().search;
    if (query.trim()) {
      this.store.addToSearchHistory(query.trim());
      this.store.closeAllDropdowns();
    }
  }

  selectSearchHistory(term: string): void {
    this.store.setSearchQuery(term);
    this.store.closeAllDropdowns();
  }

  onDatePresetChange(preset: DatePreset): void {
    if (preset === 'custom') {
      this.showCustomDateInputs.set(true);
      const filters = this.store.filters();
      this.customDateFrom.set(filters.dateFrom || '');
      this.customDateTo.set(filters.dateTo || '');
    } else {
      this.showCustomDateInputs.set(false);
      this.store.setDatePreset(preset);
      this.store.closeAllDropdowns();
    }
  }

  applyCustomDate(): void {
    const from = this.customDateFrom() || null;
    const to = this.customDateTo() || null;
    this.store.setDateRange(from, to);
    this.store.closeAllDropdowns();
  }
}
