import fs from 'fs';
import os from 'os';
import path from 'path';
import { classify } from '../src/import/classifier';
import {
  TaskRulesConfig,
  TaskRulesConfigError,
  defaultTaskRulesConfigPath,
  loadTaskRulesConfig,
  validateTaskRulesConfig,
} from '../src/import/taskRules';

const ALT_CONFIG_PATH = path.join(__dirname, 'fixtures', 'task-rules.alt.json');

/** Deep-copyable valid base for mutation-style validation tests. */
function validConfig(): TaskRulesConfig {
  return JSON.parse(fs.readFileSync(defaultTaskRulesConfigPath(), 'utf8'));
}

describe('task rules config (AC-3, AC-4)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'us2-'));
  afterAll(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

  test('default repo config path exists and loads/validates', () => {
    const config = loadTaskRulesConfig();
    expect(defaultTaskRulesConfigPath()).toBe(
      path.join(__dirname, '..', 'config', 'task-rules.json'),
    );
    expect(config.version).toBe(1);
    expect(config.timezone).toBe('Asia/Singapore');
    expect(config.taskTypes[config.taskTypes.length - 1]).toBe('Uncategorised');
  });

  test('TASK_RULES_CONFIG_PATH env is used when no path argument is given', () => {
    const original = process.env.TASK_RULES_CONFIG_PATH;
    process.env.TASK_RULES_CONFIG_PATH = ALT_CONFIG_PATH;
    try {
      expect(loadTaskRulesConfig().taskTypes).toContain('Bugfixing');
    } finally {
      if (original !== undefined) process.env.TASK_RULES_CONFIG_PATH = original;
      else delete process.env.TASK_RULES_CONFIG_PATH;
    }
  });

  test('argument path beats the env override', () => {
    const original = process.env.TASK_RULES_CONFIG_PATH;
    process.env.TASK_RULES_CONFIG_PATH = ALT_CONFIG_PATH;
    try {
      expect(loadTaskRulesConfig(defaultTaskRulesConfigPath()).taskTypes).toContain(
        'Debugging/fixing',
      );
    } finally {
      if (original !== undefined) process.env.TASK_RULES_CONFIG_PATH = original;
      else delete process.env.TASK_RULES_CONFIG_PATH;
    }
  });

  test('missing config file → TaskRulesConfigError', () => {
    expect(() => loadTaskRulesConfig(path.join(tmpDir, 'nope.json'))).toThrow(TaskRulesConfigError);
  });

  test('invalid JSON file → TaskRulesConfigError', () => {
    const bad = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(bad, '{not json');
    expect(() => loadTaskRulesConfig(bad)).toThrow(TaskRulesConfigError);
  });

  describe('AC-4: config edit changes classification with zero code change', () => {
    const repoConfig = loadTaskRulesConfig(path.join(__dirname, '..', 'config', 'task-rules.json'));
    const altConfig = loadTaskRulesConfig(ALT_CONFIG_PATH);

    test('alt config validates; rename is visible in the task type list', () => {
      expect(altConfig.taskTypes).toContain('Bugfixing');
      expect(altConfig.taskTypes).not.toContain('Debugging/fixing');
      expect(altConfig.taskTypes[altConfig.taskTypes.length - 1]).toBe('Uncategorised');
      expect(altConfig.rules[0].taskType).toBe('Review/testing'); // reordered: Review first
    });

    test('renamed task type: same metadata classifies to Bugfixing under the alt config', () => {
      const metadata = { command: 'fix-crash', agent: 'debug-helper' };
      expect(classify(metadata, repoConfig)).toBe('Debugging/fixing');
      expect(classify(metadata, altConfig)).toBe('Bugfixing');
    });

    test('reordered rules: metadata matching Review and Debugging flips its winner with the reorder', () => {
      // Matches the Debugging rule (fix + debug) AND the Review rule (review + review).
      const metadata = { command: 'review-and-fix', agent: 'review-debug' };
      expect(classify(metadata, repoConfig)).toBe('Debugging/fixing'); // Debugging listed first
      expect(classify(metadata, altConfig)).toBe('Review/testing'); // Review listed first
    });
  });

  describe('validation failures throw TaskRulesConfigError', () => {
    test.each([
      ['version: 2', (c: TaskRulesConfig) => (c.version = 2 as unknown as 1)],
      ['Uncategorised absent', (c: TaskRulesConfig) => c.taskTypes.pop()],
      [
        'Uncategorised not last',
        (c: TaskRulesConfig) => {
          c.taskTypes.pop();
          c.taskTypes.unshift('Uncategorised');
        },
      ],
      [
        'duplicate task types',
        (c: TaskRulesConfig) => c.taskTypes.push(c.taskTypes[0]),
      ],
      [
        'rule taskType outside the list',
        (c: TaskRulesConfig) => c.rules.push({ taskType: 'Crystal-gazing', match: { agent: ['x'] } }),
      ],
      [
        'empty keyword array',
        (c: TaskRulesConfig) => c.rules.push({ taskType: 'Planning/design', match: { command: [] } }),
      ],
      [
        'non-string keyword',
        (c: TaskRulesConfig) => c.rules.push({ taskType: 'Planning/design', match: { command: [7 as unknown as string] } }),
      ],
      ['version as a string', (c: TaskRulesConfig) => (c.version = '1' as unknown as 1)],
    ])('%s', (_name, mutate) => {
      const config = validConfig();
      mutate(config);
      expect(() => validateTaskRulesConfig(config)).toThrow(TaskRulesConfigError);
    });

    test.each([
      ['null', null],
      ['array', []],
      ['rules not an array', { version: 1, timezone: 'UTC', taskTypes: ['Uncategorised'], rules: 'x' }],
      ['taskTypes empty', { version: 1, timezone: 'UTC', taskTypes: [], rules: [] }],
      ['timezone missing', { version: 1, taskTypes: ['Uncategorised'], rules: [] }],
    ])('raw %s → TaskRulesConfigError', (_name, raw) => {
      expect(() => validateTaskRulesConfig(raw)).toThrow(TaskRulesConfigError);
    });
  });
});
