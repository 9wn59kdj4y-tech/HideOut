(() => {
  "use strict";
  const names = ["paris", "hong-kong", "tokyo", "dubai", "londres", "sydney", "rio", "moscou", "rome", "le-caire", "san-francisco", "agra", "venise", "barcelone", "grande-muraille", "petra", "machu-picchu", "chichen-itza", "athenes", "pise", "florence", "prague", "budapest", "edimbourg", "lisbonne", "grenade", "dubrovnik", "santorin", "berlin", "copenhague", "quebec", "toronto", "seattle", "washington", "kuala-lumpur", "bangkok", "kyoto", "jaipur", "fuji", "mont-saint-michel", "everest", "mont-rushmore", "kilimandjaro", "chutes-victoria", "la-kaaba", "le-cap", "djenne", "lalibela", "dakar"];
  const files = [
    "./fonds/new-york.png",
    ...names.map(name => "./fonds/" + name + ".webp")
  ];
  const cycleKey = "hideout_background_cycle_v1";
  const currentKey = "hideout_intro_background_v1";
  const root = document.documentElement;
  let memoryCycle = null;
  const readSession = key => {
    try { return sessionStorage.getItem(key); } catch { return null; }
  };
  const writeSession = (key, value) => {
    try { sessionStorage.setItem(key, value); } catch {}
  };
  const clearCurrent = () => {
    try { sessionStorage.removeItem(currentKey); } catch {}
  };

  function readCycle() {
    let value;
    try { value = JSON.parse(localStorage.getItem(cycleKey)); }
    catch { value = memoryCycle; }
    const isOrder = list => Array.isArray(list) && list.length === files.length &&
      new Set(list).size === files.length && list.every(file => files.includes(file));
    if (!value || !isOrder(value.order) || !Array.isArray(value.remaining) ||
        new Set(value.remaining).size !== value.remaining.length ||
        !value.remaining.every(file => files.includes(file)) ||
        !(value.last === null || files.includes(value.last)) ||
        JSON.stringify(value.remaining) !== JSON.stringify(value.order.slice(files.length - value.remaining.length))) {
      return { order: [], remaining: [], last: null };
    }
    return value;
  }

  function shuffle(previous, last) {
    const order = files.slice();
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (order[0] === last) {
      const j = 1 + Math.floor(Math.random() * (order.length - 1));
      [order[0], order[j]] = [order[j], order[0]];
    }
    if (JSON.stringify(order) === JSON.stringify(previous)) {
      [order[1], order[2]] = [order[2], order[1]];
    }
    return order;
  }

  function saveCycle(value) {
    memoryCycle = value;
    try { localStorage.setItem(cycleKey, JSON.stringify(value)); }
    catch (error) { console.warn("Cycle des fonds non conservé après fermeture :", error); }
  }

  function preload(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timer = setTimeout(() => {
        img.onload = img.onerror = null;
        reject(new Error("Chargement du fond trop long : " + file));
      }, 15000);
      img.onload = () => { clearTimeout(timer); resolve(); };
      img.onerror = () => { clearTimeout(timer); reject(new Error("Fond introuvable : " + file)); };
      img.src = file;
    });
  }

  function display(file) {
    root.style.setProperty("--hideout-intro-image", `url("${file}")`);
  }

  async function choose() {
    // Un refresh pendant l'intro conserve le même fond.
    const current = readSession(currentKey);
    if (files.includes(current)) {
      await preload(current);
      display(current);
      return;
    }
    const cycle = readCycle();
    if (!cycle.remaining.length) {
      cycle.order = shuffle(cycle.order, cycle.last);
      cycle.remaining = cycle.order.slice();
    }
    const file = cycle.remaining[0];
    await preload(file);
    // Ne compter que les images dont le chargement a réussi.
    cycle.remaining.shift();
    cycle.last = file;
    saveCycle(cycle);
    writeSession(currentKey, file);
    display(file);
  }

  if (readSession("hideout_intro_seen") === "1") {
    clearCurrent();
    return;
  }

  root.classList.add("hideout-background-loading");
  root.style.setProperty("--hideout-intro-image", "none");
  const run = () => choose();
  const task = navigator.locks?.request
    ? navigator.locks.request("hideout-background-cycle", run)
    : run();
  task.catch(error => console.warn("Fond HIDEOUT :", error))
    .finally(() => root.classList.remove("hideout-background-loading"));

  // Le prochain vrai passage sur l'intro prendra un autre fond.
  document.addEventListener("click", event => {
    if (event.target.closest?.("#intro")) clearCurrent();
  }, { capture: true });
})();
