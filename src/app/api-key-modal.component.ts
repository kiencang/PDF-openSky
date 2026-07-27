import { Component, ChangeDetectionStrategy, EventEmitter, Input, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Key, X, ExternalLink, EyeOff, Eye, Trash2, Plus, RotateCcw, Cpu, ArrowUp, ArrowDown, Brain, Sliders, Search } from 'lucide-angular';
import { OpenRouterModelConfig, DEFAULT_OPENROUTER_MODELS, ReasoningEffort } from './openrouter.service';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200" 
      role="dialog" 
      aria-modal="true" 
      aria-labelledby="api-key-title" 
      (click)="closeModal.emit()"
      (keydown.escape)="closeModal.emit()"
      tabindex="0"
    >
      <div 
        class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col p-0 animate-in zoom-in-95 duration-200 overflow-hidden" 
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
        tabindex="0"
      >
        <!-- Header -->
        <div class="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <lucide-icon [img]="Key" class="w-5 h-5" aria-hidden="true"></lucide-icon>
            </div>
            <div>
              <h3 id="api-key-title" class="text-base font-bold text-slate-900">Cấu hình OpenRouter & Mô hình AI</h3>
              <p class="text-xs text-slate-500">Quản lý API Key và tùy chỉnh danh sách model AI theo nhu cầu</p>
            </div>
          </div>
          <button (click)="closeModal.emit()" class="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors focus:outline-none rounded-full p-2 cursor-pointer" aria-label="Đóng cấu hình">
            <lucide-icon [img]="XIcon" class="w-5 h-5" aria-hidden="true"></lucide-icon>
          </button>
        </div>

        <!-- Scrollable Content -->
        <div class="p-6 overflow-y-auto space-y-6 flex-1 text-sm">

          <!-- OpenRouter Overview & Pricing Note -->
          <div class="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4.5 text-xs text-slate-700 leading-relaxed space-y-2.5">
            <p>
              Ứng dụng kết nối trực tiếp với OpenRouter API, cổng trung gian này sẽ kết nối với bất cứ model AI nào mà nó có (hiện có gần 400 model). Vì dịch là nhiệm vụ khó, bạn hãy chọn các model AI chất lượng nhất trong khả năng. Ứng dụng lưu trữ sẵn một số model mặc định chất lượng cao, bạn có thể tự do điều chỉnh lại thành các model khác theo ý muốn.
            </p>
            <p>
              Một số model thuộc nhóm hàng đầu có chi phí lớn, có thể dao động từ 10 - 30$/1M token đầu ra, để kiểm soát chi phí tốt hơn, bạn nên nắm rõ giá của chúng. Hãy vào trang: 
              <a href="https://openrouter.ai/models" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold inline-flex items-center gap-0.5">
                https://openrouter.ai/models
                <lucide-icon [img]="ExternalLink" class="w-3 h-3" aria-hidden="true"></lucide-icon>
              </a>, rồi nhập mã model vào ô "Search models" để biết thông tin giá cụ thể tại thời điểm tra cứu.
            </p>
          </div>
          
          <!-- Section 1: OpenRouter API Key -->
          <div class="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-4">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold uppercase tracking-wider text-slate-700">1. OpenRouter API Key</span>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  [ngClass]="hasUserApiKey ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'"
                >
                  {{ hasUserApiKey ? 'Đã thiết lập Key' : 'Chưa nhập Key' }}
                </span>
              </div>
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-medium transition-colors cursor-pointer">
                <lucide-icon [img]="ExternalLink" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
                <span>Lấy API Key trên openrouter.ai/keys</span>
              </a>
            </div>

            <div class="relative">
              <input 
                id="openrouter-custom-api-key"
                [type]="showKeyPlain() ? 'text' : 'password'"
                [(ngModel)]="tempApiKey"
                class="block w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-mono tracking-wide"
                placeholder="Nhập sk-or-v1-..."
              >
              <button 
                type="button"
                (click)="toggleShowKeyPlain()"
                class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                aria-label="Hiện/Ẩn API Key"
              >
                <lucide-icon [img]="showKeyPlain() ? EyeOff : Eye" class="w-4 h-4"></lucide-icon>
              </button>
            </div>
            <p class="text-[11px] text-slate-500 italic">
              Khóa API được lưu cục bộ an toàn trong trình duyệt của bạn (<code class="font-mono text-[10px] bg-slate-200/60 px-1 py-0.5 rounded text-indigo-700">LocalStorage</code>).
            </p>
          </div>

          <!-- Section 2: Custom Models List -->
          <div class="space-y-3">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div class="flex items-center gap-2">
                <lucide-icon [img]="Cpu" class="w-4 h-4 text-indigo-600"></lucide-icon>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  2. Danh sách Mô hình AI dịch file PDF (Tối đa 7 Models)
                  <span class="text-indigo-600 font-mono font-bold">({{ tempModels().length }}/7)</span>
                </h4>
              </div>
              <div class="flex items-center gap-2">
                <button 
                  type="button"
                  (click)="addModelRow()"
                  [disabled]="tempModels().length >= 7"
                  class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium border rounded-lg transition-colors font-semibold"
                  [ngClass]="tempModels().length >= 7 
                    ? 'text-slate-400 bg-slate-100 border-slate-200 cursor-not-allowed opacity-60' 
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-200 cursor-pointer'"
                  [title]="tempModels().length >= 7 ? 'Đã đạt giới hạn tối đa 7 model' : 'Thêm model mới'"
                >
                  <lucide-icon [img]="Plus" class="w-3.5 h-3.5"></lucide-icon>
                  <span>Thêm Model</span>
                </button>
              </div>
            </div>

            <p class="text-xs text-slate-500 leading-relaxed">
              Nhập mã model từ OpenRouter (VD: <code class="font-mono text-[11px] bg-slate-100 text-slate-700 px-1 py-0.5 rounded">~google/gemini-flash-latest</code>) dùng cho dịch thuật chính thức hoặc chuyển đổi file PDF. Mã model ở cột trái cần nhập tuyệt đối chính xác, nhãn tên ở cột phải tùy ý bạn đặt, miễn sao dễ hiểu cho chính bạn. Bạn có thể thêm, sửa, xóa, điều chỉnh thứ tự danh sách các model AI bên dưới. Danh sách các model AI phổ biến & mạnh nhất có thể tham khảo ở đây: 
              <a href="https://openrouter.ai/discover" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:text-indigo-800 hover:underline font-semibold inline-flex items-center gap-0.5">
                https://openrouter.ai/discover
                <lucide-icon [img]="ExternalLink" class="w-3 h-3" aria-hidden="true"></lucide-icon>
              </a>.
              Nên chọn các model có khả năng xử lý đa phương thức (Multi-modal API), tức là hiểu được cả ảnh, text. Các model mà chỉ xử lý được text sẽ không dịch được PDF, model chỉ nhận text chỉ có khả năng dịch Phase 2 (dịch trực tiếp HTML).
            </p>

            <!-- Table of Model Rows -->
            <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div class="grid grid-cols-12 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 border-b border-slate-200">
                <div class="col-span-1 text-center">#</div>
                <div class="col-span-4">MÃ MODEL (ID)</div>
                <div class="col-span-4">NHÃN TÊN (NAME)</div>
                <div class="col-span-2 text-center">THỨ TỰ</div>
                <div class="col-span-1 text-center">XÓA</div>
              </div>

              <div class="divide-y divide-slate-100">
                @for (m of tempModels(); track $index; let isFirst = $first; let isLast = $last) {
                  <div class="grid grid-cols-12 items-center px-3 py-2 gap-2 hover:bg-slate-50/50 transition-colors">
                    <div class="col-span-1 text-center text-xs font-mono font-medium text-slate-400">
                      {{ $index + 1 }}
                    </div>
                    <div class="col-span-4">
                      <input 
                        type="text" 
                        [(ngModel)]="m.id"
                        placeholder="e.g. ~google/gemini-flash-latest"
                        class="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                    </div>
                    <div class="col-span-4">
                      <input 
                        type="text" 
                        [(ngModel)]="m.name"
                        placeholder="e.g. Google Gemini Flash Latest"
                        class="w-full px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                      >
                    </div>
                    <div class="col-span-2 flex items-center justify-center gap-1">
                      <button 
                        type="button" 
                        (click)="moveModelUp($index)"
                        [disabled]="isFirst"
                        class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                        title="Di chuyển lên"
                      >
                        <lucide-icon [img]="ArrowUp" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                      <button 
                        type="button" 
                        (click)="moveModelDown($index)"
                        [disabled]="isLast"
                        class="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-slate-400 cursor-pointer disabled:cursor-not-allowed"
                        title="Di chuyển xuống"
                      >
                        <lucide-icon [img]="ArrowDown" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                    </div>
                    <div class="col-span-1 flex justify-center">
                      <button 
                        type="button" 
                        (click)="removeModelRow($index)"
                        class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Xóa model này"
                      >
                        <lucide-icon [img]="Trash2" class="w-3.5 h-3.5"></lucide-icon>
                      </button>
                    </div>
                  </div>
                } @empty {
                  <div class="p-6 text-center text-xs text-slate-400">
                    Chưa có model nào. Bấm "+ Thêm Model" hoặc "Khôi phục mặc định" để tạo mới.
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Section 3: Search Keyword Translation Model -->
          <div class="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div class="flex items-center gap-2">
              <lucide-icon [img]="SearchIcon" class="w-4 h-4 text-indigo-600"></lucide-icon>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                3. Model AI để dịch từ khóa cho tìm kiếm
              </h4>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">
              Mô hình AI được dùng để dịch từ khóa tiếng Việt sang Tiếng Anh, giúp bạn tìm kiếm tài liệu dễ dàng hơn trên Google Scholar ở thanh công cụ. Nên chọn các model AI đủ tốt nhưng nhẹ và có tốc độ phản hồi cao.
            </p>
            <div>
              <input 
                type="text" 
                [ngModel]="tempSearchModel()"
                (ngModelChange)="tempSearchModel.set($event)"
                placeholder="google/gemini-3.5-flash-lite"
                class="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
            </div>
          </div>

          <!-- Section 4: Reasoning Effort -->
          <div class="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div class="flex items-center gap-2">
              <lucide-icon [img]="Brain" class="w-4 h-4 text-indigo-600"></lucide-icon>
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                4. Mức độ suy luận (Reasoning Effort)
              </h4>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">
              Tùy chỉnh mức độ AI suy luận sâu (Deep Thinking) để tăng chất lượng dịch các tài liệu phức tạp. Nên chọn Cao hoặc ít nhất là Trung bình để có chất lượng dịch tốt.
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              @for (opt of reasoningOptions; track opt.value) {
                <button
                  type="button"
                  (click)="tempReasoningEffort.set(opt.value)"
                  class="flex flex-col items-center justify-center p-3 rounded-xl border text-xs transition-all cursor-pointer text-center"
                  [ngClass]="tempReasoningEffort() === opt.value
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold shadow-xs ring-1 ring-indigo-500/30'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 font-medium'"
                >
                  <span class="text-xs font-semibold">{{ opt.label }}</span>
                  <span class="text-[10px] opacity-75 mt-0.5" [class.text-indigo-600]="tempReasoningEffort() === opt.value">{{ opt.sublabel }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Section 5: Temperature -->
          <div class="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <lucide-icon [img]="Sliders" class="w-4 h-4 text-indigo-600"></lucide-icon>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  5. Độ sáng tạo & Chính xác (Temperature)
                </h4>
              </div>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200/60 font-mono">
                {{ tempTemperature() }}
              </span>
            </div>
            <p class="text-xs text-slate-500 leading-relaxed">
              Điều chỉnh độ linh hoạt khi AI dịch. Mức thấp (0.0 - 0.3) phù hợp tài liệu kỹ thuật/chính xác cao; mức vừa (0.4 - 0.7) uyển chuyển hơn; mức cao (0.8 - 1.0) cho bản dịch diễn đạt sáng tạo hơn.
            </p>
            <div class="space-y-2 pt-1">
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                [value]="tempTemperature()"
                (input)="onTemperatureInput($event)"
                class="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div class="flex justify-between text-[10px] text-slate-400 font-medium px-0.5">
                <span>0.0 (Chính xác / Kỹ thuật)</span>
                <span>0.5 (Uyển chuyển hơn)</span>
                <span>1.0 (Diễn đạt sáng tạo • Mặc định)</span>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
          <div>
            @if (hasUserApiKey) {
              <button 
                type="button" 
                (click)="onClearApiKey()" 
                class="px-3.5 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              >
                <lucide-icon [img]="Trash2" class="w-3.5 h-3.5" aria-hidden="true"></lucide-icon>
                <span>Xóa Key cá nhân</span>
              </button>
            }
          </div>
          <div class="flex items-center gap-2">
            <button 
              type="button"
              (click)="resetDefaultModels()"
              class="px-3.5 py-2 inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all shadow-2xs cursor-pointer"
              title="Khôi phục danh sách 7 model mặc định"
            >
              <lucide-icon [img]="RotateCcw" class="w-3.5 h-3.5"></lucide-icon>
              <span>Khôi phục mặc định</span>
            </button>
            <button 
              type="button"
              (click)="closeModal.emit()" 
              class="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              Hủy
            </button>
            <button 
              type="button"
              (click)="onSaveConfig()" 
              class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>

      </div>
    </div>
  `
})
export class ApiKeyModalComponent implements OnInit {
  readonly SearchIcon = Search;
  readonly Brain = Brain;
  readonly Sliders = Sliders;
  readonly Key = Key;
  readonly XIcon = X;
  readonly ExternalLink = ExternalLink;
  readonly EyeOff = EyeOff;
  readonly Eye = Eye;
  readonly Trash2 = Trash2;
  readonly Plus = Plus;
  readonly RotateCcw = RotateCcw;
  readonly Cpu = Cpu;
  readonly ArrowUp = ArrowUp;
  readonly ArrowDown = ArrowDown;

  @Input() initialApiKey = '';
  @Input() hasUserApiKey = false;
  @Input() customModels: OpenRouterModelConfig[] = [];
  @Input() searchModel = 'google/gemini-3.5-flash-lite';
  @Input() reasoningEffort: ReasoningEffort = 'high';
  @Input() temperature = 1;
  
  @Output() save = new EventEmitter<{ 
    apiKey: string; 
    customModels: OpenRouterModelConfig[]; 
    searchModel: string;
    reasoningEffort: ReasoningEffort;
    temperature: number;
    isReset?: boolean; 
  }>();
  @Output() clear = new EventEmitter<void>();
  @Output() closeModal = new EventEmitter<void>();

  tempApiKey = '';
  tempModels = signal<OpenRouterModelConfig[]>([]);
  tempSearchModel = signal<string>('google/gemini-3.5-flash-lite');
  tempReasoningEffort = signal<ReasoningEffort>('high');
  tempTemperature = signal<number>(1);
  showKeyPlain = signal<boolean>(false);

  readonly reasoningOptions: { value: ReasoningEffort; label: string; sublabel: string }[] = [
    { value: 'high', label: 'Cao (High)', sublabel: 'Mặc định • Khuyên dùng' },
    { value: 'medium', label: 'Trung bình', sublabel: 'Cân bằng tốc độ & sâu' },
    { value: 'low', label: 'Thấp (Low)', sublabel: 'Tối ưu tốc độ phản hồi' },
    { value: 'none', label: 'Tắt suy luận', sublabel: 'Không gửi reasoning' }
  ];

  ngOnInit() {
    this.tempApiKey = this.initialApiKey;
    const source = this.customModels && this.customModels.length > 0 ? this.customModels : DEFAULT_OPENROUTER_MODELS;
    this.tempModels.set(JSON.parse(JSON.stringify(source)));
    this.tempSearchModel.set(this.searchModel || 'google/gemini-3.5-flash-lite');
    this.tempReasoningEffort.set(this.reasoningEffort || 'high');
    this.tempTemperature.set(this.temperature !== undefined ? this.temperature : 1);
  }

  onTemperatureInput(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target) {
      const val = parseFloat(target.value);
      this.tempTemperature.set(Math.round(val * 10) / 10);
    }
  }

  toggleShowKeyPlain() {
    this.showKeyPlain.update(v => !v);
  }

  addModelRow() {
    if (this.tempModels().length >= 7) return;
    this.tempModels.update(list => [...list, { id: '', name: '' }]);
  }

  removeModelRow(index: number) {
    this.tempModels.update(list => list.filter((_, i) => i !== index));
  }

  moveModelUp(index: number) {
    if (index <= 0) return;
    this.tempModels.update(list => {
      const newList = [...list];
      const temp = newList[index];
      newList[index] = newList[index - 1];
      newList[index - 1] = temp;
      return newList;
    });
  }

  moveModelDown(index: number) {
    if (index >= this.tempModels().length - 1) return;
    this.tempModels.update(list => {
      const newList = [...list];
      const temp = newList[index];
      newList[index] = newList[index + 1];
      newList[index + 1] = temp;
      return newList;
    });
  }

  resetDefaultModels() {
    this.tempModels.set(JSON.parse(JSON.stringify(DEFAULT_OPENROUTER_MODELS)));
    this.tempSearchModel.set('google/gemini-3.5-flash-lite');
    this.tempReasoningEffort.set('high');
    this.tempTemperature.set(1);
    this.onSaveConfig(true);
  }

  onSaveConfig(isReset = false) {
    // Sanitize models: trim spaces, remove items without id, limit to max 7
    const cleaned = this.tempModels()
      .map(m => ({
        id: m.id.trim(),
        name: m.name.trim() || m.id.trim()
      }))
      .filter(m => m.id.length > 0)
      .slice(0, 7);

    this.save.emit({
      apiKey: this.tempApiKey.trim(),
      customModels: cleaned.length > 0 ? cleaned : DEFAULT_OPENROUTER_MODELS,
      searchModel: this.tempSearchModel().trim() || 'google/gemini-3.5-flash-lite',
      reasoningEffort: this.tempReasoningEffort(),
      temperature: this.tempTemperature(),
      isReset
    });
  }

  onClearApiKey() {
    this.tempApiKey = '';
    this.clear.emit();
  }
}


