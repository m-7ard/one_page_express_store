import React, { useState } from "react";
import { Dialog } from "@headlessui/react";
import { AbstractDialogContext } from "../../../Context";

export type AbstractDialogTrigger = React.FunctionComponent<{
    onClick: () => void;
}>;

export type AbstractDialogPanel = React.FunctionComponent<{
    onClose: () => void;
}>;

export default function AbstractDialog({
    Trigger,
    Panel,
    initial = false,
}: {
    Trigger: AbstractDialogTrigger;
    Panel: AbstractDialogPanel;
    initial?: boolean;
}) {
    /*
        Panel must contain a <Dialog.Panel onClose={onClose} in order to have
        off-panel click close functionality
    */
    const [open, setOpen] = useState(initial);

    return (
        <AbstractDialogContext.Provider value={{ setOpen }}>
            <Trigger
                onClick={() => {
                    setOpen(!open);
                }}
            />
            <Dialog open={open} onClose={() => setOpen(false)} className="relative" style={{ zIndex: 5000 }}>
                <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
                <div className="fixed inset-0 flex">
                    <Panel onClose={() => setOpen(false)} />
                </div>
            </Dialog>
        </AbstractDialogContext.Provider>
    );
}
