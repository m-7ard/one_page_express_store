import { Link, useRouterState } from "@tanstack/react-router";
import AbstractPopover, { AbstractPopoverProps } from "../../../../elements/abstract/AbstractPopover";
import { useTooltipContextPositioning } from "../../../../../utils";

const CHOICES = [
    { label: "App", value: "/" },
    { label: "Dashboard", value: "/dashboard" },
];

export default function RouteNavigatorPopover({ Trigger, positioning }: Pick<AbstractPopoverProps, "Trigger" | "positioning">) {
    return <AbstractPopover positioning={positioning} Trigger={Trigger} Panel={RouteNavigatorPopover.Panel} />;
}

RouteNavigatorPopover.Panel = function Panel() {
    const router = useRouterState();
    const { positionFlag } = useTooltipContextPositioning();

    return (
        <AbstractPopover.Panel
            className={`theme-group-listbox-generic-white__menu w-48 fixed overflow ${positionFlag ? "visible" : "invisible"}`}
        >
            {({ close }) => (
                <>
                    {CHOICES.map(({ label, value }) => (
                        <Link
                            key={value}
                            to={value}
                            className={`
                                mixin-button-base
                                theme-group-listbox-generic-white__item    
                                ${router.location.pathname === value && "theme-group-listbox-generic-white__item--active"}
                            `}
                            onClick={() => close()}
                        >
                            {label}
                        </Link>
                    ))}
                </>
            )}
        </AbstractPopover.Panel>
    );
};
