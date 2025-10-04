# Today's Development Plan

This document outlines the key features and tools we will work on today.

## 1. Advanced Layer & Segment Manipulation

- **Auto-Copy on Segment Creation**: When a new segment layer is created (via Lasso or Magic Wand), it will automatically contain the actual pixel data from the original image within its boundaries, not just a mask.
- **Transformable Segments**: Enable moving, rotating, and scaling of these pixel-filled segment layers on the canvas.
- **Segment as a "Stamp"**: Implement functionality to use a segment as a non-destructive mask. This will allow us to "stamp" a shape onto another layer, setting the opacity of the affected pixels to zero while preserving the original data for later restoration.
- **Layer Grouping**: Add the ability to group layers together in the layers panel for better organization.

## 2. Non-Destructive Eraser & Restore Tools

- **Eraser Tool**: This will function as a brush that sets pixel opacity to zero non-destructively. It will have adjustable size and edge sharpness (feathering).
- **Restore Brush**: A new brush that reverses the effects of the eraser (or other non-destructive filters), restoring pixels to their original state (e.g., bringing opacity back to 100%).

## 3. Clone Brush Tool

- Implement a classic clone/stamp tool for sampling and painting pixels from one area of the image to another.

## 4. AI Inpainting Integration

- We will leverage our existing Genkit setup to use the powerful `gemini-2.5-flash-image-preview` model for generative inpainting.
- This will allow you to select an area and use a text prompt to fill it with AI-generated content.

## 5. AI-Assisted Lasso Path Refinement (Project 'Epiphany')

### Core Concept
Implement a groundbreaking "Intelligent Snap" system for the lasso tool. As the user draws a rough path, the application will use a fast, multimodal AI model (`gemini-2.5-flash-image-preview`) to analyze the local image area around the path in real-time. The AI will return a refined path that "snaps" to the most prominent and contextually relevant object edges, effectively automating the tedious process of manual pixel-hunting.

### Hybrid Architecture for Real-Time Feel

To ensure optimal latency and user experience, we will use a two-stage hybrid approach:

1.  **Stage 1: Instant Client-Side Snapping (Low-Fidelity)**
    *   As the user draws, a lightweight, on-device algorithm (e.g., a simple edge detector like Sobel or Canny) will provide an instantaneous, low-fidelity snap to the nearest high-contrast line. This provides immediate visual feedback.

2.  **Stage 2: AI-Powered Semantic Refinement (High-Fidelity)**
    *   In parallel, we will break the user's path into segments and send small image "chunks" (tiles) around each segment to a Genkit flow on the server.
    *   The prompt will ask the AI to return a refined set of coordinates for that chunk, based on its semantic understanding of the content (e.g., distinguishing a hairline from a background).
    *   When the AI response arrives (expected latency: 100-300ms), the client will seamlessly replace the initial low-fidelity path segment with the superior, AI-generated one.

This hybrid model gives the user instant feedback, followed by a near-instant refinement into a perfect selection, creating a "magical" and responsive feel.

### Key Features & User Settings

To provide maximum control and flexibility, the following settings will be added to the Intelligent Lasso tool panel:

- **AI Refinement Mode**:
    - **Real-time:** The default mode. The path refines on the fly as the user draws.
    - **Post-Draw:** The user draws a complete rough path and then clicks an "AI Refine" button to process the entire path at once.

- **AI Detail Level (Chunk Size)**: A slider that controls the size of the image chunks sent to the AI.
    - **Large Chunks (e.g., 512px):** Faster performance, lower cost, ideal for simple edges.
    - **Small Chunks (e.g., 128px):** Higher detail and precision for complex edges (hair, fur), at the cost of more API calls.

- **Cost Function (For Genkit Flow)**: An internal parameter in our `intelligent-lasso-assisted-path-snapping` flow to allow for different server-side analysis methods, giving us a way to balance speed and quality.
