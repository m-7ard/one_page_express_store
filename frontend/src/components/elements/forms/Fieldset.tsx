import FormField, { FormFieldInterface } from "./FormField";
import { FormErrors } from "./GenericForm";

export default function Fieldset({
    fields,
    errors,
}: {
    fields: FormFieldInterface[];
    errors?: FormErrors;
}) {
    return fields.map(({ name, label, widget, helperText, optional }, i) => (
        <FormField
            key={name}
            name={name}
            label={label}
            widget={widget}
            helperText={helperText}
            optional={optional}
            errors={errors}
        />
    ));
}
