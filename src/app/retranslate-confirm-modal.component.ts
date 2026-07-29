import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, RefreshCw, Info, X } from 'lucide-angular';

@Component({
  selector: 'app-retranslate-confirm-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
           (click)="onCancel()"
           (keydown.escape)="onCancel()"
           tabindex="-1">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative transform transition-all animate-in zoom-in-95 duration-200"
             (click)="$event.stopPropagation()">
          
          <!-- Close button -->
          <button (click)="onCancel()" 
                  class="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Đóng">
            <lucide-icon [img]="X" class="w-5 h-5"></lucide-icon>
          </button>

          <!-- Header Icon & Title -->
          <div class="flex items-start gap-3.5 mb-4">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <lucide-icon [img]="RefreshCw" class="w-5 h-5"></lucide-icon>
            </div>
            <div>
              <h3 class="text-base font-semibold text-slate-900 leading-snug">Dịch lại bằng mô hình AI mới</h3>
              <p class="text-xs text-slate-500 mt-0.5">Xác nhận thay đổi mô hình xử lý tài liệu</p>
            </div>
          </div>

          <!-- Main Body Prompt -->
          <div class="text-sm text-slate-700 leading-relaxed">
            Bạn vừa đổi sang mô hình <strong class="text-indigo-600 font-semibold">{{ newModelName }}</strong>. Bạn có muốn xóa kết quả xem trước hiện tại và chuẩn bị dịch lại bằng mô hình này không?
          </div>

          <!-- Note / PS Box -->
          <div class="mt-4 p-3.5 bg-amber-50/80 border border-amber-200/60 rounded-xl text-xs text-amber-900 leading-relaxed flex items-start gap-2.5">
            <lucide-icon [img]="Info" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></lucide-icon>
            <div>
              <span class="font-semibold text-amber-950">Ghi chú:</span> Chúng tôi chỉ xóa kết quả xem trước ở cột bên phải. Bản dịch vừa hoàn thành của bạn vẫn tồn tại an toàn trong <strong class="font-semibold text-amber-950">"Lịch sử dịch"</strong>.
            </div>
          </div>

          <!-- Buttons -->
          <div class="mt-6 flex items-center justify-end gap-2.5">
            <button (click)="onCancel()"
                    type="button"
                    class="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300 transition-colors cursor-pointer">
              Hủy bỏ
            </button>
            <button (click)="onConfirm()"
                    type="button"
                    class="px-4 py-2 text-xs font-medium text-white bg-indigo-600 border border-transparent rounded-xl hover:bg-indigo-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors cursor-pointer flex items-center gap-1.5">
              <lucide-icon [img]="RefreshCw" class="w-3.5 h-3.5"></lucide-icon>
              <span>Đồng ý dịch lại</span>
            </button>
          </div>

        </div>
      </div>
    }
  `
})
export class RetranslateConfirmModalComponent {
  readonly RefreshCw = RefreshCw;
  readonly Info = Info;
  readonly X = X;

  @Input() isOpen = false;
  @Input() newModelName = '';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
