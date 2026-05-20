"use client";

import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { KEYMAP } from "@/lib/keymap";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: Props) {
  const router = useRouter();

  function run(target: (typeof KEYMAP)[number]["target"]) {
    onOpenChange(false);
    if (target.type === "navigate") {
      router.push(target.href);
    } else if (target.type === "action") {
      // Action dispatch — wire feature dialogs to these IDs as they're built.
      window.dispatchEvent(new CustomEvent(`palette:${target.id}`));
    }
  }

  const groups = Array.from(
    new Set(KEYMAP.map((k) => k.group)),
  ) as ReadonlyArray<(typeof KEYMAP)[number]["group"]>;

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search and jump to anywhere in the app"
    >
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        {groups.map((group, i) => (
          <div key={group}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {KEYMAP.filter((k) => k.group === group).map((entry) => (
                <CommandItem
                  key={entry.keys}
                  value={`${entry.label} ${entry.keys}`}
                  onSelect={() => run(entry.target)}
                >
                  <span className="flex-1">{entry.label}</span>
                  <kbd className="ml-2 inline-flex h-5 items-center gap-0.5 rounded border border-border bg-muted/40 px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    {entry.keys}
                  </kbd>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
