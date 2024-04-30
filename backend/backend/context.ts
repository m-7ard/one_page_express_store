import mysql from "mysql2/promise";

export const context: {
    pool: mysql.Pool | null;
} = {
    pool: null,
};

export function getFromContext(key: keyof typeof context) {
    if (!context.hasOwnProperty(key)) {
        throw Error(`"${key}" is not a valid key of context.`);
    }
    if (context[key] == null) {
        throw Error(`"${key}" is null.`);
    }

    return context[key]!;
}

export default context;
