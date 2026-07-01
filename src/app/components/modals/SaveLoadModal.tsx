import React, { useState, useEffect } from "react";
import { Save, FolderOpen, Trash2, Pencil, Check, X } from "lucide-react";
import { ModalShell } from "../ui/Primitives";
import { CYAN, GREEN, ORANGE } from "../../types";
import type { LoadoutMap } from "../../types";
import {
  serializeBuildState,
  saveBuildToLocalStorage,
  loadBuildsFromLocalStorage,
  deleteSavedBuild,
  renameSavedBuild,
  sanitizeLoadedBuild,
  type SavedBuild,
} from "../../persistence/buildPersistence";

export interface SaveLoadModalProps {
  onClose: () => void;
  offLoadout: LoadoutMap;
  defLoadout: LoadoutMap;
  onLoadBuild: (offLoadout: LoadoutMap, defLoadout: LoadoutMap) => void;
}

export function SaveLoadModal({ onClose, offLoadout, defLoadout, onLoadBuild }: SaveLoadModalProps) {
  const [builds, setBuilds] = useState<SavedBuild[]>([]);
  const [saveName, setSaveName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setBuilds(loadBuildsFromLocalStorage());
  }, []);

  const handleSave = () => {
    const build = serializeBuildState(saveName || "Unnamed Build", offLoadout, defLoadout);
    saveBuildToLocalStorage(build);
    setBuilds(loadBuildsFromLocalStorage());
    setSaveName("");
  };

  const handleLoad = (build: SavedBuild) => {
    const { build: sanitized } = sanitizeLoadedBuild(build);
    onLoadBuild(sanitized.offLoadout, sanitized.defLoadout);
    onClose();
  };

  const handleDelete = (buildId: string) => {
    if (confirmDeleteId === buildId) {
      deleteSavedBuild(buildId);
      setBuilds(loadBuildsFromLocalStorage());
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(buildId);
    }
  };

  const handleRename = (buildId: string) => {
    if (renameValue.trim()) {
      renameSavedBuild(buildId, renameValue);
      setBuilds(loadBuildsFromLocalStorage());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const startRename = (build: SavedBuild) => {
    setRenamingId(build.id);
    setRenameValue(build.name);
  };

  const slotCount = (loadout: LoadoutMap) => Object.values(loadout).filter(Boolean).length;

  return (
    <ModalShell title="Saved Builds" accent={CYAN} icon={<FolderOpen size={14} />} onClose={onClose} width={560} height={480}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Save current build */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(0,200,255,0.12)" }}>
          <div className="text-[9px] uppercase tracking-[0.15em] mb-2" style={{ color: "#7ab8cc" }}>Save Current Build</div>
          <div className="flex gap-2">
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
              placeholder="Build name..."
              className="flex-1 px-2.5 py-1.5 rounded-[3px] text-[12px] bg-black/30 border outline-none"
              style={{ borderColor: "rgba(0,200,255,0.18)", color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}
              aria-label="Build name"
            />
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[3px] text-[10px] font-bold tracking-wider transition-all"
              style={{ background: "rgba(0,200,255,0.1)", border: "1px solid rgba(0,200,255,0.3)", color: CYAN, fontFamily: "'Rajdhani', sans-serif" }}
              aria-label="Save build"
            >
              <Save size={11} />
              SAVE
            </button>
          </div>
          <div className="text-[8px] mt-1.5" style={{ color: "#4a7080" }}>
            Off: {slotCount(offLoadout)} items | Def: {slotCount(defLoadout)} items
          </div>
        </div>

        {/* Build list */}
        <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0,200,255,0.12) transparent" }}>
          {builds.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
              <FolderOpen size={24} style={{ color: "#4a7080" }} />
              <div className="text-[11px]" style={{ color: "#6aa8c0", fontFamily: "'JetBrains Mono', monospace" }}>
                No saved builds yet
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {builds.map((build) => (
                <div
                  key={build.id}
                  className="flex items-center gap-2 p-2.5 rounded-[3px] transition-all group"
                  style={{ background: "rgba(0,200,255,0.03)", border: "1px solid rgba(0,200,255,0.1)" }}
                >
                  {/* Name / Rename */}
                  <div className="flex-1 min-w-0">
                    {renamingId === build.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(build.id); if (e.key === 'Escape') setRenamingId(null); }}
                          className="flex-1 px-1.5 py-0.5 rounded-[2px] text-[11px] bg-black/40 border outline-none"
                          style={{ borderColor: "rgba(0,200,255,0.3)", color: "#c0dde8" }}
                          autoFocus
                          aria-label="Rename build"
                        />
                        <button onClick={() => handleRename(build.id)} className="p-0.5" title="Confirm rename">
                          <Check size={10} style={{ color: GREEN }} />
                        </button>
                        <button onClick={() => setRenamingId(null)} className="p-0.5" title="Cancel rename">
                          <X size={10} style={{ color: "#6aa8c0" }} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="text-[11px] font-semibold truncate" style={{ color: "#c0dde8", fontFamily: "'Rajdhani', sans-serif" }}>
                          {build.name}
                        </div>
                        <div className="text-[8px] mt-0.5" style={{ color: "#4a7080" }}>
                          {new Date(build.updatedAt).toLocaleDateString()} · Off: {slotCount(build.offLoadout)} | Def: {slotCount(build.defLoadout)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  {renamingId !== build.id && (
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleLoad(build)}
                        className="px-2 py-1 rounded-[2px] text-[9px] font-bold"
                        style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.2)", color: GREEN }}
                        title="Load this build"
                      >
                        LOAD
                      </button>
                      <button onClick={() => startRename(build)} className="p-1 rounded-[2px]" title="Rename" style={{ color: "#6aa8c0" }}>
                        <Pencil size={10} />
                      </button>
                      <button
                        onClick={() => handleDelete(build.id)}
                        className="p-1 rounded-[2px]"
                        title={confirmDeleteId === build.id ? "Click again to confirm" : "Delete"}
                        style={{ color: confirmDeleteId === build.id ? ORANGE : "#6aa8c0" }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ModalShell>
  );
}
