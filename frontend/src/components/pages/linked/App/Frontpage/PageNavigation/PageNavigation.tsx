import { QueryKey, useQueryClient } from "@tanstack/react-query";
import { PaginatedQuery } from "../../../../../../Types";
import { UncontrolledGenericListbox } from "../../../../../elements/widgets/GenericListbox/UncontrolledGenericListbox";
import { useQueryStringContext } from "../../../../../../Context";

export function PageNavigation({ queryKey }: { queryKey: QueryKey }) {
    const { page_index } = useQueryStringContext();
    const queryClient = useQueryClient();
    const query = queryClient.getQueryData<PaginatedQuery<Record<string, unknown>[]>>(queryKey)!;

    return (
        <div className="flex gap-2 justify-between items-center">
            <div
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-white
                    ${query.previousPage == null && "contrast-75 cursor-not-allowed"}
                `}
                onClick={() => {
                    if (query.previousPage == null) {
                        return;
                    }
                    page_index.current = query.previousPage;
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                }}
            >
                Back
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="text-base">Page</div>
                <UncontrolledGenericListbox
                    name="page_index"
                    value={page_index.current.toString()}
                    choices={Array.from({
                        length: Math.floor(query.count / 24) + 1,
                    }).map((_, i) => ({ value: `${i + 1}`, label: `${i + 1}` }) )}
                    onChange={(value) => {
                        if (parseInt(value) === page_index.current) {
                            return;
                        }

                        page_index.current = parseInt(value);
                        queryClient.invalidateQueries({ queryKey: ["products"] });
                    }}
                    nullable={false}
                />
            </div>
            <div
                className={`
                    mixin-button-like
                    mixin-button-base
                    theme-button-generic-white
                    ${query.nextPage == null && "contrast-75 cursor-not-allowed"}
                `}
                onClick={() => {
                    if (query.nextPage == null) {
                        return;
                    }
                    page_index.current = query.nextPage;
                    queryClient.invalidateQueries({ queryKey: ["products"] });
                }}
            >
                Next
            </div>
        </div>
    );
}
