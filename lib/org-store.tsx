"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
  reorderEstadosProyectoAction,
  updateEstadoProyectoAction,
} from "@/lib/actions/estados-proyecto";
import type { OrgState } from "@/lib/org-state";
import type { EstadoProyecto, Id } from "./types";

type OrgContextValue = OrgState & {
  updateEstadoProyecto: (id: Id, patch: Partial<EstadoProyecto>) => Promise<void>;
  reorderEstados: (orderedIds: Id[]) => Promise<void>;
};

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgStoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState: OrgState;
}) {
  const router = useRouter();
  const [state, setState] = useState<OrgState>(initialState);

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  const updateEstadoProyecto = useCallback(
    async (id: Id, patch: Partial<EstadoProyecto>) => {
      setState((s) => ({
        ...s,
        estadosProyecto: s.estadosProyecto.map((e) =>
          e.id === id ? { ...e, ...patch } : e,
        ),
      }));
      try {
        await updateEstadoProyectoAction(id, {
          etiqueta: patch.etiqueta,
          activo: patch.activo,
          orden: patch.orden,
        });
      } catch {
        router.refresh();
      }
    },
    [router],
  );

  const reorderEstados = useCallback(
    async (orderedIds: Id[]) => {
      setState((s) => {
        const map = new Map(s.estadosProyecto.map((e) => [e.id, e]));
        const next = orderedIds
          .map((oid, i) => {
            const row = map.get(oid);
            if (!row) return null;
            return { ...row, orden: i + 1 };
          })
          .filter(Boolean) as EstadoProyecto[];
        const rest = s.estadosProyecto.filter((e) => !orderedIds.includes(e.id));
        return { ...s, estadosProyecto: [...next, ...rest] };
      });
      try {
        await reorderEstadosProyectoAction(orderedIds);
      } catch {
        router.refresh();
      }
    },
    [router],
  );

  const value = useMemo<OrgContextValue>(
    () => ({
      ...state,
      updateEstadoProyecto,
      reorderEstados,
    }),
    [state, updateEstadoProyecto, reorderEstados],
  );

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrgStore() {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrgStore debe usarse dentro de OrgStoreProvider");
  }
  return ctx;
}
