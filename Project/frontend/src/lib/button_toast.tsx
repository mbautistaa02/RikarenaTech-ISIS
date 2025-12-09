import { toast } from "react-hot-toast";

export const confirmToast = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const id = toast(
      () => (
        <div className="flex flex-col gap-2">
          <p>{message}</p>
          <div className="flex gap-2 justify-end">
            <button
              className="bg-gray-200 px-3 py-1 rounded"
              onClick={() => {
                toast.dismiss(id);
                resolve(false);
              }}
            >
              Canceler
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded"
              onClick={() => {
                toast.dismiss(id);
                resolve(true);
              }}
            >
              Sí
            </button>
          </div>
        </div>
      ),
      { duration: Infinity }, // mantener abierto hasta que se haga click
    );
  });
};
