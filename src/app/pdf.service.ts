import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface PdfCropResult {
  fileBase64: string;
  croppedFile: File;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  async hashFile(file: File): Promise<string> {
    return crypto.randomUUID();
  }

  async extractImagesFromPDF(file: File, pdfHash: string): Promise<{ id: string, dataUrl: string }[]> {
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const images: { id: string, dataUrl: string }[] = [];
    let imgCount = 0;

    // Lọc các thao tác vẽ ảnh hợp lệ
    const validObjectTypes = [
      (pdfjsLib as any).OPS?.paintImageXObject,
      (pdfjsLib as any).OPS?.paintInlineImageXObject,
      (pdfjsLib as any).OPS?.paintImageXObjectRepeat
    ].filter(v => v !== undefined);

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const operatorList = await page.getOperatorList();

        for (let i = 0; i < operatorList.fnArray.length; i++) {
          const fn = operatorList.fnArray[i];
          
          if (validObjectTypes.includes(fn)) {
            const imgName = operatorList.argsArray[i][0];
            
            try {
              let imgData: any = null;
              
              // Hàm xử lý lấy object với Timeout (Tránh treo trình duyệt)
              const fetchObjectWithTimeout = (targetObjs: any, name: string, timeoutMs: number = 5000): Promise<any> => {
                return new Promise((resolve) => {
                  let isResolved = false;
                  const timeoutId = setTimeout(() => {
                    if (!isResolved) {
                      console.warn(`Timeout khi lấy object ${name}`);
                      isResolved = true;
                      resolve(null);
                    }
                  }, timeoutMs);
                  try {
                    targetObjs.get(name, (obj: unknown) => {
                      if (!isResolved) {
                        clearTimeout(timeoutId);
                        isResolved = true;
                        resolve(obj);
                      }
                    });
                  } catch (err) {
                    if (!isResolved) {
                      clearTimeout(timeoutId);
                      isResolved = true;
                      resolve(null);
                    }
                  }
                });
              };
              
              // Lấy dữ liệu ảnh
              if (typeof imgName === 'object' && imgName !== null) {
                imgData = imgName;
              } else if (typeof imgName === 'string') {
                if ((page as any).objs && typeof (page as any).objs.get === 'function') {
                  imgData = await fetchObjectWithTimeout((page as any).objs, imgName);
                } else if ((page as any).commonObjs && typeof (page as any).commonObjs.get === 'function') {
                  imgData = await fetchObjectWithTimeout((page as any).commonObjs, imgName);
                }
              }

              if (!imgData) continue;
              
              const width = imgData.width;
              const height = imgData.height;
              if (!width || !height || width < 100 || height < 100) continue; // Bỏ qua ảnh quá nhỏ

              // Tạo canvas để dựng ảnh
              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) continue;

              if (imgData.data) {
                const imgImageData = ctx.createImageData(width, height);
                const srcData = imgData.data;
                const destData = imgImageData.data;

                // Xử lý các định dạng hệ màu (RGB, RGBA, Grayscale)
                if (srcData.length === width * height * 3) {
                  // RGB
                  let j = 0;
                  for (let k = 0; k < srcData.length; k += 3) {
                    destData[j] = srcData[k];
                    destData[j + 1] = srcData[k + 1];
                    destData[j + 2] = srcData[k + 2];
                    destData[j + 3] = 255; // Alpha
                    j += 4;
                  }
                } else if (srcData.length === width * height * 4) {
                  // RGBA
                  destData.set(srcData);
                } else if (srcData.length === width * height) {
                  // Grayscale
                  let j = 0;
                  for (let k = 0; k < srcData.length; k++) {
                    const val = srcData[k];
                    destData[j] = val;
                    destData[j + 1] = val;
                    destData[j + 2] = val;
                    destData[j + 3] = 255;
                    j += 4;
                  }
                } else {
                  try { destData.set(srcData.subarray(0, destData.length)); } catch { continue; }
                }
                ctx.putImageData(imgImageData, 0, 0);
              } else if (imgData.bitmap) {
                ctx.drawImage(imgData.bitmap, 0, 0);
              } else {
                continue; // Không có dữ liệu hợp lệ
              }

              // (Tùy chọn) Giới hạn kích thước ảnh để tối ưu bộ nhớ và băng thông
              let targetW = width;
              let targetH = height;
              if (targetW > 1024) {
                const scale = 1024 / targetW;
                targetW = 1024;
                targetH = Math.round(targetH * scale);
              }

              const tempCanvas = document.createElement('canvas');
              tempCanvas.width = targetW;
              tempCanvas.height = targetH;
              const tempCtx = tempCanvas.getContext('2d');
              if (tempCtx) {
                tempCtx.imageSmoothingEnabled = true;
                tempCtx.imageSmoothingQuality = 'high';
                tempCtx.drawImage(canvas, 0, 0, targetW, targetH);
                
                // Chuyển đổi thành base64 URL
                const dataUrl = tempCanvas.toDataURL('image/jpeg', 0.95);
                images.push({ id: `${pdfHash}_img_${imgCount++}`, dataUrl });
              }
            } catch (err) {
              console.warn(`Lỗi khi trích xuất ảnh ${imgName} trang ${pageNum}:`, err);
            }
          }
        }
      } catch (err) {
        console.warn(`Error processing page ${pageNum} for image extraction:`, err);
      }
    }

    return images;
  }

  async renderPdfToImages(file: File): Promise<string[]> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];
    
    // Scale 2.0 for better text resolution for OCR
    const scale = 2.0;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;

      try {
        await page.render({ canvasContext: ctx, viewport: viewport } as unknown as Parameters<typeof page.render>[0]).promise;
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        // keep only the base64 part
        images.push(dataUrl.split(',')[1]);
      } catch (err) {
        console.warn(`Error rendering page ${pageNum} to image:`, err);
      }
    }
    
    return images;
  }

  async getPageCount(file: File): Promise<number> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    return pdfDoc.getPageCount();
  }

  async extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let text = '';
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += pageText + '\n';
      } catch (err) {
        console.warn(`Error extracting text from page ${pageNum}:`, err);
      }
    }
    
    return text;
  }

  async cropPdf(file: File, start: number, end: number, totalPages: number): Promise<PdfCropResult> {
    if (start > end) {
      throw new Error('Trang bắt đầu không được lớn hơn trang kết thúc.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalPdf = await PDFDocument.load(arrayBuffer);
    const newPdf = await PDFDocument.create();

    const pageIndices = [];
    for (let i = start - 1; i < Math.min(end, totalPages); i++) {
      pageIndices.push(i);
    }

    const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    const pdfBytes = await newPdf.save();
    const croppedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
    const croppedFileObj = new File([croppedBlob], file.name, { type: 'application/pdf' });

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          fileBase64: base64String,
          croppedFile: croppedFileObj
        });
      };
      reader.onerror = () => reject(new Error('Lỗi khi đọc file cắt.'));
      reader.readAsDataURL(croppedFileObj);
    });
  }
}
