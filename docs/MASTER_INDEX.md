# 📚 ProSegment AI: Master Architectural Index

> Version: 1.0
> Status: Live Document
> Date: October 05, 2025

## 1. Introduction

This document serves as the master index for all technical and architectural blueprints for the ProSegment AI application. It provides a centralized, high-level overview of every core system, from the underlying AI memory architecture to the user-facing toolsets. Each entry links to the exhaustive documentation for that specific component.

---

## 2. Core Application & AI Foundation

These documents describe the fundamental systems that power the entire application's intelligence and context management.

*   ### [🧠 The AI Memory Operating System (AI-MOS)](./AI_MOS_DOCUMENTATION.md)
    *   **Summary:** A groundbreaking architecture for providing AI with unlimited context, perfect memory retention, and intelligent, self-managed knowledge persistence. It is the consciousness layer for the application's AI.
    *   **Status:** Comprehensive Specification v2.0

---

## 3. Generative AI Editing Systems

This section covers the innovative AI-powered tools that allow users to perform visual edits through multimodal instructions.

*   ### [🍌 The "Nano Banana" Visual AI Editing System (v2)](./NANO_BANANA_SYSTEM_V2_BLUEPRINT.md)
    *   **Summary:** The core specification for the multimodal sketch-and-prompt editing system. It details how user drawings and text are converted into structured commands for the `gemini-2.5-flash-image-preview` model to enable a non-destructive, layer-based workflow.
    *   **Status:** Detailed Architectural Blueprint v2.0

*   ### [🧊 The "Perspective Cage" 3D Guidance System](./PERSPECTIVE_CAGE_SYSTEM.md)
    *   **Summary:** A revolutionary visual instruction system that overlays a manipulatable 3D environment (ground plane, primitive shapes) onto a 2D image. It provides unambiguous 3D context for the AI to perform perspective-correct object additions and modifications.
    *   **Status:** Architectural Blueprint v1.0

*   ### [⚙️ The "Janus" Advanced Alignment Engine](./ADVANCED_ALIGNMENT_ENGINE.md)
    *   **Summary:** A critical computer vision pipeline that automatically corrects for geometric drift (scale, rotation, skew) in AI-generated images. It uses feature matching and homography to ensure pixel-perfect alignment between the original and generated content.
    *   **Status:** Architectural Blueprint v1.0

---

## 4. Core Editing & Segmentation Tools

These documents detail the user-facing tools for selection, transformation, and manipulation.

*   ### [✨ The Transform Tool v2 Blueprint](./TRANSFORM_TOOL_V2_BLUEPRINT.md)
    *   **Summary:** A revolutionary redesign of the standard free transform interface. It features an intelligent border with dual arrows for scaling, dual sliders for skewing, a "Balloon Toggle" for warping, on-canvas layer ordering, and intelligent handling for small objects.
    *   **Status:** Detailed Architectural Specification v2.0

*   ### [🎨 The Segmentation Systems Encyclopedia](./SEGMENTATION_SYSTEMS.md)
    *   **Summary:** An exhaustive reference for over 30 image segmentation methodologies, from classical algorithms (Thresholding, Canny) to advanced AI-enhanced systems (SAM2, TSP-Optimization). This document forms the theoretical foundation for our selection tools.
    *   **Status:** Comprehensive Encyclopedia v1.0

*   ### [🚀 High-Fidelity Image Registration Analysis](./HIGH_FIDELITY_IMAGE_REGISTRATION.md)
    *   **Summary:** An in-depth analysis of the computer vision techniques required for high-accuracy geometric correction, covering sparse feature mapping, deep flow architectures, and non-linear warping. It provides the theoretical underpinnings for the "Janus" Alignment Engine.
    *   **Status:** Exhaustive Analysis v1.0

*   ### [🎬 The Hybrid Processing Architecture for High-Performance In-Browser Applications](./HYBRID_VIDEO_PROCESSING_ARCHITECTURE.md)
    *   **Summary:** A blueprint for achieving desktop-class performance in a web application by strategically partitioning tasks. It details using Web Workers for local parallelism and offloading compute-intensive operations (like AI analysis or rendering) to the cloud.
    *   **Status:** Architectural Blueprint v1.0

---

## 5. Code & Implementation Examples

This section links to markdown files containing direct code examples and component structures for reference.

*   ### [💻 Efficient Segmentation System Code Example](./EFFICIENT_SEGMENTATION_SYSTEM_EXAMPLE.md)
    *   **Summary:** Contains reference code for a high-performance segmentation system, including the full component structure for the `[Workspace]`, `[Compare]`, and other UI elements.
    *   **Status:** Code Reference
*   ### [💻 ProSegment AI: Complete Application Code Reference](./APP_CODE_REFERENCE.md)
    *   **Summary:** An exhaustive, centralized snapshot of the complete source code for all major components and systems within the ProSegment AI application.
    *   **Status:** Live Code Snapshot v1.0