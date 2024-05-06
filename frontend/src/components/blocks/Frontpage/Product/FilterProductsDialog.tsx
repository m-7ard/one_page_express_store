import { XMarkIcon } from "@heroicons/react/24/solid";
import { useAbstractDialogContext, useAppContext, useQueryStringContext } from "../../../../Context";
import AbstractDialog, { AbstractDialogTrigger } from "../../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import Fieldset from "../../../elements/forms/Fieldset";
import FormListBoxWidget from "../../../elements/forms/widgets/FormListBox";
import { FormCharFieldWidget } from "../../../elements/forms/widgets/FormCharFieldWidget";
import FormField from "../../../elements/forms/FormField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { PaginatedQuery, ProductType } from "../../../../Types";
import App from "../Frontpage";

export default function FilterProductsDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return (
        <AbstractDialog
            Trigger={Trigger}
            Panel={({ onClose }) => (
                <Dialog.Panel className="top-0 right-0 bottom-0 p-4 max-w-sm w-full max-h-full overflow-hidden bg-yellow-50 absolute text-gray-900 border-l border-gray-900 shadow">
                    <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                        <XMarkIcon className="w-6 h-6" />
                    </div>
                    <FilterProductsForm />
                </Dialog.Panel>
            )}
        />
    );
}

function FilterProductsForm() {
    const queryClient = useQueryClient();
    const { filters } = useAppContext();
    const { setOpen } = useAbstractDialogContext();
    const { sortParams, filterParams } = useQueryStringContext();

    const formRef = useRef<HTMLFormElement>(null);
    const [formKey, setFormKey] = useState(() => window.crypto.randomUUID());
    const [choices, setChoices] = useState<Record<string, string | undefined>>(filterParams.current);

    const mutation = useMutation({
        mutationFn: async ({ form }: { form: HTMLFormElement }) => {
            const formData = new FormData(form);
            const queryParams = Object.fromEntries(formData.entries()) as Record<string, string>;
            filterParams.current = queryParams;
            const queryString = new URLSearchParams({ ...sortParams.current, ...filterParams.current }).toString();
            const response = await fetch(`/api/products/list?${queryString}`, {
                method: "GET",
            });
            if (response.ok) {
                const data: PaginatedQuery<ProductType> = await response.json();
                return data;
            }

            return Promise.reject();
        },
        onSuccess: (data) => {
            queryClient.setQueriesData({ queryKey: ["products"] }, () => data);
            setOpen(false);
        },
    });

    return (
        <form
            key={formKey}
            ref={formRef}
            className="flex flex-col gap-4 overflow-hidden max-h-full"
            method="GET"
            action="/api/products/list"
            onSubmit={(event) => {
                event.preventDefault();
                mutation.mutate({ form: event.currentTarget });
            }}
            onReset={() => {
                setChoices({});
                setFormKey(window.crypto.randomUUID());
            }}
        >
            <div className="text-xl font-bold">Filter Products</div>
            <hr className="h-0 w-full border-b-px border-gray-900"></hr>
            <div className="flex grow overflow-hidden">
                <div className="flex flex-col gap-4 max-h-full w-full overflow-auto">
                    <div className="flex flex-row gap-4">
                        <div className="basis-1/2">
                            <FormField
                                name="min_price"
                                label="Min Price"
                                widget={FormCharFieldWidget({
                                    initial: choices?.min_price,
                                })}
                            />
                        </div>
                        <div className="basis-1/2">
                            <FormField
                                name="max_price"
                                label="Max Price"
                                widget={FormCharFieldWidget({
                                    inputMode: "numeric",
                                    initial: choices?.max_price,
                                })}
                            />
                        </div>
                    </div>
                    <Fieldset
                        fields={filters.map(({ field_name, field_value }) => {
                            return {
                                name: field_name,
                                label: field_name,
                                widget: FormListBoxWidget({
                                    choices: field_value.map((value) => ({ label: value, value: value })),
                                    initial: choices?.[field_name],
                                }),
                            };
                        })}
                    />
                </div>
            </div>
            <div className="flex flex-col gap-4 shrink-0">
                <button
                    className={`${App.BaseButtonClassNames} justify-center bg-yellow-300 hover:bg-yellow-400`}
                    type="submit"
                >
                    Filter
                </button>
                <hr className="h-0 w-full border-b-px border-gray-900"></hr>
                <button
                    type="reset"
                    className={`${App.BaseButtonClassNames} justify-center bg-gray-300 hover:bg-gray-400`}
                >
                    Clear Filters
                </button>
            </div>
        </form>
    );
}
