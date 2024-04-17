import { Menu } from "@headlessui/react";
import React from "react";

export type AbstractMenuTrigger = React.FunctionComponent<{
    open?: boolean;
}>

export type AbstractMenuItems = React.FunctionComponent<{
    open?: boolean;
}>

export default function AbstractMenu({
    Trigger,
    Items,
    // initial = false,
}: {
    Trigger: AbstractMenuTrigger;
    Items: AbstractMenuItems;
    initial?: boolean;
}) {

    return (
        <Menu>
            {({ open, close }) => (
                <div className="relative">
                    <Trigger open={open}/>
                    <Items open={open}/>
                </div>
            )}
        </Menu>
    )
}
