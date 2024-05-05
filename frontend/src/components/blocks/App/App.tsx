import {
    AdjustmentsHorizontalIcon,
    ArrowDownIcon,
    ChevronUpDownIcon,
    PlusIcon,
    ShoppingCartIcon,
    UserIcon,
} from "@heroicons/react/24/solid";
import UserPopover from "../UserPopover/UserPopover";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import React, { Fragment, useCallback, useRef } from "react";
import { AppContext, QueryStringContext, useQueryStringContext } from "../../../Context";
import { FilterType, PaginatedQuery, ProductType, User } from "../../../Types";
import FilterProductsDialog from "../FilterProducts/FilterProductsDialog";
import CreateProductDialog from "../Product/create/CreateProductDialog";
import Product from "./Product/Product";
import { Popover } from "@headlessui/react";
import SortProductsPopover from "../SortProductsPopover/SortProductsPopover";
import { FormListBox } from "../../elements/forms/widgets/FormListBox";
import { PageNavigation } from "./PageNavigation";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});
const rawFilters: { field_name: string; field_value: string }[] = JSON.parse(
    document.getElementById("filters")?.innerText ?? "[]",
);
const filters: FilterType[] = rawFilters.map(({ field_name, field_value }) => ({
    field_name,
    field_value: JSON.parse(field_value),
}));

export function Providers({ children }: React.PropsWithChildren) {
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
        <QueryClientProvider client={queryClient}>
            <QueryStringContext.Provider value={{ filterParams, sortParams, page_index, buildQueryString }}>
                {children}
            </QueryStringContext.Provider>
        </QueryClientProvider>
    );
}

export default function App() {
    const scrollRef = useRef<HTMLDivElement>(null);
    const scrollToShop = useCallback(() => scrollRef.current?.scrollIntoView(), []);
    const { page_index, buildQueryString } = useQueryStringContext();

    const userQuery = useQuery<User>({
        queryKey: ["user"],
        queryFn: async () => {
            const response = await fetch("/api/users/user/");
            if (response.ok) {
                return response.json();
            } else if (response.status === 403) {
                return null;
            }
            throw Error("Could not fetch user from server");
        },
    });

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

    return (
        userQuery.isSuccess &&
        productsQuery.isSuccess && (
            <AppContext.Provider value={{ user: userQuery.data, filters }}>
                <div className="scroll-smooth h-screen flex flex-col bg-yellow-50 overflow-auto text-gray-900">
                    <div className="flex flex-row items-center relative justify-between gap-8 px-4 py-2 text-gray-50 shadow z-50 bg-[#38382A] border-b border-[#23231A]">
                        <div></div>
                        <div className="flex flex-row gap-4 items-center">
                            <UserPopover
                                Trigger={({ setReferenceElement, open }) => (
                                    <Popover.Button ref={setReferenceElement} as={Fragment}>
                                        <div
                                            className={[
                                                App.BaseButtonClassNames,
                                                "border shadow hover:shadow-none border-[#23231A] hover:bg-[#38382A] hover:text-gray-200",
                                                open === true ? 'bg-[#38382A] text-gray-200' : 'bg-[#464635]'
                                            ].join(" ")}
                                        >
                                            <div>User</div>
                                            <UserIcon className="h-5 w-5" />
                                        </div>
                                    </Popover.Button>
                                )}
                            />
                            <div
                                className={[
                                    App.BaseButtonClassNames,
                                    "border shadow hover:shadow-none border-[#23231A] hover:bg-[#38382A] hover:text-gray-200",
                                    'bg-[#464635]'
                                ].join(" ")}
                            >
                                <div>Cart</div>
                                <ShoppingCartIcon className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
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
                                {(userQuery.data != null && userQuery.data.is_admin && (
                                    <CreateProductDialog
                                        Trigger={({ onClick }) => (
                                            <div
                                                className={`${App.BaseButtonClassNames} bg-gray-100 hover:bg-gray-200`}
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
                                                className={`${App.BaseButtonClassNames} bg-gray-100 hover:bg-gray-200`}
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
                                                className={`${App.BaseButtonClassNames} bg-gray-100 hover:bg-gray-200`}
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
            </AppContext.Provider>
        )
    );
}

App.BaseButtonClassNames =
    "flex gap-2 px-4 py-2 items-center leading-none content-box transition-colors cursor-pointer border border-gray-900 select-none";

App.InputWrapperClassNames =
    "after:content-['.'] flex p-2 leading-none content-box border border-gray-900 text-gray-900 relative";
App.InputElementClassNames = "absolute inset-0 transition-colors p-2";

App.Divider = () => <hr className="h-0 w-full border-b-px border-gray-900"></hr>;
