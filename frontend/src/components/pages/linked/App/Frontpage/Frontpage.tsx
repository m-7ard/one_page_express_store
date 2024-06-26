import { AdjustmentsHorizontalIcon, ArrowDownIcon, ChevronUpDownIcon, PlusIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import React, { useCallback, useRef } from "react";
import { QueryStringContext, useAppContext, useQueryStringContext } from "../../../../../Context";
import { PaginatedQuery, ProductType } from "../../../../../Types";
import FilterProductsDialog from "../../../unlinked/FilterProductsDialog";
import CreateProductDialog from "../../../unlinked/CreateProductDialog";
import Product from "./Product/Product";
import { Popover } from "@headlessui/react";
import SortProductsPopover from "../../../unlinked/SortProductsPopover";
import { PageNavigation } from "./PageNavigation/PageNavigation";

export default function Frontpage() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollToShop = useCallback(() => scrollRef.current?.scrollIntoView(), []);
    const { buildQueryString } = useQueryStringContext();

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

    const { user } = useAppContext();

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
                                            className={`
                                                mixin-button-like
                                                mixin-button-base
                                                theme-button-generic-white
                                            `}
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
                                    Trigger={() => (
                                        <Popover.Button
                                            className={`
                                                mixin-button-like
                                                mixin-button-base
                                                theme-button-generic-white
                                            `}
                                        >
                                            <div>Sort</div>
                                            <ChevronUpDownIcon className="w-4 h-4" />
                                        </Popover.Button>
                                    )}
                                />
                                <FilterProductsDialog
                                    Trigger={({ onClick }) => (
                                        <div
                                            className={`
                                                mixin-button-like
                                                mixin-button-base
                                                theme-button-generic-white
                                            `}
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
                        <PageNavigation queryKey={["products"]} />
                    </div>
                </div>
            </div>
        )
    );
}
