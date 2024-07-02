import { memo, useState, useEffect } from "react";
import { asWidget, useGetIncrementalID } from "../../../../utils";
import { BackspaceIcon, XCircleIcon } from "@heroicons/react/24/solid";
import App from "../../../pages/linked/App/App";

type Entry = [string, string];
type SpecificationValue = Record<string, Entry>;

function SpecificationInput({
    initial,
    name,
    onChange,
}: {
    name: string;
    initial?: Array<Entry>;
    onChange?: (value: SpecificationValue) => void;
}) {
    const getIncrementalID = useGetIncrementalID();
    const [value, setValue] = useState<SpecificationValue>(
        initial?.reduce<SpecificationValue>((acc, tuple) => {
            acc[getIncrementalID()] = tuple;
            return acc;
        }, {}) ?? {},
    );

    useEffect(() => {
        if (onChange == null) {
            return;
        }

        onChange(value);
    }, [value, onChange]);

    return (
        <div className="flex flex-col gap-2">
            <input name={name} type="hidden" value={JSON.stringify(Object.values(value))} />
            {Object.entries(value).map(([ID, tuple]) => (
                <SpecificationInputField initial={tuple} setValue={setValue} ID={ID} key={ID} />
            ))}
            <div
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-yellow
                    justify-center    
                `}
                onClick={() => {
                    setValue((previous) => ({ ...previous, [getIncrementalID()]: ["", ""] }));
                }}
            >
                Add Field
            </div>
        </div>
    );
}

const SpecificationInputField = memo(function SpecificationInputField({
    initial,
    setValue,
    ID,
}: {
    initial?: Entry;
    setValue: React.Dispatch<React.SetStateAction<SpecificationValue>>;
    ID: string;
}) {
    const [field, setField] = useState<Entry>(initial ?? ["", ""]);

    useEffect(() => {
        setValue((previous) => {
            const newState = { ...previous };
            newState[ID] = field;
            return newState;
        });
    }, [field, setValue, ID]);

    return (
        <div className="flex flex-row gap-2 items-center">
            <div className="flex flex-col basis-1/2 group">
                <div className={`w-full theme-input-generic-white mixin-char-input-like mixin-char-input-base`}>
                    <input
                        value={field[0]}
                        onChange={({ target: { value } }) => {
                            setField((previous) => [value, previous[1]]);
                        }}
                        placeholder="Name"
                    ></input>
                </div>
            </div>
            <div className="flex flex-col basis-1/2">
                <div className={`w-full mixin-char-input-like mixin-char-input-base`}>
                    <input
                        className={`theme-input-generic-white`}
                        value={field[1]}
                        onChange={({ target: { value } }) => {
                            setField((previous) => [previous[0], value]);
                        }}
                        placeholder="Value"
                    ></input>
                </div>
            </div>
            <BackspaceIcon
                className="h-6 w-6 text-gray-900 cursor-pointer"
                onClick={() => {
                    setValue((previous) => {
                        const newState = { ...previous };
                        delete newState[ID];
                        return newState;
                    });
                }}
            />
        </div>
    );
});

export const SpecificationInputWidget = asWidget(SpecificationInput, {});
