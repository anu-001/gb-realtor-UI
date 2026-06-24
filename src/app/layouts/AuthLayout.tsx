import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { BrandMark } from "@/components/layout/BrandMark";

export function AuthLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-4 py-10 font-body text-[var(--color-text-primary)]">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-[1440px] items-center justify-center">
        <div className="w-full max-w-[28rem]">
          <div className="mb-8 flex justify-center">
            <BrandMark compact />
          </div>
          {children ?? <Outlet />}
        </div>
      </div>
    </div>
  );
}
