// Helpers minimos para armar bloques de Scratch a mano con sb-edit.
//
// sb-edit tipa los inputs de forma estricta (p.ej. COSTUME solo acepta un
// nombre fijo), pero el formato sb3 real permite reemplazar cualquier
// "shadow" por un reporter de verdad. `val()` hace ese cast: si le pasamos
// un Block, lo envuelve como `{type:"block", value:...}` (lo que sb-edit
// serializa como bloque real dentro del input); si le pasamos un numero o
// string, lo deja como shadow literal. Ver toSb3.js `serializeInputsToInputs`.

const { OpCode } = require("sb-edit")
// "Block" en sb-edit es solo un tipo de TypeScript (se borra al compilar);
// la clase que existe en runtime es BlockBase, y no la reexporta el
// index publico. Hay que pedirla por la ruta interna.
const { BlockBase } = require("sb-edit/lib/Block")

function val(x) {
  if (x instanceof BlockBase) return { type: "block", value: x }
  if (typeof x === "number") return { type: "number", value: x }
  if (typeof x === "string") return { type: "string", value: x }
  throw new Error("val(): tipo no soportado: " + x)
}

function sub(blocks) {
  return { type: "blocks", value: blocks && blocks.length ? blocks : null }
}

function B(opcode, inputs) {
  return new BlockBase({ opcode, inputs: inputs || {} })
}

function varRef(v) {
  return { type: "variable", value: { id: v.id, name: v.name } }
}

function listRef(l) {
  return { type: "list", value: { id: l.id, name: l.name } }
}

// --- Eventos ---
const whenFlag = () => B(OpCode.event_whenflagclicked)
const whenClicked = () => B(OpCode.event_whenthisspriteclicked)
const whenIReceive = (msg) =>
  B(OpCode.event_whenbroadcastreceived, {
    BROADCAST_OPTION: { type: "broadcast", value: msg },
  })
const broadcast = (msg) =>
  B(OpCode.event_broadcast, {
    BROADCAST_INPUT: { type: "broadcast", value: msg },
  })

// --- Control ---
const ifBlock = (cond, then) =>
  B(OpCode.control_if, { CONDITION: val(cond), SUBSTACK: sub(then) })
const ifElse = (cond, then, els) =>
  B(OpCode.control_if_else, {
    CONDITION: val(cond),
    SUBSTACK: sub(then),
    SUBSTACK2: sub(els),
  })
const repeat = (times, body) =>
  B(OpCode.control_repeat, { TIMES: val(times), SUBSTACK: sub(body) })

// --- Operadores ---
const pickRandom = (a, b) =>
  B(OpCode.operator_random, { FROM: val(a), TO: val(b) })
const mod = (a, b) => B(OpCode.operator_mod, { NUM1: val(a), NUM2: val(b) })
const minus = (a, b) =>
  B(OpCode.operator_subtract, { NUM1: val(a), NUM2: val(b) })
const eq = (a, b) =>
  B(OpCode.operator_equals, { OPERAND1: val(a), OPERAND2: val(b) })
const gt = (a, b) =>
  B(OpCode.operator_gt, { OPERAND1: val(a), OPERAND2: val(b) })
const and = (a, b) =>
  B(OpCode.operator_and, { OPERAND1: val(a), OPERAND2: val(b) })
const not = (a) => B(OpCode.operator_not, { OPERAND: val(a) })
const join2 = (a, b) =>
  B(OpCode.operator_join, { STRING1: val(a), STRING2: val(b) })
/** Concatena N partes encadenando `join` (que solo acepta 2 a la vez). */
function joinAll(parts) {
  return parts.reduce((acc, p) => (acc === null ? p : join2(acc, p)))
}

// --- Variables y listas ---
const getVar = (v) => B(OpCode.data_variable, { VARIABLE: varRef(v) })
const setVar = (v, x) =>
  B(OpCode.data_setvariableto, { VARIABLE: varRef(v), VALUE: val(x) })
const changeVar = (v, x) =>
  B(OpCode.data_changevariableby, { VARIABLE: varRef(v), VALUE: val(x) })
const itemOf = (list, index) =>
  B(OpCode.data_itemoflist, { LIST: listRef(list), INDEX: val(index) })
const lengthOf = (list) => B(OpCode.data_lengthoflist, { LIST: listRef(list) })
const addToList = (list, x) =>
  B(OpCode.data_addtolist, { LIST: listRef(list), ITEM: val(x) })
const deleteAllOfList = (list) =>
  B(OpCode.data_deletealloflist, { LIST: listRef(list) })

// --- Apariencia ---
const switchCostumeTo = (x) =>
  B(OpCode.looks_switchcostumeto, { COSTUME: val(x) })
const show = () => B(OpCode.looks_show)
const hide = () => B(OpCode.looks_hide)
const sayForSecs = (msg, secs) =>
  B(OpCode.looks_sayforsecs, { MESSAGE: val(msg), SECS: val(secs) })
const setSizeTo = (n) => B(OpCode.looks_setsizeto, { SIZE: val(n) })
const changeSizeBy = (n) => B(OpCode.looks_changesizeby, { CHANGE: val(n) })
const clearGraphicEffects = () => B(OpCode.looks_cleargraphiceffects)
const setGhostTo = (n) =>
  B(OpCode.looks_seteffectto, {
    EFFECT: { type: "graphicEffect", value: "GHOST" },
    VALUE: val(n),
  })

// --- Movimiento ---
const gotoXY = (x, y) => B(OpCode.motion_gotoxy, { X: val(x), Y: val(y) })

module.exports = {
  val,
  sub,
  B,
  varRef,
  listRef,
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
}
