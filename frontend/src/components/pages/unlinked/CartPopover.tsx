
import { classed } from "@tw-classed/react";
import AbstractPopover, { AbstractPopoverPanel, AbstractPopoverTrigger } from "../../elements/abstract/AbstractPopover";
import { Popover } from "@headlessui/react";
import React from "react";

export default function CartPopover({ Trigger }: { Trigger: AbstractPopoverTrigger, open?: boolean }) {
    return (
        <AbstractPopover
            Trigger={Trigger}
            Panel={CartPopover.Panel}
            options={{
                placement: "bottom-end",
                strategy: "fixed",
                modifiers: [
                    {
                        name: "preventOverflow",
                        options: {
                            altAxis: true,
                        },
                    },
                ],
            }}
        />
    );
}

const GenericPanel = classed("div", "bg-gray-50 text-gray-900 p-4 mt-1 border border-gray-900 w-full max-w-72 shadow")

CartPopover.Panel = function CartPopover ({
    setPopperElement,
    popper: { styles, attributes },
}: React.ComponentProps<AbstractPopoverPanel>) {
    return (
        <Popover.Panel
            ref={setPopperElement}
            style={styles.popper}
            {...attributes.popper}
            as={"div"}
            className={"generic-panel"}
        >
            <div className="generic-panel__body">
                <div className="generic-panel__title">Login</div>
                <hr className="app__x-divider"></hr>
                <div className="flex flex-col gap-1 w-full text-gray-900">
                    <div className="flex flex-row gap-2">
                        <div className="bg-gray-600 w-24 h-24 relative border border-gray-900 shrink-0">
                            <img
                                src={`/media/EBWr20qN0dIST_ePJfpDq-test.jpg`}
                                className="absolute w-full h-full"
                                style={{ objectFit: "cover" }}
                                alt="prop"
                            ></img>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="text-base leading-none">
                                Some Cart Item Let's say Some Cart Item Let's say
                            </div>
                            <div className="flex flex-row gap-2">
                                <div className="text-base font-gray-600">
                                    x2
                                </div>
                                <div className="text-base font-medium">
                                    $129.00
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-row justify-between">
                        <div className="text-xs">
                            Display Information
                        </div>
                        <div className="text-xs">
                            Update Cart Item
                        </div>
                    </div>
                </div>
            </div>
        </Popover.Panel>
    )
}
