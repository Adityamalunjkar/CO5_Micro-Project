/* =====================================================================
   Automated tests for the CPU Instruction Cycle Simulator core.
   Run with:  node tests.js

   These tests exercise the REAL simulator logic (the same createSimulator
   used by the browser UI) — no results are hard-coded as PASS.
   Each test records input, expected and actual values, and pass/fail.
   ===================================================================== */

'use strict';

const { createSimulator, parseProgram, SAMPLE_PROGRAMS, toSigned } = require('./script.js');

const results = [];
let passed = 0, failed = 0;

function record(id, name, input, expected, actual, pass) {
  results.push({ id, name, input, expected, actual, pass });
  if (pass) passed++; else failed++;
}

function eq(label, input, expected, actual) {
  record(label.id, label.name, input,
    typeof expected === 'object' ? JSON.stringify(expected) : String(expected),
    typeof actual === 'object' ? JSON.stringify(actual) : String(actual),
    JSON.stringify(expected) === JSON.stringify(actual));
}

function truthy(label, input, actual, description) {
  record(label.id, label.name, input, description, String(actual), !!actual);
}

function runProgram(text, opts) {
  const sim = createSimulator(Object.assign({ programText: text, width: 8 }, opts || {}));
  sim.runToCompletion();
  return sim;
}

/* ---------- T01: Fetch / Decode / Execute of LOAD ---------- */
(function () {
  const sim = createSimulator({ programText: 'LOAD R0, 10\nHALT', width: 8 });
  const s = sim.state;
  // micro-step 2: MAR <- PC
  sim.stepMicro(); sim.stepMicro();
  const marAfter2 = s.mar;
  // micro-step 3: MDR <- InstructionMemory[MAR]
  sim.stepMicro();
  const mdrAfter3 = { kind: s.mdrKind, value: s.mdr };
  // micro-step 4: IR <- MDR
  sim.stepMicro();
  const irAfter4 = s.ir;
  // micro-step 5: PC <- PC + 1
  sim.stepMicro();
  const pcAfter5 = s.pc;
  // finish the instruction
  sim.stepInstruction(); sim.stepInstruction(); // decode+execute of LOAD, then fetch... of HALT
  eq({ id: 'T01', name: 'Fetch micro-steps of LOAD (MAR, MDR, IR, PC)' }, 'LOAD R0, 10 / HALT',
    { marAfter2: 0, mdr: 'LOAD R0, 10', mdrKind: 'instr', ir: 'LOAD R0, 10', pcAfter5: 1 },
    { marAfter2, mdr: mdrAfter3.value, mdrKind: mdrAfter3.kind, ir: irAfter4, pcAfter5 });
  eq({ id: 'T01', name: 'LOAD execute result (R0 = 10)' }, 'LOAD R0, 10 / HALT', 10, s.regs.R0);
})();

/* ---------- T02: MOV ---------- */
(function () {
  const sim = runProgram('LOAD R0, 42\nMOV R1, R0\nHALT');
  eq({ id: 'T02', name: 'Register-to-register MOV' }, 'LOAD R0, 42 / MOV R1, R0 / HALT',
    { R1: 42, R0: 42 }, { R1: sim.state.regs.R1, R0: sim.state.regs.R0 });
})();

/* ---------- T03: ADD ---------- */
(function () {
  const sim = runProgram('LOAD R0, 10\nLOAD R1, 5\nADD R0, R1\nHALT');
  eq({ id: 'T03', name: 'ADD two registers' }, 'LOAD R0,10 / LOAD R1,5 / ADD R0,R1 / HALT',
    { R0: 15, Z: false, N: false, C: false, V: false },
    { R0: sim.state.regs.R0, Z: sim.state.flags.Z, N: sim.state.flags.N, C: sim.state.flags.C, V: sim.state.flags.V });
})();

/* ---------- T04: SUB positive ---------- */
(function () {
  const sim = runProgram('LOAD R0, 40\nLOAD R1, 25\nSUB R0, R1\nHALT');
  eq({ id: 'T04', name: 'SUB two registers (positive result)' }, 'LOAD R0,40 / LOAD R1,25 / SUB R0,R1 / HALT',
    { R0: 15, N: false }, { R0: sim.state.regs.R0, N: sim.state.flags.N });
})();

