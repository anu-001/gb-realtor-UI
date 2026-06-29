import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "@/utils/cn";
import type { ReactNode } from "react";

type DropdownProps = {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
};

type DropdownItemProps = {
  children: ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  asChild?: boolean;
};

export function Dropdown({ trigger, children, align = "end" }: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={8}
          className="z-50 min-w-44 rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-1 shadow-modal outline-none"
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function DropdownItem({ children, onSelect, disabled, destructive, asChild }: DropdownItemProps) {
  return (
    <DropdownMenu.Item
      asChild={asChild}
      disabled={disabled}
      onSelect={onSelect}
      className={cn(
        "flex min-h-10 cursor-pointer items-center gap-2 rounded-[12px] px-3 text-sm font-medium text-[var(--color-text-primary)] outline-none transition-colors duration-200 focus:bg-[var(--color-surface-raised)] data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45",
        destructive
          ? "text-[var(--color-danger)] focus:bg-[color-mix(in_srgb,var(--color-danger)_8%,white)]"
          : "hover:bg-[var(--color-surface-raised)]",
      )}
    >
      {children}
    </DropdownMenu.Item>
  );
}
