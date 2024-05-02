import mysql from "mysql2/promise";

interface Context {
    pool: null | mysql.Pool;
    testsToRun: null | '__all__' | string[]
}

const context: Context = {
    pool: null,
    testsToRun: null
};

export function getFromContext<K extends keyof Context>(key: K): NonNullable<Context[K]> {
    const value = context[key];
    if (value == null) {
        throw new Error(`Value associated with key '${key}' is null`);
    }
    return value;
}

export default context;
