import assert from "node:assert/strict";
import test from "node:test";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);

async function render(path = "/") {
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renderiza a abertura e a navegacao principal", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Brasil declarado/);
  assert.match(html, /Duas fotos/);
  assert.match(html, /Estruturas sociais/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("renderiza todas as paginas editoriais", async () => {
  for (const [path, text] of [
    ["/desigualdade", "O topo cresce"],
    ["/raca", "Entre os anos"],
    ["/territorio", "Não basta somar"],
    ["/trabalho", "A profissão explica"],
    ["/metodo", "O que a declaração"],
  ]) {
    const response = await render(path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), new RegExp(text), path);
  }
});
