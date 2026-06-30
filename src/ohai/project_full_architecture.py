#!/usr/bin/env python3
"""
OnceHumanCombatHaptics - COMPLETE Project Architecture Map
Every major module, relationship, data flow, and wiring
"""

import graphviz

def create_full_project_map():
    dot = graphviz.Digraph(
        name="OHAI-Full-Architecture",
        comment="Complete Project Structure & All Relationships",
        format="png",
        engine="dot"
    )

    dot.attr(
        rankdir="TB",
        splines="ortho",
        nodesep="0.4",
        ranksep="0.6",
        fontname="Arial",
        fontsize="10"
    )

    # ========== UI LAYER ==========
    with dot.subgraph(name="cluster_ui") as ui:
        ui.attr(label="UI Layer (React + TypeScript)", style="rounded", color="#6c8ebf", bgcolor="#e8f0f8")
        ui.node("App", "App.tsx\n(Main Shell + Build State)", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")
        ui.node("LoadoutSlotTile", "LoadoutSlotTile.tsx", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")
        ui.node("SelectorModal", "SelectorModal.tsx", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")
        ui.node("BlueprintSelector", "BlueprintSelector.tsx\n(Legacy)", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")
        ui.node("LoadoutPanel", "LoadoutPanel.tsx", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")
        ui.node("CombatOutcomePanel", "CombatOutcomePanel.tsx", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")
        ui.node("BuildAnalysisPanel", "BuildAnalysisPanel.tsx", shape="box", style="rounded,filled", fillcolor="#dae8fc", fontsize="9")

    # ========== SELECTOR SYSTEM (Phase 3) ==========
    with dot.subgraph(name="cluster_selectors") as sel:
        sel.attr(label="Selector System (Phase 3)", style="rounded", color="#82b366", bgcolor="#e8f5e8")
        sel.node("weaponSelectorBuilder", "weaponSelectorBuilder.ts\nbuildWeaponSelectorItems()", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("itemReadiness", "itemReadiness.ts\ngetItemReadinessState()", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("slotValidation", "slotValidation.ts\nvalidateSlotSelection()", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("buildValidation", "buildValidation.ts\nvalidateBuildSelections()", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("calibrationResolver", "calibrationResolver.ts\ngetCalibrationOptionsForWeapon()", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("weaponAudit", "weaponAudit.ts\nauditWeaponSelectorReadiness()", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("filterSelectorItems", "filterSelectorItems.ts", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("selectorTypes", "selectorTypes.ts\n(READINESS, SLOT, etc.)", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")
        sel.node("normalization", "normalization.ts\n(normalizeWeaponFamily, etc.)", shape="box", style="rounded,filled", fillcolor="#d5e8d4", fontsize="9")

    # ========== REGISTRIES ==========
    with dot.subgraph(name="cluster_registries") as reg:
        reg.attr(label="Registries (Data Sources)", style="rounded", color="#d79b00", bgcolor="#fff5e6")
        reg.node("weaponRegistry", "weaponRegistry.ts\n(110 weapons, curated + LRE)", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")
        reg.node("armorRegistry", "armorRegistry.ts", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")
        reg.node("modRegistry", "modRegistry.ts", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")
        reg.node("deviationRegistry", "deviationRegistry.ts", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")
        reg.node("foodBuffRegistry", "foodBuffRegistry.ts", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")
        reg.node("ammoRegistry", "ammoRegistry.ts", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")
        reg.node("attachmentRegistry", "attachmentRegistry.ts", shape="box", style="rounded,filled", fillcolor="#ffe6cc", fontsize="9")

    # ========== FORMULA ENGINE ==========
    with dot.subgraph(name="cluster_engine") as eng:
        eng.attr(label="Formula Engine", style="rounded", color="#9673a6", bgcolor="#f5f0f7")
        eng.node("formulaBridge", "formulaBridge.ts\nbuildCalculationInputFromSelection()", shape="box", style="rounded,filled", fillcolor="#e1d5e7", fontsize="9")
        eng.node("formulaDamageAdapter", "formulaDamageAdapter.ts\nbuildExpectedDamageFromCalculationInput()", shape="box", style="rounded,filled", fillcolor="#e1d5e7", fontsize="9")
        eng.node("combatOutput", "combatOutput.ts\ncomputeCombatOutput()", shape="box", style="rounded,filled", fillcolor="#e1d5e7", fontsize="9")
        eng.node("buildComparisonEngine", "buildComparisonEngine.ts", shape="box", style="rounded,filled", fillcolor="#e1d5e7", fontsize="9")

    # ========== RESOLVERS ==========
    with dot.subgraph(name="cluster_resolvers") as res:
        res.attr(label="Effect Resolvers", style="rounded", color="#b85450", bgcolor="#fce8e8")
        res.node("loadoutEffectResolver", "loadoutEffectResolver.ts", shape="box", style="rounded,filled", fillcolor="#f8cecc", fontsize="9")
        res.node("effectTypes", "effectTypes.ts", shape="box", style="rounded,filled", fillcolor="#f8cecc", fontsize="9")

    # ========== DATA FLOW ==========
    dot.edge("App", "LoadoutSlotTile", label="renders")
    dot.edge("App", "SelectorModal", label="opens on click")
    dot.edge("LoadoutSlotTile", "weaponSelectorBuilder", label="calls")
    dot.edge("weaponSelectorBuilder", "weaponRegistry", label="reads all weapons")
    dot.edge("weaponSelectorBuilder", "itemReadiness", label="classifies each")
    dot.edge("itemReadiness", "slotValidation", label="validates slot rules")
    dot.edge("slotValidation", "buildValidation", label="used by")
    dot.edge("App", "formulaBridge", label="builds CalculationInput")
    dot.edge("formulaBridge", "formulaDamageAdapter", label="calls")
    dot.edge("formulaDamageAdapter", "combatOutput", label="produces output")
    dot.edge("App", "loadoutEffectResolver", label="calls for effects")
    dot.edge("SelectorModal", "filterSelectorItems", label="uses for filtering")
    dot.edge("weaponAudit", "weaponRegistry", label="audits entire registry")

    # Render
    output_file = "project-full-architecture-map"
    dot.render(output_file, cleanup=True)
    print(f"Full project architecture map saved to: {output_file}.png")
    print(f"DOT source: {output_file}.dot")

if __name__ == "__main__":
    create_full_project_map()
