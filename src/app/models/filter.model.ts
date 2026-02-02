/**
 * Filter type enumeration
 */
export type FilterType = 'search' | 'multi-select' | 'date-range' | 'radio';

/**
 * Filter definition model for configurable filters
 */
export interface FilterDefinition<T = string> {
  id: string;
  label: string;
  type: FilterType;
  options: T[];
  optionProvider?: () => T[];
  searchable?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

/**
 * Active filter state
 */
export interface ActiveFilters {
  search: string;
  status: string[];
  asset: string[];
  type: string[];
  license: string[];
  hardware: string[];
  dateFrom: string | null;
  dateTo: string | null;
}

/**
 * Date range preset options
 */
export type DatePreset = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export interface DatePresetOption {
  value: DatePreset;
  label: string;
}

export const DATE_PRESETS: DatePresetOption[] = [
  { value: 'all', label: 'All time' },
  { value: 'today', label: 'Last 24h' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'month', label: 'Last 30 days' },
  { value: 'year', label: 'Last year' },
  { value: 'custom', label: 'Custom range' }
];

/**
 * Filter visibility state for More Filters panel
 */
export interface FilterVisibility {
  type: boolean;
  license: boolean;
  date: boolean;
}

/**
 * Initial/default filter state
 */
export const DEFAULT_FILTERS: ActiveFilters = {
  search: '',
  status: [],
  asset: [],
  type: [],
  license: [],
  hardware: [],
  dateFrom: null,
  dateTo: null
};

export const DEFAULT_FILTER_VISIBILITY: FilterVisibility = {
  type: true,
  license: true,
  date: true
};
