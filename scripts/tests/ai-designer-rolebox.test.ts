/** Offline contracts against the sibling rolebox checkout's graph v3 outcome protocol; scripted dispatch, no model calls. */
import { afterEach, expect, test } from 'bun:test';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dir, '../..');
const rolebox = resolve(process.env.ROLEBOX_DIR ?? resolve(root, '../rolebox'));
const load = (path: string) => import(pathToFileURL(resolve(rolebox, path)).href);
const { discoverRoles } = await load('src/loader/role-loader.ts');
const { resolveSkills } = await load('src/resolver/skill-resolver.ts');
const { resolveAllRoles } = await load('src/resolver/orchestrator.ts');
const { buildDeclaredOutcomeGraph } = await load('src/graph/tools/declare-graph.ts');
const { createGraphToolSet } = await load('src/graph/tools/graph-tools.ts');
const { createOutcomeGraphTools } = await load('src/graph/tools/index.ts');
const { OutcomeHost } = await load('src/graph/host/outcome-host.ts');
const { createValidatorRegistry } = await load('src/graph/outcome/validators.ts');

const examples = JSON.parse(readFileSync(resolve(root, 'roles/ai-designer/references/graph-examples.json'), 'utf8'));
const globalSkillsDir = resolve(root, '__no_global_skills__');
const roles = await discoverRoles(resolve(root, 'roles'));
const [aiDesigner] = await resolveAllRoles(new Map([['ai-designer', roles.get('ai-designer')]]), {
  roleboxDir: resolve(root, 'roles'), globalSkillsDir,
  configDir: resolve(root, '__no_global_config__'), builtinDir: resolve(rolebox, 'functions'),
  roleFunctionsMap: new Map(),
});
const agents: any[] = [];
(function visit(agent: any) { agents.push(agent); (agent.subagents ?? []).forEach(visit); })(aiDesigner);
const specialists = agents.filter(agent => agent.id !== 'ai-designer');
const agentIds = agents.map(agent => agent.id);
const specialistDir = (agent: any) =>
  resolve(root, 'roles/ai-designer/subagents', String(agent.config.name).toLowerCase().replaceAll(' ', '-'));

const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });

/** A host with scripted dispatch: nothing runs, every delivery is recorded and confirmed in-process. */
async function rig(declaration: any, options: { expectStart?: 'started' | 'refused' } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'ai-designer-v3-'));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  const deliveries: any[] = [];
  const validators = createValidatorRegistry([]);
  let host: any;
  host = OutcomeHost.open({
    workspaceDir: dir, storeRoot: join(dir, 'host-store'), validators,
    declareInvocationIdentity: false,
    workerSessionOf: (execution: any) => execution.executionId,
    deliver(request: any, effect: any) {
      deliveries.push(request);
      host.confirmExecution(effect, { executionId: `worker:${request.attemptId}` });
    },
  });
  cleanups.push(() => host.close());
  const toolset = createGraphToolSet({
    stateDir: dir, credentialIsolation: host.credentialIsolation,
    hostIdentity: host.workerIdentity, outcomeDispatch: host.dispatch,
    outcomeValidators: validators, outcomeArtifactRoot: dir,
    onGraphDeclared: (id: string, sessionId: string, agent: string) => host.startDeclaredGraph(id, { sessionId, agent }),
  });
  const tools = host.bindTools(createOutcomeGraphTools(toolset));
  const call = async (tool: string, args: any, sessionID = 'ai-designer-session') => {
    const raw = await tools[tool].execute(args, {
      sessionID, messageID: 'm1', agent: sessionID === 'ai-designer-session' ? 'ai-designer' : 'worker',
      directory: dir, worktree: dir, abort: new AbortController().signal,
      metadata() {}, async ask() {},
    });
    return JSON.parse(String(raw));
  };
  const declared = await call('graph_declare', { declaration });
  expect(declared.persisted).toBe(true);
  expect(declared.start.kind).toBe(options.expectStart ?? 'started');
  const submit = (index: number, outcome_id: string, data: any) => {
    const request = deliveries[index];
    return call('graph_submit_outcome', {
      graph_id: declaration.name, node_id: request.nodeId, outcome_id,
      credential: request.credential, data,
    }, `worker:${request.attemptId}`);
  };
  // Committed effects are drained through the same declaration entry, exactly like a live director.
  const drain = () => call('graph_declare', { declaration });
  const status = () => call('graph_status', {
    graph_id: declaration.name, scope: 'all', format: 'json', include_output: true, include_history: true,
  });
  return { deliveries, submit, status, call, declared, drain };
}

