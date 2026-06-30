import { validateImportedBuild, CURRENT_SCHEMA_VERSION, type SavedBuild } from "./savedBuildSchema";

export function exportBuildAsJSON(build: SavedBuild): string {
 return JSON.stringify(build, null, 2);
}

export interface ImportResult {
 success: boolean;
 build?: SavedBuild;
 error?: string;
 reject: boolean;
}

export function importBuildFromJSON(jsonString: string): ImportResult {
 if (!jsonString || jsonString.trim().length === 0) {
  return { success: false, error: "Empty JSON string", reject: true };
 }

 let parsed: unknown;
 try {
  parsed = JSON.parse(jsonString);
 } catch {
  return { success: false, error: "Invalid JSON syntax", reject: true };
 }

 const result = validateImportedBuild(parsed);
 if (result.success) {
  return { success: true, build: result.build, reject: false };
 }

 return {
  success: false,
  error: result.error,
  reject: result.reject,
 };
}

export function downloadBuildAsFile(build: SavedBuild): void {
 const json = exportBuildAsJSON(build);
 const blob = new Blob([json], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `${build.buildName.replace(/[^a-zA-Z0-9_-]/g, "_")}.ohmc-build.json`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
}

export function triggerImportDialog(): Promise<string> {
 return new Promise((resolve, reject) => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,.ohmc-build.json";
  input.onchange = () => {
   const file = input.files?.[0];
   if (!file) {
    reject(new Error("No file selected"));
    return;
   }
   const reader = new FileReader();
   reader.onload = () => {
    resolve(reader.result as string);
   };
   reader.onerror = () => {
    reject(new Error("Failed to read file"));
   };
   reader.readAsText(file);
  };
  input.click();
 });
}
