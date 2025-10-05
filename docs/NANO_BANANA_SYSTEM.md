# 🍌 The "Nano Banana" Visual AI Editing System

> Version: 1.0
> Status: Core Architecture Specification
> Authors: AI Agent & User Collaboration
> Date: October 03, 2025

## 1. Executive Summary

The "Nano Banana" system represents a paradigm shift in generative image editing, moving beyond simple text prompts to a more intuitive, powerful, and precise **visual instruction** workflow. By allowing users to draw, write, and sketch directly onto an image canvas, we provide contextually rich instructions to a multimodal AI.

This system's key innovation is its **structured pipeline**. It doesn't just return a final, flattened image. Instead, it leverages the `gemini-2.5-flash-image-preview` model to deconstruct the editing task, returning a final rendered image, a pixel-perfect segmentation mask of the changed areas, and structured metadata about the manipulated objects. This enables a seamless transition from generative AI creation to a non-destructive, layer-based editing workflow, offering the best of both worlds.

---

## 2. Core Concept: From Text Prompts to Visual Instructions

Traditional AI image editing relies on describing desired changes in text. The Nano Banana system is built on a more intuitive premise: **show, don't just tell.**

Users can:
-   **Draw a shape** where a new object should be.
-   **Circle an object** to be removed or modified.
-   **Sketch a contour** to guide a subtle change (e.g., altering a nose).
-   **Write text directly on the image** to provide clarification.

Each of these actions, color-coded into distinct "instruction layers," provides the AI with rich spatial and semantic context that a simple text prompt could never achieve.

---

## 3. The User Workflow

The user experience is designed to be as fluid and intuitive as a real-world sketchbook.

1.  **Activate the Tool**: The user selects the **Nano Banana Tool** (🍌 icon) from the main toolbar.
2.  **Sketching on Canvas**: The canvas enters a "drawing mode." The user can now draw freely on a temporary overlay.
3.  **Creating Instruction Layers**:
    -   The user starts drawing in a default color (e.g., red).
    -   By pressing the **`Shift` key**, the tool cycles to a new color (e.g., green). Each new color represents a new, distinct instruction layer. This allows for complex, multi-step commands in a single generation request (e.g., "add a hat" in red, "remove the glasses" in green).
4.  **Prompting per Layer**:
    -   The **Nano Banana Settings Panel** dynamically updates, showing a list of all active color layers.
    -   Each entry displays the **color swatch**, a **thumbnail** of the sketch for that color, and a **text input field**.
    -   The user types a simple instruction for each color (e.g., Red: "a blue baseball cap", Green: "remove these sunglasses"). Voice-to-text can also be used here.
5.  **Execution**: The user clicks the "Generate" button. The system bundles the original image, all sketch layers, and the structured prompts into a single request to the AI.

---

## 4. The AI Pipeline: Structured, Predictable Output

This is the core innovation of the Nano Banana system. We don't just ask the AI for an image; we command it to return a structured JSON object that fuels our non-destructive workflow.

### 4.1. Genkit Flow: `visual-edit-flow.ts`

A new, dedicated Genkit flow handles the entire AI interaction.

-   **Input (`VisualEditInput`)**: The flow accepts a single object containing:
    1.  `sourceImageUri`: The original image.
    2.  `sketchImageUri`: A composite image of all colored sketches.
    3.  `instructions`: An array of objects, each mapping a color to a text prompt. `[{ "color": "#FF0000", "prompt": "a blue baseball cap" }]`

-   **Prompt Engineering**: The prompt sent to the `gemini-2.5-flash-image-preview` model is carefully engineered to demand a structured response. It explicitly tells the AI to return three distinct items.

### 4.2. Structured AI Output (`VisualEditOutput`)

The AI is instructed to return a JSON object with the following schema:

1.  `finalImageUri`: A data URI of the final, fully rendered image with all requested edits applied.
2.  `segmentationMaskUri`: **This is the critical component.** A black-and-white data URI where white pixels represent the *exact areas that were newly generated or modified*. Black pixels represent the unchanged areas of the original image. This mask is the key to isolating the edits.
3.  `editedObjects`: An array of objects, where each object contains a `label`, the associated `color` from the instruction, and a `box` (bounding box coordinates) for each major item the AI added or modified.

---

## 5. Client-Side Processing: From Generation to Layers

When the application receives the structured `VisualEditOutput` from the Genkit flow, it performs the following automated actions:

1.  **Isolate the Edit**: The application uses the `segmentationMaskUri` to "cut out" the newly generated content from the `finalImageUri`. This creates a perfectly cropped image of *only* the change (e.g., just the generated baseball cap on a transparent background).
2.  **Create a New Layer**: A new layer is created in the `LayersPanel`.
3.  **Apply the Cropped Image**: The isolated, transparent image from step 1 is placed onto this new layer.
4.  **Position the Layer**: The layer's position and bounds are set based on the `editedObjects` metadata returned by the AI.
5.  **Enable Non-Destructive Editing**: The new object is now on its own layer. The user can immediately:
    -   Select the **Transform Tool** to move, resize, or rotate it.
    -   Add adjustment layers to change its color or brightness.
    -   Use the **Eraser Tool** to make non-destructive modifications to its mask.
    -   Change its opacity or blending mode.

---

## 6. Conclusion: The Future of Hybrid Editing

The Nano Banana system bridges the gap between the raw generative power of AI and the precision of professional, layer-based editing software. By enforcing a structured, predictable pipeline, we transform the AI from a black box that produces flat images into a collaborative partner that delivers clean, editable assets. This workflow is intuitive, powerful, and lays the foundation for a new class of intelligent creative tools.