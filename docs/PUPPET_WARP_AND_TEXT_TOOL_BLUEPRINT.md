# 🪡 The AI Puppet Warp & Text Tool Blueprint

> Version: 1.0
> Status: Architectural Blueprint
> Author(s): AI Agent & User Collaboration
> Date: October 05, 2025

## 1. Executive Summary

This document outlines the architecture for two highly innovative, AI-driven editing tools: the **AI Puppet Warp** system and the **AI Text Changer**. The Puppet Warp tool allows users to define complex, non-rigid deformations by drawing a "before" and "after" path, giving the AI an unambiguous geometric instruction. The Text Changer provides a streamlined, one-click workflow for seamlessly replacing text within an image. Both tools are designed to leverage the "Nano Banana" visual instruction system for precise, layer-based results.

### Core Innovations:

*   **Geometric Instruction via Twin Nodes:** The Puppet Warp tool introduces a "twin node" system. An initial path (open or closed) is drawn on an object's edge, and a second, user-modified path is automatically populated with a corresponding number of nodes. Visual connectors between these "twin nodes" provide a clear, geometric "cage" that instructs the AI on how to warp or deform the object.
*   **Modal Path-Drawing:** The tool supports both a `Polygon` style (click-to-place nodes) and a `Free-draw` style (evenly distributing nodes based on path length and draw speed) for maximum flexibility.
*   **One-Click Text Editing:** The AI Text Changer simplifies a complex workflow into a single action. The user selects text, types a replacement, and the system automates the process of inpainting, creating a new layer, and masking to produce a clean, editable text layer.

---

## 2. The AI Puppet Warp Tool

This tool is designed for high-fidelity, non-rigid transformations of objects or parts of an object. It operates in two main modes: Edge Warp (for open paths) and Object Deform (for closed paths).

### 2.1. Core Mechanic: The "Twin Node" System

1.  **Draw Initial Path:** The user selects the tool and draws the first path, which we'll call `Line A`.
    *   **Polygon Mode:** The user clicks to place nodes, which are connected by straight lines.
    *   **Free-draw Mode:** The user draws a freehand line. The system automatically places nodes along this path at evenly spaced intervals, while also retaining high-density nodes from the user's raw input to capture detail. The number of nodes can be adjusted in the tool's settings.

2.  **Draw Modified Path:** The user then draws the second path, `Line B`, representing the target shape or position.

3.  **Automatic Node Twinning:** This is the critical step.
    *   The system automatically creates the *exact same number* of evenly spaced nodes on `Line B` as were created on `Line A`.
    *   Each node on `Line A` now has a corresponding "twin" on `Line B`.

4.  **Visual Feedback (The "Puppet Cage"):** The UI renders:
    *   `Line A` in one color (e.g., blue).
    *   `Line B` in a different color (e.g., red).
    *   Connecting lines (the "threads") between each pair of twin nodes. This creates a clear visual representation of the deformation map.

5.  **Node Adjustment:** The user can click and drag the nodes on `Line B` to fine-tune the transformation. The connecting threads update in real-time.

### 2.2. Workflow A: Edge Warp (Open Path)

*   **Use Case:** Changing the contour of an object, like making a straight object curved, or altering a smile on a face.
*   **Process:**
    1.  The user draws `Line A` along the edge they wish to modify.
    2.  They draw `Line B` where they want the new edge to be, introducing a curve, a change in scale, or a new position.
    3.  The system generates the puppet cage.
    4.  Upon execution, a pre-defined prompt is sent to the Nano Banana AI: **"Warp the image content, using the blue line as the source and the red line as the target. The connecting lines show the path of deformation. Blend the result seamlessly with the surrounding image."**

### 2.3. Workflow B: Object Deform (Closed Path)

*   **Use Case:** Deforming an entire object enclosed by a selection.
*   **Process:**
    1.  The user draws a closed lasso path (`Line A`) around the object.
    2.  They then draw a second, deformed closed path (`Line B`) representing the desired final shape.
    3.  The system creates the twin nodes and the puppet cage.
    4.  The user can adjust the nodes on `Line B` to perfect the deformation.
    5.  The prompt sent to the AI is: **"Deform the object inside the blue selection to fit inside the red selection, using the connecting threads as a guide for the transformation. Preserve the object's texture and internal features as much as possible."**

---

## 3. The AI Text Changer Tool

This tool is designed for maximum efficiency, automating a common and tedious editing task.

### 3.1. One-Click Workflow

1.  **Select Text:** The user selects the "AI Text Changer" tool and draws a simple lasso selection around the text they want to replace.
2.  **Enter New Text:** A small, floating input panel appears immediately, prompting the user to type their desired new text.
3.  **Execute:** The user hits Enter or clicks "Generate."

### 3.2. Automated Backend Process

When the user executes the command, the system performs the following sequence automatically:

1.  **Prepare AI Request:** It packages the source image, the user's lasso selection as a mask, and a pre-formatted prompt: **"Replace the text within the masked area with the following: '[user's new text]'. Match the original font, style, color, lighting, and perspective as closely as possible."**
2.  **Invoke Nano Banana Flow:** The request is sent to our `inpaintWithPrompt` Genkit flow.
3.  **Receive Generated Image:** The AI returns a full image with the new text generated in place.
4.  **Isolate and Layer:** This is the crucial non-destructive step.
    *   A new, empty layer is created.
    *   The system uses the user's original lasso selection to "cut out" the newly generated text from the AI's output image.
    *   This cropped new text is placed onto the new layer.
5.  **Final Result:** The user is left with a clean, editable layer containing only the new text, perfectly positioned over the original image. They can now further transform, color-correct, or modify this text layer independently.

---

## 4. Conclusion

The AI Puppet Warp and Text Changer tools represent a significant advancement in our application's mission to fuse intuitive user interaction with powerful AI capabilities. They abstract away complex prompt engineering and manual editing steps, allowing the user to express their intent visually and directly. By building these tools on the foundation of our structured, layer-based Nano Banana system, we ensure that every powerful generative edit remains fully non-destructive and integrated into a professional creative workflow.