/* ---------- T05: SUB negative (two's complement) ---------- */
(function () {
  const sim = runProgram('LOAD R0, 5\nLOAD R1, 10\nSUB R0, R1\nHALT');
  eq({ id: 'T05', name: 'SUB with negative result (8-bit two\u2019s complement)' }, 'LOAD R0,5 / LOAD R1,10 / SUB R0,R1 / HALT',
    { stored: 251, signed: -5, N: true, C: false },
    { stored: sim.state.regs.R0, signed: toSigned(sim.state.regs.R0, 8), N: sim.state.flags.N, C: sim.state.flags.C });
})();

/* ---------- T06: MUL ---------- */
(function () {
  const sim = runProgram('LOAD R0, 7\nLOAD R1, 6\nMUL R0, R1\nHALT');
  eq({ id: 'T06', name: 'MUL two registers' }, 'LOAD R0,7 / LOAD R1,6 / MUL R0,R1 / HALT',
    { R0: 42, Z: false }, { R0: sim.state.regs.R0, Z: sim.state.flags.Z });
})();

/* ---------- T07: STORE + READ ---------- */
(function () {
  const sim = runProgram('LOAD R0, 15\nSTORE R0, 100\nREAD R2, 100\nHALT');
  eq({ id: 'T07', name: 'STORE then READ (data-memory round trip)' }, 'LOAD R0,15 / STORE R0,100 / READ R2,100 / HALT',
    { mem100: 15, R2: 15, writes: 1, reads: 1 },
    { mem100: sim.state.dataMemory[100], R2: sim.state.regs.R2, writes: sim.state.memoryWrites.length, reads: sim.state.memoryReads.length });
})();

/* ---------- T08: required sample program ---------- */
(function () {
  const sim = createSimulator({ programText: SAMPLE_PROGRAMS[0].text, width: 8 });
  sim.runToCompletion();
  const s = sim.state;
  eq({ id: 'T08', name: 'Required sample program final state' }, SAMPLE_PROGRAMS[0].text.split('\n').join(' / '),
    { R0: 15, R1: 5, R2: 15, mem100: 15, status: 'halted' },
    { R0: s.regs.R0, R1: s.regs.R1, R2: s.regs.R2, mem100: s.dataMemory[100], status: s.status });
})();

/* ---------- T09: JMP ---------- */
(function () {
  const sim = runProgram('LOAD R0, 1\nJMP 3\nLOAD R0, 99\nHALT');
  eq({ id: 'T09', name: 'Unconditional JMP skips an instruction' }, 'LOAD R0,1 / JMP 3 / LOAD R0,99 / HALT',
    { R0: 1, executed: 3 }, { R0: sim.state.regs.R0, executed: sim.state.instructionCount });
})();

/* ---------- T10: JZ taken ---------- */
(function () {
  const sim = runProgram('LOAD R0, 5\nLOAD R1, 5\nCMP R0, R1\nJZ 5\nLOAD R2, 99\nHALT');
  eq({ id: 'T10', name: 'Conditional jump JZ taken (Z = 1)' }, 'LOAD R0,5 / LOAD R1,5 / CMP / JZ 5 / LOAD R2,99 / HALT',
    { R2: 0, executed: 5, halted: true },
    { R2: sim.state.regs.R2, executed: sim.state.instructionCount, halted: sim.state.halted });
})();

/* ---------- T11: JZ not taken ---------- */
(function () {
  const sim = runProgram('LOAD R0, 10\nLOAD R1, 20\nCMP R0, R1\nJZ 5\nLOAD R2, 99\nHALT');
  eq({ id: 'T11', name: 'Conditional jump JZ not taken (Z = 0)' }, 'LOAD R0,10 / LOAD R1,20 / CMP / JZ 5 / LOAD R2,99 / HALT',
    { R2: 99, executed: 6, halted: true },
    { R2: sim.state.regs.R2, executed: sim.state.instructionCount, halted: sim.state.halted });
})();

