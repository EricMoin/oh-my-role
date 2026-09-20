/** Integration against the sibling rolebox checkout; no live agents or models. */
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
const { cancelNodes } = await load('src/graph/engine/cancellation.ts');
const { GraphToolSet } = await load('src/graph/tools/graph-tools.ts');
const { mapDispatchStatusToSignal } = await load('src/graph/engine/engine-recovery.ts');
const { evaluateCondition } = await load('src/function/conditions.ts');
const examples = JSON.parse(readFileSync(resolve(root, 'roles/emperor/references/graph-examples.json'), 'utf8'));

function rig(declaration: any) {
  const state = createEngineState(structuredClone(declaration), declaration.name);
  provision(state);
  const calls: string[] = [];
  const dispatch = {
    async executeNode(node: any) {
      calls.push(node.nodeId);
      return { id: `task-${calls.length}`, sessionId: `session-${calls.length}`,
        parentSessionId: declaration.name, depth: 1, status: 'running', agent: node.agent,
        startedAt: new Date(), progress: { lastUpdate: new Date(), toolCalls: 0 }, priority: 0 };
    },
    async cancelTask() { return true; },
  };
  const engine = new AdvanceEngine({ state, signalBridge: new SignalBridge(), dispatch });
  return { state, engine, calls, dispatch };
}

test('actual loader discovers every department with executable tools and local shared skills', async () => {
  const config = (await discoverRoles(resolve(root, 'roles'))).get('emperor');
  expect(config).toBeDefined();
  const router = config.subagents.find((x: any) => x.name === 'Jinyiwei');
  expect(router.tools).toMatchObject({ Write: true, Edit: true, Bash: true });
  const registry = JSON.parse(readFileSync(resolve(root, 'roles/emperor/references/departments.json'), 'utf8'));
  expect(router.subagents.map((x: any) => x.name.toLowerCase()).sort()).toEqual(Object.keys(registry).sort());
  for (const worker of router.subagents) {
    expect(worker.tools).toMatchObject({ Write: true, Edit: true, Bash: true, graph_run: false });
    const dir = resolve(root, `roles/emperor/subagents/jinyiwei/subagents/${worker.name.toLowerCase()}`);
    const skills = await resolveSkills(worker.skills, dir, resolve(root, '__no_global_skills__'));
    expect(skills.map((x: any) => x.name).sort()).toEqual([...worker.skills].sort());
  }
});

test('shipped graph examples pass real engine execution validation', async () => {
  for (const declaration of Object.values(examples) as any[]) {
    const tools = new GraphToolSet();
    const { graph_id } = tools.graph_create({ name: declaration.name });
    for (const node of declaration.nodes) tools.graph_add_node({ graph_id, ...node });
    for (const edge of declaration.edges) tools.graph_add_edge({ graph_id, ...edge });
    const result = await tools.graph_run({ graph_id, dry_run: true });
    expect(result.validation.valid).toBe(true);
  }
});

test('approval gate has no mutation descendants and approval does not execute work', async () => {
  const { state, engine, calls } = rig(examples.approval);
  await engine.dispatchReady();
  await engine.onNodeSignalEmitted('approval-v1', 'need_approval', { plan_revision: 'example-v1', proposed_ids: [1, 2] });
  expect(state.nodes.get('approval-v1').status).toBe('blocked');
  expect(calls).toEqual(['approval-v1']);
  await engine.approveNode('approval-v1', { plan_revision: 'example-v1', approved_ids: [1, 2] });
  expect(state.nodes.get('approval-v1').status).toBe('completed');
  expect(calls).toEqual(['approval-v1']);
});

test('runtime approval retires descendants; only a new continuation performs remaining work', async () => {
  const { state, engine, calls, dispatch } = rig(examples.execution);
  await engine.dispatchReady();
  await engine.onNodeSignalEmitted('exec-1-r0-c0', 'need_approval', { subtask_id: 1, remaining_work: 'authorized migration' });
  expect(state.nodes.get('exec-1-r0-c0').status).toBe('blocked');
  expect(calls).toEqual(['exec-1-r0-c0']);
  await cancelNodes(state, ['exec-2-r0-c0'], {}, dispatch);
  await engine.approveNode('exec-1-r0-c0', { approved_ids: [1], authorized_scope: ['authorized migration'] });
  expect(calls).toEqual(['exec-1-r0-c0']);
  const continuation = rig(examples.continuation);
  await continuation.engine.dispatchReady();
  expect(continuation.calls).toEqual(['exec-1-r0-c1']);
  await continuation.engine.onNodeSignalEmitted('exec-1-r0-c1', 'answer', { subtask_id: 1 });
  expect(continuation.calls).toEqual(['exec-1-r0-c1', 'exec-2-r0-c1']);
  await continuation.engine.onNodeSignalEmitted('exec-2-r0-c1', 'answer', { subtask_id: 2 });
  expect(continuation.calls).toEqual(['exec-1-r0-c1', 'exec-2-r0-c1']);
});

test('a rejection resolves a blocked gate without execution', async () => {
  const { state, engine, calls } = rig(examples.approval);
  await engine.dispatchReady();
  await engine.onNodeSignalEmitted('approval-v1', 'need_approval', { plan_revision: 'example-v1' });
  await engine.rejectNode('approval-v1', 'user declined');
  expect(state.nodes.get('approval-v1').status).not.toBe('blocked');
  expect(calls).toEqual(['approval-v1']);
});

