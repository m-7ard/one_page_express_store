import React, { createContext, useContext, useRef, useState } from "react";
import { FormErrors } from "./components/elements/forms/GenericForm";

export type Widget = ({ name }: { name: string }) => React.ReactNode;

export function asWidget<T extends { name: string }>(
    Component: React.FunctionComponent<T>,
    defaultProps: Omit<T, "name"> | Record<string, never>,
) {
    return function Widget(props: Omit<T, "name">): Widget {
        return ({ name }: { name: string }) => Component({ name, ...props, ...defaultProps } as T);
    };
}

export function getCookie(name: string): string | null | undefined {
    let cookieValue = null;
    if (document.cookie != null && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

export function createUseContext<T>(errorMessage: string): [React.Context<T | null>, () => T] {
    const _context = createContext<T | null>(null);
    const _useContext = () => {
        const contextValue = useContext(_context);

        if (contextValue == null) {
            throw new Error(errorMessage);
        }

        return contextValue;
    };
    return [_context, _useContext];
}

export function useGenericForm() {
    const [errors, setErrors] = useState<FormErrors>();
    return { errors, setErrors };
}

export function useGetIncrementalID() {
    const id = useRef(0);

    return () => {
        const current = id.current;
        id.current += 1;
        return current;
    };
}

export const useLineGrid = ({ height }: { height: number }) => {
    return () => (
        <div className="absolute inset-0">
            {Array.from({ length: height }).map((_, i) => (
                <hr
                    className="h-0 w-full border-b border-gray-400 absolute z-100"
                    style={{ height: `${(i / height) * 100}%` }}
                ></hr>
            ))}
        </div>
    );
};

export const toBase64 = (file: File) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
    });
