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
  playersOnline: string[];
  playersSource: "live" | "fallback";
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
      const battlemetricsToken =
        (typeof process !== "undefined" ? process.env.BATTLEMETRICS_API_KEY : undefined) ||
        (typeof process !== "undefined" ? process.env.BATTLEMETRICS_TOKEN : undefined);
      let requestHeaders: HeadersInit = {
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0 (compatible; BoosterStatus/1.0)",
      };
      if (battlemetricsToken) {
        requestHeaders = {
          ...requestHeaders,
          Authorization: `Bearer ${battlemetricsToken}`,
        };
      }

      const normalizedAddress = data.address.trim();
      const [expectedIpRaw, expectedPortRaw] = normalizedAddress.split(":");
      const expectedIp = expectedIpRaw?.trim() || "";
      const expectedPort = Number(expectedPortRaw);

      const query = new URL("https://api.battlemetrics.com/servers");
      query.searchParams.set("filter[search]", data.address);
      query.searchParams.set("filter[game]", data.game);
      query.searchParams.set("page[size]", "20");

      let response = await fetch(query.toString(), { headers: requestHeaders });

      if (response.status === 403) {
        const fallbackQuery = new URL("https://api.battlemetrics.com/servers");
        fallbackQuery.searchParams.set("filter[search]", data.address);
        fallbackQuery.searchParams.set("page[size]", "20");
        response = await fetch(fallbackQuery.toString(), { headers: requestHeaders });
      }

      if (!response.ok) {
        return { ok: false, message: `Falha na consulta (${response.status})` };
      }

      const payload = (await response.json()) as {
        data?: Array<{
          id?: string;
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

      const matchedServer = (payload.data ?? []).find((entry) => {
        const attrs = entry.attributes;
        if (!attrs?.ip || typeof attrs.port !== "number") {
          return false;
        }

        if (!expectedIp || Number.isNaN(expectedPort)) {
          return true;
        }

        return attrs.ip === expectedIp && attrs.port === expectedPort;
      });

      const first = matchedServer?.attributes;
      const serverId = matchedServer?.id;
      if (!first) {
        return { ok: false, message: "Servidor não encontrado para o IP:PORTA informado" };
      }

      let playersOnline: string[] = [];
      let playersSource: "live" | "fallback" = "live";
      if (serverId) {
        const playersResponse = await fetch(`https://api.battlemetrics.com/servers/${serverId}?include=player`, {
          headers: requestHeaders,
        });

        if (playersResponse.ok) {
          const playersPayload = (await playersResponse.json()) as {
            included?: Array<{
              type?: string;
              attributes?: {
                name?: string;
              };
            }>;
          };

          playersOnline = (playersPayload.included ?? [])
            .filter((entry) => entry.type === "player")
            .map((entry) => entry.attributes?.name?.trim() ?? "")
            .filter(Boolean);
        }

        if (!playersOnline.length) {
          const playersListQuery = new URL("https://api.battlemetrics.com/players");
          playersListQuery.searchParams.set("filter[servers]", serverId);
          playersListQuery.searchParams.set("page[size]", "100");

          const playersListResponse = await fetch(playersListQuery.toString(), {
            headers: requestHeaders,
          });

          if (playersListResponse.ok) {
            const playersListPayload = (await playersListResponse.json()) as {
              data?: Array<{
                attributes?: {
                  name?: string;
                };
              }>;
            };

            const maxPlayersLimit = typeof first.maxPlayers === "number" ? first.maxPlayers : 32;
            playersOnline = Array.from(
              new Set(
                (playersListPayload.data ?? [])
                  .map((entry) => entry.attributes?.name?.trim() ?? "")
                  .filter(Boolean),
              ),
            ).slice(0, maxPlayersLimit);

            if (playersOnline.length) {
              playersSource = "fallback";
            }
          }
        }

      }

      const normalizedStatus =
        first.status === "online" || (first.status !== "online" && playersOnline.length > 0)
          ? "online"
          : "offline";
      const normalizedPlayers =
        typeof first.players === "number" && first.players > 0
          ? first.players
          : playersOnline.length || (typeof first.players === "number" ? first.players : null);

      return {
        ok: true,
        data: {
          name: first.name ?? data.address,
          ip: first.ip ?? null,
          port: typeof first.port === "number" ? first.port : null,
          status: normalizedStatus,
          map: first.details?.map ?? null,
          players: normalizedPlayers,
          maxPlayers: typeof first.maxPlayers === "number" ? first.maxPlayers : null,
          playersOnline,
          playersSource,
          country: first.country ?? null,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch {
      return { ok: false, message: "Erro de rede ao consultar servidor" };
    }
  });