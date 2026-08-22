const COUNTRIES_NOW_BASE = "https://countriesnow.space/api/v0.1/countries";

type CountryState = { name?: string; state_code?: string };
type CountryRecord = { name?: string; iso2?: string; states?: CountryState[] };

function clean(value: string | null, max = 120) {
  return (value ?? "").trim().slice(0, max);
}

async function readJson(response: Response) {
  if (!response.ok) throw new Error(`Geography provider returned ${response.status}`);
  const payload = await response.json();
  if (payload?.error) throw new Error(payload?.msg || "Geography provider error");
  return payload;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const level = clean(url.searchParams.get("level"), 24);

  try {
    if (level === "countries") {
      const response = await fetch(`${COUNTRIES_NOW_BASE}/states`, { next: { revalidate: 86400 } });
      const payload = await readJson(response);
      const countries = ((payload?.data ?? []) as CountryRecord[])
        .filter((item) => item.name && item.iso2)
        .map((item) => ({
          name: item.name as string,
          code: (item.iso2 as string).toUpperCase(),
          regions: (item.states ?? []).map((state) => state.name).filter(Boolean),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return Response.json({ countries });
    }

    if (level === "cities") {
      const country = clean(url.searchParams.get("country"));
      const region = clean(url.searchParams.get("region"));
      if (!country) return Response.json({ error: "country is required" }, { status: 400 });

      const endpoint = region ? `${COUNTRIES_NOW_BASE}/state/cities` : `${COUNTRIES_NOW_BASE}/cities`;
      const body = region ? { country, state: region } : { country };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        cache: "no-store",
      });
      const payload = await readJson(response);
      const cities = Array.from(new Set((payload?.data ?? []).filter((item: unknown) => typeof item === "string")))
        .sort((a, b) => String(a).localeCompare(String(b)));
      return Response.json({ cities });
    }

    return Response.json({ error: "unsupported geography level" }, { status: 400 });
  } catch (error) {
    console.error("BASOUL geography provider failure", error);
    return Response.json({ error: "Geography data is temporarily unavailable" }, { status: 503 });
  }
}
