import { useEventBus } from "@vueuse/core";

const dialogBus = useEventBus<string>("dialogs");
const barBus = useEventBus<string>("bars");
const cocktailTapBus = useEventBus<number>("cocktail-taps");

export { dialogBus, barBus, cocktailTapBus };
