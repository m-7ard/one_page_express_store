import { FunnelIcon as SolidFunnelIcon } from "@heroicons/react/24/solid";
import { FunnelIcon as OutlineFunnelIcon } from "@heroicons/react/24/outline";
import { useQueryStringContext } from "../../../Context";
import { Popover } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AbstractPopover, { AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";

const CHOICES = [
    { label: "Newest", value: "newest" },
    { label: "Price - Ascending", value: "price_asc" },
    { label: "Price - Descending", value: "price_desc" },
    { label: "Name", value: "name" },
];

export default function SortProductsPopover({ Trigger }: { Trigger: AbstractPopoverTrigger }) {
    const queryClient = useQueryClient();
    const { sortParams, filterParams } = useQueryStringContext();
    const mutation = useMutation({
        mutationFn: async ({ value }: { value: string }) => {
            sortParams.current = { sort: value };
            const queryString = new URLSearchParams({ ...sortParams.current, ...filterParams.current }).toString();
            const response = await fetch(`/api/products/list?${queryString}`, {
                method: "GET",
            });
            if (response.ok) {
                return await response.json();
            }

            const errors = await response.json();
            return Promise.reject(errors);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["products"], () => data);
        },
    });

    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={({ setPopperElement, popper: { styles, attributes } }) => (
                <Popover.Panel 
                    className="flex flex-col mt-1 bg-gray-50 shadow divide-y divide-gray-900 border border-gray-900 z-50 max-w-96 ui-active:outline-none ui-open:outline-none"
                    ref={setPopperElement}
                    style={styles.popper}
                    {...attributes.popper}
                >
                    {CHOICES.map(({ label, value }) => (
                        <Popover.Button key={value}>
                            <div
                                className="flex justify-between items-center gap-4 leading-none transition-colors px-4 py-2 cursor-pointer bg-gray-100 hover:bg-gray-200 group ui-active:outline-none ui-open:outline-none"
                                key={value}
                                onClick={() => {
                                    mutation.mutate({ value });
                                    close();
                                }}
                            >
                                <div className="whitespace-nowrap">{label}</div>
                                <SolidFunnelIcon className="w-4 h-4 group-hover:block hidden" />
                                <OutlineFunnelIcon className="w-4 h-4 group-hover:hidden block" />
                            </div>
                        </Popover.Button>
                    ))}
                </Popover.Panel>
            )}
            options={{
                placement: "bottom-end",
                strategy: "fixed",
                modifiers: [
                    {
                        name: "preventOverflow",
                        options: {
                            altAxis: true,
                        },
                    },
                ],
            }}
        />
    );
}
