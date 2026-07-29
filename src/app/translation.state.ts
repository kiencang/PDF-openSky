import { Injectable, signal, computed, inject } from '@angular/core';
import { OpenRouterService, OpenRouterModelConfig, ReasoningEffort } from './openrouter.service';
import { ToastService } from './toast.service';
import { PdfService } from './pdf.service';
import { DbService } from './db.service';
import { StorageService, TranslatedDoc } from './storage.service';
import { PromptService } from './prompt.service';
import { ImageProcessorService, ExtractedImage } from './image-processor.service';

export type TranslationMode = 'zero_math' | 'zero_svg' | 'normal' | 'phase1' | 'phase2';

@Injectable({
  providedIn: 'root'
})
export class TranslationState {
  private openRouterService = inject(OpenRouterService);
  private toastService = inject(ToastService);
  private pdfService = inject(PdfService);
  private dbService = inject(DbService);
  private storageService = inject(StorageService);
  private promptService = inject(PromptService);
  private imageProcessorService = inject(ImageProcessorService);

  readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  readonly MAX_FILE_SIZE_HTML = 0.5 * 1024 * 1024; // 500KB
  readonly MAX_PDF_TOKENS = 25000;
  readonly MAX_HTML_TOKENS = 35000;

  availableModels = signal<OpenRouterModelConfig[]>(this.openRouterService.getCustomModels());
  selectedModel = signal<string>(this.availableModels().length > 0 ? this.availableModels()[0].id : '~google/gemini-flash-latest');
  lastTranslatedModel = signal<string | null>(null);
  searchModel = signal<string>(this.openRouterService.getSearchModel());
  reasoningEffort = signal<ReasoningEffort>(this.getInitialReasoningEffort());
  temperature = signal<number>(this.getInitialTemperature());
  selectedFile = signal<File | null>(null);
  fileBase64 = signal<string | null>(null);
  mimeType = signal<string>('');
  
  userApiKey = signal<string>('');
  mode = signal<TranslationMode>('zero_svg');
  
  isProcessing = signal<boolean>(false);
  progressMessage = signal<string>('');
  error = signal<string | null>(null);
  
  resultHtml = signal<string | null>(null);
  tokenCount = signal<number>(0);
  isCountingTokens = signal<boolean>(false);
  
  pdfTotalPages = signal<number>(0);
  pdfStartPage = signal<number>(1);
  pdfEndPage = signal<number>(1);
  croppedFile = signal<File | null>(null);
  pdfHash = signal<string | null>(null);
  htmlExtractedImages = signal<ExtractedImage[]>([]);
  
  elapsedTime = signal<number>(0);
  isLoadedFromHistory = signal<boolean>(false);
  historyItems = signal<TranslatedDoc[]>([]);

  isPdfUploaded = computed(() => this.mimeType() === 'application/pdf');
  isHtmlUploaded = computed(() => this.mimeType() === 'text/html');
  currentMaxTokens = computed(() => this.mimeType() === 'text/html' ? this.MAX_HTML_TOKENS : this.MAX_PDF_TOKENS);
  hasFile = computed(() => this.selectedFile() !== null);
  canProcess = computed(() => this.hasFile() && !this.isProcessing() && !this.isCountingTokens() && this.tokenCount() <= this.currentMaxTokens());
  tokenPercentage = computed(() => Math.min((this.tokenCount() / this.currentMaxTokens()) * 100, 100));
  isTwoPhaseMode = computed(() => this.mode() === 'phase1' || this.mode() === 'phase2');
  
