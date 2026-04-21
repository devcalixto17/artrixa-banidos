import { z } from "zod";

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

export const getServerStatus = async ({
  data,
}: {
  data: { address: string; game: string };
}): Promise<BoosterStatusResponse> => {
  try {
    const parsed = serverLookupInput.safeParse(data);
    if (!parsed.success) {
      return { ok: false, message: "IP:PORTA inválido" };
    }

    const safeData = parsed.data;
    const requestHeaders: HeadersInit = {
      Accept: "application/json",
    };

    const normalizedAddress = safeData.address.trim();
    const [expectedIpRaw, expectedPortRaw] = normalizedAddress.split(":");
    const expectedIp = expectedIpRaw?.trim() || "";
    const expectedPort = Number(expectedPortRaw);

    const queryAttempts = [
      { search: normalizedAddress, includeGame: true },
      { search: expectedIp, includeGame: true },
      { search: normalizedAddress, includeGame: false },
      { search: expectedIp, includeGame: false },
    ].filter((attempt) => attempt.search.length > 0);

    const uniqueAttempts = Array.from(
      new Map(queryAttempts.map((attempt) => [`${attempt.search}:${attempt.includeGame}`, attempt])).values(),
    );

    const mergedServers = new Map<
      string,
      {
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
      }
    >();

    for (const attempt of uniqueAttempts) {
      const query = new URL("https://api.battlemetrics.com/servers");
      query.searchParams.set("filter[search]", attempt.search);
      if (attempt.includeGame) {
        query.searchParams.set("filter[game]", safeData.game);
      }
      query.searchParams.set("page[size]", "20");

      let response = await fetch(query.toString(), { headers: requestHeaders });
      if (response.status === 403 && attempt.includeGame) {
        const fallbackQuery = new URL("https://api.battlemetrics.com/servers");
        fallbackQuery.searchParams.set("filter[search]", attempt.search);
        fallbackQuery.searchParams.set("page[size]", "20");
        response = await fetch(fallbackQuery.toString(), { headers: requestHeaders });
      }

      if (!response.ok) {
        continue;
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

      for (const server of payload.data ?? []) {
        const key = server.id ?? `${server.attributes?.ip ?? "unknown"}:${String(server.attributes?.port ?? "")}`;
        mergedServers.set(key, server);
      }
    }

    const servers = Array.from(mergedServers.values());
    if (!servers.length) {
      return { ok: false, message: "Servidor não encontrado para o IP:PORTA informado" };
    }

    const scoredServers = servers
      .map((entry) => {
        const attrs = entry.attributes;
        if (!attrs?.ip || typeof attrs.port !== "number") {
          return null;
        }

        let score = 0;
        if (attrs.ip === expectedIp && !Number.isNaN(expectedPort) && attrs.port === expectedPort) {
          score = 100;
        } else if (attrs.ip === expectedIp && !Number.isNaN(expectedPort)) {
          score = 80 - Math.min(Math.abs(attrs.port - expectedPort), 50);
        } else if (attrs.ip === expectedIp) {
          score = 70;
        } else if (normalizedAddress.includes(attrs.ip)) {
          score = 40;
        }

        return { entry, score };
      })
      .filter((entry): entry is { entry: (typeof servers)[number]; score: number } => Boolean(entry))
      .sort((a, b) => b.score - a.score);

    const matchedServer =
      scoredServers.find((entry) => entry.score >= 70)?.entry ??
      scoredServers.find((entry) => entry.score > 0)?.entry ??
      servers[0];

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
        name: first.name ?? safeData.address,
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
};