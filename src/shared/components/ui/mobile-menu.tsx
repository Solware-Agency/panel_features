import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X } from 'lucide-react'
import { cn } from '@shared/lib/cn'

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  className?: string
  position?: 'left' | 'right'
  width?: 'full' | 'partial'
}

export function MobileMenu({
  isOpen,
  onClose,
  children,
  className,
  position = 'left',
  width = 'partial',
}: MobileMenuProps) {
  // Close menu when escape key is pressed
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey)
      // Prevent body scrolling when menu is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey)
      // Restore body scrolling when menu is closed
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const positionClasses = {
    left: 'left-0',
    right: 'right-0',
  }

  const widthClasses = {
    full: 'w-full',
    partial: 'w-[80%] sm:w-[60%] md:w-[40%]',
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={onClose}
          />

          {/* Menu */}
          <motion.div
            initial={{ x: position === 'left' ? '-100%' : '100%' }}
            animate={{ x: 0 }}
            exit={{ x: position === 'left' ? '-100%' : '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              'fixed top-0 bottom-0 z-[99999] bg-white dark:bg-background shadow-xl overflow-y-auto',
              positionClasses[position],
              widthClasses[width],
              className
            )}
          >
            <div className="sticky top-0 z-10 flex justify-end p-4 bg-white/80 dark:bg-background/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}