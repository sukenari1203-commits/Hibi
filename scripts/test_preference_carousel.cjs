const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const shovel = fs.readFileSync(path.join(root, "preference-shovel.svg"), "utf8");
assert.match(shovel, /viewBox="0 0 160 300"/);
assert.match(shovel, /M80 8 C59 29/); // The metal blade starts at the top.
assert.match(shovel, /y="162" width="16" height="108"/); // The wooden shaft extends below it.

class Element {
  constructor(name = "") {
    this.name = name;
    this.children = [];
    this.dataset = {};
    this.events = {};
    this.attributes = {};
    this.properties = {};
    this.hidden = false;
    this.clientWidth = 320;
    this.style = {
      setProperty: (key, value) => { this.properties[key] = value; }
    };
    const classes = new Set();
    this.classList = {
      add: value => classes.add(value),
      remove: value => classes.delete(value),
      toggle: (value, enabled) => enabled ? classes.add(value) : classes.delete(value),
      contains: value => classes.has(value)
    };
  }
  set innerHTML(markup) {
    this.markup = markup;
    this.children = [...markup.matchAll(/<button class="preference-card ([^"]+)"/g)]
      .map(match => {
        const card = new Element();
        card.className = match[1];
        return card;
      });
  }
  addEventListener(type, callback) { this.events[type] = callback; }
  setAttribute(name, value) { this.attributes[name] = value; }
  click() { this.events.click?.({ preventDefault() {}, stopPropagation() {} }); }
  setPointerCapture() { this.captured = true; }
  hasPointerCapture() { return !!this.captured; }
  releasePointerCapture() { this.captured = false; }
  focus() {}
  close() { this.open = false; }
}

for (const filename of ["index.html", "mobile.html"]) {
  const html = fs.readFileSync(path.join(root, filename), "utf8");
  assert.match(html, /perspective:800px/);
  assert.match(html, /preference-card\.preference-ore/);
  assert.doesNotMatch(html, /preference-card\.ore\b/);

  const start = html.indexOf("function setupOnboardingSurvey()");
  const end = html.indexOf("function showSurveyIfNeeded()", start);
  assert.ok(start > 0 && end > start, filename);
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, new Element(id));
    return elements.get(id);
  };
  const arrows = ["occupation", "priority"].flatMap(kind =>
    [-1, 1].map(direction => {
      const button = new Element();
      button.dataset = { carousel: kind, direction };
      return button;
    }));
  const document = {
    getElementById: get,
    querySelectorAll: () => arrows
  };
  const saved = {};
  const localStorage = { setItem(key, value) { saved[key] = value; } };
  const events = [];
  const setup = new Function(
    "document", "window", "requestAnimationFrame", "localStorage",
    "ONBOARDING_KEY", "PREFERENCE_KEY", "analyticsTrack",
    html.slice(start, end) + "\nreturn setupOnboardingSurvey;"
  )(document, { addEventListener() {} }, callback => callback(),
    localStorage, "onboarding", "preferences", (...args) => events.push(args));

  setup();
  const occupation = get("occupationTrack");
  const priority = get("priorityTrack");
  assert.equal(occupation.children.length, 6, filename);
  assert.equal(priority.children.length, 6, filename);
  assert.match(occupation.markup, /src="preference-shovel\.svg"/);
  assert.match(occupation.children[1].properties["--wheel-transform"], /rotateY\(/);
  assert.equal(get("occupationSelection").textContent, "高校生");
  arrows[0].click();
  assert.equal(get("occupationSelection").textContent, "その他", "carousel wraps around");

  get("onboardingForm").events.submit({ preventDefault() {} });
  assert.equal(get("priorityStage").hidden, false);
  priority.children[1].click();
  assert.equal(get("prioritySelection").textContent, "仕事内容", "ore can be tapped");

  const viewport = get("priorityViewport");
  viewport.events.pointerdown({ clientX: 200, pointerType: "touch", pointerId: 1 });
  viewport.events.pointermove({ clientX: 120, pointerId: 1 });
  assert.equal(viewport.classList.contains("dragging"), true);
  viewport.events.pointerup({ clientX: 120, pointerId: 1 });
  assert.equal(get("prioritySelection").textContent, "働き方", "ore rotates on swipe");
  assert.equal(priority.children[2].attributes["aria-pressed"], "true");

  get("onboardingForm").events.submit({ preventDefault() {} });
  assert.deepEqual(JSON.parse(saved.preferences), { occupation: "その他", priority: "働き方" });
  assert.equal(events[0][0], "preference_submitted");
  console.log(filename + ": rotating carousel, wrap, tap, swipe, and save passed");
}
