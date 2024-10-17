import { atom } from "jotai";

export const toasterAtom = atom({ open: false, msg: "" });
export const toastAtom = atom(null, (_, set, update: any) => {
  set(toasterAtom, { open: true, msg: update });
});

export const connectionStatusAtom = atom("Disconnected");
