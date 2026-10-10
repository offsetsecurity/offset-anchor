import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { resolve } from "node:path";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import { migrate } from "../src/db/migrate.js";
import { pool, query } from "../src/db/pool.js";
import { seedControls } from "../src/db/seed.js";
import { loadPackJourney } from "../src/journey/journey.js";

/**
 * Offset Anchor's readiness plan, and the checks written for it.
 *
 * SP 800-53 asks for things the other frameworks do not: a system with a
 * boundary, a baseline applied to a thousand controls, a value for every
 * organisation-defined parameter, and a statement of who implements each
 * control. Those four checks are exercised here against real rows, because a
 * check that is always green looks exactly like a working one on screen.
 */
const DB = process.env["E2E_DATABASE_URL"];
const maybe = DB ? describe : describe.skip;

const ANCHOR_PACK = resolve(process.cwd(), "../../packs/anchor");

maybe("Offset Anchor readiness plan", () => {
  let app: FastifyInstance;
  let sid = "";
  let csrf = "";

  const read = () => ({ cookie: `offset_sid=${sid}; offset_csrf=${csrf}` });
  const write = () => ({ ...read(), "x-csrf-token": csrf });

  interface Task { id: string; state: string; automatic: boolean; detail: string }
  interface Plan { stages: { id: string; tasks: Task[] }[] }

  const task = async (id: string): Promise<Task> => {
    const res = await app.inject({ url: "/api/v1/journey", headers: read() });
    expect(res.statusCode).toBe(200);
    const plan = res.json().journey as Plan;
    const found = plan.stages.flatMap((s) => s.tasks).find((x) => x.id === id);
    expect(found, `no task ${id}`).toBeTruthy();
    return found!;
  };

  beforeAll(async () => {
    process.env["PACK_DIR"] = ANCHOR_PACK;
    await migrate();
    for (const t of [
      "audit_log", "sessions", "users", "evidence_controls", "risk_controls", "controls",
      "programme", "risks", "evidence", "assets", "policies", "tasks", "findings",
      "journey_tasks", "settings",
    ]) {
      await query(`delete from ${t}`);
    }
    await seedControls();

    app = await buildApp();
    await app.ready();

    const boot = await app.inject({
      method: "POST",
      url: "/api/v1/auth/bootstrap",
      payload: {
        username: "admin", name: "Test Admin",
        email: "admin@example.test", password: "correct-horse-battery-staple",
      },
    });
    for (const c of boot.headers["set-cookie"] as string[]) {
      const m = /^(offset_sid|offset_csrf)=([^;]+)/.exec(c);
      if (m?.[1] === "offset_sid") sid = m[2]!;
      if (m?.[1] === "offset_csrf") csrf = m[2]!;
    }
  }, 120_000);

  afterAll(async () => {
    delete process.env["PACK_DIR"];
    await app?.close();
    await pool.end();
  });

  it("follows the Risk Management Framework, and names checks that exist", async () => {
    const journey = await loadPackJourney();
    expect(journey.stages.map((s) => s.id)).toEqual(
      ["setup", "system", "baseline", "assign", "write", "prove", "risk", "authorise"],
    );
    const automatic = journey.stages.flatMap((s) => s.tasks).filter((t) => t.check);
    expect(automatic.length).toBeGreaterThan(15);
  });

  it("asks for a name, a description and a boundary before the system counts as described", async () => {
    let t = await task("system.describe");
    expect(t.automatic).toBe(true);
    expect(t.detail).toBe("still needs a name, a description, an authorisation boundary");

    const set = (system: Record<string, string>) =>
      app.inject({
        method: "PATCH", url: "/api/v1/programme", headers: write(),
        payload: { attrs: { system } },
      });

    expect((await set({ name: "Claims portal" })).statusCode).toBe(200);
    t = await task("system.describe");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toBe("still needs a description, an authorisation boundary");

    await set({ description: "Public claims intake and case handling.", boundary: "Two web servers, one database, the file store. Identity is inherited." });
    t = await task("system.describe");
    expect(t.state).toBe("done");
    expect(t.detail).toContain("Claims portal");
  });

  it("scopes the catalogue when a baseline is applied", async () => {
    expect((await task("baseline.apply")).detail).toBe("no baseline chosen yet");

    const res = await app.inject({
      method: "POST", url: "/api/v1/controls/baseline", headers: write(),
      payload: { level: "moderate" },
    });
    expect(res.statusCode).toBe(200);

    const t = await task("baseline.apply");
    expect(t.state).toBe("done");
    expect(t.detail).toMatch(/^moderate baseline, \d+ controls in scope$/);

    // Everything outside the baseline is excluded with the reason recorded, so
    // the tailoring step starts from a scoped catalogue rather than 1,014 rows.
    const { rows } = await query<{ n: number }>(
      "select count(*) as n from controls where status = 'not_applicable' and trim(justification) = ''",
    );
    expect(rows[0]?.n).toBe(0);
  });

  it("counts parameters only on the controls in scope that have them", async () => {
    let t = await task("baseline.parameters");
    expect(t.automatic).toBe(true);
    expect(t.state).toBe("outstanding");
    const [, filled, wanted] = /(\d+) of (\d+) that need values/.exec(t.detail) ?? [];
    expect(filled).toBe("0");
    expect(Number(wanted)).toBeGreaterThan(50);

    // A value on one control moves the count by exactly one.
    const { rows } = await query<{ ref: string }>(
      "select ref from controls where status <> 'not_applicable' order by ref limit 1",
    );
    await query(
      "update controls set attrs = json_patch(attrs, $2) where ref = $1",
      [rows[0]!.ref, JSON.stringify({ paramValues: { "ac-01_odp.01": "the security team" } })],
    );
    t = await task("baseline.parameters");
    expect(t.detail).toBe(`1 of ${wanted} that need values have them`);

    // An empty string is not a value. Somebody clearing a box has not answered.
    await query(
      "update controls set attrs = json_patch(attrs, $2) where ref = $1",
      [rows[0]!.ref, JSON.stringify({ paramValues: { "ac-01_odp.01": "  " } })],
    );
    expect((await task("baseline.parameters")).detail).toBe(`0 of ${wanted} that need values have them`);
  });

  it("wants every control in scope to say who implements it", async () => {
    let t = await task("assign.origination");
    expect(t.state).toBe("outstanding");
    expect(t.detail).toMatch(/^0 of \d+ in scope say who implements them$/);

    await query(
      "update controls set attrs = json_patch(attrs, $1) where status <> 'not_applicable'",
      [JSON.stringify({ origination: "System specific" })],
    );
    t = await task("assign.origination");
    expect(t.state).toBe("done");

    await query(
      "update controls set attrs = json_patch(attrs, $1) where ref = 'AC-1'",
      [JSON.stringify({ origination: "" })],
    );
    t = await task("assign.origination");
    expect(t.state).toBe("outstanding");
  });
});
