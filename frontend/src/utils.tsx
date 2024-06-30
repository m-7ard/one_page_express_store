import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
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

export function positionFixedContainer(
    element: HTMLElement,
    reference: HTMLElement,
    positioning: Record<string, string>,
) {
    // positioning arg needs to be a dict / object. Use JSON.parse on the data-positioning
    // before passing it in.
    const referenceDimensions = reference.getBoundingClientRect();

    const parsedPositioning = { ...positioning };

    //
    Object.entries(positioning).forEach(([key, value]) => {
        if (value.includes("%") && ["left", "right"].includes(key)) {
            parsedPositioning[key] = reference.offsetWidth * (parseInt(value.slice(0, -1)) / 100) + "px";
        } else if (value.includes("%") && ["top", "bottom"].includes(key)) {
            parsedPositioning[key] = reference.offsetHeight * (parseInt(value.slice(0, -1)) / 100) + "px";
        }
    });

    //
    console.log(`calc(${referenceDimensions.top}px + calc(${parsedPositioning.top}))`);
    if (parsedPositioning.top != undefined) {
        element.style.top = `calc(${referenceDimensions.top}px + calc(${parsedPositioning.top}))`;
    } else {
        element.style.top = "";
    }
    if (parsedPositioning.left != undefined) {
        element.style.left = `calc(${referenceDimensions.left}px + calc(${parsedPositioning.left}))`;
    } else {
        element.style.left = "";
    }
    if (parsedPositioning.right != undefined) {
        element.style.right = `calc(${document.body.clientWidth - referenceDimensions.right}px + calc(${parsedPositioning.right}))`;
    } else {
        element.style.right = "";
    }
    if (parsedPositioning.bottom != undefined) {
        element.style.bottom = `calc(${document.body.clientHeight - referenceDimensions.bottom}px + calc(${parsedPositioning.bottom}))`;
    } else {
        element.style.bottom = "";
    }
}

export function fitFixedContainer(element: HTMLElement) {
    /* TODO: set max heigh / width in case the container extends */
    let elementDimensions = element.getBoundingClientRect();

    if (elementDimensions.bottom > document.body.clientHeight) {
        element.style.bottom = "0px";
        element.style.top =
            element.offsetHeight >= document.body.offsetHeight
                ? "0px"
                : `${document.body.offsetHeight - elementDimensions.height}px`;
    }

    elementDimensions = element.getBoundingClientRect();
    if (elementDimensions.top < 0) {
        element.style.top = "0px";
        element.style.bottom =
            element.offsetHeight >= document.body.offsetHeight
                ? "0px"
                : `${document.body.offsetHeight - elementDimensions.height}px`;
    }

    elementDimensions = element.getBoundingClientRect();
    if (elementDimensions.right > document.body.clientWidth) {
        element.style.right = "0px";
    }

    elementDimensions = element.getBoundingClientRect();
    if (elementDimensions.left < 0) {
        element.style.left = "0px";
    }
}

export const [TooltipContext, useTooltipContext] = createUseContext<{
    referenceElement: HTMLElement | null;
    setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    targetElement: HTMLElement | null;
    setTargetElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    open: boolean;
    positioning: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
}>("useTooltipContext has to be used within <TooltipContext.Provider>");

export function TooltipProvider({
    children,
    value,
}: React.PropsWithChildren<{
    value: {
        referenceElement: HTMLElement | null;
        setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
        targetElement: HTMLElement | null;
        setTargetElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
        open: boolean;
        positioning: {
            top?: string;
            right?: string;
            bottom?: string;
            left?: string;
        };
    };
}>) {
    return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>;
}

export function useTooltipTools() {
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

    return {
        referenceElement,
        setReferenceElement,
        targetElement,
        setTargetElement,
    };
}

function usePositioning({
    targetElement,
    referenceElement,
    positioning,
}: {
    targetElement: HTMLElement | null;
    referenceElement: HTMLElement | null;
    positioning: Record<string, string>;
}) {
    const resizeWindow = useCallback(() => {
        if (targetElement == null || referenceElement == null) {
            return;
        }
        positionFixedContainer(targetElement, referenceElement, positioning);
        fitFixedContainer(targetElement);
    }, [targetElement, referenceElement, positioning]);

    const [positionFlag, setPositionFlag] = useState(false);
    useLayoutEffect(() => {
        if (targetElement == null || referenceElement == null) {
            return;
        }

        setTimeout(() => {
            // Needs to happen on the next iteration of the event
            // loop to account for router transitions
            resizeWindow();
            window.addEventListener("resize", resizeWindow);
            setPositionFlag(true);
        }, 0);

        return () => {
            window.removeEventListener("resize", resizeWindow);
        };
    }, [targetElement, referenceElement, positioning, resizeWindow]);

    return { positionFlag, resizeWindow };
}

export function useTooltipContextPositioning() {
    const { targetElement, referenceElement, positioning } = useTooltipContext();
    return usePositioning({ positioning, targetElement, referenceElement });
}

export function useTooltipPlainPositioning({
    targetElement,
    referenceElement,
    positioning,
}: {
    targetElement: HTMLElement | null;
    referenceElement: HTMLElement | null;
    positioning: Record<string, string>;
}) {
    return usePositioning({ positioning, targetElement, referenceElement });
}

export function generateLabel(input: string): string {
    const words = input.split("_");
    const capitalizedWords = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    return capitalizedWords.join(" ");
}
