#!/usr/bin/env python3
"""
OnceHumanCombatHaptics - FORMULA EXECUTION PATH
Detailed view of how a build becomes damage output
"""

import graphviz

def create_formula_execution_path():
    dot = graphviz.Digraph(
        name="Formula-Execution-Path",
        comment="Detailed Formula Execution Flow",
        format="png",
        engine="dot"
    )

    dot.attr(
        rankdir="LR",
        splines="ortho",
        nodesep="0.5",
        ranksep="0.6",
        fontname="Arial",
        fontsize="9"
    )

    # ========== INPUT ==========
    with dot.subgraph(name="cluster_input") as inp:
        inp.attr(label="INPUT (Build State)", style="rounded", color="#1a5276", bgcolor="#d4e6f1")
        inp.node("BuildSelection", "BuildSelection\n• weapon.blueprintId\n• armor slots\n• mods (core + suffix)\n• calibration\n• attachments\n• food / deviation", shape="box", style="rounded,filled", fillcolor="#2980b9", fontcolor="white")

    # ========== BRIDGE ==========
    with dot.subgraph(name="cluster_bridge") as br:
        br.attr(label="FORMULA BRIDGE", style="rounded", color="#922b21", bgcolor="#fadbd8")
        br.node("formulaBridge", "formulaBridge.ts\nbuildCalculationInputFromSelection()", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        br.node("CalculationInput", "CalculationInput\n• modeledEffects[]\n• partiallyModeledEffects[]\n• displayOnlyEffects[]\n• unresolvedEffects[]\n• conditionalEffects[]\n• baseWeaponDMG", shape="box", style="rounded,filled", fillcolor="#f5b7b1")

    # ========== EFFECT RESOLVER ==========
    with dot.subgraph(name="cluster_resolver") as res:
        res.attr(label="EFFECT RESOLVERS", style="rounded", color="#117a65", bgcolor="#d1f2eb")
        res.node("loadoutEffectResolver", "loadoutEffectResolver.ts\n• weaponEffect()\n• modEffect(core + suffix)\n• armorSetBonus()\n• cradleEffect()\n• deviationEffect()", shape="box", style="rounded,filled", fillcolor="#1abc9c")

    # ========== DAMAGE ADAPTER ==========
    with dot.subgraph(name="cluster_adapter") as ad:
        ad.attr(label="DAMAGE ADAPTER", style="rounded", color="#6c3483", bgcolor="#f5eef8")
        ad.node("formulaDamageAdapter", "formulaDamageAdapter.ts\nbuildExpectedDamageFromCalculationInput()", shape="box", style="rounded,filled", fillcolor="#9b59b6", fontcolor="white")
        ad.node("FormulaInput", "FormulaInput\n• base_attack\n• final_attack_additional_rate\n• final_attack_ignore_dam_rate\n• final_special_regulate_factor\n• crit_rate, crit_dmg, etc.", shape="box", style="rounded,filled", fillcolor="#d7bde2")

    # ========== CORE FORMULA ==========
    with dot.subgraph(name="cluster_core") as core:
        core.attr(label="CORE FORMULA ENGINE", style="rounded", color="#7b241c", bgcolor="#f9ebea")
        core.node("buildFormulaInput", "buildFormulaInput()\n• aggregatedStatsToPartialRecord()", shape="box", style="rounded,filled", fillcolor="#e74c3c", fontcolor="white")
        core.node("calculateExpectedDamage", "calculateExpectedDamage()\n• final_attack = max(\n    base_attack * final_attack_additional_rate\n    * final_attack_ignore_dam_rate\n    * final_special_regulate_factor, 0)", shape="box", style="rounded,filled", fillcolor="#c0392b", fontcolor="white")
        core.node("FormulaResult", "FormulaResult\n• formulaDamage\n• primaryMechanic\n• formulaMultipliers[]", shape="box", style="rounded,filled", fillcolor="#f5b7b1")

    # ========== OUTPUT ==========
    with dot.subgraph(name="cluster_output") as out:
        out.attr(label="OUTPUT", style="rounded", color="#1e8449", bgcolor="#d5f5e3")
        out.node("combatOutput", "combatOutput.ts\ncomputeCombatOutput()", shape="box", style="rounded,filled", fillcolor="#27ae60")
        out.node("CombatOutput", "CombatOutput\n• damageOutput\n  - baseDamage, expectedDamage\n  - critMultiplier, weakspotMultiplier\n  - DPS, ticksPerSecond\n• survivability\n• pvpDuel", shape="box", style="rounded,filled", fillcolor="#2ecc71")
        out.node("CombatOutcomePanel", "CombatOutcomePanel.tsx\n• renders Damage / Shot\n• Sustained DPS\n• PvP TTK\n• Survivability metrics", shape="box", style="rounded,filled", fillcolor="#27ae60")

    # ========== DATA FLOW ==========
    dot.edge("BuildSelection", "formulaBridge", label="attacker + mode + assumptions")
    dot.edge("formulaBridge", "loadoutEffectResolver", label="build + uptimeProfile")
    dot.edge("loadoutEffectResolver", "CalculationInput", label="populates effects[]")
    dot.edge("formulaBridge", "formulaDamageAdapter", label="passes CalculationInput")
    dot.edge("formulaDamageAdapter", "buildFormulaInput", label="converts stats")
    dot.edge("buildFormulaInput", "calculateExpectedDamage", label="builds FormulaInput")
    dot.edge("calculateExpectedDamage", "FormulaResult", label="returns damage + multipliers")
    dot.edge("formulaDamageAdapter", "combatOutput", label="passes FormulaResult")
    dot.edge("combatOutput", "CombatOutput", label="final structured output")
    dot.edge("CombatOutput", "CombatOutcomePanel", label="renders to UI")

    # Render
    output_file = "formula-execution-path"
    dot.render(output_file, cleanup=True)
    print(f"Formula execution path diagram saved to: {output_file}.png")
    print(f"DOT source: {output_file}.dot")

if __name__ == "__main__":
    create_formula_execution_path()
