import { useMemo, useState } from "react";
import {
 loadAllBuilds,
 saveBuild as persistBuild,
 deleteBuild as removeBuild,
 renameBuild as renameSavedBuild,
 duplicateBuild as dupBuild,
 generateBuildId,
} from "../buildPersistenceService";
import { downloadBuildAsFile, importBuildFromJSON, exportBuildAsJSON, triggerImportDialog } from "../buildImportExportService";
import { encodeSharePayload, copyShareStringToClipboard, decodeSharePayload } from "../buildShareService";
import type { SavedBuild } from "../savedBuildSchema";
import type { BuildSelection } from "../types";
import type { UptimeProfileName, CombatStateAssumptions } from "../../engine/conditionalEffectTypes";

interface SavedBuildsPanelProps {
 currentBuild: BuildSelection;
 currentBuildName: string;
 currentMode: "pve" | "pvp";
 currentUptimeProfile: UptimeProfileName;
 currentCustomAssumptions: Partial<CombatStateAssumptions>;
 currentPveTargetId: string;
 currentBuildId: string | null;
 onLoadBuild: (build: SavedBuild) => void;
 onBuildIdAssigned: (buildId: string, buildName: string) => void;
 onUnsavedChanged: () => void;
 onClose: () => void;
}

export function SavedBuildsPanel({
 currentBuild,
 currentBuildName,
 currentMode,
 currentUptimeProfile,
 currentCustomAssumptions,
 currentPveTargetId,
 currentBuildId,
 onLoadBuild,
 onBuildIdAssigned,
 onUnsavedChanged,
 onClose,
}: SavedBuildsPanelProps) {
 const [savedBuilds, setSavedBuilds] = useState<SavedBuild[]>(() => loadAllBuilds());
 const [renameTarget, setRenameTarget] = useState<string | null>(null);
 const [renameValue, setRenameValue] = useState("");
 const [message, setMessage] = useState<{ type: "info" | "error"; text: string } | null>(null);
 const [showImportInput, setShowImportInput] = useState(false);
 const [importText, setImportText] = useState("");

 const refresh = () => setSavedBuilds(loadAllBuilds());

 const showMsg = (type: "info" | "error", text: string) => {
  setMessage({ type, text });
  setTimeout(() => setMessage(null), 3000);
 };

 const handleSave = () => {
  const id = currentBuildId ?? generateBuildId();
  const name = currentBuildName || "Untitled Build";
  const saved = persistBuild({
   buildId: id,
   buildName: name,
   gameMode: currentMode,
   build: currentBuild,
   uptimeProfile: currentUptimeProfile,
   customAssumptions: Object.keys(currentCustomAssumptions).length > 0 ? (currentCustomAssumptions as Record<string, unknown>) : undefined,
   pveTargetId: currentMode === "pve" ? currentPveTargetId : undefined,
  });
  onBuildIdAssigned(id, name);
  refresh();
  showMsg("info", `Saved "${name}"`);
 };

 const handleLoad = (saved: SavedBuild) => {
  onLoadBuild(saved);
  onClose();
 };

 const handleDelete = (buildId: string, name: string) => {
  if (confirm(`Delete "${name}"? This cannot be undone.`)) {
   removeBuild(buildId);
   refresh();
   showMsg("info", `Deleted "${name}"`);
  }
 };

 const handleDuplicate = (buildId: string) => {
  const newId = generateBuildId();
  const newName = `Copy of ${savedBuilds.find((b) => b.buildId === buildId)?.buildName ?? "Build"}`;
  const result = dupBuild(buildId, newId, newName);
  if (result) {
   refresh();
   showMsg("info", `Duplicated as "${newName}"`);
  }
 };

 const handleRename = (buildId: string) => {
  const target = savedBuilds.find((b) => b.buildId === buildId);
  if (!target) return;
  setRenameTarget(buildId);
  setRenameValue(target.buildName);
 };

 const confirmRename = () => {
  if (!renameTarget || !renameValue.trim()) return;
  const result = renameSavedBuild(renameTarget, renameValue.trim());
  if (result) {
   refresh();
   showMsg("info", `Renamed to "${result.buildName}"`);
  }
  setRenameTarget(null);
  setRenameValue("");
 };

 const handleExport = (build: SavedBuild) => {
  downloadBuildAsFile(build);
  showMsg("info", `Exported "${build.buildName}"`);
 };

 const handleExportCurrent = () => {
  if (!currentBuildId) {
   handleSave();
  }
  const id = currentBuildId ?? generateBuildId();
  const name = currentBuildName || "Untitled Build";
  const saved = persistBuild({
   buildId: id,
   buildName: name,
   gameMode: currentMode,
   build: currentBuild,
   uptimeProfile: currentUptimeProfile,
   customAssumptions: Object.keys(currentCustomAssumptions).length > 0 ? (currentCustomAssumptions as Record<string, unknown>) : undefined,
   pveTargetId: currentMode === "pve" ? currentPveTargetId : undefined,
  });
  onBuildIdAssigned(id, name);
  downloadBuildAsFile(saved);
  showMsg("info", `Exported "${name}"`);
 };

 const handleImport = async () => {
  try {
   const text = await triggerImportDialog();
   const result = importBuildFromJSON(text);
   if (result.success && result.build) {
    const saved = persistBuild({
     buildId: result.build.buildId,
     buildName: result.build.buildName,
     gameMode: result.build.gameMode as "pve" | "pvp",
     build: result.build.build as BuildSelection,
     uptimeProfile: result.build.uptimeProfile,
     customAssumptions: result.build.customAssumptions as Record<string, unknown> | undefined,
     pveTargetId: result.build.pveTargetId,
    });
    refresh();
    showMsg("info", `Imported "${saved.buildName}"`);
   } else {
    showMsg("error", result.error || "Import failed");
   }
  } catch (e) {
   if (e instanceof Error && e.message !== "No file selected") {
    showMsg("error", e.message);
   }
  }
 };

 const handleImportText = () => {
  const result = importBuildFromJSON(importText);
  if (result.success && result.build) {
   const saved = persistBuild({
    buildId: result.build.buildId,
    buildName: result.build.buildName,
    gameMode: result.build.gameMode as "pve" | "pvp",
    build: result.build.build as BuildSelection,
    uptimeProfile: result.build.uptimeProfile,
    customAssumptions: result.build.customAssumptions as Record<string, unknown> | undefined,
    pveTargetId: result.build.pveTargetId,
   });
   refresh();
   setShowImportInput(false);
   setImportText("");
   showMsg("info", `Imported "${saved.buildName}"`);
  } else {
   showMsg("error", result.error || "Import failed");
  }
 };

 const handleShare = (build: SavedBuild) => {
  copyShareStringToClipboard(build)
   .then(() => showMsg("info", "Share link copied to clipboard"))
   .catch(() => showMsg("error", "Failed to copy share link"));
 };

 const handleDecodeShare = () => {
  const url = prompt("Paste share URL or encoded string:");
  if (!url) return;

  const data = url.startsWith("ohmc://build?data=") ? url.slice("ohmc://build?data=".length) : url;
  const result = decodeSharePayload(data);
  if (result.success) {
   const saved = persistBuild({
    buildId: result.build.buildId,
    buildName: result.build.buildName,
    gameMode: result.build.gameMode as "pve" | "pvp",
    build: result.build.build as BuildSelection,
    uptimeProfile: result.build.uptimeProfile,
    customAssumptions: result.build.customAssumptions as Record<string, unknown> | undefined,
    pveTargetId: result.build.pveTargetId,
   });
   refresh();
   showMsg("info", `Imported shared build "${saved.buildName}"`);
  } else {
   showMsg("error", result.error);
  }
 };

 const buildsSorted = useMemo(() => {
  return [...savedBuilds].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
 }, [savedBuilds]);

 const currentIsSaved = currentBuildId && savedBuilds.some((b) => b.buildId === currentBuildId);

 return (
  <div className="drawer-backdrop" onMouseDown={onClose}>
   <aside className="saved-builds-drawer" onMouseDown={(e) => e.stopPropagation()}>
    <div className="drawer-header">
     <div>
      <p className="eyebrow">Build Manager</p>
      <h3>Saved Builds</h3>
      <p className="fine-print" style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: 4 }}>
       Stores selections + assumptions only. Outputs are <strong>recalculated live</strong> with current OHAI registries and formula paths on load. Missing IDs become visible registry gaps.
      </p>
     </div>
     <button onClick={onClose}>Close</button>
    </div>

    {message && (
     <div className={`toast-message ${message.type}`}>
      {message.text}
     </div>
    )}

    <div className="saved-builds-actions">
     <button className="btn-primary" onClick={handleSave}>
      {currentIsSaved ? "Update Saved Build" : "Save Current Build"}
     </button>
     <button className="btn-secondary" onClick={handleExportCurrent}>
      Export Current
     </button>
     <button className="btn-secondary" onClick={handleImport}>
      Import File
     </button>
     <button className="btn-secondary" onClick={() => setShowImportInput(!showImportInput)}>
      Import JSON
     </button>
     <button className="btn-secondary" onClick={handleDecodeShare}>
      Import Share Link
     </button>
    </div>

    {showImportInput && (
     <div className="import-text-area">
      <textarea
       value={importText}
       onChange={(e) => setImportText(e.target.value)}
       placeholder="Paste build JSON here..."
       rows={4}
      />
      <button className="btn-primary" onClick={handleImportText} disabled={!importText.trim()}>
       Import
      </button>
     </div>
    )}

    <div className="saved-builds-list" style={{ marginTop: 16 }}>
     {buildsSorted.length === 0 ? (
      <p className="fine-print" style={{ textAlign: "center", padding: 20 }}>
       No saved builds yet. Use "Save Current Build" above.
      </p>
     ) : (
      buildsSorted.map((saved) => (
       <div key={saved.buildId} className={`saved-build-item ${saved.buildId === currentBuildId ? "active" : ""}`}>
        <div className="saved-build-info">
         {renameTarget === saved.buildId ? (
          <div className="rename-inline">
           <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmRename()}
            autoFocus
           />
           <button className="btn-tiny" onClick={confirmRename}>OK</button>
           <button className="btn-tiny" onClick={() => setRenameTarget(null)}>X</button>
          </div>
         ) : (
          <>
           <strong>{saved.buildName}</strong>
           <span className="build-meta">
            {saved.gameMode.toUpperCase()} · {saved.build.weapon.blueprintId} · {saved.build.role}
           </span>
           <span className="build-date">
            {new Date(saved.updatedAt).toLocaleDateString()}
           </span>
          </>
         )}
        </div>
        <div className="saved-build-actions">
         <button onClick={() => handleLoad(saved)} title="Load build">Load</button>
         <button onClick={() => handleDuplicate(saved.buildId)} title="Duplicate build">Dup</button>
         <button onClick={() => handleRename(saved.buildId)} title="Rename build">Rnm</button>
         <button onClick={() => handleExport(saved)} title="Export build as JSON">Exp</button>
         <button onClick={() => handleShare(saved)} title="Copy share link">Share</button>
         <button className="danger" onClick={() => handleDelete(saved.buildId, saved.buildName)} title="Delete build">Del</button>
        </div>
       </div>
      ))
     )}
    </div>
   </aside>
  </div>
 );
}