test('a completed dispatch preserves explicit failure and never launches its answer-only consumer', async () => {
  const { state, engine, calls } = rig(examples.execution);
  await engine.dispatchReady();
  const payload = { schema_version: 1, plan_revision: 'example-v1', subtask_id: 1,
    reason: 'required migration check failed', completed_work: ['migration draft'],
    remaining_work: ['repair migration'], category: 'acceptance_failure', attempts: ['scoped check'],
    report: { schema_version: 1, plan_revision: 'example-v1', subtask_id: 1,
      summary: 'draft only', files_modified: ['migration.sql'],
      verification: [{ id: 'migration-check', command: 'check-migration', scope: 'migration.sql',
        status: 'failed', exit_code: 1, summary: 'constraint mismatch' }],
      incomplete_items: ['repair migration'], research_evidence: [] } };
  const signal = mapDispatchStatusToSignal('completed', {
    terminatingSignal: { type: 'escalate', payload },
  });
  expect(signal).toEqual({ type: 'escalate', payload });
  await engine.onNodeSignalEmitted('exec-1-r0-c0', signal.type, signal.payload);
  expect(calls).toEqual(['exec-1-r0-c0']);
  expect(state.signalLedger.get('exec-1-r0-c0').signals.escalate).toEqual(payload);
});

test('clarification pauses normalize at the dispatch seam without releasing dependent work', async () => {
  for (const cause of ['blocked', 'need_clarification']) {
    const { state, engine, calls } = rig(examples.execution);
    await engine.dispatchReady();
    const signal = mapDispatchStatusToSignal(cause);
    expect(signal).toEqual({ type: 'need_approval', payload: { hitl: cause } });
    await engine.onNodeSignalEmitted('exec-1-r0-c0', signal.type, signal.payload);
    expect(state.nodes.get('exec-1-r0-c0').status).toBe('blocked');
    expect(calls).toEqual(['exec-1-r0-c0']);
  }
});

test('second validation round has its own node and current producer signal payload', async () => {
  for (const round of [0, 1]) {
    const declaration = structuredClone(examples.validation);
    declaration.name = `validate-round-${round}`;
    declaration.nodes[0].id = `validate-r${round}`;
    const { state, engine, calls } = rig(declaration);
    await engine.dispatchReady();
    const payload = { schema_version: 1, plan_revision: 'example-v1', verdict: 'revise', items: [{ id: 1, status: 'revise', note: `round ${round}` }] };
    await engine.onNodeSignalEmitted(`validate-r${round}`, 'revise_needed', payload);
    expect(state.signalLedger.get(`validate-r${round}`).signals.revise_needed).toEqual(payload);
    expect(calls).toEqual([`validate-r${round}`]);
  }
});

test('full resolver preserves stage activation, canonical references and excludes default workflows', async () => {
  const { resolveAllRoles } = await load('src/resolver/orchestrator.ts');
  const roles = await discoverRoles(resolve(root, 'roles'));
  const [emperor] = await resolveAllRoles(new Map([['emperor', roles.get('emperor')]]), {
    roleboxDir: resolve(root, 'roles'), globalSkillsDir: resolve(root, '__no_global_skills__'),
    configDir: resolve(root, '__no_global_config__'), builtinDir: resolve(rolebox, 'functions'),
    roleFunctionsMap: new Map(),
  });
  expect(emperor).toBeDefined();
  const visit = (agent: any) => {
    const names = agent.functions.map((fn: any) => fn.name);
    expect(names).not.toContain('loop');
    if (agent.id !== 'emperor--chancellor') expect(names).not.toContain('plan');
    if (!agent.id.startsWith('emperor--jinyiwei')) expect(names).not.toContain('execute');
    for (const name of agent.config.auto_activate ?? []) expect(names).toContain(name);
    expect(agent.references.some((ref: any) => ref.name === 'graph-protocol')).toBe(true);
    if (agent.id.startsWith('emperor--jinyiwei') || agent.id === 'emperor--validator') {
      for (const fn of agent.functions.filter((fn: any) => ['execute', 'report', 'route', 'validate'].includes(fn.name))) {
        const env = { sessionID: `emperor-contract-${agent.id}-${fn.name}`, fnName: fn.name,
          state: { kv: {}, evidenceObserved: {}, toolsObserved: [] },
          artifacts: { exists: () => true, read: () => 'result fence exists' },
          requiredEvidence: [], userMessagedThisTurn: false, workspaceDir: root };
        expect(evaluateCondition(fn.continue_until, env)).toBe(false);
        for (const type of ['progress', 'handoff']) {
          env.state.kv = { __signals_observed: { [type]: {} } };
          expect(evaluateCondition(fn.continue_until, env)).toBe(false);
        }
        const signals = agent.id === 'emperor--validator' ? ['answer', 'revise_needed']
          : ['answer', 'escalate', 'blocked', 'need_approval', 'need_clarification'];
        for (const type of signals) {
          env.state.kv = { __signals_observed: { [type]: {} } };
          expect(evaluateCondition(fn.continue_until, env)).toBe(true);
        }
      }
    }
    for (const child of agent.subagents) visit(child);
  };
  visit(emperor);
});