const report = (gate: string, outcome: string, revision = 0) => ({
  schema_version: 1, gate, outcome, revision, design_state: { revision }, unresolved: [], notes: [],
});

test('the shipped role resolves from roles/ with four specialists and each resolves its own declared skills', async () => {
  expect(aiDesigner.id).toBe('ai-designer');
  expect(specialists).toHaveLength(4);
  expect(specialists.map(agent => agent.id).sort()).toEqual([
    'ai-designer--context-researcher', 'ai-designer--design',
    'ai-designer--intake-strategist', 'ai-designer--review',
  ]);
  const targets: [any, string][] = [
    [aiDesigner, resolve(root, 'roles/ai-designer')],
    ...specialists.map((agent): [any, string] => [agent, specialistDir(agent)]),
  ];
  for (const [agent, dir] of targets) {
    expect(existsSync(dir)).toBe(true);
    expect(agent.config.functions ?? []).toEqual([]);
    const declared: string[] = agent.config.skills;
    expect(declared.length).toBeGreaterThan(0);
    const skills = await resolveSkills(declared, dir, globalSkillsDir);
    expect(skills.map((skill: any) => skill.name).sort()).toEqual([...declared].sort());
    // Every skill came from this agent's own directory, and the same ids resolve to nothing anywhere else.
    for (const skill of skills) expect(resolve(skill.filePath).startsWith(dir + sep)).toBe(true);
    expect(await resolveSkills(declared, globalSkillsDir, globalSkillsDir)).toEqual([]);
  }
});

test('the declaring session owns graphs while every specialist only submits and works', () => {
  expect(aiDesigner.config.tools).toMatchObject({
    graph_declare: true, graph_control: true, graph_status: true, graph_audit: true,
    graph_submit_outcome: false, graph_worker_exec: false,
    Write: true, Edit: true, Bash: true,
  });
  for (const agent of specialists) {
    expect(agent.config.tools).toMatchObject({
      graph_declare: false, graph_control: false, graph_status: false, graph_audit: false,
      graph_submit_outcome: true, graph_worker_exec: true, Bash: true,
    });
  }
  const design = specialists.find(agent => agent.id === 'ai-designer--design')!;
  expect(design.config.tools).toMatchObject({ Write: true, Edit: true, Bash: true });
  for (const id of ['ai-designer--intake-strategist', 'ai-designer--context-researcher', 'ai-designer--review']) {
    const agent = specialists.find(candidate => candidate.id === id)!;
    expect(agent.config.tools).toMatchObject({ Write: false, Edit: false, Bash: true });
  }
});

test('every shipped declaration compiles, names registered agents and carries the declared loop and inputs', () => {
  expect(Object.keys(examples).sort()).toEqual(['full', 'intake', 'standard']);
  for (const declaration of Object.values(examples) as any[]) {
    const graph = buildDeclaredOutcomeGraph({ declaration });
    expect(graph.plan.graphId).toBe(declaration.name);
    for (const node of declaration.nodes) {
      expect(agentIds).toContain(node.agent);
      expect(node.completion).toEqual({ mode: 'explicit' });
    }
    for (const edge of declaration.edges) expect(Object.keys(edge).sort()).toEqual(['from', 'outcome', 'to']);
  }
  // Terminals are derived from the edges: only outcomes nothing routes on end a run.
  expect(buildDeclaredOutcomeGraph({ declaration: examples.standard }).plan.terminalOutcomes
    .map((entry: any) => `${entry.nodeId}/${entry.outcome}`)).toEqual(['design/escalate', 'review/escalate', 'review/pass']);
  expect(buildDeclaredOutcomeGraph({ declaration: examples.full }).plan.terminalOutcomes
    .map((entry: any) => `${entry.nodeId}/${entry.outcome}`))
    .toEqual(['context-researcher/escalate', 'design/escalate', 'review/escalate', 'review/pass']);

  expect(examples.standard.edges).toEqual([
    { from: 'design', to: 'review', outcome: 'ready' },
    { from: 'review', to: 'design', outcome: 'revise' },
  ]);
  expect(examples.full.edges).toEqual([
    { from: 'context-researcher', to: 'design', outcome: 'pass' },
    { from: 'design', to: 'review', outcome: 'ready' },
    { from: 'review', to: 'design', outcome: 'revise' },
  ]);
  for (const tier of ['standard', 'full']) {
    const declaration = examples[tier];
    expect(declaration.loop_groups).toEqual([{
      id: 'review-loop', nodes: ['design', 'review'], max_traversals: 2,
      continuation_outcome: 'revise', exit_outcome: 'pass',
    }]);
    const nodes = new Map(declaration.nodes.map((node: any) => [node.id, node]));
    expect(nodes.get('review')!.inputs ?? []).toEqual([{ from: 'design', outcome: 'ready' }]);
    if (tier === 'full') expect(nodes.get('design')!.inputs).toEqual([{ from: 'context-researcher', outcome: 'pass' }]);
    else expect(nodes.get('design')!.inputs).toBeUndefined();
    expect(nodes.get('context-researcher')?.inputs).toBeUndefined();
    // No node consumes the loop back-edge: the revise edge re-enters design without an input from review.
    for (const node of declaration.nodes) for (const input of node.inputs ?? []) expect(input.from).not.toBe('review');
    expect(declaration.edges.filter((edge: any) => edge.from === 'review'))
      .toEqual([{ from: 'review', to: 'design', outcome: 'revise' }]);
  }
});

