import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ColumnDefinition, FilterVisibility, DEFAULT_FILTER_VISIBILITY } from '../models';

const STORAGE_KEYS = {
  COLUMN_ORDER: 'tableWidget_columnOrder',
  FILTER_VISIBILITY: 'tableWidget_filterVisibility',
  SEARCH_HISTORY: 'tableWidget_searchHistory',
  MORE_FILTERS_VISIBLE: 'tableWidget_moreFiltersVisible'
} as const;

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Column Order
  getColumnOrder(): ColumnDefinition[] | null {
    if (!this.isBrowser) return null;
    const stored = localStorage.getItem(STORAGE_KEYS.COLUMN_ORDER);
    return stored ? JSON.parse(stored) : null;
  }

  setColumnOrder(columns: ColumnDefinition[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.COLUMN_ORDER, JSON.stringify(columns));
  }

  // Filter Visibility
  getFilterVisibility(): FilterVisibility {
    if (!this.isBrowser) return DEFAULT_FILTER_VISIBILITY;
    const stored = localStorage.getItem(STORAGE_KEYS.FILTER_VISIBILITY);
    return stored ? JSON.parse(stored) : DEFAULT_FILTER_VISIBILITY;
  }

  setFilterVisibility(visibility: FilterVisibility): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.FILTER_VISIBILITY, JSON.stringify(visibility));
  }

  // Search History
  getSearchHistory(): string[] {
    if (!this.isBrowser) return [];
    const stored = localStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return stored ? JSON.parse(stored) : [];
  }

  setSearchHistory(history: string[]): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(history));
  }

  addToSearchHistory(query: string): string[] {
    const history = this.getSearchHistory();
    const updated = [query, ...history.filter(q => q !== query)].slice(0, 3);
    this.setSearchHistory(updated);
    return updated;
  }

  // More Filters Visibility
  getMoreFiltersVisible(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(STORAGE_KEYS.MORE_FILTERS_VISIBLE) === 'true';
  }

  setMoreFiltersVisible(visible: boolean): void {
    if (!this.isBrowser) return;
    localStorage.setItem(STORAGE_KEYS.MORE_FILTERS_VISIBLE, String(visible));
  }

  // Clear all storage
  clearAll(): void {
    if (!this.isBrowser) return;
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}
