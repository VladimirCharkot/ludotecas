// Genera public/sala-de-escape/cables/cables.sb3: la version minima del
// motor de cables (ver lib/cables/README.md) para Scratch.
//
// No reusa lib/cables/motor.ts: ese modulo importa "server-only" y esta
// pensado para Node/Next, no para transpilarse a bloques de Scratch. En
// cambio, REGLAS se reimplementa aca a mano como bloques -- ver el
// comentario grande mas abajo para el mapeo regla por regla.
//
// Que hace el proyecto de Scratch:
//   - Bandera verde: arma un modulo nuevo (cantidad de cables al azar
//     entre 3 y 6, color de cada uno al azar, ultimo digito del serial
//     al azar) y calcula que cable es el correcto.
//   - Un clic en un cable corta ese cable: si es el correcto, "acierto";
//     si no, "error". Cualquiera de los dos cierra la ronda hasta la
//     proxima bandera verde.
//   - La planilla de reglas NO viaja en este proyecto (la reparte quien
//     imprime la ficha), solo el motor que verifica el resultado.
//
// Uso: node scripts/scratch-cables/generar.js

const fs = require("fs")
const path = require("path")
const crypto = require("crypto")
const JSZip = require("jszip")
const { Project, Sprite, Stage, Costume, Variable, List, Script } = require("sb-edit")

const {
  whenFlag,
  whenClicked,
  whenIReceive,
  broadcast,
  ifBlock,
  ifElse,
  repeat,
  pickRandom,
  mod,
  minus,
  eq,
  gt,
  and,
  not,
  joinAll,
  getVar,
  setVar,
  changeVar,
  itemOf,
  lengthOf,
  addToList,
  deleteAllOfList,
  switchCostumeTo,
  show,
  hide,
  sayForSecs,
  setSizeTo,
  changeSizeBy,
  clearGraphicEffects,
  setGhostTo,
  gotoXY,
} = require("./bloques")
const { CX, CY, cableSvg, fondoSvg, iconoMensajeSvg } = require("./svg")

const COLORES = ["rojo", "blanco", "azul", "amarillo", "negro"]
const XS = [-175, -105, -35, 35, 105, 175] // posiciones de los 6 cables

function md5(buf) {
  return crypto.createHash("md5").update(buf).digest("hex")
}

function svgCostume(name, svgString, centerX, centerY) {
  const asset = Buffer.from(svgString, "utf8")
  return new Costume({
    name,
    asset,
    md5: md5(asset),
    ext: "svg",
    bitmapResolution: 1,
    centerX,
    centerY,
  })
}

/* ============================================================
   Variables y listas
   ============================================================ */

function v(name, value) {
  return new Variable({ name, value, visible: false })
}

const n = v("n", 4)
const digito = v("digito", 0)
const correcto = v("correcto", 0)
const resultado = v("resultado", 0)
const i = v("i", 1)
const actual = v("actual", "")
const adyacentes = v("adyacentes", 0)
const distintos = v("distintos", 0)

const cont = {}
const prim = {}
for (const color of COLORES) {
  cont[color] = v("cont " + color, 0)
  prim[color] = v("primero " + color, 0)
}

const allVars = [
  n,
  digito,
  correcto,
  resultado,
  i,
  actual,
  adyacentes,
  distintos,
  ...COLORES.map((c) => cont[c]),
  ...COLORES.map((c) => prim[c]),
]

const colores = new List({ name: "colores", value: [], visible: false })
const colores5 = new List({ name: "Colores5", value: COLORES.slice(), visible: false })

/* ============================================================
   Resolver: mismo mapeo que lib/cables/motor.ts::REGLAS, pero
   escrito como bloques. `correcto` siempre queda con el indice
   1-based del cable (para calzar con los sprites Cable1..Cable6).
   ============================================================ */

/** Cuenta cada color de `colores` y guarda el primer indice (1-based)
 *  en el que aparece, recorriendo la lista una sola vez. */
function ramaColor(color) {
  return [
    changeVar(cont[color], 1),
    ifBlock(eq(getVar(prim[color]), 0), [setVar(prim[color], getVar(i))]),
  ]
}

function cadenaColores(idx) {
  const color = COLORES[idx]
  if (idx === COLORES.length - 1) return ramaColor(color)
  return [ifElse(eq(getVar(actual), color), ramaColor(color), cadenaColores(idx + 1))]
}

const loopConteo = [setVar(actual, itemOf(colores, getVar(i))), ...cadenaColores(0), changeVar(i, 1)]

const loopAdyacentes = [
  ifBlock(eq(itemOf(colores, getVar(i)), itemOf(colores, minus(getVar(i), 1))), [
    setVar(adyacentes, 1),
  ]),
  changeVar(i, 1),
]

const distintosBlocks = COLORES.map((c) => ifBlock(gt(getVar(cont[c]), 0), [changeVar(distintos, 1)]))

