import { cn } from "@shared/lib/cn"

interface BranchBadgeProps {
  branch: string
  className?: string
}

export function BranchBadge({ branch, className }: BranchBadgeProps) {
  const getBranchColor = (branchCode: string) => {
    switch (branchCode) {
      case 'STX':
        return 'bg-blue-700/45 text-white' // Blue
      case 'PMG':
        return 'bg-green-700/45 text-white' // Green
      case 'MCY':
        return 'bg-orange-700/45 text-white' // Orange
      case 'CPC':
        return 'bg-red-700/45 text-white' // Red
      case 'CNX':
        return 'bg-purple-700/45 text-white' // Purple
      default:
        return 'bg-gray-200 dark:bg-gray-900/60 text-gray-900 dark:text-gray-100'
    }
  }

  return (
    <div 
      className={cn(
        "text-center border border-gray-500/30 dark:border-gray-700/50 rounded-lg px-1 py-1 text-xs font-medium",
        getBranchColor(branch),
        className
      )}
    >
      {branch}
    </div>
  )
}