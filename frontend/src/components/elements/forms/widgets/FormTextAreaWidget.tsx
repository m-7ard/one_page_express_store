import React, { useEffect, type TextareaHTMLAttributes, useState } from "react";
import { asWidget } from "../../../../utils";

interface FormTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
    name: string;
    initial?: string | number;
    onChange?: (value?: string) => void;
}

export default function FormTextArea({ initial, onChange, ...props }: FormTextAreaProps): React.ReactNode {
    const [value, setValue] = useState(initial == null ? "" : `${initial}`);

    useEffect(() => {
        if (onChange == null) {
            return;
        }

        onChange();
    }, [value, onChange]);

    return (
        <div className="w-full border border-gray-900 text-gray-900 bg-gray-100">
            <textarea
                value={value ?? ""}
                className="block w-full transition-colors leading-none resize-none p-2 bg-gray-100 focus:bg-gray-200"
                {...props}
                onChange={({ target: { value } }) => {
                    setValue(value);
                }}
                rows={5}
            />
            {props.maxLength != null && (
                <div className="w-full bg-transparent border-t border-gray-900">
                    <div className="w-fit ml-auto px-2 text-xs border-l border-gray-900">
                        {value.length} / {props.maxLength}
                    </div>
                </div>
            )}
        </div>
    );
}

export const FormTextAreaWidget = asWidget<FormTextAreaProps>(FormTextArea, {});
