"use client"

import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { Card } from "@/components/ui/card"

export function ImageCanvas() {
  const image = PlaceHolderImages.find(img => img.id === "pro-segment-ai-1")

  if (!image) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted">
        <p>Image not found</p>
      </div>
    )
  }

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg bg-background p-4 md:p-8">
      <Card className="relative aspect-[4/3] w-full max-w-5xl overflow-hidden shadow-2xl">
        <Image
          src={image.imageUrl}
          alt={image.description}
          fill
          className="object-cover"
          data-ai-hint={image.imageHint}
          priority
        />
      </Card>
    </div>
  )
}
