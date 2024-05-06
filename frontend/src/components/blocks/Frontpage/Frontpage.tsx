import {
    AdjustmentsHorizontalIcon,
    ArrowDownIcon,
    ChevronUpDownIcon,
    PlusIcon,
    ShoppingCartIcon,
    UserIcon,
} from "@heroicons/react/24/solid";
import UserPopover from "../UserPopover/UserPopover";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { Fragment, useCallback, useRef } from "react";
import { QueryStringContext, useQueryStringContext } from "../../../Context";
import { PaginatedQuery, ProductType, User } from "../../../Types";
import FilterProductsDialog from "./Product/FilterProductsDialog";
import CreateProductDialog from "./Product/CreateProductDialog";
import Product from "./Product/Product";
import { Popover } from "@headlessui/react";
import SortProductsPopover from "./Product/SortProductsPopover";
import { PageNavigation } from "./PageNavigation";

export function QueryStringProvider({ children }: React.PropsWithChildren) {
    const filterParams = useRef<Record<string, string>>({});
    const sortParams = useRef<Record<string, string>>({});
    const page_index = useRef(1);
    const buildQueryString = () =>
        new URLSearchParams({
            ...sortParams.current,
            ...filterParams.current,
            page_index: `${page_index.current}`,
        }).toString();

    return (
        <QueryStringContext.Provider value={{ filterParams, sortParams, page_index, buildQueryString }}>
            {children}
        </QueryStringContext.Provider>
    );
}

export default function Frontpage() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollToShop = useCallback(() => scrollRef.current?.scrollIntoView(), []);
    const { buildQueryString } = useQueryStringContext();
    const queryClient = useQueryClient();

    const productsQuery = useQuery<PaginatedQuery<ProductType>>({
        queryKey: ["products"],
        throwOnError: true,
        queryFn: async () => {
            const response = await fetch(`/api/products/list?${buildQueryString()}`, {
                method: "GET",
            });
            if (response.ok) {
                return response.json();
            }
        },
    });

    const user = queryClient.getQueryData<User>(["user"]);

    return (
        productsQuery.isSuccess && (
            <div className="h-screen flex flex-col bg-yellow-50 text-gray-900">
                <div className="w-full relative select-none	" style={{ backgroundColor: "rgb(223, 220, 167)" }}>
                    <div className="bg-black/75 z-10 absolute inset-0"></div>
                    <img
                        className="absolute w-full h-full object-cover sm:object-contain"
                        src={"static/images/header.jpg"}
                        alt="prop"
                    ></img>
                    <div className="mx-auto flex flex-col items-center text-center gap-4 p-4 h-96 w-full max-w-prose text-white relative z-20">
                        <div className="text-4xl font-black">Find the Perfect Blend You've Been Looking for.</div>
                        <div className="text-lg text-bold text-gray-300">Explore The Finest Curated Selection</div>
                        <div
                            className="mt-auto transition-colors bg-yellow-400 hover:bg-yellow-500 px-4 py-2 text-xl font-bold text-gray-900 cursor-pointer"
                            onClick={scrollToShop}
                        >
                            Shop Now
                        </div>
                        <ArrowDownIcon className="h-12 w-12 cursor-pointer" onClick={scrollToShop} />
                    </div>
                </div>
                <div className="flex flex-row gap-4 p-4" ref={scrollRef}>
                    <div className="flex flex-col grow gap-4 max-w-screen-lg w-full mx-auto">
                        <div className="text-xs">
                            Showing {productsQuery.data.results.length}/{productsQuery.data.count} Results
                        </div>
                        <hr className="h-0 border-t border-gray-900"></hr>
                        <div className="flex flex-row items-center justify-between gap-4 text-gray-900 flex-wrap">
                            {(user != null && user.is_admin && (
                                <CreateProductDialog
                                    Trigger={({ onClick }) => (
                                        <div
                                            className={`${Frontpage.BaseButtonClassNames} bg-gray-100 hover:bg-gray-200`}
                                            onClick={onClick}
                                        >
                                            <div>Add</div>
                                            <PlusIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                />
                            )) || <div></div>}
                            <div className="flex flex-row items-center gap-4 text-gray-900">
                                <SortProductsPopover
                                    Trigger={({ setReferenceElement }) => (
                                        <Popover.Button
                                            className={`${Frontpage.BaseButtonClassNames} bg-gray-100 hover:bg-gray-200`}
                                            ref={setReferenceElement}
                                        >
                                            <div>Sort</div>
                                            <ChevronUpDownIcon className="w-4 h-4" />
                                        </Popover.Button>
                                    )}
                                />
                                <FilterProductsDialog
                                    Trigger={({ onClick }) => (
                                        <div
                                            className={`${Frontpage.BaseButtonClassNames} bg-gray-100 hover:bg-gray-200`}
                                            onClick={onClick}
                                        >
                                            <div>Filter</div>
                                            <AdjustmentsHorizontalIcon className="w-4 h-4" />
                                        </div>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 border-b border-t border-gray-900 overflow-hidden">
                            {productsQuery.data.results.map(
                                ({ id, name, description, price, kind, images, specification }) => {
                                    return (
                                        <Product
                                            id={id}
                                            name={name}
                                            description={description}
                                            price={price}
                                            kind={kind}
                                            images={images}
                                            specification={specification}
                                        />
                                    );
                                },
                            )}
                        </div>
                        <PageNavigation />
                    </div>
                </div>
            </div>
        )
    );
}

Frontpage.BaseButtonClassNames =
    "flex gap-2 px-4 py-2 items-center leading-none content-box transition-colors cursor-pointer border border-gray-900 select-none";

Frontpage.InputWrapperClassNames =
    "after:content-['.'] flex p-2 leading-none content-box border border-gray-900 text-gray-900 relative";
Frontpage.InputElementClassNames = "absolute inset-0 transition-colors p-2";

Frontpage.Divider = () => <hr className="h-0 w-full border-b-px border-gray-900"></hr>;
