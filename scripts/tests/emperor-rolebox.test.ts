/** Compatibility with the sibling rolebox source; scripted dispatch, no model calls. */
import { afterEach, expect, test } from 'bun:test';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
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
const { createApprovalPolicy } = await load('src/graph/policy/approval-policy.ts');
const { evaluateCondition } = await load('src/function/conditions.ts');
const { runToolObserve } = await load('src/function/observe.ts');
const { functionRuntime } = await load('src/function/runtime-state.ts');
const examples = JSON.parse(readFileSync(resolve(root, 'roles/emperor/references/graph-examples.json'), 'utf8'));
const roles = await discoverRoles(resolve(root, 'roles'));
const [emperor] = await resolveAllRoles(new Map([['emperor', roles.get('emperor')]]), {
  roleboxDir: resolve(root, 'roles'), globalSkillsDir: resolve(root, '__no_global_skills__'),
  configDir: resolve(root, '__no_global_config__'), builtinDir: resolve(rolebox, 'functions'),
  roleFunctionsMap: new Map(),
});
const agents: any[] = [];
function visit(agent: any) { agents.push(agent); agent.subagents.forEach(visit); }
visit(emperor);
const cleanups: (() => void)[] = [];
afterEach(() => { while (cleanups.length) cleanups.pop()!(); });

async function rig(declaration: any, approvalPolicy?: any) {
  const dir = mkdtempSync(join(tmpdir(), 'emperor-v3-'));
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
    outcomeValidators: validators, outcomeArtifactRoot: dir, approvalPolicy,
    onGraphDeclared: (id: string, sessionId: string, agent: string) => host.startDeclaredGraph(id, { sessionId, agent }),
  });
  const tools = host.bindTools(createOutcomeGraphTools(toolset));
  const call = async (tool: string, args: any, sessionID = 'emperor-session') => {
    const raw = await tools[tool].execute(args, {
      sessionID, messageID: 'm1', agent: sessionID === 'emperor-session' ? 'emperor' : 'worker',
      directory: dir, worktree: dir, abort: new AbortController().signal,
      metadata() {}, async ask() {},
    });
    return JSON.parse(String(raw));
  };
  const declared = await call('graph_declare', { declaration });
  expect(declared.persisted).toBe(true);
  expect(declared.start.kind).toBe('started');
  const submit = (index: number, outcome_id: string, data: any) => {
    const request = deliveries[index];
    return call('graph_submit_outcome', {
      graph_id: declaration.name, node_id: request.nodeId, outcome_id,
      credential: request.credential, data,
    }, `worker:${request.attemptId}`);
  };
  const status = () => call('graph_status', {
    graph_id: declaration.name, scope: 'all', format: 'json', include_output: true, include_history: true,
  });
  return { deliveries, submit, status, call, declared };
}

const report = (id: number) => ({
  schema_version: 1, plan_revision: 'example-v1', subtask_id: id,
  summary: 'Scoped work verified', files_modified: [], verification: [],
  incomplete_items: [], research_evidence: [],
});

test('real loader and resolver preserve role ownership, skills and active functions', async () => {
  const registry = JSON.parse(readFileSync(resolve(root, 'roles/emperor/references/departments.json'), 'utf8'));
  expect(agents.filter(agent => agent.id.startsWith('emperor--jinyiwei--')).map(agent => agent.id).sort())
    .toEqual(Object.values(registry).map((row: any) => row.agent).sort());
  for (const agent of agents) {
    const names = agent.functions.map((fn: any) => fn.name);
    expect(names).not.toContain('loop');
    if (agent.id !== 'emperor--chancellor') expect(names).not.toContain('plan');
    if (!agent.id.startsWith('emperor--jinyiwei')) expect(names).not.toContain('execute');
    for (const name of agent.config.auto_activate ?? []) expect(names).toContain(name);
    expect(agent.references.some((ref: any) => ref.name === 'graph-protocol')).toBe(true);
    expect(agent.references.some((ref: any) => ref.name.startsWith('archive/'))).toBe(false);
    if (agent.id === 'emperor--copilot') continue;
    for (const tool of ['graph_declare', 'graph_control', 'graph_status', 'graph_audit']) {
      expect(agent.config.tools[tool]).toBe(agent.id === 'emperor');
    }
    expect(agent.config.tools.graph_submit_outcome).toBe(agent.id !== 'emperor');
    expect(agent.config.tools.graph_worker_exec).toBe(agent.id !== 'emperor');
    if (!agent.id.startsWith('emperor--jinyiwei--')) continue;
    expect(agent.config.tools).toMatchObject({ Write: true, Edit: true, Bash: true });
    const dir = resolve(root, `roles/emperor/subagents/jinyiwei/subagents/${agent.config.name.toLowerCase()}`);
    const skills = await resolveSkills(agent.config.skills, dir, resolve(root, '__no_global_skills__'));
    expect(skills.map((skill: any) => skill.name).sort()).toEqual([...agent.config.skills].sort());
  }
});

