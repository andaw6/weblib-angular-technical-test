import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ROWS_PER_PAGE_OPTIONS } from '@app/models';
import { TableStateStore } from '@app/store';

@Component({
  selector: 'app-table-pagination',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.css',
})
export class TablePaginationComponent {
  readonly rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS;
  readonly store = inject(TableStateStore);

  // Computed: page numbers for pagination
  readonly pageNumbers = computed(() => {
    const totalPages = this.store.totalPages();
    const currentPage = this.store.pagination().currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }

    return pages;
  });

}
