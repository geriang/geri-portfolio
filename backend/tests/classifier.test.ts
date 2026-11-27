import { UNCATEGORISED, classify, ruleMatches } from '../src/import/classifier';
import { TaskRulesConfig, defaultTaskRulesConfigPath, loadTaskRulesConfig } from '../src/import/taskRules';

/** Minimal valid config builder for in-test rule experiments. */
function configWith(rules: TaskRulesConfig['rules'], taskTypes?: string[]): TaskRulesConfig {
  return {
    version: 1,
    timezone: 'Asia/Singapore',
    taskTypes: taskTypes ?? [
      'Coding/implementation',
      'Debugging/fixing',
      'Planning/design',
      'Research/questions',
      'Writing/documentation',
      'Review/testing',
      'Uncategorised',
    ],
    rules,
  };
}

describe('classify (AC-3)', () => {
  test('an event matching one rule gets that rule’s task type', () => {
    const config = configWith([
      { taskType: 'Debugging/fixing', match: { command: ['fix'] } },
      { taskType: 'Review/testing', match: { command: ['review'] } },
    ]);
    expect(classify({ command: 'fix-login-bug' }, config)).toBe('Debugging/fixing');
    expect(classify({ command: 'review-pr' }, config)).toBe('Review/testing');
  });

  test('first-match-wins: overlapping keywords resolve to the earlier rule, and reordering flips it (zero code change)', () => {
    const overlapping = [{ taskType: 'Debugging/fixing', match: { agent: ['debug'] } }];
    const alsoMatching = [{ taskType: 'Writing/documentation', match: { agent: ['writer'] } }];
    const metadata = { agent: 'debug-writer' }; // matches BOTH rules

    const debugFirst = configWith([...overlapping, ...alsoMatching]);
    expect(classify(metadata, debugFirst)).toBe('Debugging/fixing');

    // Same data, same code; only the config's rule order differs.
    const writingFirst = configWith([...alsoMatching, ...overlapping]);
    expect(classify(metadata, writingFirst)).toBe('Writing/documentation');
  });

  test('no-match metadata ({}) falls back to Uncategorised', () => {
    const config = configWith([{ taskType: 'Debugging/fixing', match: { command: ['fix'] } }]);
    expect(classify({}, config)).toBe(UNCATEGORISED);
  });

  test('unknown metadata keys never match → Uncategorised', () => {
    const config = configWith([{ taskType: 'Debugging/fixing', match: { command: ['fix'] } }]);
    expect(classify({ flavour: 'fix everything', unrelated: 'fix' }, config)).toBe(UNCATEGORISED);
  });

  test('empty rules list → Uncategorised', () => {
    expect(classify({ command: 'fix-crash' }, configWith([]))).toBe(UNCATEGORISED);
  });

  test('classify never throws on odd metadata', () => {
    const config = configWith([{ taskType: 'Debugging/fixing', match: { command: ['fix'] } }]);
    expect(() => classify({ command: 'fix' }, config)).not.toThrow();
    expect(classify({ command: '   FIX everything ' }, config)).toBe('Debugging/fixing');
    const strict = configWith([{ taskType: 'Debugging/fixing', match: { command: ['fix'], agent: ['debug'] } }]);
    expect(classify({ command: 'fix' }, strict)).toBe(UNCATEGORISED); // agent key absent → no match
  });

  test('keyword matching is case-insensitive and trims both sides', () => {
    const rule: TaskRulesConfig['rules'][number] = { taskType: 'Coding/implementation', match: { title: ['  READ ME  '] } };
    expect(ruleMatches({ title: 'Draft   Read me notes' }, rule)).toBe(true);
    expect(ruleMatches({ title: 'nothing here' }, rule)).toBe(false);
  });

  test('every key in rule.match must be present (AND across keys, OR within keywords)', () => {
    const rule = { taskType: 'Coding/implementation', match: { directory: ['src'], agent: ['build'] } };
    expect(ruleMatches({ directory: '/repo/src/app', agent: 'build-master' }, rule)).toBe(true);
    expect(ruleMatches({ directory: '/repo/src/app' }, rule)).toBe(false); // agent missing
    expect(ruleMatches({ directory: '/repo/docs', agent: 'build-master' }, rule)).toBe(false);
  });

  test('empty match {} is a catch-all', () => {
    const config = configWith([{ taskType: 'Planning/design', match: {} }]);
    expect(classify({ anything: 'at all' }, config)).toBe('Planning/design');
    expect(classify({}, config)).toBe('Planning/design');
  });

  test('repo config loads via default path and classifies command "fix-crash" as Debugging/fixing', () => {
    expect(require('fs').existsSync(defaultTaskRulesConfigPath())).toBe(true);
    const config = loadTaskRulesConfig();
    // AND across keys: the Debugging rule needs a "fix|debug" command AND a "debug" agent.
    expect(classify({ command: 'fix-crash', agent: 'debug-helper' }, config)).toBe('Debugging/fixing');
  });
});
