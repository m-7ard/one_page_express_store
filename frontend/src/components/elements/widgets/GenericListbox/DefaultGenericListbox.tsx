import { Listbox } from "@headlessui/react";
import { Choice, Value } from "./types";
import {
    TooltipProvider,
    createUseContext,
    useTooltipContext,
    useTooltipContextPositioning,
    useTooltipTools,
} from "../../../../utils";

interface DefaultGenericListboxInterface {
    placeholder?: string;
    nullable?: boolean;
    choices: Choice[];
    currentValue?: Value;
    parentProps: React.ComponentProps<typeof Listbox>;
}

const getChoice = ({ choices, value }: { choices: Choice[]; value?: Value }) => {
    if (value == null) {
        return;
    }

    return choices.find((choice) => choice.value === value);
};

const [GenericListboxContext, useGenericListboxContext] = createUseContext<DefaultGenericListboxInterface>(
    "useGenericListboxContext has to be used within <GenericListboxContext.Provider>",
);

export default function DefaultGenericListbox({
    placeholder = "---",
    nullable = true,
    choices,
    currentValue,
    parentProps,
}: DefaultGenericListboxInterface) {
    const tooltipTools = useTooltipTools();

    return (
        <Listbox {...parentProps}>
            {({ open }) => (
                <TooltipProvider
                    value={{ ...tooltipTools, open, positioning: { top: "100%", left: "0px", right: "0px" } }}
                >
                    <GenericListboxContext.Provider
                        value={{
                            placeholder,
                            nullable,
                            choices,
                            currentValue,
                            parentProps,
                        }}
                    >
                        <DefaultGenericListbox.Button />
                        {open && <DefaultGenericListbox.Options />}
                    </GenericListboxContext.Provider>
                </TooltipProvider>
            )}
        </Listbox>
    );
}

DefaultGenericListbox.Button = function Button() {
    const { setReferenceElement } = useTooltipContext();
    const { choices, currentValue, placeholder } = useGenericListboxContext();
    const currentChoice = getChoice({ choices, value: currentValue });

    return (
        <Listbox.Button
            className={`
                mixin-button-base
                theme-group-listbox-generic-white__button
            `}
            ref={setReferenceElement}
        >
            {currentChoice?.label ?? placeholder}
        </Listbox.Button>
    );
};

DefaultGenericListbox.Options = function Options() {
    const { positionFlag } = useTooltipContextPositioning();
    const { setTargetElement } = useTooltipContext();
    const { nullable, choices, placeholder, currentValue } = useGenericListboxContext();

    return (
        <Listbox.Options
            className={`z-50 fixed theme-group-listbox-generic-white__menu ${positionFlag ? "visible" : "invisible"}`}
            ref={setTargetElement}
        >
            {nullable && (
                <Listbox.Option
                    value={undefined}
                    className={`
                    mixin-button-base
                    theme-group-listbox-generic-white__item
                    ${currentValue === undefined && "theme-group-listbox-generic-white__item--active"}
                `}
                >
                    {placeholder}
                </Listbox.Option>
            )}
            {choices.map((choice) => (
                <Listbox.Option
                    key={choice.value}
                    value={choice.value}
                    className={`
                    mixin-button-base
                    theme-group-listbox-generic-white__item
                    ${currentValue === choice.value && "theme-group-listbox-generic-white__item--active"}
                `}
                >
                    {choice.label}
                </Listbox.Option>
            ))}
        </Listbox.Options>
    );
};
