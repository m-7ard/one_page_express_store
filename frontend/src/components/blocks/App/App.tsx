import { DocumentTextIcon, ShoppingCartIcon, UserIcon } from "@heroicons/react/24/solid";
import UserPopover from "../UserPopover/UserPopover";
import { useQuery } from "@tanstack/react-query";
import React, { Fragment, useRef } from "react";
import { AppContext } from "../../../Context";
import { FilterType, PaginatedQuery, ProductType, User } from "../../../Types";
import { Outlet } from "@tanstack/react-router";
import { Popover } from "@headlessui/react";
import RouteNavigator from "./RouteNavigator";

const rawFilters: { field_name: string; field_value: string }[] = JSON.parse(
    document.getElementById("filters")?.innerText ?? "[]",
);
const filters: FilterType[] = rawFilters.map(({ field_name, field_value }) => ({
    field_name,
    field_value: JSON.parse(field_value),
}));

export default function App() {
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

    return (
        userQuery.isSuccess && (
            <AppContext.Provider value={{ user: userQuery.data, filters }}>
                <div className="scroll-smooth h-screen flex flex-col bg-yellow-50 overflow-auto text-gray-900">
                    <div
                        style={{ zIndex: 100 }}
                        className="flex flex-row items-center relative justify-between gap-8 px-4 py-2 text-gray-50 shadow z-50 bg-[#38382A] border-b border-[#23231A]"
                    >
                        <div className="flex flex-row gap-4 items-center">
                            <RouteNavigator
                                Trigger={({ setReferenceElement, open }) => (
                                    <Popover.Button ref={setReferenceElement} as="div">
                                        <div className={getGreenSurfaceButtonClassName({ active: open })}>
                                            <div className="hidden sm:block">Navigate</div>
                                            <DocumentTextIcon className="h-4 w-4" />
                                        </div>
                                    </Popover.Button>
                                )}
                            />
                        </div>
                        <div className="flex flex-row gap-4 items-center">
                            <UserPopover
                                Trigger={({ setReferenceElement, open }) => (
                                    <Popover.Button ref={setReferenceElement} as={Fragment}>
                                        <div className={getGreenSurfaceButtonClassName({ active: open })}>
                                            <div className="hidden sm:block">User</div>
                                            <UserIcon className="h-4 w-4" />
                                        </div>
                                    </Popover.Button>
                                )}
                            />
                            <div className={getGreenSurfaceButtonClassName({ active: false })}>
                                <div className="hidden sm:block">Cart</div>
                                <ShoppingCartIcon className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                    <Outlet />
                </div>
            </AppContext.Provider>
        )
    );
}

App.BaseButtonClassNames =
    "flex gap-2 px-4 py-2 items-center leading-none content-box transition-colors cursor-pointer border select-none";

App.InputWrapperClassNames =
    "after:content-['.'] flex p-2 leading-none content-box border border-gray-900 text-gray-900 relative";
App.InputElementClassNames = "absolute inset-0 transition-colors p-2";

App.Divider = () => <hr className="h-0 w-full border-b-px border-gray-900"></hr>;

export function getWhiteSurfaceButtonClassName({ active = false }: { active?: boolean }) {
    return [
        App.BaseButtonClassNames,
        "border-gray-900 text-gray-900",
        active ? "bg-gray-200" : "bg-gray-100 hover:bg-gray-200",
    ].join(" ");
}

export function getGreenSurfaceButtonClassName({ active = false }: { active?: boolean }) {
    return [
        App.BaseButtonClassNames,
        "border-[#23231A]",
        active
            ? "bg-[#38382A] text-gray-200 shadow-none"
            : "bg-[#464635] hover:bg-[#38382A] shadow hover:shadow-none text-gray-100 hover:text-gray-200",
    ].join(" ");
}
