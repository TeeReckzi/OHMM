#!/usr/bin/env python3
"""
OnceHumanCombatHaptics - MAXIMUM DETAIL ARCHITECTURE MAP
Complete functional view of the entire project with data flows
"""

import graphviz

def create_max_detail_map():
    dot = graphviz.Digraph(
        name="OHAI-Max-Detail-Architecture",
        comment="Maximum Detail - All Components, Flows, and Wiring",
        format="png",
        engine="dot"
    )

    dot.attr(
        rankdir="TB",
        splines="ortho",
        nodesep="0.3",
        ranksep="0.45",
        fontname="Arial",
        fontsize="8"
    )

    # ========== LAYER 1: ENTRY POINT ==========
    with dot.subgraph(name="cluster_entry") as entry:
        entry.attr(label="ENTRY POINT", style="rounded", color="#1a5276", bgcolor="#d4e6f1")
        entry.node("App", "App.tsx\n• Build State (attacker/defender)\n• Mode (PvE/PvP)\n• Tab Navigation\n• Modal State", shape="box", style="rounded,filled", fillcolor="#2980b9", fontcolor="white", fontsize="8")

    # ========== LAYER 2: PRIMARY WEAPON SELECTION FLOW ==========
    with dot.subgraph(name="cluster_weapon_flow") as wf:
        wf.attr(label="PRIMARY WEAPON SELECTION FLOW (Phase 3)", style="rounded", color="#145a32", bgcolor="#d5f5e3")

        wf.node("LoadoutSlotTile", "LoadoutSlotTile\n• slotId, label, item\n• onClick → open modal\n• Shows ReadinessBadge", shape="box", style="rounded,filled", fillcolor="#27ae60", fontsize="8")

        wf.node("SelectorModal", "SelectorModal\n• items[] from resolver\n• search + filters\n• card grid\n• onSelect → update build", shape="box", style="rounded,filled", fillcolor="#27ae60", fontsize="8")

        wf.node("buildWeaponSelectorItems", "buildWeaponSelectorItems()\n• Loops weaponRegistry\n• Calls getItemReadinessState()\n• Returns SelectorItemViewModel[]", shape="box", style="rounded,filled", fillcolor="#1e8449", fontcolor="white", fontsize="8")

        wf.node("getItemReadinessState", "getItemReadinessState()\n• Checks damage/fireRate/family\n• Returns READY / PARTIAL / DISPLAY_ONLY", shape="box", style="rounded,filled", fillcolor="#1e8449", fontcolor="white", fontsize="8")

        wf.node("validateSlotSelection", "validateSlotSelection()\n• Checks weapon family vs slot\n• Checks armor slot match\n• Checks core+ suffix completeness", shape="box", style="rounded,filled", fillcolor="#1e8449", fontcolor="white", fontsize="8")

    # ========== LAYER 3: REGISTRIES ==========
    with dot.subgraph(name="cluster_reg") as reg:
        reg.attr(label="REGISTRIES (Single Source of Truth)", style="rounded", color="#7d3c98", bgcolor="#f5eef8")
        reg.node("weaponRegistry", "weaponRegistry.ts\n• curatedEntries\n• lreAdditions (stats merge)\n• genAdditions\n• getWeapon(id)", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white", fontsize="8")
        reg.node("armorRegistry", "armorRegistry.ts\n• getArmorById()\n• getArmorBySlot()", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white", fontsize="8")
        reg.node("modRegistry", "modRegistry.ts\n• getModById()", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white", fontsize="8")

    # ========== LAYER 4: PRESENTATION ==========
    with dot.subgraph(name="cluster_pres") as pres:
        pres.attr(label="PRESENTATION LAYER", style="rounded", color="#6c3483", bgcolor="#f4ecf7")
        pres.node("weaponPresentationBridge", "weaponPresentationBridge.ts\n• getEnrichedWeaponDisplay()\n• resolveOhdbImage()", shape="box", style="rounded,filled", fillcolor="#8e44ad", fontcolor="white", fontsize="8")
        pres.node("image_resolver", "image_resolver.ts\n• resolveOhdbImage()\n• manifest-backed lookup", shape="box", style="rounded,filled", fillcolor="#8e44ad", fontcolor="white", fontsize="8")

    # ========== LAYER 5: FORMULA PIPELINE ==========
    with dot.subgraph(name="cluster_formula") as form:
        form.attr(label="FORMULA PIPELINE", style="rounded", color="#922b21", bgcolor="#fadbd8")
        form.node("formulaBridge", "formulaBridge.ts\nbuildCalculationInputFromSelection()\n• attacker → CalculationInput\n• effects, conditionalEffects, unresolvedEffects", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white", fontsize="8")
        form.node("formulaDamageAdapter", "formulaDamageAdapter.ts\nbuildExpectedDamageFromCalculationInput()\n• calls buildFormulaInput()\n• calls calculateExpectedDamage()", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white", fontsize="8")
        form.node("combatOutput", "combatOutput.ts\ncomputeCombatOutput()\n• DamageOutputMetrics\n• SurvivabilityMetrics\n• PvPDuelContext", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white", fontsize="8")

    # ========== LAYER 6: EFFECT RESOLVERS ==========
    with dot.subgraph(name="cluster_res") as res:
        res.attr(label="EFFECT RESOLVERS", style="rounded", color="#117a65", bgcolor="#d1f2eb")
        res.node("loadoutEffectResolver", "loadoutEffectResolver.ts\n• weaponEffect\n• modEffect (core/suffix)\n• armorSetBonus\n• cradleEffect", shape="box", style="rounded,filled", fillcolor="#1abc9c", fontsize="8")
        res.node("modSelectionBridge", "modSelectionBridge.ts\ngetCompletedModForCalculation()\n• requires core + suffix", shape="box", style="rounded,filled", fillcolor="#1abc9c", fontsize="8")

    # ========== LAYER 7: PERSISTENCE + INTELLIGENCE ==========
    with dot.subgraph(name="cluster_persist") as pers:
        pers.attr(label="PERSISTENCE & INTELLIGENCE", style="rounded", color="#1a5276", bgcolor="#d4e6f1")
        pers.node("SavedBuildsPanel", "SavedBuildsPanel.tsx\n• save/load JSON\n• onLoadBuild()", shape="box", style="rounded,filled", fillcolor="#3498db", fontsize="8")
        pers.node("buildIntelligenceSummary", "buildIntelligenceSummary.ts\n• BuildTrustState\n• modeled / partial / displayOnly counts", shape="box", style="rounded,filled", fillcolor="#3498db", fontsize="8")
        pers.node("BuildScorePanel", "BuildScorePanel.tsx\n• Quality Score\n• Formula Confidence", shape="box", style="rounded,filled", fillcolor="#3498db", fontsize="8")

    # ========== LAYER 8: SIMULATOR + INTEL GAP ==========
    with dot.subgraph(name="cluster_sim") as sim:
        sim.attr(label="SIMULATOR & INTEL GAP", style="rounded", color="#6c3483", bgcolor="#f5eef8")
        sim.node("simulatorEventAdapter", "simulatorEventAdapter.ts\n• getSimulatorEvents()\n• proc/conditional events", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white", fontsize="8")
        sim.node("IntelGapPanel", "IntelGapPanel.tsx\n• Request Intel\n• unresolvedEffects", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white", fontsize="8")

    # ========== DATA FLOW EDGES ==========
    # Weapon Selection Flow
    dot.edge("App", "LoadoutSlotTile", label="renders tile")
    dot.edge("LoadoutSlotTile", "SelectorModal", label="onClick opens")
    dot.edge("SelectorModal", "buildWeaponSelectorItems", label="calls")
    dot.edge("buildWeaponSelectorItems", "weaponRegistry", label="reads")
    dot.edge("buildWeaponSelectorItems", "getItemReadinessState", label="classifies")
    dot.edge("getItemReadinessState", "validateSlotSelection", label="validates")
    dot.edge("SelectorModal", "App", label="onSelect → setAttacker.weapon.blueprintId")

    # Formula Flow
    dot.edge("App", "formulaBridge", label="buildCalculationInputFromSelection(attacker)")
    dot.edge("formulaBridge", "loadoutEffectResolver", label="calls")
    dot.edge("formulaBridge", "formulaDamageAdapter", label="passes CalculationInput")
    dot.edge("formulaDamageAdapter", "combatOutput", label="produces CombatOutput")
    dot.edge("combatOutput", "CombatOutcomePanel", label="renders metrics")

    # Persistence Flow
    dot.edge("App", "SavedBuildsPanel", label="opens panel")
    dot.edge("SavedBuildsPanel", "App", label="onLoadBuild → setAttacker")

    # Intelligence Flow
    dot.edge("App", "buildIntelligenceSummary", label="calls with calcInput + output")
    dot.edge("buildIntelligenceSummary", "BuildScorePanel", label="renders score")

    # Simulator Flow
    dot.edge("App", "simulatorEventAdapter", label="calls with build + events")
    dot.edge("simulatorEventAdapter", "CombatTimeline", label="renders timeline")

    # Intel Gap
    dot.edge("App", "IntelGapPanel", label="opens on unresolvedEffects")

    # Render
    output_file = "project-max-detail-architecture-map"
    dot.render(output_file, cleanup=True)
    print(f"Maximum detail architecture map saved to: {output_file}.png")
    print(f"DOT source: {output_file}.dot")

if __name__ == "__main__":
    create_max_detail_map()
