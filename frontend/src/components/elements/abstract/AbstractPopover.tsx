import { Popover } from "@headlessui/react";
import { Options } from "@popperjs/core";
import React, { useState } from "react";
import { usePopper } from "react-popper-2";

export type AbstractPopoverTrigger = React.FunctionComponent<{
    setReferenceElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    open?: boolean;
}>;

export type AbstractPopoverPanel = React.FunctionComponent<{
    setPopperElement: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
    popper: ReturnType<typeof usePopper>;
    open?: boolean;
}>;

export default function AbstractPopover({
    Trigger,
    Panel,
    options,
    // initial = false,
}: {
    Trigger: AbstractPopoverTrigger;
    Panel: AbstractPopoverPanel;
    options: Partial<Options>;
    initial?: boolean;
}) {
    const [referenceElement, setReferenceElement] = useState<HTMLElement | null>(null);
    const [popperElement, setPopperElement] = useState<HTMLElement | null>(null);
    const popper = usePopper(referenceElement, popperElement, options);

    return (
        <Popover className={"z-50"}>
            {({ open }) => (
                <>
                    <Trigger setReferenceElement={setReferenceElement} open={open} />
                    <Panel setPopperElement={setPopperElement} popper={popper} open={open} />
                </>
            )}
        </Popover>
    );
}
