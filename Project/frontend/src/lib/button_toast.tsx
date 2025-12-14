export const confirmToast = (message: string): Promise<boolean> => {
  return Promise.resolve(window.confirm(message));
};
