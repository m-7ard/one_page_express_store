import React from "react";
import { type Widget } from "../../../utils";
import { FormErrors } from "./GenericForm";

export interface FormFieldInterface {
    name: string;
    label: string;
    errors?: FormErrors;
    widget: Widget;
    optional?: boolean;
    helperText?: string | React.ReactNode;
}

export default function FormField({
    name,
    label,
    widget,
    errors,
    helperText,
    optional = false,
}: FormFieldInterface) {
    const fieldErrors = errors?.fieldErrors?.[name];

    return (
        <div className="flex flex-col gap-1">
            <div className="text-sm text-gray-900 align-baseline">
                {`${label}`}{" "}
                {optional && (
                    <span className="text-xs text-gray-600">(Optional)</span>
                )}
            </div>
            {widget({ name })}
            {helperText != null && (
                <div className="text-xs text-gray-600">{helperText}</div>
            )}
            {fieldErrors != null && fieldErrors.length !== 0 && (
                <div className="mt-1 flex flex-col gap-y-1 p-1">
                    {fieldErrors.map((message, i) => (
                        <div
                            className="text-sm text-red-600 leading-none"
                            key={i}>
                            • {message}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
