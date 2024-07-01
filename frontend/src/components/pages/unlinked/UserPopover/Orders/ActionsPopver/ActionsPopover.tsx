import React, { ComponentProps, isValidElement } from "react";
import { useTooltipContextPositioning } from "../../../../../../utils";
import AbstractPopover, { AbstractPopoverProps } from "../../../../../elements/abstract/AbstractPopover";
import { useOrderContext } from "../_utils";
import AbstractDialog, {
    AbstractDialogPanel,
    AbstractDialogTrigger,
} from "../../../../../elements/abstract/AbstractDialog";
import { useMutation } from "@tanstack/react-query";
import { useAbstractDialogContext, useAppContext } from "../../../../../../Context";
import { OrderType } from "../../../../../../Types";
import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/solid";

export default function ActionsPopver({ Trigger, positioning }: Pick<AbstractPopoverProps, "Trigger" | "positioning">) {
    return <AbstractPopover positioning={positioning} Trigger={Trigger} Panel={ActionsPopver.Panel} />;
}

const GenericMenuButton = ({ color, label }: Record<string, string>) => (
    <div
        className={`
            mixin-button-like 
            mixin-button-sm
            theme-button-generic-${color}
            justify-center
        `}
    >
        {label}
    </div>
);

ActionsPopver.Panel = function Panel() {
    const { positionFlag } = useTooltipContextPositioning();
    const { order } = useOrderContext();
    let buttons: JSX.Element;

    if (order.status === "pending") {
        buttons = (
            <>
                {GenericMenuButton({ label: "Problem With Order", color: "yellow" })}
                {GenericMenuButton({ label: "Cancel Order", color: "white" })}
                {GenericMenuButton({ label: "Edit Order", color: "white" })}
            </>
        );
    } else if (order.status === "shipping") {
        buttons = (
            <>
                <MarkOrderCompleteDialog
                    Trigger={({ onClick }) => (
                        <button
                            className={`
                            mixin-button-like
                            mixin-button-sm
                            theme-button-generic-yellow
                            justify-center
                        `}
                            onClick={onClick}
                        >
                            Mark Complete
                        </button>
                    )}
                />
                {GenericMenuButton({ label: "Problem With Order", color: "yellow" })}
                {GenericMenuButton({ label: "Shipping Info", color: "yellow" })}
            </>
        );
    } else if (order.status === "completed" || order.status === "presumed_completed") {
        buttons = (
            <>
                {GenericMenuButton({ label: "Problem With Order", color: "yellow" })}
                {GenericMenuButton({ label: "Shipping Info", color: "yellow" })}
            </>
        );
    }

    if (buttons == null) {
        return;
    }

    return (
        <AbstractPopover.Panel
            className={`theme-group-listbox-generic-white__menu gap-1 p-2 z-50 shadow-lg flex flex-col fixed overflow ${positionFlag ? "visible" : "invisible"}`}
        >
            {buttons}
        </AbstractPopover.Panel>
    );
};

function MarkOrderCompleteDialog({ Trigger }: { Trigger: AbstractDialogTrigger }) {
    return <AbstractDialog Trigger={Trigger} Panel={MarkOrderCompleteDialog.Panel} />;
}

MarkOrderCompleteDialog.Panel = function Panel({ onClose }: ComponentProps<AbstractDialogPanel>) {
    const { order } = useOrderContext();
    const { updateUserRelatedData } = useAppContext();
    const mutation = useMutation({
        mutationFn: async () => {
            const response = await fetch(`/api/orders/${order.id}/confirm_completed`, {
                method: "PUT",
            });
            if (response.ok) {
                return await response.json();
            }
        },
        onSuccess: (data: OrderType) => {
            updateUserRelatedData("orders", (previous) =>
                previous.map((otherOrder) => (otherOrder.id === data.id ? data : otherOrder)),
            );
            onClose();
        },
    });

    return (
        <Dialog.Panel className="m-auto p-4 max-w-prose w-full max-h-full overflow-hidden bg-yellow-50 relative text-gray-900  border border-gray-900 shadow">
            <div className="absolute right-4 top-4 cursor-pointer" onClick={onClose}>
                <XMarkIcon className="w-6 h-6" />
            </div>
            <form
                className="flex flex-col gap-4 overflow-hidden"
                method="POST"
                action="/api/orders/confirm_shipping"
                onSubmit={(event) => {
                    event.preventDefault();
                    mutation.mutate();
                }}
            >
                <div className="text-xl font-bold">Mark "{order.archive.product.name}" As Complete</div>
                <hr className="app__x-divider"></hr>
                <button
                    className={`
                        mixin-button-like
                        mixin-button-base
                        theme-button-generic-yellow
                        justify-center   
                        ml-auto 
                    `}
                >
                    Mark Complete
                </button>
            </form>
        </Dialog.Panel>
    );
};
