/** Offline contracts against the sibling rolebox checkout; no live model calls. */
import { expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dir, '../..');
const rolebox = resolve(process.env.ROLEBOX_DIR ?? resolve(root, '../rolebox'));
const load = (path: string) => import(pathToFileURL(resolve(rolebox, path)).href);
const { discoverRoles } = await load('src/loader/role-loader.ts');
const { resolveSkills } = await load('src/resolver/skill-resolver.ts');
const { createEngineState, provision } = await load('src/graph/engine/engine-state.ts');
const { AdvanceEngine } = await load('src/graph/engine/engine-advance.ts');
const { SignalBridge } = await load('src/graph/engine/signal-bridge.ts');
const { GraphToolSet } = await load('src/graph/tools/graph-tools.ts');
const examples = JSON.parse(readFileSync(resolve(root, 'roles/ai-designer/references/graph-examples.json'), 'utf8'));

function rig(tier: string) {
  const state = createEngineState(structuredClone(examples[tier]), `test-${tier}`);
  provision(state);
  const calls: string[] = [];
  const dispatch = {
    async executeNode(node: any) {
      calls.push(node.nodeId);
      return { id: `task-${calls.length}`, sessionId: `session-${calls.length}`,
        parentSessionId: `test-${tier}`, depth: 1, status: 'running', agent: node.agent,
        startedAt: new Date(), progress: { lastUpdate: new Date(), toolCalls: 0 }, priority: 0 };
    },
    async cancelTask() { return true; },
  };
  return { state, calls, engine: new AdvanceEngine({ state, signalBridge: new SignalBridge(), dispatch }) };
}
const pass = (gate: string, revision = 0) => ({ gate, status: 'pass', design_state: { revision }, unresolved: [], notes: [] });

test('actual loader resolves all locally declared skills without global fallback', async () => {
  const role = (await discoverRoles(resolve(root, 'roles'))).get('ai-designer');
  expect(role).toBeDefined();
  expect(role.subagents).toHaveLength(4);
  for (const [dir, config] of [[resolve(root, 'roles/ai-designer'), role],
    ...role.subagents.map((x: any) => [resolve(root, 'roles/ai-designer/subagents', x.name.toLowerCase().replaceAll(' ', '-')), x])] as any[]) {
    expect(config.functions).toEqual([]);
    const skills = await resolveSkills(config.skills, dir, resolve(root, '__no_global_skills__'));
    expect(skills.map((x: any) => x.name).sort()).toEqual([...config.skills].sort());
  }
});

test('all staged graph examples pass actual graph tool validation', async () => {
  for (const example of Object.values(examples) as any[]) {
    const tools = new GraphToolSet();
    const { graph_id } = tools.graph_create({ name: example.name });
    for (const node of example.nodes) tools.graph_add_node({ graph_id, ...node });
    for (const edge of example.edges) tools.graph_add_edge({ graph_id, ...edge });
    for (const loop of example.loop_groups) tools.graph_add_loop({ graph_id, ...loop });
    const result = await tools.graph_run({ graph_id, dry_run: true });
    expect(result.validation.valid).toBe(true);
  }
});

test('Full tier serializes Context, Design and Review and transports current state', async () => {
  const { engine, calls, state } = rig('full');
  await engine.dispatchReady();
  expect(calls).toEqual(['context-researcher']);
  await engine.onNodeSignalEmitted('context-researcher', 'answer', pass('Context', 1));
  expect(calls).toEqual(['context-researcher', 'design']);
  await engine.onNodeSignalEmitted('design', 'answer', pass('Design', 2));
  expect(calls).toEqual(['context-researcher', 'design', 'review']);
  expect(JSON.parse(state.nodes.get('review').upstreamResults.get('design').result).design_state.revision).toBe(2);
  await engine.onNodeSignalEmitted('review', 'answer', { ...pass('Review', 2), notes: ['Nonblocking spacing suggestion'] });
  expect(state.phase).toBe('complete');
  expect(calls).toHaveLength(3);
});

test('a Context escalation never dispatches artifact work', async () => {
  const { engine, calls } = rig('full');
  await engine.dispatchReady();
  await engine.onNodeSignalEmitted('context-researcher', 'escalate', { status: 'needs-user-input', reason: 'Audience conflict' });
  expect(calls).toEqual(['context-researcher']);
});

test('Review revision returns to Design and then converges on current artifact', async () => {
  const { engine, calls, state } = rig('standard');
  await engine.dispatchReady();
  await engine.onNodeSignalEmitted('design', 'answer', pass('Design'));
  await engine.onNodeSignalEmitted('review', 'revise_needed', { status: 'fail', reason: 'Restore keyboard focus', unresolved: [{ id: 'focus', severity: 'Critical' }] });
  expect(calls).toEqual(['design', 'review', 'design']);
  await engine.onNodeSignalEmitted('design', 'answer', pass('Design', 1));
  await engine.onNodeSignalEmitted('review', 'answer', pass('Review', 1));
  expect(calls).toEqual(['design', 'review', 'design', 'review']);
  expect(state.phase).toBe('complete');
});

test('two revision traversals cap persistent failure without manufacturing a pass', async () => {
  const { engine, calls, state } = rig('standard');
  await engine.dispatchReady();
  for (let round = 0; round < 3; round++) {
    await engine.onNodeSignalEmitted('design', 'answer', pass('Design', round));
    await engine.onNodeSignalEmitted('review', 'revise_needed', { status: 'fail', reason: `Unresolved issue ${round}`, unresolved: [{ id: `issue-${round}` }] });
  }
  expect(calls).toEqual(['design', 'review', 'design', 'review', 'design', 'review']);
  expect(state.phase).toBe('complete');
  expect(state.nodes.get('review').signalsObserved.answer).toBeUndefined();
});