test('the strict v3 front-end refuses legacy grammar and an unsatisfiable entry input', () => {
  const mutations: [string, (declaration: any) => void][] = [
    ['version 2', declaration => { declaration.version = 2; }],
    ['an edge carrying type/signal_filter', declaration => {
      declaration.edges[0].type = 'on_signal';
      declaration.edges[0].signal_filter = ['ready'];
    }],
    ['a node budget carrying max_retries', declaration => { declaration.nodes[0].budget.max_retries = 0; }],
  ];
  for (const [label, change] of mutations) {
    const declaration = structuredClone(examples.standard);
    change(declaration);
    expect(() => buildDeclaredOutcomeGraph({ declaration }), label).toThrow();
  }
});

test('an entry node that consumes only the loop back-edge is refused at start, never dispatched', async () => {
  const declaration = structuredClone(examples.standard);
  declaration.nodes.find((node: any) => node.id === 'design').inputs = [{ from: 'review', outcome: 'revise' }];
  // The edge from review to design makes review an upstream node, so parsing succeeds; the runtime is
  // the gate that must refuse the start instead of dispatching work against a result nobody produced.
  expect(() => buildDeclaredOutcomeGraph({ declaration })).not.toThrow();
  const rigged = await rig(declaration, { expectStart: 'refused' });
  expect(rigged.declared.start.refusals.map((refusal: any) => refusal.code)).toContain('dispatch-input-unbound');
  expect(rigged.deliveries).toHaveLength(0);
});

