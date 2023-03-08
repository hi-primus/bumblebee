const MAX_JOBS_TO_PROCESS_IN_PARALLEL = 1;

type CallbackFunction = (result: unknown, error?: Error) => void;

type Job = {
  topic: string;
  payload: unknown;
  callback: CallbackFunction;
  category: string;
  priority: number;
  timestamp: number;
};

type PubSubInterface = {
  process: (payload?: unknown) => unknown;
  subscribe: (topic: string, callback: CallbackFunction) => void;
  publish: (
    topic: string,
    payload: unknown,
    callback?: CallbackFunction,
    category?: string,
    priority?: number
  ) => Promise<void>;
  removeByPriority: (priority: number) => void;
  removeByCategory: (category: string) => void;
  processQueue: () => void;
  subscribers: Record<string, CallbackFunction[]>;
  queue: {
    resolve: (value?: unknown) => void;
    job: Job;
  }[];
};

export function PubSub(
  process: (payload: unknown) => unknown
): PubSubInterface {
  const pubSub = {} as Partial<PubSubInterface>;

  pubSub.subscribers = {};
  pubSub.queue = [];

  pubSub.process = process;

  pubSub.subscribe = (topic, callback) => {
    if (!pubSub.subscribers[topic]) {
      pubSub.subscribers[topic] = [];
    }
    pubSub.subscribers[topic].push(callback);
  };

  pubSub.publish = (
    topic = '',
    payload = {},
    callback = null,
    category = '',
    priority = 0
  ) => {
    const promise = new Promise((resolve) => {
      const job = {
        topic,
        payload,
        callback,
        category,
        priority,
        timestamp: Date.now(),
      };
      pubSub.queue.push({ resolve, job });
      pubSub.queue.sort((a, b) => {
        if (a.job.priority !== b.job.priority) {
          return a.job.priority - b.job.priority;
        }
        return a.job.timestamp - b.job.timestamp;
      });
    });
    setTimeout(() => {
      pubSub.processQueue();
    }, 0);
    return promise as Promise<void>;
  };

  pubSub.removeByPriority = (priority) => {
    pubSub.queue = pubSub.queue.filter(
      (item) => item.job.priority !== priority
    );
  };

  pubSub.removeByCategory = (category) => {
    pubSub.queue = pubSub.queue.filter(
      (item) => item.job.category !== category
    );
  };

  let processing = false;

  pubSub.processQueue = async () => {
    if (processing) {
      return;
    }
    processing = true;
    if (pubSub.queue.length > 0) {
      const jobsToProcess = pubSub.queue.splice(
        0,
        MAX_JOBS_TO_PROCESS_IN_PARALLEL
      );
      await Promise.all(
        jobsToProcess.map(async ({ resolve, job }) => {
          let result: unknown;
          let error: Error | undefined = undefined;
          try {
            result = await pubSub.process(job.payload);
          } catch (err) {
            error = err;
          }
          const subscribers = pubSub.subscribers[job.topic] || [];
          if (job.callback && typeof job.callback === 'function') {
            subscribers.push(job.callback);
          }
          for (const subscriber of subscribers) {
            subscriber(result, error);
          }
          resolve();
        })
      );
      await Promise.race([
        new Promise((resolve) => setTimeout(resolve, 0)),
        Promise.resolve(),
      ]);
    }
    processing = false;
    if (pubSub.queue.length > 0) {
      pubSub.processQueue();
    }
  };

  return pubSub as PubSubInterface;
}
