import { DocumentTextIcon, ShoppingCartIcon, UserIcon } from "@heroicons/react/24/solid";
import UserPopover from "../../unlinked/UserPopover/UserPopover";
import { Updater, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppContext } from "../../../../Context";
import { CartType, FilterType, OrderType, UserType } from "../../../../Types";
import { Outlet } from "@tanstack/react-router";
import RouteNavigatorPopover from "./RouteNavigatorPopover/RouteNavigatorPopover";
import CartPopover from "../../unlinked/CartPopver/CartPopover";
import AbstractPopover from "../../../elements/abstract/AbstractPopover";
import React, { useCallback, useState } from "react";

export type UserRelatedData = {
    user: UserType;
    cart: CartType;
    orders: OrderType[];
} | null;

const rawFilters: { field_name: string; field_value: string }[] = JSON.parse(
    document.getElementById("filters")?.innerText ?? "[]",
);
const filters: FilterType[] = rawFilters.map(({ field_name, field_value }) => ({
    field_name,
    field_value: JSON.parse(field_value),
}));

export const USER_RELATED_DATA_QK = ["user_related_data"];

export default function App() {
    const userRelatedDataQuery = useQuery<UserRelatedData>({
        queryKey: USER_RELATED_DATA_QK,
        queryFn: async () => {
            const response = await fetch("/api/users/user/");
            if (response.ok) {
                return response.json();
            } else if (response.status === 403) {
                return null;
            }
            throw Error("Could not fetch initial user data from server");
        },
    });

    const queryClient = useQueryClient();

    const updateUserRelatedData = useCallback(
        <T extends keyof NonNullable<UserRelatedData>>(
            key: T,
            updater: (previous: NonNullable<UserRelatedData>[T]) => NonNullable<UserRelatedData>[T],
        ) => {
            queryClient.setQueryData<UserRelatedData>(USER_RELATED_DATA_QK, (previous) => {
                if (previous == null) return;
                const newData = { ...previous };
                newData[key] = updater(newData[key]);
                return newData;
            });
        },
        [queryClient],
    );

    if (!userRelatedDataQuery.isSuccess || userRelatedDataQuery.data == null) {
        return;
    }

    const { user, orders, cart } = userRelatedDataQuery.data;

    return (
        <AppContext.Provider value={{ user, filters, orders, cart, updateUserRelatedData }}>
            <div className="scroll-smooth h-screen flex flex-col bg-yellow-50 overflow-auto text-gray-900">
                <div
                    style={{ zIndex: 100 }}
                    className="px-4 py-2 text-gray-50 shadow z-50 bg-[#38382A] border-b border-[#23231A]"
                >
                    <div className="max-w-screen-lg w-full mx-auto relative flex flex-row items-center justify-between gap-8 ">
                        <div className="flex flex-row gap-4 items-center">
                            <RouteNavigatorPopover
                                Trigger={({ open }) => (
                                    <AbstractPopover.Trigger
                                        className={`
                                            header@app__button
                                            ${open && "header@app__button--active"}
                                        `}
                                    >
                                        <div className="hidden sm:block">Navigate</div>
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <DocumentTextIcon className="h-4 w-4" />
                                        </div>
                                    </AbstractPopover.Trigger>
                                )}
                                positioning={{ top: "100%", left: "0px" }}
                            />
                        </div>
                        <div className="flex flex-row gap-4 items-center">
                            <UserPopover
                                Trigger={({ open }) => (
                                    <AbstractPopover.Trigger
                                        className={`
                                            header@app__button
                                            ${open && "header@app__button--active"}
                                        `}
                                    >
                                        <div data-role="text">User</div>
                                        <div className="w-6 h-6 flex items-center justify-center">
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                    </AbstractPopover.Trigger>
                                )}
                                positioning={{ top: "100%", right: "0px" }}
                            />
                            {user != null && (
                                <CartPopover
                                    Trigger={({ open }) => (
                                        <AbstractPopover.Trigger
                                            className={`
                                                header@app__button
                                                ${open && "header@app__button--active"}
                                            `}
                                        >
                                            <div className="hidden sm:block">Cart</div>
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                <ShoppingCartIcon className="h-4 w-4" />
                                            </div>
                                        </AbstractPopover.Trigger>
                                    )}
                                    positioning={{ top: "100%", right: "0px" }}
                                />
                            )}
                        </div>
                    </div>
                </div>
                <Outlet />
            </div>
        </AppContext.Provider>
    );
}

App.BaseButtonClassNames =
    "flex gap-2 px-4 py-2 items-center leading-none content-box transition-colors cursor-pointer border select-none";

App.InputWrapperClassNames =
    "after:content-['.'] flex p-2 leading-none content-box border border-gray-900 text-gray-900 relative";
App.InputElementClassNames = "absolute inset-0 transition-colors p-2";

App.Divider = () => <hr className="h-0 w-full border-b-px border-gray-900"></hr>;

/*
const ButtonLike = classed(
    "div",
    "flex items-center leading-none content-box transition-colors cursor-pointer border select-none",
);
const BaseButton = classed("button", "gap-2 px-4 py-2");

App.HeaderButton = classed(
    "button",
    "border-[#23231A]",
    {
        variants: {
            state: {
                active: "bg-[#38382A] text-gray-200 shadow-none",
                neutral: "bg-[#464635] hover:bg-[#38382A] shadow hover:shadow-none text-gray-100 hover:text-gray-200",
            },
        },
    },
    ButtonLike,
    BaseButton,
);
*/
