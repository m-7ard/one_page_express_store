import DefaultGenericListbox from "./DefaultGenericListbox";

type Value = string;
type Choice = {
    value: Value;
    label: Value;
};

export function UncontrolledGenericListbox({
    name,
    value,
    choices,
    onChange,
    placeholder = "---",
    nullable = true,
}: {
    name: string;
    value?: Value;
    choices: Choice[];
    onChange?: (value: Value) => void;
    placeholder?: string;
    nullable?: boolean;
}) {

    return (
        <DefaultGenericListbox
            choices={choices}
            currentValue={value}
            placeholder={placeholder}
            nullable={nullable}
            parentProps={{
                name,
                defaultValue: value,
                onChange: onChange,
            }}
        />
    );
}
