import { XMarkIcon } from "@heroicons/react/24/solid";
import { useAbstractDialogContext, useQueryStringContext } from "../../../Context";
import AbstractDialog, { AbstractDialogPanel, AbstractDialogTrigger } from "../../elements/abstract/AbstractDialog";
import { Dialog } from "@headlessui/react";
import { FormCharFieldWidget } from "../../elements/forms/widgets/FormCharFieldWidget";
import FormField from "../../elements/forms/FormField";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ComponentProps, useRef, useState } from "react";
import { PaginatedQuery, ProductType } from "../../../Types";
import FormListboxWidget from "../../elements/forms/widgets/FormListBox";

export default function FilterOrderDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return <AbstractDialog Trigger={Trigger} Panel={FilterOrderDialog.Panel} />;
}

FilterOrderDialog.Panel = function Panel({ onClose }: ComponentProps<AbstractDialogPanel>) {
    return (
        <Dialog.Panel className="top-0 right-0 bottom-0 p-4 max-w-sm w-full max-h-full overflow-hidden bg-yellow-50 absolute text-gray-900 border-l border-gray-900 shadow">
            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                <XMarkIcon className="w-6 h-6" />
            </div>
            <FilterOrderForm />
        </Dialog.Panel>
    );
};

function FilterOrderForm() {
    /*
    
        TODO: 
            - filter by product name, requires to look up how to query the fk
            - status
            - client name
            - amount
            - total price (?) requires lookup

    */
    const queryClient = useQueryClient();
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
            action="/api/orders/list"
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
                                name="date_start"
                                label="Date Start"
                                widget={FormCharFieldWidget({
                                    type: "datetime-local",
                                })}
                            />
                        </div>
                        <div className="basis-1/2">
                            <FormField
                                name="date_end"
                                label="Date End"
                                widget={FormCharFieldWidget({
                                    type: "datetime-local",
                                })}
                            />
                        </div>
                    </div>
                    <FormField
                        name="status"
                        label="Status"
                        widget={FormListboxWidget({
                            choices: [
                                { label: "Pending", value: "pending" },
                                { label: "Shipping", value: "shipping" },
                                { label: "Completed", value: "completed" },
                                { label: "Pesumed Completed", value: "presumed_completed" },
                                { label: "Canceled", value: "canceled" },
                                { label: "Refunded", value: "refunded" },
                            ],
                            placeholder: "All",
                        })}
                    />
                    <FormField name="product_name" label="Product Name (Archived)" widget={FormCharFieldWidget({})} />
                    <FormField name="client_name" label="Client Name" widget={FormCharFieldWidget({})} />
                    <FormField name="amount" label="Amount" widget={FormCharFieldWidget({})} />
                </div>
            </div>
            <div className="flex flex-col gap-4 shrink-0">
                <button
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-yellow   
                        justify-center 
                    `}
                    type="submit"
                >
                    Filter
                </button>
                <hr className="h-0 w-full border-b-px border-gray-900"></hr>
                <button
                    type="reset"
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-white    
                        justify-center
                    `}
                >
                    Clear Filters
                </button>
            </div>
        </form>
    );
}
