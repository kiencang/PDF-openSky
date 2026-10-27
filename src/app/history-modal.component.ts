import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, X, FileText, Trash2, Eye, Clock, Timer, Download, Cpu, Coins } from 'lucide-angular';
import { TranslatedDoc } from './storage.service';

@Component({
  selector: 'app-history-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="history-title" 
      (click)="closeModal.emit()"
      (keydown.escape)="closeModal.emit()"
      tabindex="0"
    >
      <div 
        class="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-0 animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[80vh]" 
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
        tabindex="0"
      >
        
        <!-- Header -->
        <div class="p-5 border-b border-slate-100 bg-slate-50/50">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <lucide-icon [img]="Clock" class="w-4 h-4"></lucide-icon>
              </div>
              <h3 id="history-title" class="text-lg font-semibold text-slate-900">Lịch sử dịch/chuyển đổi gần đây</h3>
            </div>
            <button (click)="closeModal.emit()" class="text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors focus:outline-none rounded-full p-2 cursor-pointer shrink-0" aria-label="Đóng">
              <lucide-icon [img]="X" class="w-5 h-5" aria-hidden="true"></lucide-icon>
            </button>
          </div>
          <div class="mt-3.5 bg-amber-50/70 border border-amber-200/60 rounded-xl p-3 sm:px-4">
            <p class="text-xs text-amber-900/90 leading-relaxed">
              Danh sách 10 file gần nhất bạn dịch/chuyển đổi định dạng. Chúng được <strong class="font-semibold text-amber-950">lưu cục bộ trên trình duyệt đang dùng</strong> để tiện xem lại. Hãy chủ động "Tải bản dịch" để lưu trữ lâu dài, danh sách này có thể bị mất nếu bạn xóa dữ liệu web.
            </p>
          </div>
        </div>

        <!-- Body -->
        <div class="p-6 overflow-y-auto space-y-4 flex-1 pb-8">
          @if (historyItems.length === 0) {
            <div class="flex flex-col items-center justify-center py-12 text-center">
              <div class="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                <lucide-icon [img]="FileText" class="w-8 h-8"></lucide-icon>
              </div>
              <h4 class="text-base font-semibold text-slate-800 mb-1">Chưa có lịch sử dịch</h4>
              <p class="text-sm text-slate-500 max-w-sm">
                Các tài liệu bạn dịch thành công sẽ hiển thị ở đây để xem lại nhanh chóng bất cứ lúc nào.
              </p>
            </div>
          } @else {
            <div class="flex flex-col gap-3">
              @for (item of historyItems; track item.id) {
                <div class="p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col gap-3 group"
                     [ngClass]="item.id === activeId 
                       ? 'bg-indigo-50/40 border-indigo-300 ring-1.5 ring-indigo-400/30 shadow-xs' 
                       : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:shadow-md hover:bg-slate-50/30'">
                  
                  <!-- Top Row: Document info & Quick actions -->
                  <div class="flex items-start justify-between gap-3">
                    <button type="button" class="flex items-start text-left gap-3.5 flex-1 min-w-0 cursor-pointer focus:outline-none" (click)="selectItem.emit(item)">
                      <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors" [ngClass]="item.id === activeId ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100'">
                        <lucide-icon [img]="FileText" class="w-5 h-5"></lucide-icon>
                      </div>
                      <div class="min-w-0 flex-1">
                        <div class="text-sm font-semibold truncate group-hover:text-indigo-600 transition-colors flex items-center gap-2" [ngClass]="item.id === activeId ? 'text-indigo-700' : 'text-slate-900'" [title]="item.vietnameseTitle">
                          <span class="truncate">{{ item.vietnameseTitle }}</span>
                          @if (item.id === activeId) {
                            <span class="text-[9px] font-bold uppercase tracking-wider bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded-md shrink-0">Đang xem</span>
                          }
                        </div>
                        <div class="text-xs text-slate-500 truncate mt-1" [title]="item.originalFileName">
                          Tên tệp gốc: <span class="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 border border-slate-200/60">{{ item.originalFileName }}</span>
                        </div>
                        <div class="flex items-center gap-2 mt-2 flex-wrap">
                          @if (item.durationSeconds !== undefined && item.durationSeconds !== null) {
                            <span class="h-5 px-2 text-[10px] font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200/60 font-mono inline-flex items-center justify-center gap-1 leading-none shrink-0" [title]="'Thời gian dịch: ' + item.durationSeconds + ' giây'">
                              <lucide-icon [img]="Timer" class="w-3 h-3 text-slate-500 shrink-0"></lucide-icon>
                              <span>{{ item.durationSeconds }}s</span>
                            </span>
                          }
                          <span class="h-5 px-2 text-[10px] uppercase tracking-wider font-semibold rounded-full inline-flex items-center justify-center leading-none shrink-0"
                                [ngClass]="{
                                  'bg-emerald-50 text-emerald-700 border border-emerald-200/50': item.mode === 'zero_svg',
                                  'bg-sky-50 text-sky-700 border border-sky-200/50': item.mode === 'zero_math',
                                  'bg-indigo-50 text-indigo-700 border border-indigo-200/50': item.mode === 'normal',
                                  'bg-amber-50 text-amber-700 border border-amber-200/50': item.mode === 'phase1',
                                  'bg-pink-50 text-pink-700 border border-pink-200/50': item.mode === 'phase2'
                                }">
                            {{ getModeLabel(item.mode) }}
                          </span>
                          @if (item.model) {
                            <span class="h-5 px-2 text-[10px] tracking-wider font-bold rounded-full bg-violet-100 text-violet-700 border border-violet-200 shadow-2xs font-mono inline-flex items-center gap-1 justify-center leading-none shrink-0" [title]="item.model">
                              <lucide-icon [img]="Cpu" class="w-3 h-3"></lucide-icon>
                              {{ getModelLabel(item.model) }}
                            </span>
                          }
                          <span class="text-[11px] text-slate-400 inline-flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                            <lucide-icon [img]="Clock" class="w-3 h-3"></lucide-icon>
                            {{ formatDate(item.timestamp) }}
                          </span>
                        </div>
                      </div>
                    </button>

                    <!-- Top Right Actions: Delete confirm or View/Delete -->
                    <div class="flex items-center gap-1.5 shrink-0 pt-0.5">
                      @if (deletingItemId === item.id) {
                        <div class="flex items-center gap-1.5 bg-red-50 rounded-lg p-1.5 border border-red-200 animate-in fade-in slide-in-from-right-4 duration-200 shadow-2xs">
                          <span class="text-xs text-red-600 font-medium px-1">Bạn muốn xóa?</span>
                          <button (click)="confirmDelete(item.id!, $event)" 
                                  class="p-1 px-2.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors cursor-pointer shadow-2xs" 
                                  title="Chắc chắn xóa">
                            Xóa
                          </button>
                          <button (click)="cancelDelete($event)" 
                                  class="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-200/80 rounded-full transition-colors cursor-pointer focus:outline-none" 
                                  title="Hủy">
                            <lucide-icon [img]="X" class="w-3.5 h-3.5"></lucide-icon>
                          </button>
                        </div>
                      } @else {
                        <button (click)="selectItem.emit(item)" 
                                class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 rounded-lg transition-colors cursor-pointer border border-indigo-200/60" 
                                title="Mở xem lại bản dịch">
                          <lucide-icon [img]="Eye" class="w-3.5 h-3.5"></lucide-icon>
                          <span>Xem lại</span>
                        </button>
                        <button (click)="onDeleteRequest(item.id!, $event)" 
                                class="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200" 
                                title="Xóa khỏi lịch sử">
                          <lucide-icon [img]="Trash2" class="w-4 h-4"></lucide-icon>
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Bottom Row: Token info & Bottom-right Download buttons -->
                  <div class="pt-2.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <!-- Left: Token Info -->
                    <div class="flex items-center">
                      @if (item.promptTokens !== undefined || item.completionTokens !== undefined) {
                        <div class="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50/80 px-2.5 py-1 rounded-md w-fit border border-amber-200/60 font-mono shadow-2xs">
                          <lucide-icon [img]="Coins" class="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true"></lucide-icon>
                          <span>Input: <strong class="font-bold text-amber-950">{{ formatKTokens(item.promptTokens) }}K</strong> token</span>
                          <span class="text-amber-300 select-none">|</span>
                          <span>Output: <strong class="font-bold text-amber-950">{{ formatKTokens(item.completionTokens) }}K</strong> token</span>
                        </div>
                      }
                    </div>

                    <!-- Right: Download Buttons (Tải file gốc, Tải bản dịch) -->
                    <div class="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <!-- 1. Tải file gốc -->
                      @if (item.originalFileBlob && item.originalFileBlob.byteLength > 0) {
                        <button 
                          type="button" 
                          (click)="downloadOriginalFromHistory(item, $event)" 
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs" 
                          title="Tải về file gốc ban đầu"
                        >
                          <lucide-icon [img]="Download" class="w-3.5 h-3.5"></lucide-icon>
                          <span>Tải file gốc</span>
                        </button>
                      } @else {
                        <button 
                          type="button" 
                          disabled 
                          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border border-slate-200/60 rounded-lg cursor-not-allowed opacity-60" 
                          title="Không có file gốc lưu trữ"
                        >
                          <lucide-icon [img]="Download" class="w-3.5 h-3.5"></lucide-icon>
                          <span>Tải file gốc</span>
                        </button>
                      }

                      <!-- 2. Tải bản dịch -->
                      <button 
                        type="button" 
                        (click)="downloadTranslationFromHistory(item, $event)" 
                        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 border border-indigo-200 rounded-lg transition-all duration-150 cursor-pointer shadow-2xs" 
                        title="Tải về file bản dịch HTML"
                      >
                        <lucide-icon [img]="Download" class="w-3.5 h-3.5"></lucide-icon>
                        <span>Tải bản dịch</span>
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class HistoryModalComponent {
  readonly X = X;
  readonly FileText = FileText;
  readonly Trash2 = Trash2;
  readonly Eye = Eye;
  readonly Clock = Clock;
  readonly Timer = Timer;
  readonly Download = Download;
  readonly Cpu = Cpu;
  readonly Coins = Coins;

  @Input() historyItems: TranslatedDoc[] = [];
  @Input() activeId: number | null = null;
  @Output() selectItem = new EventEmitter<TranslatedDoc>();
  @Output() deleteItem = new EventEmitter<number>();
  @Output() closeModal = new EventEmitter<void>();

  deletingItemId: number | null = null;

  getModeLabel(mode: string): string {
    switch (mode) {
      case 'zero_math': return 'KH Xã hội';
      case 'zero_svg': return 'KH tổng hợp';
      case 'normal': return 'Toán Chuyên Ngành';
      case 'phase1': return 'Chuyển định dạng (Phase 1)';
      case 'phase2': return 'Dịch HTML (Phase 2)';
      default: return mode;
    }
  }

  getModelLabel(model?: string): string {
    if (!model) return '';
    if (model === 'flash' || model === 'gemini-flash') return 'google/gemini-2.5-flash';
    if (model === 'pro' || model === 'gemini-pro') return 'google/gemini-2.5-pro';
    return model.startsWith('~') ? model.substring(1) : model;
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  }

  onDeleteRequest(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.deletingItemId = id;
  }

  confirmDelete(id: number, event: MouseEvent) {
    event.stopPropagation();
    this.deleteItem.emit(id);
    this.deletingItemId = null;
  }

  cancelDelete(event: MouseEvent) {
    event.stopPropagation();
    this.deletingItemId = null;
  }

  downloadOriginalFromHistory(item: TranslatedDoc, event: MouseEvent) {
    event.stopPropagation();
    if (!item.originalFileBlob || item.originalFileBlob.byteLength === 0) return;
    const mimeType = item.mimeType || (item.mode === 'phase2' ? 'text/html' : 'application/pdf');
    const blob = new Blob([item.originalFileBlob], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.originalFileName || 'original_document';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadTranslationFromHistory(item: TranslatedDoc, event: MouseEvent) {
    event.stopPropagation();
    if (!item.content) return;
    const blob = new Blob([item.content], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = item.originalFileName 
      ? item.originalFileName.replace(/\.[^/.]+$/, "") 
      : (item.vietnameseTitle || 'document');
    const suffix = item.mode === 'phase1' ? '_converted' : '_translated';
    a.download = `${baseName}${suffix}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  formatKTokens(tokens?: number): string {
    if (tokens === undefined || tokens === null) return '0';
    return (tokens / 1000).toFixed(1);
  }
}
