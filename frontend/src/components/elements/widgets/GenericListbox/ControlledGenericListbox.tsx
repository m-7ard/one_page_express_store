import { useState } from "react";
import DefaultGenericListbox from "./DefaultGenericListbox";
import { Choice, Value } from "./types";

export function ControlledGenericListbox({
    name,
    initial,
    choices,
    onChange,
    placeholder = "---",
    nullable = true,
}: {
    name: string;
    initial?: Value;
    choices: Choice[];
    onChange?: (value: Value) => void;
    placeholder?: string;
    nullable?: boolean;
}) {
    const [currentValue, setCurrentValue] = useState(initial);

    return (
        <DefaultGenericListbox
            choices={choices}
            currentValue={currentValue}
            placeholder={placeholder}
            nullable={nullable}
            parentProps={{
                name,
                defaultValue: currentValue,
                onChange: (value: Value) => {
                    setCurrentValue(value);
                    if (onChange == null) {
                        return;
                    }

                    onChange(value);
                },
            }}
        />
    );
}
