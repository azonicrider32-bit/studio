"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Terminal } from "lucide-react";


export function LassoPanel() {
    
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="font-headline text-lg">Intelligent Lasso</h3>
        <p className="text-sm text-muted-foreground">
          Draw a freehand selection with smart edge-snapping.
        </p>
      </div>

      <Separator />

       <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>How to use</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Click on the image to start your path and add points.</li>
            <li>The path will automatically snap to nearby edges.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Enter</kbd> to complete the selection.</li>
            <li>Press <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">Esc</kbd> to cancel.</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  )
}
