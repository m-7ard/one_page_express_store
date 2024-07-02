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
        <div className={`w-full theme-input-generic-white mixin-char-input-like mixin-char-input-base`}>
            <input
                value={value ?? ""}
                onChange={({ target: { value } }) => {
                    setValue(value);
                }}
                {...props}
            />
            .
        </div>

    );
}

export const FormCharFieldWidget = asWidget<FormCharFieldProps>(FormCharField, {});
