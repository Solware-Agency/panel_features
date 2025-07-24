import { Moon, Sun } from 'lucide-react'

import { useDarkMode } from '@shared/hooks/useDarkMode'
import { Button } from '@shared/components/ui/button'

export function ThemeToggle() {
	const { toggleDarkMode } = useDarkMode()

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggleDarkMode}
			className="shadow-xl dark:shadow-black shadow-black/40"
		>
			<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-transform duration-300 dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-transform duration-300 dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	)
}
