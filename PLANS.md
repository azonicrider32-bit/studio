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
