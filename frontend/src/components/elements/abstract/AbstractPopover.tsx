import { Popover } from "@headlessui/react";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
    TooltipProvider,
    createUseContext,
    fitFixedContainer,
    positionFixedContainer,
    useTooltipContext,
    useTooltipTools,
} from "../../../utils";
import useDimensions from "react-cool-dimensions";

export const [AbstractPopoverContext, useAbstractPopoverContext] = createUseContext<{
    open: boolean;
}>("useAbstractPopover has to be used within <AbstractPopover.Provider>");

export type AbstractPopoverTrigger = React.FunctionComponent<{ open: boolean }>;
export type AbstractPopoverPanel = React.FunctionComponent<Record<string, never>>;
export type AbstractPopoverProps = {
    Trigger: AbstractPopoverTrigger;
    Panel: AbstractPopoverPanel;
    positioning: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    }
};

export default function AbstractPopover({
    Trigger,
    Panel,
    positioning,
}: AbstractPopoverProps) {
    const tooltipTools = useTooltipTools();

    return (
        <Popover className={"flex flex-col"}>
            {({ open }) => {
                return (
                    <TooltipProvider value={{ ...tooltipTools, open, positioning }}>
                        {<Trigger open={open} />}
                        {open && <Panel />}
                    </TooltipProvider>
                );
            }}
        </Popover>
    );
}

AbstractPopover.Trigger = function Trigger(attrs: React.ComponentProps<typeof Popover.Button>) {
    const { setReferenceElement } = useTooltipContext();
    return <Popover.Button {...attrs} ref={setReferenceElement} />;
};

AbstractPopover.Panel = function Panel(attrs: React.ComponentProps<typeof Popover.Panel>) {
    const { setTargetElement } = useTooltipContext();
    return <Popover.Panel {...attrs} ref={setTargetElement} />;
};