test('the standard declaration dispatches design then review and completes only on an accepted pass', async () => {
  const rigged = await rig(examples.standard);
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design']);

  const design = report('Design', 'ready');
  expect((await rigged.submit(0, 'ready', design)).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design', 'review']);
  // The review dispatch carries the accepted result its declaration binds it to.
  expect(rigged.deliveries[1].inputs).toHaveLength(1);
  expect(rigged.deliveries[1].inputs[0]).toMatchObject({
    from: 'design', outcome: 'ready', payload: { kind: 'value', value: design },
  });

  const revise = { ...report('Review', 'revise'), unresolved: [{ id: 'focus', severity: 'Critical' }] };
  expect((await rigged.submit(1, 'revise', revise)).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design', 'review', 'design']);
  // The revise edge re-enters design without a declared input from review.
  expect(rigged.deliveries[2].inputs).toEqual([]);

  const redesign = report('Design', 'ready', 1);
  expect((await rigged.submit(2, 'ready', redesign)).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design', 'review', 'design', 'review']);
  expect(rigged.deliveries[3].inputs[0]).toMatchObject({
    from: 'design', outcome: 'ready', payload: { kind: 'value', value: redesign },
  });

  const pass = report('Review', 'pass', 1);
  expect((await rigged.submit(3, 'pass', pass)).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries).toHaveLength(4);
  const status = await rigged.status();
  expect(status.phase).toBe('complete');
  expect(status.stop).toBeUndefined();
  expect(status.attempts.map((attempt: any) => attempt.accepted?.outcomeId))
    .toEqual(['ready', 'revise', 'ready', 'pass']);
  // No manufactured pass: exactly one accepted pass exists, and it is the submitted one.
  expect(status.attempts.filter((attempt: any) => attempt.accepted?.outcomeId === 'pass')).toHaveLength(1);
  expect(status.attempts.at(-1).result.payload).toEqual({ kind: 'value', value: pass });
  expect(status.budget.totals.executions).toBe(4);
  expect(status.loops).toMatchObject([{ id: 'review-loop', traversals: 1, maxTraversals: 2 }]);
});

test('the review loop stops at its declared traversal cap without manufacturing a pass', async () => {
  const rigged = await rig(examples.standard);
  const dispatched: string[] = [];
  const decisions: string[] = [];
  for (let index = 0; index < 8; index++) {
    const request = rigged.deliveries[index];
    if (request === undefined) break;
    dispatched.push(request.nodeId);
    const outcome = request.nodeId === 'design' ? 'ready' : 'revise';
    decisions.push((await rigged.submit(index, outcome, report(request.nodeId, outcome, index))).decision);
    await rigged.drain();
  }
  expect(dispatched).toEqual(['design', 'review', 'design', 'review', 'design', 'review']);
  expect(dispatched.filter(node => node === 'design')).toHaveLength(3);
  expect(dispatched.filter(node => node === 'review')).toHaveLength(3);
  expect(decisions).toEqual(['accepted', 'accepted', 'accepted', 'accepted', 'accepted', 'accepted']);
  expect(rigged.deliveries).toHaveLength(6);

  const status = await rigged.status();
  expect(status.phase).toBe('stopped');
  expect(status.stop).toMatchObject({
    reason: 'loop-exhausted', loopGroupId: 'review-loop', nodeId: 'review',
    outcomeId: 'revise', traversals: 2, maxTraversals: 2,
  });
  expect(status.loops).toMatchObject([{ id: 'review-loop', traversals: 2, maxTraversals: 2 }]);
  expect(status.attempts.at(-1).accepted.outcomeId).toBe('revise');
  expect(status.attempts.filter((attempt: any) => attempt.accepted?.outcomeId === 'pass')).toHaveLength(0);
  expect(status.budget.totals.executions).toBe(6);
});

test('a context escalation never starts artifact work', async () => {
  const rigged = await rig(examples.full);
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['context-researcher']);
  const escalation = {
    schema_version: 1, gate: 'Context', status: 'needs-user-input',
    reason: 'Audience conflict', unresolved: [],
  };
  expect((await rigged.submit(0, 'escalate', escalation)).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['context-researcher']);
  const status = await rigged.status();
  expect(status.attempts.map((attempt: any) => attempt.accepted?.outcomeId)).toEqual(['escalate']);
  expect(status.budget.totals.executions).toBe(1);
  expect(status.nodes.map((node: any) => node.node_id)).toEqual(['context-researcher', 'design', 'review']);
  expect(status.nodes.find((node: any) => node.node_id === 'design').status).toBe('pending');
});

test('a bound worker settles only its own node and a refused submission never advances a consumer', async () => {
  const rigged = await rig(examples.standard);
  const designSession = `worker:${rigged.deliveries[0].attemptId}`;
  for (const tool of ['graph_declare', 'graph_control', 'graph_status', 'graph_audit']) {
    expect((await rigged.call(tool, {}, designSession)).code).toBe('worker-tool-forbidden');
  }
  expect((await rigged.submit(0, 'ready', report('Design', 'ready'))).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design', 'review']);

  // The design attempt's credential is bound to design and cannot be re-aimed at review.
  const foreign = await rigged.call('graph_submit_outcome', {
    graph_id: examples.standard.name, node_id: 'review', outcome_id: 'revise',
    credential: rigged.deliveries[0].credential, data: report('Review', 'revise'),
  }, designSession);
  expect(foreign.decision).not.toBe('accepted');
  expect(foreign.refusals.map((refusal: any) => refusal.code)).toContain('credential-node-mismatch');

  // review declares pass | revise | escalate, so 'ready' cannot settle it.
  const undeclared = await rigged.submit(1, 'ready', report('Review', 'ready'));
  expect(undeclared.decision).not.toBe('accepted');
  expect(undeclared.refusals.map((refusal: any) => refusal.code)).toContain('undeclared-outcome');

  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design', 'review']);
  const blocked = await rigged.status();
  expect(blocked.attempts.map((attempt: any) => attempt.accepted?.outcomeId)).toEqual(['ready', undefined]);

  // Its own attempt with its own credential still settles the node and releases the consumer.
  expect((await rigged.submit(1, 'revise', report('Review', 'revise'))).decision).toBe('accepted');
  await rigged.drain();
  expect(rigged.deliveries.map(request => request.nodeId)).toEqual(['design', 'review', 'design']);
});
