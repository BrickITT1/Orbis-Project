export const throttlet = (func: (...args: any[]) => void, limit: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};

type SocketEventHandler<T> = (data: T) => Promise<void> | void;

export function createSocketThrottler<T>(
    handler: SocketEventHandler<T>,
    delay: number,
): SocketEventHandler<T> {
    let pendingData: T | null = null;
    let isProcessing = false;

    return async (data: T) => {
        pendingData = data; // Всегда актуализируем данные

        if (isProcessing) return;

        isProcessing = true;
        try {
            do {
                const currentData = pendingData;
                pendingData = null;
                await handler(currentData);
                await new Promise((resolve) => setTimeout(resolve, delay));
            } while (pendingData !== null);
        } finally {
            isProcessing = false;
        }
    };
}

interface ThrottleOptions {
    leading?: boolean;
    trailing?: boolean;
}

export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    options: { leading?: boolean; trailing?: boolean } = {},
): T & { cancel: () => void } => {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let lastArgs: Parameters<T> | null = null;
    let lastCallTime = 0;
    let pending = false;

    const throttled = (...args: Parameters<T>) => {
        const now = Date.now();
        lastArgs = args;
        if (!pending && options.leading !== false) {
            call();
        } else if (options.trailing !== false) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(
                call,
                Math.max(0, wait - (now - lastCallTime)),
            );
        }
    };

    const call = () => {
        lastCallTime = Date.now();
        pending = true;
        try {
            func(...lastArgs!);
        } catch (err) {
            console.error("Throttled function error:", err);
        }
        pending = false;
    };

    throttled.cancel = () => {
        if (timeout) clearTimeout(timeout);
        timeout = null;
        lastArgs = null;
    };

    return throttled as T & { cancel: () => void };
};