/* ---------- T12: CMP flags ---------- */
(function () {
  const sim = runProgram('LOAD R0, 10\nLOAD R1, 20\nCMP R0, R1\nHALT');
  eq({ id: 'T12', name: 'CMP updates flags (10 < 20: N=1, Z=0)' }, 'LOAD R0,10 / LOAD R1,20 / CMP R0,R1 / HALT',
    { Z: false, N: true, R0: 10 },
    { Z: sim.state.flags.Z, N: sim.state.flags.N, R0: sim.state.regs.R0 });
})();

/* ---------- T13: HALT ---------- */
(function () {
  const sim = runProgram('LOAD R0, 1\nHALT\nLOAD R0, 99');
  const afterHalt = sim.stepInstruction();
  eq({ id: 'T13', name: 'HALT stops execution; further stepping is a no-op' }, 'LOAD R0,1 / HALT / LOAD R0,99',
    { status: 'halted', R0: 1, stepRefused: true },
    { status: sim.state.status, R0: sim.state.regs.R0, stepRefused: afterHalt.ok === false });
})();

/* ---------- T14–T17: parser validation ---------- */
(function () {
  const p1 = parseProgram('FOO R0', 8);
  truthy({ id: 'T14', name: 'Invalid opcode rejected with line number' }, 'FOO R0',
    p1.ok === false && p1.errors[0].lineNo === 1 && /unknown opcode/.test(p1.errors[0].message),
    'ok=false, error line ' + (p1.errors[0] ? p1.errors[0].lineNo : '?') + ' mentions "unknown opcode"');

  const p2 = parseProgram('ADD R0, R4', 8);
  truthy({ id: 'T15', name: 'Invalid register operand rejected' }, 'ADD R0, R4',
    p2.ok === false && /invalid register "R4"/.test(p2.errors[0].message),
    'ok=false, error mentions invalid register R4');

  const p3 = parseProgram('JMP 5', 8);
  truthy({ id: 'T16', name: 'Out-of-range jump target rejected' }, 'JMP 5 (1-instruction program)',
    p3.ok === false && /out of range/.test(p3.errors[0].message),
    'ok=false, error mentions out of range');

  const p4 = parseProgram('STORE R0, 300', 8);
  truthy({ id: 'T17', name: 'Illegal data-memory address rejected' }, 'STORE R0, 300',
    p4.ok === false && /0 to 255/.test(p4.errors[0].message),
    'ok=false, error mentions valid range 0 to 255');
})();

/* ---------- T18: program without HALT ---------- */
(function () {
  const sim = runProgram('LOAD R0, 1');
  truthy({ id: 'T18', name: 'Program ending without HALT reports an error' }, 'LOAD R0, 1',
    sim.state.status === 'error' && /without HALT/.test(sim.state.error),
    'status=error, message: ' + (sim.state.error || '').slice(0, 70) + '...');
})();

/* ---------- T19: reset ---------- */
(function () {
  const sim = createSimulator({
    programText: 'LOAD R0, 3\nSTORE R0, 50\nHALT',
    width: 8,
    initialRegisters: { R1: 7 }
  });
  sim.runToCompletion();
  const dirty = { R0: sim.state.regs.R0, mem50: sim.state.dataMemory[50], count: sim.state.instructionCount };
  sim.reset();
  const clean = {
    R0: sim.state.regs.R0,
    R1: sim.state.regs.R1,
    mem50: sim.state.dataMemory[50],
    count: sim.state.instructionCount,
    status: sim.state.status,
    flags: sim.state.flags
  };
  eq({ id: 'T19', name: 'Reset restores initial state (regs, memory, flags, counters)' },
    'run then reset',
    { dirtyR0: 3, R0: 0, R1: 7, mem50: 0, count: 0, status: 'idle', flags: { Z: false, N: false, C: false, V: false } },
    { dirtyR0: dirty.R0, R0: clean.R0, R1: clean.R1, mem50: clean.mem50, count: clean.count, status: clean.status, flags: clean.flags });
  // and it can run again to the same result
  sim.runToCompletion();
  eq({ id: 'T19', name: 'After reset the program runs again to the same result' }, 'run again after reset',
    { R0: 3, mem50: 3, status: 'halted' },
    { R0: sim.state.regs.R0, mem50: sim.state.dataMemory[50], status: sim.state.status });
})();

