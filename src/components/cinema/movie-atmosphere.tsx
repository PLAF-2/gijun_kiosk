import type { CSSProperties } from "react";
import styles from "./movie-atmosphere.module.css";

type AtmosphereStyle = CSSProperties & {
  "--panel": string;
  "--panel-raised": string;
  "--line": string;
  "--accent": string;
  "--accent-light": string;
  "--movie-glow": string;
  "--movie-selected": string;
};

type Theme = {
  scene: string;
  panel: string;
  raised: string;
  line: string;
  accent: string;
  light: string;
  glow: string;
  selected: string;
};

const themes: Record<string, Theme> = {
  "chiikawa-mermaid-island": { scene: "mermaid", panel: "#10232b", raised: "#19313b", line: "#36555c", accent: "#82dacf", light: "#c2f2e9", glow: "#82dacf12", selected: "#1e4145" },
  "home-alone": { scene: "snow", panel: "#142033", raised: "#1c2c42", line: "#3a506b", accent: "#9ac9ee", light: "#d0e6fa", glow: "#ecc48b10", selected: "#263d56" },
  "la-la-land": { scene: "stars", panel: "#1a1832", raised: "#282440", line: "#4b4168", accent: "#b49bf2", light: "#dfd1ff", glow: "#b49bf215", selected: "#372c54" },
  "manyak-e-woori": { scene: "sunset", panel: "#271f23", raised: "#362a2d", line: "#604b4b", accent: "#e9ba92", light: "#ffddc1", glow: "#e9ba9212", selected: "#4a3633" },
  "moana-2026": { scene: "ocean", panel: "#10232e", raised: "#183342", line: "#345768", accent: "#77d6e6", light: "#bff2f8", glow: "#77d6e612", selected: "#1d4353" },
  "the-odyssey": { scene: "voyage", panel: "#17212b", raised: "#24323e", line: "#445565", accent: "#a0c4dc", light: "#d3e6ef", glow: "#a0c4dc12", selected: "#304655" },
  "oneul-bam-segyeeseo": { scene: "petals", panel: "#231b2d", raised: "#33273e", line: "#584660", accent: "#ddb0da", light: "#f7d9ef", glow: "#ddb0da12", selected: "#48324e" },
  "arrietty": { scene: "garden", panel: "#1a2524", raised: "#263633", line: "#485f51", accent: "#b4d294", light: "#ddecbd", glow: "#b4d29412", selected: "#354935" },
  "begin-again": { scene: "music", panel: "#242228", raised: "#34303a", line: "#57505d", accent: "#e5c391", light: "#fbe2b8", glow: "#e5c39112", selected: "#453c35" },
  "jurassic-world-rebirth": { scene: "forest", panel: "#132620", raised: "#1d382e", line: "#38594b", accent: "#91cba5", light: "#c7ebd0", glow: "#91cba512", selected: "#294b39" },
};

function getTheme(movieId?: string): Theme | undefined {
  return movieId && Object.prototype.hasOwnProperty.call(themes, movieId)
    ? themes[movieId]
    : undefined;
}

/** Apply to the shell containing the cinema UI. No selection retains the default palette. */
export function getMovieAtmosphereStyle(movieId?: string): CSSProperties {
  const theme = getTheme(movieId);
  if (!theme) return {};
  const style: AtmosphereStyle = {
    "--panel": theme.panel,
    "--panel-raised": theme.raised,
    "--line": theme.line,
    "--accent": theme.accent,
    "--accent-light": theme.light,
    "--movie-glow": theme.glow,
    "--movie-selected": theme.selected,
  };
  return style;
}

export const movieAtmosphereShellClass = styles.themedShell;

const points = [
  [85, 92, 2], [206, 218, 3], [365, 64, 2], [529, 146, 2],
  [725, 52, 3], [944, 102, 2], [1168, 55, 2], [1379, 161, 3],
  [1524, 85, 2], [45, 381, 3], [1510, 420, 2], [1424, 719, 3],
  [106, 821, 2], [408, 937, 2], [1120, 915, 3], [1580, 905, 2],
];

function StarField() {
  return <g className={styles.drift}>{points.map(([x, y, r], index) => (
    <g key={index} opacity={index % 3 === 0 ? 0.8 : 0.4}>
      <circle cx={x} cy={y} r={r} />
      {index % 3 === 0 && <path d={`M${x - 7} ${y}h14M${x} ${y - 7}v14`} fill="none" stroke="currentColor" strokeWidth="0.7" />}
    </g>
  ))}</g>;
}

function Waves({ voyage = false }: { voyage?: boolean }) {
  return <>
    <g className={styles.waves} fill="none" stroke="currentColor">
      <path d="M-120 820C110 745 240 902 480 822S860 744 1110 820 1430 886 1740 806" strokeWidth={voyage ? 1.5 : 3} opacity=".42" />
      <path d="M-150 884C80 797 260 942 510 869S900 810 1160 872 1490 957 1750 865" strokeWidth="1.5" opacity=".3" />
      <path d="M-100 950C190 864 360 1006 670 948S1070 890 1320 944 1590 1000 1770 920" strokeWidth="2" opacity=".2" />
    </g>
    {voyage && <g className={styles.compass} fill="none" stroke="currentColor" strokeWidth="1" opacity=".35">
      <circle cx="1420" cy="170" r="95" /><circle cx="1420" cy="170" r="80" />
      <path d="m1420 44 17 109 109 17-109 17-17 109-17-109-109-17 109-17Z" />
      <path d="m1364 114 56 39 56-39-39 56 39 56-56-39-56 39 39-56Z" opacity=".4" />
    </g>}
  </>;
}

