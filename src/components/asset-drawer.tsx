
"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { Button } from './ui/button';
import AdvancedAssetPanel from './panels/AdvancedAssetsPanel';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';

interface AssetDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onImageSelect: (url: string, name: string) => void;
}

const MIN_HEIGHT = 60; // Height of the handle
const DEFAULT_HEIGHT = 400;
const MAX_HEIGHT_RATIO = 0.8; // 80% of window height

export function AssetDrawer({ isOpen, onToggle, onImageSelect }: AssetDrawerProps) {
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);
  const { state: sidebarState } = useSidebar();


  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
      setHeight(Math.max(MIN_HEIGHT, Math.min(newHeight, maxHeight)));
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);
  
  const handleSelectAndClose = (url: string, name: string) => {
    onImageSelect(url, name);
    onToggle();
  }

  const leftPosition = sidebarState === 'expanded' ? 'var(--sidebar-width)' : 'var(--sidebar-width-icon)';

  return (
    <>
        <AnimatePresence>
        {isOpen && (
            <motion.div
            ref={drawerRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed bottom-0 right-[380px] z-40 bg-background border-t border-border shadow-2xl"
            style={{ height, left: leftPosition, transition: 'left 0.2s ease-in-out' }}
            >
            <div 
                onMouseDown={handleMouseDown}
                className="absolute -top-2 left-0 right-0 h-4 bg-transparent flex items-center justify-center cursor-row-resize group"
            >
                <div className="w-12 h-1.5 bg-muted-foreground/50 rounded-full transition-all group-hover:bg-muted-foreground"></div>
            </div>
            
            <div className="h-full overflow-hidden">
                <AdvancedAssetPanel 
                    isOpen={isOpen}
                    onToggle={onToggle}
                    onImageSelect={handleSelectAndClose}
                />
            </div>
            </motion.div>
        )}
        </AnimatePresence>
        {!isOpen && (
             <Button 
                variant="outline"
                onClick={onToggle}
                className="fixed bottom-0 left-1/2 -translate-x-1/2 h-8 w-32 rounded-t-lg rounded-b-none z-40 border-b-0"
             >
                <ChevronUp className="h-4 w-4 mr-2"/>
                Assets
            </Button>
        )}
    </>
  );
}
