import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
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
          <div class="flex items-center gap-2">
            <div class="bg-indigo-600 text-white p-1.5 rounded-lg shrink-0">
              <lucide-icon [img]="FileText" class="w-5 h-5" aria-hidden="true"></lucide-icon>
            </div>
            <div>
              <h1 class="text-xl font-bold font-display tracking-tight text-slate-900 leading-tight">
                PDF-openSky
              </h1>
            </div>
          </div>
        </div>
        
        <app-search-bar [isProcessing]="isProcessing"></app-search-bar>
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

  onOpenApiKeyModal() {
    this.openApiKeyModal.emit();
  }
}
