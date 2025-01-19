export class DatabaseError extends Error {
    constructor(
        message: string,
        public code?: string,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'DatabaseError';
    }
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public field?: string,
        public value?: any
    ) {
        super(message);
        this.name = 'ValidationError';
    }
}
