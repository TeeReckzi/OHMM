#!/usr/bin/env python3
"""
OnceHumanCombatHaptics - COMPLETE SINGLE ARCHITECTURE MAP
All layers, modules, relationships, data flows, and wiring
"""

import graphviz

def create_complete_architecture_map():
    dot = graphviz.Digraph(
        name="OHAI-Complete-Architecture",
        comment="Full Project Architecture - All Layers & Relationships",
        format="png",
        engine="dot"
    )

    dot.attr(
        rankdir="TB",
        splines="ortho",
        nodesep="0.35",
        ranksep="0.55",
        fontname="Arial",
        fontsize="9"
    )

    # ========== LAYER 1: UI SHELL ==========
    with dot.subgraph(name="cluster_ui_shell") as ui:
        ui.attr(label="LAYER 1: UI Shell & Main Components", style="rounded", color="#2c3e50", bgcolor="#ecf0f1")
        ui.node("App", "App.tsx\n(Main State + Routing)", shape="box", style="rounded,filled", fillcolor="#3498db", fontcolor="white")
        ui.node("OHMMHeader", "OHMMHeader.tsx", shape="box", style="rounded,filled", fillcolor="#3498db", fontcolor="white")
        ui.node("MetaMetricsConsole", "MetaMetricsConsole.tsx", shape="box", style="rounded,filled", fillcolor="#3498db", fontcolor="white")

    # ========== LAYER 2: SELECTOR SYSTEM ==========
    with dot.subgraph(name="cluster_selectors") as sel:
        sel.attr(label="LAYER 2: Selector System (Phase 3)", style="rounded", color="#27ae60", bgcolor="#e8f8f5")
        sel.node("LoadoutSlotTile", "LoadoutSlotTile.tsx", shape="box", style="rounded,filled", fillcolor="#2ecc71")
        sel.node("SelectorModal", "SelectorModal.tsx", shape="box", style="rounded,filled", fillcolor="#2ecc71")
        sel.node("SelectorFilterBar", "SelectorFilterBar.tsx", shape="box", style="rounded,filled", fillcolor="#2ecc71")
        sel.node("weaponSelectorBuilder", "weaponSelectorBuilder.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("itemReadiness", "itemReadiness.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("slotValidation", "slotValidation.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("buildValidation", "buildValidation.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("calibrationResolver", "calibrationResolver.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("weaponAudit", "weaponAudit.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("filterSelectorItems", "filterSelectorItems.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("selectorTypes", "selectorTypes.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")
        sel.node("normalization", "normalization.ts", shape="box", style="rounded,filled", fillcolor="#27ae60", fontcolor="white")

    # ========== LAYER 3: REGISTRIES ==========
    with dot.subgraph(name="cluster_registries") as reg:
        reg.attr(label="LAYER 3: Registries (Data Sources)", style="rounded", color="#f39c12", bgcolor="#fef9e7")
        reg.node("weaponRegistry", "weaponRegistry.ts\n(110 weapons)", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("armorRegistry", "armorRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("modRegistry", "modRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("deviationRegistry", "deviationRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("foodBuffRegistry", "foodBuffRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("ammoRegistry", "ammoRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("attachmentRegistry", "attachmentRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("cradleRegistry", "cradleRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")
        reg.node("pveTargetRegistry", "pveTargetRegistry.ts", shape="box", style="rounded,filled", fillcolor="#f1c40f")

    # ========== LAYER 4: PRESENTATION / OHDB ==========
    with dot.subgraph(name="cluster_presentation") as pres:
        pres.attr(label="LAYER 4: Presentation & OHDB Layer", style="rounded", color="#8e44ad", bgcolor="#f5eef8")
        pres.node("weaponPresentationBridge", "weaponPresentationBridge.ts", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white")
        pres.node("armorPresentationBridge", "armorPresentationBridge.ts", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white")
        pres.node("image_resolver", "image_resolver.ts", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white")
        pres.node("itemImageOverrides", "itemImageOverrides.ts", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white")
        pres.node("presentation_enrichment", "presentation_enrichment.ts", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white")

    # ========== LAYER 5: FORMULA ENGINE ==========
    with dot.subgraph(name="cluster_engine") as eng:
        eng.attr(label="LAYER 5: Formula Engine", style="rounded", color="#c0392b", bgcolor="#fadbd8")
        eng.node("formulaBridge", "formulaBridge.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        eng.node("formulaDamageAdapter", "formulaDamageAdapter.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        eng.node("combatOutput", "combatOutput.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        eng.node("officialFormulaGraphRuntime", "officialFormulaGraphRuntime.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        eng.node("formulaApplicator", "formulaApplicator.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        eng.node("formulaContext", "formulaContext.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        eng.node("buildComparisonEngine", "buildComparisonEngine.ts", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")

    # ========== LAYER 6: RESOLVERS & EFFECTS ==========
    with dot.subgraph(name="cluster_resolvers") as res:
        res.attr(label="LAYER 6: Effect Resolvers", style="rounded", color="#16a085", bgcolor="#e8f6f3")
        res.node("loadoutEffectResolver", "loadoutEffectResolver.ts", shape="box", style="rounded,filled", fillcolor="#1abc9c")
        res.node("effectTypes", "effectTypes.ts", shape="box", style="rounded,filled", fillcolor="#1abc9c")
        res.node("modSelectionBridge", "modSelectionBridge.ts", shape="box", style="rounded,filled", fillcolor="#1abc9c")
        res.node("modSuffixLegality", "modSuffixLegality.ts", shape="box", style="rounded,filled", fillcolor="#1abc9c")
        res.node("ammoCompatibilityResolver", "ammoCompatibilityResolver.ts", shape="box", style="rounded,filled", fillcolor="#1abc9c")

    # ========== LAYER 7: PERSISTENCE + INTELLIGENCE + SIMULATOR ==========
    with dot.subgraph(name="cluster_persistence") as pers:
        pers.attr(label="LAYER 7: Persistence, Intelligence & Simulator", style="rounded", color="#2980b9", bgcolor="#ebf5fb")
        pers.node("SavedBuildsPanel", "SavedBuildsPanel.tsx", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("savedBuildSchema", "savedBuildSchema.ts", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("buildIntelligenceSummary", "buildIntelligenceSummary.ts", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("BuildScorePanel", "BuildScorePanel.tsx", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("buildQualityScore", "buildQualityScore.ts", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("simulatorEventAdapter", "simulatorEventAdapter.ts", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("CombatTimeline", "CombatTimeline", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("IntelGapPanel", "IntelGapPanel.tsx", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("AssumptionControlCenter", "AssumptionControlCenter.tsx", shape="box", style="rounded,filled", fillcolor="#3498db")
        pers.node("ConditionalEffectPanel", "ConditionalEffectPanel.tsx", shape="box", style="rounded,filled", fillcolor="#3498db")

    # ========== LAYER 8: DATA PIPELINE ==========
    with dot.subgraph(name="cluster_pipeline") as pipe:
        pipe.attr(label="LAYER 8: Data Pipeline", style="rounded", color="#7f8c8d", bgcolor="#f4f6f7")
        pipe.node("parsers", "src/parsers/", shape="box", style="rounded,filled", fillcolor="#95a5a6")
        pipe.node("schemas", "src/schemas/", shape="box", style="rounded,filled", fillcolor="#95a5a6")
        pipe.node("verification", "src/verification/", shape="box", style="rounded,filled", fillcolor="#95a5a6")

    # ========== CONNECTIONS ==========
    # UI → Selector
    dot.edge("App", "LoadoutSlotTile", label="renders")
    dot.edge("App", "SelectorModal", label="opens")
    dot.edge("LoadoutSlotTile", "weaponSelectorBuilder", label="calls")
    dot.edge("SelectorModal", "filterSelectorItems", label="uses")

    # Selector → Registries
    dot.edge("weaponSelectorBuilder", "weaponRegistry", label="reads")
    dot.edge("weaponSelectorBuilder", "itemReadiness", label="classifies")
    dot.edge("itemReadiness", "slotValidation", label="validates")
    dot.edge("slotValidation", "buildValidation", label="used by")

    # Registries → Presentation
    dot.edge("weaponRegistry", "weaponPresentationBridge", label="feeds")
    dot.edge("armorRegistry", "armorPresentationBridge", label="feeds")
    dot.edge("weaponPresentationBridge", "image_resolver", label="uses")

    # UI → Formula Engine
    dot.edge("App", "formulaBridge", label="builds input")
    dot.edge("formulaBridge", "formulaDamageAdapter", label="calls")
    dot.edge("formulaDamageAdapter", "combatOutput", label="produces")

    # Formula Engine → Resolvers
    dot.edge("formulaBridge", "loadoutEffectResolver", label="uses")
    dot.edge("loadoutEffectResolver", "effectTypes", label="defines")

    # Mod System
    dot.edge("modSelectionBridge", "modSuffixLegality", label="uses")
    dot.edge("App", "modSelectionBridge", label="calls")

    # Persistence & Intelligence
    dot.edge("App", "SavedBuildsPanel", label="opens")
    dot.edge("App", "buildIntelligenceSummary", label="calls")
    dot.edge("buildIntelligenceSummary", "BuildScorePanel", label="feeds")

    # Simulator
    dot.edge("App", "simulatorEventAdapter", label="uses")
    dot.edge("simulatorEventAdapter", "CombatTimeline", label="provides events")

    # Intel Gap
    dot.edge("App", "IntelGapPanel", label="opens")
    dot.edge("App", "AssumptionControlCenter", label="uses")

    # Data Pipeline
    dot.edge("parsers", "schemas", label="validates")
    dot.edge("schemas", "verification", label="verifies")
    dot.edge("verification", "weaponRegistry", label="produces")

    # Render
    output_file = "project-complete-architecture-map"
    dot.render(output_file, cleanup=True)
    print(f"Complete architecture map saved to: {output_file}.png")
    print(f"DOT source: {output_file}.dot")

if __name__ == "__main__":
    create_complete_architecture_map()
