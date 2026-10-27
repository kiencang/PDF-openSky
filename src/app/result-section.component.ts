import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ElementRef, viewChild, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Download, Maximize, Minimize, Loader2, Clock, FileText } from 'lucide-angular';

@Component({
  selector: 'app-result-section',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-white ring-1 ring-slate-900/5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col overflow-hidden transition-all duration-300"
             [class.fixed]="isFullscreen" [class.inset-0]="isFullscreen" [class.z-50]="isFullscreen" [class.rounded-none]="isFullscreen"
             [class.relative]="!isFullscreen" [class.rounded-2xl]="!isFullscreen" [class.h-full]="!isFullscreen" [class.min-h-[600px]]="!isFullscreen" [class.lg:min-h-0]="!isFullscreen">
      
      <!-- Result Header -->
      <div class="p-4 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between shrink-0 z-10 sticky top-0">
        <h2 class="text-sm font-semibold text-slate-900 uppercase tracking-wider">Bản dịch • Đọc tốt nhất trên màn hình lớn</h2>
        
        @if (resultHtml) {
          <div class="flex items-center gap-2">
            <button (click)="downloadHtml.emit()" class="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-md transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" title="Tải về bản dịch.">
              <lucide-icon [img]="DownloadIcon" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
              Download
            </button>
            <div class="w-px h-6 bg-slate-200 mx-1"></div>
            <button (click)="toggleFullscreen.emit()" class="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer" [title]="isFullscreen ? 'Thu nhỏ' : 'Đọc toàn màn hình.'" [attr.aria-label]="isFullscreen ? 'Thu nhỏ' : 'Đọc toàn màn hình.'">
              @if (isFullscreen) {
                <lucide-icon [img]="MinimizeIcon" class="w-4 h-4" aria-hidden="true"></lucide-icon>
              } @else {
                <lucide-icon [img]="MaximizeIcon" class="w-4 h-4" aria-hidden="true"></lucide-icon>
              }
            </button>
          </div>
        }
      </div>

      <!-- Result Content -->
      <div class="flex-1 relative bg-slate-50/50">
        @if (isProcessing) {
          <div class="absolute inset-0 bg-white z-10 flex flex-col overflow-hidden">
            <!-- Overlay with spinner -->
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-white/40 z-20">
              <lucide-icon [img]="Loader2Icon" class="w-10 h-10 text-indigo-600 animate-spin mb-4" aria-hidden="true"></lucide-icon>
              <p class="text-slate-900 font-medium">{{ progressMessage }}</p>
              <div class="mt-3 px-4 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm flex items-center gap-2 text-indigo-600 font-mono font-medium text-sm">
                <lucide-icon [img]="ClockIcon" class="w-4 h-4" aria-hidden="true"></lucide-icon>
                {{ formattedTime }}
              </div>
              <p class="text-slate-500 text-sm mt-4 max-w-md text-center">Thời gian thao tác sẽ cần từ 2 cho đến khoảng 5 phút, tùy thuộc vào độ dài và mức độ phức tạp của nội dung.</p>
            </div>
            <!-- Skeleton UI (Full Single Column Document) -->
            <div class="p-8 space-y-6 animate-pulse select-none relative h-full overflow-hidden">
              <!-- Header / Title section -->
              <div class="space-y-2">
                <div class="h-7 bg-slate-200 rounded-lg w-3/4"></div>
                <div class="h-3.5 bg-slate-100 rounded w-2/5"></div>
              </div>

              <!-- Section 1: Introduction -->
              <div class="space-y-3 pt-1">
                <div class="h-5 bg-slate-200 rounded w-1/4"></div>
                <div class="space-y-2">
                  <div class="h-3.5 bg-slate-200 rounded w-full"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-11/12"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-full"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-4/5"></div>
                </div>
              </div>

              <!-- Simulated Table / Callout Box -->
              <div class="p-4 rounded-xl border border-slate-200/70 bg-slate-50/70 space-y-3">
                <div class="h-4 bg-slate-200 rounded w-1/3"></div>
                <div class="grid grid-cols-4 gap-3 pt-1">
                  <div class="h-3 bg-slate-200 rounded"></div>
                  <div class="h-3 bg-slate-200 rounded"></div>
                  <div class="h-3 bg-slate-200 rounded"></div>
                  <div class="h-3 bg-slate-200 rounded"></div>
                </div>
                <div class="grid grid-cols-4 gap-3">
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                </div>
                <div class="grid grid-cols-4 gap-3">
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                  <div class="h-2.5 bg-slate-200/70 rounded"></div>
                </div>
              </div>

              <!-- Section 2: Methodology / Analysis -->
              <div class="space-y-3">
                <div class="h-5 bg-slate-200 rounded w-1/3"></div>
                <div class="space-y-2">
                  <div class="h-3.5 bg-slate-200 rounded w-full"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-full"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-5/6"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-3/4"></div>
                </div>
              </div>

              <!-- Section 3: Detailed Discussion -->
              <div class="space-y-3">
                <div class="h-5 bg-slate-200 rounded w-1/4"></div>
                <div class="space-y-2">
                  <div class="h-3.5 bg-slate-200 rounded w-full"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-11/12"></div>
                  <div class="h-3.5 bg-slate-200 rounded w-4/5"></div>
                </div>
              </div>

              <!-- Bottom Gradient Fade-out -->
              <div class="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none z-10"></div>
            </div>
          </div>
        }

        @if (!resultHtml && !isProcessing) {
          <div class="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div class="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-indigo-100/50">
              <lucide-icon [img]="FileTextIcon" class="w-12 h-12 text-indigo-300" aria-hidden="true"></lucide-icon>
            </div>
            <h3 class="text-lg font-semibold text-slate-700 mb-2">Khu vực hiển thị kết quả</h3>
            <p class="text-sm text-slate-500 max-w-md">Bản dịch/chuyển đổi định dạng của bạn sẽ xuất hiện tại đây. Bạn có thể tải về để lưu trữ sau khi hoàn tất... Ngoài ra công cụ tự động lưu trữ 10 bản dịch gần nhất ở mục "Lịch sử dịch".</p>
          </div>
        }

        @if (resultHtml) {
          <div class="absolute inset-0 overflow-hidden">
            <iframe #previewIframe id="preview-iframe" class="w-full h-full border-0 bg-white" sandbox="allow-scripts" title="Bản xem trước tài liệu đã dịch"></iframe>
          </div>
        }
      </div>
    </section>
  `
})
export class ResultSectionComponent {
  readonly DownloadIcon = Download;
  readonly MaximizeIcon = Maximize;
  readonly MinimizeIcon = Minimize;
  readonly Loader2Icon = Loader2;
  readonly ClockIcon = Clock;
  readonly FileTextIcon = FileText;

  @Input() isFullscreen = false;
  @Input() isProcessing = false;
  @Input() resultHtml: string | null = null;
  @Input() progressMessage = '';
  @Input() formattedTime = '';

  @Output() downloadHtml = new EventEmitter<void>();
  @Output() toggleFullscreen = new EventEmitter<void>();

  previewIframe = viewChild<ElementRef<HTMLIFrameElement>>('previewIframe');

  // This helps react to inner changes via hook or effect.
  // Using an effect in the parent is generally required, but we can do it inside ngOnChanges or effect.
  // We'll use a signal driven approach
  private htmlSignal = signal<string | null>(null);

  @Input({ required: true })
  set htmlContent(val: string | null) {
    this.htmlSignal.set(val);
  }

  constructor() {
    effect(() => {
      const html = this.htmlSignal();
      const iframe = this.previewIframe();
      
      if (html && iframe?.nativeElement) {
         // Using a timeout just to make sure the view is updated
         setTimeout(() => {
           if (iframe?.nativeElement) {
             iframe.nativeElement.srcdoc = html;
           }
         }, 50);
      }
    });
  }
}
