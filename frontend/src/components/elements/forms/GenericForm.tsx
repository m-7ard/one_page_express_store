import React, { FormEvent, FormHTMLAttributes } from "react";
import { z } from "zod";
import { FormFieldInterface } from "./FormField";
import Fieldset from "./Fieldset";
import { createUseContext, useGenericForm } from "../../../utils";

export type FormErrors = z.typeToFlattenedError<Record<string, string>>;

interface GenericFormInterface extends FormHTMLAttributes<HTMLFormElement> {
    errors: FormErrors | undefined;
    setErrors: React.Dispatch<React.SetStateAction<FormErrors | undefined>>;
    hasCSRF?: boolean;
}

const [GenericFormContext, useGenericFormContext] = createUseContext<{
    errors?: FormErrors;
}>("useGenericFormContext has to be used within <GenericFormContext.Provider>");

export default function GenericForm({
    children,
    onSubmit,
    errors,
    setErrors,
    hasCSRF = false,
    ...props
}: React.PropsWithChildren<GenericFormInterface>) {
    return (
        <GenericFormContext.Provider value={{ errors }}>
            <form
                {...props}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (onSubmit == null) {
                        return;
                    }
                    return onSubmit(event);
                }}
            >
                {children}
            </form>
        </GenericFormContext.Provider>
    );
}

GenericForm.Fieldset = function _({ fields }: { fields: FormFieldInterface[] }) {
    const { errors } = useGenericFormContext();

    return <Fieldset fields={fields} errors={errors} />;
};
