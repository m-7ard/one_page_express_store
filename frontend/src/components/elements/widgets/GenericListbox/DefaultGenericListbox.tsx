import { Listbox } from "@headlessui/react";
import { useState } from "react";
import { usePopper } from "react-popper-2";

interface DefaultGenericListboxInterface {
    placeholder?: string;
    nullable?: boolean;
    choices: Choice[];
    currentValue?: Value;
    parentProps: React.ComponentProps<typeof Listbox>;
}

type Value = string;
type Choice = {
    value: Value;
    label: Value;
};

const getChoice = ({ choices, value }: { choices: Choice[]; value?: Value }) => {
    if (value == null) {
        return;
    }

    return choices.find((choice) => choice.value === value);
};

export default function DefaultGenericListbox({
    placeholder = "---",
    nullable = true,
    choices,
    currentValue,
    parentProps,
}: DefaultGenericListboxInterface) {
    const currentChoice = getChoice({ choices, value: currentValue });
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

    return (
        <Listbox {...parentProps}>
            <Listbox.Button
                className={`
                    mixin-button-base
                    theme-group-listbox-generic-white__button
                `}
                ref={setReferenceElement}
            >
                {currentChoice?.label ?? placeholder}
            </Listbox.Button>
            <Listbox.Options
                className={"theme-group-listbox-generic-white__menu"}
                ref={setPopperElement}
                style={{ ...popper.styles.popper, width: `${referenceElement?.offsetWidth}px` }}
                {...popper.attributes.popper}
            >
                {nullable && <Listbox.Option value={undefined}>{placeholder}</Listbox.Option>}
                {choices.map((choice, i) => (
                    <Listbox.Option
                        key={i}
                        value={choice.value}
                        className={`
                            mixin-button-base
                            theme-group-listbox-generic-white__item
                        `}
                    >
                        {choice.label}
                    </Listbox.Option>
                ))}
            </Listbox.Options>
        </Listbox>
    );
}
