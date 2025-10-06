# 🧲 Magnet Lasso v2: The Predictive Edge-Following System

> Version: 1.0
> Status: Architectural Blueprint
> Author(s): AI Agent & User Collaboration
> Date: October 05, 2025

## 1. Executive Summary

The "Magnet Lasso v2" is a next-generation selection tool designed to dramatically improve the speed and accuracy of complex object segmentation. It fuses the area-aware intelligence of a Magic Wand with the path-based control of an edge-snapping lasso, creating a highly intuitive and powerful hybrid system.

At its core, the tool uses an adjustable circular "search radius" around the user's cursor. Within this radius, it performs a continuous, real-time segmentation (like a localized Magic Wand) to understand the texture and color the user is currently over. It then identifies the strongest, closest edge within that segmented area and intelligently "snaps" the selection path to it. As the user moves the cursor, the tool's path travels along the detected edge, automatically navigating complex curves and corners. This system allows for rapid, precise selections with minimal user effort.

### Core Innovations:

*   **Localized Dynamic Segmentation:** A real-time "Magic Wand" effect confined to a radius around the cursor, constantly updating the context of what the user is trying to select.
*   **Predictive Edge Snapping:** The lasso path doesn't just snap to the cursor's nearest edge; it snaps to the nearest edge *within the context of the currently segmented area*.
*   **Intelligent Path Traversal:** The path automatically follows the detected edge for a distance proportional to the user's cursor movement.
*   **Edge-Jumping & Pausing:** The path will pause if the cursor moves away from a valid edge and can intelligently "jump" to a new edge when the user's cursor provides a new contextual area.
*   **Angle-Limited Movement:** The path's traversal is constrained by a maximum angle difference relative to the cursor's movement, allowing it to navigate bumpy and irregular shapes without deviating wildly.

---

## 2. The Problem: The Limitations of Traditional Lassos

1.  **Standard Lasso:** Requires perfect, steady mouse control, which is difficult and time-consuming.
2.  **Polygon Lasso:** Good for straight edges, but tedious for curves.
3.  **Magnetic Lasso (Classic):** Snaps to the nearest high-contrast edge, but can easily be "distracted" by stronger, nearby edges that are not part of the intended object. It lacks contextual understanding.

Magnet Lasso v2 solves this by first understanding *what* the user is selecting (via the local segmentation) and *then* finding the most relevant edge.

---

## 3. The V2 Magnet Lasso: Detailed Mechanics

The tool's behavior is governed by a simple yet powerful set of rules that occur in real-time as the user drags the cursor.

### 3.1. The Search Radius (The "Segment Circle")

*   **Function:** An adjustable circle centered on the cursor. This is the tool's entire area of awareness. Its size can be changed by the user (e.g., with the scroll wheel).
*   **Core Mechanic:** On every `mouseMove` event, the tool performs an ultra-fast, localized segmentation (similar to the Magic Wand) within this circle, based on the color/texture directly under the cursor's center. This creates a temporary, dynamic "region of interest."

### 3.2. Radial Edge Detection

*   **Function:** Once the "region of interest" is defined, the engine performs a radial search from the cursor's center outwards.
*   **Core Mechanic:** It scans in all directions to find the nearest pixel that is both **part of the segmented region** and also has a **strong edge value** (pre-calculated via an edge map like Sobel or Canny). This is the "target edge point."

### 3.3. Path Following and Traversal

*   **Function:** The main lasso path snaps to and travels along the detected edge.
*   **Core Mechanic:**
    1.  The end of the active lasso path always snaps to the current "target edge point."
    2.  As the user moves the cursor from position A to B, the tool calculates the distance of that movement.
    3.  It then makes the lasso path travel along the detected edge for a similar distance, using a pathfinding algorithm (like A* or Dijkstra's) that uses the edge map as a guide.

### 3.4. Path Pausing and Edge Jumping

This is the key to the tool's intelligent and intuitive feel.

*   **Pausing:** If the user pulls the cursor far away from the current edge, the lasso path will stop advancing once it reaches the boundary of the circular search radius. It "waits" there, anchored to the last valid edge point.
*   **Jumping:** If the user then moves the cursor over a *new* part of the image, the local segmentation will update. If the tool detects a new, stronger, or closer edge within this new context, the lasso path will intelligently "jump" from the old edge to the new one, creating a straight line between the two anchor points.

### 3.5. Angle-Limited Movement (The "Bumpy Edge" Solution)

*   **Function:** Prevents the lasso path from making sharp, unnatural turns that don't match the user's general drawing direction.
*   **Core Mechanic:** The pathfinding algorithm is given an additional constraint. The next point on the path cannot create a segment that has an angle drastically different from the cursor's general direction of movement. A user-configurable "Max Angle Difference" (e.g., 90 degrees) in the settings panel allows the path to follow a bumpy or noisy edge (like fur) while still generally tracking the user's motion.

---

## 4. User Workflow Example

1.  User selects the **Magnet Lasso v2** tool. A circle appears around their cursor.
2.  User clicks to start the selection on the edge of a blue car.
3.  User starts dragging the cursor roughly along the car's outline.
    *   The tool continuously segments the "blue car" texture within the cursor's radius.
    *   It identifies the car's metal edge as the strongest, most relevant edge within that blue segment.
    *   The lasso path automatically snaps to this edge and follows it.
4.  The user's hand slips, and the cursor moves over the gray road.
    *   The local segmentation now sees "asphalt." The tool finds no strong edge within the asphalt segment.
    *   The lasso path pauses at its last valid point on the car's edge, waiting for new instructions.
5.  User moves the cursor back towards the car.
    *   The local segmentation becomes "blue car" again.
    *   The tool re-detects the car's edge, and the lasso path instantly jumps from its paused position to the new edge point, continuing its traversal.
6.  User double-clicks to close and complete the highly accurate, effortless selection.

---

## 5. Conclusion

The Magnet Lasso v2 represents a significant leap forward in selection technology. By combining real-time local segmentation with intelligent edge-pathfinding, it offloads the most tedious aspects of manual selection to the AI, allowing the user to guide the tool with broad, intuitive strokes. This system promises to be faster, more accurate, and far more enjoyable to use than any traditional lasso tool. It is the perfect fusion of user intent and AI precision.