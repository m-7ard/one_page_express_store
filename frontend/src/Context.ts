import { createContext, useContext } from "react";
import { CartProductType, CartType, FilterType, OrderType, ProductType, UserType } from "./Types";
import { createUseContext } from "./utils";
import { apiFetchBodyDataUnit } from "./components/pages/unlinked/CartPopver/CartPopover";
import { FormErrors } from "./components/elements/forms/GenericForm";
import { UserRelatedData } from "./components/pages/linked/App/App";

interface AppContextInterface {
    user?: UserType;
    cart?: CartType;
    orders?: OrderType[];
    filters: FilterType[];
    updateUserRelatedData: <T extends keyof NonNullable<UserRelatedData>>(
        key: T,
        updater: (previous: NonNullable<UserRelatedData>[T]) => NonNullable<UserRelatedData>[T],
    ) => void;
}

export const AppContext = createContext<AppContextInterface | null>(null);

export const useAppContext = (): AppContextInterface => {
    const AppContextValue = useContext(AppContext);

    if (AppContextValue == null) {
        throw new Error("useAppContext has to be used within <AppContext.Provider>");
    }

    return AppContextValue;
};

export const [AbstractDialogContext, useAbstractDialogContext] = createUseContext<{
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    open: boolean;
}>("useAbstractDialogContext has to be used within <AbstractDialogContext.Provider>");

export const [QueryStringContext, useQueryStringContext] = createUseContext<{
    filterParams: React.MutableRefObject<Record<string, string>>;
    sortParams: React.MutableRefObject<{ sort?: string }>;
    page_index: React.MutableRefObject<number>;
    buildQueryString: () => string;
}>("useQueryStringContext has to be used within <QueryStringContext.Provider>");

export const [ProductContext, useProductContext] = createUseContext<ProductType>(
    "useProductContext has to be used within <ProductContext.Provider>",
);
