
import { classed } from "@tw-classed/react";
import AbstractPopover, { AbstractPopoverPanel, AbstractPopoverTrigger } from "./abstract/AbstractPopover";
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
            as={React.Fragment}
        >
            <GenericPanel>
                aaaaaaaaa
            </GenericPanel>
        </Popover.Panel>
    )
}
