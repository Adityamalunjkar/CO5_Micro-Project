# Interactive CPU Instruction Cycle Simulator — Fetch · Decode · Execute

**Subject:** Computer Organization & Architecture (COA) — CO5 Micro Project
**Student:** [Student Name] · [PRN] · SY Integrated B.Tech CSE, Sanjivani University, Kopargaon
**Technology:** HTML5, CSS3, Vanilla JavaScript — no backend, no database, no dependencies.

An interactive educational simulator that shows how a processor executes a program
one instruction at a time: every instruction cycle is broken into the three classic
stages — **Fetch**, **Decode** and **Execute** — with every register transfer (PC, MAR,
MDR, IR, R0–R3, ALU, flags, memory) shown, logged step by step and highlighted on an
architecture diagram.

## 1. How to run

1. Copy the whole project folder anywhere on your computer.
2. Double-click **`index.html`** — it opens in any modern browser (Chrome, Edge,
   Firefox) and runs entirely locally. No installation, server or internet needed.
3. To run the automated tests you need [Node.js](https://nodejs.org) installed:

   ```
   node tests.js
   ```

   This executes 32 checks against the real simulator core and prints a
   PASS/FAIL table (see `test-cases.md`).

## 2. Files

| File | Purpose |
|---|---|
| `index.html` | Page structure: header, overview, controls, editor, configuration, architecture diagram (SVG), stage indicator, decode/ALU/control-signal panels, registers, data memory, execution log, summary, help section |
| `style.css` | Complete styling — light academic dashboard, stage colour coding (Fetch = blue, Decode = amber, Execute = green), animations |
| `script.js` | **Part 1 — CPU core:** instruction parser, CPU state, fetch/decode/execute micro-step engine, ALU and flags. **Part 2 — browser UI:** rendering, controls, run loop. The core has no DOM code, so the Node test runner uses the exact same logic as the browser |
| `tests.js` | Automated test suite (32 checks) run with `node tests.js` |
| `test-cases.md` | Test plan with input / expected / actual / pass-fail, plus manual browser verification results |
| `project-report.md` | Full project report for submission (all required sections, with placeholders for personal details) |
| `presentation-outline.md` | 5–7 minute demonstration script, slide-by-slide outline and 20+ viva questions with answers |

## 3. Quick start (2 minutes)

1. Open `index.html`. **Sample 1** (the required example) is already loaded.
2. Press **⏱ Step Stage** three times — you will see one complete instruction cycle:
   - **FETCH** — 5 micro-steps: PC → MAR → MDR (instruction memory) → IR → PC+1
   - **DECODE** — the Control Unit extracts the opcode/operands and asserts control signals
   - **EXECUTE** — the operation runs (ALU / memory / PC update)
3. Press **▶ Run** to execute to HALT. The final state must be
   **R0 = 15, R1 = 5, R2 = 15, DataMemory[100] = 15, status = HALTED**.
4. Use **⏭ Step Instruction** for whole instructions, the **speed slider** to slow
   the animation for your demonstration, and **↺ Reset CPU** to start over.
5. Try the other samples: subtraction & multiplication, compare + conditional jump
   (not taken), a countdown loop (JZ taken), and an 8-bit overflow demo.

## 4. Instruction set

| Instruction | Example | Meaning | Flags |
|---|---|---|---|
| `LOAD Rd, imm` | `LOAD R0, 10` | Rd ← immediate | — |
| `MOV Rd, Rs` | `MOV R1, R0` | Rd ← Rs | — |
| `ADD Rd, Rs` | `ADD R0, R1` | Rd ← Rd + Rs | Z N C V |
| `SUB Rd, Rs` | `SUB R0, R1` | Rd ← Rd − Rs | Z N C V |
| `MUL Rd, Rs` | `MUL R0, R1` | Rd ← Rd × Rs | Z N C V |
| `STORE Rs, addr` | `STORE R0, 100` | DataMemory[addr] ← Rs | — |
| `READ Rd, addr` | `READ R0, 100` | Rd ← DataMemory[addr] | — |
| `JMP target` | `JMP 3` | PC ← target | — |
| `JZ target` | `JZ 5` | if Z = 1 then PC ← target | — |
| `CMP Ra, Rb` | `CMP R0, R1` | flags ← Ra − Rb | Z N C V |
| `HALT` | `HALT` | stop execution | — |

Registers: **R0–R3**. Data memory: **256 addresses (0–255)**. Comments start with `;`.
All input is validated with clear, line-numbered error messages — invalid programs
are never executed.

## 5. Customisation

In the **CPU Configuration** panel you can change:

- Arithmetic width — **8-bit** (default), **16-bit** or **unbounded**, with documented
  two's-complement wrap-around and flag (Z, N, C, V) behaviour
- Initial **PC** value (validated against the program length)
- Initial values of **R0–R3**
- Initial **data-memory** contents (`address = value`, one per line)
- The **program** itself (Edit Program) and the **simulation speed**

## 6. Model assumptions (summary)

- Instruction memory and data memory are separate (Harvard style), so instruction
  fetch is never confused with data access.
- PC holds an instruction **index** (0 … N−1); it is incremented during Fetch and
  overwritten by JMP/JZ during Execute.
- One instruction cycle = Fetch + Decode + Execute. A clock cycle in a real CPU is a
  single timing step — several clock cycles form one instruction cycle.
- Flags are updated only by ADD, SUB, MUL and CMP. HALT counts as an executed
  instruction. Execution stops with a clear error after 10,000 instructions
  (infinite-loop guard) and a program that ends without HALT reports an error.

Full details: `project-report.md` and the Help section inside the app.

## 7. Limitations (honest summary)

- Simplified single-cycle educational model: no pipelining, caching, microcode,
  interrupts or I/O.
- 11 instructions, 4 registers, no stack, no indexed addressing, no binary
  machine-code encoding (instructions are stored as decoded objects).
- Control signals are a simplified textual representation for teaching.

## 8. Browser support

Any modern browser (Chrome, Edge, Firefox, Safari). Tested by opening the file
directly from disk (`file://`) — no web server required.
