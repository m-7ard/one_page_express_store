import { Choice, GenericListbox, Value, getChoice } from "./units";

interface DefaultGenericListboxInterface {
    placeholder?: string;
    nullable?: boolean;
    choices: Choice[];
    currentValue?: Value;
    parentProps: Omit<React.ComponentProps<typeof GenericListbox>, "children">;
}

export default function DefaultGenericListbox({
    placeholder = "---",
    nullable = true,
    choices,
    currentValue,
    parentProps
}: DefaultGenericListboxInterface) {
    const currentChoice = getChoice({ choices, value: currentValue });

    return (
        <GenericListbox {...parentProps}>
            <GenericListbox.Button>{currentChoice?.label ?? placeholder}</GenericListbox.Button>
            <GenericListbox.Options>
                {nullable && (
                    <GenericListbox.Option value={undefined}>
                        {placeholder}
                    </GenericListbox.Option>
                )}
                {choices.map((choice, i) => (
                    <GenericListbox.Option key={i} value={choice.value}>
                        {choice.label}
                    </GenericListbox.Option>
                ))}
            </GenericListbox.Options>
        </GenericListbox>
    );
}
