import { FunnelIcon as SolidFunnelIcon } from "@heroicons/react/24/solid";
import { useQueryStringContext } from "../../../Context";
import { Popover } from "@headlessui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AbstractPopover, { AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";
import { PaginatedQuery, ProductType } from "../../../Types";
import App from "../linked/App/App";

const CHOICES = [
    { label: "Newest", value: "newest" },
    { label: "Price - Ascending", value: "price_asc" },
    { label: "Price - Descending", value: "price_desc" },
    { label: "Name", value: "name" },
];

export default function SortProductsPopover({ Trigger }: { Trigger: AbstractPopoverTrigger }) {
    const queryClient = useQueryClient();
    const { sortParams, filterParams, page_index } = useQueryStringContext();
    const mutation = useMutation({
        mutationFn: async ({ value }: { value: string }) => {
            sortParams.current = { sort: value };
            const queryString = new URLSearchParams({ ...sortParams.current, ...filterParams.current }).toString();
            const response = await fetch(`/api/products/list?${queryString}`, {
                method: "GET",
            });
            if (response.ok) {
                const data: PaginatedQuery<ProductType> = await response.json();
                return data;
            }

            const errors = await response.json();
            return Promise.reject(errors);
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["products"], () => data);
            page_index.current = 1;
        },
    });

    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={({ setTargetElement: setPopperElement }) => (
                <Popover.Panel 
                    className="flex flex-col mt-1 bg-gray-50 shadow divide-y divide-gray-900 border border-gray-900 z-50 max-w-96 ui-active:outline-none ui-open:outline-none"
                    ref={setPopperElement}
                >
                    {CHOICES.map(({ label, value }) => (
                        <Popover.Button key={value}>
                            <div
                                className={[
                                    "group ui-active:outline-none ui-open:outline-none",
                                    "justify-between",
                                    App.BaseButtonClassNames.replace("border", ""),
                                    ...([sortParams.current.sort === value 
                                        ? "bg-gray-200"
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    ])
                                ].join(" ")}
                                key={value}
                                onClick={() => {
                                    mutation.mutate({ value });
                                }}
                            >
                                <div className="whitespace-nowrap">{label}</div>
                                <SolidFunnelIcon 
                                    className={[
                                        "w-4 h-4 group-hover:opacity-100",
                                        ...([sortParams.current.sort === value 
                                            ? "opacity-100"
                                            : 'opacity-0'
                                        ])
                                    ].join(" ")} 
                                />
                            </div>
                        </Popover.Button>
                    ))}
                </Popover.Panel>
            )}
        />
    );
}
