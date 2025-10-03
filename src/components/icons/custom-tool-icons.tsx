
import { cn } from "@/lib/utils";
import * as React from "react";

export const CustomWand2 = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-wand-2", className)}
    {...props}>
      <path d="M15 4V2"/>
      <path d="M15 10V8"/>
      <path d="m12.3 7.3.9-1.8.9 1.8"/>
      <path d="M17.8 12.2.9-1.8.9 1.8"/>
      <path d="M20 15h-2"/>
      <path d="M8 15H6"/>
      <path d="m12.3 16.7.9-1.8.9 1.8"/>
      <path d="M4.2 12.2.9-1.8.9 1.8"/>
      <path d="M8 4V2"/>
      <path d="M8 10V8"/>
      <path d="M3 7h2"/>
      <path d="M21 7h-2"/>
      <path d="m9.2 12.3-1.8.9 1.8.9"/>
      <path d="m14.8 12.3-1.8.9 1.8.9"/>
      <path d="m16.7 9.2-.9 1.8-.9-1.8"/>
      <path d="m7.3 9.2-.9 1.8-.9-1.8"/>
      <path d="M12 22v-3.5c0-1.25 1-3.5 3-3.5s3 2.25 3 3.5V22"/>
      <path d="M6 18.5c0-1.25 1-3.5 3-3.5s3 2.25 3 3.5"/>
  </svg>
));
CustomWand2.displayName = "CustomWand2";

export const MagnetLassoIcon = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-magnet", className)}
    {...props}>
    <path d="M15 6v12"/>
    <path d="M9 6v12"/>
    <path d="M15 6a6 6 0 0 0-12 0"/>
    <path d="M9 6a6 6 0 0 1 12 0"/>
    <path d="m13 13-1.5-1.5-1.5 1.5"/>
    <path d="m13 17-1.5-1.5-1.5 1.5"/>
    <path d="m13 9-1.5-1.5-1.5 1.5"/>
  </svg>
));
MagnetLassoIcon.displayName = "MagnetLassoIcon";

export const CustomPenTool = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-pen-tool", className)}
    {...props}>
    <path d="M12 22h6a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v10"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
    <path d="M12.4 12.6a2 2 0 1 0-2.8 2.8l6.3 6.3"/>
  </svg>
));
CustomPenTool.displayName = "CustomPenTool";

export const CustomBrush = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-brush", className)}
    {...props}>
    <path d="M9.06 11.9 16 5.02c.81-.77.81-2.03 0-2.8l-1.18-1.18c-.77-.77-2.03-.77-2.8 0L5.02 8.01"/>
    <path d="m12.01 9.02 3 3"/>
    <path d="M14.01 11.02 5 20.01c-.81.77-2.13.77-2.94 0l-1.07-1.06c-.81-.77-.81-2.03 0-2.8Z"/>
  </svg>
));
CustomBrush.displayName = "CustomBrush";

export const CustomEraser = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-eraser", className)}
    {...props}>
    <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21H7"/>
    <path d="M22 11.5 12.5 2"/>
    <path d="m10.5 9.5 8 8"/>
  </svg>
));
CustomEraser.displayName = "CustomEraser";

export const CustomHand = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-hand", className)}
    {...props}>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"/>
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"/>
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-4c-2.2 0-4-1.8-4-4v-4.5"/>
  </svg>
));
CustomHand.displayName = "CustomHand";

export const CustomMove = React.forwardRef<
  SVGSVGElement,
  React.SVGProps<SVGSVGElement>
>(({ className, ...props }, ref) => (
  <svg 
    ref={ref}
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={cn("lucide lucide-move", className)}
    {...props}>
      <path d="m5 9-3 3 3 3"/>
      <path d="m9 5-3-3-3 3"/>
      <path d="m15 19 3 3 3-3"/>
      <path d="m19 9 3 3-3 3"/>
      <path d="m2 12h20"/>
      <path d="m12 2v20"/>
  </svg>
));
CustomMove.displayName = "CustomMove";