function Leaves({ forest = false }: { forest?: boolean }) {
  return <g className={styles.leaves} fill="currentColor">
    <g opacity={forest ? 0.2 : 0.16}>
      <path d="M-70 1030C-30 860 55 708 145 660 150 784 76 924-70 1030ZM-55 1030C62 937 188 906 277 922 221 1012 87 1045-55 1030Z" />
      <path d="M1640 1060C1615 875 1492 742 1442 679 1410 832 1480 974 1640 1060ZM1640 1009C1530 896 1400 873 1323 910 1388 999 1512 1030 1640 1009Z" />
    </g>
    {forest ? <g fill="none" stroke="currentColor" strokeWidth="3" opacity=".22">
      <path d="M0 554 158 240M16 520l-36-82m55 43 82-14m-53-44-57-68m78 25 90-13m-66-33-53-59m73 22 74-23M1600 539l-140-316m116 263 72-41m-92 1-64-12m44-30 63-45m-82 1-64-14m43-26 57-39" />
    </g> : <g fill="none" stroke="currentColor" strokeWidth="1" opacity=".28">
      <path d="M-10 960 126 700M1594 995l-142-278" />
      <circle cx="130" cy="815" r="9" /><circle cx="1467" cy="869" r="6" />
    </g>}
  </g>;
}

function Scene({ scene }: { scene: string }) {
  switch (scene) {
    case "stars": return <><StarField /><path d="M1465 205a54 54 0 1 1-44-87 45 45 0 0 0 44 87Z" opacity=".28" /></>;
    case "ocean": return <Waves />;
    case "voyage": return <Waves voyage />;
    case "garden": return <Leaves />;
    case "forest": return <><Leaves forest /><g className={styles.drift} opacity=".3"><circle cx="95" cy="598" r="2" /><circle cx="1510" cy="660" r="2" /><circle cx="1430" cy="550" r="1.5" /></g></>;
    case "mermaid": return <g className={styles.float} fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".32">
      <circle cx="70" cy="245" r="23" /><circle cx="141" cy="667" r="38" /><circle cx="58" cy="845" r="11" />
      <circle cx="1500" cy="306" r="35" /><circle cx="1542" cy="766" r="20" /><circle cx="1379" cy="889" r="12" />
      <path d="m149 91 7 13 14 2-10 11 2 15-13-7-13 7 2-15-10-11 14-2Z" />
    </g>;
    case "snow": return <>
      <g className={styles.snowfall} opacity=".4">{points.map(([x, y, r], index) => <circle key={index} cx={x} cy={y} r={r + 1} />)}</g>
      <g fill="none" stroke="currentColor" opacity=".18"><path d="M35 1000V860l75-62 75 62v140M48 860h124" /><path d="M73 884h72v84H73ZM109 884v84M73 926h72" stroke="#f1cd99" /></g>
    </>;
    case "sunset": return <g className={styles.float} fill="none" stroke="currentColor" opacity=".18">
      <circle cx="1415" cy="188" r="105" /><circle cx="1415" cy="188" r="130" opacity=".45" /><circle cx="95" cy="790" r="41" /><circle cx="1469" cy="833" r="29" /><path d="M0 930h310M1290 935h310" />
    </g>;
    case "petals": return <g className={styles.petalMotion} opacity=".3">
      {[[89, 150, 25], [1508, 288, -30], [78, 622, 50], [1483, 782, 18], [1353, 920, -12]].map(([x, y, angle], index) => <path key={index} transform={`translate(${x} ${y}) rotate(${angle})`} d="M0 0C-24-23-29 3-6 22 13 13 23-7 0 0Z" />)}
      <path d="M-40 938C150 785 250 852 368 913M1280 80c152 94 236 123 375 51" fill="none" stroke="currentColor" strokeWidth=".8" opacity=".6" />
    </g>;
    case "music": return <>
      <g fill="none" stroke="currentColor" opacity=".18"><path d="M0 1000V923h39v-52h40v102h38v-144h51v171M1400 1000V912h36v-72h40v133h39v-101h41v128M0 933h1600" /></g>
      <g className={styles.drift} fill="none" stroke="currentColor" opacity=".3"><circle cx="1440" cy="174" r="68" /><circle cx="1440" cy="174" r="45" /><circle cx="1440" cy="174" r="9" /><path d="M42 346h20v-19h18v53h18v-33h18v-14h18v48h18v-35h20" /></g>
    </>;
    default: return null;
  }
}

/** Decorative only: no timers, media downloads, focus targets or live announcements. */
export function MovieAtmosphere({ movieId }: { movieId?: string }) {
  const theme = getTheme(movieId);
  if (!theme) return null;
  return <div key={movieId} className={`${styles.atmosphere} ${styles[theme.scene]}`} aria-hidden="true">
    <svg className={styles.art} viewBox="0 0 1600 1000" preserveAspectRatio="none" focusable="false" fill="currentColor">
      <Scene scene={theme.scene} />
    </svg>
  </div>;
}
