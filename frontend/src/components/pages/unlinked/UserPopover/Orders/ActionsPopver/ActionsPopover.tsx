import { useTooltipContextPositioning } from "../../../../../../utils";
import AbstractPopover, { AbstractPopoverProps } from "../../../../../elements/abstract/AbstractPopover";
import { useOrderContext } from "../_utils";

const CHOICES = {
    pending: [{ label: "Problem With Order" }, { label: "Cancel Order" }, { label: "Edit Order" }],
} as Record<string, { label: string }[]>;

export default function ActionsPopver({ Trigger, positioning }: Pick<AbstractPopoverProps, "Trigger" | "positioning">) {
    return <AbstractPopover positioning={positioning} Trigger={Trigger} Panel={ActionsPopver.Panel} />;
}

ActionsPopver.Panel = function Panel() {
    // const router = useRouterState();
    const { positionFlag } = useTooltipContextPositioning();
    const { order } = useOrderContext();

    return (
        <AbstractPopover.Panel
            className={`theme-group-listbox-generic-white__menu flex flex-col fixed overflow ${positionFlag ? "visible" : "invisible"}`}
        >
            {({ close }) => (
                <>
                    {CHOICES[order.status].map(({ label }) => (
                        <div
                            key={label}
                            className={`
                                mixin-button-like 
                                mixin-button-sm
                                theme-group-listbox-generic-white__item
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