// REGLAS[3]: primer===ultimo -> 2; si no, segundo===negro -> ultimo;
// si no, hay amarillo -> primer amarillo; si no, ultimo.
const n3 = [
  ifElse(
    eq(itemOf(colores, 1), itemOf(colores, getVar(n))),
    [setVar(correcto, 2)],
    [
      ifElse(
        eq(itemOf(colores, 2), "negro"),
        [setVar(correcto, getVar(n))],
        [
          ifElse(
            gt(getVar(cont.amarillo), 0),
            [setVar(correcto, getVar(prim.amarillo))],
            [setVar(correcto, getVar(n))]
          ),
        ]
      ),
    ]
  ),
]

// REGLAS[4]: adyacentes iguales Y digito par -> 3; si no, primero
// blanco y sin negros -> 2; si no, exactamente un negro -> ese negro;
// si no, >=3 colores distintos -> 4; si no, 1.
const n4 = [
  ifElse(
    and(eq(getVar(adyacentes), 1), eq(mod(getVar(digito), 2), 0)),
    [setVar(correcto, 3)],
    [
      ifElse(
        and(eq(itemOf(colores, 1), "blanco"), eq(getVar(cont.negro), 0)),
        [setVar(correcto, 2)],
        [
          ifElse(
            eq(getVar(cont.negro), 1),
            [setVar(correcto, getVar(prim.negro))],
            [
              ifElse(
                gt(getVar(distintos), 2),
                [setVar(correcto, 4)],
                [setVar(correcto, 1)]
              ),
            ]
          ),
        ]
      ),
    ]
  ),
]

// REGLAS[5]: cable del medio rojo Y digito impar -> 3; si no, dos
// blancos -> primer blanco; si no, sin azules -> 4; si no, ultimo.
const n5 = [
  ifElse(
    and(eq(itemOf(colores, 3), "rojo"), eq(mod(getVar(digito), 2), 1)),
    [setVar(correcto, 3)],
    [
      ifElse(
        eq(getVar(cont.blanco), 2),
        [setVar(correcto, getVar(prim.blanco))],
        [
          ifElse(
            eq(getVar(cont.azul), 0),
            [setVar(correcto, 4)],
            [setVar(correcto, getVar(n))]
          ),
        ]
      ),
    ]
  ),
]

// REGLAS[6]: primero===segundo -> 3; si no, >=3 negros -> primer
// negro; si no, exactamente 2 amarillos -> 4; si no, ultimo.
const n6 = [
  ifElse(
    eq(itemOf(colores, 1), itemOf(colores, 2)),
    [setVar(correcto, 3)],
    [
      ifElse(
        gt(getVar(cont.negro), 2),
        [setVar(correcto, getVar(prim.negro))],
        [
          ifElse(
            eq(getVar(cont.amarillo), 2),
            [setVar(correcto, 4)],
            [setVar(correcto, getVar(n))]
          ),
        ]
      ),
    ]
  ),
]

const resolverCorrecto = [
  ifElse(eq(getVar(n), 3), n3, [ifElse(eq(getVar(n), 4), n4, [ifElse(eq(getVar(n), 5), n5, n6)])]),
]

/* ============================================================
   Escenario: arma el modulo nuevo en cada bandera verde.
   ============================================================ */

const cuerpoPrincipal = [
  whenFlag(),
  setVar(n, pickRandom(3, 6)),
  deleteAllOfList(colores),
  repeat(getVar(n), [addToList(colores, itemOf(colores5, pickRandom(1, 5)))]),
  setVar(digito, pickRandom(0, 9)),
  setVar(resultado, 0),
  setVar(correcto, 0),
  ...COLORES.map((c) => setVar(cont[c], 0)),
  ...COLORES.map((c) => setVar(prim[c], 0)),
  setVar(i, 1),
  repeat(lengthOf(colores), loopConteo),
  setVar(adyacentes, 0),
  setVar(i, 2),
  repeat(minus(lengthOf(colores), 1), loopAdyacentes),
  setVar(distintos, 0),
  ...distintosBlocks,
  ...resolverCorrecto,
  broadcast("nueva-ronda"),
]

const fondo = svgCostume("fondo", fondoSvg(), 240, 180)

const stage = new Stage({
  name: "Stage",
  costumes: [fondo],
  variables: allVars,
  lists: [colores, colores5],
  scripts: [new Script({ blocks: cuerpoPrincipal, name: "armar_modulo" })],
})

/* ============================================================
   Cables: un sprite por posicion (1 a 6), mismas 5 costumes de
   color en cada uno (el numero va dibujado en la costume).
   ============================================================ */

