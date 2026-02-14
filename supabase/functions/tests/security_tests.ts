import { assert, assertFalse, assertStringIncludes } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const root = "d:/Oferta Velas Aromaticas/read-flow-46/read-flow-46";

async function read(path: string) {
  return await Deno.readTextFile(path);
}

Deno.test("handle-purchase: CORS dinâmico e licença", async () => {
  const src = await read(`${root}/supabase/functions/handle-purchase/index.ts`);
  assertStringIncludes(src, "getCorsHeaders(");
  assertFalse(src.includes("'Access-Control-Allow-Origin': '*'"));
  assertStringIncludes(src, "validate_license");
});

Deno.test("claim-purchases: CORS dinâmico, licença e auth", async () => {
  const src = await read(`${root}/supabase/functions/claim-purchases/index.ts`);
  assertStringIncludes(src, "getCorsHeaders(");
  assertFalse(src.includes("'Access-Control-Allow-Origin': '*'"));
  assertStringIncludes(src, "validate_license");
  assertStringIncludes(src, "Authorization");
});

Deno.test("moderate-content: CORS dinâmico, licença e rate limit", async () => {
  const src = await read(`${root}/supabase/functions/moderate-content/index.ts`);
  assertStringIncludes(src, "getCorsHeaders(");
  assertFalse(src.includes("'Access-Control-Allow-Origin': '*'"));
  assertStringIncludes(src, "validate_license");
  assertStringIncludes(src, "check_rate_limit");
});

Deno.test("process-referral: CORS dinâmico, licença e rate limit", async () => {
  const src = await read(`${root}/supabase/functions/process-referral/index.ts`);
  assertStringIncludes(src, "getCorsHeaders(");
  assertFalse(src.includes("'Access-Control-Allow-Origin': '*'"));
  assertStringIncludes(src, "validate_license");
  assertStringIncludes(src, "check_rate_limit");
});

Deno.test("process-referral-reward: CORS dinâmico e licença", async () => {
  const src = await read(`${root}/supabase/functions/process-referral-reward/index.ts`);
  assertStringIncludes(src, "getCorsHeaders(");
  assertFalse(src.includes("'Access-Control-Allow-Origin': '*'"));
  assertStringIncludes(src, "validate_license");
});