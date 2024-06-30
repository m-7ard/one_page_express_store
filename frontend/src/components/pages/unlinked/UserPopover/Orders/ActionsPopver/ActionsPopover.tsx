import { useTooltipContextPositioning } from "../../../../../../utils";
import AbstractPopover, { AbstractPopoverProps } from "../../../../../elements/abstract/AbstractPopover";
import { useOrderContext } from "../_utils";

const CHOICES = {
    pending: [
        { label: "Problem With Order", color: "yellow" },
        { label: "Cancel Order", color: "white" },
        { label: "Edit Order", color: "white" },
    ],
    shipping: [
        { label: "Problem With Order", color: "yellow" },
        { label: "Shipping Info", color: "yellow" },
    ],
} as Record<string, { label: string; color: string }[]>;

export default function ActionsPopver({ Trigger, positioning }: Pick<AbstractPopoverProps, "Trigger" | "positioning">) {
    return <AbstractPopover positioning={positioning} Trigger={Trigger} Panel={ActionsPopver.Panel} />;
}

ActionsPopver.Panel = function Panel() {
    // const router = useRouterState();
    const { positionFlag } = useTooltipContextPositioning();
    const { order } = useOrderContext();

    return (
        <AbstractPopover.Panel
            className={`theme-group-listbox-generic-white__menu gap-1 p-2 z-50 shadow-lg flex flex-col fixed overflow ${positionFlag ? "visible" : "invisible"}`}
        >
            {({ close }) => (
                <>
                    {CHOICES[order.status].map(({ label, color }) => (
                        <div
                            key={label}
                            className={`
                                mixin-button-like 
                                mixin-button-sm
                                theme-button-generic-${color}
                                justify-center
                            `}
                            onClick={() => close()}
                        >
                            {label}
                        </div>
                    ))}
                </>
            )}
        </AbstractPopover.Panel>
    );
};
