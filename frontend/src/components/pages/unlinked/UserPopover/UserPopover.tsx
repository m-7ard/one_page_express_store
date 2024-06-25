import React, { useRef } from "react";
import { Popover } from "@headlessui/react";
import AbstractPopover, {
    AbstractPopoverPanel,
    AbstractPopoverProps,
    AbstractPopoverTrigger,
} from "../../../elements/abstract/AbstractPopover";
import {
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
} from "@tanstack/react-router";
import { useAppContext } from "../../../../Context";
import { FormErrors } from "../../../elements/forms/GenericForm";
import Login from "./Login/Login";
import Register from "./Register/Register";
import { AuthWrapper } from "./_utils";
import Profile from "./Profile/Profile";
import { useTooltipContextPositioning } from "../../../../utils";
import Orders from "./Orders/Orders";

const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const loginRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/login",
    component: Login,
});

const registerRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/register",
    component: Register,
});

const profileRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/profile",
    component: () => (
        <AuthWrapper>
            <Profile />
        </AuthWrapper>
    ),
});

const ordersRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/orders",
    component: () => (
        <AuthWrapper>
            <Orders />
        </AuthWrapper>
    ),
});

const routeTree = rootRoute.addChildren([loginRoute, registerRoute, profileRoute, ordersRoute]);

export default function UserPopover({ Trigger, positioning }: Pick<AbstractPopoverProps, "Trigger" | "positioning">) {
    return <AbstractPopover positioning={positioning} Trigger={Trigger} Panel={UserPopover.Panel} />;
}

UserPopover.Panel = function Panel() {
    const { user } = useAppContext();
    const routerRef = useRef(
        createRouter({
            routeTree,
            history: createMemoryHistory({ initialEntries: [user == null ? "/login" : "/profile"] }),
        }),
    );

    const { positionFlag } = useTooltipContextPositioning();

    return (
        <AbstractPopover.Panel
            className={`z-50 generic-panel fixed overflow-auto ${positionFlag ? "visible" : "invisible"}`}
        >
            <RouterProvider router={routerRef.current} />
        </AbstractPopover.Panel>
    );
};

UserPopover.FormError = ({ errors }: { errors?: FormErrors }) => {
    return (
        errors?.formErrors != null &&
        errors?.formErrors.length !== 0 && (
            <div className="border border-red-400 w-full py-2 px-4 flex flex-col gap-2">
                <div className="text-sm font-medium text-gray-900 leading-none">Form</div>
                <div className="flex flex-col gap-1">
                    {errors.formErrors.map((message, i) => (
                        <div className="text-sm text-gray-900 leading-none flex items-center gap-2" key={i}>
                            <div>•</div>
                            <div>{message}</div>
                        </div>
                    ))}
                </div>
            </div>
        )
    );
};
