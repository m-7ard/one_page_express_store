import React from "react";
import { useAppContext } from "../../../../Context";
import { CartType } from "../../../../Types";
import {
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
} from "@tanstack/react-router";
import {
    useTooltipContextPositioning,
} from "../../../../utils";
import CartItems from "./CartItems/CartItems";
import { Checkout } from "./Checkout/Checkout";
import AbstractPopover, {
    AbstractPopoverProps,
} from "../../../elements/abstract/AbstractPopover";
import { CartWrapper } from "./_utils";


const rootRoute = createRootRoute({
    component: () => <Outlet />,
});

const cartItemsRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: CartItems,
});

const checkoutRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/checkout",
    component: Checkout,
});

const routeTree = rootRoute.addChildren([cartItemsRoute, checkoutRoute]);

export default function CartPopover({ Trigger, positioning }: Pick<AbstractPopoverProps, "Trigger" | "positioning">) {
    return (
        <CartWrapper>
            <AbstractPopover positioning={positioning} Trigger={Trigger} Panel={CartPopover.Panel} />
        </CartWrapper>
    );
}

CartPopover.Panel = function Panel() {
    const router = createRouter({
        routeTree,
        history: createMemoryHistory({ initialEntries: ["/"] }),
    });

    const { positionFlag, resizeWindow } = useTooltipContextPositioning();
    router.subscribe('onResolved', resizeWindow);

    return (
        <AbstractPopover.Panel
            className={`generic-panel fixed overflow-auto ${positionFlag ? "visible" : "invisible"}`}
        >
            <RouterProvider router={router} />
        </AbstractPopover.Panel>
    );
};