/* ---------- T20: single-step stage by stage ---------- */
(function () {
  const sim = createSimulator({ programText: 'LOAD R0, 10\nHALT', width: 8 });
  sim.stepStage();
  const after1 = sim.state.stage;      // fetch done -> decode fresh
  sim.stepStage();
  const after2 = sim.state.stage;      // decode done -> execute fresh
  sim.stepStage();
  const after3 = { stage: sim.state.stage, cycles: sim.state.completedCycles, R0: sim.state.regs.R0 };
  eq({ id: 'T20', name: 'Step Stage walks Fetch, then Decode, then Execute' }, 'LOAD R0,10 / HALT',
    { after1: 'decode', after2: 'execute', after3: { stage: 'fetch', cycles: 1, R0: 10 } },
    { after1, after2, after3 });
})();

/* ---------- T21: sequential PC advancement ---------- */
(function () {
  const sim = createSimulator({ programText: 'LOAD R0, 1\nLOAD R1, 2\nHALT', width: 8 });
  const pcs = [];
  for (let i = 0; i < 3; i++) {
    sim.stepInstruction();
    pcs.push(sim.state.pc); // PC after each instruction = index of next instruction
  }
  eq({ id: 'T21', name: 'PC advances sequentially (0→1→2→3)' }, 'LOAD / LOAD / HALT',
    { pcs: [1, 2, 3], status: 'halted' }, { pcs, status: sim.state.status });
})();

/* ---------- T22: 8-bit signed overflow ---------- */
(function () {
  const sim = runProgram('LOAD R0, 100\nLOAD R1, 100\nADD R0, R1\nHALT');
  eq({ id: 'T22', name: '8-bit signed overflow: 100 + 100 = 200 (V=1, N=1, C=0)' }, 'LOAD R0,100 / LOAD R1,100 / ADD / HALT',
    { R0: 200, signed: -56, Z: false, N: true, C: false, V: true },
    { R0: sim.state.regs.R0, signed: toSigned(sim.state.regs.R0, 8), Z: sim.state.flags.Z, N: sim.state.flags.N, C: sim.state.flags.C, V: sim.state.flags.V });
})();

/* ---------- T23: 8-bit carry ---------- */
(function () {
  const sim = runProgram('LOAD R0, 200\nLOAD R1, 100\nADD R0, R1\nHALT');
  eq({ id: 'T23', name: '8-bit carry: 200 + 100 wraps to 44 with C=1' }, 'LOAD R0,200 / LOAD R1,100 / ADD / HALT',
    { R0: 44, C: true, V: false },
    { R0: sim.state.regs.R0, C: sim.state.flags.C, V: sim.state.flags.V });
})();

/* ---------- T24: 16-bit mode ---------- */
(function () {
  const sim = runProgram('LOAD R0, 400\nLOAD R1, 400\nADD R0, R1\nHALT', { width: 16 });
  eq({ id: 'T24', name: '16-bit mode: 400 + 400 = 800 without flags' }, 'LOAD R0,400 / LOAD R1,400 / ADD / HALT (16-bit)',
    { R0: 800, C: false, V: false, N: false },
    { R0: sim.state.regs.R0, C: sim.state.flags.C, V: sim.state.flags.V, N: sim.state.flags.N });
})();

/* ---------- T25: unbounded mode ---------- */
(function () {
  const sim = runProgram('LOAD R0, -5\nLOAD R1, 3\nSUB R0, R1\nHALT', { width: 'unbounded' });
  eq({ id: 'T25', name: 'Unbounded mode keeps negative integers' }, 'LOAD R0,-5 / LOAD R1,3 / SUB R0,R1 / HALT (unbounded)',
    { R0: -8, N: true, Z: false },
    { R0: sim.state.regs.R0, N: sim.state.flags.N, Z: sim.state.flags.Z });
})();

