import { PDFDocument, degrees, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import QRCode from "qrcode";

export const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = name; a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
};
export const readAsDataURL = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Could not read this file.")); reader.readAsDataURL(file);
});
export const loadImage = (file: File) => new Promise<HTMLImageElement>((resolve, reject) => {
  const url = URL.createObjectURL(file); const image = new Image();
  image.onload = () => { URL.revokeObjectURL(url); resolve(image); }; image.onerror = () => { URL.revokeObjectURL(url); reject(new Error("This picture could not be opened.")); }; image.src = url;
});
export async function processImage(file: File, action: string, width: number, height: number, quality: number, format: string, rotation = 0) {
  const image = await loadImage(file);
  const scale = action === "resize" ? Math.min(1, Math.max(1, width) / image.width, Math.max(1, height) / image.height) : 1;
  const w = Math.max(1, Math.round((action === "resize" ? width : image.width) || image.width));
  const h = Math.max(1, Math.round((action === "resize" ? height : image.height) || image.height));
  const swap = Math.abs(rotation % 180) === 90;
  const canvas = document.createElement("canvas"); canvas.width = swap ? h : w; canvas.height = swap ? w : h;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Canvas is not available in this browser.");
  ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(rotation * Math.PI / 180);
  ctx.drawImage(image, -w / 2, -h / 2, w, h);
  const mime = format === "jpg" ? "image/jpeg" : `image/${format}`;
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error("Could not export this image format.")), mime, quality / 100));
  return { blob, width: canvas.width, height: canvas.height };
}
export async function mergePdfs(files: File[]) {
  const out = await PDFDocument.create();
  for (const file of files) { const doc = await PDFDocument.load(await file.arrayBuffer()); const pages = await out.copyPages(doc, doc.getPageIndices()); pages.forEach(p => out.addPage(p)); }
  return new Blob([await out.save()], { type: "application/pdf" });
}
export async function extractPdf(file: File, pageText: string) {
  const src = await PDFDocument.load(await file.arrayBuffer()); const out = await PDFDocument.create();
  const indexes = pageText.split(",").flatMap(part => {
    const [a,b] = part.trim().split("-").map(Number);
    if (!Number.isFinite(a)) return [];
    const start = Math.max(1, a), end = Math.min(src.getPageCount(), Number.isFinite(b) ? b : a);
    return Array.from({length: Math.max(0, end-start+1)}, (_,i) => start+i-1);
  });
  if (!indexes.length) throw new Error("Enter pages like 1, 3-5.");
  const pages = await out.copyPages(src, [...new Set(indexes)]); pages.forEach(p => out.addPage(p));
  return new Blob([await out.save()], { type: "application/pdf" });
}
export async function rotatePdf(file: File, rotation: number) {
  const doc = await PDFDocument.load(await file.arrayBuffer());
  doc.getPages().forEach(p => p.setRotation(degrees((p.getRotation().angle + rotation) % 360)));
  return new Blob([await doc.save()], { type: "application/pdf" });
}
export async function picturesToPdf(files: File[]) {
  const doc = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer()); let image;
    if (/png/i.test(file.type)) image = await doc.embedPng(bytes); else image = await doc.embedJpg(bytes);
    const page = doc.addPage([image.width, image.height]); page.drawImage(image, {x:0,y:0,width:image.width,height:image.height});
  }
  return new Blob([await doc.save()], {type:"application/pdf"});
}
export async function watermarkPdf(file: File, label: string) {
  const doc = await PDFDocument.load(await file.arrayBuffer()); const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.getPages().forEach(page => { const {width,height}=page.getSize(); page.drawText(label || "FileForge", {x:width*0.12,y:height*0.5,size:28,font,color:rgb(0.45,0.55,0.65),opacity:0.35,rotate:degrees(-25)}); });
  return new Blob([await doc.save()], {type:"application/pdf"});
}
export async function createZip(files: File[]) {
  const zip = new JSZip(); files.forEach(f => zip.file(f.name, f)); return zip.generateAsync({type:"blob"});
}
export async function extractZip(file: File) {
  const zip = await JSZip.loadAsync(file); const out = new JSZip();
  const entries = Object.values(zip.files).filter(f => !f.dir);
  for (const entry of entries) out.file(entry.name, await entry.async("uint8array"));
  return out.generateAsync({type:"blob"});
}
export async function makeQr(text: string) { return QRCode.toDataURL(text || "FileForge", {width:640, margin:2, color:{dark:"#071525",light:"#ffffff"}}); }
