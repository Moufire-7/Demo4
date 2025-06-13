export const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
};
