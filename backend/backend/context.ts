import mysql from "mysql2/promise";

interface Context {
    pool: null | mysql.Pool;
}

const context: Context = {
    pool: null,
};

export function getFromContext<K extends keyof Context>(key: K): NonNullable<Context[K]> {
    const value = context[key];
    if (value == null) {
        throw new Error(`Value associated with key '${key}' is null`);
    }
    return value;
}

export default context;
