#!/usr/bin/env python3
"""
Transformer Encoder-Decoder Architecture - Graphviz Version
Machine Translation (6-layer Encoder + 6-layer Decoder)
"""

import graphviz

def create_transformer_diagram():
    dot = graphviz.Digraph(
        name="Transformer-Encoder-Decoder",
        comment="Transformer Architecture for Machine Translation",
        format="png",
        engine="dot"
    )

    # Global styling
    dot.attr(
        rankdir="LR",
        splines="ortho",
        nodesep="0.6",
        ranksep="0.8",
        fontname="Arial",
        fontsize="11"
    )

    # ========== INPUT SIDE ==========
    with dot.subgraph(name="cluster_input") as c:
        c.attr(label="INPUT", style="rounded", color="#9673a6", bgcolor="#f5f0f7")

        c.node("input_emb", "Input Embeddings\n(B, 512, 768)", shape="box",
               style="rounded,filled", fillcolor="#e1d5e7", color="#9673a6", fontsize="10")

        c.node("pos_enc", "Positional Encoding\n+ Input Embeddings", shape="box",
               style="rounded,filled", fillcolor="#fff2cc", color="#d6b656", fontsize="10")

        c.edge("input_emb", "pos_enc", label="")

    # ========== ENCODER ==========
    with dot.subgraph(name="cluster_encoder") as enc:
        enc.attr(label="ENCODER (6 layers)", style="rounded", color="#6c8ebf", bgcolor="#e8f0f8")

        enc.node("enc1", "Layer 1\nMulti-Head Self-Attention\n(B, 512, 768)", shape="box",
                 style="rounded,filled", fillcolor="#dae8fc", color="#6c8ebf", fontsize="9")

        enc.node("enc2", "Layer 2\nMulti-Head Self-Attention\n(B, 512, 768)", shape="box",
                 style="rounded,filled", fillcolor="#dae8fc", color="#6c8ebf", fontsize="9")

        enc.node("enc_mid", "Layers 3–5\nSelf-Attention + FFN", shape="box",
                 style="rounded,filled", fillcolor="#dae8fc", color="#6c8ebf", fontsize="9")

        enc.node("enc6", "Layer 6\nMulti-Head Self-Attention\n(B, 512, 768)", shape="box",
                 style="rounded,filled", fillcolor="#dae8fc", color="#6c8ebf", fontsize="9")

        enc.edge("enc1", "enc2", label="")
        enc.edge("enc2", "enc_mid", label="")
        enc.edge("enc_mid", "enc6", label="")

    # ========== DECODER ==========
    with dot.subgraph(name="cluster_decoder") as dec:
        dec.attr(label="DECODER (6 layers)", style="rounded", color="#82b366", bgcolor="#e8f5e8")

        dec.node("dec1", "Layer 1\nMasked Self-Attn → Cross-Attn\n(B, 512, 768)", shape="box",
                 style="rounded,filled", fillcolor="#d5e8d4", color="#82b366", fontsize="9")

        dec.node("dec2", "Layer 2\nMasked Self-Attn → Cross-Attn\n(B, 512, 768)", shape="box",
                 style="rounded,filled", fillcolor="#d5e8d4", color="#82b366", fontsize="9")

        dec.node("dec_mid", "Layers 3–5\nSelf-Attn + Cross-Attn + FFN", shape="box",
                 style="rounded,filled", fillcolor="#d5e8d4", color="#82b366", fontsize="9")

        dec.node("dec6", "Layer 6\nMasked Self-Attn → Cross-Attn\n(B, 512, 768)", shape="box",
                 style="rounded,filled", fillcolor="#d5e8d4", color="#82b366", fontsize="9")

        dec.edge("dec1", "dec2", label="")
        dec.edge("dec2", "dec_mid", label="")
        dec.edge("dec_mid", "dec6", label="")

    # ========== OUTPUT ==========
    dot.node("output_proj", "Output Projection\nLinear + Softmax\n(B, 512, vocab_size)", shape="box",
             style="rounded,filled", fillcolor="#ffe6cc", color="#d79b00", fontsize="10")

    # ========== CONNECTIONS ==========
    # Input → Encoder
    dot.edge("pos_enc", "enc1", label="")

    # Encoder → Decoder (Cross-Attention)
    dot.edge("enc6", "dec1", label="Encoder Output\n(context)", color="#9673a6", style="dashed")

    # Decoder → Output
    dot.edge("dec6", "output_proj", label="")

    # ========== LEGEND ==========
    with dot.subgraph(name="cluster_legend") as leg:
        leg.attr(label="Legend", style="rounded", color="#666666", bgcolor="#f9f9f9")
        leg.node("legend_enc", "Encoder (Self-Attention)", shape="box",
                 style="rounded,filled", fillcolor="#dae8fc", color="#6c8ebf", fontsize="9")
        leg.node("legend_dec", "Decoder (Cross-Attention)", shape="box",
                 style="rounded,filled", fillcolor="#d5e8d4", color="#82b366", fontsize="9")
        leg.node("legend_out", "Output Projection", shape="box",
                 style="rounded,filled", fillcolor="#ffe6cc", color="#d79b00", fontsize="9")

    # Render
    output_file = "transformer-encoder-decoder-graphviz"
    dot.render(output_file, cleanup=True)
    print(f"Diagram rendered to: {output_file}.png")
    print(f"Source DOT file: {output_file}.dot")

if __name__ == "__main__":
    create_transformer_diagram()
