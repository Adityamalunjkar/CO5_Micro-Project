/* =====================================================================
   Interactive CPU Instruction Cycle Simulator — Fetch, Decode, Execute
   Subject : Computer Organization & Architecture (COA) — CO5 Micro Project
   Author  : [Student Name], Sanjivani University, Kopargaon

   File layout:
     PART 1 — CPU core (pure logic, no DOM; also loaded by the Node test runner)
     PART 2 — Browser UI (DOM bindings, rendering, controls)

   The core models a simplified educational CPU:
     - Instruction memory and data memory are kept separate (Harvard style)
       so that instruction fetch is clearly distinguished from data access.
     - PC holds the index (0..N-1) of the next instruction.
     - One instruction cycle = Fetch stage + Decode stage + Execute stage.
     - Fetch advances PC sequentially; jumps overwrite PC during Execute.
   ===================================================================== */

(function (global) {
  'use strict';

  /* ===================================================================
     PART 1 — CPU CORE
     =================================================================== */

  var REG_NAMES = ['R0', 'R1', 'R2', 'R3'];
  var OPCODES = ['LOAD', 'MOV', 'ADD', 'SUB', 'MUL', 'STORE', 'READ', 'JMP', 'JZ', 'CMP', 'HALT'];
  var DATA_MEM_SIZE = 256;          // data memory addresses 0..255
  var MAX_INSTRUCTIONS = 10000;     // safety limit against infinite loops

  var WIDTHS = {
    8:  { bits: 8,  mask: 0xFF,   maxU: 255,    minS: -128,   maxS: 127 },
    16: { bits: 16, mask: 0xFFFF, maxU: 65535,  minS: -32768, maxS: 32767 }
  };

  function widthInfo(width) {
    return WIDTHS[Number(width)] || null; // null => unbounded mode
  }

  /* ---------- two's-complement helpers (fixed-width modes) ---------- */

  function toUnsigned(v, bits) {
    var m = Math.pow(2, bits);
    return ((v % m) + m) % m;
  }

  function toSigned(v, bits) {
    var m = Math.pow(2, bits);
    var half = m / 2;
    v = ((v % m) + m) % m;
    return v >= half ? v - m : v;
  }

  /* ---------- ALU ----------
     Inputs are the stored (unsigned) register representations in
     fixed-width mode, or plain signed integers in unbounded mode.
     Returns { raw, z, n, c, v } where raw is the value to store. */

  function aluCompute(op, a, b, width) {
    var w = widthInfo(width);
    if (!w) { // unbounded: only Z and N are meaningful
      var r;
      if (op === 'ADD') r = a + b;
      else if (op === 'SUB' || op === 'CMP') r = a - b;
      else if (op === 'MUL') r = a * b;
      else r = b; // PASS (LOAD immediate)
      return { raw: r, z: r === 0, n: r < 0, c: false, v: false };
    }
    var bits = w.bits, mask = w.mask;
    var raw, c, v;
    var sA = toSigned(a, bits), sB = toSigned(b, bits), sR;
    if (op === 'ADD') {
      var sum = a + b;                 // a, b unsigned
      raw = sum % (mask + 1);
      c = sum > w.maxU;                // carry out of the MSB
      sR = toSigned(raw, bits);
      v = (sA >= 0 && sB >= 0 && sR < 0) || (sA < 0 && sB < 0 && sR >= 0);
    } else if (op === 'SUB' || op === 'CMP') {
      raw = toUnsigned(a - b, bits);
      c = a >= b;                      // ARM-style: C = 1 when no borrow
      sR = toSigned(raw, bits);
      v = (sA < 0 && sB >= 0 && sR >= 0) || (sA >= 0 && sB < 0 && sR < 0);
    } else if (op === 'MUL') {
      var prodU = a * b;               // unsigned product
      var prodS = sA * sB;             // signed product
      raw = prodU % (mask + 1);
      c = prodU > w.maxU;              // unsigned overflow
      sR = toSigned(raw, bits);
      v = prodS < w.minS || prodS > w.maxS; // signed overflow
    } else { // PASS
      raw = toUnsigned(b, bits);
      sR = toSigned(raw, bits);
      c = false; v = false;
    }
    return { raw: raw, z: raw === 0, n: sR < 0, c: c, v: v };
  }

  /* ---------- instruction parser ----------
     Syntax (one instruction per line, ';' starts a comment):
       LOAD  Rd, imm        LOAD R0, 10
       MOV   Rd, Rs        MOV R1, R0
       ADD   Rd, Rs        ADD R0, R1
       SUB   Rd, Rs        SUB R0, R1
       MUL   Rd, Rs        MUL R0, R1
       STORE Rs, addr      STORE R0, 100
       READ  Rd, addr      READ R0, 100
       JMP   target        JMP 3
       JZ    target        JZ 5
       CMP   Ra, Rb        CMP R0, R1
       HALT
     Returns { ok, instructions, errors }. */

  var OPERAND_COUNT = { LOAD: 2, MOV: 2, ADD: 2, SUB: 2, MUL: 2, STORE: 2, READ: 2, JMP: 1, JZ: 1, CMP: 2, HALT: 0 };

  function parseRegister(tok) {
    if (/^r[0-3]$/i.test(tok)) return tok.toUpperCase();
    return null;
  }

  function parseIntTok(tok) {
    if (/^[+-]?\d+$/.test(tok)) return parseInt(tok, 10);
    return null;
  }

  function immRangeError(width) {
    var w = widthInfo(width);
    if (!w) return 'immediate value out of safe integer range';
    return 'immediate value out of range for ' + w.bits + '-bit mode (allowed ' + w.minS + ' to ' + w.maxU + ')';
  }

  function immInRange(v, width) {
    var w = widthInfo(width);
    if (!w) return Math.abs(v) <= Number.MAX_SAFE_INTEGER;
    return v >= w.minS && v <= w.maxU;
  }

  function parseProgram(text, width) {
    var instructions = [];
    var errors = [];
    var lines = String(text).split(/\r?\n/);

    lines.forEach(function (line, i) {
      var lineNo = i + 1;
      var code = line.split(';')[0].trim();
      if (code === '') return;
      var parts = code.split(/[,\s]+/).filter(Boolean);
      var op = parts[0].toUpperCase();
      if (OPCODES.indexOf(op) === -1) {
        errors.push({ lineNo: lineNo, message: 'unknown opcode "' + parts[0] + '". Valid opcodes: ' + OPCODES.join(', ') });
        return;
      }
      var args = parts.slice(1);
      if (args.length !== OPERAND_COUNT[op]) {
        errors.push({ lineNo: lineNo, message: op + ' expects ' + OPERAND_COUNT[op] + ' operand' + (OPERAND_COUNT[op] === 1 ? '' : 's') + ', got ' + args.length + ' ("' + code + '")' });
        return;
      }
      var parsed = { op: op, args: [] };
      var ok = true;
      args.forEach(function (tok, argIdx) {
        if (ok === false) return;
        var what = operandRole(op, argIdx);
        if (what === 'reg') {
          var r = parseRegister(tok);
          if (!r) { errors.push({ lineNo: lineNo, message: 'invalid register "' + tok + '" for ' + op + '. Valid registers: R0, R1, R2, R3' }); ok = false; return; }
          parsed.args.push(r);
        } else if (what === 'imm') {
          var v = parseIntTok(tok);
          if (v === null) { errors.push({ lineNo: lineNo, message: 'invalid immediate "' + tok + '" — expected an integer' }); ok = false; return; }
          if (!immInRange(v, width)) { errors.push({ lineNo: lineNo, message: immRangeError(width) + ': ' + v }); ok = false; return; }
          parsed.args.push(v);
        } else if (what === 'addr') {
          var a = parseIntTok(tok);
          if (a === null || a < 0 || a > DATA_MEM_SIZE - 1) { errors.push({ lineNo: lineNo, message: 'invalid data-memory address "' + tok + '" — use an integer from 0 to ' + (DATA_MEM_SIZE - 1) }); ok = false; return; }
          parsed.args.push(a);
        } else if (what === 'target') {
          var t = parseIntTok(tok);
          if (t === null || t < 0) { errors.push({ lineNo: lineNo, message: 'invalid jump target "' + tok + '" — expected a non-negative integer' }); ok = false; return; }
          parsed.args.push(t); // upper bound checked once the program length is known
        }
      });
      if (!ok) return;
      parsed.lineNo = lineNo;
      parsed.index = instructions.length;
      parsed.text = op + (parsed.args.length ? ' ' + parsed.args.join(', ') : '');
      instructions.push(parsed);
    });

    // jump targets can only be validated after the whole program is known
    instructions.forEach(function (ins) {
      if (ins.op === 'JMP' || ins.op === 'JZ') {
        var t = ins.args[0];
        if (t >= instructions.length) {
          errors.push({ lineNo: ins.lineNo, message: ins.op + ' target ' + t + ' is out of range — the program has ' + instructions.length + ' instruction' + (instructions.length === 1 ? '' : 's') + ' (valid targets 0 to ' + (instructions.length - 1) + ')' });
        }
      }
    });

    if (instructions.length === 0 && errors.length === 0) {
      errors.push({ lineNo: 0, message: 'program is empty — add at least one instruction (e.g. HALT)' });
    }
    return { ok: errors.length === 0, instructions: instructions, errors: errors };
  }

  function operandRole(op, argIdx) {
    switch (op) {
      case 'LOAD': return argIdx === 0 ? 'reg' : 'imm';
      case 'MOV': case 'ADD': case 'SUB': case 'MUL': case 'CMP': return 'reg';
      case 'STORE': return argIdx === 0 ? 'reg' : 'addr';
      case 'READ': return argIdx === 0 ? 'reg' : 'addr';
      case 'JMP': case 'JZ': return 'target';
      default: return null; // HALT
    }
  }

  /* ---------- decode table (drives the Decode panel) ---------- */

  var DECODE_TABLE = {
    LOAD:  { kind: 'load',  fmt: 'LOAD Rd, imm',  desc: 'Load the immediate value into the destination register',          components: ['Rd', 'ALU (pass-through)', 'internal bus'], signals: ['ALU_op=PASS(imm)', 'RegWrite[Rd]'] },
    MOV:   { kind: 'mov',   fmt: 'MOV Rd, Rs',    desc: 'Copy the value of the source register into the destination register', components: ['Rs', 'Rd', 'internal bus'],            signals: ['RegRead[Rs]', 'RegWrite[Rd]'] },
    ADD:   { kind: 'alu',   fmt: 'ADD Rd, Rs',    desc: 'Add Rs to Rd and store the result in Rd',                          components: ['Rd', 'Rs', 'ALU', 'flags'],            signals: ['RegRead[Rd]', 'RegRead[Rs]', 'ALU_op=ADD', 'RegWrite[Rd]', 'FlagWrite'] },
    SUB:   { kind: 'alu',   fmt: 'SUB Rd, Rs',    desc: 'Subtract Rs from Rd and store the result in Rd',                   components: ['Rd', 'Rs', 'ALU', 'flags'],            signals: ['RegRead[Rd]', 'RegRead[Rs]', 'ALU_op=SUB', 'RegWrite[Rd]', 'FlagWrite'] },
    MUL:   { kind: 'alu',   fmt: 'MUL Rd, Rs',    desc: 'Multiply Rd by Rs and store the result in Rd',                     components: ['Rd', 'Rs', 'ALU', 'flags'],            signals: ['RegRead[Rd]', 'RegRead[Rs]', 'ALU_op=MUL', 'RegWrite[Rd]', 'FlagWrite'] },
    CMP:   { kind: 'alu',   fmt: 'CMP Ra, Rb',    desc: 'Compare Ra with Rb (Ra − Rb) and update the flags; result discarded', components: ['Ra', 'Rb', 'ALU', 'flags'],          signals: ['RegRead[Ra]', 'RegRead[Rb]', 'ALU_op=SUB', 'FlagWrite'] },
    STORE: { kind: 'store', fmt: 'STORE Rs, addr', desc: 'Store the value of Rs into data memory at address addr',           components: ['Rs', 'MAR', 'MDR', 'data memory'],     signals: ['RegRead[Rs]', 'MAR_in', 'MDR_in', 'DMemWrite'] },
    READ:  { kind: 'read',  fmt: 'READ Rd, addr', desc: 'Read the value at data-memory address addr into Rd',               components: ['MAR', 'MDR', 'Rd', 'data memory'],     signals: ['MAR_in', 'DMemRead', 'MDR_out', 'RegWrite[Rd]'] },
    JMP:   { kind: 'jump',  fmt: 'JMP target',    desc: 'Jump unconditionally: load target into the Program Counter',       components: ['Control Unit', 'PC'],                  signals: ['PC_in (from Control Unit)'] },
    JZ:    { kind: 'jump',  fmt: 'JZ target',     desc: 'Jump to target only if the Zero flag is set (Z = 1)',              components: ['Control Unit', 'PC', 'flags'],         signals: ['PC_in (conditional, if Z = 1)'] },
    HALT:  { kind: 'halt',  fmt: 'HALT',          desc: 'Stop program execution',                                          components: ['Control Unit'],                        signals: ['Stop'] }
  };

  function decodeInstruction(ins) {
    var meta = DECODE_TABLE[ins.op];
    return {
      op: ins.op,
      operandText: ins.args.join(', '),
      format: meta.fmt,
      description: meta.desc,
      components: meta.components,
      signals: meta.signals,
      kind: meta.kind
    };
  }

  /* ---------- simulator factory ---------- */

  function createSimulator(config) {
    config = config || {};
    var cfg = {
      programText: config.programText || '',
      width: config.width || 8,
      initialPC: config.initialPC != null ? config.initialPC : 0,
      initialRegisters: config.initialRegisters || {},
      initialMemory: config.initialMemory || {},
      maxInstructions: config.maxInstructions || MAX_INSTRUCTIONS
    };

    var parseResult = parseProgram(cfg.programText, cfg.width);
    var configErrors = [];
    var program = parseResult.instructions;

    if (parseResult.ok) {
      if (!Number.isInteger(cfg.initialPC) || cfg.initialPC < 0 || cfg.initialPC >= program.length) {
        configErrors.push('Initial PC ' + cfg.initialPC + ' is out of range — the program has ' + program.length + ' instructions (valid PC: 0 to ' + (program.length - 1) + ').');
      }
      REG_NAMES.forEach(function (r) {
        var v = cfg.initialRegisters[r] || 0;
        if (!Number.isInteger(v) || !immInRange(v, cfg.width)) {
          configErrors.push('Initial value of ' + r + ' (' + v + ') is out of range for the selected arithmetic width.');
        }
      });
      Object.keys(cfg.initialMemory).forEach(function (addr) {
        var a = Number(addr);
        var v = cfg.initialMemory[addr];
        if (!Number.isInteger(a) || a < 0 || a > DATA_MEM_SIZE - 1) {
          configErrors.push('Initial memory address ' + a + ' is invalid (valid: 0 to ' + (DATA_MEM_SIZE - 1) + ').');
        } else if (!Number.isInteger(v) || !immInRange(v, cfg.width)) {
          configErrors.push('Initial memory value at address ' + a + ' (' + v + ') is out of range for the selected arithmetic width.');
        }
      });
    }

    var state = null;
    function initState() {
      var w = widthInfo(cfg.width);
      var regs = {};
      REG_NAMES.forEach(function (r) {
        var v = cfg.initialRegisters[r] || 0;
        regs[r] = w ? toUnsigned(v, w.bits) : v;
      });
      var mem = new Array(DATA_MEM_SIZE).fill(0);
      Object.keys(cfg.initialMemory).forEach(function (addr) {
        var a = Number(addr);
        var v = cfg.initialMemory[addr];
        mem[a] = w ? toUnsigned(v, w.bits) : v;
      });
      state = {
        status: 'idle',            // idle | in-progress | halted | error | invalid-program
        stage: null,               // null | 'fetch' | 'decode' | 'execute'
        stageFresh: true,          // true right after a stage boundary (no micro-step run yet)
        microQueue: [],
        microTotal: 0,
        currentInstrIndex: null,
        pc: cfg.initialPC,
        ir: null,
        mar: null,
        marContext: null,          // 'instruction index' | 'data address'
        mdr: null,
        mdrKind: null,             // 'instr' | 'data'
        regs: regs,
        flags: { Z: false, N: false, C: false, V: false },
        dataMemory: mem,
        completedCycles: 0,
        instructionCount: 0,
        halted: false,
        error: null,
        decode: null,
        alu: null,                 // { a, b, op, result, flags, note } last ALU activity
        log: [],
        memoryWrites: [],          // { addr, value, cycle }
        memoryReads: [],           // { addr, value, cycle }
        lastHighlight: null,
        program: program
      };
    }
    initState();

    var sim = {
      config: cfg,
      parseResult: parseResult,
      configErrors: configErrors,
      state: state
    };

    /* ----- logging ----- */

    function pushLog(text, type, stage) {
      state.log.push({
        cycle: state.completedCycles + 1,
        stage: stage || state.stage,
        text: text,
        type: type || 'info'
      });
    }

    /* ----- helpers ----- */

    function regGet(r) { return state.regs[r]; }
    function regSet(r, v) { state.regs[r] = v; }
    function fmtVal(v) { return String(v); }

    function fail(msg) {
      state.error = msg;
      pushLog(msg, 'error');
    }

    /* ----- stage builders -----
       Each stage is a queue of micro-operations. A micro-op is
       { label, run } where run() mutates state and returns a highlight
       object for the UI: { path, touched: [component names] }. */

    function buildFetch() {
      var ops = [];
      ops.push({
        label: 'Fetch: PC holds the address of the next instruction (PC = ' + state.pc + ')',
        run: function () { return { path: 'fetch', touched: ['PC'] }; }
      });
      ops.push({
        label: 'Fetch: MAR ← PC (' + state.pc + ')',
        run: function () {
          state.mar = state.pc;
          state.marContext = 'instruction index';
          return { path: 'fetch', touched: ['PC', 'MAR'] };
        }
      });
      ops.push({
        label: 'Fetch: MDR ← InstructionMemory[' + state.pc + '] (instruction read)',
        run: function () {
          var idx = state.mar;
          if (idx === null || idx < 0 || idx >= state.program.length) {
            fail('Fetch failed: PC = ' + idx + ' is outside the program (0 to ' + (state.program.length - 1) + ') — the program ended without HALT.');
            return { path: 'fetch', touched: ['PC', 'MAR', 'IMEM'] };
          }
          state.currentInstrIndex = idx;
          state.mdr = state.program[idx].text;
          state.mdrKind = 'instr';
          return { path: 'fetch', touched: ['MAR', 'MDR', 'IMEM'] };
        }
      });
      ops.push({
        label: function () { return 'Fetch: IR ← MDR ("' + state.mdr + '")'; },
        run: function () {
          state.ir = state.mdr;
          return { path: 'fetch', touched: ['MDR', 'IR'] };
        }
      });
      ops.push({
        label: function () { return 'Fetch: PC ← PC + 1 (now ' + state.pc + ') — sequential advance; a jump may overwrite it during Execute'; },
        run: function () {
          state.pc = state.pc + 1;
          return { path: 'fetch', touched: ['PC'] };
        }
      });
      return ops;
    }

    function currentInstruction() {
      return state.currentInstrIndex !== null ? state.program[state.currentInstrIndex] : null;
    }

    function buildDecode() {
      var ops = [];
      ops.push({
        label: 'Decode: Control Unit reads the IR and extracts the opcode and operands',
        run: function () {
          var ins = currentInstruction();
          state.decode = ins ? decodeInstruction(ins) : null;
          var d = state.decode;
          return {
            path: 'decode',
            touched: ['IR', 'CU'],
            detail: d ? 'opcode = ' + d.op + ', operands = [' + d.operandText + ']' : ''
          };
        }
      });
      ops.push({
        label: 'Decode: Control Unit generates the control signals for the operation',
        run: function () {
          var d = state.decode;
          return {
            path: 'decode',
            touched: ['CU'],
            detail: d ? d.signals.join(', ') : ''
          };
        }
      });
      return ops;
    }

    function aluMicroOps(ins) {
      var ops = [];
      var dst = ins.args[0], src = ins.args[1];
      var isCmp = ins.op === 'CMP';
      var pendingResult = null;
      ops.push({
        label: function () {
          return 'Execute: ALU inputs loaded — A ← ' + dst + ' (' + fmtVal(regGet(dst)) + '), B ← ' + src + ' (' + fmtVal(regGet(src)) + ')';
        },
        run: function () {
          return { path: 'alu', touched: [dst, src, 'ALU'] };
        }
      });
      ops.push({
        label: '',
        run: function () {
          var a = regGet(dst), b = regGet(src);
          var res = aluCompute(ins.op, a, b, cfg.width);
          pendingResult = res.raw;
          var sym = ins.op === 'ADD' ? '+' : (ins.op === 'SUB' || ins.op === 'CMP') ? '−' : '×';
          state.alu = {
            a: a, b: b,
            op: ins.op === 'CMP' ? 'SUB (compare)' : ins.op,
            result: res.raw,
            flags: { Z: res.z, N: res.n, C: res.c, V: res.v },
            note: isCmp ? 'result discarded — only the flags are kept' : 'result written back to ' + dst
          };
          state.flags = { Z: res.z, N: res.n, C: res.c, V: res.v };
          var label = 'Execute: ALU computes ' + a + ' ' + sym + ' ' + b + ' = ' + res.raw +
            '  → flags Z=' + (res.z ? 1 : 0) + ' N=' + (res.n ? 1 : 0) +
            (widthInfo(cfg.width) ? ' C=' + (res.c ? 1 : 0) + ' V=' + (res.v ? 1 : 0) : '');
          if (isCmp) label += ' (comparison — result discarded)';
          pushLog(label, 'info', 'execute');
          return { path: 'alu', touched: ['ALU', 'FLAGS'] };
        }
      });
      if (!isCmp) {
        ops.push({
          label: function () { return 'Execute: ' + dst + ' ← ALU result (' + fmtVal(pendingResult) + ') — write-back'; },
          run: function () {
            regSet(dst, pendingResult);
            return { path: 'alu', touched: [dst, 'ALU'] };
          }
        });
      }
      return ops;
    }

    function buildExecute() {
      var ins = currentInstruction();
      if (!ins) {
        return [{
          label: 'Execute: no instruction available',
          run: function () { fail('Internal error: nothing to execute.'); return { path: 'halt', touched: [] }; }
        }];
      }
      var ops = [];
      switch (ins.op) {
        case 'LOAD':
          (function () {
            var rd = ins.args[0], imm = ins.args[1];
            ops.push({
              label: 'Execute: immediate value ' + imm + ' placed on the internal bus (ALU pass-through)',
              run: function () {
                state.alu = { a: null, b: imm, op: 'PASS', result: imm, flags: null, note: 'no arithmetic — the immediate passes straight to ' + rd };
                return { path: 'load', touched: ['ALU', rd] };
              }
            });
            ops.push({
              label: 'Execute: ' + rd + ' ← ' + imm + ' (RegWrite)',
              run: function () {
                var w = widthInfo(cfg.width);
                regSet(rd, w ? toUnsigned(imm, w.bits) : imm);
                return { path: 'load', touched: [rd] };
              }
            });
          })();
          break;

        case 'MOV':
          (function () {
            var rd = ins.args[0], rs = ins.args[1];
            ops.push({
              label: 'Execute: internal bus ← ' + rs + ' (' + fmtVal(regGet(rs)) + ')',
              run: function () { return { path: 'mov', touched: [rs] }; }
            });
            ops.push({
              label: function () { return 'Execute: ' + rd + ' ← ' + rs + ' (' + fmtVal(regGet(rs)) + ') — value copied'; },
              run: function () {
                regSet(rd, regGet(rs));
                return { path: 'mov', touched: [rd, rs] };
              }
            });
          })();
          break;

        case 'ADD': case 'SUB': case 'MUL': case 'CMP':
          ops = ops.concat(aluMicroOps(ins));
          break;

        case 'STORE':
          (function () {
            var rs = ins.args[0], addr = ins.args[1];
            ops.push({
              label: 'Execute: MAR ← ' + addr + ' (data address)',
              run: function () {
                state.mar = addr;
                state.marContext = 'data address';
                return { path: 'store', touched: ['MAR'] };
              }
            });
            ops.push({
              label: 'Execute: MDR ← ' + rs + ' (' + fmtVal(regGet(rs)) + ')',
              run: function () {
                state.mdr = regGet(rs);
                state.mdrKind = 'data';
                return { path: 'store', touched: [rs, 'MDR'] };
              }
            });
            ops.push({
              label: function () { return 'Execute: DataMemory[' + addr + '] ← MDR (' + fmtVal(state.mdr) + ')  [MemWrite]'; },
              run: function () {
                state.dataMemory[addr] = state.mdr;
                state.memoryWrites.push({ addr: addr, value: state.mdr, cycle: state.completedCycles + 1 });
                return { path: 'store', touched: ['MDR', 'DMEM', 'MEM:' + addr], memAddr: addr, memAccess: 'write' };
              }
            });
          })();
          break;

        case 'READ':
          (function () {
            var rd = ins.args[0], addr = ins.args[1];
            ops.push({
              label: 'Execute: MAR ← ' + addr + ' (data address)',
              run: function () {
                state.mar = addr;
                state.marContext = 'data address';
                return { path: 'read', touched: ['MAR'] };
              }
            });
            ops.push({
              label: 'Execute: MDR ← DataMemory[' + addr + '] (' + fmtVal(state.dataMemory[addr]) + ')  [MemRead]',
              run: function () {
                state.mdr = state.dataMemory[addr];
                state.mdrKind = 'data';
                state.memoryReads.push({ addr: addr, value: state.mdr, cycle: state.completedCycles + 1 });
                return { path: 'read', touched: ['MAR', 'MDR', 'DMEM', 'MEM:' + addr], memAddr: addr, memAccess: 'read' };
              }
            });
            ops.push({
              label: function () { return 'Execute: ' + rd + ' ← MDR (' + fmtVal(state.mdr) + ')'; },
              run: function () {
                regSet(rd, state.mdr);
                return { path: 'read', touched: [rd, 'MDR'] };
              }
            });
          })();
          break;

        case 'JMP':
          (function () {
            var t = ins.args[0];
            ops.push({
              label: 'Execute: PC ← ' + t + ' (unconditional jump)',
              run: function () {
                state.pc = t;
                return { path: 'jump', touched: ['PC', 'CU'] };
              }
            });
          })();
          break;

        case 'JZ':
          (function () {
            var t = ins.args[0];
            ops.push({
              label: 'Execute: checking Zero flag — Z = ' + (state.flags.Z ? '1' : '0') + ' → jump ' + (state.flags.Z ? 'TAKEN' : 'NOT taken') + (state.flags.Z ? ': PC ← ' + t : ': PC unchanged') + '. Why: JZ jumps only when Z = 1.',
              run: function () {
                if (state.flags.Z) state.pc = t;
                return { path: 'jump', touched: ['PC', 'CU', 'FLAGS'] };
              }
            });
          })();
          break;

        case 'HALT':
          ops.push({
            label: function () {
              return 'Execute: HALT — stopping program execution after ' + (state.instructionCount + 1) + ' instruction(s)';
            },
            run: function () {
              state.halted = true;
              return { path: 'halt', touched: ['CU'] };
            }
          });
          break;
      }
      return ops;
    }

    /* ----- stage machine ----- */

    function enterStage(stage) {
      state.stage = stage;
      state.stageFresh = true;
      state.microQueue = stage === 'fetch' ? buildFetch()
        : stage === 'decode' ? buildDecode()
        : buildExecute();
      state.microTotal = state.microQueue.length;
    }

    function advanceStage() {
      if (state.stage === 'fetch') enterStage('decode');
      else if (state.stage === 'decode') enterStage('execute');
      else {
        // the Execute stage finished: one instruction cycle is complete
        state.instructionCount += 1;
        state.completedCycles += 1;
        if (state.instructionCount >= cfg.maxInstructions) {
          state.error = 'Instruction limit exceeded (' + cfg.maxInstructions + ' instructions) — the program looks like an infinite loop.';
          pushLog(state.error, 'error');
          state.microQueue = [];
          state.stage = null;
          state.status = 'error';
          return;
        }
        enterStage('fetch'); // next instruction begins on the next step
      }
    }

    function stepMicro() {
      if (state.status === 'invalid-program') return { ok: false, reason: 'invalid-program' };
      if (state.halted) return { ok: false, reason: 'halted' };
      if (state.error) return { ok: false, reason: 'error' };
      if (!state.stage) {
        state.status = 'in-progress';
        enterStage('fetch');
      }
      var op = state.microQueue.shift();
      state.stageFresh = false;
      var hl = op.run() || {};
      var labelText = typeof op.label === 'function' ? op.label() : op.label;
      if (labelText) pushLog(labelText, 'info');
      state.lastHighlight = hl;
      if (state.error) {
        state.microQueue = [];
        state.stage = null;
        state.status = 'error';
        return { ok: true, stopped: 'error' };
      }
      if (state.halted) {
        // HALT completes its own instruction cycle before stopping
        state.instructionCount += 1;
        state.completedCycles += 1;
        state.microQueue = [];
        state.status = 'halted';
        return { ok: true, stopped: 'halted' };
      }
      if (state.microQueue.length === 0) advanceStage();
      return { ok: true };
    }

    function stepStage() {
      if (state.status === 'invalid-program') return { ok: false, reason: 'invalid-program' };
      if (state.halted) return { ok: false, reason: 'halted' };
      if (state.error) return { ok: false, reason: 'error' };
      var r;
      do {
        r = stepMicro();
        if (!r.ok) return r;
      } while (!state.stageFresh && !state.halted && !state.error);
      return { ok: true };
    }

    function stepInstruction() {
      if (state.status === 'invalid-program') return { ok: false, reason: 'invalid-program' };
      if (state.halted) return { ok: false, reason: 'halted' };
      if (state.error) return { ok: false, reason: 'error' };
      var r;
      do {
        r = stepMicro();
        if (!r.ok) return r;
      } while (!(state.stage === 'fetch' && state.stageFresh) && !state.halted && !state.error);
      return { ok: true };
    }

    function runToCompletion() {
      var guard = 0;
      while (!state.halted && !state.error && state.status !== 'invalid-program') {
        var r = stepInstruction();
        if (!r.ok) break;
        if (++guard > cfg.maxInstructions * 4) break; // defensive: never hang the host
      }
      return { halted: state.halted, error: state.error };
    }

    function reset() {
      initState();
      pushLog('CPU reset — initial state restored.', 'info', null);
      sim.state = state; // initState() rebuilds the state object; keep the public reference in sync
    }

    function clearLog() {
      state.log = [];
    }

    if (parseResult.ok && configErrors.length === 0) {
      sim.stepMicro = stepMicro;
      sim.stepStage = stepStage;
      sim.stepInstruction = stepInstruction;
      sim.runToCompletion = runToCompletion;
      sim.reset = reset;
      sim.clearLog = clearLog;
    } else {
      state.status = 'invalid-program';
      if (configErrors.length) state.error = configErrors[0];
      sim.reset = function () {
        reset();
        state.status = 'invalid-program';
        if (configErrors.length) state.error = configErrors[0];
        sim.state = state;
      };
      sim.clearLog = clearLog;
    }

    return sim;
  }

  /* ---------- sample programs ---------- */

  var SAMPLE_PROGRAMS = [
    {
      id: 'basic',
      name: 'Sample 1 — Load, Add, Store (required example)',
      text: 'LOAD R0, 10\nLOAD R1, 5\nADD R0, R1\nSTORE R0, 100\nREAD R2, 100\nHALT',
      note: 'R0 = 10 + 5 = 15, stored at address 100 and read back into R2.'
    },
    {
      id: 'arith',
      name: 'Sample 2 — Subtraction and Multiplication',
      text: 'LOAD R0, 40\nLOAD R1, 25\nSUB R0, R1\nSTORE R0, 101\nLOAD R2, 7\nLOAD R3, 6\nMUL R2, R3\nSTORE R2, 102\nHALT',
      note: 'R0 = 40 − 25 = 15 (address 101); R2 = 7 × 6 = 42 (address 102).'
    },
    {
      id: 'compare',
      name: 'Sample 3 — Compare and Conditional Jump (not taken)',
      text: 'LOAD R0, 10\nLOAD R1, 20\nCMP R0, R1\nJZ 6\nLOAD R2, 1\nJMP 7\nLOAD R2, 2\nHALT',
      note: '10 ≠ 20 so Z = 0: the JZ is NOT taken and R2 ends as 1.'
    },
    {
      id: 'loop',
      name: 'Sample 4 — Countdown Loop (JZ taken)',
      text: 'LOAD R0, 5\nLOAD R1, 1\nLOAD R2, 0\nSUB R0, R1\nSTORE R0, 110\nCMP R0, R2\nJZ 9\nJMP 3\nLOAD R3, 99\nHALT',
      note: 'Counts R0 down from 5 to 0; when R0 = 0 the JZ jumps straight to HALT.'
    },
    {
      id: 'overflow',
      name: 'Sample 5 — 8-bit Overflow and Flags',
      text: 'LOAD R0, 100\nLOAD R1, 100\nADD R0, R1\nSTORE R0, 120\nHALT',
      note: '100 + 100 = 200: fits in 8 bits unsigned (C = 0) but overflows signed (V = 1, N = 1).'
    }
  ];

  /* ---------- exports ---------- */

  var api = {
    REG_NAMES: REG_NAMES,
    OPCODES: OPCODES,
    DATA_MEM_SIZE: DATA_MEM_SIZE,
    MAX_INSTRUCTIONS: MAX_INSTRUCTIONS,
    WIDTHS: WIDTHS,
    DECODE_TABLE: DECODE_TABLE,
    SAMPLE_PROGRAMS: SAMPLE_PROGRAMS,
    parseProgram: parseProgram,
    createSimulator: createSimulator,
    aluCompute: aluCompute,
    toUnsigned: toUnsigned,
    toSigned: toSigned,
    widthInfo: widthInfo
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  global.CpuSim = api;

  /* ===================================================================
     PART 2 — BROWSER UI
     =================================================================== */

  if (typeof document === 'undefined') return; // running under Node (tests)

  /* ---------- element helpers ---------- */

  function $(id) { return document.getElementById(id); }

  var els = {};
  var uiState = {
    running: false,
    timer: null,
    speedIdx: 1,               // index into SPEEDS
    editing: false,
    renderedLog: 0,
    memCellEls: [],            // 256 cell elements
    memLast: new Array(DATA_MEM_SIZE).fill(null),
    currentProgramText: SAMPLE_PROGRAMS[0].text
  };

  var SPEEDS = [
    { label: 'Slow', delay: 1400, batch: 1 },
    { label: 'Medium', delay: 650, batch: 1 },
    { label: 'Fast', delay: 280, batch: 1 },
    { label: 'Very fast', delay: 90, batch: 1 },
    { label: 'Turbo', delay: 0, batch: 150 } // instructions per tick
  ];

  var sim = null; // active simulator instance

  /* ---------- configuration panel ---------- */

  function readConfigFromPanel() {
    var width = $('cfg-width').value === 'unbounded' ? 'unbounded' : Number($('cfg-width').value);
    var regs = {};
    REG_NAMES.forEach(function (r) {
      var raw = $('cfg-' + r.toLowerCase()).value.trim();
      regs[r] = raw === '' ? 0 : Number(raw);
    });
    var mem = {};
    var memText = $('cfg-mem').value || '';
    memText.split(/\r?\n/).forEach(function (line) {
      var m = line.match(/^\s*(\d+)\s*[=,: ]\s*([+-]?\d+)\s*$/);
      if (m) mem[Number(m[1])] = Number(m[2]);
    });
    var pcRaw = $('cfg-pc').value.trim();
    return {
      programText: uiState.currentProgramText,
      width: width,
      initialPC: pcRaw === '' ? 0 : Number(pcRaw),
      initialRegisters: regs,
      initialMemory: mem
    };
  }

  function applyProgramAndConfig() {
    if (uiState.editing) {
      uiState.currentProgramText = $('program-editor').value;
    }
    var cfg = readConfigFromPanel();
    sim = createSimulator(cfg);
    uiState.renderedLog = 0;
    $('log').innerHTML = '';
    uiState.memLast = new Array(DATA_MEM_SIZE).fill(null);
    if (!sim.parseResult.ok) {
      showProgramErrors(sim.parseResult.errors);
      setConfigErrors([]);
    } else if (sim.configErrors.length) {
      showProgramErrors([]);
      setConfigErrors(sim.configErrors);
    } else {
      showProgramErrors([]);
      setConfigErrors([]);
    }
    renderAll(true);
    setStatusPill();
  }

  function showProgramErrors(errors) {
    var box = $('program-errors');
    if (!errors.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = '<strong>Program not loaded — fix these errors:</strong><ul>' +
      errors.map(function (e) {
        return '<li>' + (e.lineNo ? 'Line ' + e.lineNo + ': ' : '') + escapeHtml(e.message) + '</li>';
      }).join('') + '</ul>';
  }

  function setConfigErrors(errors) {
    var box = $('cfg-errors');
    if (!errors.length) { box.hidden = true; box.innerHTML = ''; return; }
    box.hidden = false;
    box.innerHTML = '<strong>Configuration not applied:</strong><ul>' +
      errors.map(function (e) { return '<li>' + escapeHtml(e) + '</li>'; }).join('') + '</ul>';
  }

  /* ---------- program view / editor ---------- */

  function renderProgramView() {
    var list = $('program-list');
    list.innerHTML = '';
    var prog = sim && sim.parseResult.ok ? sim.parseResult.instructions : [];
    var activeIdx = activeInstructionIndex();
    prog.forEach(function (ins) {
      var li = document.createElement('li');
      li.className = 'prog-row' + (ins.index === activeIdx ? ' current' : '');
      li.innerHTML = '<span class="prog-idx">' + ins.index + '</span>' +
        '<span class="prog-loc">' + (ins.index === activeIdx ? '◀ PC / executing' : '') + '</span>' +
        '<code>' + escapeHtml(ins.text) + '</code>';
      list.appendChild(li);
    });
    if (!prog.length) {
      list.innerHTML = '<li class="prog-row empty">No valid program loaded.</li>';
    }
  }

  function activeInstructionIndex() {
    if (!sim || !sim.parseResult.ok) return null;
    var s = sim.state;
    // During Fetch (and before the first step) the instruction involved is the one PC points to;
    // during Decode/Execute it is the instruction that was fetched into the IR.
    if (s.stage === 'fetch' || s.stage === null) return s.pc;
    return s.currentInstrIndex;
  }

  /* ---------- registers, flags, IR/MAR/MDR ---------- */

  function fmtReg(v) {
    var w = sim ? widthInfo(sim.config.width) : null;
    if (!w) return { dec: String(v), hex: '—', signed: String(v) };
    return {
      dec: String(v),
      hex: '0x' + v.toString(16).toUpperCase().padStart(w.bits / 4, '0'),
      signed: String(toSigned(v, w.bits))
    };
  }

  function flash(el) {
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('flash');
  }

  function renderRegisters() {
    var s = sim ? sim.state : null;
    var touched = s && s.lastHighlight ? s.lastHighlight.touched || [] : [];
    $('reg-pc').textContent = s ? String(s.pc) : '—';
    $('reg-ir').textContent = s && s.ir ? s.ir : '—';
    $('reg-mar').textContent = s && s.mar !== null ? String(s.mar) : '—';
    $('reg-mar-ctx').textContent = s && s.marContext ? '(' + s.marContext + ')' : '';
    $('reg-mdr').textContent = s && s.mdr !== null ? String(s.mdr) : '—';
    $('reg-mdr-kind').textContent = s && s.mdrKind ? (s.mdrKind === 'instr' ? '(instruction)' : '(data)') : '';
    REG_NAMES.forEach(function (r) {
      var v = s ? s.regs[r] : 0;
      var f = fmtReg(v);
      $('val-' + r.toLowerCase()).textContent = f.dec;
      $('hex-' + r.toLowerCase()).textContent = f.hex;
      $('sgn-' + r.toLowerCase()).textContent = f.signed;
      if (touched.indexOf(r) !== -1) flash($('reg-row-' + r.toLowerCase()));
    });
    var fixed = sim ? !!widthInfo(sim.config.width) : false;
    ['Z', 'N', 'C', 'V'].forEach(function (fl) {
      var el = $('flag-' + fl.toLowerCase());
      var set = s ? s.flags[fl] : false;
      if (!fixed && (fl === 'C' || fl === 'V')) {
        el.textContent = '—';
        el.className = 'flag unset na';
        el.title = 'Carry/overflow flags exist only in fixed-width (8/16-bit) mode';
      } else {
        el.textContent = fl + ' = ' + (set ? 1 : 0);
        el.className = 'flag ' + (set ? 'set' : 'unset');
        el.title = flagDescription(fl);
      }
    });
  }

  function flagDescription(fl) {
    return {
      Z: 'Zero flag: set when the last ALU result was 0',
      N: 'Negative flag: set when the last ALU result was negative (MSB = 1)',
      C: 'Carry flag: set on unsigned carry-out / no-borrow (fixed-width mode)',
      V: 'Overflow flag: set when signed arithmetic overflows (fixed-width mode)'
    }[fl];
  }

  /* ---------- stage indicator ---------- */

  function renderStage() {
    var s = sim ? sim.state : null;
    var stage = s ? s.stage : null;
    ['fetch', 'decode', 'execute'].forEach(function (st) {
      var el = $('stage-' + st);
      el.className = 'stage-badge stage-' + st + (stage === st ? ' active' : '');
    });
    var label = '';
    if (!s || s.status === 'idle') label = 'Ready — press Run, Step Stage or Step Instruction to begin.';
    else if (s.status === 'halted') label = 'HALTED — execution stopped. Press Reset CPU to run again.';
    else if (s.status === 'error') label = 'ERROR — ' + s.error;
    else if (s.status === 'invalid-program') label = 'Program or configuration is invalid — see the editor panel.';
    else if (s.stage) label = microLabel(s);
    $('stage-label').textContent = label;
  }

  function microLabel(s) {
    var done = s.microTotal - s.microQueue.length;
    var total = s.microTotal;
    var stageName = s.stage.charAt(0).toUpperCase() + s.stage.slice(1);
    var hl = s.lastHighlight;
    var last = hl && hl.detail ? hl.detail : '';
    var nextLabel = '';
    if (s.microQueue.length && typeof s.microQueue[0].label === 'string') {
      nextLabel = s.microQueue[0].label.replace(/^\w+:\s*/, '');
    }
    return stageName + ' stage — micro-step ' + Math.max(1, done) + ' of ' + total +
      (last ? ' · ' + last : '') + (nextLabel ? ' · next: ' + nextLabel : '');
  }

  /* ---------- decode / ALU / control-signal panels ---------- */

  function renderDecode() {
    var s = sim ? sim.state : null;
    var d = s ? s.decode : null;
    if (!d) {
      $('decode-opcode').textContent = '—';
      $('decode-operands').textContent = '—';
      $('decode-desc').textContent = 'Decoding happens after the first Fetch stage.';
      $('decode-components').textContent = '—';
      $('signals-list').innerHTML = '<span class="muted">Signals appear here during Decode and Execute.</span>';
      return;
    }
    $('decode-opcode').textContent = d.op + '   (' + d.format + ')';
    $('decode-operands').textContent = d.operandText;
    $('decode-desc').textContent = d.description;
    $('decode-components').textContent = d.components.join(', ');
    var signals = d.signals.slice();
    var executing = s.stage === 'execute';
    $('signals-list').innerHTML = signals.map(function (sig) {
      return '<span class="signal' + (executing ? ' on' : '') + '">' + escapeHtml(sig) + '</span>';
    }).join('');
  }

  function renderAlu() {
    var s = sim ? sim.state : null;
    var alu = s ? s.alu : null;
    if (!alu) {
      $('alu-a').textContent = '—';
      $('alu-op').textContent = 'idle';
      $('alu-b').textContent = '—';
      $('alu-result').textContent = '—';
      $('alu-note').textContent = 'The ALU is used by LOAD, ADD, SUB, MUL and CMP.';
      $('alu-flags').textContent = '';
      return;
    }
    var w = widthInfo(sim.config.width);
    function fmt(v) {
      if (v === null || v === undefined) return '—';
      return w ? String(v) + ' (signed ' + toSigned(v, w.bits) + ')' : String(v);
    }
    $('alu-a').textContent = fmt(alu.a);
    $('alu-op').textContent = alu.op;
    $('alu-b').textContent = fmt(alu.b);
    $('alu-result').textContent = fmt(alu.result);
    $('alu-note').textContent = alu.note || '';
    $('alu-flags').textContent = alu.flags
      ? 'Z=' + (alu.flags.Z ? 1 : 0) + ' N=' + (alu.flags.N ? 1 : 0) + ' C=' + (alu.flags.C ? 1 : 0) + ' V=' + (alu.flags.V ? 1 : 0)
      : 'flags unchanged';
  }

  /* ---------- memory grid ---------- */

  function buildMemoryGrid() {
    var grid = $('mem-grid');
    grid.innerHTML = '';
    uiState.memCellEls = [];
    // column headers 0..15
    var corner = document.createElement('span');
    corner.className = 'mem-head';
    corner.textContent = 'addr';
    grid.appendChild(corner);
    for (var c = 0; c < 16; c++) {
      var h = document.createElement('span');
      h.className = 'mem-head';
      h.textContent = '+' + c.toString(16).toUpperCase();
      grid.appendChild(h);
    }
    for (var r = 0; r < 16; r++) {
      var rh = document.createElement('span');
      rh.className = 'mem-head';
      rh.textContent = (r * 16).toString(16).toUpperCase().padStart(2, '0') + '×';
      grid.appendChild(rh);
      for (var c2 = 0; c2 < 16; c2++) {
        (function (addr) {
          var cell = document.createElement('span');
          cell.className = 'mem-cell';
          cell.title = 'Address ' + addr + ' (0x' + addr.toString(16).toUpperCase().padStart(2, '0') + ')';
          cell.addEventListener('mouseenter', function () {
            var v = sim ? sim.state.dataMemory[addr] : 0;
            $('mem-hover').textContent = 'Address ' + addr + ' (0x' + addr.toString(16).toUpperCase().padStart(2, '0') + ') = ' + v +
              (sim && widthInfo(sim.config.width) ? ' (signed ' + toSigned(v, sim.config.width) + ')' : '');
          });
          grid.appendChild(cell);
          uiState.memCellEls[addr] = cell;
        })(r * 16 + c2);
      }
    }
  }

  function renderMemory() {
    if (!sim) return;
    var s = sim.state;
    var w = widthInfo(sim.config.width);
    var hl = s.lastHighlight;
    for (var addr = 0; addr < DATA_MEM_SIZE; addr++) {
      var cell = uiState.memCellEls[addr];
      var v = s.dataMemory[addr];
      if (uiState.memLast[addr] !== v) {
        cell.textContent = w
          ? v.toString(16).toUpperCase().padStart(2, '0')
          : String(v);
        cell.className = 'mem-cell' + (v !== 0 ? ' nonzero' : '');
        uiState.memLast[addr] = v;
      }
    }
    if (hl && hl.memAddr != null && uiState.memCellEls[hl.memAddr]) {
      var c = uiState.memCellEls[hl.memAddr];
      c.classList.remove('read', 'write');
      void c.offsetWidth;
      c.classList.add(hl.memAccess === 'write' ? 'write' : 'read');
      c.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }

  /* ---------- execution log ---------- */

  function renderLog() {
    if (!sim) return;
    var logEl = $('log');
    var log = sim.state.log;
    var nearBottom = logEl.scrollHeight - logEl.scrollTop - logEl.clientHeight < 60;
    while (uiState.renderedLog < log.length) {
      var e = log[uiState.renderedLog++];
      var div = document.createElement('div');
      div.className = 'log-line log-' + e.type + (e.stage ? ' log-stage-' + e.stage : '');
      div.innerHTML = '<span class="log-cycle">[C' + e.cycle + ']</span>' +
        (e.stage ? '<span class="log-stage">' + e.stage.toUpperCase() + '</span>' : '') +
        '<span class="log-text">' + escapeHtml(e.text) + '</span>';
      logEl.appendChild(div);
    }
    if (nearBottom) logEl.scrollTop = logEl.scrollHeight;
  }

  /* ---------- summary ---------- */

  function renderSummary() {
    var s = sim ? sim.state : null;
    if (!s) return;
    var counts = 'Instructions executed: <strong>' + s.instructionCount + '</strong> · ' +
      'Completed cycles: <strong>' + s.completedCycles + '</strong> · ' +
      'Memory writes: <strong>' + s.memoryWrites.length + '</strong> · Memory reads: <strong>' + s.memoryReads.length + '</strong>';
    $('summary-counts').innerHTML = counts;
    $('summary-regs').innerHTML = REG_NAMES.map(function (r) {
      var f = fmtReg(s.regs[r]);
      return r + ' = <strong>' + f.dec + '</strong>' + (f.hex !== '—' ? ' (' + f.hex + ', signed ' + f.signed + ')' : '');
    }).join(' · ');
    var writes = s.memoryWrites.slice(-12).map(function (w) { return 'M[' + w.addr + '] = ' + w.value; });
    $('summary-mem').innerHTML = writes.length
      ? 'Memory writes: ' + writes.join(', ') + (s.memoryWrites.length > 12 ? ' …' : '')
      : 'Memory writes: none';
    var errEl = $('summary-error');
    if (s.error && s.status !== 'invalid-program') {
      errEl.hidden = false;
      errEl.textContent = 'Error: ' + s.error;
    } else {
      errEl.hidden = true;
    }
  }

  /* ---------- architecture diagram highlighting ---------- */

  var DIAGRAM_PATHS = {
    fetch: ['p-pc-mar', 'p-mar-imem', 'p-imem-mdr', 'p-mdr-ir'],
    decode: ['p-ir-cu'],
    alu: ['p-regs-alu', 'p-alu-regs'],
    load: ['p-alu-regs'],
    mov: ['p-regs-bus', 'p-bus'],
    store: ['p-mdr-dmem', 'p-mar-dmem'],
    read: ['p-mar-dmem', 'p-dmem-mdr'],
    jump: ['p-cu-pc'],
    halt: []
  };
  var DIAGRAM_BOXES = {
    fetch: ['b-pc', 'b-mar', 'b-mdr', 'b-ir', 'b-imem'],
    decode: ['b-ir', 'b-cu'],
    alu: ['b-regs', 'b-alu'],
    load: ['b-alu', 'b-regs'],
    mov: ['b-regs'],
    store: ['b-regs', 'b-mar', 'b-mdr', 'b-dmem'],
    read: ['b-mar', 'b-mdr', 'b-dmem', 'b-regs'],
    jump: ['b-cu', 'b-pc'],
    halt: ['b-cu']
  };
  var DIAGRAM_BOX_MAP = { PC: 'b-pc', MAR: 'b-mar', MDR: 'b-mdr', IR: 'b-ir', CU: 'b-cu', ALU: 'b-alu', REGS: 'b-regs', IMEM: 'b-imem', DMEM: 'b-dmem', FLAGS: 'b-alu' };

  function renderDiagram() {
    var svg = $('diagram');
    if (!svg) return;
    svg.classList.remove('stg-fetch', 'stg-decode', 'stg-execute');
    var activeIds = [];
    var s = sim ? sim.state : null;
    if (s && s.lastHighlight && s.status === 'in-progress') {
      if (s.stage) svg.classList.add('stg-' + s.stage);
      var path = s.lastHighlight.path;
      (DIAGRAM_PATHS[path] || []).forEach(function (id) { activeIds.push(id); });
      (DIAGRAM_BOXES[path] || []).forEach(function (id) { activeIds.push(id); });
      (s.lastHighlight.touched || []).forEach(function (t) {
        var id = DIAGRAM_BOX_MAP[t];
        if (id) activeIds.push(id);
      });
    }
    var all = svg.querySelectorAll('.dpath, .dbox');
    for (var i = 0; i < all.length; i++) all[i].classList.remove('active');
    activeIds.forEach(function (id) {
      var el = svg.querySelector('#' + id);
      if (el) el.classList.add('active');
    });
  }

  /* ---------- status pill + control buttons ---------- */

  function setStatusPill() {
    var pill = $('status-pill');
    var s = sim ? sim.state : null;
    var cls = 'status-pill ', txt = '';
    if (!s || s.status === 'idle') { cls += 'idle'; txt = 'IDLE'; }
    else if (s.status === 'invalid-program') { cls += 'error'; txt = 'INVALID PROGRAM'; }
    else if (s.status === 'halted') { cls += 'halted'; txt = 'HALTED'; }
    else if (s.status === 'error') { cls += 'error'; txt = 'ERROR'; }
    else if (uiState.running) { cls += 'running'; txt = 'RUNNING'; }
    else { cls += 'paused'; txt = 'PAUSED (mid-cycle)'; }
    pill.className = cls;
    pill.textContent = txt;
    updateButtons();
  }

  function terminal() {
    var s = sim ? sim.state : null;
    return !s || s.status === 'halted' || s.status === 'error' || s.status === 'invalid-program';
  }

  function updateButtons() {
    // The Run button is a Run/Pause/Resume toggle: it stays clickable while
    // running (a disabled button could never receive the Pause click).
    $('btn-run').disabled = terminal();
    $('btn-run').textContent = uiState.running ? '⏸ Pause' : '▶ Run';
    $('btn-run').classList.toggle('running', uiState.running);
    var canStep = !terminal() && !uiState.running;
    $('btn-step-instr').disabled = !canStep;
    $('btn-step-stage').disabled = !canStep;
  }

  /* ---------- run loop ---------- */

  function tick() {
    if (!uiState.running || !sim) return;
    var speed = SPEEDS[uiState.speedIdx];
    var r;
    if (speed.batch > 1) {
      for (var i = 0; i < speed.batch; i++) {
        r = sim.stepInstruction();
        if (!r.ok) break;
      }
    } else {
      r = sim.stepStage();
    }
    renderAll();
    if (terminal() || (r && !r.ok)) {
      stopRun();
      return;
    }
    uiState.timer = setTimeout(tick, speed.delay);
  }

  function startRun() {
    if (terminal() || uiState.running || !sim) return;
    uiState.running = true;
    setStatusPill();
    tick();
  }

  function stopRun() {
    uiState.running = false;
    if (uiState.timer) { clearTimeout(uiState.timer); uiState.timer = null; }
    setStatusPill();
  }

  /* ---------- full render ---------- */

  function renderAll() {
    renderProgramView();
    renderRegisters();
    renderStage();
    renderDecode();
    renderAlu();
    renderMemory();
    renderLog();
    renderSummary();
    renderDiagram();
    setStatusPill();
  }

  /* ---------- editor mode ---------- */

  function setEditing(on) {
    uiState.editing = on;
    $('program-view').hidden = on;
    $('program-editor-wrap').hidden = !on;
    $('btn-edit').hidden = on;
    if (on) {
      $('program-editor').value = uiState.currentProgramText;
      $('btn-edit').disabled = true;
    } else {
      $('btn-edit').disabled = false;
    }
  }

  /* ---------- wiring ---------- */

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function init() {
    // sample selector
    var sel = $('sample-select');
    SAMPLE_PROGRAMS.forEach(function (sp) {
      var opt = document.createElement('option');
      opt.value = sp.id;
      opt.textContent = sp.name;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', function () {
      var sp = SAMPLE_PROGRAMS.filter(function (s) { return s.id === sel.value; })[0];
      if (!sp) return;
      stopRun();
      uiState.currentProgramText = sp.text;
      $('sample-note').textContent = sp.note;
      setEditing(false);
      applyProgramAndConfig();
    });

    $('btn-edit').addEventListener('click', function () { stopRun(); setEditing(true); });
    $('btn-cancel-edit').addEventListener('click', function () { setEditing(false); });
    $('btn-apply-program').addEventListener('click', function () {
      stopRun();
      uiState.currentProgramText = $('program-editor').value;
      setEditing(false);
      applyProgramAndConfig();
    });
    $('btn-apply-config').addEventListener('click', function () {
      stopRun();
      applyProgramAndConfig();
    });

    $('btn-run').addEventListener('click', function () {
      if (uiState.running) stopRun();
      else startRun();
    });
    $('btn-step-instr').addEventListener('click', function () {
      if (!sim || terminal()) return;
      sim.stepInstruction();
      renderAll();
    });
    $('btn-step-stage').addEventListener('click', function () {
      if (!sim || terminal()) return;
      sim.stepStage();
      renderAll();
    });
    $('btn-reset').addEventListener('click', function () {
      stopRun();
      if (sim) sim.reset();
      uiState.renderedLog = 0;
      $('log').innerHTML = '';
      uiState.memLast = new Array(DATA_MEM_SIZE).fill(null);
      renderAll(true);
    });
    $('btn-clear-log').addEventListener('click', function () {
      if (sim) sim.clearLog();
      uiState.renderedLog = 0;
      $('log').innerHTML = '';
    });

    var speed = $('speed');
    speed.addEventListener('input', function () {
      uiState.speedIdx = Number(speed.value);
      $('speed-label').textContent = SPEEDS[uiState.speedIdx].label;
    });

    $('cfg-width').addEventListener('change', function () {
      $('width-note').textContent = widthNoteText($('cfg-width').value);
    });

    buildMemoryGrid();
    uiState.currentProgramText = SAMPLE_PROGRAMS[0].text;
    $('sample-note').textContent = SAMPLE_PROGRAMS[0].note;
    $('width-note').textContent = widthNoteText($('cfg-width').value);
    applyProgramAndConfig();
  }

  function widthNoteText(v) {
    if (v === 'unbounded') return 'Unbounded: plain integers, no wrap-around. Only Z and N flags are produced.';
    return v + '-bit: values wrap modulo 2^' + v + ' (two\u2019s complement). Flags Z, N, C, V are produced.';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
