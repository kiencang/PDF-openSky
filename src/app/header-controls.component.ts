import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, FileText, Cpu, Key } from 'lucide-angular';
import { SearchBarComponent } from './search-bar.component';

@Component({
  selector: 'app-header-controls',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, SearchBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bg-white border-b border-slate-200 relative z-40">
      <div class="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 md:h-16 md:py-0 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
        <div class="flex items-center gap-4">
          <!-- Logo and Title -->
          @if (isBusy()) {
            <div 
              class="flex items-center gap-2.5 p-1.5 -m-1.5 rounded-xl cursor-not-allowed opacity-80 select-none transition-all"
              title="Đang trong quá trình dịch, tính năng quay về trang chủ tạm thời bị khóa"
              aria-disabled="true"
            >
              <div class="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0 shadow-sm">
                <lucide-icon [img]="FileText" class="w-5 h-5" aria-hidden="true"></lucide-icon>
              </div>
              <div>
                <span class="text-xl font-bold font-display tracking-tight text-slate-900 leading-tight">
                  PDF-openSky
                </span>
              </div>
            </div>
          } @else {
            <button 
              type="button"
              (click)="logoClick.emit()"
              class="group flex items-center gap-2.5 p-1.5 -m-1.5 rounded-xl cursor-pointer hover:bg-slate-100/80 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500"
              title="Nhấn để quay về giao diện ban đầu"
              aria-label="PDF-openSky - Nhấn để quay về giao diện ban đầu"
            >
              <div class="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0 group-hover:bg-indigo-700 transition-colors shadow-sm">
                <lucide-icon [img]="FileText" class="w-5 h-5" aria-hidden="true"></lucide-icon>
              </div>
              <div>
                <span class="text-xl font-bold font-display tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">
                  PDF-openSky
                </span>
              </div>
            </button>
          }
        </div>
        
        <app-search-bar [isProcessing]="isProcessing" (searchingChange)="isSearchingKeyword.set($event)"></app-search-bar>
      </div>
    </header>
  `
})
export class HeaderControlsComponent {
  readonly FileText = FileText;
  readonly Cpu = Cpu;
  readonly Key = Key;

  @Input() isProcessing = false;
  @Input() selectedModel = 'google/gemini-2.5-flash';
  @Input() hasUserApiKey = false;
  
  @Output() openApiKeyModal = new EventEmitter<void>();
  @Output() logoClick = new EventEmitter<void>();

  isSearchingKeyword = signal<boolean>(false);

  isBusy(): boolean {
    return this.isProcessing || this.isSearchingKeyword();
  }

  onOpenApiKeyModal() {
    this.openApiKeyModal.emit();
  }
}