function crearCable(numero, x) {
  const costumes = COLORES.map((color) => svgCostume(color, cableSvg(color, numero), CX, CY))

  const scripts = [
    new Script({
      name: "reiniciar_posicion",
      blocks: [whenFlag(), gotoXY(x, 0), clearGraphicEffects(), setSizeTo(100), hide()],
    }),
    new Script({
      name: "mostrar_en_ronda",
      blocks: [
        whenIReceive("nueva-ronda"),
        ifElse(
          not(gt(numero, getVar(n))),
          [switchCostumeTo(itemOf(colores, numero)), clearGraphicEffects(), setSizeTo(100), show()],
          [hide()]
        ),
      ],
    }),
    new Script({
      name: "cortar",
      blocks: [
        whenClicked(),
        ifBlock(eq(getVar(resultado), 0), [
          setVar(resultado, numero),
          ifElse(eq(numero, getVar(correcto)), [broadcast("acierto")], [broadcast("error")]),
        ]),
      ],
    }),
    new Script({
      name: "si_acerte",
      blocks: [whenIReceive("acierto"), ifBlock(eq(getVar(resultado), numero), [changeSizeBy(15)])],
    }),
    new Script({
      name: "si_erre",
      blocks: [whenIReceive("error"), ifBlock(eq(getVar(resultado), numero), [setGhostTo(60)])],
    }),
  ]

  return new Sprite({
    name: "Cable" + numero,
    x,
    y: 0,
    size: 100,
    direction: 90,
    rotationStyle: "none",
    isDraggable: false,
    visible: false,
    // El layerOrder de la Stage es 0; el de cada sprite tiene que ser
    // >= 1 (lo valida el esquema sb3 al cargar). Sin esto, todos los
    // sprites quedaban en el 0 por defecto y el proyecto no cargaba.
    layerOrder: numero,
    costumes,
    scripts,
  })
}

const cables = XS.map((x, idx) => crearCable(idx + 1, x))

/* ============================================================
   Mensaje: sprite chico que muestra el estado de la ronda.
   ============================================================ */

const iconoMensaje = svgCostume("icono", iconoMensajeSvg(), 24, 20)

const mensaje = new Sprite({
  name: "Mensaje",
  x: 0,
  y: 130,
  size: 100,
  direction: 90,
  rotationStyle: "none",
  isDraggable: false,
  visible: true,
  layerOrder: cables.length + 1,
  costumes: [iconoMensaje],
  scripts: [
    new Script({ name: "mostrar", blocks: [whenFlag(), show()] }),
    new Script({
      name: "aviso_nuevo_modulo",
      blocks: [
        whenIReceive("nueva-ronda"),
        sayForSecs(joinAll(["Nuevo modulo. Ultimo digito del serial: ", getVar(digito)]), 2),
      ],
    }),
    new Script({
      name: "aviso_acierto",
      blocks: [
        whenIReceive("acierto"),
        sayForSecs(
          joinAll([
            "✓ Correcto. Cable ",
            getVar(correcto),
            " (",
            itemOf(colores, getVar(correcto)),
            ") era el bueno. Bandera verde = modulo nuevo.",
          ]),
          4
        ),
      ],
    }),
    new Script({
      name: "aviso_error",
      blocks: [
        whenIReceive("error"),
        sayForSecs(
          joinAll([
            "✗ Cortaste el cable ",
            getVar(resultado),
            " (",
            itemOf(colores, getVar(resultado)),
            "). No era ese. Bandera verde = modulo nuevo.",
          ]),
          4
        ),
      ],
    }),
  ],
})

/* ============================================================
   Empaquetado
   ============================================================ */

const project = new Project({ stage, sprites: [...cables, mensaje] })
const { json } = project.toSb3()

// sb-edit no arma "monitors" ni "extensions", y su "meta" viene
// incompleto: un project.json real de Scratch siempre trae las tres
// cosas, y el loader de scratch-vm asume que existen (p.ej. hace
// `json.extensions.forEach(...)` sin chequear que la clave este) y
// tira una excepcion dura si falta alguna.
const projectData = JSON.parse(json)
projectData.monitors = []
projectData.extensions = []
projectData.meta = { ...projectData.meta, vm: "0.2.0", agent: "" }

const zip = new JSZip()
zip.file("project.json", JSON.stringify(projectData))

const escritos = new Set()
for (const target of [project.stage, ...project.sprites]) {
  for (const costume of target.costumes) {
    const filename = `${costume.md5}.${costume.ext}`
    if (escritos.has(filename)) continue
    escritos.add(filename)
    zip.file(filename, Buffer.from(costume.asset))
  }
}

const outPath = path.join(__dirname, "..", "..", "public", "sala-de-escape", "cables", "cables.sb3")

zip
  .generateAsync({ type: "nodebuffer", streamFiles: true })
  .then((buf) => {
    fs.writeFileSync(outPath, buf)
    console.log("Escrito:", outPath, `(${buf.length} bytes)`)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
