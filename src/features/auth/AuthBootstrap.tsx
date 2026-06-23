import { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { restoreSession } from "../../store/authSlice";
import type { ReactNode } from "react";

export function AuthBootstrap({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(restoreSession());
  }, [dispatch]);

  return children;
}
