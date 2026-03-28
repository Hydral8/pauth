import type { SwarmCapability, SwarmTask, SwarmTaskStatus } from "./types";

// ---------------------------------------------------------------------------
// Priority task queue — distributes work items to agents
// ---------------------------------------------------------------------------

let taskCounter = 0;
const tasks = new Map<string, SwarmTask>();

function nextTaskId(): string {
  return `swarm-task-${++taskCounter}-${Date.now().toString(36)}`;
}

/** Create a new task for a capability. */
export function createTask(
  capability: SwarmCapability,
  opts: {
    priority?: number;
    dependsOnTasks?: string[];
    maxRetries?: number;
  } = {}
): SwarmTask {
  const task: SwarmTask = {
    id: nextTaskId(),
    capability,
    status: "pending",
    priority: opts.priority ?? 0,
    dependsOnTasks: opts.dependsOnTasks ?? [],
    createdAt: new Date().toISOString(),
    retryCount: 0,
    maxRetries: opts.maxRetries ?? 2,
  };
  tasks.set(task.id, task);
  return task;
}

/** Get a task by id. */
export function getTask(id: string): SwarmTask | undefined {
  return tasks.get(id);
}

/** Update a task's status and metadata. */
export function updateTask(id: string, updates: Partial<Pick<SwarmTask, "status" | "assignedAgent" | "result" | "startedAt" | "completedAt" | "retryCount">>): SwarmTask | undefined {
  const task = tasks.get(id);
  if (!task) return undefined;
  Object.assign(task, updates);
  return task;
}

/**
 * Get the next batch of runnable tasks — tasks whose dependencies are all
 * completed and that haven't started yet. Sorted by priority descending.
 */
export function getReadyTasks(): SwarmTask[] {
  const ready: SwarmTask[] = [];

  for (const task of tasks.values()) {
    if (task.status !== "pending") continue;

    // Check all dependencies are completed
    const depsCompleted = task.dependsOnTasks.every((depId) => {
      const dep = tasks.get(depId);
      return dep?.status === "completed";
    });

    if (depsCompleted) ready.push(task);
  }

  // Sort by priority descending
  ready.sort((a, b) => b.priority - a.priority);
  return ready;
}

/** Get all tasks with a given status. */
export function getTasksByStatus(status: SwarmTaskStatus): SwarmTask[] {
  return Array.from(tasks.values()).filter((t) => t.status === status);
}

/** Check if all tasks are in a terminal state (completed or failed). */
export function allTasksTerminal(): boolean {
  for (const task of tasks.values()) {
    if (task.status === "pending" || task.status === "running") return false;
  }
  return true;
}

/** Get blocked tasks — pending tasks whose dependencies include a failed task. */
export function getBlockedTasks(): SwarmTask[] {
  return Array.from(tasks.values()).filter((task) => {
    if (task.status !== "pending") return false;
    return task.dependsOnTasks.some((depId) => {
      const dep = tasks.get(depId);
      return dep?.status === "failed";
    });
  });
}

/** List all tasks. */
export function listTasks(): SwarmTask[] {
  return Array.from(tasks.values());
}

/** Clear all tasks (for testing or new orchestration run). */
export function clearTasks(): void {
  taskCounter = 0;
  tasks.clear();
}
