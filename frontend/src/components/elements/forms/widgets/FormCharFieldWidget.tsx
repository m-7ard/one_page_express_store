import { InputHTMLAttributes, useEffect, useState } from "react";
import { asWidget } from "../../../../utils";
import App from "../../../blocks/Frontpage/Frontpage";

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
        <div className={`w-full ${App.InputWrapperClassNames}`}>
            <input
                className={`${App.InputElementClassNames} bg-gray-100 focus:bg-gray-200`}
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
