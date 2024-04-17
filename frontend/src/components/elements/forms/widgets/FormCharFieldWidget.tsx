import { InputHTMLAttributes, useEffect, useState } from "react";
import { asWidget } from "../../../../utils";

interface FormCharFieldProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
    name: string;
    initial?: string | number;
    onChange?: (value?: string | number) => void;
}

function FormCharField({ initial, onChange, ...props }: FormCharFieldProps) {
    const [value, setValue] = useState(initial);

    useEffect(() => {
        if (onChange == null) {
            return;
        }

        onChange(value);
    }, [value, onChange]);

    return (
        <input
            className="w-full transition-colors py-2 px-2 leading-none border border-gray-900 text-gray-900
            bg-gray-100 focus:bg-gray-200"
            value={value ?? ""}
            onChange={({ target: { value } }) => {
                setValue(value);
            }}
            {...props}
        />
    );
}

export const FormCharFieldWidget = asWidget<FormCharFieldProps>(FormCharField, {});