test('all topology examples compile with the current strict v3 parser and registered agents', () => {
  for (const declaration of Object.values(examples) as any[]) {
    const graph = buildDeclaredOutcomeGraph({ declaration });
    expect(graph.plan.graphId).toBe(declaration.name);
    for (const node of declaration.nodes) expect(agents.some(agent => agent.id === node.agent)).toBe(true);
  }
  for (const change of [
    (d: any) => { d.version = 2; },
    (d: any) => { d.nodes[0].needs_approval = true; },
    (d: any) => { d.nodes[0].budget.max_retries = 0; },
  ]) {
    const declaration = structuredClone(examples.execution);
    change(declaration);
    expect(() => buildDeclaredOutcomeGraph({ declaration })).toThrow();
  }
});

test('accepted done delivers pinned data once; replay and redeclaration do not duplicate dispatch', async () => {
  const rigged = await rig(examples.execution);
  expect(rigged.deliveries.map(r => r.nodeId)).toEqual(['exec-1-r0-c0']);
  const payload = report(1);
  expect((await rigged.submit(0, 'done', payload)).decision).toBe('accepted');
  // Drain committed effects through the same host declaration entry.
  await rigged.call('graph_declare', { declaration: examples.execution });
  expect(rigged.deliveries.map(r => r.nodeId)).toEqual(['exec-1-r0-c0', 'exec-2-r0-c0']);
  expect(rigged.deliveries[1].inputs[0]).toMatchObject({
    from: 'exec-1-r0-c0', outcome: 'done', payload: { kind: 'value', value: payload },
  });
  expect((await rigged.submit(0, 'done', payload)).verdict).toBe('replayed');
  expect(rigged.deliveries).toHaveLength(2);
  expect((await rigged.submit(1, 'done', report(2))).decision).toBe('accepted');
  const status = await rigged.status();
  expect(status.phase).toBe('complete');
  expect(status.attempts[0].result.payload).toEqual({ kind: 'value', value: payload });
  expect(status.budget.totals.executions).toBe(2);
  expect(JSON.stringify(status)).not.toContain(rigged.deliveries[0].credential);
  expect((await rigged.call('graph_declare', { declaration: examples.execution })).preserved).toBe(true);
  expect(rigged.deliveries).toHaveLength(2);
});

for (const outcome of ['failed', 'blocked', 'clarification_required', 'approval_required']) {
  test(`${outcome} preserves partial work without releasing a done-only consumer`, async () => {
    const rigged = await rig(examples.execution);
    const partial = { schema_version: 1, plan_revision: 'example-v1', subtask_id: 1,
      reason: 'Remaining work needs attention', completed_work: ['draft'], remaining_work: ['finish'] };
    expect((await rigged.submit(0, outcome, partial)).decision).toBe('accepted');
    await rigged.call('graph_declare', { declaration: examples.execution });
    expect(rigged.deliveries).toHaveLength(1);
    const status = await rigged.status();
    expect(status.attempts[0].accepted.outcomeId).toBe(outcome);
    expect(status.attempts[0].result.payload).toEqual({ kind: 'value', value: partial });
  });
}

test('approval preparation is context only; actual remaining work has a fresh continuation', async () => {
  const approval = await rig(examples.approval);
  expect((await approval.submit(0, 'approval_required', { plan_revision: 'example-v1', proposed_ids: [1, 2] })).decision).toBe('accepted');
  expect((await approval.status()).approvals).toEqual([]);
  expect(approval.deliveries).toHaveLength(1);
  const continued = await rig(examples.continuation);
  expect(continued.deliveries.map(r => r.nodeId)).toEqual(['exec-1-r0-c1']);
});

