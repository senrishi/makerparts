export function isMakerCart(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["makerbazar.in", "www.makerbazar.in"].includes(url.hostname) &&
      /^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?cart\/?$/i.test(url.pathname)
    );
  } catch {
    return false;
  }
}
