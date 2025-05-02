import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarDrawerProps {
  children: React.ReactNode;
  side?: 'left' | 'right';
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  openEventName?: string;
  closeOnClickOutside?: boolean;
  mobileFullscreen?: boolean;
  width?: 'narrow' | 'normal' | 'wide';
  title?: React.ReactNode;
}

/**
 * Enhanced sidebar drawer component that slides in from the side of the screen
 * Can open from either side and responds to custom events for opening
 */
export function SidebarDrawer({
  children,
  side = 'right',
  isOpen: externalIsOpen,
  onClose,
  className,
  openEventName,
  closeOnClickOutside = true,
  mobileFullscreen = true,
  width = 'normal',
  title,
}: SidebarDrawerProps) {
  const [isOpen, setIsOpen] = useState(externalIsOpen || false);
  
  // If isOpen changes externally, update our state
  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);
  
  // Listen for custom open event if specified
  useEffect(() => {
    if (!openEventName) return;
    
    const handleOpen = () => {
      console.log(`Custom event received: ${openEventName}`);
      setIsOpen(true);
    };
    
    window.addEventListener(openEventName, handleOpen);
    return () => window.removeEventListener(openEventName, handleOpen);
  }, [openEventName]);
  
  // Handle close
  const handleClose = () => {
    setIsOpen(false);
    if (onClose) {
      onClose();
    }
  };
  
  // Handle outside click
  const handleOutsideClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Prevent scrolling on the body when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-hidden"
      onClick={handleOutsideClick}
    >
      <div 
        className={cn(
          "fixed top-0 bottom-0 w-full md:w-auto shadow-xl transition-transform duration-300 ease-in-out flex flex-col",
          "bg-[#0A1428] text-slate-100", // Dark navy blue for WoW theme
          width === 'narrow' ? "md:max-w-xs" : width === 'wide' ? "md:max-w-2xl" : "md:max-w-md",
          mobileFullscreen ? "md:w-auto" : "",
          side === 'left' ? "left-0" : "right-0",
          className,
        )}
        style={{
          transform: isOpen ? 'translateX(0%)' : side === 'left' ? 'translateX(-100%)' : 'translateX(100%)'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the drawer from closing it
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-700/80 w-full">
          {title && (
            <h2 className="text-xl font-semibold text-slate-100">{title}</h2>
          )}
          <div className={title ? "" : "w-full flex justify-end"}>
            <button 
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-slate-800"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden w-full min-w-full h-[calc(100vh-4rem)] pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}