import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

const serverLookupInput = z.object({
  address: z.string().trim().min(3).max(80),
  game: z.string().trim().min(2).max(20).default("cs"),
});

export type BoosterLiveStatus = {
  name: string;
  ip: string | null;
  port: number | null;
  status: "online" | "offline";
  map: string | null;
  players: number | null;
  maxPlayers: number | null;
  country: string | null;
  updatedAt: string;
};

export type BoosterStatusResponse =
  | { ok: true; data: BoosterLiveStatus }
  | { ok: false; message: string };

export const getServerStatus = createServerFn({ method: "GET" })
  .inputValidator(serverLookupInput)
  .handler(async ({ data }): Promise<BoosterStatusResponse> => {
    try {
      const query = new URL("https://api.battlemetrics.com/servers");
      query.searchParams.set("filter[search]", data.address);
      query.searchParams.set("filter[game]", data.game);
      query.searchParams.set("page[size]", "1");

      const response = await fetch(query.toString(), {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        return { ok: false, message: `Falha na consulta (${response.status})` };
      }

      const payload = (await response.json()) as {
        data?: Array<{
          attributes?: {
            name?: string;
            ip?: string;
            port?: number;
            players?: number;
            maxPlayers?: number;
            status?: string;
            country?: string;
            details?: {
              map?: string;
            };
          };
        }>;
      };

      const first = payload.data?.[0]?.attributes;
      if (!first) {
        return { ok: false, message: "Servidor não encontrado" };
      }

      return {
        ok: true,
        data: {
          name: first.name ?? data.address,
          ip: first.ip ?? null,
          port: typeof first.port === "number" ? first.port : null,
          status: first.status === "online" ? "online" : "offline",
          map: first.details?.map ?? null,
          players: typeof first.players === "number" ? first.players : null,
          maxPlayers: typeof first.maxPlayers === "number" ? first.maxPlayers : null,
          country: first.country ?? null,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch {
      return { ok: false, message: "Erro de rede ao consultar servidor" };
    }
  });