test('host approval requires the authorized session and does not submit a business result', async () => {
  const declaration = examples.execution;
  const policy = createApprovalPolicy({ id: 'test-policy', revision: '1', rules: [{
    graphId: declaration.name, nodeId: declaration.nodes[0].id,
    approverSessions: ['reviewer-session'], mode: 'independent-review',
  }] });
  const rigged = await rig(declaration, policy);
  const target = { graph_id: declaration.name, node_id: rigged.deliveries[0].nodeId,
    attempt_id: rigged.deliveries[0].attemptId, reason: 'example-v1 scoped operation' };
  const raised = await rigged.call('graph_control', { ...target, command: 'approval-request',
    approver_session_id: 'reviewer-session', expires_at: Date.now() + 60000 });
  expect(raised.kind).toBe('applied');
  expect((await rigged.call('graph_control', { ...target, command: 'approve' })).kind).toBe('refused');
  expect((await rigged.submit(0, 'done', report(1))).decision).not.toBe('accepted');
  expect((await rigged.call('graph_control', { ...target, command: 'approve' }, 'reviewer-session')).kind).toBe('applied');
  expect((await rigged.status()).attempts[0].accepted).toBeUndefined();
  expect(rigged.deliveries).toHaveLength(1);
  expect((await rigged.submit(0, 'done', report(1))).decision).toBe('accepted');
});

test('bound workers cannot declare, query or control graphs', async () => {
  const rigged = await rig(examples.execution);
  const session = `worker:${rigged.deliveries[0].attemptId}`;
  for (const tool of ['graph_declare', 'graph_control', 'graph_status', 'graph_audit']) {
    expect((await rigged.call(tool, {}, session)).code).toBe('worker-tool-forbidden');
  }
});

test('execution ceiling refuses successor dispatch without accepting the predecessor', async () => {
  const declaration = structuredClone(examples.execution);
  declaration.budget.max_executions = 1;
  const rigged = await rig(declaration);
  const result = await rigged.submit(0, 'done', report(1));
  expect(result.decision).not.toBe('accepted');
  expect(result.refusals.some((r: any) => r.code === 'budget-exhausted')).toBe(true);
  expect(rigged.deliveries).toHaveLength(1);
  expect((await rigged.status()).attempts[0].accepted).toBeUndefined();
});

test('worker function completion requires an accepted response, not a signal, fence or rejected call', () => {
  const artifacts = { exists: () => true, read: () => 'result exists', write() {} };
  for (const agent of agents.filter(a => !['emperor', 'emperor--copilot'].includes(a.id))) {
    for (const fn of agent.functions) {
      const sessionID = `contract-${agent.id}-${fn.name}`;
      const state = functionRuntime.init(sessionID, fn.name, 1);
      cleanups.push(() => functionRuntime.clearSession(sessionID));
      const env = { sessionID, fnName: fn.name, state, artifacts,
        requiredEvidence: fn.requires_evidence ?? [], userMessagedThisTurn: false, workspaceDir: root };
      const observe = (tool: string, toolOutput: any) => runToolObserve({
        sessionID, tool, toolOutput, activeFns: [fn], artifacts,
        toolArgs: { type: 'answer' }, lastAssistantText: '```result\n{}\n```',
      });
      expect(evaluateCondition(fn.continue_until, env)).toBe(false);
      observe('signal', 'Signal recorded');
      observe('graph_submit_outcome', JSON.stringify({ decision: 'rejected', verdict: 'committed' }, null, 2));
      observe('graph_submit_outcome', JSON.stringify({ refusals: [{ code: 'submission-settled' }] }));
      expect(evaluateCondition(fn.continue_until, env)).toBe(false);
      for (const spaces of [undefined, 2]) {
        state.evidenceObserved = {};
        observe('graph_submit_outcome', JSON.stringify({ decision: 'accepted', verdict: 'committed', refusals: [] }, null, spaces));
        expect(evaluateCondition(fn.continue_until, env)).toBe(true);
      }
    }
  }
});
