declare module 'node-cron' {
  export interface ScheduledTask {
    stop(): void;
    start(): void;
    getStatus(): string;
  }
  
  export interface ScheduleOptions {
    scheduled?: boolean;
    timezone?: string;
  }
  
  export function schedule(
    expression: string,
    func: Function,
    options?: ScheduleOptions
  ): ScheduledTask;
  
  export function validate(expression: string): boolean;
}