  formattedTime = computed(() => {
    const totalSeconds = this.elapsedTime();
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  private timerInterval: ReturnType<typeof setInterval> | undefined;

  showToast(type: 'error' | 'info' | 'success', message: string) {
    this.toastService.show(type, message);
  }

  private getInitialReasoningEffort(): ReasoningEffort {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('sila_pdf_translator_reasoning_effort');
      if (saved === 'high' || saved === 'medium' || saved === 'low' || saved === 'none') {
        return saved as ReasoningEffort;
      }
    }
    return 'high';
  }

  private getInitialTemperature(): number {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('sila_pdf_translator_temperature');
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 0 && val <= 1) {
          return val;
        }
      }
    }
    return 1;
  }

  saveReasoningEffort(effort: ReasoningEffort) {
    this.reasoningEffort.set(effort);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sila_pdf_translator_reasoning_effort', effort);
    }
  }

  saveTemperature(temp: number) {
    this.temperature.set(temp);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sila_pdf_translator_temperature', temp.toString());
    }
  }

  saveSearchModel(model: string) {
    const finalModel = model.trim() || 'google/gemini-3.5-flash-lite';
    this.openRouterService.saveSearchModel(finalModel);
    this.searchModel.set(finalModel);
  }

  saveCustomModels(models: OpenRouterModelConfig[]) {
    this.openRouterService.saveCustomModels(models);
    this.availableModels.set(models);
    if (models.length > 0 && !models.some(m => m.id === this.selectedModel())) {
      this.selectedModel.set(models[0].id);
    }
  }

  async handlePdfFile(file: File) {
    if (file.type !== 'application/pdf') {
      this.showToast('error', 'Vui lòng tải lên tệp PDF.');
      this.resetFileState();
      return;
    }
    
    if (file.size > this.MAX_FILE_SIZE) {
      this.showToast('error', 'Lỗi: Tệp tải lên vượt quá giới hạn 10MB.');
      this.resetFileState();
      return;
    }

    this.resetPartialState(file);
    this.isCountingTokens.set(true);

    try {
      const pages = await this.pdfService.getPageCount(file);
      this.pdfTotalPages.set(pages);
      this.pdfStartPage.set(1);
      this.pdfEndPage.set(pages);
      await this.processPdfCrop();
    } catch (e) {
      console.error('Error reading PDF:', e);
      this.showToast('error', 'Lỗi khi đọc file PDF.');
      this.isCountingTokens.set(false);
    }
  }

  async processPdfCrop() {
    this.isCountingTokens.set(true);
    this.pdfHash.set(null);
    try {
      const file = this.selectedFile();
      if (!file) return;

      const start = Math.max(1, this.pdfStartPage());
      const end = Math.min(this.pdfTotalPages(), this.pdfEndPage());

      if (start > end) {
        this.showToast('error', 'Trang bắt đầu không được lớn hơn trang kết thúc.');
        this.isCountingTokens.set(false);
        return;
      }

      const result = await this.pdfService.cropPdf(file, start, end, this.pdfTotalPages());
      this.croppedFile.set(result.croppedFile);
      this.fileBase64.set(result.fileBase64);
      const extractedText = await this.pdfService.extractTextFromPDF(result.croppedFile);
      await this.checkTokenLimit(extractedText);

      // Extract images from the cropped PDF
      try {
        const hash = await this.pdfService.hashFile(result.croppedFile);
        this.pdfHash.set(hash);
        const extractedImages = await this.pdfService.extractImagesFromPDF(result.croppedFile, hash);
        
        // Save images to IndexedDB
        await this.dbService.clearImagesByPdf(hash);
        for (const img of extractedImages) {
           await this.dbService.saveImage(img.id, hash, img.dataUrl);
        }
      } catch (err) {
        console.warn('Lỗi khi trích xuất hình ảnh từ PDF:', err);
      }
    } catch (error) {
      console.error('Error cropping PDF:', error);
      this.showToast('error', 'Lỗi khi cắt PDF.');
      this.isCountingTokens.set(false);
    }
  }

  handleHtmlFile(file: File) {
    this.resetPartialState(file);

    const reader = new FileReader();
    reader.onload = async () => {
      const textContent = reader.result as string;
      const { cleanHtml, extractedImages } = this.imageProcessorService.extractImagesFromHtml(textContent);
      
      const encoder = new TextEncoder();
      const byteLength = encoder.encode(cleanHtml).length;
      
      if (byteLength > this.MAX_FILE_SIZE_HTML) {
        this.showToast('error', 'Lỗi: Tệp HTML (sau khi tách ảnh) vượt quá giới hạn 500KB.');
        this.resetFileState();
        return;
      }
      
      this.htmlExtractedImages.set(extractedImages);
      // store the clean base64 html
      const cleanBase64 = btoa(unescape(encodeURIComponent(cleanHtml)));
      this.fileBase64.set(cleanBase64);
      await this.checkTokenLimit(cleanHtml);
    };
    reader.readAsText(file);
  }

  private resetFileState() {
    this.selectedFile.set(null);
    this.fileBase64.set(null);
  }

  private resetPartialState(file: File) {
    this.error.set(null);
    this.selectedFile.set(file);
    this.mimeType.set(file.type);
    this.resultHtml.set(null);
    this.croppedFile.set(null);
    this.pdfTotalPages.set(0);
  }

  private async checkTokenLimit(text: string) {
    this.isCountingTokens.set(true);
    try {
      const tokens = await this.openRouterService.countTokens(text);
      this.tokenCount.set(tokens);
      const maxTokens = this.currentMaxTokens();
      if (tokens > maxTokens) {
        this.showToast('error', `Lỗi: Nội dung vượt quá giới hạn ${maxTokens.toLocaleString()} tokens (${tokens.toLocaleString()} tokens). Vui lòng cắt bớt trang hoặc giảm dung lượng.`);
      }
    } catch (e: unknown) {
      const parsedError = this.openRouterService.parseOpenRouterError(e);
      this.showToast('error', `Lỗi khi kiểm tra dung lượng tài liệu: ${parsedError}`);
    } finally {
      this.isCountingTokens.set(false);
    }
  }

  async loadPrompt(filename: string): Promise<string> {
    return this.promptService.loadPrompt(filename);
  }

  async processFile() {
    if (!this.canProcess() || !this.fileBase64()) return;

    this.isProcessing.set(true);
    this.error.set(null);
    this.resultHtml.set(null);
    this.elapsedTime.set(0);
    const startTime = Date.now();
    
    this.timerInterval = setInterval(() => {
      this.elapsedTime.update(v => v + 1);
    }, 1000);

    try {
      const base64 = this.fileBase64()!;
      const mime = this.mimeType();
      const currentMode = this.mode();
      
      let extractedImages: ExtractedImage[] = [];
      if (this.pdfHash()) {
        try {
          extractedImages = await this.dbService.getImagesByPdf(this.pdfHash()!);
        } catch (e) {
          console.warn('Không thể lấy ảnh từ DB', e);
        }
      }

      let dataToPass: string | string[] = base64;
      if (mime === 'application/pdf') {
        const m = this.selectedModel().toLowerCase();
        const isGemini = m.includes('google/') || m.includes('gemini');
        if (!isGemini) {
          this.progressMessage.set('Đang chuyển đổi PDF sang hình ảnh để tối ưu tương thích...');
          const cropped = this.croppedFile();
          if (cropped) {
            dataToPass = await this.pdfService.renderPdfToImages(cropped);
          }
        }
      }

      if (currentMode === 'zero_math') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học xã hội)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_zero_math.md'),
          this.loadPrompt('prompt_zero_math.md')
        ]);
        const result = await this.openRouterService.translate(dataToPass, mime, prompt, instruction, this.selectedModel(), extractedImages, this.reasoningEffort(), this.temperature());
        const rawHtml = this.imageProcessorService.extractHtml(result);
        this.resultHtml.set(this.imageProcessorService.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'zero_svg') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu khoa học nói chung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_zero_svg.md'),
          this.loadPrompt('prompt_zero_svg.md')
        ]);
        const result = await this.openRouterService.translate(dataToPass, mime, prompt, instruction, this.selectedModel(), extractedImages, this.reasoningEffort(), this.temperature());
        const rawHtml = this.imageProcessorService.extractHtml(result);
        this.resultHtml.set(this.imageProcessorService.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'normal') {
        this.progressMessage.set('Dịch file PDF sang tiếng Việt (Tài liệu toán chuyên ngành)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions.md'),
          this.loadPrompt('prompt.md')
        ]);
        const result = await this.openRouterService.translate(dataToPass, mime, prompt, instruction, this.selectedModel(), extractedImages, this.reasoningEffort(), this.temperature());
        const rawHtml = this.imageProcessorService.extractHtml(result);
        this.resultHtml.set(this.imageProcessorService.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'phase1') {
        this.progressMessage.set('Chuyển định dạng PDF sang HTML (English / Giữ nguyên nội dung)...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_phase_1.md'),
          this.loadPrompt('prompt_phase_1.md')
        ]);
        const result = await this.openRouterService.translate(dataToPass, mime, prompt, instruction, this.selectedModel(), extractedImages, this.reasoningEffort(), this.temperature());
        const rawHtml = this.imageProcessorService.extractHtml(result);
        this.resultHtml.set(this.imageProcessorService.postProcessHtml(rawHtml, extractedImages));
      }
      else if (currentMode === 'phase2') {
        if (this.selectedFile()?.type !== 'text/html') {
           throw new Error("Phase 2 cần đầu vào là định dạng HTML. Hãy tải file HTML lên.");
        }
        
        this.progressMessage.set('Dịch file HTML sang Tiếng Việt...');
        const [instruction, prompt] = await Promise.all([
          this.loadPrompt('system_instructions_phase_2.md'),
          this.loadPrompt('prompt_phase_2.md')
        ]);
        
        const htmlContent = base64;
        const result = await this.openRouterService.translateHtml(htmlContent, prompt, instruction, this.selectedModel(), this.htmlExtractedImages(), this.reasoningEffort(), this.temperature());
        const rawHtml = this.imageProcessorService.extractHtml(result);
        this.resultHtml.set(this.imageProcessorService.postProcessHtml(rawHtml, this.htmlExtractedImages()));
      }

      this.progressMessage.set('Done!');
      if (currentMode === 'phase1') {
        this.showToast('success', 'Quá trình chuyển đổi tài liệu hoàn tất!');
      } else {
        this.showToast('success', 'Quá trình dịch tài liệu hoàn tất!');
      }

      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      await this.saveToHistory(durationSeconds);
      this.lastTranslatedModel.set(this.selectedModel());
      
    } catch (e: unknown) {
      const parsedError = this.openRouterService.parseOpenRouterError(e);
      
      if (parsedError.includes('429') || parsedError.toLowerCase().includes('quota') || parsedError.toLowerCase().includes('rate limit')) {
        this.showToast('error', 'Lỗi: API Key hoặc Model vượt quá giới hạn (Rate limit/Quota). Vui lòng thử lại sau hoặc đổi model.');
      } 
      else if (parsedError.includes('401') || parsedError.toLowerCase().includes('unauthorized') || parsedError.toLowerCase().includes('invalid api key')) {
        this.showToast('error', 'Lỗi: OpenRouter API Key không hợp lệ. Vui lòng kiểm tra lại Key trong mục Cấu hình.');
      }
      else {
        this.showToast('error', `Lỗi: ${parsedError}`);
      }
    } finally {
      this.isProcessing.set(false);
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
      }
    }
  }

  private async saveToHistory(durationSeconds?: number) {
    const file = this.selectedFile();
    const content = this.resultHtml();
    const currentMode = this.mode();
    if (file && content) {
      let vietnameseTitle = file.name;
      const h1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) {
        vietnameseTitle = h1Match[1].replace(/<[^>]*>/g, '').trim();
      } else {
        const h2Match = content.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
        if (h2Match) {
          vietnameseTitle = h2Match[1].replace(/<[^>]*>/g, '').trim();
        }
      }
      
      if (!vietnameseTitle || vietnameseTitle.length === 0) {
        vietnameseTitle = file.name;
      } else if (vietnameseTitle.length > 100) {
        vietnameseTitle = vietnameseTitle.substring(0, 97) + '...';
      }

      let originalFileBlob: ArrayBuffer | undefined = undefined;
      try {
        if (file.size > 0) {
          originalFileBlob = await file.arrayBuffer();
        }
      } catch (e) {
        console.warn('Không thể lưu file đính kèm vào lịch sử:', e);
      }

      await this.storageService.saveTranslation({
        originalFileName: file.name,
        originalFileBlob: originalFileBlob,
        mimeType: file.type || this.mimeType(),
        vietnameseTitle: vietnameseTitle,
        mode: currentMode,
        model: this.selectedModel(),
        durationSeconds: durationSeconds ?? Math.round(this.elapsedTime()),
        timestamp: Date.now(),
        content: content,
        pdfHash: this.pdfHash() || undefined
      }).catch(err => console.error('Lỗi khi lưu lịch sử:', err));
    }
  }

  cancelTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  resetSession() {
    this.cancelTimer();
    this.selectedFile.set(null);
    this.isLoadedFromHistory.set(false);
    this.fileBase64.set(null);
    this.mimeType.set('');
    this.resultHtml.set(null);
    this.error.set(null);
    this.tokenCount.set(0);
    this.progressMessage.set('');
    this.elapsedTime.set(0);
    this.lastTranslatedModel.set(null);
  }

  clearResultForReTranslate() {
    this.resultHtml.set(null);
    this.error.set(null);
    this.progressMessage.set('');
    this.elapsedTime.set(0);
    this.lastTranslatedModel.set(null);
  }

  async fetchHistory() {
    try {
      const items = await this.storageService.getAll();
      this.historyItems.set(items);
    } catch (err) {
      console.error('Không thể tải lịch sử:', err);
      this.showToast('error', 'Không thể đọc dữ liệu lịch sử dịch.');
    }
  }

  async deleteHistoryItem(id: number) {
    try {
      await this.storageService.delete(id);
      await this.fetchHistory();
      this.showToast('success', 'Đã xóa bản dịch khỏi lịch sử thành công.');
    } catch (err) {
      console.error('Không thể xóa item:', err);
      this.showToast('error', 'Không thể xóa bản dịch khỏi lịch sử.');
    }
  }

  async restoreFromHistory(doc: TranslatedDoc) {
    const isHtml = doc.mode === 'phase2';
    const fileType = doc.mimeType || (isHtml ? 'text/html' : 'application/pdf');
    
    let restoredFile: File;
    if (doc.originalFileBlob && doc.originalFileBlob.byteLength > 0) {
      restoredFile = new File([doc.originalFileBlob], doc.originalFileName, { type: fileType });
    } else {
      restoredFile = new File([], doc.originalFileName, { type: fileType });
    }
    
    this.selectedFile.set(restoredFile);
    this.isLoadedFromHistory.set(true);
    this.mimeType.set(fileType);
    this.resultHtml.set(doc.content);
    this.mode.set(doc.mode as TranslationMode);
    if (doc.model) {
      this.selectedModel.set(doc.model);
      this.lastTranslatedModel.set(doc.model);
    }
    
    this.tokenCount.set(0);
    this.error.set(null);
    this.progressMessage.set('Đã khôi phục từ lịch sử');

    if (restoredFile.size > 0) {
      if (isHtml) {
        try {
          const textContent = await restoredFile.text();
          const { cleanHtml, extractedImages } = this.imageProcessorService.extractImagesFromHtml(textContent);
          this.htmlExtractedImages.set(extractedImages);
          const cleanBase64 = btoa(unescape(encodeURIComponent(cleanHtml)));
          this.fileBase64.set(cleanBase64);
          await this.checkTokenLimit(cleanHtml);
        } catch (e) {
          console.warn('Lỗi khi chuẩn bị file HTML khôi phục:', e);
        }
      } else {
        try {
          const pages = await this.pdfService.getPageCount(restoredFile);
          this.pdfTotalPages.set(pages);
          this.pdfStartPage.set(1);
          this.pdfEndPage.set(pages);
          await this.processPdfCrop();
        } catch (e) {
          console.warn('Lỗi khi chuẩn bị file PDF khôi phục:', e);
        }
      }
    }
  }
}
