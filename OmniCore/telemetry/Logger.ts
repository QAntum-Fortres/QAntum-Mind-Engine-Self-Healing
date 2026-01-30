export class Logger {
    private static instance: Logger;

    private constructor() { }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    public debug(context: string, message: string, ...args: any[]): void {
        console.debug(`[DEBUG][${context}] ${message}`, ...args);
    }

    public info(context: string, message: string, ...args: any[]): void {
        console.info(`[INFO][${context}] ${message}`, ...args);
    }

    public warn(context: string, message: string, ...args: any[]): void {
        console.warn(`[WARN][${context}] ${message}`, ...args);
    }

    public error(context: string, message: string, error?: any): void {
        console.error(`[ERROR][${context}] ${message}`, error);
    }
}
