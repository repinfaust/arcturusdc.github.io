import styles from "./DecisionTreeHero.module.css";

// Hero background (D-SITE-038): many options branch out, converge on one decision point, and a
// single red path resolves to an outcome. Dashed lines are the alternatives that were weighed.
// Pure SVG + CSS keyframes, so it renders on the server and ships no JavaScript.

const NODES = {
  root: [90, 340, "c"],
  a: [230, 190, "c"],
  b: [230, 500, "c"],
  a1: [380, 110, "c"],
  a2: [380, 270, "c"],
  b1: [380, 420, "c"],
  b2: [380, 580, "c"],
  a1a: [520, 60, "s"],
  a1b: [520, 150, "c"],
  a2a: [520, 225, "s"],
  b1b: [520, 470, "s"],
  b2a: [520, 540, "s"],
  b2b: [520, 620, "s"],
  a1b1: [640, 120, "s"],
  a1b2: [640, 180, "s"],
  alt1: [780, 80, "s"],
  alt2: [820, 600, "c"],
  alt3: [1110, 570, "c"],
  decide: [640, 340, "c"],
  d: [780, 340, "r"],
  e1: [900, 250, "r"],
  e2: [900, 430, "r"],
  f1: [1010, 190, "r"],
  f2: [1010, 290, "o"],
  f3: [1010, 390, "o"],
  f4: [1010, 480, "r"],
  g1: [1120, 150, "o"],
  g2: [1120, 225, "rs"],
  g3: [1120, 510, "o"],
  converge: [1390, 340, "r"],
  outcome: [1510, 340, "end"],
};

const INK = [
  ["root", "a"], ["root", "b"],
  ["a", "a1"], ["a", "a2"], ["b", "b1"], ["b", "b2"],
  ["a1", "a1a"], ["a1", "a1b"], ["a2", "a2a"], ["a2", "decide"],
  ["b1", "decide"], ["b1", "b1b"], ["b2", "b2a"], ["b2", "b2b"],
  ["a1b", "a1b1"], ["a1b", "a1b2"],
];

const RED = [
  ["decide", "d"], ["d", "e1"], ["d", "e2"],
  ["e1", "f1"], ["e1", "f2"], ["e2", "f3"], ["e2", "f4"],
  ["f1", "g1"], ["f1", "g2"], ["f4", "g3"],
  ["g2", "converge"], ["converge", "outcome"],
];

const ALTERNATIVES = [
  ["a1a", "alt1"], ["alt1", "converge"], ["a1b2", "converge"],
  ["b2a", "alt2"], ["alt2", "converge"], ["b2b", "alt3"], ["alt3", "converge"], ["b1b", "alt2"],
];

const curve = (from, to) => {
  const [x1, y1] = NODES[from];
  const [x2, y2] = NODES[to];
  const mx = (x1 + x2) / 2;
  return `M${x1} ${y1}C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
};

// Stagger by horizontal position so the drawing sweeps left to right.
const inkDelay = (x) => ((x - 90) / 550) * 2.4;
const redDelay = (x) => 4 + ((x - 640) / 870) * 2.2;
const delay = (seconds) => ({ animationDelay: `${seconds.toFixed(2)}s` });

function Node({ id }) {
  const [x, y, kind] = NODES[id];
  const red = kind !== "c" && kind !== "s";
  const start = red ? redDelay(x) + 0.35 : inkDelay(x) + 0.35;
  const className = red ? styles.redNode : styles.inkNode;

  if (kind === "end") {
    return (
      <g className={styles.outcome} style={delay(start)}>
        <rect x={x - 11} y={y - 11} width="22" height="22" />
      </g>
    );
  }
  if (kind === "s" || kind === "rs") {
    return <rect className={className} style={delay(start)} x={x - 8} y={y - 8} width="16" height="16" />;
  }
  return <circle className={`${className} ${kind === "o" ? styles.open : ""}`} style={delay(start)} cx={x} cy={y} r="8" />;
}

export default function DecisionTreeHero({ className = "" }) {
  return (
    <svg
      className={`${styles.tree} ${className}`}
      viewBox="0 0 1600 680"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      {ALTERNATIVES.map(([from, to]) => (
        <path key={`${from}-${to}`} className={styles.alt} style={delay(3 + inkDelay(NODES[from][0]) / 3)} d={curve(from, to)} />
      ))}
      {INK.map(([from, to]) => (
        <path key={`${from}-${to}`} className={styles.ink} style={delay(inkDelay(NODES[from][0]))} d={curve(from, to)} pathLength="1" />
      ))}
      {RED.map(([from, to]) => (
        <path key={`${from}-${to}`} className={styles.red} style={delay(redDelay(NODES[from][0]))} d={curve(from, to)} pathLength="1" />
      ))}
      {Object.keys(NODES).map((id) => (
        <Node key={id} id={id} />
      ))}
    </svg>
  );
}
