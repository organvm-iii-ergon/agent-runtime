import type { SlashCommandDefinition } from "./slash-registry";

const agentTargets: SlashCommandDefinition[] = [
  {
    token: "planner",
    summary: "Break work into an explicit plan before implementation.",
    kind: "target",
    commandId: "agent.summon.planner"
  },
  {
    token: "reviewer",
    summary: "Review code, docs, or a proposal for risks and regressions.",
    kind: "target",
    commandId: "agent.summon.reviewer"
  },
  {
    token: "implementer",
    summary: "Take ownership of code changes for a bounded implementation task.",
    kind: "target",
    commandId: "agent.summon.implementer"
  }
];

const actionTargets: SlashCommandDefinition[] = [
  {
    token: "build",
    summary: "Run the active build pipeline.",
    kind: "target",
    commandId: "action.run.build"
  },
  {
    token: "test",
    summary: "Run the relevant test suite.",
    kind: "target",
    commandId: "action.run.test"
  },
  {
    token: "lint",
    summary: "Run the lint and formatting checks.",
    kind: "target",
    commandId: "action.run.lint"
  }
];

const functionTargets: SlashCommandDefinition[] = [
  {
    token: "search",
    summary: "Search indexed code or documents.",
    kind: "target",
    commandId: "function.call.search"
  },
  {
    token: "fetch",
    summary: "Fetch a known resource or context payload.",
    kind: "target",
    commandId: "function.call.fetch"
  },
  {
    token: "diff",
    summary: "Diff two snapshots or artifacts.",
    kind: "target",
    commandId: "function.call.diff"
  }
];

const skillTargets: SlashCommandDefinition[] = [
  {
    token: "playwright",
    summary: "Browser automation and UI flow validation.",
    kind: "target",
    commandId: "skill.use.playwright"
  },
  {
    token: "openai-docs",
    summary: "Navigate official OpenAI documentation.",
    kind: "target",
    commandId: "skill.use.openai-docs"
  },
  {
    token: "verification-loop",
    summary: "Run build, type, lint, and test verification loops.",
    kind: "target",
    commandId: "skill.use.verification-loop"
  }
];

const pluginTargets: SlashCommandDefinition[] = [
  {
    token: "github",
    summary: "GitHub connector and repository actions.",
    kind: "target",
    commandId: "plugin.install.github"
  },
  {
    token: "jupyter",
    summary: "Notebook and kernel integration.",
    kind: "target",
    commandId: "plugin.install.jupyter"
  },
  {
    token: "figma",
    summary: "Design file lookup and diagram tooling.",
    kind: "target",
    commandId: "plugin.install.figma"
  }
];

const workflowTargets: SlashCommandDefinition[] = [
  {
    token: "review",
    summary: "Run a review-oriented workflow.",
    kind: "target",
    commandId: "workflow.run.review"
  },
  {
    token: "ship",
    summary: "Run an implementation-to-closeout workflow.",
    kind: "target",
    commandId: "workflow.run.ship"
  },
  {
    token: "research",
    summary: "Run a research and synthesis workflow.",
    kind: "target",
    commandId: "workflow.run.research"
  }
];

function branch(
  token: string,
  summary: string,
  children: SlashCommandDefinition[],
  kind = "verb"
): SlashCommandDefinition {
  return { token, summary, kind, children };
}

export const defaultSlashCommandDefinitions: SlashCommandDefinition[] = [
  {
    token: "agent",
    summary: "Work with agents and their lifecycle.",
    kind: "category",
    children: [
      branch("summon", "Create or select an agent role.", agentTargets),
      branch("resume", "Resume an existing agent context.", [
        {
          token: "recent",
          summary: "Resume the most recent agent session.",
          kind: "target",
          commandId: "agent.resume.recent"
        },
        {
          token: "pinned",
          summary: "Resume a pinned long-lived agent session.",
          kind: "target",
          commandId: "agent.resume.pinned"
        }
      ]),
      branch("inspect", "Inspect agent status and coordination state.", [
        {
          token: "active",
          summary: "List active agents.",
          kind: "target",
          commandId: "agent.inspect.active"
        },
        {
          token: "history",
          summary: "Inspect recent agent history.",
          kind: "target",
          commandId: "agent.inspect.history"
        }
      ])
    ]
  },
  {
    token: "action",
    summary: "Run a concrete action in the current workspace.",
    kind: "category",
    children: [
      branch("run", "Execute an action immediately.", actionTargets),
      branch("queue", "Queue an action for background execution.", [
        {
          token: "background",
          summary: "Run the action via background execution.",
          kind: "target",
          commandId: "action.queue.background"
        },
        {
          token: "scheduled",
          summary: "Schedule the action for later.",
          kind: "target",
          commandId: "action.queue.scheduled"
        }
      ])
    ]
  },
  {
    token: "function",
    summary: "Invoke a callable function.",
    kind: "category",
    children: [
      branch("call", "Invoke a function directly.", functionTargets),
      branch("inspect", "Inspect callable metadata.", [
        {
          token: "schema",
          summary: "Show function input and output schema.",
          kind: "target",
          commandId: "function.inspect.schema"
        },
        {
          token: "history",
          summary: "Show recent function invocations.",
          kind: "target",
          commandId: "function.inspect.history"
        }
      ])
    ]
  },
  {
    token: "skill",
    summary: "Load or inspect a skill.",
    kind: "category",
    children: [
      branch("use", "Activate a skill for the current task.", skillTargets),
      branch("inspect", "Inspect installed skills and metadata.", [
        {
          token: "installed",
          summary: "List installed skills.",
          kind: "target",
          commandId: "skill.inspect.installed"
        },
        {
          token: "docs",
          summary: "Open the selected skill documentation.",
          kind: "target",
          commandId: "skill.inspect.docs"
        }
      ])
    ]
  },
  {
    token: "plugin",
    summary: "Install, enable, or inspect plugins.",
    kind: "category",
    children: [
      branch("install", "Install a plugin.", pluginTargets),
      branch("enable", "Enable an installed plugin.", pluginTargets),
      branch("inspect", "Inspect plugin state or metadata.", [
        {
          token: "installed",
          summary: "List installed plugins.",
          kind: "target",
          commandId: "plugin.inspect.installed"
        },
        {
          token: "permissions",
          summary: "Inspect plugin permission requirements.",
          kind: "target",
          commandId: "plugin.inspect.permissions"
        }
      ])
    ]
  },
  {
    token: "workflow",
    summary: "Start or inspect a reusable workflow.",
    kind: "category",
    children: [
      branch("run", "Run a named workflow.", workflowTargets),
      branch("draft", "Draft a new workflow definition.", [
        {
          token: "spec",
          summary: "Draft a workflow specification.",
          kind: "target",
          commandId: "workflow.draft.spec"
        },
        {
          token: "plan",
          summary: "Draft a workflow execution plan.",
          kind: "target",
          commandId: "workflow.draft.plan"
        }
      ]),
      branch("inspect", "Inspect saved workflow state.", [
        {
          token: "recent",
          summary: "List recently used workflows.",
          kind: "target",
          commandId: "workflow.inspect.recent"
        },
        {
          token: "saved",
          summary: "List saved workflow definitions.",
          kind: "target",
          commandId: "workflow.inspect.saved"
        }
      ])
    ]
  }
];