/* ---------- T26: infinite loop guard ---------- */
(function () {
  const sim = runProgram('JMP 0');
  truthy({ id: 'T26', name: 'Infinite loop stopped by instruction limit' }, 'JMP 0',
    sim.state.status === 'error' && /Instruction limit exceeded/.test(sim.state.error),
    'status=error, error=' + (sim.state.error || '').slice(0, 60) + '...');
})();

/* ---------- T27: initial PC / registers / memory ---------- */
(function () {
  const sim = createSimulator({
    programText: 'LOAD R0, 1\nMOV R2, R3\nREAD R1, 200\nHALT',
    width: 8,
    initialPC: 1,
    initialRegisters: { R3: 9 },
    initialMemory: { 200: 7 }
  });
  sim.runToCompletion();
  eq({ id: 'T27', name: 'Initial PC / register / memory configuration respected' },
    'initialPC=1, R3=9, M[200]=7',
    { R0: 0, R2: 9, R1: 7, executed: 3 },
    { R0: sim.state.regs.R0, R2: sim.state.regs.R2, R1: sim.state.regs.R1, executed: sim.state.instructionCount });
})();

/* ---------- T28: double-run / stepping while halted ---------- */
(function () {
  const sim = runProgram('LOAD R0, 1\nHALT');
  const second = sim.runToCompletion();
  const step = sim.stepInstruction();
  eq({ id: 'T28', name: 'Running/stepping after HALT is a safe no-op' }, 'run twice, then step',
    { secondRunStillHalted: true, stepRefused: true, executed: 2 },
    { secondRunStillHalted: second.halted === true, stepRefused: step.ok === false, executed: sim.state.instructionCount });
})();

/* ---------- T29: JZ reads real flag state ---------- */
(function () {
  // Z is false at the JZ (LOAD does not update flags), so the jump is not
  // taken and the LOAD R1, 9 that follows is executed.
  const sim = runProgram('LOAD R0, 0\nJZ 3\nLOAD R1, 9\nHALT');
  eq({ id: 'T29', name: 'JZ uses the real flag state (LOAD does not set Z)' },
    'LOAD R0,0 / JZ 3 / LOAD R1,9 / HALT',
    { R1: 9, executed: 4, halted: true },
    { R1: sim.state.regs.R1, executed: sim.state.instructionCount, halted: sim.state.halted });
})();

/* ---------- T30: immediate out of range for width ---------- */
(function () {
  const p = parseProgram('LOAD R0, 300', 8);
  truthy({ id: 'T30', name: 'Immediate out of range for 8-bit rejected' }, 'LOAD R0, 300 (8-bit)',
    p.ok === false && /out of range/.test(p.errors[0].message),
    'ok=false, error mentions out of range');
})();

/* ---------- report ---------- */

function esc(s) { return String(s).replace(/\|/g, '\\|'); }

console.log('CPU Instruction Cycle Simulator — automated test results');
console.log('Run: node tests.js   (tests the real simulator core in script.js)');
console.log('');
console.log('| # | Test | Input | Expected | Actual | Result |');
console.log('|---|------|-------|----------|--------|--------|');
results.forEach(function (r) {
  console.log('| ' + r.id + ' | ' + esc(r.name) + ' | ' + esc(r.input) + ' | ' + esc(r.expected) + ' | ' + esc(r.actual) + ' | ' + (r.pass ? 'PASS' : '**FAIL**') + ' |');
});
console.log('');
console.log('**Total: ' + results.length + ' checks — ' + passed + ' passed, ' + failed + ' failed.**');
if (failed > 0) {
  console.log('');
  console.log('FAILED TESTS:');
  results.filter(r => !r.pass).forEach(r => console.log('  ' + r.id + ' ' + r.name + ' — expected: ' + r.expected + ' | actual: ' + r.actual));
}
process.exit(failed > 0 ? 1 : 0);
