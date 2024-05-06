import { Listbox } from "@headlessui/react";
import React, { useEffect, useState } from "react";
import { asWidget, createUseContext } from "../../../../utils";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { usePopper } from "react-popper-2";
import App from "../../../blocks/App/App";

export type Value = string;
export type Choice = {
    value: Value;
    label: Value;
};

export const getChoice = ({ choices, value }: { choices: Choice[]; value?: Value }) =>{
    if (value == null) {
        return;
    };

    return choices.find((choice) => choice.value === value);
}
export function usePositioning() {
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
    const popper = usePopper(referenceElement, popperElement, {
        placement: "bottom-end",
        strategy: "fixed",
        modifiers: [
            {
                name: "preventOverflow",
                options: {
                    altAxis: true,
                },
            },
            {
                name: "offset",
                options: {
                    offset: [0, -1],
                },
            },
        ],
    });

    return {
        referenceElement,
        setReferenceElement,
        popperElement,
        setPopperElement,
        popper,
    };
}

export const [GenericListboxContext, useGenericListboxContext] = createUseContext<ReturnType<typeof usePositioning>>(
    "useGenericListboxContext has to be used within <GenericListboxContext.Provider>",
);

export function GenericListbox({ children, ...props }: React.ComponentProps<typeof Listbox>) {
    const positioning = usePositioning();

    return (
        <GenericListboxContext.Provider value={{ ...positioning }}>
            <Listbox {...props} className="flex flex-col gap-2 select-none" as="div">
                {children}
            </Listbox>
        </GenericListboxContext.Provider>
    );
}

GenericListbox.Options = function Options({ children, ...props }: React.ComponentProps<typeof Listbox.Options>) {
    const { setPopperElement, popper, referenceElement } = useGenericListboxContext();

    return (
        <Listbox.Options
            className={"overflow-auto max-h-64 divide-y divide-gray-900 border border-gray-900"}
            ref={setPopperElement}
            style={{ ...popper.styles.popper, width: `${referenceElement?.offsetWidth}px` }}
            {...popper.attributes.popper}
            {...props}
        >
            {children}
        </Listbox.Options>
    );
};

interface OptionProps extends React.ComponentProps<typeof Listbox.Option> {
    children: React.ReactNode;
}

GenericListbox.Option = function Option({ children, ...props }: OptionProps) {
    return (
        <Listbox.Option {...props}>
            {({ active, selected }) => (
                <div
                    className={[
                        App.BaseButtonClassNames.replace("border", ""),
                        'text-base hover:bg-gray-200',
                        selected ? "bg-gray-200" : "bg-gray-100"
                    ].join(' ')}
                >
                    {children}
                </div>
            )}
        </Listbox.Option>
    );
};

interface ButtonProps extends React.ComponentProps<typeof Listbox.Button> {
    children: React.ReactNode;
}

GenericListbox.Button = function Button({ children, ...props }: ButtonProps) {
    const { setReferenceElement } = useGenericListboxContext();

    return (
        <Listbox.Button {...props}>
            {({ open }) => (
                <div
                    className={[
                        App.BaseButtonClassNames,
                        "justify-between hover:bg-gray-200 cursor-pointer",
                        open ? " bg-gray-200" : "bg-gray-100",
                    ].join(" ")}
                    ref={setReferenceElement}
                >   
                    <>
                        {children}
                        <ChevronRightIcon className={`w-4 h-4 ${open && "rotate-90"}`} />
                    </>
                </div>
            )}
        </Listbox.Button>
    );
};
