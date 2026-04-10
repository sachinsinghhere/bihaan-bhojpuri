'use client';

import { Moon, Sun, Palette, Lightbulb, Wheat } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('lantern')}>
          <Lightbulb className="mr-2 h-4 w-4 text-amber-400" />
          <span>Lantern</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('bihan')}>
          <Sun className="mr-2 h-4 w-4 text-orange-500" />
          <span>Bihan</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('kodo')}>
          <Wheat className="mr-2 h-4 w-4 text-amber-600" />
          <span>Kodo</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}