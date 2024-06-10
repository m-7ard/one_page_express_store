import { asWidget } from "../../../../utils";
import { ControlledGenericListbox } from "../../widgets/GenericListbox/ControlledGenericListbox";
import { Choice, Value } from "../../widgets/GenericListbox/types";

export function FormListBox({
    name,
    initial,
    choices,
    onChange,
    placeholder = "---",
    nullable = true,
}: {
    initial?: Value;
    choices: Choice[];
    name: string;
    onChange?: (value?: Value) => void;
    placeholder?: string;
    nullable?: boolean;
}) {
    return (
        <ControlledGenericListbox
            initial={initial}
            name={name}
            choices={choices}
            onChange={onChange}
            placeholder={placeholder}
            nullable={nullable}
        />
    );
}

const FormListboxWidget = asWidget(ControlledGenericListbox, {});
export default FormListboxWidget;
